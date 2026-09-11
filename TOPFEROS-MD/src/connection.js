"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ============================================================
// PATHS
// ============================================================

const ROOT_DIR = path.join(__dirname, "..");

const SESSIONS_DIR = path.join(
  ROOT_DIR,
  "auth",
  "sessions"
);

fs.mkdirSync(SESSIONS_DIR, {
  recursive: true
});

// ============================================================
// MEMORY
// ============================================================

const sessions = new Map();

// ============================================================
// PHONE HELPERS
// ============================================================

function cleanPhoneNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}

function normalizeNumber(number) {
  const cleaned = cleanPhoneNumber(number);

  return cleaned || null;
}

function validatePhoneNumber(number) {
  const phone = cleanPhoneNumber(number);

  return (
    phone.length >= 8 &&
    phone.length <= 15
  );
}

// ============================================================
// FILE HELPERS
// ============================================================

function sessionFile(sessionId) {
  return path.join(
    SESSIONS_DIR,
    sessionId,
    "session.json"
  );
}

function authDirectory(sessionId) {
  return path.join(
    SESSIONS_DIR,
    sessionId,
    "auth"
  );
}

function ensureSessionDirectory(sessionId) {
  const dir = path.join(
    SESSIONS_DIR,
    sessionId
  );

  fs.mkdirSync(dir, {
    recursive: true
  });

  return dir;
}

function ensureAuthDirectory(sessionId) {
  const dir = authDirectory(sessionId);

  fs.mkdirSync(dir, {
    recursive: true
  });

  return dir;
}

// ============================================================
// SESSION ID
// ============================================================

function generateSessionId() {
  return (
    "session-" +
    crypto.randomBytes(6).toString("hex")
  );
}

// ============================================================
// SAVE SESSION
// ============================================================

function saveSession(session) {
  if (!session || !session.sessionId) {
    return false;
  }

  try {
    ensureSessionDirectory(
      session.sessionId
    );

    const file = sessionFile(
      session.sessionId
    );

    const data = {
      sessionId:
        session.sessionId,

      number:
        normalizeNumber(
          session.number
        ),

      status:
        session.status ||
        "disconnected",

      pairing:
        !!session.pairing,

      pairingCode:
        session.pairingCode ||
        null,

      pairingStartedAt:
        session.pairingStartedAt ||
        null,

      createdAt:
        session.createdAt ||
        Date.now(),

      updatedAt:
        Date.now()
    };

    fs.writeFileSync(
      file,
      JSON.stringify(
        data,
        null,
        2
      ),
      "utf8"
    );

    session.updatedAt =
      data.updatedAt;

    return true;
  } catch (error) {
    console.error(
      "SAVE SESSION ERROR:",
      error.message
    );

    return false;
  }
}

// ============================================================
// READ SESSION
// ============================================================

function readSessionFile(sessionId) {
  const file =
    sessionFile(sessionId);

  if (!fs.existsSync(file)) {
    return null;
  }

  try {
    return JSON.parse(
      fs.readFileSync(
        file,
        "utf8"
      )
    );
  } catch (error) {
    console.error(
      `READ SESSION ERROR [${sessionId}]:`,
      error.message
    );

    return null;
  }
}

// ============================================================
// BUILD SESSION
// ============================================================

function buildSession(options = {}) {
  if (
    typeof options === "string" ||
    typeof options === "number"
  ) {
    options = {
      number: String(options)
    };
  }

  options = options || {};

  const {
    sessionId = null,
    number = null,
    socket = null,
    sock = null,
    settings = {},
    bot = {},
    status = null,
    pairing = false,
    pairingCode = null,
    pairingStartedAt = null,
    panelSession = null,
    createdAt = null,
    updatedAt = null
  } = options;

  const id =
    sessionId ||
    generateSessionId();

  const finalSocket =
    socket ||
    sock ||
    null;

  return {
    sessionId: id,

    number:
      normalizeNumber(number),

    authDir:
      authDirectory(id),

    socket:
      finalSocket,

    connected:
      !!(
        finalSocket &&
        finalSocket.user
      ),

    status:
      status ||
      (
        finalSocket &&
        finalSocket.user
          ? "connected"
          : "disconnected"
      ),

    pairing:
      !!pairing,

    pairingCode:
      pairingCode ||
      null,

    pairingStartedAt:
      pairingStartedAt ||
      null,

    panelSession:
      panelSession ||
      null,

    settings:
      settings ||
      {},

    bot:
      bot ||
      {},

    createdAt:
      createdAt ||
      Date.now(),

    updatedAt:
      updatedAt ||
      Date.now()
  };
}

// ============================================================
// CREATE SESSION
// ============================================================

function createSession(options = {}) {
  /*
   * Supports both:
   *
   * createSession("509xxxxxxxx")
   *
   * and:
   *
   * createSession({
   *   number: "509xxxxxxxx"
   * })
   */

  if (
    typeof options === "string" ||
    typeof options === "number"
  ) {
    options = {
      number: String(options)
    };
  }

  options = options || {};

  const number =
    normalizeNumber(
      options.number
    );

  if (!number) {
    throw new Error(
      "Bot number pa disponib pou kreye session."
    );
  }

  // Reuse existing session for same number
  const existing =
    getSessionByNumber(number);

  if (existing) {
    return existing;
  }

  const session =
    buildSession(options);

  ensureSessionDirectory(
    session.sessionId
  );

  ensureAuthDirectory(
    session.sessionId
  );

  sessions.set(
    session.sessionId,
    session
  );

  saveSession(session);

  return session;
}

// ============================================================
// GET SESSION
// ============================================================

function getSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  if (
    sessions.has(sessionId)
  ) {
    return sessions.get(
      sessionId
    );
  }

  const stored =
    readSessionFile(sessionId);

  if (!stored) {
    return null;
  }

  const session =
    buildSession({
      sessionId:
        stored.sessionId ||
        sessionId,

      number:
        stored.number,

      status:
        stored.status,

      pairing:
        stored.pairing,

      pairingCode:
        stored.pairingCode,

      pairingStartedAt:
        stored.pairingStartedAt,

      createdAt:
        stored.createdAt,

      updatedAt:
        stored.updatedAt
    });

  ensureSessionDirectory(
    session.sessionId
  );

  ensureAuthDirectory(
    session.sessionId
  );

  sessions.set(
    session.sessionId,
    session
  );

  return session;
}

// ============================================================
// GET ALL SESSIONS
// ============================================================

function getAllSessions() {
  return Array.from(
    sessions.values()
  );
}

function getSessions() {
  return getAllSessions();
}

function getSessionCount() {
  return sessions.size;
}

// ============================================================
// GET SESSION BY NUMBER
// ============================================================

function getSessionByNumber(number) {
  const clean =
    cleanPhoneNumber(number);

  if (!clean) {
    return null;
  }

  // First check loaded sessions
  for (
    const session of sessions.values()
  ) {
    const sessionNumber =
      cleanPhoneNumber(
        session.number
      );

    if (
      sessionNumber &&
      sessionNumber === clean
    ) {
      return session;
    }
  }

  // Then check stored session folders
  const storedIds =
    getStoredSessionIds();

  for (
    const sessionId of storedIds
  ) {
    const session =
      getSession(sessionId);

    if (!session) {
      continue;
    }

    const sessionNumber =
      cleanPhoneNumber(
        session.number
      );

    if (
      sessionNumber &&
      sessionNumber === clean
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
    return false;
  }

  session.socket =
    socket || null;

  session.connected =
    !!(
      socket &&
      socket.user
    );

  session.updatedAt =
    Date.now();

  return true;
}

function getSocket(sessionId) {
  const session =
    getSession(sessionId);

  return session
    ? session.socket
    : null;
}

// ============================================================
// NUMBER
// ============================================================

function setPhoneNumber(
  sessionId,
  number
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  const clean =
    normalizeNumber(number);

  session.number =
    clean;

  saveSession(session);

  return true;
}

/*
 * connection.js uses setNumber().
 * Keep this alias for compatibility.
 */
function setNumber(
  sessionId,
  number
) {
  return setPhoneNumber(
    sessionId,
    number
  );
}

function getPhoneNumber(
  sessionId
) {
  const session =
    getSession(sessionId);

  return session
    ? session.number
    : null;
}

// ============================================================
// STATUS
// ============================================================

function setStatus(
  sessionId,
  status
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.status =
    status ||
    "disconnected";

  session.connected =
    status === "connected";

  saveSession(session);

  return true;
}

function getStatus(
  sessionId
) {
  const session =
    getSession(sessionId);

  return session
    ? session.status
    : null;
}

function isConnected(
  sessionId
) {
  const session =
    getSession(sessionId);

  return !!(
    session &&
    session.connected &&
    session.socket &&
    session.socket.user
  );
}

// ============================================================
// PAIRING
// ============================================================

function startPairing(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.pairing =
    true;

  session.pairingCode =
    null;

  session.pairingStartedAt =
    Date.now();

  session.status =
    "pairing";

  saveSession(session);

  return true;
}

function setPairingCode(
  sessionId,
  code
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.pairingCode =
    code
      ? String(code)
      : null;

  session.pairing =
    true;

  session.status =
    "pairing";

  saveSession(session);

  return true;
}

function endPairing(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.pairing =
    false;

  session.pairingCode =
    null;

  session.pairingStartedAt =
    null;

  saveSession(session);

  return true;
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
      !!session.pairing,

    pairingCode:
      session.pairingCode,

    pairingStartedAt:
      session.pairingStartedAt,

    status:
      session.status
  };
}

// ============================================================
// STORED SESSIONS
// ============================================================

function getStoredSessionIds() {
  if (
    !fs.existsSync(
      SESSIONS_DIR
    )
  ) {
    return [];
  }

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
      "GET STORED SESSION IDS ERROR:",
      error.message
    );

    return [];
  }
}

// ============================================================
// RESTORE SESSION
// ============================================================

function restoreSession(
  sessionId
) {
  return getSession(
    sessionId
  );
}

function restoreSessions() {
  const ids =
    getStoredSessionIds();

  const restored = [];

  for (
    const sessionId of ids
  ) {
    try {
      const session =
        restoreSession(
          sessionId
        );

      if (session) {
        restored.push(
          session
        );
      }
    } catch (error) {
      console.error(
        `[${sessionId}] RESTORE ERROR:`,
        error.message
      );
    }
  }

  return restored;
}

// ============================================================
// RESET AUTH
// ============================================================

function resetAuth(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  try {
    const authDir =
      session.authDir;

    if (
      fs.existsSync(authDir)
    ) {
      fs.rmSync(
        authDir,
        {
          recursive: true,
          force: true
        }
      );
    }

    fs.mkdirSync(
      authDir,
      {
        recursive: true
      }
    );

    session.socket =
      null;

    session.connected =
      false;

    session.status =
      "disconnected";

    session.pairing =
      false;

    session.pairingCode =
      null;

    session.pairingStartedAt =
      null;

    saveSession(session);

    return true;
  } catch (error) {
    console.error(
      "RESET AUTH ERROR:",
      error.message
    );

    return false;
  }
}

// ============================================================
// REMOVE SESSION
// ============================================================

function removeSession(
  sessionId
) {
  if (!sessionId) {
    return false;
  }

  sessions.delete(
    sessionId
  );

  const dir =
    path.join(
      SESSIONS_DIR,
      sessionId
    );

  try {
    if (
      fs.existsSync(dir)
    ) {
      fs.rmSync(
        dir,
        {
          recursive: true,
          force: true
        }
      );
    }

    return true;
  } catch (error) {
    console.error(
      "REMOVE SESSION ERROR:",
      error.message
    );

    return false;
  }
}

// ============================================================
// CLEAR ALL SESSIONS
// ============================================================

function clearSessions() {
  const ids =
    getStoredSessionIds();

  for (
    const sessionId of ids
  ) {
    removeSession(
      sessionId
    );
  }

  sessions.clear();

  return true;
}

// ============================================================
// SESSION SETTINGS
// ============================================================

function getSettings(
  sessionId
) {
  const session =
    getSession(sessionId);

  return session
    ? session.settings || {}
    : null;
}

function setSettings(
  sessionId,
  settings
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.settings =
    settings || {};

  session.updatedAt =
    Date.now();

  return true;
}

// ============================================================
// BOT DATA
// ============================================================

function getBot(
  sessionId
) {
  const session =
    getSession(sessionId);

  return session
    ? session.bot || {}
    : null;
}

function setBot(
  sessionId,
  bot
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.bot =
    bot || {};

  session.updatedAt =
    Date.now();

  return true;
}

// ============================================================
// PANEL SESSION
// ============================================================

function getPanelSession(
  sessionId
) {
  const session =
    getSession(sessionId);

  return session
    ? session.panelSession
    : null;
}

function setPanelSession(
  sessionId,
  panelSession
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.panelSession =
    panelSession || null;

  session.updatedAt =
    Date.now();

  return true;
}

// ============================================================
// PUBLIC SESSION DATA
// ============================================================

function getPublicSession(
  session
) {
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
      !!session.connected,

    pairing:
      !!session.pairing,

    pairingCode:
      session.pairingCode,

    pairingStartedAt:
      session.pairingStartedAt,

    createdAt:
      session.createdAt,

    updatedAt:
      session.updatedAt
  };
}

function getPublicSessions() {
  return getAllSessions()
    .map(
      getPublicSession
    )
    .filter(Boolean);
}

/*
 * Compatibility alias.
 */
function listPublicSessions() {
  return getPublicSessions();
}

// ============================================================
// CONNECT / DISCONNECT HELPERS
// ============================================================

function connectSession(
  sessionId,
  socket
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  if (socket) {
    session.socket =
      socket;
  }

  session.connected =
    !!(
      session.socket &&
      session.socket.user
    );

  session.status =
    session.connected
      ? "connected"
      : "connecting";

  saveSession(session);

  return true;
}

function disconnectSession(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.socket =
    null;

  session.connected =
    false;

  session.status =
    "disconnected";

  session.pairing =
    false;

  session.pairingCode =
    null;

  session.pairingStartedAt =
    null;

  saveSession(session);

  return true;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Paths
  SESSIONS_DIR,

  // Phone
  cleanPhoneNumber,
  normalizeNumber,
  validatePhoneNumber,

  // Sessions
  createSession,
  getSession,
  getAllSessions,
  getSessions,
  getSessionCount,
  getSessionByNumber,

  // Socket
  setSocket,
  getSocket,

  // Number
  setPhoneNumber,
  setNumber,
  getPhoneNumber,

  // Status
  setStatus,
  getStatus,
  isConnected,

  // Pairing
  startPairing,
  setPairingCode,
  endPairing,
  getPairingInfo,

  // Stored sessions
  getStoredSessionIds,
  restoreSession,
  restoreSessions,

  // Authentication
  resetAuth,

  // Remove / clear
  removeSession,
  clearSessions,

  // Settings
  getSettings,
  setSettings,

  // Bot
  getBot,
  setBot,

  // Panel
  getPanelSession,
  setPanelSession,

  // Public sessions
  getPublicSession,
  getPublicSessions,
  listPublicSessions,

  // Connection helpers
  connectSession,
  disconnectSession
};