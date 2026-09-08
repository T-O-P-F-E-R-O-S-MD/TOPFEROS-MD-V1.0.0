"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ======================================================
// TOPFEROS MD - MULTI SESSION MANAGER V2
// ======================================================

const ROOT_DIR = path.resolve(__dirname, "..");

// Chak WhatsApp session gen pwòp folder li
const SESSIONS_DIR = path.join(
  ROOT_DIR,
  "auth",
  "sessions"
);

// Sessions aktif nan memwa
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

function getSessionDir(sessionId) {
  return path.join(
    SESSIONS_DIR,
    String(sessionId)
  );
}

function getAuthDir(sessionId) {
  return path.join(
    getSessionDir(sessionId),
    "auth"
  );
}

function ensureSessionDirectories(sessionId) {
  const sessionDir =
    getSessionDir(sessionId);

  const authDir =
    getAuthDir(sessionId);

  fs.mkdirSync(authDir, {
    recursive: true
  });

  return {
    sessionDir,
    authDir
  };
}

// ======================================================
// PHONE NUMBER
// ======================================================

function cleanPhoneNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}

function validatePhoneNumber(number) {
  const phone =
    cleanPhoneNumber(number);

  return /^\d{8,15}$/.test(phone);
}

// ======================================================
// SESSION ID
// ======================================================

function generateSessionId() {
  return crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 16);
}

// ======================================================
// CREATE SESSION
// ======================================================

function createSession(options = {}) {
  ensureSessionsDirectory();

  let sessionId =
    options.sessionId
      ? String(options.sessionId)
      : generateSessionId();

  /*
   * Si ID a deja egziste nan memwa,
   * retounen session ki deja la.
   *
   * Sa evite kreye duplicate session.
   */
  if (sessions.has(sessionId)) {
    return sessions.get(sessionId);
  }

  const number =
    cleanPhoneNumber(
      options.number || ""
    );

  if (
    number &&
    !validatePhoneNumber(number)
  ) {
    throw new Error(
      "Nimewo WhatsApp la pa valid."
    );
  }

  const {
    sessionDir,
    authDir
  } = ensureSessionDirectories(
    sessionId
  );

  const now = Date.now();

  const session = {
    sessionId,

    number,

    status:
      options.status ||
      "created",

    connected:
      Boolean(
        options.connected
      ),

    socket:
      options.socket ||
      null,

    authDir,

    sessionDir,

    pairing: {
      inProgress: false,
      number: number || "",
      code: "",
      createdAt: 0
    },

    settings:
      options.settings || {},

    metadata:
      options.metadata || {},

    createdAt:
      options.createdAt ||
      now,

    updatedAt:
      now
  };

  sessions.set(
    sessionId,
    session
  );

  return session;
}

// ======================================================
// GET SESSION
// ======================================================

function getSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  return (
    sessions.get(
      String(sessionId)
    ) || null
  );
}

// ======================================================
// GET SESSION BY NUMBER
// ======================================================

function getSessionByNumber(number) {
  const phone =
    cleanPhoneNumber(number);

  if (!phone) {
    return null;
  }

  for (
    const session of sessions.values()
  ) {
    if (
      session.number === phone
    ) {
      return session;
    }

    if (
      session.pairing?.number === phone
    ) {
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

  for (
    const session of sessions.values()
  ) {
    if (
      session.socket === socket
    ) {
      return session;
    }
  }

  return null;
}

// ======================================================
// UPDATE SESSION
// ======================================================

function updateSession(
  sessionId,
  updates = {}
) {
  const session =
    getSession(sessionId);

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

  for (
    const field of allowedFields
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        updates,
        field
      )
    ) {
      session[field] =
        updates[field];
    }
  }

  session.updatedAt =
    Date.now();

  return session;
}

// ======================================================
// SOCKET
// ======================================================

function setSocket(
  sessionId,
  socket
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.socket =
    socket || null;

  session.updatedAt =
    Date.now();

  return session;
}

function getSocket(sessionId) {
  const session =
    getSession(sessionId);

  return (
    session?.socket ||
    null
  );
}

// ======================================================
// STATUS
// ======================================================

function setStatus(
  sessionId,
  status,
  connected = null
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.status =
    String(
      status ||
      "disconnected"
    );

  /*
   * Only change connected when
   * caller explicitly supplies it.
   */
  if (connected !== null) {
    session.connected =
      Boolean(connected);
  }

  session.updatedAt =
    Date.now();

  return session;
}

// ======================================================
// CONNECTED
// ======================================================

function setConnected(
  sessionId,
  connected
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.connected =
    Boolean(connected);

  if (session.connected) {
    session.status =
      "connected";
  } else {
    session.status =
      "disconnected";
  }

  session.updatedAt =
    Date.now();

  return session;
}

// ======================================================
// NUMBER
// ======================================================

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
      "Nimewo WhatsApp la pa valid."
    );
  }

  session.number =
    phone;

  /*
   * Keep pairing number
   * synchronized when possible.
   */
  if (
    session.pairing
  ) {
    session.pairing.number =
      phone;
  }

  session.updatedAt =
    Date.now();

  return session;
}

// ======================================================
// PAIRING STATE
// ======================================================

function setPairingState(
  sessionId,
  data = {}
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.pairing = {
    ...session.pairing,
    ...data
  };

  if (
    data.number !== undefined
  ) {
    const phone =
      cleanPhoneNumber(
        data.number
      );

    if (
      phone &&
      !validatePhoneNumber(phone)
    ) {
      throw new Error(
        "Nimewo WhatsApp la pa valid."
      );
    }

    session.pairing.number =
      phone;
  }

  session.updatedAt =
    Date.now();

  return session;
}

// ======================================================
// START PAIRING
// ======================================================

function startPairing(
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
      "Nimewo WhatsApp la pa valid."
    );
  }

  session.pairing = {
    inProgress: true,
    number: phone,
    code: "",
    createdAt: Date.now()
  };

  if (phone) {
    session.number =
      phone;
  }

  session.updatedAt =
    Date.now();

  return session;
}

// ======================================================
// SET PAIRING CODE
// ======================================================

function setPairingCode(
  sessionId,
  code
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.pairing.code =
    String(code || "");

  session.pairing.inProgress =
    Boolean(code);

  if (
    !session.pairing.createdAt
  ) {
    session.pairing.createdAt =
      Date.now();
  }

  session.updatedAt =
    Date.now();

  return session;
}

// ======================================================
// GET PAIRING INFO
// ======================================================

function getPairingInfo(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  return {
    inProgress:
      Boolean(
        session.pairing?.inProgress
      ),

    number:
      session.pairing?.number ||
      session.number ||
      "",

    code:
      session.pairing?.code ||
      "",

    createdAt:
      session.pairing?.createdAt ||
      0
  };
}

// ======================================================
// CLEAR PAIRING
// ======================================================

function clearPairingState(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.pairing = {
    inProgress: false,

    number:
      session.number || "",

    code: "",

    createdAt: 0
  };

  session.updatedAt =
    Date.now();

  return session;
}

// Alias compatibility
function clearPairing(
  sessionId
) {
  return clearPairingState(
    sessionId
  );
}

// Alias compatibility
function setPairing(
  sessionId,
  data = {}
) {
  return setPairingState(
    sessionId,
    data
  );
}

// ======================================================
// SESSION CHECKS
// ======================================================

function hasSession(
  sessionId
) {
  return sessions.has(
    String(sessionId || "")
  );
}

function hasNumber(number) {
  return Boolean(
    getSessionByNumber(number)
  );
}

function isConnected(
  sessionId
) {
  const session =
    getSession(sessionId);

  return Boolean(
    session &&
    session.connected &&
    session.socket &&
    session.socket.user
  );
}

// ======================================================
// PHONE NUMBER FROM SESSION
// ======================================================

function getPhoneNumber(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return "";
  }

  return (
    session.number ||
    session.pairing?.number ||
    ""
  );
}

// ======================================================
// ALL SESSIONS
// ======================================================

function getAllSessions() {
  return Array.from(
    sessions.values()
  );
}

// Compatibility alias
function listSessions() {
  return getAllSessions();
}

// ======================================================
// SESSION COUNT
// ======================================================

function getSessionCount() {
  return sessions.size;
}

function countSessions() {
  return sessions.size;
}

function countConnectedSessions() {
  let count = 0;

  for (
    const session of sessions.values()
  ) {
    if (session.connected) {
      count++;
    }
  }

  return count;
}

// ======================================================
// PUBLIC SESSION
// ======================================================
// Pa janm mete socket la nan public response.

function getPublicSession(
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

    status:
      session.status,

    connected:
      session.connected,

    pairing: {
      inProgress:
        Boolean(
          session.pairing?.inProgress
        ),

      number:
        session.pairing?.number ||
        "",

      code:
        session.pairing?.code ||
        "",

      createdAt:
        session.pairing?.createdAt ||
        0
    },

    settings:
      session.settings,

    metadata:
      session.metadata,

    createdAt:
      session.createdAt,

    updatedAt:
      session.updatedAt
  };
}

// ======================================================
// ALL PUBLIC SESSIONS
// ======================================================

function getAllPublicSessions() {
  return getAllSessions().map(
    session => ({
      sessionId:
        session.sessionId,

      number:
        session.number,

      status:
        session.status,

      connected:
        session.connected,

      createdAt:
        session.createdAt,

      updatedAt:
        session.updatedAt
    })
  );
}

// Compatibility alias
function listPublicSessions() {
  return getAllPublicSessions();
}

// ======================================================
// STORED SESSION DIRECTORIES
// ======================================================

function getStoredSessionIds() {
  ensureSessionsDirectory();

  try {
    return fs
      .readdirSync(
        SESSIONS_DIR,
        {
          withFileTypes: true
        }
      )
      .filter(
        entry =>
          entry.isDirectory()
      )
      .map(
        entry =>
          entry.name
      );
  } catch (error) {
    console.error(
      "❌ Erè pandan lecture stored sessions:",
      error.message
    );

    return [];
  }
}

// ======================================================
// RESTORE SESSION RECORD
// ======================================================

function restoreSession(
  sessionId
) {
  ensureSessionsDirectory();

  if (!sessionId) {
    return null;
  }

  const id =
    String(sessionId);

  const existing =
    getSession(id);

  if (existing) {
    return existing;
  }

  const sessionDir =
    getSessionDir(id);

  const authDir =
    getAuthDir(id);

  /*
   * Only restore a directory
   * that actually exists.
   */
  if (
    !fs.existsSync(
      authDir
    )
  ) {
    return null;
  }

  const now =
    Date.now();

  const session = {
    sessionId: id,

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

  sessions.set(
    id,
    session
  );

  return session;
}

// ======================================================
// REMOVE SESSION
// ======================================================

async function removeSession(
  sessionId,
  options = {}
) {
  if (!sessionId) {
    return false;
  }

  const id =
    String(sessionId);

  const session =
    getSession(id);

  /*
   * If session exists only on disk,
   * still allow removal.
   */
  const sessionDir =
    session?.sessionDir ||
    getSessionDir(id);

  const deleteAuth =
    options.deleteAuth !== false;

  /*
   * Close socket if possible.
   */
  if (session?.socket) {
    try {
      if (
        typeof session.socket.end ===
        "function"
      ) {
        session.socket.end(
          undefined
        );
      }
    } catch (error) {
      console.error(
        `[SESSION] Erè pandan fermeture ${id}:`,
        error.message
      );
    }
  }

  sessions.delete(id);

  /*
   * Delete authentication/session folder.
   */
  if (
    deleteAuth &&
    fs.existsSync(sessionDir)
  ) {
    try {
      fs.rmSync(
        sessionDir,
        {
          recursive: true,
          force: true
        }
      );
    } catch (error) {
      console.error(
        `[SESSION] Pa kapab efase session folder ${id}:`,
        error.message
      );

      return false;
    }
  }

  return Boolean(
    session ||
    fs.existsSync(sessionDir) === false
  );
}

// ======================================================
// CLEAR ALL SESSIONS
// ======================================================

async function clearAllSessions(
  options = {}
) {
  const deleteAuth =
    options.deleteAuth === true;

  const storedIds =
    getStoredSessionIds();

  const memoryIds =
    Array.from(
      sessions.keys()
    );

  const ids =
    Array.from(
      new Set([
        ...storedIds,
        ...memoryIds
      ])
    );

  for (
    const sessionId of ids
  ) {
    await removeSession(
      sessionId,
      {
        deleteAuth
      }
    );
  }

  return true;
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  // Core
  ROOT_DIR,
  SESSIONS_DIR,
  sessions,

  // Directories
  ensureSessionsDirectory,
  getSessionDir,
  getAuthDir,
  ensureSessionDirectories,

  // Phone
  cleanPhoneNumber,
  validatePhoneNumber,

  // Session ID
  generateSessionId,

  // Creation
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
  setConnected,

  // Phone
  getPhoneNumber,

  // Pairing
  setPairingState,
  setPairing,
  startPairing,
  setPairingCode,
  getPairingInfo,
  clearPairingState,
  clearPairing,

  // Checks
  hasSession,
  hasNumber,
  isConnected,

  // Lists
  getAllSessions,
  listSessions,

  getAllPublicSessions,
  listPublicSessions,

  getSessionCount,
  countSessions,
  countConnectedSessions,

  getPublicSession,

  // Disk
  getStoredSessionIds,
  restoreSession,

  // Remove
  removeSession,
  clearAllSessions
};