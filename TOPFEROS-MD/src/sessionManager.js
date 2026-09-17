'use strict';

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(process.cwd(), 'auth');
const SESSIONS_DIR = path.join(BASE_DIR, 'sessions');

function ensureDirectories() {
  fs.mkdirSync(BASE_DIR, { recursive: true });
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

ensureDirectories();

const sessions = new Map();
const sockets = new Map();

function getAuthDir(sessionId) {
  if (!sessionId) {
    throw new Error('sessionId obligatwa.');
  }

  return path.join(BASE_DIR, sessionId);
}

function getSessionFile(sessionId) {
  return path.join(SESSIONS_DIR, `${sessionId}.json`);
}

function safeSessionId(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 100);
}

function createSessionObject(data = {}) {
  const sessionId = safeSessionId(data.sessionId);

  if (!sessionId) {
    throw new Error('sessionId obligatwa.');
  }

  const now = Date.now();

  return {
    sessionId,

    number: data.number || null,

    status: data.status || 'disconnected',

    connected: Boolean(data.connected),

    pairing: Boolean(data.pairing),

    pairingCode: data.pairingCode || null,

    pairingStartedAt: data.pairingStartedAt || null,

    createdAt: data.createdAt || now,

    updatedAt: now,

    socket: null
  };
}

function publicSession(session) {
  if (!session) {
    return null;
  }

  return {
    sessionId: session.sessionId,
    number: session.number || null,
    status: session.status || 'disconnected',
    connected: Boolean(session.connected),
    pairing: Boolean(session.pairing),
    pairingCode: session.pairingCode || null,
    pairingStartedAt: session.pairingStartedAt || null,
    createdAt: session.createdAt || null,
    updatedAt: session.updatedAt || null
  };
}

function saveSession(session) {
  if (!session?.sessionId) {
    return false;
  }

  try {
    ensureDirectories();

    const file = getSessionFile(session.sessionId);

    const data = {
      sessionId: session.sessionId,
      number: session.number || null,
      status: session.status || 'disconnected',
      connected: Boolean(session.connected),
      pairing: Boolean(session.pairing),
      pairingCode: session.pairingCode || null,
      pairingStartedAt: session.pairingStartedAt || null,
      createdAt: session.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    fs.writeFileSync(
      file,
      JSON.stringify(data, null, 2),
      'utf8'
    );

    session.updatedAt = data.updatedAt;

    return true;
  } catch (error) {
    console.error(
      `[TOPFEROS] Erè sauvegarde session ${session.sessionId}:`,
      error?.message || error
    );

    return false;
  }
}

function loadSession(sessionId) {
  const cleanId = safeSessionId(sessionId);

  if (!cleanId) {
    return null;
  }

  if (sessions.has(cleanId)) {
    return sessions.get(cleanId);
  }

  const file = getSessionFile(cleanId);

  if (!fs.existsSync(file)) {
    return null;
  }

  try {
    const data = JSON.parse(
      fs.readFileSync(file, 'utf8')
    );

    const session = createSessionObject({
      ...data,
      sessionId: cleanId
    });

    /*
     * Lè Node redemare, socket ki te nan RAM lan
     * pa egziste ankò. Se poutèt sa nou toujou mete
     * socket = null.
     */
    session.socket = null;

    sessions.set(cleanId, session);

    return session;
  } catch (error) {
    console.error(
      `[TOPFEROS] Erè loading session ${cleanId}:`,
      error?.message || error
    );

    return null;
  }
}

function getSession(sessionId) {
  const cleanId = safeSessionId(sessionId);

  if (!cleanId) {
    return null;
  }

  if (sessions.has(cleanId)) {
    return sessions.get(cleanId);
  }

  return loadSession(cleanId);
}

async function createSession(data = {}) {
  const sessionId = safeSessionId(data.sessionId);

  if (!sessionId) {
    throw new Error('sessionId obligatwa.');
  }

  const existing = getSession(sessionId);

  if (existing) {
    if (data.number) {
      existing.number = data.number;
    }

    existing.updatedAt = Date.now();

    saveSession(existing);

    return existing;
  }

  const session = createSessionObject(data);

  sessions.set(sessionId, session);

  ensureDirectories();

  fs.mkdirSync(
    getAuthDir(sessionId),
    { recursive: true }
  );

  saveSession(session);

  return session;
}

async function updateSession(sessionId, updates = {}) {
  const cleanId = safeSessionId(sessionId);

  if (!cleanId) {
    throw new Error('sessionId obligatwa.');
  }

  let session = getSession(cleanId);

  if (!session) {
    session = await createSession({
      sessionId: cleanId
    });
  }

  /*
   * Pa janm pèmèt update ki soti nan API a
   * ranplase socket la.
   */
  const allowedFields = [
    'number',
    'status',
    'connected',
    'pairing',
    'pairingCode',
    'pairingStartedAt'
  ];

  for (const field of allowedFields) {
    if (
      Object.prototype.hasOwnProperty.call(
        updates,
        field
      )
    ) {
      session[field] = updates[field];
    }
  }

  /*
   * Nou mete connected selon status la sèlman
   * lè li klèman connected/disconnected.
   */
  if (updates.status === 'connected') {
    session.connected = true;
  }

  if (
    updates.status === 'disconnected' ||
    updates.status === 'logged_out' ||
    updates.status === 'pairing' ||
    updates.status === 'pairing_error' ||
    updates.status === 'connecting' ||
    updates.status === 'reconnecting'
  ) {
    if (
      !Object.prototype.hasOwnProperty.call(
        updates,
        'connected'
      )
    ) {
      session.connected = false;
    }
  }

  session.updatedAt = Date.now();

  saveSession(session);

  return session;
}

function setSocket(sessionId, socket) {
  const cleanId = safeSessionId(sessionId);

  if (!cleanId) {
    return null;
  }

  if (socket) {
    sockets.set(cleanId, socket);
  } else {
    sockets.delete(cleanId);
  }

  let session = sessions.get(cleanId);

  if (!session) {
    session = loadSession(cleanId);
  }

  if (!session) {
    return null;
  }

  /*
   * IMPORTANT:
   * Lè socket la kreye pandan pairing,
   * sa pa vle di WhatsApp deja konekte.
   *
   * Se connection.update => connection === "open"
   * ki pral mete connected = true.
   */
  session.socket = socket || null;

  session.updatedAt = Date.now();

  /*
   * Pa modifye session.connected isit la.
   */

  saveSession(session);

  return session;
}

function getSocket(sessionId) {
  const cleanId = safeSessionId(sessionId);

  if (!cleanId) {
    return null;
  }

  return sockets.get(cleanId) || null;
}

function hasSession(sessionId) {
  const cleanId = safeSessionId(sessionId);

  if (!cleanId) {
    return false;
  }

  return Boolean(
    sessions.has(cleanId) ||
    fs.existsSync(getSessionFile(cleanId))
  );
}

function listSessionIds() {
  ensureDirectories();

  const ids = new Set();

  /*
   * Sessions ki deja nan RAM.
   */
  for (const id of sessions.keys()) {
    ids.add(id);
  }

  /*
   * Sessions ki sou disk.
   */
  let files = [];

  try {
    files = fs.readdirSync(SESSIONS_DIR);
  } catch (error) {
    return [...ids];
  }

  for (const file of files) {
    if (!file.endsWith('.json')) {
      continue;
    }

    ids.add(
      path.basename(file, '.json')
    );
  }

  return [...ids];
}

function listSessions() {
  return listSessionIds()
    .map(id => getSession(id))
    .filter(Boolean);
}

function getAllSessions() {
  return listSessions();
}

function getPublicSessions() {
  return listSessions()
    .map(publicSession);
}

async function resetAuth(sessionId) {
  const cleanId = safeSessionId(sessionId);

  if (!cleanId) {
    return false;
  }

  const authDir = getAuthDir(cleanId);

  try {
    /*
     * Retire credentials WhatsApp yo,
     * men li pa retire session metadata a.
     */
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, {
        recursive: true,
        force: true
      });
    }

    fs.mkdirSync(authDir, {
      recursive: true
    });

    const session = getSession(cleanId);

    if (session) {
      session.status = 'disconnected';
      session.connected = false;
      session.pairing = false;
      session.pairingCode = null;
      session.pairingStartedAt = null;
      session.updatedAt = Date.now();

      saveSession(session);
    }

    return true;
  } catch (error) {
    console.error(
      `[TOPFEROS] Erè reset auth ${cleanId}:`,
      error?.message || error
    );

    return false;
  }
}

async function removeSession(sessionId) {
  const cleanId = safeSessionId(sessionId);

  if (!cleanId) {
    return false;
  }

  sockets.delete(cleanId);
  sessions.delete(cleanId);

  const sessionFile = getSessionFile(cleanId);
  const authDir = getAuthDir(cleanId);

  try {
    if (fs.existsSync(sessionFile)) {
      fs.rmSync(sessionFile, {
        force: true
      });
    }

    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, {
        recursive: true,
        force: true
      });
    }

    return true;
  } catch (error) {
    console.error(
      `[TOPFEROS] Erè suppression session ${cleanId}:`,
      error?.message || error
    );

    return false;
  }
}

function clearPairing(sessionId) {
  const cleanId = safeSessionId(sessionId);

  const session = getSession(cleanId);

  if (!session) {
    return null;
  }

  session.pairing = false;
  session.pairingCode = null;
  session.pairingStartedAt = null;

  if (session.status === 'pairing') {
    session.status = 'disconnected';
  }

  session.updatedAt = Date.now();

  saveSession(session);

  return session;
}

function getPairingSession(sessionId) {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  if (!session.pairing) {
    return null;
  }

  return session;
}

function isPairing(sessionId) {
  const session = getSession(sessionId);

  return Boolean(
    session &&
    session.pairing === true
  );
}

function getConnectedSessions() {
  return listSessions()
    .filter(session => session.connected === true)
    .map(publicSession);
}

function getSessionCount() {
  return listSessions().length;
}

module.exports = {
  BASE_DIR,
  SESSIONS_DIR,

  ensureDirectories,

  getAuthDir,
  getSessionFile,

  createSession,
  createSessionObject,

  getSession,
  getAllSessions,
  listSessions,
  listSessionIds,

  updateSession,
  saveSession,

  setSocket,
  getSocket,

  hasSession,

  getPublicSessions,
  getConnectedSessions,
  getSessionCount,

  resetAuth,
  removeSession,

  clearPairing,
  getPairingSession,
  isPairing,

  publicSession
};