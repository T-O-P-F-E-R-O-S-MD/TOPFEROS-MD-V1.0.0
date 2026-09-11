"use strict";

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const path = require("path");

const sessionManager = require("./sessionManager");
const settingsPanel = require("../settings/panel");
const messageHandler = require("./messageHandler");

// ============================================================
// STATE
// ============================================================

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
  if (typeof number !== "string" && typeof number !== "number") {
    return "";
  }

  return String(number).replace(/\D/g, "");
}

function validatePhoneNumber(number) {
  const phone = cleanPhoneNumber(number);

  if (!phone) {
    return {
      valid: false,
      number: "",
      error: "Nimewo WhatsApp la obligatwa."
    };
  }

  // WhatsApp international numbers generally use 7–15 digits.
  if (phone.length < 7 || phone.length > 15) {
    return {
      valid: false,
      number: phone,
      error: "Nimewo WhatsApp la pa valid."
    };
  }

  return {
    valid: true,
    number: phone,
    error: null
  };
}

// ============================================================
// MESSAGE HANDLER
// ============================================================

async function handleMessages(update) {
  try {
    if (!update || !update.messages) {
      return;
    }

    if (typeof messageHandler === "function") {
      await messageHandler(update);
      return;
    }

    if (messageHandler && typeof messageHandler.handleMessages === "function") {
      await messageHandler.handleMessages(update);
      return;
    }

    if (messageHandler && typeof messageHandler.handle === "function") {
      await messageHandler.handle(update);
    }
  } catch (error) {
    console.error("❌ Erè nan message handler:", error);
  }
}

// ============================================================
// SOCKET READY
// ============================================================

function createSocketReadyPromise(sessionId, socket) {
  if (!sessionId || !socket) {
    return Promise.reject(
      new Error("Session ID oswa socket la pa disponib.")
    );
  }

  const existing = socketReadyPromises.get(sessionId);

  if (existing && existing.socket === socket) {
    return existing.promise;
  }

  let timer = null;
  let settled = false;

  let resolvePromise;
  let rejectPromise;

  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const cleanup = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    const current = socketReadyPromises.get(sessionId);

    if (current && current.promise === promise) {
      socketReadyPromises.delete(sessionId);
    }
  };

  const resolveReady = () => {
    if (settled) return;

    settled = true;
    cleanup();
    resolvePromise(socket);
  };

  const rejectReady = (error) => {
    if (settled) return;

    settled = true;
    cleanup();
    rejectPromise(error);
  };

  try {
    socket.ev.on("connection.update", ({ connection }) => {
      if (connection === "connecting" || connection === "open") {
        resolveReady();
      }

      if (connection === "close") {
        rejectReady(
          new Error("Koneksyon socket la fèmen avan li te pare.")
        );
      }
    });
  } catch (error) {
    rejectReady(error);
  }

  timer = setTimeout(() => {
    rejectReady(
      new Error("Socket la pa vin pare nan delè 30 segonn.")
    );
  }, SOCKET_READY_TIMEOUT);

  socketReadyPromises.set(sessionId, {
    socket,
    promise
  });

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
  if (!sessionId) {
    return;
  }

  if (stoppedSessions.has(sessionId)) {
    return;
  }

  clearReconnectTimer(sessionId);

  const timer = setTimeout(async () => {
    reconnectTimers.delete(sessionId);

    if (stoppedSessions.has(sessionId)) {
      return;
    }

    try {
      const session = sessionManager.getSession(sessionId);

      if (!session) {
        return;
      }

      if (session.status === "logged_out") {
        return;
      }

      console.log(`🔄 Rekonekte session: ${sessionId}`);

      await startSession(sessionId);
    } catch (error) {
      console.error(
        `❌ Erè pandan rekoneksyon ${sessionId}:`,
        error?.message || error
      );

      if (!stoppedSessions.has(sessionId)) {
        scheduleReconnect(sessionId);
      }
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
    throw new Error("Session pa jwenn.");
  }

  if (!session.authDir) {
    throw new Error("Auth directory session lan pa disponib.");
  }

  const { state, saveCreds } = await useMultiFileAuthState(
    session.authDir
  );

  let version;

  try {
    const latest = await fetchLatestBaileysVersion();

    if (latest && latest.version) {
      version = latest.version;
    }
  } catch (error) {
    console.warn(
      "⚠️ Pa kapab jwenn dènye vèsyon Baileys:",
      error?.message || error
    );
  }

  const socketConfig = {
    auth: state,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    browser: ["TOPFEROS MD", "Chrome", "1.0.0"]
  };

  if (version) {
    socketConfig.version = version;
  }

  const socket = makeWASocket(socketConfig);

  // Save WhatsApp credentials.
  socket.ev.on("creds.update", async () => {
    try {
      await saveCreds();
    } catch (error) {
      console.error(
        "❌ Erè saveCreds:",
        error?.message || error
      );
    }
  });

  sessionManager.setSocket(sessionId, socket);

  // Create the ready promise immediately.
  createSocketReadyPromise(sessionId, socket).catch(() => {
    // Error is handled by startSession/requestPairingCode.
  });

  return socket;
}

// ============================================================
// START SESSION
// ============================================================

async function startSession(sessionId) {
  if (!sessionId) {
    throw new Error("Session ID obligatwa.");
  }

  const existingStart = startingPromises.get(sessionId);

  if (existingStart) {
    return existingStart;
  }

  const startPromise = (async () => {
    if (stoppedSessions.has(sessionId)) {
      throw new Error("Session sa a te kanpe.");
    }

    const session = sessionManager.getSession(sessionId);

    if (!session) {
      throw new Error("Session pa jwenn.");
    }

    if (session.status === "logged_out") {
      throw new Error(
        "Session sa a dekonekte. Fè yon nouvo pairing code."
      );
    }

    if (session.socket && session.socket.user) {
      try {
        sessionManager.setStatus(sessionId, "connected");
        return session.socket;
      } catch (_) {
        // Continue and recreate socket if necessary.
      }
    }

    startingSessions.add(sessionId);

    sessionManager.setStatus(sessionId, "connecting");

    let socket = sessionManager.getSocket(sessionId);

    if (!socket) {
      socket = await createSocket(sessionId);
    }

    // ----------------------------------------------------------
    // CONNECTION UPDATE
    // ----------------------------------------------------------

    socket.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect
        } = update;

        try {
          // CONNECTING
          if (connection === "connecting") {
            sessionManager.setStatus(
              sessionId,
              "connecting"
            );

            console.log(
              `🔄 TOPFEROS MD ap konekte: ${sessionId}`
            );
          }

          // OPEN
          if (connection === "open") {
            startingSessions.delete(sessionId);
            clearReconnectTimer(sessionId);

            let phoneNumber =
              sessionManager.getPhoneNumber(sessionId);

            if (
              !phoneNumber &&
              socket.user &&
              socket.user.id
            ) {
              phoneNumber = cleanPhoneNumber(
                socket.user.id.split(":")[0]
              );
            }

            if (phoneNumber) {
              try {
                sessionManager.setNumber(
                  sessionId,
                  phoneNumber
                );
              } catch (error) {
                console.error(
                  "❌ Erè setNumber:",
                  error?.message || error
                );
              }
            }

            sessionManager.setSocket(
              sessionId,
              socket
            );

            sessionManager.setStatus(
              sessionId,
              "connected"
            );

            if (
              typeof sessionManager.endPairing ===
              "function"
            ) {
              sessionManager.endPairing(sessionId);
            }

            try {
              if (
                settingsPanel &&
                typeof settingsPanel.setBotConnected ===
                  "function"
              ) {
                settingsPanel.setBotConnected(
                  sessionId,
                  true
                );
              }
            } catch (error) {
              console.warn(
                "⚠️ settingsPanel.setBotConnected:",
                error?.message || error
              );
            }

            console.log(
              `✅ TOPFEROS MD konekte: ${sessionId}`
            );
          }

          // CLOSE
          if (connection === "close") {
            startingSessions.delete(sessionId);

            let statusCode = null;

            try {
              statusCode =
                lastDisconnect?.error?.output
                  ?.statusCode || null;
            } catch (_) {
              statusCode = null;
            }

            const loggedOut =
              statusCode === DisconnectReason.loggedOut;

            const connectionReplaced =
              statusCode ===
              DisconnectReason.connectionReplaced;

            const shouldReconnect =
              !loggedOut &&
              !connectionReplaced &&
              !stoppedSessions.has(sessionId);

            sessionManager.setSocket(
              sessionId,
              null
            );

            if (loggedOut) {
              sessionManager.setStatus(
                sessionId,
                "logged_out"
              );

              if (
                typeof sessionManager.endPairing ===
                "function"
              ) {
                sessionManager.endPairing(sessionId);
              }

              try {
                if (
                  settingsPanel &&
                  typeof settingsPanel.setBotConnected ===
                    "function"
                ) {
                  settingsPanel.setBotConnected(
                    sessionId,
                    false
                  );
                }
              } catch (_) {}

              console.log(
                `🔴 Session ${sessionId} dekonekte: LOGGED OUT`
              );

              return;
            }

            if (connectionReplaced) {
              sessionManager.setStatus(
                sessionId,
                "disconnected"
              );

              console.log(
                `⚠️ Session ${sessionId} ranplase pa yon lòt koneksyon.`
              );

              return;
            }

            sessionManager.setStatus(
              sessionId,
              "disconnected"
            );

            try {
              if (
                settingsPanel &&
                typeof settingsPanel.setBotConnected ===
                  "function"
              ) {
                settingsPanel.setBotConnected(
                  sessionId,
                  false
                );
              }
            } catch (_) {}

            console.log(
              `⚠️ Session ${sessionId} fèmen.`
            );

            if (shouldReconnect) {
              scheduleReconnect(sessionId);
            }
          }
        } catch (error) {
          console.error(
            `❌ Erè connection.update (${sessionId}):`,
            error?.message || error
          );
        }
      }
    );

    // ----------------------------------------------------------
    // INCOMING MESSAGES
    // ----------------------------------------------------------

    socket.ev.on(
      "messages.upsert",
      async (messageUpdate) => {
        await handleMessages(messageUpdate);
      }
    );

    sessionManager.setSocket(
      sessionId,
      socket
    );

    return socket;
  })();

  startingPromises.set(sessionId, startPromise);

  try {
    return await startPromise;
  } finally {
    startingPromises.delete(sessionId);
    startingSessions.delete(sessionId);
  }
}

// ============================================================
// REQUEST PAIRING CODE
// ============================================================

async function requestPairingCode(number) {
  const validation = validatePhoneNumber(number);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const phoneNumber = validation.number;

  console.log(
    `📱 Demann pairing code pou: ${phoneNumber}`
  );

  // ----------------------------------------------------------
  // GET OR CREATE SESSION
  // ----------------------------------------------------------

  let session =
    sessionManager.getSessionByNumber(phoneNumber);

  if (!session) {
    session = sessionManager.createSession(
      phoneNumber
    );
  }

  if (!session || !session.id) {
    throw new Error(
      "Pa kapab kreye session pou nimewo sa a."
    );
  }

  const sessionId = session.id;

  stoppedSessions.delete(sessionId);

  // ----------------------------------------------------------
  // LOGGED OUT
  // ----------------------------------------------------------

  if (session.status === "logged_out") {
    console.log(
      `♻️ Reset auth pou nouvo pairing: ${sessionId}`
    );

    try {
      await stopSession(sessionId);
    } catch (_) {}

    if (
      typeof sessionManager.resetAuth ===
      "function"
    ) {
      await sessionManager.resetAuth(sessionId);
    }

    session =
      sessionManager.getSession(sessionId);

    if (!session) {
      throw new Error(
        "Session disparèt apre reset auth."
      );
    }
  }

  // ----------------------------------------------------------
  // ALREADY CONNECTED
  // ----------------------------------------------------------

  if (
    session.status === "connected" &&
    session.socket
  ) {
    return {
      success: true,
      sessionId,
      number: phoneNumber,
      status: "connected",
      code: null,
      message: "Bot la deja konekte."
    };
  }

  // ----------------------------------------------------------
  // EXISTING VALID PAIRING CODE
  // ----------------------------------------------------------

  if (
    session.pairing &&
    session.pairingCode
  ) {
    return {
      success: true,
      sessionId,
      number: phoneNumber,
      status: "pairing",
      code: session.pairingCode,
      message: "Pairing code la deja disponib."
    };
  }

  // ----------------------------------------------------------
  // START PAIRING
  // ----------------------------------------------------------

  if (
    typeof sessionManager.startPairing ===
    "function"
  ) {
    sessionManager.startPairing(sessionId);
  }

  let socket =
    sessionManager.getSocket(sessionId);

  try {
    // Create socket if one doesn't exist.
    if (!socket) {
      socket = await startSession(sessionId);
    }

    // Make sure the socket is ready enough.
    try {
      await createSocketReadyPromise(
        sessionId,
        socket
      );
    } catch (readyError) {
      console.warn(
        "⚠️ Socket ready warning:",
        readyError?.message || readyError
      );

      // If socket disappeared, create a fresh one.
      const currentSocket =
        sessionManager.getSocket(sessionId);

      if (!currentSocket) {
        socket = await startSession(sessionId);
      } else {
        socket = currentSocket;
      }
    }

    // --------------------------------------------------------
    // CHECK BAILEYS METHOD
    // --------------------------------------------------------

    if (
      !socket ||
      typeof socket.requestPairingCode !==
        "function"
    ) {
      throw new Error(
        "Baileys socket la pa gen requestPairingCode()."
      );
    }

    // --------------------------------------------------------
    // REQUEST CODE
    // --------------------------------------------------------

    console.log(
      `🔐 TOPFEROS MD ap mande pairing code pou ${phoneNumber}...`
    );

    const rawCode =
      await socket.requestPairingCode(
        phoneNumber
      );

    if (!rawCode) {
      throw new Error(
        "WhatsApp pa retounen okenn pairing code."
      );
    }

    const code = String(rawCode)
      .replace(/[\s-]/g, "")
      .trim();

    if (!code) {
      throw new Error(
        "Pairing code la vid."
      );
    }

    // --------------------------------------------------------
    // SAVE SESSION DATA
    // --------------------------------------------------------

    try {
      sessionManager.setNumber(
        sessionId,
        phoneNumber
      );
    } catch (error) {
      console.warn(
        "⚠️ setNumber warning:",
        error?.message || error
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

    if (
      typeof sessionManager.setStatus ===
      "function"
    ) {
      sessionManager.setStatus(
        sessionId,
        "pairing"
      );
    }

    console.log(
      `✅ Pairing code pwodwi pou ${phoneNumber}: ${code}`
    );

    return {
      success: true,
      sessionId,
      number: phoneNumber,
      status: "pairing",
      code,
      message:
        "Pairing code la pwodwi avèk siksè."
    };
  } catch (error) {
    console.error(
      `❌ Erè pairing code (${phoneNumber}):`,
      error?.message || error
    );

    try {
      if (
        typeof sessionManager.endPairing ===
        "function"
      ) {
        sessionManager.endPairing(sessionId);
      }
    } catch (_) {}

    try {
      if (
        typeof sessionManager.setStatus ===
        "function"
      ) {
        sessionManager.setStatus(
          sessionId,
          "error"
        );
      }
    } catch (_) {}

    throw error;
  }
}

// ============================================================
// RESTORE STORED SESSIONS
// ============================================================

async function restoreStoredSessions() {
  if (
    typeof sessionManager.getStoredSessionIds !==
    "function"
  ) {
    console.warn(
      "⚠️ sessionManager.getStoredSessionIds() pa disponib."
    );

    return [];
  }

  const sessionIds =
    sessionManager.getStoredSessionIds();

  if (!Array.isArray(sessionIds)) {
    return [];
  }

  const restored = [];

  for (const sessionId of sessionIds) {
    try {
      const session =
        sessionManager.getSession(sessionId);

      if (!session) {
        continue;
      }

      // Do not automatically reconnect logged-out sessions.
      if (session.status === "logged_out") {
        console.log(
          `⏭️ Session ${sessionId} logged out — pa restore otomatik.`
        );
        continue;
      }

      if (
        typeof sessionManager.restoreSession ===
        "function"
      ) {
        await sessionManager.restoreSession(
          sessionId
        );
      }

      await startSession(sessionId);

      restored.push(sessionId);

      console.log(
        `✅ Session restore: ${sessionId}`
      );
    } catch (error) {
      console.error(
        `❌ Pa kapab restore ${sessionId}:`,
        error?.message || error
      );
    }
  }

  return restored;
}

// ============================================================
// STOP SESSION
// ============================================================

async function stopSession(sessionId) {
  if (!sessionId) {
    return false;
  }

  stoppedSessions.add(sessionId);

  clearReconnectTimer(sessionId);

  const ready =
    socketReadyPromises.get(sessionId);

  if (ready) {
    socketReadyPromises.delete(sessionId);
  }

  const socket =
    sessionManager.getSocket(sessionId);

  if (socket) {
    try {
      if (typeof socket.end === "function") {
        socket.end(
          new Error(
            "TOPFEROS MD session stopped."
          )
        );
      }
    } catch (error) {
      console.warn(
        `⚠️ Erè pandan stop socket ${sessionId}:`,
        error?.message || error
      );
    }
  }

  try {
    sessionManager.setSocket(
      sessionId,
      null
    );
  } catch (_) {}

  try {
    sessionManager.setStatus(
      sessionId,
      "disconnected"
    );
  } catch (_) {}

  try {
    if (
      typeof sessionManager.endPairing ===
      "function"
    ) {
      sessionManager.endPairing(sessionId);
    }
  } catch (_) {}

  return true;
}

// ============================================================
// STOP ALL
// ============================================================

async function stop() {
  const sessions =
    typeof sessionManager.getAllSessions ===
    "function"
      ? sessionManager.getAllSessions()
      : [];

  if (!Array.isArray(sessions)) {
    return;
  }

  await Promise.allSettled(
    sessions.map((session) => {
      if (session && session.id) {
        return stopSession(session.id);
      }

      return null;
    })
  );

  console.log(
    "🛑 Tout TOPFEROS MD sessions yo kanpe."
  );
}

// ============================================================
// REMOVE SESSION
// ============================================================

async function removeSession(sessionId) {
  if (!sessionId) {
    return false;
  }

  try {
    await stopSession(sessionId);
  } catch (_) {}

  stoppedSessions.add(sessionId);

  clearReconnectTimer(sessionId);

  try {
    if (
      typeof sessionManager.removeSession ===
      "function"
    ) {
      return await sessionManager.removeSession(
        sessionId
      );
    }

    if (
      typeof sessionManager.deleteSession ===
      "function"
    ) {
      return await sessionManager.deleteSession(
        sessionId
      );
    }
  } catch (error) {
    console.error(
      `❌ Erè remove session ${sessionId}:`,
      error?.message || error
    );

    throw error;
  }

  return false;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Main
  start: restoreStoredSessions,
  stop,

  // Sessions
  startSession,
  stopSession,
  removeSession,
  restoreStoredSessions,

  // Pairing
  requestPairingCode,

  // Session Manager compatibility
  createSession: sessionManager.createSession,
  getSession: sessionManager.getSession,
  getAllSessions: sessionManager.getAllSessions,
  getSocket: sessionManager.getSocket,
  isConnected: sessionManager.isConnected,
  getPhoneNumber: sessionManager.getPhoneNumber,
  getPairingInfo: sessionManager.getPairingInfo,

  // Helpers
  cleanPhoneNumber,
  validatePhoneNumber
};