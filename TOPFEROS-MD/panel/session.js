"use strict";

const crypto = require("crypto");

// =====================================================
// 🦁 TOPFEROS MD
// SESSION MANAGER
// TOPFEROS TECH
// =====================================================

const sessions = new Map();

// =====================================================
// 🔐 GENERATE SESSION ID
// =====================================================

function generateSessionId() {
  return crypto.randomBytes(24).toString("hex");
}

// =====================================================
// 🔑 GENERATE PANEL CODE
// =====================================================

function generatePanelCode() {
  return (
    "TOP-" +
    crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()
  );
}

// =====================================================
// 🟢 CREATE SESSION
// =====================================================

function createSession(sock = null) {

  const sessionId =
    generateSessionId();

  const code =
    generatePanelCode();

  const session = {
    sessionId,
    code,

    number: null,

    language: "en",

    authenticated: false,

    connected: !!sock,

    sock,

    createdAt: Date.now(),

    updatedAt: Date.now()
  };

  sessions.set(
    sessionId,
    session
  );

  return session;
}

// =====================================================
// 🔎 GET SESSION
// =====================================================

function getSession(sessionId) {

  if (!sessionId) {
    return null;
  }

  return (
    sessions.get(sessionId) ||
    null
  );
}

// =====================================================
// 🟢 SET SOCKET
// =====================================================

function setSocket(
  sessionId,
  sock
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.sock =
    sock;

  session.connected =
    !!sock;

  session.updatedAt =
    Date.now();

  return true;
}

// =====================================================
// 📱 SET NUMBER
// =====================================================

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
    String(number || "")
      .replace(/\D/g, "");

  session.updatedAt =
    Date.now();

  return true;
}

// =====================================================
// 🌍 SET LANGUAGE
// =====================================================

function setLanguage(
  sessionId,
  language
) {

  const allowed = [
    "en",
    "fr",
    "es"
  ];

  if (!allowed.includes(language)) {
    return false;
  }

  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.language =
    language;

  session.updatedAt =
    Date.now();

  return true;
}

// =====================================================
// 🔐 VERIFY LOGIN
// =====================================================

function verifySession(
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
        "Session not found."
    };

  }

  if (!session.connected) {

    return {
      success: false,
      message:
        "Bot is disconnected."
    };

  }

  const cleanNumber =
    String(number || "")
      .replace(/\D/g, "");

  const cleanCode =
    String(code || "")
      .trim()
      .toUpperCase();

  if (
    cleanNumber !==
    String(session.number || "")
  ) {

    return {
      success: false,
      message:
        "Invalid bot number."
    };

  }

  if (
    cleanCode !==
    String(session.code || "")
  ) {

    return {
      success: false,
      message:
        "Invalid panel code."
    };

  }

  session.authenticated =
    true;

  session.updatedAt =
    Date.now();

  return {
    success: true,
    session
  };
}

// =====================================================
// 🔓 AUTH CHECK
// =====================================================

function isAuthenticated(
  sessionId
) {

  const session =
    getSession(sessionId);

  return !!(
    session &&
    session.authenticated
  );
}

// =====================================================
// 🔴 DISCONNECT
// =====================================================

function disconnectSession(
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

  session.sock =
    null;

  session.updatedAt =
    Date.now();

  return true;
}

// =====================================================
// 🗑️ DELETE SESSION
// =====================================================

function deleteSession(
  sessionId
) {

  return sessions.delete(
    sessionId
  );
}

// =====================================================
// 📋 ALL SESSIONS
// =====================================================

function getSessions() {

  return Array.from(
    sessions.values()
  );
}

// =====================================================
// 📤 EXPORT
// =====================================================

module.exports = {

  createSession,

  getSession,

  setSocket,

  setNumber,

  setLanguage,

  verifySession,

  isAuthenticated,

  disconnectSession,

  deleteSession,

  getSessions,

  generateSessionId,

  generatePanelCode

};