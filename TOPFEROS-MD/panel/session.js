"use strict";

const crypto = require("crypto");

// ╔════════════════════════════════════════════════════╗
// ║        🦁 TOPFEROS MD - SESSION MANAGER          ║
// ║              🚀 TOPFEROS TECH                    ║
// ╚════════════════════════════════════════════════════╝

// Tout session panel yo rete nan memwa isit la.
const sessions = new Map();

// Session lan valab pandan 24 èdtan.
const SESSION_TTL =
  24 * 60 * 60 * 1000;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆔 KREYE SESSION ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateSessionId() {

  return crypto
    .randomBytes(24)
    .toString("hex");

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 KREYE YON SESSION PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createSession(options = {}) {

  const now = Date.now();

  const sessionId =
    generateSessionId();

  const session = {

    sessionId,

    number:
      options.number
        ? String(options.number)
            .replace(/\D/g, "")
        : null,

    code:
      options.code
        ? String(options.code)
            .trim()
            .toUpperCase()
        : null,

    language:
      options.language || null,

    connected:
      options.connected === true,

    authenticated: false,

    createdAt:
      now,

    expiresAt:
      now + SESSION_TTL

  };

  sessions.set(
    sessionId,
    session
  );

  return {
    ...session
  };

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 JWENN YON SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSession(sessionId) {

  if (!sessionId) {
    return null;
  }

  const session =
    sessions.get(sessionId);

  if (!session) {
    return null;
  }

  // Si session lan ekspire, efase li.
  if (
    session.expiresAt &&
    session.expiresAt <= Date.now()
  ) {

    sessions.delete(
      sessionId
    );

    return null;
  }

  return session;

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 METE SESSION LAN CONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setConnected(
  sessionId,
  number = null
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.connected = true;

  if (number) {

    session.number =
      String(number)
        .replace(/\D/g, "");

  }

  session.expiresAt =
    Date.now() + SESSION_TTL;

  sessions.set(
    sessionId,
    session
  );

  return true;

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔴 DEKONEKTE SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setDisconnected(
  sessionId
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.connected = false;

  session.authenticated = false;

  sessions.set(
    sessionId,
    session
  );

  return true;

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 SOVE LANG POU SESSION LAN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setLanguage(
  sessionId,
  language
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.language =
    String(language || "")
      .trim()
      .toLowerCase();

  session.expiresAt =
    Date.now() + SESSION_TTL;

  sessions.set(
    sessionId,
    session
  );

  return true;

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 VERIFYE LOGIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function verifyLogin(
  sessionId,
  number,
  code
) {

  const session =
    getSession(sessionId);

  if (!session) {

    return {

      success: false,

      message:
        "Session panel la pa egziste oswa li ekspire."

    };

  }

  if (!session.connected) {

    return {

      success: false,

      message:
        "Bot la pa konekte."

    };

  }

  const cleanNumber =
    String(number || "")
      .replace(/\D/g, "");

  const cleanCode =
    String(code || "")
      .trim()
      .toUpperCase();

  if (!cleanNumber) {

    return {

      success: false,

      message:
        "Tanpri antre nimewo bot la."

    };

  }

  if (!cleanCode) {

    return {

      success: false,

      message:
        "Tanpri antre Parrain Code la."

    };

  }

  // Verifye nimewo a.
  if (
    session.number &&
    session.number !== cleanNumber
  ) {

    return {

      success: false,

      message:
        "Nimewo a pa koresponn ak session sa a."

    };

  }

  // Verifye Parrain Code la.
  if (
    session.code &&
    session.code !== cleanCode
  ) {

    return {

      success: false,

      message:
        "Parrain Code la pa kòrèk."

    };

  }

  // Si session lan pa t gen nimewo,
  // mete nimewo moun lan kounya.
  session.number =
    cleanNumber;

  // Si session lan pa t gen code,
  // mete code moun lan kounya.
  session.code =
    cleanCode;

  session.authenticated =
    true;

  session.expiresAt =
    Date.now() + SESSION_TTL;

  sessions.set(
    sessionId,
    session
  );

  return {

    success: true,

    authenticated: true,

    sessionId

  };

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 VERIFY SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Alias sa a pèmèt panel/server.js itilize:
// settingsPanel.verifySession(...)

function verifySession(
  sessionId,
  number,
  code
) {

  return verifyLogin(
    sessionId,
    number,
    code
  );

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ VERIFYE SI LOGIN LAN FÈT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isAuthenticated(
  sessionId
) {

  const session =
    getSession(sessionId);

  return (
    !!session &&
    session.authenticated === true
  );

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 VERIFYE SI SESSION LAN CONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isSessionConnected(
  sessionId
) {

  const session =
    getSession(sessionId);

  return (
    !!session &&
    session.connected === true
  );

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗑️ EFASE YON SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function deleteSession(
  sessionId
) {

  if (!sessionId) {
    return false;
  }

  return sessions.delete(
    sessionId
  );

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 JWENN TOUT SESSION YO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessions() {

  cleanupSessions();

  const result = [];

  for (
    const session of sessions.values()
  ) {

    result.push({
      ...session
    });

  }

  return result;

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 NETWAYE SESSION KI EKSPIRE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanupSessions() {

  const now =
    Date.now();

  for (
    const [sessionId, session]
    of sessions.entries()
  ) {

    if (
      session.expiresAt &&
      session.expiresAt <= now
    ) {

      sessions.delete(
        sessionId
      );

    }

  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 KONTE SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessionCount() {

  cleanupSessions();

  return sessions.size;

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  generateSessionId,

  createSession,

  getSession,

  getSessions,

  getSessionCount,

  setConnected,

  setDisconnected,

  setLanguage,

  verifyLogin,

  verifySession,

  isAuthenticated,

  isSessionConnected,

  deleteSession,

  cleanupSessions

};