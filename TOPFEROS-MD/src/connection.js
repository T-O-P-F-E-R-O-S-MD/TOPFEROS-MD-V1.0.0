"use strict";

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const path = require("path");

const sessionManager = require("./sessionManager");
const messageHandler = require("./messageHandler");

const activeSockets = new Map();
const pairingRequests = new Map();

let welcome = null;
let goodbye = null;

/* =====================================
   OPTIONAL HELPERS
===================================== */

try {
  welcome = require("../commands/welcome");
} catch (error) {
  console.warn(
    "⚠️ Welcome helper non chargé:",
    error?.message || error
  );
}

try {
  goodbye = require("../commands/goodbye");
} catch (error) {
  console.warn(
    "⚠️ Goodbye helper non chargé:",
    error?.message || error
  );
}

/* =====================================
   CLEAN PHONE NUMBER
===================================== */

function cleanNumber(number) {
  return String(number || "").replace(/\D/g, "");
}

/* =====================================
   CHECK PHONE NUMBER
===================================== */

function validatePhoneNumber(number) {
  const clean = cleanNumber(number);

  if (!clean) {
    throw new Error(
      "Numéro WhatsApp invalide."
    );
  }

  if (clean.length < 8 || clean.length > 15) {
    throw new Error(
      "Numéro WhatsApp invalide."
    );
  }

  return clean;
}

/* =====================================
   CREATE SOCKET
===================================== */

async function createSocket(sessionId) {
  if (!sessionId) {
    throw new Error(
      "sessionId manquant"
    );
  }

  /*
   * If socket already exists, reuse it.
   * This is important for multi-session.
   */

  if (activeSockets.has(sessionId)) {
    return activeSockets.get(sessionId);
  }

  /* ===================================
     GET SESSION
  =================================== */

  let session =
    sessionManager.getSession(sessionId);

  if (!session) {
    session =
      sessionManager.restoreSession(
        sessionId
      );
  }

  if (!session) {
    throw new Error(
      `Session introuvable: ${sessionId}`
    );
  }

  /* ===================================
     AUTH PATH
  =================================== */

  const authPath = path.join(
    __dirname,
    "..",
    "auth",
    "sessions",
    sessionId
  );

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(
    authPath
  );

  /* ===================================
     BAILEYS VERSION
  =================================== */

  let version;

  try {
    const latest =
      await fetchLatestBaileysVersion();

    if (latest?.version) {
      version = latest.version;
    }
  } catch (error) {
    console.warn(
      "⚠️ Impossible de récupérer la dernière version Baileys."
    );
  }

  /* ===================================
     SOCKET CONFIG
  =================================== */

  const socketConfig = {
    auth: {
      creds: state.creds,

      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino({
          level: "silent"
        })
      )
    },

    logger: pino({
      level: "silent"
    }),

    /*
     * IMPORTANT POUR PAIRING CODE
     *
     * Utilise un browser canonical.
     * Évite les labels personnalisés qui
     * peuvent provoquer un pairing code rejeté.
     */

    browser:
      Browsers.macOS("Desktop"),

    printQRInTerminal: false,

    markOnlineOnConnect: false,

    generateHighQualityLinkPreview: false,

    syncFullHistory: false,

    connectTimeoutMs: 60_000,

    defaultQueryTimeoutMs: 60_000,

    keepAliveIntervalMs: 30_000
  };

  if (version) {
    socketConfig.version =
      version;
  }

  /* ===================================
     CREATE SOCKET
  =================================== */

  const sock =
    makeWASocket(socketConfig);

  activeSockets.set(
    sessionId,
    sock
  );

  sessionManager.setSocket(
    sessionId,
    sock
  );

  sessionManager.updateSession(
    sessionId,
    {
      status: "connecting",
      pairing: false
    }
  );

  /* ===================================
     SAVE CREDENTIALS
  =================================== */

  sock.ev.on(
    "creds.update",
    async (creds) => {
      try {
        await saveCreds(creds);
      } catch (error) {
        console.error(
          `❌ SAVE CREDS ERROR [${sessionId}]`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );

  /* ===================================
     CONNECTION UPDATE
  =================================== */

  sock.ev.on(
    "connection.update",
    async (update) => {
      try {
        const {
          connection,
          lastDisconnect
        } = update;

        /* =============================
           CONNECTED
        ============================= */

        if (connection === "open") {
          console.log(
            `✅ WHATSAPP CONNECTED: ${sessionId}`
          );

          sessionManager.endPairing(
            sessionId
          );

          sessionManager.updateSession(
            sessionId,
            {
              status: "connected",
              pairing: false,
              pairingCode: null
            }
          );

          pairingRequests.delete(
            sessionId
          );

          return;
        }

        /* =============================
           CLOSED
        ============================= */

        if (connection === "close") {
          activeSockets.delete(
            sessionId
          );

          sessionManager.setSocket(
            sessionId,
            null
          );

          pairingRequests.delete(
            sessionId
          );

          const statusCode =
            lastDisconnect?.error
              ?.output?.statusCode ??
            lastDisconnect?.error
              ?.statusCode ??
            lastDisconnect?.error
              ?.data?.statusCode;

          console.log(
            `⚠️ CONNECTION CLOSED [${sessionId}] STATUS: ${statusCode || "unknown"}`
          );

          /* ===========================
             LOGGED OUT
          =========================== */

          const loggedOut =
            statusCode ===
            DisconnectReason.loggedOut;

          if (loggedOut) {
            console.log(
              `⚠️ SESSION LOGGED OUT: ${sessionId}`
            );

            sessionManager.updateSession(
              sessionId,
              {
                status: "logged_out",
                pairing: false,
                pairingCode: null
              }
            );

            return;
          }

          /* ===========================
             RECONNECT
          =========================== */

          sessionManager.updateSession(
            sessionId,
            {
              status: "reconnecting"
            }
          );

          setTimeout(() => {
            createSocket(sessionId)
              .catch((error) => {
                console.error(
                  `❌ RECONNECT ERROR [${sessionId}]`,
                  error?.stack ||
                  error?.message ||
                  error
                );

                sessionManager.updateSession(
                  sessionId,
                  {
                    status: "error"
                  }
                );
              });
          }, 5000);
        }

      } catch (error) {
        console.error(
          `❌ CONNECTION UPDATE ERROR [${sessionId}]`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );

  /* ===================================
     MESSAGES
  =================================== */

  sock.ev.on(
    "messages.upsert",
    async (upsert) => {
      try {
        if (
          !upsert ||
          upsert.type !== "notify"
        ) {
          return;
        }

        const messages =
          upsert.messages || [];

        for (const message of messages) {
          if (!message?.message) {
            continue;
          }

          try {
            await messageHandler.handleMessage(
              sock,
              message,
              sessionId
            );
          } catch (error) {
            console.error(
              `❌ MESSAGE ERROR [${sessionId}]`,
              error?.stack ||
              error?.message ||
              error
            );
          }
        }

      } catch (error) {
        console.error(
          `❌ MESSAGE HANDLER ERROR [${sessionId}]`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );

  /* ===================================
     GROUP PARTICIPANTS
  =================================== */

  sock.ev.on(
    "group-participants.update",
    async (update) => {
      try {
        /* =============================
           WELCOME
        ============================= */

        if (
          update?.action === "add" &&
          welcome?.sendWelcome
        ) {
          for (
            const participant
            of update.participants || []
          ) {
            try {
              await welcome.sendWelcome(
                sock,
                {
                  id: update.id,
                  participants: [
                    participant
                  ]
                }
              );
            } catch (error) {
              console.error(
                `❌ WELCOME ERROR [${sessionId}]`,
                error?.stack ||
                error?.message ||
                error
              );
            }
          }
        }

        /* =============================
           GOODBYE
        ============================= */

        if (
          update?.action === "remove" &&
          goodbye?.sendGoodbye
        ) {
          for (
            const participant
            of update.participants || []
          ) {
            try {
              await goodbye.sendGoodbye({
                sock,
                chatId: update.id,
                userJid: participant
              });
            } catch (error) {
              console.error(
                `❌ GOODBYE ERROR [${sessionId}]`,
                error?.stack ||
                error?.message ||
                error
              );
            }
          }
        }

      } catch (error) {
        console.error(
          `❌ GROUP EVENT ERROR [${sessionId}]`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );

  return sock;
}

/* =====================================
   START SESSION
===================================== */

async function startSession(sessionId) {
  if (!sessionId) {
    throw new Error(
      "sessionId manquant"
    );
  }

  return createSocket(
    sessionId
  );
}

/* =====================================
   REQUEST PAIRING CODE
===================================== */

async function requestPairingCode(number) {
  const clean =
    validatePhoneNumber(number);

  /* ===================================
     FIND SESSION
  =================================== */

  let session =
    sessionManager.getSessionByNumber(
      clean
    );

  /* ===================================
     PREVENT DUPLICATE REQUEST
  =================================== */

  if (
    session &&
    pairingRequests.has(
      session.sessionId
    )
  ) {
    const error =
      new Error(
        "PAIRING_IN_PROGRESS"
      );

    error.code =
      "PAIRING_IN_PROGRESS";

    throw error;
  }

  /* ===================================
     CREATE SESSION IF NEEDED
  =================================== */

  if (!session) {
    session =
      sessionManager.createSession(
        clean
      );
  } else {
    sessionManager.setNumber(
      session.sessionId,
      clean
    );
  }

  const sessionId =
    session.sessionId;

  /* ===================================
     CHECK SESSION STATE
  =================================== */

  const currentSession =
    sessionManager.getSession(
      sessionId
    );

  if (
    currentSession?.pairing
  ) {
    const error =
      new Error(
        "PAIRING_IN_PROGRESS"
      );

    error.code =
      "PAIRING_IN_PROGRESS";

    throw error;
  }

  /* ===================================
     START PAIRING LOCK
  =================================== */

  pairingRequests.set(
    sessionId,
    true
  );

  sessionManager.startPairing(
    sessionId
  );

  try {
    /* ================================
       CREATE / GET SOCKET
    ================================= */

    const sock =
      await createSocket(
        sessionId
      );

    /* ================================
       CHECK AUTH STATE
    ================================= */

    if (
      sock.authState?.creds
        ?.registered
    ) {
      const error =
        new Error(
          "SESSION_ALREADY_REGISTERED"
        );

      error.code =
        "SESSION_ALREADY_REGISTERED";

      throw error;
    }

    /* ================================
       SMALL DELAY
       Let socket initialize before
       pairing request.
    ================================= */

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 1000)
    );

    /* ================================
       REQUEST PAIRING CODE
    ================================= */

    console.log(
      `🔐 REQUESTING PAIRING CODE: ${clean}`
    );

    const code =
      await sock.requestPairingCode(
        clean
      );

    if (!code) {
      throw new Error(
        "WhatsApp n'a pas retourné de code de pairing."
      );
    }

    /* ================================
       SAVE PAIRING CODE
    ================================= */

    sessionManager.setPairingCode(
      sessionId,
      code
    );

    sessionManager.updateSession(
      sessionId,
      {
        status: "pairing",
        pairing: true,
        pairingCode: code,
        number: clean
      }
    );

    console.log(
      `🔑 PAIRING CODE [${sessionId}]: ${code}`
    );

    return {
      sessionId,
      number: clean,
      code,
      socket: sock
    };

  } catch (error) {
    console.error(
      `❌ PAIRING ERROR [${sessionId}]`,
      error?.stack ||
      error?.message ||
      error
    );

    sessionManager.endPairing(
      sessionId
    );

    sessionManager.updateSession(
      sessionId,
      {
        pairing: false,
        pairingCode: null,
        status: "pairing_error"
      }
    );

    throw error;

  } finally {
    pairingRequests.delete(
      sessionId
    );
  }
}

/* =====================================
   STOP SESSION
===================================== */

async function stopSession(sessionId) {
  if (!sessionId) {
    return false;
  }

  pairingRequests.delete(
    sessionId
  );

  const sock =
    activeSockets.get(
      sessionId
    ) ||
    sessionManager.getSocket(
      sessionId
    );

  activeSockets.delete(
    sessionId
  );

  if (sock) {
    try {
      sock.end(
        new Error(
          "Session stopped"
        )
      );
    } catch (error) {
      console.warn(
        `⚠️ Erreur fermeture socket [${sessionId}]:`,
        error?.message ||
        error
      );
    }
  }

  sessionManager.setSocket(
    sessionId,
    null
  );

  sessionManager.endPairing(
    sessionId
  );

  sessionManager.updateSession(
    sessionId,
    {
      status: "stopped",
      pairing: false,
      pairingCode: null
    }
  );

  return true;
}

/* =====================================
   REMOVE SESSION
===================================== */

async function removeSession(sessionId) {
  await stopSession(
    sessionId
  );

  return sessionManager.removeSession(
    sessionId
  );
}

/* =====================================
   RESTORE STORED SESSIONS
===================================== */

async function restoreStoredSessions() {
  const sessionIds =
    sessionManager.getStoredSessionIds();

  const restored = [];

  for (
    const sessionId
    of sessionIds
  ) {
    try {
      await createSocket(
        sessionId
      );

      restored.push(
        sessionId
      );

      console.log(
        `✅ SESSION RESTORED: ${sessionId}`
      );

    } catch (error) {
      console.error(
        `❌ SESSION RESTORE ERROR [${sessionId}]`,
        error?.stack ||
        error?.message ||
        error
      );

      sessionManager.updateSession(
        sessionId,
        {
          status: "error"
        }
      );
    }
  }

  return restored;
}

/* =====================================
   COMPATIBILITY FUNCTIONS
===================================== */

async function attachMessageListener(
  sock,
  sessionId
) {
  return sock;
}

async function attachConnectionListener(
  sock,
  sessionId
) {
  return sock;
}

/* =====================================
   START ALL
===================================== */

async function start() {
  return restoreStoredSessions();
}

/* =====================================
   STOP ALL
===================================== */

async function stop() {
  const sessions = [
    ...activeSockets.keys()
  ];

  for (
    const sessionId
    of sessions
  ) {
    try {
      await stopSession(
        sessionId
      );
    } catch (error) {
      console.error(
        `❌ STOP ERROR [${sessionId}]`,
        error?.stack ||
        error?.message ||
        error
      );
    }
  }

  return true;
}

/* =====================================
   EXPORTS
===================================== */

module.exports = {
  createSocket,
  startSession,
  requestPairingCode,
  stopSession,
  removeSession,
  restoreStoredSessions,
  attachMessageListener,
  attachConnectionListener,
  start,
  stop
};