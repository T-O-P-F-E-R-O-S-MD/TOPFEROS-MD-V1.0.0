"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ======================================================
// TOPFEROS MD - MULTI SESSION MANAGER
// ======================================================

const ROOT_DIR = path.resolve(__dirname, "..");

// Chak WhatsApp session ap gen pwòp folder auth li
const SESSIONS_DIR = path.join(ROOT_DIR, "auth", "sessions");

// Sessions ki aktif nan memwa
const sessions = new Map();

// ======================================================
// DIRECTORY
// ======================================================

function ensureSessionsDirectory() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, {
      recursive: true
    });
  }
}

// ======================================================
// PHONE NUMBER
// ======================================================

function cleanPhoneNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}

function validatePhoneNumber(number) {
  const phone = cleanPhoneNumber(number);

  return /^\d{8,15}$/.test(phone);
}

// ======================================================
// SESSION ID
// ======================================================

function generateSessionId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

// ======================================================
// SESSION OBJECT
// ======================================================

function createSession(options = {}) {
  ensureSessionsDirectory();

  let sessionId = options.sessionId || generateSessionId();

  while (sessions.has(sessionId)) {
    sessionId = generateSessionId();
  }

  const number = cleanPhoneNumber(options.number || "");

  if (number && !validatePhoneNumber(number)) {
    throw new Error("Nimewo WhatsApp la pa valid.");
  }

  const sessionDir = path.join(SESSIONS_DIR, sessionId);
  const authDir = path.join(sessionDir, "auth");

  fs.mkdirSync(authDir, {
    recursive: true
  });

  const now = Date.now();

  const session = {
    sessionId,

    number,

    status: "created",

    connected: false,

    socket: null,

    authDir,

    sessionDir,

    pairing: {
      inProgress: false,
      number: "",
      code: "",
      createdAt: 0
    },

    settings: {},

    metadata: options.metadata || {},

    createdAt: now,
    updatedAt: now
  };

  sessions.set(sessionId, session);

  return session;
}

// ======================================================
// GET SESSION
// ======================================================

function getSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  return sessions.get(String(sessionId)) || null;
}

// ======================================================
// GET SESSION BY NUMBER
// ======================================================

function getSessionByNumber(number) {
  const phone = cleanPhoneNumber(number);

  if (!phone) {
    return null;
  }

  for (const session of sessions.values()) {
    if (session.number === phone) {
      return session;
    }

    if (session.pairing?.number === phone) {
      return session;
    }
  }

  return null;
}

// ======================================================
// GET SESSION BY SOCKET
// ======================================================

function getSessionBySocket(socket) {
  if (!socket) {
    return null;
  }

  for (const session of sessions.values()) {
    if (session.socket === socket) {
      return session;
    }
  }

  return null;
}

// ======================================================
// UPDATE SESSION
// ======================================================

function updateSession(sessionId, updates = {}) {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  const allowedFields = [
    "number",
    "status",
    "connected",
    "settings",
    "metadata"
  ];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      session[field] = updates[field];
    }
  }

  session.updatedAt = Date.now();

  return session;
}

// ======================================================
// SOCKET
// ======================================================

function setSocket(sessionId, socket) {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  session.socket = socket || null;
  session.updatedAt = Date.now();

  return session;
}

function getSocket(sessionId) {
  const session = getSession(sessionId);

  return session?.socket || null;
}

// ======================================================
// STATUS
// ======================================================

function setStatus(sessionId, status, connected = null) {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  session.status = status;

  if (connected !== null) {
    session.connected = Boolean(connected);
  }

  session.updatedAt = Date.now();

  return session;
}

// ======================================================
// NUMBER
// ======================================================

function setNumber(sessionId, number) {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  const phone = cleanPhoneNumber(number);

  if (phone && !validatePhoneNumber(phone)) {
    throw new Error("Nimewo WhatsApp la pa valid.");
  }

  session.number = phone;
  session.updatedAt = Date.now();

  return session;
}

// ======================================================
// PAIRING STATE
// ======================================================

function setPairingState(sessionId, data = {}) {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  session.pairing = {
    ...session.pairing,
    ...data
  };

  session.updatedAt = Date.now();

  return session;
}

function clearPairingState(sessionId) {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  session.pairing = {
    inProgress: false,
    number: "",
    code: "",
    createdAt: 0
  };

  session.updatedAt = Date.now();

  return session;
}

// ======================================================
// SESSION CHECKS
// ======================================================

function hasSession(sessionId) {
  return sessions.has(String(sessionId));
}

function hasNumber(number) {
  return Boolean(getSessionByNumber(number));
}

function isConnected(sessionId) {
  const session = getSession(sessionId);

  return Boolean(
    session &&
    session.connected &&
    session.socket &&
    session.socket.user
  );
}

// ======================================================
// ALL ACTIVE SESSIONS
// ======================================================

function getAllSessions() {
  return Array.from(sessions.values());
}

function getSessionCount() {
  return sessions.size;
}

// ======================================================
// PUBLIC SESSION
// ======================================================
// Pa janm voye socket la nan API/panel.

function getPublicSession(sessionId) {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  return {
    sessionId: session.sessionId,
    number: session.number,
    status: session.status,
    connected: session.connected,
    pairing: {
      inProgress: session.pairing.inProgress,
      number: session.pairing.number,
      code: session.pairing.code,
      createdAt: session.pairing.createdAt
    },
    settings: session.settings,
    metadata: session.metadata,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

function getAllPublicSessions() {
  return getAllSessions().map(session => ({
    sessionId: session.sessionId,
    number: session.number,
    status: session.status,
    connected: session.connected,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  }));
}

// ======================================================
// STORED SESSION DIRECTORIES
// ======================================================
// Sa pèmèt nou jwenn sessions ki te deja gen auth sou disk.
// Connection manager la ap deside kilè pou relouvri yo.

function getStoredSessionIds() {
  ensureSessionsDirectory();

  return fs
    .readdirSync(SESSIONS_DIR, {
      withFileTypes: true
    })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

// ======================================================
// RESTORE SESSION RECORD
// ======================================================

function restoreSession(sessionId) {
  ensureSessionsDirectory();

  if (!sessionId) {
    return null;
  }

  const existing = getSession(sessionId);

  if (existing) {
    return existing;
  }

  const sessionDir = path.join(SESSIONS_DIR, sessionId);
  const authDir = path.join(sessionDir, "auth");

  if (!fs.existsSync(authDir)) {
    return null;
  }

  const now = Date.now();

  const session = {
    sessionId,

    number: "",

    status: "stored",

    connected: false,

    socket: null,

    authDir,

    sessionDir,

    pairing: {
      inProgress: false,
      number: "",
      code: "",
      createdAt: 0
    },

    settings: {},

    metadata: {},

    createdAt: now,
    updatedAt: now
  };

  sessions.set(sessionId, session);

  return session;
}

// ======================================================
// REMOVE SESSION
// ======================================================

async function removeSession(sessionId, options = {}) {
  const session = getSession(sessionId);

  if (!session) {
    return false;
  }

  const deleteAuth = options.deleteAuth !== false;

  // Fèmen socket si li egziste
  if (session.socket) {
    try {
      if (typeof session.socket.end === "function") {
        session.socket.end(undefined);
      }
    } catch (error) {
      console.error(
        `[SESSION] Erè pandan fermeture ${sessionId}:`,
        error.message
      );
    }
  }

  sessions.delete(sessionId);

  // Efase auth/session folder sèlman si yo mande sa
  if (deleteAuth && fs.existsSync(session.sessionDir)) {
    try {
      fs.rmSync(session.sessionDir, {
        recursive: true,
        force: true
      });
    } catch (error) {
      console.error(
        `[SESSION] Pa kapab efase session folder ${sessionId}:`,
        error.message
      );
    }
  }

  return true;
}

// ======================================================
// CLEAR ALL SESSIONS
// ======================================================

async function clearAllSessions(options = {}) {
  const deleteAuth = options.deleteAuth === true;

  const sessionIds = Array.from(sessions.keys());

  for (const sessionId of sessionIds) {
    await removeSession(sessionId, {
      deleteAuth
    });
  }

  return true;
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  // Directories
  SESSIONS_DIR,
  ensureSessionsDirectory,

  // Phone
  cleanPhoneNumber,
  validatePhoneNumber,

  // Creation
  generateSessionId,
  createSession,

  // Retrieval
  getSession,
  getSessionByNumber,
  getSessionBySocket,

  // Update
  updateSession,
  setNumber,

  // Socket
  setSocket,
  getSocket,

  // Status
  setStatus,
  isConnected,

  // Pairing
  setPairingState,
  clearPairingState,

  // Checks
  hasSession,
  hasNumber,

  // Lists
  getAllSessions,
  getAllPublicSessions,
  getSessionCount,
  getPublicSession,

  // Disk
  getStoredSessionIds,
  restoreSession,

  // Remove
  removeSession,
  clearAllSessions
};