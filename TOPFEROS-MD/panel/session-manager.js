"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                 SESSION MANAGER                   ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝


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
// MEMORY STORAGE
// ============================================================

const sessions = new Map();


// ============================================================
// HELPERS
// ============================================================

function cleanPhoneNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}


function normalizeNumber(number) {
  return cleanPhoneNumber(number);
}


function validatePhoneNumber(number) {
  const phone = cleanPhoneNumber(number);

  return (
    phone.length >= 8 &&
    phone.length <= 15
  );
}


function generateSessionId() {
  return (
    "session-" +
    crypto
      .randomBytes(12)
      .toString("hex")
  );
}


function generateParrainCode() {
  return crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();
}


function getAuthDir(sessionId) {
  return path.join(
    AUTH_ROOT,
    sessionId,
    "auth"
  );
}


function getSessionDir(sessionId) {
  return path.join(
    AUTH_ROOT,
    sessionId
  );
}


function getSessionFile(sessionId) {
  return path.join(
    getSessionDir(sessionId),
    "session.json"
  );
}


function ensureSessionDirectories(sessionId) {
  fs.mkdirSync(
    getAuthDir(sessionId),
    {
      recursive: true
    }
  );
}


// ============================================================
// PERSIST SESSION
// ============================================================

function persistSession(session) {
  if (!session || !session.sessionId) {
    return false;
  }

  try {
    ensureSessionDirectories(
      session.sessionId
    );

    const data = {
      sessionId:
        session.sessionId,

      number:
        session.number || null,

      code:
        session.code || null,

      authenticated:
        session.authenticated === true,

      connected:
        session.connected === true,

      status:
        session.status ||
        "disconnected",

      pairing:
        session.pairing === true,

      pairingCode:
        session.pairingCode || null,

      pairingStartedAt:
        session.pairingStartedAt ||
        null,

      createdAt:
        session.createdAt ||
        Date.now(),

      updatedAt:
        Date.now(),

      settings:
        session.settings || {},

      bot:
        session.bot || {},

      panelSession:
        session.panelSession || null
    };

    fs.writeFileSync(
      getSessionFile(
        session.sessionId
      ),
      JSON.stringify(
        data,
        null,
        2
      ),
      "utf8"
    );

    return true;

  } catch (error) {
    console.error(
      "❌ SESSION PERSIST ERROR:",
      error?.message || error
    );

    return false;
  }
}


// ============================================================
// LOAD SESSION FROM DISK
// ============================================================

function loadSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  const file =
    getSessionFile(
      sessionId
    );

  if (!fs.existsSync(file)) {
    return null;
  }

  try {
    const raw =
      fs.readFileSync(
        file,
        "utf8"
      );

    const data =
      JSON.parse(raw);

    const session = {
      sessionId:
        data.sessionId ||
        sessionId,

      number:
        data.number ||
        null,

      code:
        data.code ||
        generateParrainCode(),

      authenticated:
        data.authenticated === true,

      connected:
        false,

      socket:
        null,

      authDir:
        getAuthDir(
          data.sessionId ||
          sessionId
        ),

      status:
        "disconnected",

      pairing:
        false,

      pairingCode:
        null,

      pairingStartedAt:
        null,

      createdAt:
        data.createdAt ||
        Date.now(),

      updatedAt:
        Date.now(),

      settings:
        data.settings || {},

      bot:
        data.bot || {},

      panelSession:
        data.panelSession ||
        null
    };

    ensureSessionDirectories(
      session.sessionId
    );

    return session;

  } catch (error) {
    console.error(
      `❌ SESSION LOAD ERROR [${sessionId}]:`,
      error?.message || error
    );

    return null;
  }
}


// ============================================================
// CREATE SESSION
// ============================================================

function createSession(options = {}) {
  const {
    sessionId:
      requestedSessionId = null,

    number = null,

    socket = null,

    sock = null,

    settings = {},

    bot = {},

    status = null,

    pairing = false,

    panelSession = null
  } = options || {};

  const finalSocket =
    socket ||
    sock ||
    null;

  let cleanNumber =
    cleanPhoneNumber(
      number ||
      finalSocket?.user?.id ||
      ""
    );

  let sessionId =
    requestedSessionId ||
    null;

  // ----------------------------------------------------------
  // EXISTING SESSION BY ID
  // ----------------------------------------------------------

  if (sessionId) {
    const existingById =
      sessions.get(
        sessionId
      );

    if (existingById) {

      if (cleanNumber) {
        existingById.number =
          cleanNumber;
      }

      if (finalSocket) {
        existingById.socket =
          finalSocket;
      }

      if (settings) {
        existingById.settings = {
          ...existingById.settings,
          ...settings
        };
      }

      if (bot) {
        existingById.bot = {
          ...existingById.bot,
          ...bot
        };
      }

      existingById.connected =
        Boolean(
          finalSocket ||
          existingById.socket
        );

      existingById.updatedAt =
        Date.now();

      persistSession(
        existingById
      );

      return sanitizeSession(
        existingById
      );
    }

    // Try loading existing stored session
    const stored =
      loadSession(
        sessionId
      );

    if (stored) {

      if (cleanNumber) {
        stored.number =
          cleanNumber;
      }

      if (finalSocket) {
        stored.socket =
          finalSocket;

        stored.connected =
          true;
      }

      sessions.set(
        sessionId,
        stored
      );

      persistSession(
        stored
      );

      return sanitizeSession(
        stored
      );
    }
  }

  // ----------------------------------------------------------
  // EXISTING SESSION BY NUMBER
  // ----------------------------------------------------------

  if (cleanNumber) {

    const existing =
      getSessionByNumber(
        cleanNumber
      );

    if (existing) {

      if (finalSocket) {
        existing.socket =
          finalSocket;

        existing.connected =
          true;
      }

      if (settings) {
        existing.settings = {
          ...existing.settings,
          ...settings
        };
      }

      if (bot) {
        existing.bot = {
          ...existing.bot,
          ...bot
        };
      }

      existing.updatedAt =
        Date.now();

      persistSession(
        existing
      );

      return sanitizeSession(
        existing
      );
    }
  }

  // ----------------------------------------------------------
  // NUMBER IS REQUIRED FOR A NEW SESSION
  // ----------------------------------------------------------

  if (!cleanNumber) {
    throw new Error(
      "Bot number pa disponib pou kreye session."
    );
  }

  // ----------------------------------------------------------
  // NEW SESSION
  // ----------------------------------------------------------

  sessionId =
    sessionId ||
    generateSessionId();

  const session = {

    sessionId,

    number:
      cleanNumber,

    code:
      generateParrainCode(),

    authenticated:
      false,

    connected:
      Boolean(
        finalSocket
      ),

    socket:
      finalSocket,

    authDir:
      getAuthDir(
        sessionId
      ),

    status:
      status ||
      (
        finalSocket
          ? "connected"
          : "disconnected"
      ),

    pairing:
      pairing === true,

    pairingCode:
      null,

    pairingStartedAt:
      null,

    createdAt:
      Date.now(),

    updatedAt:
      Date.now(),

    settings: {
      ...settings
    },

    bot: {
      ...bot
    },

    panelSession:
      panelSession ||
      null
  };

  ensureSessionDirectories(
    sessionId
  );

  sessions.set(
    sessionId,
    session
  );

  persistSession(
    session
  );

  console.log(
    `🟢 SESSION MANAGER: Session created ${sessionId} → ${cleanNumber}`
  );

  return sanitizeSession(
    session
  );
}


// ============================================================
// GET SESSION
// ============================================================

function getSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  return (
    sessions.get(
      String(sessionId)
    ) ||
    null
  );
}


// ============================================================
// GET SESSION BY NUMBER
// ============================================================

function getSessionByNumber(number) {
  const cleanNumber =
    cleanPhoneNumber(
      number
    );

  if (!cleanNumber) {
    return null;
  }

  for (
    const session
    of sessions.values()
  ) {

    if (
      session.number ===
      cleanNumber
    ) {
      return session;
    }
  }

  return null;
}


// ============================================================
// GET ALL SESSIONS
// ============================================================

function getAllSessions() {
  return Array.from(
    sessions.values()
  );
}


// ============================================================
// GET SESSIONS
// ============================================================

function getSessions() {
  return getAllSessions()
    .map(
      sanitizeSession
    );
}


// ============================================================
// GET SESSION COUNT
// ============================================================

function getSessionCount() {
  return sessions.size;
}


// ============================================================
// GET STORED SESSION IDS
// ============================================================

function getStoredSessionIds() {
  if (!fs.existsSync(AUTH_ROOT)) {
    return [];
  }

  try {

    return fs
      .readdirSync(
        AUTH_ROOT,
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
      )
      .filter(
        sessionId =>
          fs.existsSync(
            getSessionFile(
              sessionId
            )
          )
      );

  } catch (error) {

    console.error(
      "❌ GET STORED SESSIONS ERROR:",
      error?.message || error
    );

    return [];
  }
}


// ============================================================
// RESTORE SESSION
// ============================================================

function restoreSession(sessionId) {
  const existing =
    getSession(
      sessionId
    );

  if (existing) {
    return existing;
  }

  const session =
    loadSession(
      sessionId
    );

  if (!session) {
    return null;
  }

  sessions.set(
    session.sessionId,
    session
  );

  return session;
}


// ============================================================
// RESTORE ALL SESSIONS
// ============================================================

function restoreSessions() {
  const ids =
    getStoredSessionIds();

  let restored = 0;

  for (
    const sessionId
    of ids
  ) {

    const session =
      restoreSession(
        sessionId
      );

    if (session) {
      restored++;
    }
  }

  console.log(
    `📂 SESSION MANAGER: ${restored} stored session(s) restored.`
  );

  return restored;
}


// ============================================================
// SOCKET
// ============================================================

function setSocket(
  sessionId,
  socket
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  session.socket =
    socket || null;

  session.connected =
    Boolean(
      socket
    );

  session.updatedAt =
    Date.now();

  persistSession(
    session
  );

  return true;
}


function getSocket(sessionId) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return null;
  }

  return session.socket || null;
}


// ============================================================
// CONNECTION
// ============================================================

function connectSession(
  sessionId,
  socket
) {
  const session =
    getSession(
      sessionId
    );

  if (
    !session ||
    !socket
  ) {
    return false;
  }

  session.socket =
    socket;

  session.connected =
    true;

  session.status =
    "connected";

  session.pairing =
    false;

  session.pairingCode =
    null;

  session.pairingStartedAt =
    null;

  session.updatedAt =
    Date.now();

  persistSession(
    session
  );

  return true;
}


function disconnectSession(
  sessionId,
  status = "disconnected"
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  session.socket =
    null;

  session.connected =
    false;

  session.status =
    status;

  session.pairing =
    false;

  session.pairingCode =
    null;

  session.pairingStartedAt =
    null;

  session.updatedAt =
    Date.now();

  persistSession(
    session
  );

  return true;
}


// ============================================================
// PHONE NUMBER
// ============================================================

function getPhoneNumber(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  return (
    session?.number ||
    null
  );
}


function setPhoneNumber(
  sessionId,
  number
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  const cleanNumber =
    cleanPhoneNumber(
      number
    );

  if (!cleanNumber) {
    return false;
  }

  session.number =
    cleanNumber;

  session.updatedAt =
    Date.now();

  persistSession(
    session
  );

  return true;
}


// ============================================================
// STATUS
// ============================================================

function setStatus(
  sessionId,
  status
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  session.status =
    String(
      status ||
      "disconnected"
    );

  session.updatedAt =
    Date.now();

  persistSession(
    session
  );

  return true;
}


function getStatus(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  return (
    session?.status ||
    "disconnected"
  );
}


function isConnected(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  return Boolean(
    session &&
    session.connected &&
    session.socket
  );
}


// ============================================================
// PAIRING
// ============================================================

function startPairing(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  session.pairing =
    true;

  session.status =
    "pairing";

  session.pairingStartedAt =
    Date.now();

  session.pairingCode =
    null;

  session.updatedAt =
    Date.now();

  persistSession(
    session
  );

  return true;
}


function setPairingCode(
  sessionId,
  code
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  session.pairing =
    true;

  session.status =
    "pairing";

  session.pairingCode =
    String(
      code || ""
    )
      .trim()
      .toUpperCase();

  session.updatedAt =
    Date.now();

  persistSession(
    session
  );

  return true;
}


function endPairing(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  session.pairing =
    false;

  session.pairingCode =
    null;

  session.pairingStartedAt =
    null;

  session.updatedAt =
    Date.now();

  persistSession(
    session
  );

  return true;
}


function getPairingInfo(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return null;
  }

  return {
    pairing:
      session.pairing === true,

    code:
      session.pairingCode ||
      null,

    startedAt:
      session.pairingStartedAt ||
      null,

    status:
      session.status ||
      "disconnected"
  };
}


// ============================================================
// AUTHENTICATION
// ============================================================

function setAuthenticated(
  sessionId,
  value = true
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  session.authenticated =
    value === true;

  session.updatedAt =
    Date.now();

  persistSession(
    session
  );

  return true;
}


function isAuthenticated(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  return Boolean(
    session &&
    session.connected &&
    session.socket &&
    session.authenticated === true
  );
}


function verifySession(
  sessionId,
  number,
  code
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return {
      success: false,
      message:
        "❌ Session la pa egziste."
    };
  }

  if (
    !session.connected ||
    !session.socket
  ) {
    return {
      success: false,
      message:
        "❌ Bot la pa konekte."
    };
  }

  const cleanNumber =
    cleanPhoneNumber(
      number
    );

  const cleanCode =
    String(
      code || ""
    )
      .trim()
      .toUpperCase();

  if (
    cleanNumber !==
    session.number
  ) {
    return {
      success: false,
      message:
        "❌ Number lan pa koresponn ak session lan."
    };
  }

  if (
    cleanCode !==
    session.code
  ) {
    return {
      success: false,
      message:
        "❌ Parrain Code la pa kòrèk."
    };
  }

  session.authenticated =
    true;

  session.updatedAt =
    Date.now();

  persistSession(
    session
  );

  console.log(
    `🔐 SESSION MANAGER: Session authenticated ${session.number}`
  );

  return {
    success: true,

    session:
      sanitizeSession(
        session
      )
  };
}


// ============================================================
// SETTINGS
// ============================================================

function updateSettings(
  sessionId,
  settings = {}
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  session.settings = {
    ...session.settings,
    ...settings
  };

  session.updatedAt =
    Date.now();

  persistSession(
    session
  );

  return true;
}


function getSettings(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return {};
  }

  return {
    ...session.settings
  };
}


// ============================================================
// BOT INFORMATION
// ============================================================

function updateBot(
  sessionId,
  bot = {}
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  session.bot = {
    ...session.bot,
    ...bot
  };

  session.updatedAt =
    Date.now();

  persistSession(
    session
  );

  return true;
}


function getBot(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return {};
  }

  return {
    ...session.bot
  };
}


// ============================================================
// RESET AUTH
// ============================================================

function resetAuth(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  try {

    const authDir =
      getAuthDir(
        sessionId
      );

    if (
      fs.existsSync(
        authDir
      )
    ) {
      fs.rmSync(
        authDir,
        {
          recursive: true,
          force: true
        }
      );
    }

    ensureSessionDirectories(
      sessionId
    );

    session.socket =
      null;

    session.connected =
      false;

    session.authenticated =
      false;

    session.pairing =
      false;

    session.pairingCode =
      null;

    session.pairingStartedAt =
      null;

    session.status =
      "disconnected";

    session.updatedAt =
      Date.now();

    persistSession(
      session
    );

    console.log(
      `🧹 SESSION MANAGER: Auth reset for ${sessionId}`
    );

    return true;

  } catch (error) {

    console.error(
      `❌ RESET AUTH ERROR [${sessionId}]:`,
      error?.message || error
    );

    return false;
  }
}


// ============================================================
// DELETE SESSION
// ============================================================

function deleteSession(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  sessions.delete(
    sessionId
  );

  try {

    const sessionDir =
      getSessionDir(
        sessionId
      );

    if (
      fs.existsSync(
        sessionDir
      )
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
      `❌ DELETE SESSION FILE ERROR [${sessionId}]:`,
      error?.message || error
    );
  }

  console.log(
    `🗑️ SESSION MANAGER: Session deleted ${sessionId}`
  );

  return true;
}


// ============================================================
// CLEAR MEMORY ONLY
// ============================================================

function clearSessions() {
  sessions.clear();

  console.log(
    "🧹 SESSION MANAGER: Memory sessions cleared."
  );
}


// ============================================================
// PUBLIC SESSION LIST
// ============================================================

function listPublicSessions() {
  return getAllSessions().map(
    session => ({
      sessionId:
        session.sessionId,

      number:
        session.number,

      status:
        session.status,

      connected:
        isConnected(
          session.sessionId
        ),

      pairing:
        session.pairing === true,

      authenticated:
        session.authenticated === true,

      createdAt:
        session.createdAt,

      updatedAt:
        session.updatedAt
    })
  );
}


// ============================================================
// SANITIZE
// ============================================================

function sanitizeSession(
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

    code:
      session.code,

    authenticated:
      session.authenticated === true,

    connected:
      session.connected === true,

    status:
      session.status ||
      "disconnected",

    pairing:
      session.pairing === true,

    pairingCode:
      session.pairingCode ||
      null,

    pairingStartedAt:
      session.pairingStartedAt ||
      null,

    authDir:
      session.authDir,

    settings: {
      ...session.settings
    },

    bot: {
      ...session.bot
    },

    panelSession:
      session.panelSession ||
      null,

    createdAt:
      session.createdAt,

    updatedAt:
      session.updatedAt
  };
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

  // Session
  createSession,
  generateSessionId,
  generateParrainCode,

  // Lookup
  getSession,
  getSessionByNumber,
  getAllSessions,
  getSessions,
  getSessionCount,

  // Stored sessions
  getStoredSessionIds,
  restoreSession,
  restoreSessions,

  // Numbers
  cleanPhoneNumber,
  normalizeNumber,
  validatePhoneNumber,
  getPhoneNumber,
  setPhoneNumber,

  // Paths
  getAuthDir,
  getSessionDir,

  // Socket
  setSocket,
  getSocket,

  // Connection
  connectSession,
  disconnectSession,
  isConnected,

  // Status
  setStatus,
  getStatus,

  // Pairing
  startPairing,
  setPairingCode,
  endPairing,
  getPairingInfo,

  // Authentication
  setAuthenticated,
  isAuthenticated,
  verifySession,

  // Settings
  updateSettings,
  getSettings,

  // Bot
  updateBot,
  getBot,

  // Auth reset
  resetAuth,

  // Delete
  deleteSession,
  clearSessions,

  // Public
  listPublicSessions,

  // Security
  sanitizeSession
};


// ╔════════════════════════════════════════════════════╗
// ║                 By TOPFEROS TECH                  ║
// ╚════════════════════════════════════════════════════╝