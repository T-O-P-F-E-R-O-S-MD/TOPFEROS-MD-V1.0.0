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
  const dir = path.join(
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

function saveSession(
  session
) {
  if (
    !session ||
    !session.sessionId
  ) {
    return false;
  }

  ensureSessionDirectory(
    session.sessionId
  );

  const file =
    sessionFile(
      session.sessionId
    );

  const data = {
    sessionId:
      session.sessionId,

    number:
      session.number || null,

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
    )
  );

  session.updatedAt =
    data.updatedAt;

  return true;
}

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
      "READ SESSION ERROR:",
      error?.message ||
        error
    );

    return null;
  }
}

function generateSessionId() {
  return (
    "session-" +
    crypto
      .randomBytes(4)
      .toString("hex")
  );
}

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
      stored.number || null,

    authDir:
      authDirectory(
        stored.sessionId
      ),

    socket: null,

    connected:
      false,

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
  const sessionId =
    generateSessionId();

  const session = {
    sessionId,

    number:
      number || null,

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

  /*
   * Premye chèche nan RAM.
   */
  if (
    sessions.has(
      sessionId
    )
  ) {
    return sessions.get(
      sessionId
    );
  }

  /*
   * Si li pa nan RAM,
   * chèche sou disk.
   */
  const stored =
    readSessionFile(
      sessionId
    );

  if (!stored) {
    console.log(
      `⚠️ Session not found: ${sessionId}`
    );

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
// GET ALL SESSIONS
// ============================================================

function getAllSessions() {
  /*
   * Chaje tout session ki sou disk
   * nan RAM anvan nou retounen yo.
   */
  const storedIds =
    getStoredSessionIds();

  for (
    const sessionId of
      storedIds
  ) {
    if (
      !sessions.has(
        sessionId
      )
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
   * Pa konte socket la kòm connected
   * sèlman paske socket egziste.
   */
  session.connected =
    !!(
      socket &&
      socket.user
    );

  session.updatedAt =
    Date.now();

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
// IMPORTANT
// connexion.js itilize fonksyon sa a.
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
    Object.prototype.hasOwnProperty.call(
      updates,
      "number"
    )
  ) {
    session.number =
      updates.number ||
      null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      updates,
      "status"
    )
  ) {
    session.status =
      updates.status ||
      "disconnected";

    session.connected =
      updates.status ===
      "connected";
  }

  if (
    Object.prototype.hasOwnProperty.call(
      updates,
      "pairing"
    )
  ) {
    session.pairing =
      !!updates.pairing;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      updates,
      "pairingCode"
    )
  ) {
    session.pairingCode =
      updates.pairingCode ||
      null;
  }

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

  /*
   * Pa janm ranplase socket la
   * ak yon value ki pa socket.
   */
  if (
    Object.prototype.hasOwnProperty.call(
      updates,
      "socket"
    )
  ) {
    session.socket =
      updates.socket ||
      null;
  }

  /*
   * Pèmèt lòt metadata tou,
   * men pa kite sessionId chanje.
   */
  for (
    const [key, value] of
      Object.entries(
        updates
      )
  ) {
    if (
      key === "sessionId" ||
      key === "authDir" ||
      key === "createdAt"
    ) {
      continue;
    }

    if (
      key === "number" ||
      key === "status" ||
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

  /*
   * Sove sèlman done ki nesesè
   * sou disk.
   */
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
    cleanNumber(
      number
    );

  if (!clean) {
    return null;
  }

  /*
   * Chèche session ki deja
   * nan RAM.
   */
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

  /*
   * Si pa jwenn li nan RAM,
   * chèche sou disk.
   */
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

  if (!session) {
    return false;
  }

  session.pairingCode =
    code || null;

  session.pairing =
    true;

  session.status =
    "pairing";

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
      "GET STORED SESSIONS ERROR:",
      error?.message ||
        error
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
          recursive:
            true,
          force:
            true
        }
      );
    }

    fs.mkdirSync(
      authDir,
      {
        recursive:
          true
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

    saveSession(
      session
    );

    return true;
  } catch (error) {
    console.error(
      "RESET AUTH ERROR:",
      error?.message ||
        error
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
          recursive:
            true,
          force:
            true
        }
      );
    }

    return true;
  } catch (error) {
    console.error(
      "REMOVE SESSION ERROR:",
      error?.message ||
        error
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