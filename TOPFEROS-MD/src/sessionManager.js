"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ============================================================
// PATHS
// ============================================================

const AUTH_ROOT = path.join(
  __dirname,
  "..",
  "auth",
  "sessions"
);

if (!fs.existsSync(AUTH_ROOT)) {
  fs.mkdirSync(AUTH_ROOT, {
    recursive: true
  });
}

// ============================================================
// MEMORY
// ============================================================

const sessions = new Map();

// ============================================================
// HELPERS
// ============================================================

function cleanPhoneNumber(number) {
  return String(number || "")
    .replace(/[^\d]/g, "");
}

function validatePhoneNumber(number) {
  const phone = cleanPhoneNumber(number);

  return (
    /^\d{8,15}$/.test(phone)
  );
}

function generateSessionId() {
  return (
    "session-" +
    Date.now() +
    "-" +
    crypto.randomBytes(4).toString("hex")
  );
}

function getAuthDir(sessionId) {
  return path.join(
    AUTH_ROOT,
    sessionId,
    "auth"
  );
}

function ensureAuthDir(sessionId) {
  const dir = getAuthDir(sessionId);

  fs.mkdirSync(dir, {
    recursive: true
  });

  return dir;
}

// ============================================================
// CREATE SESSION
// ============================================================

function createSession(options = {}) {
  const number = cleanPhoneNumber(
    options.number
  );

  if (
    number &&
    !validatePhoneNumber(number)
  ) {
    throw new Error(
      "Invalid WhatsApp phone number."
    );
  }

  const sessionId =
    options.sessionId ||
    generateSessionId();

  if (sessions.has(sessionId)) {
    return sessions.get(sessionId);
  }

  const authDir =
    options.authDir ||
    ensureAuthDir(sessionId);

  const session = {
    sessionId,

    number:
      number || null,

    authDir,

    socket: null,

    connected: false,

    status: "disconnected",

    pairing: false,

    pairingCode: null,

    pairingStartedAt: null,

    createdAt: Date.now(),

    updatedAt: Date.now(),

    panelSession: null
  };

  sessions.set(
    sessionId,
    session
  );

  return session;
}

// ============================================================
// GET SESSION
// ============================================================

function getSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  return (
    sessions.get(sessionId) ||
    null
  );
}

function getAllSessions() {
  return Array.from(
    sessions.values()
  );
}

function getSessionByNumber(number) {
  const phone =
    cleanPhoneNumber(number);

  if (!phone) {
    return null;
  }

  for (const session of sessions.values()) {
    if (
      cleanPhoneNumber(
        session.number
      ) === phone
    ) {
      return session;
    }
  }

  return null;
}

// ============================================================
// SOCKET
// ============================================================

function setSocket(
  sessionId,
  socket
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.socket = socket;
  session.updatedAt = Date.now();

  return session;
}

function getSocket(sessionId) {
  const session =
    getSession(sessionId);

  return session?.socket || null;
}

// ============================================================
// NUMBER
// ============================================================

function setNumber(
  sessionId,
  number
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  const phone =
    cleanPhoneNumber(number);

  if (
    phone &&
    !validatePhoneNumber(phone)
  ) {
    throw new Error(
      "Invalid phone number."
    );
  }

  session.number =
    phone || null;

  session.updatedAt = Date.now();

  return session;
}

function getPhoneNumber(sessionId) {
  return (
    getSession(sessionId)?.number ||
    null
  );
}

// ============================================================
// STATUS
// ============================================================

function setStatus(
  sessionId,
  status,
  connected = false
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.status =
    status;

  session.connected =
    Boolean(connected);

  session.updatedAt =
    Date.now();

  return session;
}

function isConnected(sessionId) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  return Boolean(
    session.connected &&
    session.socket &&
    session.socket.user
  );
}

// ============================================================
// PAIRING
// ============================================================

function startPairing(sessionId) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.pairing = true;
  session.pairingCode = null;
  session.pairingStartedAt =
    Date.now();
  session.status =
    "pairing";
  session.updatedAt =
    Date.now();

  return session;
}

function setPairingCode(
  sessionId,
  code
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.pairingCode =
    code || null;

  session.pairing = true;

  session.updatedAt =
    Date.now();

  return session;
}

function getPairingInfo(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  return {
    sessionId:
      session.sessionId,

    number:
      session.number,

    pairing:
      session.pairing,

    code:
      session.pairingCode,

    status:
      session.status
  };
}

function endPairing(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.pairing = false;
  session.pairingCode = null;
  session.pairingStartedAt =
    null;

  session.updatedAt =
    Date.now();

  return session;
}

// ============================================================
// SESSION LIST
// ============================================================

function getStoredSessionIds() {
  if (!fs.existsSync(AUTH_ROOT)) {
    return [];
  }

  return fs
    .readdirSync(AUTH_ROOT)
    .filter((name) => {
      const fullPath =
        path.join(
          AUTH_ROOT,
          name
        );

      return fs.statSync(
        fullPath
      ).isDirectory();
    });
}

function restoreSession(
  sessionId
) {
  if (!sessionId) {
    return null;
  }

  const authDir =
    getAuthDir(sessionId);

  if (
    !fs.existsSync(authDir)
  ) {
    return null;
  }

  return createSession({
    sessionId,
    authDir
  });
}

// ============================================================
// REMOVE SESSION
// ============================================================

function removeSession(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  sessions.delete(
    sessionId
  );

  try {
    const sessionDir =
      path.join(
        AUTH_ROOT,
        sessionId
      );

    if (
      fs.existsSync(sessionDir)
    ) {
      fs.rmSync(
        sessionDir,
        {
          recursive: true,
          force: true
        }
      );
    }
  } catch (error) {
    console.error(
      "❌ AUTH REMOVE ERROR:",
      error?.message || error
    );
  }

  return true;
}

// ============================================================
// PUBLIC SESSION LIST
// ============================================================

function listSessions() {
  return getAllSessions();
}

function listPublicSessions() {
  return getAllSessions()
    .filter(
      (session) =>
        session.number
    )
    .map((session) => ({
      sessionId:
        session.sessionId,

      number:
        session.number,

      status:
        isConnected(
          session.sessionId
        )
          ? "connected"
          : session.status,

      connected:
        isConnected(
          session.sessionId
        )
    }));
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  AUTH_ROOT,

  cleanPhoneNumber,
  validatePhoneNumber,

  createSession,
  getSession,
  getAllSessions,
  getSessionByNumber,

  setSocket,
  getSocket,

  setNumber,
  getPhoneNumber,

  setStatus,
  isConnected,

  startPairing,
  setPairingCode,
  getPairingInfo,
  endPairing,

  getStoredSessionIds,
  restoreSession,

  removeSession,

  listSessions,
  listPublicSessions
};