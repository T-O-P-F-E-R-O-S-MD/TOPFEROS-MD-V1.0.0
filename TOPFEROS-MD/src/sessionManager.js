"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ============================================================
// PATHS
// ============================================================

const ROOT_DIR = path.join(
  __dirname,
  ".."
);

const SESSIONS_DIR = path.join(
  ROOT_DIR,
  "auth",
  "sessions"
);

fs.mkdirSync(
  SESSIONS_DIR,
  {
    recursive: true
  }
);

// ============================================================
// MEMORY
// ============================================================

const sessions = new Map();

// ============================================================
// HELPERS
// ============================================================

function cleanNumber(number) {
  return String(
    number || ""
  ).replace(/\D/g, "");
}

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

function ensureSessionDirectory(
  sessionId
) {
  const dir =
    path.join(
      SESSIONS_DIR,
      sessionId
    );

  fs.mkdirSync(
    dir,
    {
      recursive: true
    }
  );

  return dir;
}

// ============================================================
// SAVE
// ============================================================

function saveSession(session) {
  if (
    !session ||
    !session.sessionId
  ) {
    return false;
  }

  try {
    ensureSessionDirectory(
      session.sessionId
    );

    const data = {
      sessionId:
        session.sessionId,

      number:
        session.number ||
        null,

      status:
        session.status ||
        "disconnected",

      connected:
        !!session.connected,

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
      sessionFile(
        session.sessionId
      ),
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
      "❌ SAVE SESSION ERROR:",
      error?.message ||
        String(error)
    );

    return false;
  }
}

// ============================================================
// READ
// ============================================================

function readSessionFile(
  sessionId
) {
  const file =
    sessionFile(
      sessionId
    );

  if (
    !fs.existsSync(file)
  ) {
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
      "❌ READ SESSION ERROR:",
      error?.message ||
        String(error)
    );

    return null;
  }
}

// ============================================================
// SESSION ID
// ============================================================

function generateSessionId() {
  return (
    "session-" +
    crypto
      .randomBytes(6)
      .toString("hex")
  );
}

// ============================================================
// CREATE SESSION OBJECT
// ============================================================

function createSessionObject(
  stored
) {
  if (
    !stored ||
    !stored.sessionId
  ) {
    return null;
  }

  const session = {
    sessionId:
      stored.sessionId,

    number:
      stored.number ||
      null,

    authDir:
      authDirectory(
        stored.sessionId
      ),

    socket:
      null,

    connected:
      !!stored.connected,

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

    panelSession:
      null,

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
    {
      recursive: true
    }
  );

  return session;
}

// ============================================================
// CREATE SESSION
// ============================================================

function createSession(
  number = null
) {
  const clean =
    cleanNumber(number);

  if (clean) {
    const existing =
      getSessionByNumber(
        clean
      );

    if (existing) {
      return existing;
    }
  }

  const sessionId =
    generateSessionId();

  const session = {
    sessionId,

    number:
      clean || null,

    authDir:
      authDirectory(
        sessionId
      ),

    socket:
      null,

    connected:
      false,

    status:
      "disconnected",

    pairing:
      false,

    pairingCode:
      null,

    pairingStartedAt:
      null,

    panelSession:
      null,

    createdAt:
      Date.now(),

    updatedAt:
      Date.now()
  };

  ensureSessionDirectory(
    sessionId
  );

  fs.mkdirSync(
    session.authDir,
    {
      recursive: true
    }
  );

  sessions.set(
    sessionId,
    session
  );

  saveSession(
    session
  );

  console.log(
    `🆕 Session created: ${sessionId}`
  );

  return session;
}

// ============================================================
// GET SESSION
// ============================================================

function getSession(
  sessionId
) {
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
    readSessionFile(
      sessionId
    );

  if (!stored) {
    return null;
  }

  const session =
    createSessionObject(
      stored
    );

  if (!session) {
    return null;
  }

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
  const storedIds =
    getStoredSessionIds();

  for (
    const sessionId of
      storedIds
  ) {
    if (
      !sessions.has(sessionId)
    ) {
      getSession(
        sessionId
      );
    }
  }

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
    getSession(
      sessionId
    );

  if (!session) {
    console.error(
      `❌ setSocket: session pa jwenn: ${sessionId}`
    );

    return false;
  }

  session.socket =
    socket || null;

  /*
   * Pa mete connected=true jis paske socket
   * egziste. connection.js ap mete status
   * connected lè connection.open rive.
   */
  if (!socket) {
    session.connected =
      false;
  }

  session.updatedAt =
    Date.now();

  saveSession(
    session
  );

  return true;
}

function getSocket(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  return session
    ? session.socket
    : null;
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
    console.error(
      `❌ updateSession: session pa jwenn: ${sessionId}`
    );

    return false;
  }

  if (
    !updates ||
    typeof updates !==
      "object"
  ) {
    return false;
  }

  // NUMBER
  if (
    Object.prototype.hasOwnProperty.call(
      updates,
      "number"
    )
  ) {
    session.number =
      updates.number
        ? cleanNumber(
            updates.number
          )
        : null;
  }

  // STATUS
  if (
    Object.prototype.hasOwnProperty.call(
      updates,
      "status"
    )
  ) {
    session.status =
      updates.status ||
      "disconnected";

    if (
      updates.status ===
      "connected"
    ) {
      session.connected =
        true;
    }

    if (
      updates.status ===
        "disconnected" ||
      updates.status ===
        "logged_out" ||
      updates.status ===
        "pairing"
    ) {
      session.connected =
        false;
    }
  }

  // CONNECTED
  if (
    Object.prototype.hasOwnProperty.call(
      updates,
      "connected"
    )
  ) {
    session.connected =
      !!updates.connected;
  }

  // PAIRING
  if (
    Object.prototype.hasOwnProperty.call(
      updates,
      "pairing"
    )
  ) {
    session.pairing =
      !!updates.pairing;
  }

  // PAIRING CODE
  if (
    Object.prototype.hasOwnProperty.call(
      updates,
      "pairingCode"
    )
  ) {
    session.pairingCode =
      updates.pairingCode
        ? String(
            updates.pairingCode
          )
        : null;
  }

  // PAIRING START
  if (
    Object.prototype.hasOwnProperty.call(
      updates,
      "pairingStartedAt"
    )
  ) {
    session.pairingStartedAt =
      updates.pairingStartedAt ||
      null;
  }

  // SOCKET
  if (
    Object.prototype.hasOwnProperty.call(
      updates,
      "socket"
    )
  ) {
    session.socket =
      updates.socket ||
      null;

    if (!session.socket) {
      session.connected =
        false;
    }
  }

  // OTHER METADATA
  for (
    const [
      key,
      value
    ] of Object.entries(
      updates
    )
  ) {
    if (
      key === "sessionId" ||
      key === "authDir" ||
      key === "createdAt" ||
      key === "number" ||
      key === "status" ||
      key === "connected" ||
      key === "pairing" ||
      key === "pairingCode" ||
      key ===
        "pairingStartedAt" ||
      key === "socket"
    ) {
      continue;
    }

    session[key] =
      value;
  }

  session.updatedAt =
    Date.now();

  saveSession(
    session
  );

  return true;
}

// ============================================================
// NUMBER
// ============================================================

function setNumber(
  sessionId,
  number
) {
  return updateSession(
    sessionId,
    {
      number:
        number || null
    }
  );
}

function getPhoneNumber(
  sessionId
) {
  const session =
    getSession(
      sessionId
    );

  return session
    ? session.number
    : null;
}

function getSessionByNumber(
  number
) {
  const clean =
    cleanNumber(number);

  if (!clean) {
    return null;
  }

  // RAM
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

  // DISK
  const storedIds =
    getStoredSessionIds();

  for (
    const sessionId of
      storedIds
  ) {
    const session =
      getSession(
        sessionId
      );

    if (
      session &&
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
// STATUS
// ============================================================

function setStatus(
  sessionId,
  status
) {
  return updateSession(
    sessionId,
    {
      status:
        status ||
        "disconnected"
    }
  );
}

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
    getSession(
      sessionId
    );

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

  session.connected =
    false;

  saveSession(
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

  if (!session || !code) {
    return false;
  }

  session.pairingCode =
    String(code);

  session.pairing =
    true;

  session.status =
    "pairing";

  session.connected =
    false;

  session.updatedAt =
    Date.now();

  saveSession(
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

  saveSession(
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
// STORED SESSION IDS
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
          withFileTypes:
            true
        }
      )
      .filter(
        entry =>
          entry.isDirectory()
      )
      .filter(
        entry =>
          fs.existsSync(
            sessionFile(
              entry.name
            )
          )
      )
      .map(
        entry =>
          entry.name
      );
  } catch (error) {
    console.error(
      "❌ GET STORED SESSIONS ERROR:",
      error?.message ||
        String(error)
    );

    return [];
  }
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

  const authDir =
    session.authDir;

  try {
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

    session.updatedAt =
      Date.now();

    saveSession(
      session
    );

    console.log(
      `♻️ Auth reset: ${sessionId}`
    );

    return true;
  } catch (error) {
    console.error(
      "❌ RESET AUTH ERROR:",
      error?.message ||
        String(error)
    );

    return false;
  }
}

// ============================================================
// REMOVE
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

    console.log(
      `🗑️ Session removed: ${sessionId}`
    );

    return true;
  } catch (error) {
    console.error(
      "❌ REMOVE SESSION ERROR:",
      error?.message ||
        String(error)
    );

    return false;
  }
}

// ============================================================
// PUBLIC SESSION
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

  updateSession,

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