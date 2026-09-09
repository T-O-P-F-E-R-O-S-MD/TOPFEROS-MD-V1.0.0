"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ============================================================
// AUTH ROOT
// ============================================================

const AUTH_ROOT = path.join(
  __dirname,
  "..",
  "auth",
  "sessions"
);

fs.mkdirSync(AUTH_ROOT, {
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
    .replace(/[^\d]/g, "");
}

function validatePhoneNumber(number) {
  return /^\d{8,15}$/.test(
    cleanPhoneNumber(number)
  );
}

// ============================================================
// SESSION ID
// ============================================================

function generateSessionId() {
  return (
    "session-" +
    Date.now() +
    "-" +
    crypto
      .randomBytes(4)
      .toString("hex")
  );
}

// ============================================================
// PATHS
// ============================================================

function getSessionDir(sessionId) {
  return path.join(
    AUTH_ROOT,
    sessionId
  );
}

function getAuthDir(sessionId) {
  return path.join(
    getSessionDir(sessionId),
    "auth"
  );
}

function getSessionInfoFile(sessionId) {
  return path.join(
    getSessionDir(sessionId),
    "session.json"
  );
}

// ============================================================
// DIRECTORY
// ============================================================

function ensureSessionDir(sessionId) {
  const dir =
    getSessionDir(sessionId);

  fs.mkdirSync(dir, {
    recursive: true
  });

  return dir;
}

function ensureAuthDir(sessionId) {
  const dir =
    getAuthDir(sessionId);

  fs.mkdirSync(dir, {
    recursive: true
  });

  return dir;
}

// ============================================================
// SESSION METADATA
// ============================================================

function saveSessionInfo(session) {
  if (!session?.sessionId) {
    return false;
  }

  try {
    ensureSessionDir(
      session.sessionId
    );

    const data = {
      sessionId:
        session.sessionId,

      number:
        session.number || null,

      createdAt:
        session.createdAt ||
        Date.now(),

      updatedAt:
        Date.now()
    };

    fs.writeFileSync(
      getSessionInfoFile(
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
      "❌ SESSION INFO SAVE ERROR:",
      error?.message || error
    );

    return false;
  }
}

function loadSessionInfo(
  sessionId
) {
  try {
    const file =
      getSessionInfoFile(
        sessionId
      );

    if (
      !fs.existsSync(file)
    ) {
      return null;
    }

    const raw =
      fs.readFileSync(
        file,
        "utf8"
      );

    return JSON.parse(raw);

  } catch (error) {
    console.error(
      `⚠️ SESSION INFO READ ERROR ${sessionId}:`,
      error?.message || error
    );

    return null;
  }
}

// ============================================================
// CREATE SESSION
// ============================================================

function createSession(
  options = {}
) {
  const number =
    cleanPhoneNumber(
      options.number
    );

  if (
    number &&
    !validatePhoneNumber(
      number
    )
  ) {
    throw new Error(
      "Invalid WhatsApp phone number."
    );
  }

  const sessionId =
    options.sessionId ||
    generateSessionId();

  // Already in memory
  if (
    sessions.has(sessionId)
  ) {
    return sessions.get(
      sessionId
    );
  }

  ensureSessionDir(
    sessionId
  );

  const authDir =
    options.authDir ||
    ensureAuthDir(
      sessionId
    );

  const existingInfo =
    loadSessionInfo(
      sessionId
    );

  const session = {
    sessionId,

    number:
      number ||
      existingInfo?.number ||
      null,

    authDir,

    socket: null,

    connected: false,

    status:
      "disconnected",

    pairing: false,

    pairingCode: null,

    pairingStartedAt:
      null,

    createdAt:
      existingInfo?.createdAt ||
      Date.now(),

    updatedAt:
      Date.now(),

    panelSession: null
  };

  sessions.set(
    sessionId,
    session
  );

  saveSessionInfo(
    session
  );

  return session;
}

// ============================================================
// GET SESSION
// ============================================================

function getSession(
  sessionId
) {
  return sessionId
    ? sessions.get(
        sessionId
      ) || null
    : null;
}

function getAllSessions() {
  return Array.from(
    sessions.values()
  );
}

// ============================================================
// FIND BY NUMBER
// ============================================================

function getSessionByNumber(
  number
) {
  const phone =
    cleanPhoneNumber(
      number
    );

  if (!phone) {
    return null;
  }

  for (
    const session
    of sessions.values()
  ) {
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

  session.socket =
    socket || null;

  session.updatedAt =
    Date.now();

  return session;
}

function getSocket(
  sessionId
) {
  return (
    getSession(
      sessionId
    )?.socket || null
  );
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
    cleanPhoneNumber(
      number
    );

  if (
    phone &&
    !validatePhoneNumber(
      phone
    )
  ) {
    throw new Error(
      "Invalid WhatsApp phone number."
    );
  }

  session.number =
    phone || null;

  session.updatedAt =
    Date.now();

  saveSessionInfo(
    session
  );

  return session;
}

function getPhoneNumber(
  sessionId
) {
  return (
    getSession(
      sessionId
    )?.number || null
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

// ============================================================
// PAIRING
// ============================================================

function startPairing(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.pairing =
    true;

  session.pairingCode =
    null;

  session.pairingStartedAt =
    Date.now();

  session.status =
    "pairing";

  session.connected =
    false;

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

  session.pairing =
    true;

  session.status =
    "pairing";

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
      session.status,

    connected:
      isConnected(
        sessionId
      )
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

  session.pairing =
    false;

  session.pairingCode =
    null;

  session.pairingStartedAt =
    null;

  session.updatedAt =
    Date.now();

  return session;
}

// ============================================================
// STORED SESSIONS
// ============================================================

function getStoredSessionIds() {
  if (
    !fs.existsSync(
      AUTH_ROOT
    )
  ) {
    return [];
  }

  return fs
    .readdirSync(
      AUTH_ROOT
    )
    .filter(
      (name) => {
        const fullPath =
          path.join(
            AUTH_ROOT,
            name
          );

        try {
          return fs.statSync(
            fullPath
          ).isDirectory();

        } catch {
          return false;
        }
      }
    );
}

// ============================================================
// RESTORE SESSION
// ============================================================

function restoreSession(
  sessionId
) {
  if (!sessionId) {
    return null;
  }

  const authDir =
    getAuthDir(
      sessionId
    );

  if (
    !fs.existsSync(
      authDir
    )
  ) {
    return null;
  }

  const info =
    loadSessionInfo(
      sessionId
    );

  return createSession({
    sessionId,

    number:
      info?.number ||
      null,

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

    fs.rmSync(
      sessionDir,
      {
        recursive: true,
        force: true
      }
    );

  } catch (error) {
    console.error(
      "❌ AUTH REMOVE ERROR:",
      error?.message || error
    );
  }

  return true;
}

// ============================================================
// LIST
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
    .map(
      (session) => ({
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
      })
    );
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