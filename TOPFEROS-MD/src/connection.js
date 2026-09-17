"use strict";

console.log(
  "🔥 NOUVO CONNEXION.JS CHARGE 🔥"
);

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

function getSession(
  sessionId
) {
  if (
    typeof sessionManager.getSessionById ===
    "function"
  ) {
    return sessionManager.getSessionById(
      sessionId
    );
  }

  if (
    typeof sessionManager.getSession ===
    "function"
  ) {
    return sessionManager.getSession(
      sessionId
    );
  }

  if (
    typeof sessionManager.getSessionByNumber ===
    "function"
  ) {
    return sessionManager.getSessionByNumber(
      sessionId
    );
  }

  return null;
}

async function updateSession(
  sessionId,
  data
) {
  try {
    if (
      typeof sessionManager.updateSession ===
      "function"
    ) {
      await sessionManager.updateSession(
        sessionId,
        data
      );
    }
  } catch (error) {
    console.error(
      `❌ SESSION UPDATE ERROR [${sessionId}]:`,
      error?.message ||
      error
    );
  }
}

function attachMessageListener(
  socket,
  sessionId
) {
  if (!socket) {
    console.error(
      "❌ MESSAGE LISTENER: socket manke."
    );
    return;
  }

  socket.ev.on(
    "messages.upsert",
    async (upsert) => {
      try {
        const messages =
          upsert?.messages || [];

        console.log(
          `📩 MESAJ WHATSAPP RESEVWA (${sessionId}) — ${upsert?.type || "unknown"} — ${messages.length} message(s)`
        );

        for (const message of messages) {
          if (!message) {
            continue;
          }

          console.log(
            `➡️ HANDLING MESSAGE (${sessionId})`
          );

          await messageHandler.handleMessage(
            socket,
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

function attachConnectionListener(
  socket,
  sessionId
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
          connection || "update"
        );

        if (
          connection ===
          "open"
        ) {
          console.log(
            `✅ WHATSAPP CONNECTED: ${sessionId}`
          );

          await updateSession(
            sessionId,
            {
              status: "connected",
              jid:
                socket.user?.id ||
                null,
              socket
            }
          );

          return;
        }

        if (
          connection ===
          "close"
        ) {
          const statusCode =
            new Boom(
              lastDisconnect?.error
            )
              ?.output
              ?.statusCode;

          console.log(
            `❌ WHATSAPP DISCONNECTED [${sessionId}]: ${statusCode || "UNKNOWN"}`
          );

          await updateSession(
            sessionId,
            {
              status:
                "disconnected"
            }
          );

          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {
            console.log(
              `🚪 SESSION LOGGED OUT: ${sessionId}`
            );

            return;
          }

          console.log(
            `🔄 RECONNECTING SESSION: ${sessionId}`
          );

          setTimeout(
            async () => {
              try {
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
    `📦 BAILEYS VERSION [${sessionId}]: ${version.join(".")}`
  );

  const socket =
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
    sessionId
  );

  await updateSession(
    sessionId,
    {
      socket,
      status: "connecting"
    }
  );

  return socket;
}

async function startSession(
  sessionId
) {
  console.log(
    `🚀 START SESSION: ${sessionId}`
  );

  return await createSocket(
    sessionId
  );
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
    return {
      socket,
      alreadyRegistered:
        true
    };
  }

  const number =
    String(
      phoneNumber || ""
    ).replace(
      /\D/g,
      ""
    );

  if (!number) {
    throw new Error(
      "Phone number invalid."
    );
  }

  console.log(
    `🔑 REQUEST PAIRING CODE [${sessionId}]`
  );

  const code =
    await socket.requestPairingCode(
      number
    );

  console.log(
    `🔐 PAIRING CODE [${sessionId}]: ${code}`
  );

  return {
    socket,
    code,
    alreadyRegistered:
      false
  };
}

async function stopSession(
  sessionId
) {
  try {
    const session =
      getSession(
        sessionId
      );

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