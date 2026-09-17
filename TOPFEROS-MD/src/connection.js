"use strict";

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const path = require("path");

const sessionManager = require("./sessionManager");
const settingsPanel = require("../settings/panel");
const messageHandler = require("./messageHandler");

const reconnectTimers = new Map();
const startingSessions = new Set();
const startingPromises = new Map();
const stoppedSessions = new Set();
const socketReadyPromises = new Map();

const RECONNECT_DELAY = 5000;
const SOCKET_READY_TIMEOUT = 30000;

// ============================================================
// PHONE NUMBER HELPERS
// ============================================================

function cleanPhoneNumber(number) {
  return String(number || "")
    .replace(/\D/g, "")
    .replace(/^0+/, "");
}

function validatePhoneNumber(number) {
  const phoneNumber = cleanPhoneNumber(number);

  if (!phoneNumber || phoneNumber.length < 7 || phoneNumber.length > 15) {
    throw new Error("Invalid WhatsApp phone number.");
  }

  return phoneNumber;
}

// ============================================================
// CONNECTION WELCOME MESSAGE
// ============================================================

async function sendConnectionWelcome(sock, sessionId) {
  try {
    if (!sock || !sock.user || !sock.user.id) {
      console.warn(
        `⚠️ Pa kapab voye welcome message (${sessionId}): user ID pa disponib.`
      );
      return;
    }

    const username =
      sock.user.name ||
      sock.user.verifiedName ||
      sock.user.notify ||
      "WhatsApp User";

    const number = cleanPhoneNumber(
      sock.user.id.split(":")[0].split("@")[0]
    );

    const prefix = ".";
    const mode = "public";

    const welcomeText = `🦁 TOPFEROS MD

✅ Ou konekte ak TOPFEROS MD V1.0.0

👤 Username : ${username}
📱 Number : ${number || "Unknown"}
⚡ Prefix : ${prefix}
🌐 Mode : ${mode}

━━━━━━━━━━━━━━━━━━

> 💞 Always Online
> 🔌 Fake Typing
> 🎤 Fake Recording
> 🖇️ Auto Status Seen & Like
> 😋 Auto Status Reply
> 🌈 Auto React
> 📞 Anti Call
> 🤖 Mode Change
> 📥 Media Download Commands
> 🎞️ Send Songs to WhatsApp Channels
> 🤖 Smart AI Commands & Auto Chat
> 🎀 & many more commands...

📌 Tape \`.menu\` pou wè tout kòmand yo.
⚙️ Tape \`.setting\` pou jwenn link Portal Settings lan.

━━━━━━━━━━━━━━━━━━
By TOPFEROS MD`;

    const logoPath = path.resolve(
      process.cwd(),
      "assets",
      "logo.png"
    );

    if (fs.existsSync(logoPath)) {
      await sock.sendMessage(
        sock.user.id,
        {
          image: fs.readFileSync(logoPath),
          caption: welcomeText
        }
      );
    } else {
      console.warn(
        `⚠️ Logo TOPFEROS MD pa jwenn: ${logoPath}`
      );

      await sock.sendMessage(
        sock.user.id,
        {
          text: welcomeText
        }
      );
    }

    console.log(
      `✅ Welcome message voye avèk siksè (${sessionId})`
    );

  } catch (error) {
    console.error(
      `❌ Erè welcome message (${sessionId}):`,
      error?.stack ||
      error?.message ||
      error
    );
  }
}

// ============================================================
// MESSAGE HANDLER
// ============================================================

async function handleMessages(sock, update, sessionId) {
  try {
    if (!sock || !update || !Array.isArray(update.messages)) return;

    for (const message of update.messages) {
      try {
        if (!message) continue;

        if (
          messageHandler &&
          typeof messageHandler.handleMessage === "function"
        ) {
          await messageHandler.handleMessage(
            sock,
            message,
            sessionId
          );
        }
      } catch (error) {
        console.error(
          `❌ Message handler error (${sessionId}):`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  } catch (error) {
    console.error(
      `❌ Messages upsert error (${sessionId}):`,
      error?.stack ||
      error?.message ||
      error
    );
  }
}

// ============================================================
// SOCKET READY PROMISE
// ============================================================

function createSocketReadyPromise(sessionId, socket) {
  if (!socket) {
    return Promise.reject(
      new Error("Socket is not available.")
    );
  }

  if (socketReadyPromises.has(sessionId)) {
    return socketReadyPromises.get(sessionId);
  }

  const promise = new Promise((resolve, reject) => {
    let finished = false;

    const finish = (fn, value) => {
      if (finished) return;
      finished = true;

      clearTimeout(timeout);

      try {
        socket.ev.off("connection.update", onUpdate);
      } catch {}

      fn(value);
    };

    const onUpdate = (update) => {
      try {
        const { connection, qr } = update || {};

        if (qr) {
          finish(resolve, socket);
          return;
        }

        if (connection === "open") {
          finish(resolve, socket);
          return;
        }

        if (connection === "close") {
          finish(
            reject,
            new Error("WhatsApp connection closed.")
          );
        }
      } catch (error) {
        finish(reject, error);
      }
    };

    const timeout = setTimeout(() => {
      finish(
        reject,
        new Error(
          `Socket ready timeout after ${SOCKET_READY_TIMEOUT}ms.`
        )
      );
    }, SOCKET_READY_TIMEOUT);

    socket.ev.on("connection.update", onUpdate);
  });

  socketReadyPromises.set(sessionId, promise);

  promise.finally(() => {
    socketReadyPromises.delete(sessionId);
  }).catch(() => {});

  return promise;
}

// ============================================================
// RECONNECT
// ============================================================

function clearReconnectTimer(sessionId) {
  const timer = reconnectTimers.get(sessionId);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(sessionId);
  }
}

function scheduleReconnect(sessionId) {
  clearReconnectTimer(sessionId);

  if (stoppedSessions.has(sessionId)) return;

  const timer = setTimeout(async () => {
    reconnectTimers.delete(sessionId);

    if (stoppedSessions.has(sessionId)) return;

    try {
      await startSession(sessionId);
    } catch (error) {
      console.error(
        `❌ Reconnect error (${sessionId}):`,
        error?.stack ||
        error?.message ||
        error
      );

      scheduleReconnect(sessionId);
    }
  }, RECONNECT_DELAY);

  reconnectTimers.set(sessionId, timer);
}

// ============================================================
// CREATE SOCKET
// ============================================================

async function createSocket(sessionId) {
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  if (!session.authDir) {
    throw new Error(
      `Auth directory not found for session: ${sessionId}`
    );
  }

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(session.authDir);

  let version;

  try {
    const latest = await fetchLatestBaileysVersion();

    if (latest && latest.version) {
      version = latest.version;
    }
  } catch (error) {
    console.warn(
      "⚠️ Could not fetch latest Baileys version:",
      error?.message || error
    );
  }

  const socketConfig = {
    auth: state,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    browser: Browsers.ubuntu("Chrome")
  };

  if (version) {
    socketConfig.version = version;
  }

  const socket = makeWASocket(socketConfig);

  socket.ev.on("creds.update", saveCreds);

  sessionManager.setSocket(
    sessionId,
    socket
  );

  createSocketReadyPromise(
    sessionId,
    socket
  );

  return socket;
}

// ============================================================
// START SESSION
// ============================================================

async function startSession(sessionId) {
  if (!sessionId) {
    throw new Error("sessionId is required.");
  }

  if (startingPromises.has(sessionId)) {
    return startingPromises.get(sessionId);
  }

  const promise = (async () => {
    try {
      const session = sessionManager.getSession(sessionId);

      if (!session) {
        throw new Error(
          `Session not found: ${sessionId}`
        );
      }

      if (session.status === "logged_out") {
        throw new Error(
          `Session ${sessionId} is logged out.`
        );
      }

      stoppedSessions.delete(sessionId);

      if (
        session.socket &&
        session.socket.user
      ) {
        try {
          sessionManager.setStatus(
            sessionId,
            "connected"
          );
        } catch {}

        return session.socket;
      }

      startingSessions.add(sessionId);

      try {
        sessionManager.setStatus(
          sessionId,
          "connecting"
        );
      } catch {}

      let socket = sessionManager.getSocket(
        sessionId
      );

      if (!socket) {
        socket = await createSocket(
          sessionId
        );
      }

      socket.ev.on(
        "connection.update",
        async (update) => {
          try {
            const {
              connection,
              lastDisconnect
            } = update || {};

            if (connection === "connecting") {
              try {
                sessionManager.setStatus(
                  sessionId,
                  "connecting"
                );
              } catch {}

              console.log(
                `🔄 TOPFEROS MD ap konekte: ${sessionId}`
              );
            }

            if (connection === "open") {
              startingSessions.delete(
                sessionId
              );

              clearReconnectTimer(
                sessionId
              );

              let phoneNumber = "";

              try {
                phoneNumber =
                  sessionManager.getPhoneNumber(
                    sessionId
                  ) || "";
              } catch {}

              if (
                !phoneNumber &&
                socket.user &&
                socket.user.id
              ) {
                phoneNumber =
                  socket.user.id
                    .split(":")[0]
                    .split("@")[0];
              }

              phoneNumber =
                cleanPhoneNumber(
                  phoneNumber
                );

              try {
                if (phoneNumber) {
                  sessionManager.setNumber(
                    sessionId,
                    phoneNumber
                  );
                }
              } catch {}

              sessionManager.setSocket(
                sessionId,
                socket
              );

              try {
                sessionManager.setStatus(
                  sessionId,
                  "connected"
                );
              } catch {}

              try {
                if (
                  typeof sessionManager.endPairing ===
                  "function"
                ) {
                  sessionManager.endPairing(
                    sessionId
                  );
                }
              } catch {}

              try {
                if (
                  settingsPanel &&
                  typeof settingsPanel.setBotConnected ===
                  "function"
                ) {
                  await settingsPanel.setBotConnected(
                    sessionId,
                    true
                  );
                }
              } catch (error) {
                console.warn(
                  `⚠️ Settings panel update failed (${sessionId}):`,
                  error?.message || error
                );
              }

              console.log(
                `✅ TOPFEROS MD konekte: ${sessionId}`
              );

              // ==================================================
              // SEND CONNECTION WELCOME MESSAGE
              // ==================================================

              await sendConnectionWelcome(
                socket,
                sessionId
              );
            }

            if (connection === "close") {
              startingSessions.delete(
                sessionId
              );

              const statusCode =
                lastDisconnect?.error?.output
                  ?.statusCode;

              console.log(
                `❌ TOPFEROS MD dekonekte (${sessionId})`,
                statusCode || ""
              );

              try {
                if (
                  settingsPanel &&
                  typeof settingsPanel.setBotConnected ===
                  "function"
                ) {
                  await settingsPanel.setBotConnected(
                    sessionId,
                    false
                  );
                }
              } catch {}

              if (
                statusCode ===
                DisconnectReason.loggedOut
              ) {
                try {
                  sessionManager.setStatus(
                    sessionId,
                    "logged_out"
                  );
                } catch {}

                stoppedSessions.add(
                  sessionId
                );

                console.log(
                  `🚪 Session logged out: ${sessionId}`
                );

                return;
              }

              if (
                statusCode ===
                DisconnectReason.connectionReplaced
              ) {
                try {
                  sessionManager.setStatus(
                    sessionId,
                    "disconnected"
                  );
                } catch {}

                console.log(
                  `⚠️ Connection replaced: ${sessionId}`
                );

                return;
              }

              try {
                sessionManager.setStatus(
                  sessionId,
                  "disconnected"
                );
              } catch {}

              scheduleReconnect(
                sessionId
              );
            }
          } catch (error) {
            console.error(
              `❌ connection.update error (${sessionId}):`,
              error?.stack ||
              error?.message ||
              error
            );
          }
        }
      );

      // ========================================================
      // INCOMING MESSAGES
      // ========================================================

      socket.ev.on(
        "messages.upsert",
        async (messageUpdate) => {
          await handleMessages(
            socket,
            messageUpdate,
            sessionId
          );
        }
      );

      sessionManager.setSocket(
        sessionId,
        socket
      );

      return socket;

    } finally {
      startingSessions.delete(
        sessionId
      );
    }
  })();

  startingPromises.set(
    sessionId,
    promise
  );

  try {
    return await promise;
  } finally {
    startingPromises.delete(
      sessionId
    );
  }
}

// ============================================================
// REQUEST PAIRING CODE
// ============================================================

async function requestPairingCode(number) {
  const phoneNumber =
    validatePhoneNumber(number);

  let session = null;

  try {
    if (
      typeof sessionManager.getSessionByNumber ===
      "function"
    ) {
      session =
        sessionManager.getSessionByNumber(
          phoneNumber
        );
    }
  } catch {}

  if (!session) {
    if (
      typeof sessionManager.createSession !==
      "function"
    ) {
      throw new Error(
        "createSession() is not available."
      );
    }

    session =
      await sessionManager.createSession({
        sessionId: phoneNumber,
        number: phoneNumber
      });
  }

  const sessionId =
    typeof session === "string"
      ? session
      : session.sessionId;

  if (!sessionId) {
    throw new Error(
      "Could not determine session ID."
    );
  }

  stoppedSessions.delete(
    sessionId
  );

  const currentSession =
    sessionManager.getSession(
      sessionId
    );

  if (
    currentSession &&
    currentSession.status ===
      "logged_out"
  ) {
    try {
      await stopSession(
        sessionId
      );
    } catch {}

    try {
      await sessionManager.resetAuth(
        sessionId
      );
    } catch {}

    try {
      sessionManager.updateSession(
        sessionId,
        {
          status: "idle",
          connected: false
        }
      );
    } catch {}
  }

  const freshSession =
    sessionManager.getSession(
      sessionId
    );

  if (
    freshSession &&
    freshSession.socket &&
    freshSession.socket.user
  ) {
    return {
      success: true,
      sessionId,
      number: phoneNumber,
      status: "connected",
      message:
        "WhatsApp already connected."
    };
  }

  try {
    if (
      typeof sessionManager.getPairingSession ===
      "function"
    ) {
      const pairing =
        sessionManager.getPairingSession(
          sessionId
        );

      if (
        pairing &&
        pairing.pairingCode
      ) {
        return {
          success: true,
          sessionId,
          number: phoneNumber,
          status: "pairing",
          code: pairing.pairingCode,
          message:
            "Pairing code already generated."
        };
      }
    }
  } catch {}

  try {
    if (
      typeof sessionManager.startPairing ===
      "function"
    ) {
      sessionManager.startPairing(
        sessionId
      );
    }
  } catch {}

  const socket =
    await startSession(
      sessionId
    );

  if (!socket) {
    throw new Error(
      "Socket could not be started."
    );
  }

  // ============================================================
  // REQUEST PAIRING CODE
  // ============================================================

  const code =
    await socket.requestPairingCode(
      phoneNumber
    );

  const normalizedCode =
    String(code || "")
      .replace(/[\s-]/g, "")
      .toUpperCase();

  try {
    if (
      typeof sessionManager.setNumber ===
      "function"
    ) {
      sessionManager.setNumber(
        sessionId,
        phoneNumber
      );
    }
  } catch {}

  try {
    if (
      typeof sessionManager.setPairingCode ===
      "function"
    ) {
      sessionManager.setPairingCode(
        sessionId,
        normalizedCode
      );
    }
  } catch {}

  try {
    if (
      typeof sessionManager.setStatus ===
      "function"
    ) {
      sessionManager.setStatus(
        sessionId,
        "pairing"
      );
    }
  } catch {}

  return {
    success: true,
    sessionId,
    number: phoneNumber,
    status: "pairing",
    code: normalizedCode,
    message:
      "Pairing code generated successfully."
  };
}

// ============================================================
// RESTORE STORED SESSIONS
// ============================================================

async function restoreStoredSessions() {
  try {
    let sessionIds = [];

    if (
      typeof sessionManager.getStoredSessionIds ===
      "function"
    ) {
      sessionIds =
        await sessionManager.getStoredSessionIds();
    } else if (
      typeof sessionManager.listSessionIds ===
      "function"
    ) {
      sessionIds =
        await sessionManager.listSessionIds();
    }

    if (!Array.isArray(sessionIds)) {
      return;
    }

    for (const sessionId of sessionIds) {
      try {
        await startSession(
          sessionId
        );
      } catch (error) {
        console.error(
          `❌ Failed restoring session ${sessionId}:`,
          error?.message || error
        );
      }
    }
  } catch (error) {
    console.error(
      "❌ Restore sessions error:",
      error?.stack ||
      error?.message ||
      error
    );
  }
}

// ============================================================
// STOP SESSION
// ============================================================

async function stopSession(sessionId) {
  if (!sessionId) return;

  stoppedSessions.add(
    sessionId
  );

  clearReconnectTimer(
    sessionId
  );

  const socket =
    sessionManager.getSocket(
      sessionId
    );

  if (socket) {
    try {
      socket.end(
        new Error("Session stopped")
      );
    } catch {}
  }

  try {
    sessionManager.setSocket(
      sessionId,
      null
    );
  } catch {}

  try {
    sessionManager.setStatus(
      sessionId,
      "disconnected"
    );
  } catch {}

  startingSessions.delete(
    sessionId
  );

  startingPromises.delete(
    sessionId
  );
}

// ============================================================
// REMOVE SESSION
// ============================================================

async function removeSession(sessionId) {
  if (!sessionId) return;

  await stopSession(
    sessionId
  );

  try {
    await sessionManager.removeSession(
      sessionId
    );
  } catch (error) {
    console.error(
      `❌ Remove session error (${sessionId}):`,
      error?.message || error
    );
  }
}

// ============================================================
// STOP ALL
// ============================================================

async function stop() {
  console.log(
    "🛑 Stopping TOPFEROS MD..."
  );

  const sessions =
    typeof sessionManager.getAllSessions ===
    "function"
      ? sessionManager.getAllSessions()
      : [];

  if (Array.isArray(sessions)) {
    for (const session of sessions) {
      if (session?.sessionId) {
        await stopSession(
          session.sessionId
        );
      }
    }
  }

  for (const timer of reconnectTimers.values()) {
    clearTimeout(timer);
  }

  reconnectTimers.clear();

  console.log(
    "✅ TOPFEROS MD stopped."
  );
}

// ============================================================
// HELPERS
// ============================================================

function getPhoneNumber(sessionId) {
  try {
    const session =
      sessionManager.getSession(
        sessionId
      );

    if (
      session &&
      session.number
    ) {
      return cleanPhoneNumber(
        session.number
      );
    }

    const socket =
      sessionManager.getSocket(
        sessionId
      );

    if (
      socket &&
      socket.user &&
      socket.user.id
    ) {
      return cleanPhoneNumber(
        socket.user.id
          .split(":")[0]
          .split("@")[0]
      );
    }
  } catch {}

  return "";
}

function isConnected(sessionId) {
  try {
    const session =
      sessionManager.getSession(
        sessionId
      );

    return Boolean(
      session &&
      (
        session.status === "connected" ||
        session.connected === true
      )
    );
  } catch {
    return false;
  }
}

function getPairingInfo(sessionId) {
  try {
    const session =
      sessionManager.getSession(
        sessionId
      );

    if (!session) return null;

    return {
      sessionId,
      number:
        session.number || "",
      status:
        session.status || "idle",
      pairingCode:
        session.pairingCode || null,
      pairingStartedAt:
        session.pairingStartedAt || null
    };
  } catch {
    return null;
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  start: restoreStoredSessions,
  startSession,
  restoreStoredSessions,
  requestPairingCode,
  createSocket,
  stopSession,
  removeSession,
  stop,
  getPhoneNumber,
  isConnected,
  getPairingInfo,
  scheduleReconnect,
  clearReconnectTimer
};
       