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
// HELPERS
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

function saveSession(session) {
  ensureSessionDirectory(
    session.sessionId
  );

  const file = sessionFile(
    session.sessionId
  );

  const data = {
    sessionId: session.sessionId,
    number: session.number || null,
    status: session.status || "disconnected",
    pairing: !!session.pairing,
    pairingCode: session.pairingCode || null,
    pairingStartedAt:
      session.pairingStartedAt || null,
    createdAt: session.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  fs.writeFileSync(
    file,
    JSON.stringify(data, null, 2)
  );

  session.updatedAt = data.updatedAt;
}

function readSessionFile(sessionId) {
  const file = sessionFile(sessionId);

  if (!fs.existsSync(file)) {
    return null;
  }

  try {
    return JSON.parse(
      fs.readFileSync(file, "utf8")
    );
  } catch {
    return null;
  }
}

function generateSessionId() {
  return (
    "session-" +
    crypto.randomBytes(4).toString("hex")
  );
}

// ============================================================
// CREATE SESSION
// ============================================================

function createSession(number = null) {
  const sessionId =
    generateSessionId();

  const session = {
    sessionId,
    number: number || null,

    authDir:
      authDirectory(sessionId),

    socket: null,

    connected: false,

    status: "disconnected",

    pairing: false,

    pairingCode: null,

    pairingStartedAt: null,

    panelSession: null,

    createdAt: Date.now(),

    updatedAt: Date.now()
  };

  ensureSessionDirectory(
    sessionId
  );

  fs.mkdirSync(
    session.authDir,
    { recursive: true }
  );

  sessions.set(
    sessionId,
    session
  );

  saveSession(session);

  return session;
}

// ============================================================
// GET SESSION
// ============================================================

function getSession(sessionId) {
  if (sessions.has(sessionId)) {
    return sessions.get(sessionId);
  }

  const stored =
    readSessionFile(sessionId);

  if (!stored) {
    return null;
  }

  const session = {
    sessionId: stored.sessionId,

    number:
      stored.number || null,

    authDir:
      authDirectory(stored.sessionId),

    socket: null,

    connected: false,

    status:
      stored.status ||
      "disconnected",

    pairing:
      !!stored.pairing,

    pairingCode:
      stored.pairingCode ||
      null,

    pairingStartedAt:
      stored.pairingStartedAt ||
      null,

    panelSession: null,

    createdAt:
      stored.createdAt ||
      Date.now(),

    updatedAt:
      stored.updatedAt ||
      Date.now()
  };

  ensureSessionDirectory(
    session.sessionId
  );

  fs.mkdirSync(
    session.authDir,
    { recursive: true }
  );

  sessions.set(
    sessionId,
    session
  );

  return session;
}

// ============================================================
// GET ALL
// ============================================================

function getAllSessions() {
  return Array.from(
    sessions.values()
  );
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

  session.socket = socket;

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

function setNumber(
  sessionId,
  number
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.number =
    number || null;

  saveSession(session);

  return true;
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

function getSessionByNumber(
  number
) {
  if (!number) {
    return null;
  }

  const clean =
    String(number).replace(
      /\D/g,
      ""
    );

  for (
    const session of sessions.values()
  ) {
    if (
      session.number &&
      String(session.number).replace(
        /\D/g,
        ""
      ) === clean
    ) {
      return session;
    }
  }

  return null;
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
    status || "disconnected";

  session.connected =
    status === "connected";

  saveSession(session);

  return true;
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

  session.pairing = true;

  session.pairingCode = null;

  session.pairingStartedAt =
    Date.now();

  session.status = "pairing";

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
    code || null;

  session.pairing = true;

  session.status = "pairing";

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

  session.pairing = false;

  session.pairingCode = null;

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
      session.pairing,

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
  if (!fs.existsSync(
    SESSIONS_DIR
  )) {
    return [];
  }

  return fs
    .readdirSync(
      SESSIONS_DIR,
      { withFileTypes: true }
    )
    .filter(
      entry =>
        entry.isDirectory()
    )
    .map(
      entry =>
        entry.name
    );
}

// ============================================================
// RESTORE
// ============================================================

function restoreSession(
  sessionId
) {
  return getSession(
    sessionId
  );
}

// ============================================================
// RESET AUTH
// IMPORTANT:
// Only ONE session is reset.
// Other sessions are untouched.
// ============================================================

function resetAuth(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  const authDir =
    session.authDir;

  try {
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

    session.socket = null;

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
// PUBLIC SESSION DATA
// ============================================================

function getPublicSession(
  session
) {
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
    );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  SESSIONS_DIR,

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
  endPairing,
  getPairingInfo,

  getStoredSessionIds,
  restoreSession,

  resetAuth,

  removeSession,

  getPublicSession,
  getPublicSessions
};