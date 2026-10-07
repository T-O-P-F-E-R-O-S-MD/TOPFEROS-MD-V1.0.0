"use strict";

/*
|--------------------------------------------------------------------------
| 🦁 TOPFEROS MD V2.0.0
| SESSION MANAGER
|--------------------------------------------------------------------------
|
| Manages isolated WhatsApp sessions.
|
| Features:
| - Multiple independent sessions
| - Session registration
| - Session lookup
| - Session removal from memory
| - Connection state tracking
| - Credentials are NOT deleted automatically
| - Session metadata
|
|--------------------------------------------------------------------------
*/

const path = require("path");
const fs = require("fs");

const config = require("./config");

/*
|--------------------------------------------------------------------------
| SESSION DIRECTORY
|--------------------------------------------------------------------------
*/

const SESSIONS_DIR = path.resolve(
  process.cwd(),
  config?.session?.directory || "sessions"
);

/*
|--------------------------------------------------------------------------
| ACTIVE SESSIONS
|--------------------------------------------------------------------------
*/

const sessions = new Map();

/*
|--------------------------------------------------------------------------
| INITIALIZE SESSION DIRECTORY
|--------------------------------------------------------------------------
*/

function ensureSessionsDirectory() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, {
      recursive: true
    });
  }

  return SESSIONS_DIR;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE NUMBER
|--------------------------------------------------------------------------
*/

function normalizeNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}

/*
|--------------------------------------------------------------------------
| SESSION ID
|--------------------------------------------------------------------------
*/

function getSessionId(number) {
  const normalized =
    normalizeNumber(number);

  if (!normalized) {
    throw new Error(
      "A valid phone number is required."
    );
  }

  return normalized;
}

/*
|--------------------------------------------------------------------------
| SESSION PATH
|--------------------------------------------------------------------------
*/

function getSessionPath(number) {
  const sessionId =
    getSessionId(number);

  ensureSessionsDirectory();

  return path.join(
    SESSIONS_DIR,
    sessionId
  );
}

/*
|--------------------------------------------------------------------------
| SESSION EXISTS
|--------------------------------------------------------------------------
*/

function sessionExists(number) {
  const sessionPath =
    getSessionPath(number);

  return fs.existsSync(sessionPath);
}

/*
|--------------------------------------------------------------------------
| CREATE SESSION DIRECTORY
|--------------------------------------------------------------------------
*/

function createSessionDirectory(number) {
  const sessionPath =
    getSessionPath(number);

  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, {
      recursive: true
    });
  }

  return sessionPath;
}

/*
|--------------------------------------------------------------------------
| REGISTER SESSION
|--------------------------------------------------------------------------
*/

function registerSession(number, data = {}) {
  const sessionId =
    getSessionId(number);

  const sessionPath =
    data.sessionPath ||
    createSessionDirectory(sessionId);

  const existing =
    sessions.get(sessionId);

  const session = {
    ...(existing || {}),

    ...data,

    sessionId,
    number: sessionId,
    sessionPath,

    createdAt:
      existing?.createdAt ||
      Date.now(),

    updatedAt: Date.now()
  };

  sessions.set(
    sessionId,
    session
  );

  return session;
}

/*
|--------------------------------------------------------------------------
| GET SESSION
|--------------------------------------------------------------------------
*/

function getSession(number) {
  const sessionId =
    getSessionId(number);

  return (
    sessions.get(sessionId) ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| HAS ACTIVE SESSION
|--------------------------------------------------------------------------
*/

function hasSession(number) {
  const sessionId =
    getSessionId(number);

  return sessions.has(sessionId);
}

/*
|--------------------------------------------------------------------------
| GET ALL ACTIVE SESSIONS
|--------------------------------------------------------------------------
*/

function getActiveSessions() {
  return Array.from(
    sessions.values()
  );
}

/*
|--------------------------------------------------------------------------
| GET ACTIVE SESSION COUNT
|--------------------------------------------------------------------------
*/

function getActiveSessionCount() {
  return sessions.size;
}

/*
|--------------------------------------------------------------------------
| UPDATE SESSION
|--------------------------------------------------------------------------
*/

function updateSession(
  number,
  updates = {}
) {
  const sessionId =
    getSessionId(number);

  const existing =
    sessions.get(sessionId);

  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...updates,
    sessionId,
    number: sessionId,
    updatedAt: Date.now()
  };

  sessions.set(
    sessionId,
    updated
  );

  return updated;
}

/*
|--------------------------------------------------------------------------
| SET SOCKET
|--------------------------------------------------------------------------
*/

function setSessionSocket(
  number,
  sock
) {
  return updateSession(
    number,
    {
      sock
    }
  );
}

/*
|--------------------------------------------------------------------------
| GET SOCKET
|--------------------------------------------------------------------------
*/

function getSessionSocket(number) {
  const session =
    getSession(number);

  return session?.sock || null;
}

/*
|--------------------------------------------------------------------------
| CONNECTION STATE
|--------------------------------------------------------------------------
*/

function setConnected(
  number,
  connected = true
) {
  return updateSession(
    number,
    {
      connected: Boolean(connected),
      lastConnectedAt:
        connected
          ? Date.now()
          : (
              getSession(number)
                ?.lastConnectedAt ||
              null
            )
    }
  );
}

function isConnected(number) {
  return Boolean(
    getSession(number)?.connected
  );
}

/*
|--------------------------------------------------------------------------
| WELCOME STATE
|--------------------------------------------------------------------------
*/

function setWelcomeSent(
  number,
  value = true
) {
  return updateSession(
    number,
    {
      welcomeSent: Boolean(value)
    }
  );
}

/*
|--------------------------------------------------------------------------
| QR STATE
|--------------------------------------------------------------------------
*/

function setSessionQR(
  number,
  qr = null
) {
  return updateSession(
    number,
    {
      qr
    }
  );
}

function getSessionQR(number) {
  return (
    getSession(number)?.qr ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| PAIRING STATE
|--------------------------------------------------------------------------
*/

function setPairingCode(
  number,
  code = null
) {
  return updateSession(
    number,
    {
      pairingCode: code || null
    }
  );
}

function getPairingCode(number) {
  return (
    getSession(number)
      ?.pairingCode ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| AUTOMATION SETTINGS
|--------------------------------------------------------------------------
*/

function setSessionAutomation(
  number,
  automation = {}
) {
  return updateSession(
    number,
    {
      automation: {
        ...(getSession(number)
          ?.automation || {}),
        ...automation
      }
    }
  );
}

function getSessionAutomation(number) {
  return (
    getSession(number)
      ?.automation ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| MANUAL STOP STATE
|--------------------------------------------------------------------------
*/

function setManuallyStopped(
  number,
  value = true
) {
  return updateSession(
    number,
    {
      manuallyStopped:
        Boolean(value)
    }
  );
}

function isManuallyStopped(number) {
  return Boolean(
    getSession(number)
      ?.manuallyStopped
  );
}

/*
|--------------------------------------------------------------------------
| REMOVE FROM ACTIVE MEMORY
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This does NOT delete the credentials
| stored on disk.
|
|--------------------------------------------------------------------------
*/

function removeSession(number) {
  const sessionId =
    getSessionId(number);

  const session =
    sessions.get(sessionId) ||
    null;

  sessions.delete(sessionId);

  return session;
}

/*
|--------------------------------------------------------------------------
| DELETE SESSION CREDENTIALS
|--------------------------------------------------------------------------
|
| This function is intentionally separate from
| removeSession().
|
| It should only be called when the application
| explicitly wants to permanently delete a session.
|
|--------------------------------------------------------------------------
*/

function deleteSessionCredentials(
  number
) {
  const sessionPath =
    getSessionPath(number);

  if (!fs.existsSync(sessionPath)) {
    return false;
  }

  fs.rmSync(
    sessionPath,
    {
      recursive: true,
      force: true
    }
  );

  return true;
}

/*
|--------------------------------------------------------------------------
| CLEAR ACTIVE SESSION MEMORY
|--------------------------------------------------------------------------
*/

function clearActiveSessions() {
  sessions.clear();
}

/*
|--------------------------------------------------------------------------
| SESSION SUMMARY
|--------------------------------------------------------------------------
*/

function getSessionSummary(number) {
  const session =
    getSession(number);

  if (!session) {
    return null;
  }

  return {
    sessionId:
      session.sessionId,

    number:
      session.number,

    sessionPath:
      session.sessionPath,

    connected:
      Boolean(session.connected),

    welcomeSent:
      Boolean(session.welcomeSent),

    manuallyStopped:
      Boolean(session.manuallyStopped),

    hasQR:
      Boolean(session.qr),

    hasPairingCode:
      Boolean(session.pairingCode),

    createdAt:
      session.createdAt,

    updatedAt:
      session.updatedAt,

    lastConnectedAt:
      session.lastConnectedAt || null
  };
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  SESSIONS_DIR,

  ensureSessionsDirectory,

  normalizeNumber,
  getSessionId,
  getSessionPath,

  sessionExists,
  createSessionDirectory,

  registerSession,
  getSession,
  hasSession,

  getActiveSessions,
  getActiveSessionCount,

  updateSession,

  setSessionSocket,
  getSessionSocket,

  setConnected,
  isConnected,

  setWelcomeSent,

  setSessionQR,
  getSessionQR,

  setPairingCode,
  getPairingCode,

  setSessionAutomation,
  getSessionAutomation,

  setManuallyStopped,
  isManuallyStopped,

  removeSession,
  deleteSessionCredentials,

  clearActiveSessions,

  getSessionSummary
};