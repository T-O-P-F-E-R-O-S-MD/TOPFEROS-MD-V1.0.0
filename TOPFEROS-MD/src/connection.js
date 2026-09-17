"use strict";

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const path = require("path");

const sessionManager = require("./sessionManager");
const messageHandler = require("./messageHandler");

const activeSockets = new Map();

let welcome = null;
let goodbye = null;

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
   CREATE SOCKET
===================================== */

async function createSocket(sessionId) {
  if (!sessionId) {
    throw new Error("sessionId manquant");
  }

  if (activeSockets.has(sessionId)) {
    return activeSockets.get(sessionId);
  }

  let session = sessionManager.getSession(sessionId);

  if (!session) {
    session = sessionManager.restoreSession(sessionId);
  }

  if (!session) {
    throw new Error(
      `Session introuvable: ${sessionId}`
    );
  }

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
  } = await useMultiFileAuthState(authPath);

  let version;

  try {
    const latest =
      await fetchLatestBaileysVersion();

    version = latest.version;
  } catch (error) {
    console.warn(
      "⚠️ Impossible de récupérer la version Baileys."
    );
  }

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

    printQRInTerminal: false,

    markOnlineOnConnect: false,

    generateHighQualityLinkPreview: false
  };

  if (version) {
    socketConfig.version = version;
  }

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

  /* =====================================
     SAVE CREDENTIALS
  ===================================== */

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  /* =====================================
     CONNECTION UPDATE
  ===================================== */

  sock.ev.on(
    "connection.update",
    async (update) => {
      try {
        const {
          connection,
          lastDisconnect
        } = update;

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
        }

        if (connection === "close") {
          activeSockets.delete(
            sessionId
          );

          sessionManager.setSocket(
            sessionId,
            null
          );

          const statusCode =
            lastDisconnect?.error
              ?.output?.statusCode ??
            lastDisconnect?.error
              ?.statusCode;

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

          console.log(
            `🔄 RECONNECTING: ${sessionId}`
          );

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
              });
          }, 3000);
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

  /* =====================================
     MESSAGES
  ===================================== */

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

          await messageHandler.handleMessage(
            sock,
            message,
            sessionId
          );
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

  /* =====================================
     GROUP PARTICIPANTS
  ===================================== */

  sock.ev.on(
    "group-participants.update",
    async (update) => {
      try {
        /* ===== WELCOME ===== */

        if (
          update?.action === "add" &&
          welcome?.sendWelcome
        ) {
          for (
            const participant
            of update.participants || []
          ) {
            await welcome.sendWelcome(
              sock,
              {
                id: update.id,
                participants: [
                  participant
                ]
              }
            );
          }
        }

        /* ===== GOODBYE ===== */

        if (
          update?.action === "remove" &&
          goodbye?.sendGoodbye
        ) {
          for (
            const participant
            of update.participants || []
          ) {
            await goodbye.sendGoodbye({
              sock,
              chatId: update.id,
              userJid: participant
            });
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
  return createSocket(
    sessionId
  );
}

/* =====================================
   REQUEST PAIRING CODE
===================================== */

async function requestPairingCode(number) {
  const clean = cleanNumber(number);

  if (!clean) {
    throw new Error(
      "Numéro WhatsApp invalide."
    );
  }

  let session =
    sessionManager.getSessionByNumber(
      clean
    );

  if (session?.pairing) {
    const error =
      new Error(
        "PAIRING_IN_PROGRESS"
      );

    error.code =
      "PAIRING_IN_PROGRESS";

    throw error;
  }

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

  sessionManager.startPairing(
    session.sessionId
  );

  const sock =
    await createSocket(
      session.sessionId
    );

  const code =
    await sock.requestPairingCode(
      clean
    );

  sessionManager.setPairingCode(
    session.sessionId,
    code
  );

  return {
    sessionId:
      session.sessionId,

    number: clean,

    code,

    socket: sock
  };
}

/* =====================================
   STOP SESSION
===================================== */

async function stopSession(sessionId) {
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
        "⚠️ Erreur fermeture socket:",
        error?.message || error
      );
    }
  }

  sessionManager.setSocket(
    sessionId,
    null
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

  for (const sessionId of sessionIds) {
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
   START
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

  for (const sessionId of sessions) {
    await stopSession(
      sessionId
    );
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