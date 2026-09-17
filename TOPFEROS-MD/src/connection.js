"use strict";

console.log("🔥 TOPFEROS MD — CONNEXION.JS CHARGE 🔥");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const { Boom } = require("@hapi/boom");

const sessionManager = require("./sessionManager");
const messageHandler = require("./handlers/messageHandler");

function getSession(sessionId) {
  if (typeof sessionManager.getSessionById === "function") {
    return sessionManager.getSessionById(sessionId);
  }

  if (typeof sessionManager.getSession === "function") {
    return sessionManager.getSession(sessionId);
  }

  if (typeof sessionManager.getSessionByNumber === "function") {
    return sessionManager.getSessionByNumber(sessionId);
  }

  return null;
}

async function updateSession(sessionId, data) {
  try {
    if (typeof sessionManager.updateSession === "function") {
      await sessionManager.updateSession(sessionId, data);
    }
  } catch (error) {
    console.error(
      `❌ SESSION UPDATE ERROR [${sessionId}]:`,
      error?.message || error
    );
  }
}

/* ===============================
   MESSAGE LISTENER
================================ */

function attachMessageListener(sock, sessionId) {
  if (!sock) {
    console.error("❌ SOCKET MANKE.");
    return;
  }

  sock.ev.on("messages.upsert", async (upsert) => {
    try {
      const messages = upsert?.messages || [];

      console.log(
        `📩 MESSAGES UPSERT [${sessionId}] — ${upsert?.type || "unknown"} — ${messages.length}`
      );

      for (const message of messages) {
        if (!message) continue;

        console.log(
          `➡️ MESSAGE HANDLER APPELÉ [${sessionId}]`
        );

        await messageHandler.handleMessage(
          sock,
          message,
          sessionId
        );
      }
    } catch (error) {
      console.error(
        `❌ MESSAGES UPSERT ERROR [${sessionId}]:`,
        error?.stack || error
      );
    }
  });

  console.log(
    `👂 MESSAGE LISTENER ATTACHED: ${sessionId}`
  );
}

/* ===============================
   CONNECTION LISTENER
================================ */

function attachConnectionListener(sock, sessionId) {
  sock.ev.on("connection.update", async (update) => {
    try {
      const {
        connection,
        lastDisconnect
      } = update;

      console.log(
        `🔌 CONNECTION UPDATE [${sessionId}]:`,
        connection || "update"
      );

      if (connection === "open") {
        console.log(
          `✅ WHATSAPP CONNECTED: ${sessionId}`
        );

        await updateSession(sessionId, {
          socket: sock,
          status: "connected",
          jid: sock.user?.id || null
        });

        return;
      }

      if (connection === "close") {
        const statusCode =
          new Boom(lastDisconnect?.error)
            ?.output?.statusCode;

        console.log(
          `❌ WHATSAPP DISCONNECTED [${sessionId}]: ${
            statusCode || "UNKNOWN"
          }`
        );

        await updateSession(sessionId, {
          socket: null,
          status: "disconnected"
        });

        if (statusCode === DisconnectReason.loggedOut) {
          console.log(
            `🚪 SESSION LOGGED OUT: ${sessionId}`
          );
          return;
        }

        console.log(
          `🔄 RECONNECTING: ${sessionId}`
        );

        setTimeout(async () => {
          try {
            await startSession(sessionId);
          } catch (error) {
            console.error(
              `❌ RECONNECT ERROR [${sessionId}]:`,
              error?.message || error
            );
          }
        }, 3000);
      }
    } catch (error) {
      console.error(
        `❌ CONNECTION UPDATE ERROR [${sessionId}]:`,
        error?.stack || error
      );
    }
  });
}

/* ===============================
   CREATE SOCKET
================================ */

async function createSocket(sessionId) {
  const session = getSession(sessionId);

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
  } = await useMultiFileAuthState(
    session.authDir
  );

  const {
    version
  } = await fetchLatestBaileysVersion();

  console.log(
    `📦 BAILEYS VERSION [${sessionId}]: ${version.join(".")}`
  );

  const sock = makeWASocket({
    version,
    auth: state,

    printQRInTerminal: false,

    browser: [
      "TOPFEROS MD",
      "Chrome",
      "1.0.0"
    ],

    syncFullHistory: false,

    markOnlineOnConnect: false,

    generateHighQualityLinkPreview: false
  });

  /* SAVE CREDENTIALS */

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  /* IMPORTANT:
     LISTENER YO DWE ATACHE SOU
     SOCKET SA A. */

  attachMessageListener(
    sock,
    sessionId
  );

  attachConnectionListener(
    sock,
    sessionId
  );

  await updateSession(sessionId, {
    socket: sock,
    status: "connecting"
  });

  return sock;
}

/* ===============================
   START SESSION
================================ */

async function startSession(sessionId) {
  console.log(
    `🚀 START SESSION: ${sessionId}`
  );

  return await createSocket(
    sessionId
  );
}

/* ===============================
   PAIRING CODE
================================ */

async function requestPairingCode(
  sessionId,
  phoneNumber
) {
  const session = getSession(sessionId);

  if (!session) {
    throw new Error(
      `Session pa jwenn: ${sessionId}`
    );
  }

  const sock = await startSession(
    sessionId
  );

  const number = String(
    phoneNumber || ""
  ).replace(/\D/g, "");

  if (!number) {
    throw new Error(
      "Phone number invalid."
    );
  }

  /*
   * Nou itilize state ki soti
   * nan useMultiFileAuthState
   * olye socket.authState.
   */

  console.log(
    `🔑 REQUEST PAIRING CODE [${sessionId}]`
  );

  const code =
    await sock.requestPairingCode(
      number
    );

  console.log(
    `🔐 PAIRING CODE [${sessionId}]: ${code}`
  );

  return {
    socket: sock,
    code
  };
}

/* ===============================
   STOP SESSION
================================ */

async function stopSession(sessionId) {
  try {
    const session =
      getSession(sessionId);

    const sock =
      session?.socket;

    if (sock) {
      try {
        sock.end(
          new Error(
            "Session stopped"
          )
        );
      } catch {}
    }

    await updateSession(
      sessionId,
      {
        socket: null,
        status: "stopped"
      }
    );

    console.log(
      `🛑 SESSION STOPPED: ${sessionId}`
    );
  } catch (error) {
    console.error(
      `❌ STOP SESSION ERROR [${sessionId}]:`,
      error?.message || error
    );
  }
}

module.exports = {
  createSocket,
  startSession,
  requestPairingCode,
  stopSession,
  attachMessageListener,
  attachConnectionListener
};