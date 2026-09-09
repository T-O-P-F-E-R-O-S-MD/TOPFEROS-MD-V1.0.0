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

const reconnectTimers =
  new Map();

const startingSessions =
  new Set();

const stoppedSessions =
  new Set();

const DEFAULT_PHONE_NUMBER =
  config.PHONE_NUMBER ||
  process.env.PHONE_NUMBER ||
  "";

function cleanPhoneNumber(number) {
  return sessionManager.cleanPhoneNumber(
    number
  );
}

function validatePhoneNumber(number) {
  return sessionManager.validatePhoneNumber(
    number
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
        "❌ MESSAGE ERROR:",
        error?.message || error
      );
    }
  }
}

// ============================================================
// RECONNECT
// ============================================================

function scheduleReconnect(
  sessionId
) {
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
        } catch (error) {
          console.error(
            "❌ RECONNECT ERROR:",
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

      printQRInTerminal: false,

      generateHighQualityLinkPreview:
        false,

      markOnlineOnConnect:
        false,

      syncFullHistory:
        false
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

    socket.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect
        } = update;

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

          try {
            settingsPanel.setBotConnected(
              socket,
              sessionId
            );
          } catch {}

          console.log(
            `✅ WhatsApp connected: ${sessionId}`
          );
        }

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
            `⚠️ Session closed: ${sessionId} (${code || "unknown"})`
          );

          if (!loggedOut) {
            scheduleReconnect(
              sessionId
            );
          }
        }
      }
    );

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
    throw new Error(
      "Invalid phone number."
    );
  }

  let session =
    sessionManager.getSessionByNumber(
      phoneNumber
    );

  // IMPORTANT:
  // Verifye koneksyon reyèl la.
  if (
    session &&
    sessionManager.isConnected(
      session.sessionId
    )
  ) {
    const error =
      new Error(
        "This WhatsApp number already has a connected session."
      );

    error.code =
      "NUMBER_ALREADY_CONNECTED";

    throw error;
  }

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
    sessionManager.startPairing(
      sessionId
    );

    const socket =
      await startSession(
        sessionId
      );

    if (!socket) {
      throw new Error(
        "Unable to create WhatsApp socket."
      );
    }

    if (
      sessionManager.isConnected(
        sessionId
      )
    ) {
      throw new Error(
        "WhatsApp session is already connected."
      );
    }

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

    return {
      success: true,

      sessionId,

      number:
        phoneNumber,

      code:
        normalizedCode
    };

  } catch (error) {
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

    try {
      socket?.end?.(
        new Error(
          "Pairing request failed."
        )
      );
    } catch {}

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

  for (const sessionId of ids) {
    try {
      const session =
        sessionManager.restoreSession(
          sessionId
        );

      if (!session) {
        continue;
      }

      // Pa sèlman restore metadata.
      // Koneksyon an dwe rekòmanse.
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
// STOP
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

  sessionManager.setStatus(
    sessionId,
    "disconnected",
    false
  );

  return true;
}

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
// REMOVE
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