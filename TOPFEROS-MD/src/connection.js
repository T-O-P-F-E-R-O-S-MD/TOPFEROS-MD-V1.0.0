"use strict";

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");

const sessionManager =
  require("./sessionManager");

const settingsPanel =
  require("../settings/panel");

const messageHandler =
  require("./messageHandler");

// ============================================================
// STATE
// ============================================================

const reconnectTimers = new Map();
const startingSessions = new Set();
const startingPromises = new Map();
const stoppedSessions = new Set();
const socketReadyPromises = new Map();

// ============================================================
// PHONE HELPERS
// ============================================================

function cleanPhoneNumber(number) {
  return sessionManager.cleanPhoneNumber(number);
}

function validatePhoneNumber(number) {
  return sessionManager.validatePhoneNumber(number);
}

// ============================================================
// MESSAGE HANDLER
// ============================================================

async function handleMessages(sessionId, messages) {
  const socket =
    sessionManager.getSocket(sessionId);

  if (!socket) {
    return;
  }

  for (const message of messages || []) {
    try {
      await messageHandler.handleMessage(
        socket,
        message,
        sessionId
      );
    } catch (error) {
      console.error(
        `❌ MESSAGE ERROR ${sessionId}:`,
        error?.message || error
      );
    }
  }
}

// ============================================================
// RECONNECT
// ============================================================

function scheduleReconnect(sessionId) {
  if (!sessionId) {
    return;
  }

  if (stoppedSessions.has(sessionId)) {
    return;
  }

  if (reconnectTimers.has(sessionId)) {
    return;
  }

  const timer = setTimeout(async () => {
    reconnectTimers.delete(sessionId);

    if (stoppedSessions.has(sessionId)) {
      return;
    }

    try {
      await startSession(sessionId);
    } catch (error) {
      console.error(
        `❌ RECONNECT ERROR ${sessionId}:`,
        error?.message || error
      );
    }
  }, 5000);

  reconnectTimers.set(
    sessionId,
    timer
  );
}

// ============================================================
// SOCKET READY
//
// We need to know when Baileys has actually started connecting.
// Pairing code must NOT be requested before this point.
//
// IMPORTANT:
// The listener is attached immediately when the socket is
// created so we don't miss the "connecting" event.
// ============================================================

function createSocketReadyPromise(
  sessionId,
  socket
) {
  if (!socket) {
    return Promise.reject(
      new Error(
        "WhatsApp socket is unavailable."
      )
    );
  }

  const existing =
    socketReadyPromises.get(sessionId);

  if (existing) {
    return existing;
  }

  const promise =
    new Promise((resolve, reject) => {
      let finished = false;

      const cleanup = () => {
        try {
          socket.ev.off(
            "connection.update",
            listener
          );
        } catch {}

        socketReadyPromises.delete(
          sessionId
        );
      };

      const succeed = () => {
        if (finished) {
          return;
        }

        finished = true;
        cleanup();
        resolve(socket);
      };

      const fail = (error) => {
        if (finished) {
          return;
        }

        finished = true;
        cleanup();
        reject(error);
      };

      const listener = (update) => {
        const {
          connection,
          lastDisconnect
        } = update || {};

        if (
          connection === "connecting" ||
          connection === "open"
        ) {
          succeed();
          return;
        }

        if (connection === "close") {
          const code =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;

          fail(
            new Error(
              `WhatsApp socket closed before it became ready. Status code: ${code || "unknown"}`
            )
          );
        }
      };

      socket.ev.on(
        "connection.update",
        listener
      );

      // Safety timeout
      setTimeout(() => {
        fail(
          new Error(
            "WhatsApp socket did not start connecting within 30 seconds."
          )
        );
      }, 30000);
    });

  socketReadyPromises.set(
    sessionId,
    promise
  );

  return promise;
}

// ============================================================
// CREATE SOCKET
// ============================================================

async function createSocket(sessionId) {
  if (!sessionId) {
    throw new Error(
      "Session ID is required."
    );
  }

  const session =
    sessionManager.getSession(sessionId);

  if (!session) {
    throw new Error(
      `Session not found: ${sessionId}`
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
    `🔌 Creating WhatsApp socket: ${sessionId}`
  );

  const socket = makeWASocket({
    version,

    auth: state,

    logger: pino({
      level: "silent"
    }),

    browser:
      Browsers.ubuntu("Chrome"),

    printQRInTerminal: false,

    generateHighQualityLinkPreview:
      false,

    markOnlineOnConnect:
      false,

    syncFullHistory:
      false,

    connectTimeoutMs:
      60000,

    defaultQueryTimeoutMs:
      60000,

    keepAliveIntervalMs:
      30000
  });

  // Save authentication credentials
  socket.ev.on(
    "creds.update",
    saveCreds
  );

  // Store socket immediately
  sessionManager.setSocket(
    sessionId,
    socket
  );

  // IMPORTANT:
  // Create readiness watcher immediately so we cannot miss
  // the first "connecting" event.
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
    throw new Error(
      "Session ID is required."
    );
  }

  const session =
    sessionManager.getSession(sessionId);

  if (!session) {
    throw new Error(
      `Session not found: ${sessionId}`
    );
  }

  // Already connected
  if (
    sessionManager.isConnected(
      sessionId
    )
  ) {
    return session.socket;
  }

  // Already starting
  if (
    startingPromises.has(sessionId)
  ) {
    return startingPromises.get(
      sessionId
    );
  }

  stoppedSessions.delete(
    sessionId
  );

  const startPromise =
    (async () => {
      startingSessions.add(
        sessionId
      );

      sessionManager.setStatus(
        sessionId,
        "connecting",
        false
      );

      try {
        const socket =
          await createSocket(
            sessionId
          );

        // ====================================================
        // CONNECTION UPDATE
        // ====================================================

        socket.ev.on(
          "connection.update",
          async (update) => {
            try {
              const {
                connection,
                lastDisconnect
              } = update || {};

              // ----------------------------------------------
              // CONNECTING
              // ----------------------------------------------

              if (
                connection === "connecting"
              ) {
                sessionManager.setStatus(
                  sessionId,
                  "connecting",
                  false
                );

                console.log(
                  `🔄 WHATSAPP CONNECTING: ${sessionId}`
                );

                return;
              }

              // ----------------------------------------------
              // CONNECTED
              // ----------------------------------------------

              if (
                connection === "open"
              ) {
                const number =
                  socket?.user?.id
                    ?.split(":")[0]
                    ?.replace(
                      /@.+$/,
                      ""
                    ) || null;

                if (number) {
                  sessionManager.setNumber(
                    sessionId,
                    number
                  );
                }

                sessionManager.setSocket(
                  sessionId,
                  socket
                );

                sessionManager.setStatus(
                  sessionId,
                  "connected",
                  true
                );

                sessionManager.endPairing(
                  sessionId
                );

                startingSessions.delete(
                  sessionId
                );

                stoppedSessions.delete(
                  sessionId
                );

                try {
                  settingsPanel.setBotConnected(
                    socket,
                    sessionId
                  );
                } catch (error) {
                  console.error(
                    "⚠️ SETTINGS CONNECT ERROR:",
                    error?.message || error
                  );
                }

                console.log(
                  "========================================"
                );

                console.log(
                  "✅ WHATSAPP CONNECTED"
                );

                console.log(
                  `🆔 SESSION: ${sessionId}`
                );

                console.log(
                  `📱 NUMBER: ${number || "unknown"}`
                );

                console.log(
                  "========================================"
                );

                return;
              }

              // ----------------------------------------------
              // CLOSED
              // ----------------------------------------------

              if (
                connection === "close"
              ) {
                startingSessions.delete(
                  sessionId
                );

                const code =
                  lastDisconnect
                    ?.error
                    ?.output
                    ?.statusCode;

                const loggedOut =
                  code ===
                  DisconnectReason.loggedOut;

                const replaced =
                  code ===
                  DisconnectReason.connectionReplaced;

                sessionManager.setSocket(
                  sessionId,
                  null
                );

                sessionManager.endPairing(
                  sessionId
                );

                sessionManager.setStatus(
                  sessionId,
                  loggedOut
                    ? "logged_out"
                    : "disconnected",
                  false
                );

                try {
                  settingsPanel.setBotDisconnected(
                    sessionId
                  );
                } catch {}

                console.log(
                  "========================================"
                );

                console.log(
                  "⚠️ WHATSAPP CONNECTION CLOSED"
                );

                console.log(
                  `🆔 SESSION: ${sessionId}`
                );

                console.log(
                  `⚠️ STATUS CODE: ${code || "unknown"}`
                );

                console.log(
                  `⚠️ LOGGED OUT: ${loggedOut}`
                );

                console.log(
                  `⚠️ REPLACED: ${replaced}`
                );

                console.log(
                  "========================================"
                );

                if (
                  !loggedOut &&
                  !replaced &&
                  !stoppedSessions.has(
                    sessionId
                  )
                ) {
                  scheduleReconnect(
                    sessionId
                  );
                }
              }

            } catch (error) {
              console.error(
                `❌ CONNECTION UPDATE ERROR ${sessionId}:`,
                error?.message || error
              );
            }
          }
        );

        // ====================================================
        // MESSAGES
        // ====================================================

        socket.ev.on(
          "messages.upsert",
          async ({
            messages
          }) => {
            await handleMessages(
              sessionId,
              messages
            );
          }
        );

        return socket;

      } catch (error) {
        startingSessions.delete(
          sessionId
        );

        sessionManager.setSocket(
          sessionId,
          null
        );

        sessionManager.setStatus(
          sessionId,
          "error",
          false
        );

        console.error(
          `❌ START SESSION ERROR ${sessionId}:`,
          error?.message || error
        );

        scheduleReconnect(
          sessionId
        );

        throw error;
      }
    })();

  startingPromises.set(
    sessionId,
    startPromise
  );

  try {
    return await startPromise;
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
    cleanPhoneNumber(number);

  if (
    !validatePhoneNumber(
      phoneNumber
    )
  ) {
    const error =
      new Error(
        "Invalid WhatsApp phone number."
      );

    error.code =
      "INVALID_PHONE_NUMBER";

    throw error;
  }

  let session =
    sessionManager.getSessionByNumber(
      phoneNumber
    );

  // ----------------------------------------------------------
  // EXISTING PAIRING
  // ----------------------------------------------------------

  if (session?.pairing) {
    const error =
      new Error(
        "Pairing code request already in progress."
      );

    error.code =
      "PAIRING_IN_PROGRESS";

    throw error;
  }

  // ----------------------------------------------------------
  // CREATE OR REUSE SESSION
  // ----------------------------------------------------------

  if (!session) {
    session =
      sessionManager.createSession({
        number: phoneNumber
      });
  } else {
    sessionManager.setNumber(
      session.sessionId,
      phoneNumber
    );
  }

  const sessionId =
    session.sessionId;

  try {
    console.log(
      "========================================"
    );

    console.log(
      "🔐 NEW PAIRING REQUEST"
    );

    console.log(
      `📱 NUMBER: ${phoneNumber}`
    );

    console.log(
      `🆔 SESSION: ${sessionId}`
    );

    console.log(
      "========================================"
    );

    // Lock this session into pairing state
    sessionManager.startPairing(
      sessionId
    );

    // --------------------------------------------------------
    // GET / CREATE SOCKET
    // --------------------------------------------------------

    let socket =
      sessionManager.getSocket(
        sessionId
      );

    if (!socket) {
      socket =
        await startSession(
          sessionId
        );
    } else if (
      startingPromises.has(
        sessionId
      )
    ) {
      socket =
        await startingPromises.get(
          sessionId
        );
    }

    if (!socket) {
      throw new Error(
        "Unable to create WhatsApp socket."
      );
    }

    // --------------------------------------------------------
    // WAIT FOR BAILEYS TO START CONNECTING
    //
    // DO NOT wait for "open".
    // Pairing code must be requested before WhatsApp is open.
    // --------------------------------------------------------

    console.log(
      `⏳ Waiting for WhatsApp socket: ${sessionId}`
    );

    await createSocketReadyPromise(
      sessionId,
      socket
    );

    // --------------------------------------------------------
    // REQUEST REAL PAIRING CODE
    // --------------------------------------------------------

    console.log(
      `📲 Requesting pairing code: ${phoneNumber}`
    );

    const code =
      await socket.requestPairingCode(
        phoneNumber
      );

    const normalizedCode =
      String(code || "")
        .replace(
          /[^A-Z0-9]/gi,
          ""
        )
        .toUpperCase();

    if (!normalizedCode) {
      throw new Error(
        "WhatsApp did not return a pairing code."
      );
    }

    sessionManager.setPairingCode(
      sessionId,
      normalizedCode
    );

    sessionManager.setStatus(
      sessionId,
      "pairing",
      false
    );

    console.log(
      "========================================"
    );

    console.log(
      "🔑 PAIRING CODE GENERATED"
    );

    console.log(
      `📱 NUMBER: ${phoneNumber}`
    );

    console.log(
      `🆔 SESSION: ${sessionId}`
    );

    console.log(
      `🔐 CODE: ${normalizedCode}`
    );

    console.log(
      "⏳ WAITING FOR PHONE CONFIRMATION..."
    );

    console.log(
      "========================================"
    );

    return {
      success: true,
      sessionId,
      number: phoneNumber,
      code: normalizedCode,
      status: "pairing"
    };

  } catch (error) {
    console.error(
      "========================================"
    );

    console.error(
      `❌ PAIRING ERROR ${sessionId}`
    );

    console.error(
      error?.stack ||
      error?.message ||
      error
    );

    console.error(
      "========================================"
    );

    sessionManager.endPairing(
      sessionId
    );

    sessionManager.setStatus(
      sessionId,
      "error",
      false
    );

    throw error;
  }
}

// ============================================================
// RESTORE STORED SESSIONS
// ============================================================

async function restoreStoredSessions() {
  const ids =
    sessionManager.getStoredSessionIds();

  console.log(
    `🔄 RESTORING ${ids.length} STORED SESSION(S)...`
  );

  for (const sessionId of ids) {
    try {
      const session =
        sessionManager.restoreSession(
          sessionId
        );

      if (!session) {
        continue;
      }

      console.log(
        `🔄 RESTORING SESSION: ${sessionId}`
      );

      await startSession(
        sessionId
      );

    } catch (error) {
      console.error(
        `❌ RESTORE ${sessionId}:`,
        error?.message || error
      );
    }
  }

  return true;
}

// ============================================================
// STOP SESSION
// ============================================================

async function stopSession(sessionId) {
  if (!sessionId) {
    return false;
  }

  stoppedSessions.add(
    sessionId
  );

  const timer =
    reconnectTimers.get(
      sessionId
    );

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(
      sessionId
    );
  }

  const socket =
    sessionManager.getSocket(
      sessionId
    );

  try {
    socket?.end?.();
  } catch {}

  sessionManager.setSocket(
    sessionId,
    null
  );

  sessionManager.endPairing(
    sessionId
  );

  sessionManager.setStatus(
    sessionId,
    "disconnected",
    false
  );

  return true;
}

// ============================================================
// STOP ALL
// ============================================================

async function stop() {
  const sessions =
    sessionManager.getAllSessions();

  for (
    const session of sessions
  ) {
    await stopSession(
      session.sessionId
    );
  }

  return true;
}

// ============================================================
// REMOVE SESSION
// ============================================================

async function removeSession(
  sessionId
) {
  await stopSession(
    sessionId
  );

  stoppedSessions.delete(
    sessionId
  );

  socketReadyPromises.delete(
    sessionId
  );

  startingPromises.delete(
    sessionId
  );

  return sessionManager.removeSession(
    sessionId
  );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // IMPORTANT:
  // index.js calls connection.start()
  // without a sessionId.
  //
  // Therefore start MUST restore stored sessions.
  start:
    restoreStoredSessions,

  startSession,

  stop,
  stopSession,

  requestPairingCode,

  restoreStoredSessions,

  createSession:
    sessionManager.createSession,

  getSession:
    sessionManager.getSession,

  getAllSessions:
    sessionManager.getAllSessions,

  getSocket:
    sessionManager.getSocket,

  isConnected:
    sessionManager.isConnected,

  getPhoneNumber:
    sessionManager.getPhoneNumber,

  getPairingInfo:
    sessionManager.getPairingInfo,

  removeSession,

  cleanPhoneNumber,
  validatePhoneNumber
};