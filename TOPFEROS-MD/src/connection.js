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

/*
|--------------------------------------------------------------------------
| Runtime state
|--------------------------------------------------------------------------
*/

const sockets = new Map();
const configuredSockets = new Set();

const reconnectTimers = new Map();
const startPromises = new Map();

const readySockets = new Set();
const readyWaiters = new Map();

const pairingRequests = new Map();

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getSocket(sessionId) {
  return sockets.get(sessionId) || sessionManager.getSocket(sessionId) || null;
}

function clearReconnectTimer(sessionId) {
  const timer = reconnectTimers.get(sessionId);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(sessionId);
  }
}

function isSocketUsable(socket) {
  if (!socket) return false;

  if (socket.ws && typeof socket.ws.readyState === "number") {
    // WebSocket.OPEN
    if (socket.ws.readyState === 1) return true;
  }

  return !!socket.user;
}

function getDisconnectCode(lastDisconnect) {
  try {
    return (
      lastDisconnect?.error?.output?.statusCode ||
      lastDisconnect?.error?.data?.statusCode ||
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

/*
|--------------------------------------------------------------------------
| Wait until Baileys socket is actually ready
|--------------------------------------------------------------------------
|
| IMPORTANT:
| requestPairingCode() is NOT called immediately after makeWASocket().
|
| We wait until connection.update reports "connecting" (or QR).
|
|--------------------------------------------------------------------------
*/

function waitForSocketReady(sessionId, socket, timeout = 20000) {
  if (!socket) {
    return Promise.reject(
      new Error("Socket pa egziste pou session sa a.")
    );
  }

  if (readySockets.has(socket) || isSocketUsable(socket)) {
    readySockets.add(socket);
    return Promise.resolve(true);
  }

  if (readyWaiters.has(sessionId)) {
    return readyWaiters.get(sessionId).promise;
  }

  let resolvePromise;
  let rejectPromise;

  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const timer = setTimeout(() => {
    readyWaiters.delete(sessionId);

    rejectPromise(
      new Error(
        "WhatsApp socket pa vin ready nan tan limit lan. " +
        "Pa t resevwa connection.update=connecting."
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

/*
|--------------------------------------------------------------------------
| Create socket
|--------------------------------------------------------------------------
*/

async function createSocket(sessionId) {
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    throw new Error(`Session pa jwenn: ${sessionId}`);
  }

  const existing = sockets.get(sessionId);

  if (existing) {
    return existing;
  }

  const { state, saveCreds } =
    await useMultiFileAuthState(session.authDir);

  logger.info(
    {
      sessionId,
      registered: !!state.creds.registered
    },
    "Creating WhatsApp socket"
  );

  const socket = makeWASocket({
    auth: state,

    /*
     * Pairing code pa bezwen QR terminal.
     */
    printQRInTerminal: false,

    /*
     * Keep WhatsApp presence behavior stable.
     */
    markOnlineOnConnect: false,

    /*
     * Avoid unnecessary history synchronization
     * during the initial pairing process.
     */
    syncFullHistory: false,

    shouldSyncHistoryMessage: () => false,

    generateHighQualityLinkPreview: false,

    browser: Browsers.ubuntu("Chrome"),

    /*
     * Give the initial WhatsApp handshake enough time.
     */
    connectTimeoutMs: 120000,

    /*
     * Keep the connection alive.
     */
    keepAliveIntervalMs: 10000,

    /*
     * Logger for Render debugging.
     */
    logger
  });

  sockets.set(sessionId, socket);

  sessionManager.setSocket(sessionId, socket);

  /*
  |--------------------------------------------------------------------------
  | Credentials
  |--------------------------------------------------------------------------
  */

  socket.ev.on("creds.update", async () => {
    try {
      await saveCreds();
    } catch (error) {
      logger.error(
        {
          sessionId,
          error: error?.message || error
        },
        "Failed to save WhatsApp credentials"
      );
    }
  });

  return socket;
}

/*
|--------------------------------------------------------------------------
| Configure socket events
|--------------------------------------------------------------------------
*/

function configureSocket(sessionId, socket) {
  if (!socket) return;

  if (configuredSockets.has(socket)) {
    return;
  }

  configuredSockets.add(socket);

  socket.ev.on("connection.update", async (update) => {
    const {
      connection,
      lastDisconnect,
      qr
    } = update || {};

    /*
    |--------------------------------------------------------------------------
    | SOCKET IS STARTING
    |--------------------------------------------------------------------------
    |
    | THIS IS THE IMPORTANT PART.
    |
    | requestPairingCode() waits for this event before requesting
    | the WhatsApp pairing code.
    |
    */

    if (connection === "connecting") {
      logger.info(
        { sessionId },
        "WhatsApp socket is connecting..."
      );

      readySockets.add(socket);
      resolveReadyWaiter(sessionId);

      try {
        sessionManager.setStatus(sessionId, "connecting");
      } catch (error) {
        logger.warn(
          { sessionId, error: error?.message || error },
          "Could not update connecting status"
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | QR EVENT
    |--------------------------------------------------------------------------
    |
    | A QR event also proves the WhatsApp handshake has reached the
    | authentication stage. Pairing-code flow can safely continue here.
    |
    */

    if (qr) {
      logger.info(
        { sessionId },
        "WhatsApp authentication channel is ready (QR event received)"
      );

      readySockets.add(socket);
      resolveReadyWaiter(sessionId);
    }

    /*
    |--------------------------------------------------------------------------
    | CONNECTION OPEN
    |--------------------------------------------------------------------------
    */

    if (connection === "open") {
      logger.info(
        { sessionId },
        "WhatsApp connection OPEN"
      );

      clearReconnectTimer(sessionId);

      readySockets.add(socket);

      const phoneNumber =
        socket.user?.id?.split(":")[0] ||
        socket.user?.id?.split("@")[0] ||
        null;

      sessionManager.updateSession(sessionId, {
        status: "connected",
        number: phoneNumber || undefined
      });

      /*
       * Pairing is finished.
       */
      sessionManager.endPairing(sessionId);

      try {
        if (
          settingsPanel &&
          typeof settingsPanel.setBotConnected === "function"
        ) {
          settingsPanel.setBotConnected(true);
        }
      } catch (error) {
        logger.warn(
          {
            sessionId,
            error: error?.message || error
          },
          "settingsPanel.setBotConnected failed"
        );
      }

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | CONNECTION CLOSED
    |--------------------------------------------------------------------------
    */

    if (connection === "close") {
      const statusCode = getDisconnectCode(lastDisconnect);

      logger.error(
        {
          sessionId,
          statusCode,
          loggedOut: isLoggedOut(statusCode),
          restartRequired: isRestartRequired(statusCode)
        },
        "WhatsApp connection CLOSED"
      );

      readySockets.delete(socket);

      rejectReadyWaiter(
        sessionId,
        new Error(
          `WhatsApp socket closed before pairing was ready. Code: ${statusCode || "unknown"}`
        )
      );

      sockets.delete(sessionId);
      configuredSockets.delete(socket);

      sessionManager.setSocket(sessionId, null);

      /*
      |--------------------------------------------------------------------------
      | LOGGED OUT
      |--------------------------------------------------------------------------
      */

      if (isLoggedOut(statusCode)) {
        logger.error(
          { sessionId },
          "WhatsApp session is logged out"
        );

        sessionManager.updateSession(sessionId, {
          status: "logged_out"
        });

        sessionManager.endPairing(sessionId);

        try {
          if (
            settingsPanel &&
            typeof settingsPanel.setBotConnected === "function"
          ) {
            settingsPanel.setBotConnected(false);
          }
        } catch {}

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Pairing was still running
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      | Do NOT immediately create another socket while the user is
      | entering the pairing code. That can invalidate the current flow.
      |
      */

      const session = sessionManager.getSession(sessionId);

      if (session?.pairing) {
        logger.warn(
          {
            sessionId,
            statusCode
          },
          "Socket closed while pairing was active; waiting for a new pairing request"
        );

        sessionManager.updateSession(sessionId, {
          status: "disconnected"
        });

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Normal reconnect
      |--------------------------------------------------------------------------
      */

      scheduleReconnect(sessionId);
    }
  });

  /*
  |--------------------------------------------------------------------------
  | Messages
  |--------------------------------------------------------------------------
  */

  socket.ev.on("messages.upsert", async (event) => {
    try {
      if (!messageHandler) return;

      /*
       * Support the common handler export styles used by TOPFEROS MD.
       */

      if (typeof messageHandler === "function") {
        await messageHandler(event, sessionId, socket);
        return;
      }

      if (
        typeof messageHandler.handleMessages === "function"
      ) {
        await messageHandler.handleMessages(
          event,
          sessionId,
          socket
        );
        return;
      }

      if (
        typeof messageHandler.handleMessage === "function"
      ) {
        const messages = event?.messages || [];

        for (const message of messages) {
          await messageHandler.handleMessage(
            message,
            sessionId,
            socket
          );
        }

        return;
      }

      if (
        typeof messageHandler.processMessages === "function"
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
          error: error?.message || error
        },
        "Message handler error"
      );
    }
  });
}

/*
|--------------------------------------------------------------------------
| Start one session
|--------------------------------------------------------------------------
*/

async function startSession(sessionId) {
  if (!sessionId) {
    throw new Error("sessionId obligatwa.");
  }

  /*
   * If already starting, return the same promise.
   */
  if (startPromises.has(sessionId)) {
    return startPromises.get(sessionId);
  }

  const promise = (async () => {
    const session = sessionManager.getSession(sessionId);

    if (!session) {
      throw new Error(`Session pa jwenn: ${sessionId}`);
    }

    const existingSocket = sockets.get(sessionId);

    if (existingSocket) {
      configureSocket(sessionId, existingSocket);

      return existingSocket;
    }

    const socket = await createSocket(sessionId);

    /*
     * VERY IMPORTANT:
     * Configure listeners immediately after socket creation.
     */
    configureSocket(sessionId, socket);

    return socket;
  })();

  startPromises.set(sessionId, promise);

  try {
    return await promise;
  } finally {
    startPromises.delete(sessionId);
  }
}

/*
|--------------------------------------------------------------------------
| Request pairing code
|--------------------------------------------------------------------------
|
| THIS FUNCTION NOW WAITS FOR THE SOCKET.
|--------------------------------------------------------------------------
*/

async function requestPairingCode(phoneNumber) {
  const cleanNumber = String(phoneNumber || "").replace(/\D/g, "");

  if (!cleanNumber) {
    throw new Error("Phone number obligatwa.");
  }

  if (cleanNumber.length < 8 || cleanNumber.length > 15) {
    throw new Error(
      "Phone number dwe genyen ant 8 ak 15 chif, avèk country code."
    );
  }

  /*
   * Find or create session for this number.
   */
  let session =
    sessionManager.getSessionByNumber(cleanNumber);

  if (!session) {
    session = sessionManager.createSession(cleanNumber);
  }

  const sessionId = session.sessionId;

  /*
   * Prevent duplicate simultaneous pairing requests.
   */
  if (pairingRequests.has(sessionId)) {
    return pairingRequests.get(sessionId);
  }

  const pairingPromise = (async () => {
    logger.info(
      {
        sessionId,
        phoneNumber: cleanNumber
      },
      "Starting WhatsApp pairing flow"
    );

    /*
    |--------------------------------------------------------------------------
    | Existing code?
    |--------------------------------------------------------------------------
    */

    const currentSession =
      sessionManager.getSession(sessionId);

    if (
      currentSession?.pairing &&
      currentSession?.pairingCode
    ) {
      logger.info(
        { sessionId },
        "Pairing code already exists"
      );

      return {
        success: true,
        sessionId,
        number: cleanNumber,
        code: currentSession.pairingCode,
        status: currentSession.status || "pairing"
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Mark pairing BEFORE starting socket.
    |--------------------------------------------------------------------------
    */

    sessionManager.updateSession(sessionId, {
      number: cleanNumber,
      status: "pairing",
      pairing: true,
      pairingCode: null,
      pairingStartedAt: Date.now()
    });

    /*
    |--------------------------------------------------------------------------
    | Start socket.
    |--------------------------------------------------------------------------
    */

    const socket = await startSession(sessionId);

    if (!socket) {
      throw new Error(
        "WhatsApp socket pa t kreye."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | WAIT FOR SOCKET
    |--------------------------------------------------------------------------
    |
    | THIS IS THE FIX.
    |
    | We DO NOT call requestPairingCode immediately.
    |
    */

    logger.info(
      { sessionId },
      "Waiting for WhatsApp socket to become ready before requesting pairing code..."
    );

    await waitForSocketReady(
      sessionId,
      socket,
      20000
    );

    logger.info(
      { sessionId },
      "WhatsApp socket is ready. Requesting pairing code now..."
    );

    /*
    |--------------------------------------------------------------------------
    | Make absolutely sure the socket is still the active socket.
    |--------------------------------------------------------------------------
    */

    const activeSocket = sockets.get(sessionId);

    if (!activeSocket || activeSocket !== socket) {
      throw new Error(
        "WhatsApp socket la chanje oswa li fèmen avan pairing code la te mande."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | REQUEST CODE
    |--------------------------------------------------------------------------
    */

    let code;

    try {
      code = await socket.requestPairingCode(
        cleanNumber
      );
    } catch (error) {
      logger.error(
        {
          sessionId,
          error: error?.message || error
        },
        "requestPairingCode failed"
      );

      sessionManager.updateSession(sessionId, {
        status: "disconnected",
        pairing: false,
        pairingCode: null
      });

      throw error;
    }

    if (!code) {
      throw new Error(
        "WhatsApp pa retounen pairing code."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Save code
    |--------------------------------------------------------------------------
    */

    sessionManager.setPairingCode(
      sessionId,
      code
    );

    sessionManager.setNumber(
      sessionId,
      cleanNumber
    );

    logger.info(
      {
        sessionId,
        code
      },
      "WhatsApp pairing code generated"
    );

    return {
      success: true,
      sessionId,
      number: cleanNumber,
      code: String(code),
      status: "pairing"
    };
  })();

  pairingRequests.set(sessionId, pairingPromise);

  try {
    return await pairingPromise;
  } finally {
    pairingRequests.delete(sessionId);
  }
}

/*
|--------------------------------------------------------------------------
| Reconnect
|--------------------------------------------------------------------------
*/

function scheduleReconnect(sessionId) {
  if (reconnectTimers.has(sessionId)) {
    return;
  }

  const session = sessionManager.getSession(sessionId);

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

  const timer = setTimeout(async () => {
    reconnectTimers.delete(sessionId);

    try {
      await startSession(sessionId);

      logger.info(
        { sessionId },
        "WhatsApp reconnect started"
      );
    } catch (error) {
      logger.error(
        {
          sessionId,
          error: error?.message || error
        },
        "WhatsApp reconnect failed"
      );

      scheduleReconnect(sessionId);
    }
  }, 5000);

  reconnectTimers.set(sessionId, timer);
}

/*
|--------------------------------------------------------------------------
| Restore stored sessions
|--------------------------------------------------------------------------
*/

async function restoreStoredSessions() {
  const sessions =
    sessionManager.getAllSessions();

  logger.info(
    {
      count: sessions.length
    },
    "Checking stored WhatsApp sessions"
  );

  const results = [];

  for (const session of sessions) {
    if (!session?.sessionId) continue;

    /*
     * Do not automatically restart a session that was in
     * the middle of a pairing operation.
     */
    if (session.pairing) {
      logger.warn(
        {
          sessionId: session.sessionId,
          number: session.number
        },
        "Skipping stored session because pairing was incomplete"
      );

      results.push({
        sessionId: session.sessionId,
        restored: false,
        reason: "pairing_incomplete"
      });

      continue;
    }

    try {
      await startSession(session.sessionId);

      results.push({
        sessionId: session.sessionId,
        restored: true
      });

      logger.info(
        {
          sessionId: session.sessionId
        },
        "Stored WhatsApp session restored"
      );
    } catch (error) {
      logger.error(
        {
          sessionId: session.sessionId,
          error: error?.message || error
        },
        "Failed to restore stored WhatsApp session"
      );

      results.push({
        sessionId: session.sessionId,
        restored: false,
        error: error?.message || String(error)
      });
    }
  }

  return results;
}

/*
|--------------------------------------------------------------------------
| Start service
|--------------------------------------------------------------------------
*/

async function start() {
  logger.info("TOPFEROS MD WhatsApp connection service started.");

  return true;
}

/*
|--------------------------------------------------------------------------
| Stop one session
|--------------------------------------------------------------------------
*/

async function stopSession(sessionId) {
  if (!sessionId) return false;

  clearReconnectTimer(sessionId);

  const socket = sockets.get(sessionId);

  if (socket) {
    try {
      socket.ev.removeAllListeners();
    } catch {}

    try {
      if (socket.ws && typeof socket.ws.close === "function") {
        socket.ws.close();
      }
    } catch {}

    sockets.delete(sessionId);
    configuredSockets.delete(socket);
    readySockets.delete(socket);
  }

  rejectReadyWaiter(
    sessionId,
    new Error("Session stopped.")
  );

  pairingRequests.delete(sessionId);

  sessionManager.setSocket(sessionId, null);

  try {
    sessionManager.setStatus(
      sessionId,
      "disconnected"
    );
  } catch {}

  return true;
}

/*
|--------------------------------------------------------------------------
| Remove session
|--------------------------------------------------------------------------
*/

async function removeSession(sessionId) {
  if (!sessionId) return false;

  await stopSession(sessionId);

  return sessionManager.removeSession(
    sessionId
  );
}

/*
|--------------------------------------------------------------------------
| Stop all
|--------------------------------------------------------------------------
*/

async function stop() {
  logger.info("Stopping WhatsApp connection service...");

  const ids = Array.from(
    sockets.keys()
  );

  for (const sessionId of ids) {
    try {
      await stopSession(sessionId);
    } catch (error) {
      logger.error(
        {
          sessionId,
          error: error?.message || error
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

  for (const timer of reconnectTimers.values()) {
    clearTimeout(timer);
  }

  reconnectTimers.clear();

  logger.info(
    "WhatsApp connection service stopped."
  );

  return true;
}

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

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