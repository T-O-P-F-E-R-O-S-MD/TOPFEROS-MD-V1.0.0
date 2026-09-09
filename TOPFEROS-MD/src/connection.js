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

let config = {};

try {
  config = require("../config");
} catch {
  config = {};
}

const reconnectTimers = new Map();
const startingSessions = new Set();
const stoppedSessions = new Set();

// ============================================================
// HELPERS
// ============================================================

function cleanPhoneNumber(number) {
  return sessionManager.cleanPhoneNumber(number);
}

function validatePhoneNumber(number) {
  return sessionManager.validatePhoneNumber(number);
}

// ============================================================
// WAIT FOR SOCKET
// ============================================================

function waitForSocket(socket, timeout = 15000) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(
        new Error("WhatsApp socket was not created.")
      );
      return;
    }

    let finished = false;

    const finish = (error = null) => {
      if (finished) return;

      finished = true;

      clearTimeout(timer);

      try {
        socket.ev.off(
          "connection.update",
          listener
        );
      } catch {}

      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    };

    const listener = (update) => {
      const {
        connection,
        lastDisconnect
      } = update || {};

      if (connection === "connecting") {
        finish();
        return;
      }

      if (connection === "open") {
        finish();
        return;
      }

      if (connection === "close") {
        const code =
          lastDisconnect
            ?.error
            ?.output
            ?.statusCode;

        finish(
          new Error(
            `WhatsApp socket closed before pairing (${code || "unknown"}).`
          )
        );
      }
    };

    const timer = setTimeout(() => {
      finish(
        new Error(
          "WhatsApp socket did not become ready for pairing."
        )
      );
    }, timeout);

    socket.ev.on(
      "connection.update",
      listener
    );

    // Baileys usually starts the socket immediately.
    // Give the WebSocket a short moment before requesting pairing.
    setTimeout(() => {
      if (!finished) {
        finish();
      }
    }, 1500);
  });
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
        "❌ MESSAGE ERROR:",
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

      try {
        await startSession(
          sessionId
        );
      } catch (error) {
        console.error(
          `❌ RECONNECT ERROR ${sessionId}:`,
          error?.message || error
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
// CREATE SOCKET
// ============================================================

async function createSocket(sessionId) {
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

async function startSession(sessionId) {
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

  if (
    sessionManager.isConnected(
      sessionId
    )
  ) {
    return session.socket;
  }

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
        // CONNECTED
        // ----------------------------------------------------

        if (
          connection === "open"
        ) {
          const number =
            socket?.user?.id
              ?.split(":")[0]
              ?.replace(
                /@.+$/,
                ""
              );

          if (number) {
            sessionManager.setNumber(
              sessionId,
              number
            );
          }

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
            `✅ WHATSAPP CONNECTED: ${sessionId}`
          );

          console.log(
            `📱 NUMBER: ${number || "unknown"}`
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
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;

          const loggedOut =
            code ===
            DisconnectReason.loggedOut;

          const connectionReplaced =
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
            `⚠️ WHATSAPP CLOSED: ${sessionId}`
          );

          console.log(
            `⚠️ STATUS CODE: ${code || "unknown"}`
          );

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
  // PAIRING ALREADY RUNNING
  // ----------------------------------------------------------

  if (
    session?.pairing
  ) {
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

  try {
    console.log(
      `🔐 PAIRING REQUEST: ${phoneNumber}`
    );

    console.log(
      `🆔 SESSION: ${sessionId}`
    );

    sessionManager.startPairing(
      sessionId
    );

    // --------------------------------------------------------
    // START SOCKET
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
    }

    if (!socket) {
      throw new Error(
        "Unable to create WhatsApp socket."
      );
    }

    // --------------------------------------------------------
    // WAIT FOR SOCKET TO START
    // --------------------------------------------------------

    await waitForSocket(
      socket,
      15000
    );

    // --------------------------------------------------------
    // REQUEST REAL WHATSAPP PAIRING CODE
    // --------------------------------------------------------

    console.log(
      `📲 Requesting WhatsApp pairing code for ${phoneNumber}`
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

    console.log(
      `🔑 PAIRING CODE GENERATED: ${normalizedCode}`
    );

    console.log(
      `⏳ Waiting for WhatsApp connection...`
    );

    return {
      success: true,

      sessionId,

      number:
        phoneNumber,

      code:
        normalizedCode,

      status:
        "pairing"
    };

  } catch (error) {
    console.error(
      `❌ PAIRING ERROR ${sessionId}:`,
      error?.message || error
    );

    sessionManager.endPairing(
      sessionId
    );

    sessionManager.setStatus(
      sessionId,
      "disconnected",
      false
    );

    const socket =
      sessionManager.getSocket(
        sessionId
      );

    /*
     * Pa kraze socket la touswit pou yon ti erè
     * requestPairingCode. Sa pèmèt connection lifecycle
     * la kontinye epi reconnect si WhatsApp fèmen li.
     */
    if (
      socket &&
      !sessionManager.isConnected(
        sessionId
      )
    ) {
      try {
        socket.end?.(
          new Error(
            "Pairing request failed."
          )
        );
      } catch {}
    }

    sessionManager.setSocket(
      sessionId,
      null
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

async function removeSession(sessionId) {
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