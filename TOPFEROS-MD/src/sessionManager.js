"use strict";

const fs = require("fs");
const path = require("path");

// ============================================================
// DIRECTORIES
// ============================================================

const BASE_DIR = path.join(process.cwd(), "auth");
const SESSIONS_DIR = path.join(BASE_DIR, "sessions");

function ensureDirectories() {
  fs.mkdirSync(BASE_DIR, {
    recursive: true
  });

  fs.mkdirSync(SESSIONS_DIR, {
    recursive: true
  });
}

ensureDirectories();

// ============================================================
// MEMORY
// ============================================================

const sessions = new Map();
const sockets = new Map();

// ============================================================
// HELPERS
// ============================================================

function safeSessionId(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100);
}

function cleanNumber(number) {
  if (
    typeof number !== "string" &&
    typeof number !== "number"
  ) {
    return "";
  }

  return String(number).replace(/\D/g, "");
}

function getAuthDir(sessionId) {
  if (!sessionId) {
    throw new Error("sessionId obligatwa.");
  }

  return path.join(
    BASE_DIR,
    safeSessionId(sessionId)
  );
}

function getSessionFile(sessionId) {
  if (!sessionId) {
    throw new Error("sessionId obligatwa.");
  }

  return path.join(
    SESSIONS_DIR,
    `${safeSessionId(sessionId)}.json`
  );
}

// ============================================================
// CREATE SESSION OBJECT
// ============================================================

function createSessionObject(data = {}) {
  const sessionId =
    safeSessionId(data.sessionId);

  if (!sessionId) {
    throw new Error(
      "sessionId obligatwa."
    );
  }

  const now = Date.now();

  return {
    sessionId,

    number:
      data.number
        ? cleanNumber(data.number)
        : null,

    status:
      data.status ||
      "disconnected",

    connected:
      Boolean(data.connected),

    pairing:
      Boolean(data.pairing),

    pairingCode:
      data.pairingCode ||
      null,

    pairingStartedAt:
      data.pairingStartedAt ||
      null,

    createdAt:
      data.createdAt ||
      now,

    updatedAt:
      data.updatedAt ||
      now,

    // IMPORTANT:
    // connection.js bezwen authDir.
    authDir:
      getAuthDir(sessionId),

    // Socket pa janm sove sou disk.
    socket: null
  };
}

// ============================================================
// PUBLIC SESSION
// ============================================================

function publicSession(session) {
  if (!session) {
    return null;
  }

  return {
    sessionId:
      session.sessionId,

    number:
      session.number ||
      null,

    status:
      session.status ||
      "disconnected",

    connected:
      Boolean(session.connected),

    pairing:
      Boolean(session.pairing),

    pairingCode:
      session.pairingCode ||
      null,

    pairingStartedAt:
      session.pairingStartedAt ||
      null,

    createdAt:
      session.createdAt ||
      null,

    updatedAt:
      session.updatedAt ||
      null
  };
}

// ============================================================
// SAVE SESSION
// ============================================================

function saveSession(session) {
  if (!session?.sessionId) {
    return false;
  }

  try {
    ensureDirectories();

    const file =
      getSessionFile(
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
        Boolean(session.connected),

      pairing:
        Boolean(session.pairing),

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
      `[TOPFEROS] Erè sauvegarde session ${session.sessionId}:`,
      error?.message ||
      error
    );

    return false;
  }
}

// ============================================================
// LOAD SESSION
// ============================================================

function loadSession(sessionId) {
  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    return null;
  }

  if (sessions.has(cleanId)) {
    return sessions.get(cleanId);
  }

  const file =
    getSessionFile(cleanId);

  if (!fs.existsSync(file)) {
    return null;
  }

  try {
    const data =
      JSON.parse(
        fs.readFileSync(
          file,
          "utf8"
        )
      );

    const session =
      createSessionObject({
        ...data,
        sessionId: cleanId
      });

    session.authDir =
      getAuthDir(cleanId);

    session.socket = null;

    sessions.set(
      cleanId,
      session
    );

    return session;
  } catch (error) {
    console.error(
      `[TOPFEROS] Erè loading session ${cleanId}:`,
      error?.message ||
      error
    );

    return null;
  }
}

// ============================================================
// GET SESSION
// ============================================================

function getSession(sessionId) {
  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    return null;
  }

  if (sessions.has(cleanId)) {
    return sessions.get(cleanId);
  }

  return loadSession(cleanId);
}

// ============================================================
// CREATE SESSION
// ============================================================
// IMPORTANT:
// Fonksyon sa a PA async.
// connection.js ou a rele l san await.
// ============================================================

function createSession(data = {}) {
  /*
   * Si yo voye yon string dirèkteman:
   *
   * createSession("509xxxxxxxx")
   *
   * n ap trete string la kòm nimewo.
   */
  if (
    typeof data === "string" ||
    typeof data === "number"
  ) {
    data = {
      sessionId:
        cleanNumber(data),

      number:
        cleanNumber(data)
    };
  }

  const sessionId =
    safeSessionId(
      data.sessionId ||
      data.number
    );

  if (!sessionId) {
    throw new Error(
      "sessionId obligatwa."
    );
  }

  const existing =
    getSession(sessionId);

  if (existing) {
    if (data.number) {
      existing.number =
        cleanNumber(data.number);
    }

    existing.authDir =
      getAuthDir(sessionId);

    existing.updatedAt =
      Date.now();

    saveSession(existing);

    fs.mkdirSync(
      existing.authDir,
      {
        recursive: true
      }
    );

    return existing;
  }

  const session =
    createSessionObject({
      ...data,
      sessionId,

      number:
        data.number ||
        sessionId
    });

  session.authDir =
    getAuthDir(sessionId);

  sessions.set(
    sessionId,
    session
  );

  fs.mkdirSync(
    session.authDir,
    {
      recursive: true
    }
  );

  saveSession(session);

  return session;
}

// ============================================================
// GET SESSION BY NUMBER
// ============================================================

function getSessionByNumber(number) {
  const phoneNumber =
    cleanNumber(number);

  if (!phoneNumber) {
    return null;
  }

  const allSessions =
    listSessions();

  for (const session of allSessions) {
    const sessionNumber =
      cleanNumber(
        session.number
      );

    if (
      sessionNumber ===
      phoneNumber
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
  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    throw new Error(
      "sessionId obligatwa."
    );
  }

  let session =
    getSession(cleanId);

  if (!session) {
    session =
      createSession({
        sessionId: cleanId
      });
  }

  const allowedFields = [
    "number",
    "status",
    "connected",
    "pairing",
    "pairingCode",
    "pairingStartedAt"
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

  if (updates.number) {
    session.number =
      cleanNumber(
        updates.number
      );
  }

  if (
    updates.status ===
    "connected"
  ) {
    session.connected = true;
  }

  if (
    updates.status ===
      "disconnected" ||
    updates.status ===
      "logged_out" ||
    updates.status ===
      "pairing" ||
    updates.status ===
      "error" ||
    updates.status ===
      "pairing_error" ||
    updates.status ===
      "connecting" ||
    updates.status ===
      "reconnecting"
  ) {
    if (
      !Object.prototype.hasOwnProperty.call(
        updates,
        "connected"
      )
    ) {
      session.connected =
        false;
    }
  }

  session.updatedAt =
    Date.now();

  saveSession(session);

  return session;
}

// ============================================================
// SET STATUS
// ============================================================

function setStatus(
  sessionId,
  status
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.status =
    status;

  if (status === "connected") {
    session.connected =
      true;
  }

  if (
    status === "disconnected" ||
    status === "connecting" ||
    status === "reconnecting" ||
    status === "pairing" ||
    status === "error" ||
    status === "pairing_error" ||
    status === "logged_out"
  ) {
    session.connected =
      false;
  }

  session.updatedAt =
    Date.now();

  saveSession(session);

  return session;
}

// ============================================================
// SET NUMBER
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
    cleanNumber(number);

  if (phone) {
    session.number =
      phone;
  }

  session.updatedAt =
    Date.now();

  saveSession(session);

  return session;
}

// ============================================================
// SOCKET
// ============================================================

function setSocket(
  sessionId,
  socket
) {
  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    return null;
  }

  if (socket) {
    sockets.set(
      cleanId,
      socket
    );
  } else {
    sockets.delete(
      cleanId
    );
  }

  let session =
    sessions.get(cleanId);

  if (!session) {
    session =
      loadSession(cleanId);
  }

  if (!session) {
    return null;
  }

  session.authDir =
    getAuthDir(cleanId);

  session.socket =
    socket || null;

  session.updatedAt =
    Date.now();

  /*
   * Pa mete connected=true isit la.
   * Se connection.update => open ki fè sa.
   */

  saveSession(session);

  return session;
}

function getSocket(sessionId) {
  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    return null;
  }

  return (
    sockets.get(cleanId) ||
    null
  );
}

// ============================================================
// CONNECTED
// ============================================================

function isConnected(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  if (
    session.connected === true
  ) {
    return true;
  }

  const socket =
    getSocket(sessionId);

  return Boolean(
    socket &&
    socket.user
  );
}

// ============================================================
// PHONE NUMBER
// ============================================================

function getPhoneNumber(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  if (session.number) {
    return cleanNumber(
      session.number
    );
  }

  if (
    session.socket &&
    session.socket.user &&
    session.socket.user.id
  ) {
    return cleanNumber(
      session.socket.user.id
        .split(":")[0]
    );
  }

  const socket =
    getSocket(sessionId);

  if (
    socket &&
    socket.user &&
    socket.user.id
  ) {
    return cleanNumber(
      socket.user.id
        .split(":")[0]
    );
  }

  return null;
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

  saveSession(session);

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

  session.pairing =
    true;

  session.pairingCode =
    code
      ? String(code)
      : null;

  session.pairingStartedAt =
    session.pairingStartedAt ||
    Date.now();

  session.status =
    "pairing";

  session.connected =
    false;

  session.updatedAt =
    Date.now();

  saveSession(session);

  return session;
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

  saveSession(session);

  return session;
}

function clearPairing(
  sessionId
) {
  return endPairing(
    sessionId
  );
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
      session.number ||
      null,

    pairing:
      Boolean(
        session.pairing
      ),

    pairingCode:
      session.pairingCode ||
      null,

    pairingStartedAt:
      session.pairingStartedAt ||
      null,

    status:
      session.status ||
      "disconnected"
  };
}

function getPairingSession(
  sessionId
) {
  const session =
    getSession(sessionId);

  if (
    !session ||
    !session.pairing
  ) {
    return null;
  }

  return session;
}

function isPairing(
  sessionId
) {
  const session =
    getSession(sessionId);

  return Boolean(
    session &&
    session.pairing === true
  );
}

// ============================================================
// LIST SESSIONS
// ============================================================

function listSessionIds() {
  ensureDirectories();

  const ids =
    new Set();

  for (
    const id of sessions.keys()
  ) {
    ids.add(id);
  }

  let files = [];

  try {
    files =
      fs.readdirSync(
        SESSIONS_DIR
      );
  } catch (error) {
    return [
      ...ids
    ];
  }

  for (
    const file of files
  ) {
    if (
      !file.endsWith(".json")
    ) {
      continue;
    }

    ids.add(
      path.basename(
        file,
        ".json"
      )
    );
  }

  return [
    ...ids
  ];
}

// ============================================================
// ALIAS CONNECTION.JS BEZWEN
// ============================================================

function getStoredSessionIds() {
  return listSessionIds();
}

// ============================================================
// LIST SESSIONS
// ============================================================

function listSessions() {
  return listSessionIds()
    .map(
      id =>
        getSession(id)
    )
    .filter(Boolean);
}

function getAllSessions() {
  return listSessions();
}

function getPublicSessions() {
  return listSessions()
    .map(
      session =>
        publicSession(session)
    );
}

function getConnectedSessions() {
  return listSessions()
    .filter(
      session =>
        session.connected === true
    )
    .map(
      session =>
        publicSession(session)
    );
}

function getSessionCount() {
  return listSessions()
    .length;
}

// ============================================================
// HAS SESSION
// ============================================================

function hasSession(
  sessionId
) {
  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    return false;
  }

  return Boolean(
    sessions.has(cleanId) ||
    fs.existsSync(
      getSessionFile(cleanId)
    )
  );
}

// ============================================================
// RESET AUTH
// ============================================================

async function resetAuth(
  sessionId
) {
  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    return false;
  }

  const authDir =
    getAuthDir(cleanId);

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

    sockets.delete(
      cleanId
    );

    const session =
      getSession(cleanId);

    if (session) {
      session.authDir =
        authDir;

      session.socket =
        null;

      session.status =
        "disconnected";

      session.connected =
        false;

      session.pairing =
        false;

      session.pairingCode =
        null;

      session.pairingStartedAt =
        null;

      session.updatedAt =
        Date.now();

      saveSession(session);
    }

    return true;
  } catch (error) {
    console.error(
      `[TOPFEROS] Erè reset auth ${cleanId}:`,
      error?.message ||
      error
    );

    return false;
  }
}

// ============================================================
// REMOVE SESSION
// ============================================================

async function removeSession(
  sessionId
) {
  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    return false;
  }

  sockets.delete(
    cleanId
  );

  sessions.delete(
    cleanId
  );

  const sessionFile =
    getSessionFile(cleanId);

  const authDir =
    getAuthDir(cleanId);

  try {
    if (
      fs.existsSync(
        sessionFile
      )
    ) {
      fs.rmSync(
        sessionFile,
        {
          force: true
        }
      );
    }

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

    return true;
  } catch (error) {
    console.error(
      `[TOPFEROS] Erè suppression session ${cleanId}:`,
      error?.message ||
      error
    );

    return false;
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Directories
  BASE_DIR,
  SESSIONS_DIR,

  // Directory helpers
  ensureDirectories,
  getAuthDir,
  getSessionFile,

  // Session creation/loading
  createSession,
  createSessionObject,
  getSession,
  getSessionByNumber,

  // Session listing
  listSessionIds,
  getStoredSessionIds,
  listSessions,
  getAllSessions,
  getPublicSessions,
  getConnectedSessions,
  getSessionCount,

  // Session updates
  updateSession,
  saveSession,
  setStatus,
  setNumber,

  // Socket
  setSocket,
  getSocket,

  // Status
  isConnected,
  hasSession,

  // Phone
  getPhoneNumber,

  // Pairing
  startPairing,
  setPairingCode,
  endPairing,
  clearPairing,
  getPairingInfo,
  getPairingSession,
  isPairing,

  // Auth/session removal
  resetAuth,
  removeSession,

  // Utility
  publicSession
};