"use strict";

console.log("🔥 NOUVO CONNEXION.JS CHARGE 🔥");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const {
  Boom
} = require("@hapi/boom");

const sessionManager =
  require("./sessionManager");

const messageHandler =
  require("./handlers/messageHandler");

function attachMessageListener(
  socket,
  sessionId
) {
  if (!socket || !sessionId) {
    console.error(
      "❌ MESSAGE LISTENER: socket/sessionId manke."
    );
    return;
  }

  socket.ev.on(
    "messages.upsert",
    async (upsert) => {
      try {
        console.log(
          `📩 MESAJ WHATSAPP RESEVWA (${sessionId}):`,
          upsert?.type,
          upsert?.messages?.length || 0
        );

        const messages =
          upsert?.messages || [];

        for (const message of messages) {
          if (!message) {
            continue;
          }

          await messageHandler.handleMessage(
            socket,
            message,
            sessionId
          );
        }

      } catch (error) {
        console.error(
          `❌ MESSAGES UPSERT ERROR (${sessionId}):`,
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

function attachConnectionListener(
  socket,
  sessionId,
  startSession
) {
  socket.ev.on(
    "connection.update",
    async (update) => {
      try {
        const {
          connection,
          lastDisconnect
        } = update;

        console.log(
          `🔌 CONNECTION UPDATE [${sessionId}]:`,
          connection
        );

        if (connection === "open") {
          console.log(
            `✅ WHATSAPP CONNECTED: ${sessionId}`
          );

          if (
            socket.user?.id
          ) {
            await sessionManager.updateSession(
              sessionId,
              {
                status: "connected",
                jid: socket.user.id
              }
            );
          }

          return;
        }

        if (connection === "close") {
          const statusCode =
            new Boom(
              lastDisconnect?.error
            )?.output?.statusCode;

          console.log(
            `❌ WHATSAPP DISCONNECTED [${sessionId}]:`,
            statusCode
          );

          await sessionManager.updateSession(
            sessionId,
            {
              status: "disconnected"
            }
          );

          if (
            statusCode !==
            DisconnectReason.loggedOut
          ) {
            console.log(
              `🔄 RECONNECTING: ${sessionId}`
            );

            setTimeout(
              () => {
                startSession(sessionId)
                  .catch((error) => {
                    console.error(
                      `❌ RECONNECT ERROR [${sessionId}]:`,
                      error?.message ||
                      error
                    );
                  });
              },
              3000
            );
          }
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

async function createSocket(
  sessionId
) {
  const session =
    sessionManager.getSessionById
      ? sessionManager.getSessionById(sessionId)
      : sessionManager.getSession(sessionId);

  if (!session) {
    throw new Error(
      `Session pa jwenn: ${sessionId}`
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
    `📦 Baileys version [${sessionId}]:`,
    version.join(".")
  );

  const socket =
    makeWASocket({
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

  socket.ev.on(
    "creds.update",
    saveCreds
  );

  attachMessageListener(
    socket,
    sessionId
  );

  attachConnectionListener(
    socket,
    sessionId,
    startSession
  );

  return socket;
}

async function startSession(
  sessionId
) {
  console.log(
    `🚀 START SESSION: ${sessionId}`
  );

  const socket =
    await createSocket(
      sessionId
    );

  if (
    typeof sessionManager.updateSession ===
    "function"
  ) {
    await sessionManager.updateSession(
      sessionId,
      {
        socket,
        status: "connecting"
      }
    );
  }

  return socket;
}

async function requestPairingCode(
  sessionId,
  phoneNumber
) {
  const socket =
    await startSession(
      sessionId
    );

  if (
    socket.authState?.creds?.registered
  ) {
    console.log(
      `⚠️ SESSION ALREADY REGISTERED: ${sessionId}`
    );

    return {
      socket,
      alreadyRegistered: true
    };
  }

  const number =
    String(phoneNumber || "")
      .replace(/\D/g, "");

  if (!number) {
    throw new Error(
      "Phone number invalid."
    );
  }

  console.log(
    `🔑 REQUEST PAIRING CODE: ${sessionId}`
  );

  const code =
    await socket.requestPairingCode(
      number
    );

  console.log(
    `🔐 PAIRING CODE [${sessionId}]:`,
    code
  );

  return {
    socket,
    code,
    alreadyRegistered: false
  };
}

async function stopSession(
  sessionId
) {
  try {
    const session =
      sessionManager.getSessionById
        ? sessionManager.getSessionById(sessionId)
        : sessionManager.getSession(sessionId);

    const socket =
      session?.socket;

    if (socket) {
      try {
        socket.end(
          new Error(
            "Session stopped"
          )
        );
      } catch {}
    }

    if (
      typeof sessionManager.updateSession ===
      "function"
    ) {
      await sessionManager.updateSession(
        sessionId,
        {
          socket: null,
          status: "stopped"
        }
      );
    }

    console.log(
      `🛑 SESSION STOPPED: ${sessionId}`
    );

  } catch (error) {
    console.error(
      `❌ STOP SESSION ERROR [${sessionId}]:`,
      error?.message ||
      error
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