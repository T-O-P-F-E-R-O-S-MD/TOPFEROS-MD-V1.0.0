"use strict";

// ============================================================
// TOPFEROS MD
// SESSION MANAGER
// Manages WhatsApp sessions
// ============================================================

const fs = require("fs");
const path = require("path");

// ============================================================
// PATHS
// ============================================================

const SESSION_ROOT =
  path.join(
    __dirname,
    "..",
    "sessions"
  );

const AUTH_ROOT =
  path.join(
    SESSION_ROOT,
    "auth"
  );

// ============================================================
// CREATE DIRECTORIES
// ============================================================

try {
  fs.mkdirSync(
    SESSION_ROOT,
    {
      recursive: true
    }
  );

  fs.mkdirSync(
    AUTH_ROOT,
    {
      recursive: true
    }
  );
} catch (error) {
  console.error(
    "❌ SESSION DIRECTORY ERROR:",
    error?.message ||
    error
  );
}

// ============================================================
// SESSION STORAGE
// ============================================================

const sessions = new Map();

// ============================================================
// SAFE SESSION ID
// ============================================================

function safeSessionId(value) {
  return String(value || "")
    .replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    )
    .slice(0, 100);
}

// ============================================================
// CLEAN NUMBER
// ============================================================

function cleanNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}

// ============================================================
// AUTH DIRECTORY
// ============================================================

function getAuthDir(sessionId) {
  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    return null;
  }

  return path.join(
    AUTH_ROOT,
    cleanId
  );
}

// ============================================================
// CREATE SESSION
// ============================================================

function createSession(options = {}) {
  const requestedId =
    options.sessionId ||
    options.id ||
    options.number;

  const sessionId =
    safeSessionId(
      requestedId
    );

  if (!sessionId) {
    throw new Error(
      "sessionId obligatwa."
    );
  }

  const number =
    cleanNumber(
      options.number ||
      ""
    );

  const existing =
    sessions.get(
      sessionId
    );

  if (existing) {
    if (number) {
      existing.number =
        number;
    }

    existing.updatedAt =
      Date.now();

    return existing;
  }

  const authDir =
    getAuthDir(
      sessionId
    );

  if (!authDir) {
    throw new Error(
      "authDir pa kapab kreye."
    );
  }

  fs.mkdirSync(
    authDir,
    {
      recursive: true
    }
  );

  const session = {
    sessionId,

    number,

    username:
      options.username ||
      "",

    authDir,

    socket:
      null,

    status:
      "created",

    connected:
      false,

    pairing:
      false,

    pairingCode:
      null,

    createdAt:
      Date.now(),

    updatedAt:
      Date.now()
  };

  sessions.set(
    sessionId,
    session
  );

  console.log(
    `🗂️ SESSION CREATED [${sessionId}]`
  );

  return session;
}

// ============================================================
// GET SESSION
// ============================================================

function getSession(
  sessionId
) {
  const cleanId =
    safeSessionId(
      sessionId
    );

  if (!cleanId) {
    return null;
  }

  return (
    sessions.get(
      cleanId
    ) ||
    null
  );
}

// ============================================================
// GET SESSION BY NUMBER
// ============================================================

function getSessionByNumber(
  number
) {
  const clean =
    cleanNumber(
      number
    );

  if (!clean) {
    return null;
  }

  for (
    const session of
    sessions.values()
  ) {
    if (
      cleanNumber(
        session.number
      ) === clean
    ) {
      return session;
    }
  }

  return null;
}

// ============================================================
// UPDATE SESSION
// ============================================================

function updateSession(
  sessionId,
  updates = {}
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return null;
  }

  Object.assign(
    session,
    updates
  );

  session.updatedAt =
    Date.now();

  return session;
}

// ============================================================
// SET NUMBER
// ============================================================

function setNumber(
  sessionId,
  number
) {
  return updateSession(
    sessionId,
    {
      number:
        cleanNumber(
          number
        )
    }
  );
}

// ============================================================
// SET SOCKET
// ============================================================

function setSocket(
  sessionId,
  socket
) {
  return updateSession(
    sessionId,
    {
      socket:
        socket ||
        null
    }
  );
}

// ============================================================
// GET SOCKET
// ============================================================

function getSocket(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  return (
    session?.socket ||
    null
  );
}

// ============================================================
// CONNECTION STATE
// ============================================================

function getConnectionState(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  if (!session) {
    return {
      status:
        "not_found",

      connected:
        false,

      pairing:
        false,

      pairingCode:
        null,

      sessionId:
        safeSessionId(
          sessionId
        )
    };
  }

  return {
    sessionId:
      session.sessionId,

    number:
      session.number ||
      "",

    status:
      session.status ||
      "created",

    connected:
      session.connected === true,

    pairing:
      session.pairing === true,

    pairingCode:
      session.pairingCode ||
      null,

    socket:
      session.socket ||
      null,

    authDir:
      session.authDir
  };
}

// ============================================================
// IS CONNECTED
// ============================================================

function isConnected(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  return (
    session?.connected === true
  );
}

// ============================================================
// START PAIRING
// ============================================================

function startPairing(
  sessionId
) {
  return updateSession(
    sessionId,
    {
      status:
        "pairing",

      pairing:
        true,

      connected:
        false,

      pairingCode:
        null
    }
  );
}

// ============================================================
// SET PAIRING CODE
// ============================================================

function setPairingCode(
  sessionId,
  code
) {
  return updateSession(
    sessionId,
    {
      pairingCode:
        String(code || "")
          .trim()
          .replace(
            /\s+/g,
            ""
          ),

      pairing:
        true,

      status:
        "pairing"
    }
  );
}

// ============================================================
// END PAIRING
// ============================================================

function endPairing(
  sessionId
) {
  return updateSession(
    sessionId,
    {
      pairing:
        false,

      pairingCode:
        null
    }
  );
}

// ============================================================
// STORED SESSION IDS
// ============================================================

function getStoredSessionIds() {
  const ids =
    new Set();

  // ----------------------------------------------------------
  // Sessions already loaded in memory
  // ----------------------------------------------------------

  for (
    const id of
    sessions.keys()
  ) {
    ids.add(id);
  }

  // ----------------------------------------------------------
  // Sessions stored on disk
  // ----------------------------------------------------------

  try {
    if (
      !fs.existsSync(
        AUTH_ROOT
      )
    ) {
      return [
        ...ids
      ];
    }

    const entries =
      fs.readdirSync(
        AUTH_ROOT,
        {
          withFileTypes:
            true
        }
      );

    for (
      const entry of
      entries
    ) {
      if (
        !entry.isDirectory()
      ) {
        continue;
      }

      const id =
        safeSessionId(
          entry.name
        );

      if (!id) {
        continue;
      }

      ids.add(id);
    }

  } catch (error) {
    console.error(
      "❌ READ STORED SESSIONS ERROR:",
      error?.message ||
      error
    );
  }

  return [
    ...ids
  ];
}

// ============================================================
// RESTORE SESSION FROM DISK
// ============================================================

function restoreSession(
  sessionId
) {
  const cleanId =
    safeSessionId(
      sessionId
    );

  if (!cleanId) {
    return null;
  }

  const existing =
    getSession(
      cleanId
    );

  if (existing) {
    return existing;
  }

  const authDir =
    getAuthDir(
      cleanId
    );

  if (
    !authDir ||
    !fs.existsSync(
      authDir
    )
  ) {
    return null;
  }

  return createSession({
    sessionId:
      cleanId
  });
}

// ============================================================
// REMOVE SESSION
// ============================================================

function removeSession(
  sessionId
) {
  const cleanId =
    safeSessionId(
      sessionId
    );

  if (!cleanId) {
    return false;
  }

  const session =
    sessions.get(
      cleanId
    );

  sessions.delete(
    cleanId
  );

  if (
    session?.authDir &&
    fs.existsSync(
      session.authDir
    )
  ) {
    try {
      fs.rmSync(
        session.authDir,
        {
          recursive:
            true,
          force:
            true
        }
      );

    } catch (error) {
      console.error(
        `❌ AUTH REMOVE ERROR [${cleanId}]`,
        error?.message ||
        error
      );
    }
  }

  console.log(
    `🗑️ SESSION REMOVED [${cleanId}]`
  );

  return true;
}

// ============================================================
// LIST SESSIONS
// ============================================================

function listSessions() {
  return [
    ...sessions.values()
  ].map(
    session => ({
      sessionId:
        session.sessionId,

      number:
        session.number,

      username:
        session.username,

      status:
        session.status,

      connected:
        session.connected,

      pairing:
        session.pairing,

      pairingCode:
        session.pairingCode,

      createdAt:
        session.createdAt,

      updatedAt:
        session.updatedAt
    })
  );
}

// ============================================================
// GET ALL SESSIONS
// ============================================================

function getSessions() {
  return [
    ...sessions.values()
  ];
}

// ============================================================
// CLEAR ALL
// ============================================================

function clearSessions() {
  sessions.clear();

  return true;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {

  createSession,

  getSession,

  getSessionByNumber,

  updateSession,

  setNumber,

  setSocket,

  getSocket,

  getConnectionState,

  isConnected,

  startPairing,

  setPairingCode,

  endPairing,

  getStoredSessionIds,

  restoreSession,

  removeSession,

  listSessions,

  getSessions,

  clearSessions
};