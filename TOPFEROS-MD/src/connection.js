"use strict";

const pino = require("pino");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers
} = require("@whiskeysockets/baileys");

const sessionManager = require("./sessionManager");
const settingsPanel = require("../settings/panel");
const messageHandler = require("./messageHandler");

const logger = pino({
  level: process.env.WA_LOG_LEVEL || "info"
});

// ============================================================
// RUNTIME STATE
// ============================================================

const sockets = new Map();
const configuredSockets = new Set();

const reconnectTimers = new Map();
const startPromises = new Map();

const readySockets = new Set();
const readyWaiters = new Map();

const pairingRequests = new Map();

// ============================================================
// HELPERS
// ============================================================

function getSocket(sessionId) {
  return (
    sockets.get(sessionId) ||
    sessionManager.getSocket(sessionId) ||
    null
  );
}

function clearReconnectTimer(sessionId) {
  const timer = reconnectTimers.get(sessionId);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(sessionId);
  }
}

function getDisconnectCode(lastDisconnect) {
  try {
    return (
      lastDisconnect?.error?.output?.statusCode ||
      lastDisconnect?.error?.data?.statusCode ||
      lastDisconnect?.error?.statusCode ||
      null
    );
  } catch {
    return null;
  }
}

function isLoggedOut(code) {
  return code === DisconnectReason.loggedOut;
}

function isRestartRequired(code) {
  return code === DisconnectReason.restartRequired;
}

function isSocketOpen(socket) {
  if (!socket) return false;

  try {
    if (
      socket.ws &&
      typeof socket.ws.readyState === "number"
    ) {
      return socket.ws.readyState === 1;
    }
  } catch {}

  return false;
}

function isSocketUsable(socket) {
  if (!socket) return false;

  if (isSocketOpen(socket)) {
    return true;
  }

  return !!socket.user;
}

// ============================================================
// READY WAITERS
// ============================================================

function resolveReadyWaiter(sessionId) {
  const waiter = readyWaiters.get(sessionId);

  if (!waiter) return;

  clearTimeout(waiter.timer);
  readyWaiters.delete(sessionId);

  waiter.resolve(true);
}

function rejectReadyWaiter(sessionId, error) {
  const waiter = readyWaiters.get(sessionId);

  if (!waiter) return;

  clearTimeout(waiter.timer);
  readyWaiters.delete(sessionId);

  waiter.reject(error);
}

// ============================================================
// WAIT FOR REAL SOCKET OPEN
// ============================================================

function waitForSocketReady(
  sessionId,
  socket,
  timeout = 30000
) {
  if (!socket) {
    return Promise.reject(
      new Error(
        "Socket WhatsApp la pa egziste."
      )
    );
  }

  if (isSocketOpen(socket)) {
    readySockets.add(socket);
    return Promise.resolve(true);
  }

  if (readyWaiters.has(sessionId)) {
    return readyWaiters.get(sessionId).promise;
  }

  let resolvePromise;
  let rejectPromise;

  const promise = new Promise(
    (resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    }
  );

  const startedAt = Date.now();

  const checkTimer = setInterval(() => {
    try {
      if (isSocketOpen(socket)) {
        clearInterval(checkTimer);

        if (
          sockets.get(sessionId) === socket
        ) {
          readySockets.add(socket);
          resolveReadyWaiter(sessionId);
        }

        return;
      }

      if (
        Date.now() - startedAt >= timeout
      ) {
        clearInterval(checkTimer);

        rejectReadyWaiter(
          sessionId,
          new Error(
            "WhatsApp WebSocket pa vin OPEN nan tan limit lan."
          )
        );
      }
    } catch (error) {
      clearInterval(checkTimer);

      rejectReadyWaiter(
        sessionId,
        error
      );
    }
  }, 100);

  const timer = setTimeout(() => {
    clearInterval(checkTimer);

    rejectReadyWaiter(
      sessionId,
      new Error(
        "WhatsApp socket pa vin ready nan 30 segonn."
      )
    );
  }, timeout);

  readyWaiters.set(sessionId, {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
    timer
  });

  return promise;
}

// ============================================================
// CREATE SOCKET
// ============================================================

async function createSocket(sessionId) {
  const session =
    sessionManager.getSession(sessionId);

  if (!session) {
    throw new Error(
      `Session pa jwenn: ${sessionId}`
    );
  }

  const existing =
    sockets.get(sessionId);

  if (existing) {
    return existing;
  }

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(
    session.authDir
  );

  logger.info(
    {
      sessionId,
      registered:
        !!state.creds.registered
    },
    "Creating WhatsApp socket"
  );

  const socket = makeWASocket({
    auth: state,

    printQRInTerminal: false,

    markOnlineOnConnect: false,

    syncFullHistory: false,

    shouldSyncHistoryMessage: () =>
      false,

    generateHighQualityLinkPreview:
      false,

    browser:
      Browsers.ubuntu("Chrome"),

    connectTimeoutMs:
      120000,

    keepAliveIntervalMs:
      10000,

    logger
  });

  sockets.set(
    sessionId,
    socket
  );

  sessionManager.setSocket(
    sessionId,
    socket
  );

  // ==========================================================
  // CREDENTIALS
  // ==========================================================

  socket.ev.on(
    "creds.update",
    async () => {
      try {
        await saveCreds();
      } catch (error) {
        logger.error(
          {
            sessionId,
            error:
              error?.message ||
              String(error)
          },
          "Failed to save WhatsApp credentials"
        );
      }
    }
  );

  return socket;
}

// ============================================================
// CONFIGURE SOCKET
// ============================================================

function configureSocket(
  sessionId,
  socket
) {
  if (!socket) return;

  if (
    configuredSockets.has(socket)
  ) {
    return;
  }

  configuredSockets.add(socket);

  // ==========================================================
  // CONNECTION UPDATE
  // ==========================================================

  socket.ev.on(
    "connection.update",
    async (update) => {
      const {
        connection,
        lastDisconnect,
        qr
      } = update || {};

      // --------------------------------------------------------
      // CONNECTING
      // --------------------------------------------------------

      if (
        connection === "connecting"
      ) {
        logger.info(
          { sessionId },
          "WhatsApp socket is connecting..."
        );

        try {
          sessionManager.setStatus(
            sessionId,
            "connecting"
          );
        } catch {}
      }

      // --------------------------------------------------------
      // QR
      // --------------------------------------------------------

      if (qr) {
        logger.info(
          { sessionId },
          "WhatsApp QR event received"
        );
      }

      // --------------------------------------------------------
      // OPEN
      // --------------------------------------------------------

      if (
        connection === "open"
      ) {
        logger.info(
          { sessionId },
          "WhatsApp connection OPEN"
        );

        clearReconnectTimer(
          sessionId
        );

        readySockets.add(
          socket
        );

        const phoneNumber =
          socket.user?.id
            ?.split(":")[0] ||
          socket.user?.id
            ?.split("@")[0] ||
          null;

        sessionManager.updateSession(
          sessionId,
          {
            status: "connected",
            connected: true,
            number:
              phoneNumber ||
              undefined
          }
        );

        sessionManager.endPairing(
          sessionId
        );

        try {
          if (
            settingsPanel &&
            typeof settingsPanel.setBotConnected ===
              "function"
          ) {
            settingsPanel.setBotConnected(
              true
            );
          }
        } catch {}

        resolveReadyWaiter(
          sessionId
        );

        return;
      }

      // --------------------------------------------------------
      // CLOSE
      // --------------------------------------------------------

      if (
        connection === "close"
      ) {
        const statusCode =
          getDisconnectCode(
            lastDisconnect
          );

        logger.error(
          {
            sessionId,
            statusCode,
            loggedOut:
              isLoggedOut(
                statusCode
              ),
            restartRequired:
              isRestartRequired(
                statusCode
              )
          },
          "WhatsApp connection CLOSED"
        );

        readySockets.delete(
          socket
        );

        rejectReadyWaiter(
          sessionId,
          new Error(
            `WhatsApp socket closed. Code: ${
              statusCode ||
              "unknown"
            }`
          )
        );

        if (
          sockets.get(sessionId) ===
          socket
        ) {
          sockets.delete(
            sessionId
          );
        }

        configuredSockets.delete(
          socket
        );

        sessionManager.setSocket(
          sessionId,
          null
        );

        // ------------------------------------------------------
        // LOGGED OUT
        // ------------------------------------------------------

        if (
          isLoggedOut(
            statusCode
          )
        ) {
          logger.error(
            { sessionId },
            "WhatsApp session logged out"
          );

          sessionManager.updateSession(
            sessionId,
            {
              status: "logged_out",
              pairing: false,
              pairingCode: null,
              connected: false
            }
          );

          sessionManager.endPairing(
            sessionId
          );

          try {
            if (
              settingsPanel &&
              typeof settingsPanel.setBotConnected ===
                "function"
            ) {
              settingsPanel.setBotConnected(
                false
              );
            }
          } catch {}

          return;
        }

        // ------------------------------------------------------
        // PAIRING ACTIVE
        // ------------------------------------------------------

        const currentSession =
          sessionManager.getSession(
            sessionId
          );

        if (
          currentSession?.pairing
        ) {
          logger.warn(
            {
              sessionId,
              statusCode
            },
            "Socket closed while pairing was active"
          );

          sessionManager.updateSession(
            sessionId,
            {
              status:
                "disconnected",
              pairing: false,
              pairingCode: null,
              pairingStartedAt:
                null,
              connected: false
            }
          );

          return;
        }

        // ------------------------------------------------------
        // NORMAL RECONNECT
        // ------------------------------------------------------

        scheduleReconnect(
          sessionId
        );
      }
    }
  );

  // ==========================================================
  // MESSAGES
  // ==========================================================

  socket.ev.on(
    "messages.upsert",
    async (event) => {
      try {
        if (!messageHandler) {
          return;
        }

        if (
          typeof messageHandler ===
          "function"
        ) {
          await messageHandler(
            event,
            sessionId,
            socket
          );

          return;
        }

        if (
          typeof messageHandler.handleMessages ===
          "function"
        ) {
          await messageHandler.handleMessages(
            event,
            sessionId,
            socket
          );

          return;
        }

        if (
          typeof messageHandler.handleMessage ===
          "function"
        ) {
          const messages =
            event?.messages || [];

          for (
            const message of messages
          ) {
            await messageHandler.handleMessage(
              message,
              sessionId,
              socket
            );
          }

          return;
        }

        if (
          typeof messageHandler.processMessages ===
          "function"
        ) {
          await messageHandler.processMessages(
            event,
            sessionId,
            socket
          );
        }
      } catch (error) {
        logger.error(
          {
            sessionId,
            error:
              error?.message ||
              String(error)
          },
          "Message handler error"
        );
      }
    }
  );
}

// ============================================================
// START SESSION
// ============================================================

async function startSession(
  sessionId
) {
  if (!sessionId) {
    throw new Error(
      "sessionId obligatwa."
    );
  }

  if (
    startPromises.has(sessionId)
  ) {
    return startPromises.get(
      sessionId
    );
  }

  const promise =
    (async () => {
      const session =
        sessionManager.getSession(
          sessionId
        );

      if (!session) {
        throw new Error(
          `Session pa jwenn: ${sessionId}`
        );
      }

      const existing =
        sockets.get(sessionId);

      if (existing) {
        configureSocket(
          sessionId,
          existing
        );

        return existing;
      }

      const socket =
        await createSocket(
          sessionId
        );

      configureSocket(
        sessionId,
        socket
      );

      return socket;
    })();

  startPromises.set(
    sessionId,
    promise
  );

  try {
    return await promise;
  } finally {
    startPromises.delete(
      sessionId
    );
  }
}

// ============================================================
// REQUEST PAIRING CODE
// ============================================================

async function requestPairingCode(
  phoneNumber
) {
  const cleanNumber =
    String(
      phoneNumber || ""
    ).replace(/\D/g, "");

  if (!cleanNumber) {
    throw new Error(
      "Phone number obligatwa."
    );
  }

  if (
    cleanNumber.length < 8 ||
    cleanNumber.length > 15
  ) {
    throw new Error(
      "Phone number dwe genyen ant 8 ak 15 chif, avèk country code."
    );
  }

  let session =
    sessionManager.getSessionByNumber(
      cleanNumber
    );

  if (!session) {
    session =
      sessionManager.createSession(
        cleanNumber
      );
  }

  const sessionId =
    session.sessionId;

  // ----------------------------------------------------------
  // BLOCK DUPLICATE REQUEST
  // ----------------------------------------------------------

  if (
    pairingRequests.has(
      sessionId
    )
  ) {
    return pairingRequests.get(
      sessionId
    );
  }

  const pairingPromise =
    (async () => {
      logger.info(
        {
          sessionId,
          phoneNumber:
            cleanNumber
        },
        "Starting WhatsApp pairing flow"
      );

      // --------------------------------------------------------
      // CONNECTED ALREADY?
      // --------------------------------------------------------

      const existingSession =
        sessionManager.getSession(
          sessionId
        );

      if (
        existingSession?.connected &&
        existingSession?.socket?.user
      ) {
        return {
          success: true,
          alreadyConnected:
            true,
          sessionId,
          number:
            cleanNumber,
          status:
            "connected"
        };
      }

      // --------------------------------------------------------
      // CLEAR OLD PAIRING CODE
      // --------------------------------------------------------

      sessionManager.updateSession(
        sessionId,
        {
          number:
            cleanNumber,
          status:
            "pairing",
          pairing: true,
          pairingCode: null,
          pairingStartedAt:
            Date.now()
        }
      );

      // --------------------------------------------------------
      // START SOCKET
      // --------------------------------------------------------

      let socket =
        sockets.get(
          sessionId
        );

      if (!socket) {
        socket =
          await startSession(
            sessionId
          );
      } else {
        configureSocket(
          sessionId,
          socket
        );
      }

      if (!socket) {
        throw new Error(
          "WhatsApp socket pa t kreye."
        );
      }

      // --------------------------------------------------------
      // WAIT FOR REAL WEBSOCKET OPEN
      // --------------------------------------------------------

      logger.info(
        { sessionId },
        "Waiting for WhatsApp WebSocket OPEN..."
      );

      await waitForSocketReady(
        sessionId,
        socket,
        30000
      );

      // --------------------------------------------------------
      // VERIFY SOCKET STILL ACTIVE
      // --------------------------------------------------------

      const activeSocket =
        sockets.get(
          sessionId
        );

      if (
        !activeSocket ||
        activeSocket !== socket
      ) {
        throw new Error(
          "WhatsApp socket la pa aktif ankò."
        );
      }

      if (
        !isSocketOpen(
          activeSocket
        )
      ) {
        throw new Error(
          "WhatsApp WebSocket la poko OPEN."
        );
      }

      logger.info(
        { sessionId },
        "WebSocket OPEN. Requesting fresh pairing code..."
      );

      // --------------------------------------------------------
      // REQUEST FRESH CODE
      // --------------------------------------------------------

      let code;

      try {
        code =
          await activeSocket.requestPairingCode(
            cleanNumber
          );
      } catch (error) {
        logger.error(
          {
            sessionId,
            error:
              error?.message ||
              String(error)
          },
          "requestPairingCode failed"
        );

        sessionManager.updateSession(
          sessionId,
          {
            status:
              "disconnected",
            pairing: false,
            pairingCode: null,
            pairingStartedAt:
              null,
            connected: false
          }
        );

        throw error;
      }

      if (!code) {
        throw new Error(
          "WhatsApp pa retounen pairing code."
        );
      }

      const finalCode =
        String(code);

      // --------------------------------------------------------
      // SAVE NEW CODE
      // --------------------------------------------------------

      sessionManager.setPairingCode(
        sessionId,
        finalCode
      );

      sessionManager.setNumber(
        sessionId,
        cleanNumber
      );

      logger.info(
        {
          sessionId
        },
        "Fresh WhatsApp pairing code generated"
      );

      return {
        success: true,
        sessionId,
        number:
          cleanNumber,
        code:
          finalCode,
        status:
          "pairing"
      };
    })();

  pairingRequests.set(
    sessionId,
    pairingPromise
  );

  try {
    return await pairingPromise;
  } finally {
    pairingRequests.delete(
      sessionId
    );
  }
}

// ============================================================
// RECONNECT
// ============================================================

function scheduleReconnect(
  sessionId
) {
  if (
    reconnectTimers.has(
      sessionId
    )
  ) {
    return;
  }

  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    return;
  }

  if (session.pairing) {
    logger.warn(
      { sessionId },
      "Reconnect skipped because pairing is active"
    );

    return;
  }

  logger.info(
    { sessionId },
    "Scheduling WhatsApp reconnect in 5 seconds..."
  );

  const timer =
    setTimeout(
      async () => {
        reconnectTimers.delete(
          sessionId
        );

        try {
          await startSession(
            sessionId
          );

          logger.info(
            { sessionId },
            "WhatsApp reconnect started"
          );
        } catch (error) {
          logger.error(
            {
              sessionId,
              error:
                error?.message ||
                String(error)
            },
            "WhatsApp reconnect failed"
          );

          scheduleReconnect(
            sessionId
          );
        }
      },
      5000
    );

  reconnectTimers.set(
    sessionId,
    timer
  );
}

// ============================================================
// RESTORE STORED SESSIONS
// ============================================================

async function restoreStoredSessions() {
  const sessions =
    sessionManager.getAllSessions();

  logger.info(
    {
      count:
        sessions.length
    },
    "Checking stored WhatsApp sessions"
  );

  const results = [];

  for (
    const session of sessions
  ) {
    if (!session?.sessionId) {
      continue;
    }

    // Pa restore yon pairing ki pa t fini.
    if (session.pairing) {
      logger.warn(
        {
          sessionId:
            session.sessionId,
          number:
            session.number
        },
        "Skipping incomplete pairing session"
      );

      results.push({
        sessionId:
          session.sessionId,
        restored: false,
        reason:
          "pairing_incomplete"
      });

      continue;
    }

    try {
      await startSession(
        session.sessionId
      );

      results.push({
        sessionId:
          session.sessionId,
        restored: true
      });
    } catch (error) {
      logger.error(
        {
          sessionId:
            session.sessionId,
          error:
            error?.message ||
            String(error)
        },
        "Failed to restore stored session"
      );

      results.push({
        sessionId:
          session.sessionId,
        restored: false,
        error:
          error?.message ||
          String(error)
      });
    }
  }

  return results;
}

// ============================================================
// START
// ============================================================

async function start() {
  logger.info(
    "TOPFEROS MD WhatsApp connection service started."
  );

  return true;
}

// ============================================================
// STOP SESSION
// ============================================================

async function stopSession(
  sessionId
) {
  if (!sessionId) {
    return false;
  }

  clearReconnectTimer(
    sessionId
  );

  const socket =
    sockets.get(sessionId);

  if (socket) {
    try {
      socket.ev.removeAllListeners();
    } catch {}

    try {
      if (
        socket.ws &&
        typeof socket.ws.close ===
          "function"
      ) {
        socket.ws.close();
      }
    } catch {}

    sockets.delete(
      sessionId
    );

    configuredSockets.delete(
      socket
    );

    readySockets.delete(
      socket
    );
  }

  rejectReadyWaiter(
    sessionId,
    new Error(
      "Session stopped."
    )
  );

  pairingRequests.delete(
    sessionId
  );

  sessionManager.setSocket(
    sessionId,
    null
  );

  try {
    sessionManager.setStatus(
      sessionId,
      "disconnected"
    );
  } catch {}

  return true;
}

// ============================================================
// REMOVE SESSION
// ============================================================

async function removeSession(
  sessionId
) {
  if (!sessionId) {
    return false;
  }

  await stopSession(
    sessionId
  );

  return sessionManager.removeSession(
    sessionId
  );
}

// ============================================================
// STOP ALL
// ============================================================

async function stop() {
  logger.info(
    "Stopping WhatsApp connection service..."
  );

  const ids =
    Array.from(
      sockets.keys()
    );

  for (
    const sessionId of ids
  ) {
    try {
      await stopSession(
        sessionId
      );
    } catch (error) {
      logger.error(
        {
          sessionId,
          error:
            error?.message ||
            String(error)
        },
        "Failed to stop WhatsApp session"
      );
    }
  }

  sockets.clear();
  configuredSockets.clear();
  readySockets.clear();
  readyWaiters.clear();
  pairingRequests.clear();

  for (
    const timer of
      reconnectTimers.values()
  ) {
    clearTimeout(timer);
  }

  reconnectTimers.clear();

  return true;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  start,
  stop,

  startSession,
  stopSession,
  removeSession,

  createSocket,
  requestPairingCode,

  restoreStoredSessions,

  getSocket
};