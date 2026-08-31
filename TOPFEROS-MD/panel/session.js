"use strict";

const crypto = require("crypto");

// ╔════════════════════════════════════════════════════╗
// ║          🦁 TOPFEROS MD - SESSION MANAGER        ║
// ║                🚀 TOPFEROS TECH                   ║
// ╚════════════════════════════════════════════════════╝

// Tout session panel yo ap rete isit la.
const sessions = new Map();

// Konbyen tan yon session ka rete aktif.
// 24 èdtan.
const SESSION_TTL = 24 * 60 * 60 * 1000;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆔 KREYE YON SESSION ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateSessionId() {

  return crypto
    .randomBytes(24)
    .toString("hex");

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 KREYE SESSION PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createSession(options = {}) {

  const sessionId =
    generateSessionId();

  const now =
    Date.now();

  const session = {

    sessionId,

    number:
      options.number || null,

    code:
      options.code || null,

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


  return session;

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


  // Si session lan ekspire, retire li.
  if (
    session.expiresAt &&
    session.expiresAt < Date.now()
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


  session.connected =
    true;


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


  session.connected =
    false;

  session.authenticated =
    false;


  sessions.set(
    sessionId,
    session
  );


  return true;

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 SOVE LANG
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
    language;


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


  session.number =
    cleanNumber;

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
// 🗑️ EFASE SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function deleteSession(
  sessionId
) {

  return sessions.delete(
    sessionId
  );

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 JWENN TOUT SESSION YO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessions() {

  const result = [];

  for (
    const session of sessions.values()
  ) {

    if (
      session.expiresAt &&
      session.expiresAt < Date.now()
    ) {

      sessions.delete(
        session.sessionId
      );

      continue;
    }


    result.push(
      {
        ...session
      }
    );

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
      session.expiresAt < now
    ) {

      sessions.delete(
        sessionId
      );

    }

  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  createSession,

  getSession,

  getSessions,

  setConnected,

  setDisconnected,

  setLanguage,

  verifyLogin,

  isAuthenticated,

  isSessionConnected,

  deleteSession,

  cleanupSessions

};