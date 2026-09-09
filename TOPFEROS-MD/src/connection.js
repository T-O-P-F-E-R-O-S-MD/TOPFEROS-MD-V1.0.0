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

const reconnectTimers = new Map();
const startingSessions = new Set();
const stoppedSessions = new Set();

// Pairing requests currently running
const pairingRequests = new Map();

// ============================================================
// HELPERS
// ============================================================

function cleanPhoneNumber(number) {
  return sessionManager.cleanPhoneNumber(number);
}

function validatePhoneNumber(number) {
  return sessionManager.validatePhoneNumber(number);
}

function getDisconnectCode(lastDisconnect) {
  return (
    lastDisconnect
      ?.error
      ?.output
      ?.statusCode ||
    lastDisconnect
      ?.error
      ?.data
      ?.statusCode ||
    null
  );
}

// ============================================================
// MESSAGE HANDLER
// ============================================================

async function handleMessages(
  sessionId,
  messages
) {
  const socket =
    sessionManager.getSocket(
      sessionId
    );

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
  if (
    stoppedSessions.has(
      sessionId
    )
  ) {
    return;
  }

  if (
    reconnectTimers.has(
      sessionId
    )
  ) {
    return;
  }

  const timer = setTimeout(
    async () => {
      reconnectTimers.delete(
        sessionId
      );

      if (
        stoppedSessions.has(
          sessionId
        )
      ) {
        return;
      }

      try {
        await startSession(
          sessionId
        );
      } catch (error) {
        console.error(
          `❌ RECONNECT ERROR ${sessionId}:`,
          error?.message || error
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
// PAIRING CODE
// ============================================================

async function generatePairingCode(
  sessionId,
  socket
) {
  const request =
    pairingRequests.get(
      sessionId
    );

  if (!request) {
    return;
  }

  if (
    request.generated
  ) {
    return;
  }

  request.generated = true;

  const phoneNumber =
    cleanPhoneNumber(
      request.number
    );

  try {
    console.log(
      `📲 REQUESTING PAIRING CODE`
    );

    console.log(
      `📱 NUMBER: ${phoneNumber}`
    );

    console.log(
      `🆔 SESSION: ${sessionId}`
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
      `🔑 PAIRING CODE GENERATED: ${normalizedCode}`
    );

    console.log(
      `📱 Enter this code inside WhatsApp → Linked Devices.`
    );

    request.resolve({
      success: true,

      sessionId,

      number:
        phoneNumber,

      code:
        normalizedCode,

      status:
        "pairing"
    });

  } catch (error) {
    console.error(
      `❌ PAIRING CODE ERROR ${sessionId}:`,
      error?.message || error
    );

    request.reject(
      error
    );

    pairingRequests.delete(
      sessionId
    );

    sessionManager.endPairing(
      sessionId
    );

    sessionManager.setStatus(
      sessionId,
      "error",
      false
    );

    /*
     * IMPORTANT:
     *
     * Pa fè socket.end() isit la.
     *
     * Si WhatsApp toujou ap prepare koneksyon an,
     * socket la dwe rete viv pou lifecycle la ka
     * kontinye.
     */
  }
}

// ============================================================
// CREATE SOCKET
// ============================================================

async function createSocket(
  sessionId
) {
  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    throw new Error(
      "Session not found."
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
    `🔌 Creating WhatsApp socket: ${sessionId}`
  );

  const socket =
    makeWASocket({
      version,

      auth: state,

      logger: pino({
        level: "silent"
      }),

      /*
       * Keep a real desktop browser identity.
       */
      browser:
        Browsers.ubuntu(
          "Chrome"
        ),

      printQRInTerminal:
        false,

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

  /*
   * SAVE AUTH CREDENTIALS
   */
  socket.ev.on(
    "creds.update",
    saveCreds
  );

  sessionManager.setSocket(
    sessionId,
    socket
  );

  return socket;
}

// ============================================================
// START SESSION
// ============================================================

async function startSession(
  sessionId
) {
  if (!sessionId) {
    return null;
  }

  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    return null;
  }

  /*
   * Already connected
   */
  if (
    sessionManager.isConnected(
      sessionId
    )
  ) {
    return session.socket;
  }

  /*
   * Already starting
   */
  if (
    startingSessions.has(
      sessionId
    )
  ) {
    return session.socket;
  }

  startingSessions.add(
    sessionId
  );

  stoppedSessions.delete(
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

    // ========================================================
    // CONNECTION UPDATE
    // ========================================================

    socket.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect
        } = update || {};

        // ----------------------------------------------------
        // CONNECTING
        // ----------------------------------------------------

        if (
          connection ===
          "connecting"
        ) {
          console.log(
            `🔄 WHATSAPP CONNECTING: ${sessionId}`
          );

          sessionManager.setStatus(
            sessionId,
            "connecting",
            false
          );

          /*
           * THIS IS THE IMPORTANT PART.
           *
           * Pairing code is requested from the
           * connection lifecycle itself.
           */
          const pairing =
            pairingRequests.get(
              sessionId
            );

          if (
            pairing &&
            !pairing.generated
          ) {
            await generatePairingCode(
              sessionId,
              socket
            );
          }

          return;
        }

        // ----------------------------------------------------
        // OPEN / CONNECTED
        // ----------------------------------------------------

        if (
          connection === "open"
        ) {
          startingSessions.delete(
            sessionId
          );

          stoppedSessions.delete(
            sessionId
          );

          const number =
            socket?.user?.id
              ?.split(":")[0]
              ?.replace(
                /@.+$/,
                ""
              );

          if (number) {
            try {
              sessionManager.setNumber(
                sessionId,
                number
              );
            } catch {}
          }

          sessionManager.setStatus(
            sessionId,
            "connected",
            true
          );

          sessionManager.endPairing(
            sessionId
          );

          /*
           * Pairing request promise can still
           * exist while WhatsApp finishes auth.
           */
          const pairing =
            pairingRequests.get(
              sessionId
            );

          if (
            pairing &&
            !pairing.generated
          ) {
            pairing.reject(
              new Error(
                "WhatsApp connected before a pairing code was generated."
              )
            );

            pairingRequests.delete(
              sessionId
            );
          }

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
            ``
          );

          console.log(
            `========================================`
          );

          console.log(
            `✅ WHATSAPP CONNECTED`
          );

          console.log(
            `🆔 SESSION: ${sessionId}`
          );

          console.log(
            `📱 NUMBER: ${number || "unknown"}`
          );

          console.log(
            `========================================`
          );

          return;
        }

        // ----------------------------------------------------
        // CLOSED
        // ----------------------------------------------------

        if (
          connection === "close"
        ) {
          startingSessions.delete(
            sessionId
          );

          const code =
            getDisconnectCode(
              lastDisconnect
            );

          const loggedOut =
            code ===
            DisconnectReason.loggedOut;

          const connectionReplaced =
            code ===
            DisconnectReason.connectionReplaced;

          const pairing =
            pairingRequests.get(
              sessionId
            );

          /*
           * If pairing was still waiting,
           * reject it.
           */
          if (pairing) {
            pairing.reject(
              new Error(
                `WhatsApp connection closed during pairing (${code || "unknown"}).`
              )
            );

            pairingRequests.delete(
              sessionId
            );
          }

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
            `⚠️ WHATSAPP CLOSED: ${sessionId}`
          );

          console.log(
            `⚠️ STATUS CODE: ${code || "unknown"}`
          );

          /*
           * Do not reconnect if user logged out
           * or the session was intentionally stopped.
           */
          if (
            loggedOut ||
            connectionReplaced ||
            stoppedSessions.has(
              sessionId
            )
          ) {
            return;
          }

          scheduleReconnect(
            sessionId
          );
        }
      }
    );

    // ========================================================
    // MESSAGES
    // ========================================================

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
}

// ============================================================
// REQUEST PAIRING CODE
// ============================================================

async function requestPairingCode(
  number
) {
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
  // PAIRING ALREADY RUNNING
  // ----------------------------------------------------------

  if (
    session?.pairing
  ) {
    const existing =
      pairingRequests.get(
        session.sessionId
      );

    if (existing) {
      return existing.promise;
    }

    const error =
      new Error(
        "Pairing code request already in progress."
      );

    error.code =
      "PAIRING_IN_PROGRESS";

    throw error;
  }

  // ----------------------------------------------------------
  // CREATE SESSION
  // ----------------------------------------------------------

  if (!session) {
    session =
      sessionManager.createSession({
        number:
          phoneNumber
      });
  } else {
    sessionManager.setNumber(
      session.sessionId,
      phoneNumber
    );
  }

  const sessionId =
    session.sessionId;

  console.log(
    ``
  );

  console.log(
    `========================================`
  );

  console.log(
    `🔐 NEW PAIRING REQUEST`
  );

  console.log(
    `📱 NUMBER: ${phoneNumber}`
  );

  console.log(
    `🆔 SESSION: ${sessionId}`
  );

  console.log(
    `========================================`
  );

  sessionManager.startPairing(
    sessionId
  );

  // ----------------------------------------------------------
  // CREATE PROMISE
  // ----------------------------------------------------------

  let resolvePairing;
  let rejectPairing;

  const promise =
    new Promise(
      (resolve, reject) => {
        resolvePairing =
          resolve;

        rejectPairing =
          reject;
      }
    );

  pairingRequests.set(
    sessionId,
    {
      number:
        phoneNumber,

      generated:
        false,

      resolve:
        resolvePairing,

      reject:
        rejectPairing,

      promise
    }
  );

  // ----------------------------------------------------------
  // START SOCKET
  // ----------------------------------------------------------

  try {
    let socket =
      sessionManager.getSocket(
        sessionId
      );

    if (!socket) {
      socket =
        await startSession(
          sessionId
        );
    }

    if (!socket) {
      throw new Error(
        "Unable to create WhatsApp socket."
      );
    }

    /*
     * If the connecting event was emitted before
     * our pairing request was registered, give the
     * socket a tiny opportunity to enter its lifecycle.
     *
     * We do NOT call requestPairingCode blindly here.
     */
    setTimeout(
      async () => {
        const current =
          pairingRequests.get(
            sessionId
          );

        if (
          !current ||
          current.generated
        ) {
          return;
        }

        /*
         * If socket is still alive and no pairing
         * code was generated, request it now.
         */
        try {
          await generatePairingCode(
            sessionId,
            socket
          );
        } catch {}
      },
      1000
    );

    /*
     * IMPORTANT:
     *
     * Return the pairing promise.
     *
     * This means the panel only receives the code
     * AFTER WhatsApp actually gives us the code.
     */
    return await promise;

  } catch (error) {
    console.error(
      `❌ PAIRING ERROR ${sessionId}:`,
      error?.message || error
    );

    const current =
      pairingRequests.get(
        sessionId
      );

    if (current) {
      current.reject(
        error
      );
    }

    pairingRequests.delete(
      sessionId
    );

    sessionManager.endPairing(
      sessionId
    );

    sessionManager.setStatus(
      sessionId,
      "error",
      false
    );

    /*
     * DO NOT destroy the socket here.
     *
     * The connection lifecycle owns the socket.
     */
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
        `🔄 Restoring: ${sessionId}`
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

async function stopSession(
  sessionId
) {
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

  const pairing =
    pairingRequests.get(
      sessionId
    );

  if (pairing) {
    pairing.reject(
      new Error(
        "Session stopped."
      )
    );

    pairingRequests.delete(
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

  startingSessions.delete(
    sessionId
  );

  return true;
}

// ============================================================
// STOP ALL
// ============================================================

async function stop() {
  const all =
    sessionManager.getAllSessions();

  for (const session of all) {
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

  return sessionManager.removeSession(
    sessionId
  );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  start: startSession,
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