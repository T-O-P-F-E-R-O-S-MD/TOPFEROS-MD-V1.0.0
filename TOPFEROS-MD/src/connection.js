"use strict";

console.log("🔥 TOPFEROS MD — CONNECTION.JS CHARGE 🔥");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const sessionManager =
  require("./sessionManager");

const messageHandler =
  require("./messageHandler");

/* ============================================================
   GET SESSION
============================================================ */

function getSession(sessionId) {
  if (
    typeof sessionManager.getSession ===
    "function"
  ) {
    return sessionManager.getSession(
      sessionId
    );
  }

  if (
    typeof sessionManager.getSessionById ===
    "function"
  ) {
    return sessionManager.getSessionById(
      sessionId
    );
  }

  return null;
}

/* ============================================================
   UPDATE SESSION
============================================================ */

function updateSession(
  sessionId,
  updates = {}
) {
  try {
    if (
      typeof sessionManager.updateSession ===
      "function"
    ) {
      return sessionManager.updateSession(
        sessionId,
        updates
      );
    }

    return false;
  } catch (error) {
    console.error(
      `❌ UPDATE SESSION ERROR [${sessionId}]:`,
      error?.message || error
    );

    return false;
  }
}

/* ============================================================
   MESSAGE LISTENER
============================================================ */

function attachMessageListener(
  sock,
  sessionId
) {
  if (!sock) {
    console.error(
      "❌ MESSAGE LISTENER: SOCKET MANKE."
    );
    return;
  }

  sock.ev.on(
    "messages.upsert",
    async (upsert) => {
      try {
        const messages =
          upsert?.messages || [];

        console.log(
          `📩 MESSAGES UPSERT [${sessionId}] — ${
            upsert?.type || "unknown"
          } — ${messages.length}`
        );

        for (
          const message of messages
        ) {
          if (!message) {
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
          `❌ MESSAGES UPSERT ERROR [${sessionId}]:`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );

  console.log(
    `👂 MESSAGE LISTENER ATTACHED: ${sessionId}`
  );
}

/* ============================================================
   CONNECTION LISTENER
============================================================ */

function attachConnectionListener(
  sock,
  sessionId
) {
  if (!sock) {
    return;
  }

  sock.ev.on(
    "connection.update",
    async (update) => {
      try {
        const {
          connection,
          lastDisconnect
        } = update;

        console.log(
          `🔌 CONNECTION UPDATE [${sessionId}]: ${
            connection || "update"
          }`
        );

        /* ----------------------------------------------------
           CONNECTED
        ---------------------------------------------------- */

        if (
          connection === "open"
        ) {
          console.log(
            `✅ WHATSAPP CONNECTED: ${sessionId}`
          );

          updateSession(
            sessionId,
            {
              socket: sock,
              status: "connected",
              pairing: false,
              pairingCode: null,
              pairingStartedAt: null
            }
          );

          return;
        }

        /* ----------------------------------------------------
           CLOSED
        ---------------------------------------------------- */

        if (
          connection === "close"
        ) {
          const statusCode =
            lastDisconnect?.error
              ?.output
              ?.statusCode;

          console.log(
            `❌ WHATSAPP DISCONNECTED [${sessionId}]: ${
              statusCode || "UNKNOWN"
            }`
          );

          updateSession(
            sessionId,
            {
              socket: null,
              status: "disconnected"
            }
          );

          /* LOGGED OUT */

          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {
            console.log(
              `🚪 SESSION LOGGED OUT: ${sessionId}`
            );

            return;
          }

          /* RECONNECT */

          console.log(
            `🔄 RECONNECTING SESSION: ${sessionId}`
          );

          setTimeout(
            async () => {
              try {
                const session =
                  getSession(
                    sessionId
                  );

                if (!session) {
                  return;
                }

                await startSession(
                  sessionId
                );

              } catch (error) {
                console.error(
                  `❌ RECONNECT ERROR [${sessionId}]:`,
                  error?.message ||
                  error
                );
              }
            },
            3000
          );
        }

      } catch (error) {
        console.error(
          `❌ CONNECTION UPDATE ERROR [${sessionId}]:`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );
}

/* ============================================================
   CREATE SOCKET
============================================================ */

async function createSocket(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    throw new Error(
      `Session pa jwenn: ${sessionId}`
    );
  }

  if (!session.authDir) {
    throw new Error(
      `authDir pa defini pou session: ${sessionId}`
    );
  }

  const {
    state,
    saveCreds
  } =
    await useMultiFileAuthState(
      session.authDir
    );

  const {
    version
  } =
    await fetchLatestBaileysVersion();

  console.log(
    `📦 BAILEYS VERSION [${sessionId}]: ${version.join(
      "."
    )}`
  );

  const sock =
    makeWASocket({
      version,

      auth: state,

      printQRInTerminal:
        false,

      browser: [
        "TOPFEROS MD",
        "Chrome",
        "1.0.0"
      ],

      syncFullHistory:
        false,

      markOnlineOnConnect:
        false,

      generateHighQualityLinkPreview:
        false
    });

  /* SAVE CREDENTIALS */

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  /* LISTENERS */

  attachMessageListener(
    sock,
    sessionId
  );

  attachConnectionListener(
    sock,
    sessionId
  );

  /* SAVE SOCKET */

  updateSession(
    sessionId,
    {
      socket: sock,
      status: "connecting"
    }
  );

  return sock;
}

/* ============================================================
   START SESSION
============================================================ */

async function startSession(
  sessionId
) {
  if (!sessionId) {
    return null;
  }

  console.log(
    `🚀 START SESSION: ${sessionId}`
  );

  return await createSocket(
    sessionId
  );
}

/* ============================================================
   REQUEST PAIRING CODE
   PANEL LA VOYE NIMEWO A DIRÈKT
============================================================ */

async function requestPairingCode(
  phoneNumber
) {
  const number =
    String(
      phoneNumber || ""
    ).replace(
      /\D/g,
      ""
    );

  if (
    !number ||
    !/^\d{8,15}$/.test(number)
  ) {
    throw new Error(
      "Phone number invalid."
    );
  }

  /* ----------------------------------------------------------
     CHECK EXISTING SESSION
  ---------------------------------------------------------- */

  let session =
    sessionManager.getSessionByNumber
      ? sessionManager.getSessionByNumber(
          number
        )
      : null;

  if (
    session &&
    session.pairing
  ) {
    const error =
      new Error(
        "Pairing already in progress."
      );

    error.code =
      "PAIRING_IN_PROGRESS";

    throw error;
  }

  /* ----------------------------------------------------------
     CREATE NEW SESSION
  ---------------------------------------------------------- */

  if (!session) {
    session =
      sessionManager.createSession(
        number
      );
  }

  if (!session) {
    throw new Error(
      "Unable to create WhatsApp session."
    );
  }

  const sessionId =
    session.sessionId;

  /* ----------------------------------------------------------
     MARK PAIRING
  ---------------------------------------------------------- */

  if (
    typeof sessionManager.startPairing ===
    "function"
  ) {
    sessionManager.startPairing(
      sessionId
    );
  }

  /* ----------------------------------------------------------
     START SOCKET
  ---------------------------------------------------------- */

  const sock =
    await startSession(
      sessionId
    );

  console.log(
    `🔑 REQUEST PAIRING CODE [${sessionId}]`
  );

  /* ----------------------------------------------------------
     WAIT A LITTLE FOR SOCKET
  ---------------------------------------------------------- */

  await new Promise(
    resolve =>
      setTimeout(
        resolve,
        1000
      )
  );

  /* ----------------------------------------------------------
     GENERATE CODE
  ---------------------------------------------------------- */

  const code =
    await sock.requestPairingCode(
      number
    );

  console.log(
    `🔐 PAIRING CODE [${sessionId}]: ${code}`
  );

  if (
    typeof sessionManager.setNumber ===
    "function"
  ) {
    sessionManager.setNumber(
      sessionId,
      number
    );
  }

  if (
    typeof sessionManager.setPairingCode ===
    "function"
  ) {
    sessionManager.setPairingCode(
      sessionId,
      code
    );
  }

  return {
    success: true,

    sessionId,

    number,

    code,

    socket: sock
  };
}

/* ============================================================
   RESTORE STORED SESSIONS
============================================================ */

async function restoreStoredSessions() {
  if (
    typeof sessionManager.getStoredSessionIds !==
    "function"
  ) {
    return [];
  }

  const sessionIds =
    sessionManager.getStoredSessionIds();

  const restored = [];

  for (
    const sessionId of sessionIds
  ) {
    try {
      const session =
        getSession(
          sessionId
        );

      if (!session) {
        continue;
      }

      /*
       * Pa relanse yon session ki deja
       * gen socket aktif nan RAM.
       */

      if (
        session.socket
      ) {
        continue;
      }

      await startSession(
        sessionId
      );

      restored.push(
        sessionId
      );

    } catch (error) {
      console.error(
        `❌ RESTORE SESSION ERROR [${sessionId}]:`,
        error?.message ||
        error
      );
    }
  }

  console.log(
    `♻️ STORED SESSIONS RESTORED: ${restored.length}`
  );

  return restored;
}

/* ============================================================
   START
   index.js APPEL connection.start()
============================================================ */

async function start() {
  const restored =
    await restoreStoredSessions();

  /*
   * Pa gen session default espesyal.
   * Panel la ap kreye nouvo session
   * lè yon moun mande pairing.
   */

  if (
    restored.length === 0
  ) {
    console.log(
      "ℹ️ NO DEFAULT SESSION — PANEL READY."
    );
  }

  return restored;
}

/* ============================================================
   STOP SESSION
============================================================ */

async function stopSession(
  sessionId
) {
  try {
    const session =
      getSession(
        sessionId
      );

    if (!session) {
      return false;
    }

    const sock =
      session.socket;

    if (sock) {
      try {
        sock.end(
          new Error(
            "Session stopped"
          )
        );
      } catch {}
    }

    updateSession(
      sessionId,
      {
        socket: null,
        status: "stopped"
      }
    );

    console.log(
      `🛑 SESSION STOPPED: ${sessionId}`
    );

    return true;

  } catch (error) {
    console.error(
      `❌ STOP SESSION ERROR [${sessionId}]:`,
      error?.message ||
      error
    );

    return false;
  }
}

/* ============================================================
   EXPORTS
============================================================ */

module.exports = {
  createSocket,
  startSession,
  requestPairingCode,
  restoreStoredSessions,
  start,
  stopSession,
  attachMessageListener,
  attachConnectionListener
};