"use strict";

const crypto = require("crypto");

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                 SESSION MANAGER                   ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 SESSION STORAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sessions = new Map();


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 GENERATE SESSION ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateSessionId() {

  return crypto
    .randomBytes(24)
    .toString("hex");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 GENERATE PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateParrainCode() {

  return crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 NORMALIZE NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function normalizeNumber(number) {

  return String(number || "")
    .replace(/\D/g, "");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆕 CREATE SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createSession({
  sock = null,
  number = null,
  settings = {},
  bot = {}
} = {}) {

  const cleanNumber =
    normalizeNumber(
      number ||
      sock?.user?.id
    );

  if (!cleanNumber) {

    throw new Error(
      "Bot number pa disponib pou kreye session."
    );
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔎 CHECK EXISTING SESSION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const existing =
    getSessionByNumber(
      cleanNumber
    );


  if (existing) {

    if (sock) {
      existing.sock = sock;
    }

    return sanitizeSession(
      existing
    );
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🆕 NEW SESSION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const session = {

    sessionId:
      generateSessionId(),

    number:
      cleanNumber,

    code:
      generateParrainCode(),

    authenticated:
      false,

    connected:
      !!sock,

    sock,

    settings: {
      ...settings
    },

    bot: {
      ...bot
    },

    createdAt:
      Date.now(),

    updatedAt:
      Date.now()
  };


  sessions.set(
    session.sessionId,
    session
  );


  console.log(
    `🟢 SESSION MANAGER: Session created for ${cleanNumber}`
  );


  return sanitizeSession(
    session
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 CONNECT / REFRESH SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function connectSession(
  sessionId,
  sock
) {

  if (
    !sessionId ||
    !sock
  ) {
    return null;
  }


  const session =
    sessions.get(
      sessionId
    );


  if (!session) {
    return null;
  }


  session.sock =
    sock;

  session.connected =
    true;

  session.updatedAt =
    Date.now();


  return sanitizeSession(
    session
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔴 DISCONNECT SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function disconnectSession(
  sessionId
) {

  const session =
    sessions.get(
      sessionId
    );


  if (!session) {
    return false;
  }


  session.sock =
    null;

  session.connected =
    false;

  session.authenticated =
    false;

  session.updatedAt =
    Date.now();


  console.log(
    `🔴 SESSION MANAGER: Session disconnected: ${session.number}`
  );


  return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 GET SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSession(
  sessionId
) {

  if (!sessionId) {
    return null;
  }


  return (
    sessions.get(
      sessionId
    ) || null
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 GET SESSION BY NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessionByNumber(
  number
) {

  const cleanNumber =
    normalizeNumber(
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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔌 GET SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSocket(
  sessionId
) {

  const session =
    getSession(
      sessionId
    );


  if (!session) {
    return null;
  }


  return session.sock || null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 VERIFY PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
    !session.sock
  ) {

    return {
      success: false,
      message:
        "❌ Bot la pa konekte."
    };
  }


  const cleanNumber =
    normalizeNumber(
      number
    );


  const cleanCode =
    String(code || "")
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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 CHECK AUTHENTICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isAuthenticated(
  sessionId
) {

  const session =
    getSession(
      sessionId
    );


  return !!(
    session &&
    session.connected &&
    session.sock &&
    session.authenticated === true
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 CHECK CONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isConnected(
  sessionId
) {

  const session =
    getSession(
      sessionId
    );


  return !!(
    session &&
    session.connected &&
    session.sock
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔘 SET AUTHENTICATED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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


  return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ UPDATE SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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


  return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 UPDATE BOT INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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


  return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗑️ DELETE SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function deleteSession(
  sessionId
) {

  if (!sessionId) {
    return false;
  }


  const session =
    sessions.get(
      sessionId
    );


  if (!session) {
    return false;
  }


  sessions.delete(
    sessionId
  );


  console.log(
    `🗑️ SESSION MANAGER: Session deleted ${session.number}`
  );


  return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 GET ALL SESSIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessions() {

  return Array.from(
    sessions.values()
  ).map(
    sanitizeSession
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔢 SESSION COUNT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessionCount() {

  return sessions.size;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAR ALL SESSIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function clearSessions() {

  sessions.clear();

  console.log(
    "🧹 SESSION MANAGER: All sessions cleared."
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛡️ HIDE SOCKET / INTERNAL DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

    settings:
      {
        ...session.settings
      },

    bot:
      {
        ...session.bot
      },

    createdAt:
      session.createdAt,

    updatedAt:
      session.updatedAt
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  // Session creation
  createSession,
  generateSessionId,
  generateParrainCode,

  // Connection
  connectSession,
  disconnectSession,
  isConnected,
  getSocket,

  // Authentication
  verifySession,
  isAuthenticated,
  setAuthenticated,

  // Lookup
  getSession,
  getSessionByNumber,
  getSessions,
  getSessionCount,

  // Data
  updateSettings,
  updateBot,

  // Delete
  deleteSession,
  clearSessions,

  // Helpers
  normalizeNumber,
  sanitizeSession
};


// ╔════════════════════════════════════════════════════╗
// ║                 By TOPFEROS TECH                  ║
// ╚════════════════════════════════════════════════════╝