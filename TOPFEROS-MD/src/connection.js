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
        new Error(
          "WhatsApp socket was not created."
        )
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

      if (
        connection === "connecting"
      ) {
        finish();
        return;
      }

      if (
        connection === "open"
      ) {
        finish();
        return;
      }

      if (
        connection === "close"
      ) {
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

  for (
    const message of messages || []
  ) {
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
    saveCred