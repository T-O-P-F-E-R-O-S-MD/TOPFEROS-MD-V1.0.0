"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD                      ║
// ║              SETTINGS PANEL                       ║
// ╚════════════════════════════════════════════════════╝

const crypto = require("crypto");

const PANEL_URL =
  process.env.PANEL_URL ||
  "http://localhost:3000";


// ======================================================
// ⚙️ DEFAULT SETTINGS
// ======================================================

const defaultSettings = {

  publicMode: true,
  privateMode: false,

  alwaysOnline: true,
  fakeTyping: false,
  fakeRecording: false,

  autoReply: false,
  autoStatusSeen: false,
  autoStatusLike: false,
  autoStatus: false,
  autoReact: false,
  statusReply: false,
  statusLike: false,

  antiCall: false,
  antiCallMode: "ALL",

  antiDelete: false,
  antiDeleteMode: "ALL",
  antiDeleteSameChat: true,
  antiDeleteDM: false,
  antiDeleteDestination: "same",

  antiSpam: false,

  antiBug: false,
  antiBot: false,

  aiChat: false,

  groupAntiSpam: false,
  groupAntiLink: false,
  groupAntiDelete: false,

  adminGroup: false,
  adminGroupNumber: "",
  adminGroupLink: "",

  groupClose: false,
  groupOpen: false,

  groupCloseTime: "",
  groupOpenTime: "",

  groupTimeZone: "Atlantic/Port_of_Spain",

  groupBioEnabled: false,
  groupBioText: ""

};


// ======================================================
// 🤖 DEFAULT BOT INFORMATION
// ======================================================

const defaultBotInformation = {

  name: "TOPFEROS MD",

  number: "",

  location: "TOPFEROS CHINWA",

  age: 20,

  prefix: ".",

  footer: "🦁 TECH BY TOPFEROS MD 🐑",

  mode: "Public"

};


// ======================================================
// 📦 SESSIONS
// ======================================================

const sessions = new Map();


// ======================================================
// 🔢 NORMALIZE NUMBER
// ======================================================

function normalizeNumber(number) {

  return String(number || "")
    .replace(/\D/g, "");

}


// ======================================================
// 📱 GET PHONE FROM SOCKET
// ======================================================

function getPhoneFromSocket(sock) {

  try {

    const raw =
      sock?.user?.id ||
      sock?.user?.jid ||
      "";

    if (!raw) {
      return "";
    }

    return normalizeNumber(
      String(raw)
        .split(":")[0]
        .split("@")[0]
    );

  } catch {

    return "";

  }

}


// ======================================================
// 🔐 GENERATE CODE
// ======================================================

function generateCode() {

  return crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

}


// ======================================================
// 🔑 GENERATE SESSION ID
// ======================================================

function generateSessionId() {

  return crypto
    .randomBytes(24)
    .toString("hex");

}


// ======================================================
// 🔗 CREATE SESSION LINK
// ======================================================

function buildSessionLink(sessionId) {

  return `${PANEL_URL}/setting?session=${encodeURIComponent(
    sessionId
  )}`;

}


// ======================================================
// 🧹 CLEAN SESSION DATA
// ======================================================

function createSessionData(
  sock,
  sessionId
) {

  const number =
    getPhoneFromSocket(sock);

  return {

    sessionId,

    socket: sock,

    number,

    code: generateCode(),

    link:
      buildSessionLink(sessionId),

    connected: Boolean(sock),

    authenticated: false,

    createdAt: Date.now(),

    updatedAt: Date.now(),

    settings: {
      ...defaultSettings
    },

    botInformation: {

      ...defaultBotInformation,

      number

    }

  };

}


// ======================================================
// 🆕 CREATE NEW SESSION
// ======================================================

function createNewSession(sock) {

  if (!sock) {
    return null;
  }

  const sessionId =
    generateSessionId();

  const session =
    createSessionData(
      sock,
      sessionId
    );

  sessions.set(
    sessionId,
    session
  );

  return session;

}


// ======================================================
// 🔄 CREATE / GET SESSION
// ======================================================

function createSession(
  sock,
  sessionId = null
) {

  if (!sock) {
    return null;
  }

  if (sessionId) {

    const existing =
      sessions.get(
        String(sessionId)
      );

    if (existing) {

      existing.socket =
        sock;

      existing.connected =
        true;

      existing.number =
        getPhoneFromSocket(sock);

      existing.botInformation.number =
        existing.number;

      existing.updatedAt =
        Date.now();

      return existing;

    }

  }

  return createNewSession(sock);

}


// ======================================================
// 🔎 GET SESSION
// ======================================================

function getSession(sessionId) {

  if (!sessionId) {
    return null;
  }

  return sessions.get(
    String(sessionId)
  ) || null;

}


// ======================================================
// 🔎 GET SESSION BY NUMBER
// ======================================================

function getSessionByNumber(number) {

  const normalized =
    normalizeNumber(number);

  if (!normalized) {
    return null;
  }

  for (const session of sessions.values()) {

    if (
      normalizeNumber(
        session.number
      ) === normalized
    ) {

      return session;

    }

  }

  return null;

}


// ======================================================
// 🔎 GET SESSION BY SOCKET
// ======================================================

function getSessionBySocket(sock) {

  if (!sock) {
    return null;
  }

  for (const session of sessions.values()) {

    if (
      session.socket === sock
    ) {

      return session;

    }

  }

  return null;

}


// ======================================================
// 🟢 BOT CONNECTED
// ======================================================

function setBotConnected(sock) {

  if (!sock) {
    return null;
  }

  const session =
    createSession(sock);

  if (!session) {
    return null;
  }

  session.connected =
    true;

  session.authenticated =
    false;

  session.number =
    getPhoneFromSocket(sock);

  session.botInformation.number =
    session.number;

  session.updatedAt =
    Date.now();

  return session;

}


// ======================================================
// 🔴 BOT DISCONNECTED
// ======================================================

function setBotDisconnected(sock) {

  if (sock) {

    const session =
      getSessionBySocket(sock);

    if (session) {

      session.connected =
        false;

      session.authenticated =
        false;

      session.socket =
        null;

      session.updatedAt =
        Date.now();

    }

  }

  /*
   * Tout session ki te asosye ak bot la
   * pa dwe rete authenticated.
   */

  for (const session of sessions.values()) {

    if (!session.connected) {

      session.authenticated =
        false;

    }

  }

}


// ======================================================
// 🔐 VERIFY SESSION
// ======================================================

function verifySession(
  sessionId,
  number,
  code
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  if (
    !session.connected ||
    !session.socket
  ) {

    session.authenticated =
      false;

    return false;

  }

  const inputNumber =
    normalizeNumber(number);

  const sessionNumber =
    normalizeNumber(
      session.number
    );

  const inputCode =
    String(code || "")
      .trim()
      .toUpperCase();

  const sessionCode =
    String(session.code || "")
      .trim()
      .toUpperCase();

  if (
    !inputNumber ||
    !inputCode
  ) {

    return false;

  }

  if (
    inputNumber !==
    sessionNumber
  ) {

    return false;

  }

  if (
    inputCode !==
    sessionCode
  ) {

    return false;

  }

  session.authenticated =
    true;

  session.updatedAt =
    Date.now();

  return true;

}


// ======================================================
// 🔒 IS AUTHENTICATED
// ======================================================

function isAuthenticated(sessionId) {

  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  if (
    !session.connected ||
    !session.socket
  ) {

    session.authenticated =
      false;

    return false;

  }

  return Boolean(
    session.authenticated
  );

}


// ======================================================
// 🚪 LOGOUT SESSION
// ======================================================

function logoutSession(sessionId) {

  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  session.authenticated =
    false;

  session.updatedAt =
    Date.now();

  return true;

}


// ======================================================
// ⚙️ GET SETTINGS
// ======================================================

function getSettings(sessionId) {

  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  return {
    ...session.settings
  };

}


// ======================================================
// 🤖 GET BOT INFORMATION
// ======================================================

function getBotInformation(
  sessionId
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  return {
    ...session.botInformation
  };

}


// ======================================================
// 🎛️ SET ONE SETTING
// ======================================================

function setSetting(
  sessionId,
  key,
  value
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      defaultSettings,
      key
    )
  ) {

    return false;

  }

  /*
   * Text / select values
   * dwe rete string.
   */

  const textSettings = [

    "antiCallMode",
    "antiDeleteMode",
    "antiDeleteDestination",
    "adminGroupNumber",
    "adminGroupLink",
    "groupCloseTime",
    "groupOpenTime",
    "groupTimeZone",
    "groupBioText"

  ];

  if (
    textSettings.includes(key)
  ) {

    session.settings[key] =
      String(
        value ?? ""
      ).trim();

  } else {

    session.settings[key] =
      Boolean(value);

  }

  enforceSettingRules(
    session
  );

  session.updatedAt =
    Date.now();

  return true;

}


// ======================================================
// 🧠 ENFORCE SETTING RULES
// ======================================================

function enforceSettingRules(
  session
) {

  if (
    session.settings.publicMode
  ) {

    session.settings.privateMode =
      false;

  }

  if (
    session.settings.privateMode
  ) {

    session.settings.publicMode =
      false;

  }

  if (
    session.settings.antiDeleteSameChat
  ) {

    session.settings.antiDeleteDM =
      false;

  }

  if (
    session.settings.antiDeleteDM
  ) {

    session.settings.antiDeleteSameChat =
      false;

  }

  if (
    session.settings.groupClose
  ) {

    session.settings.groupOpen =
      false;

  }

  if (
    session.settings.groupOpen
  ) {

    session.settings.groupClose =
      false;

  }

  updateMode(session);

}


// ======================================================
// 💾 APPLY ALL SETTINGS
// ======================================================

function applySettings(
  sessionId,
  newSettings = {}
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  const textSettings = [

    "antiCallMode",
    "antiDeleteMode",
    "antiDeleteDestination",
    "adminGroupNumber",
    "adminGroupLink",
    "groupCloseTime",
    "groupOpenTime",
    "groupTimeZone",
    "groupBioText"

  ];

  for (
    const key of
    Object.keys(defaultSettings)
  ) {

    if (
      !Object.prototype.hasOwnProperty.call(
        newSettings,
        key
      )
    ) {

      continue;

    }

    if (
      textSettings.includes(key)
    ) {

      session.settings[key] =
        String(
          newSettings[key] ?? ""
        ).trim();

    } else {

      session.settings[key] =
        Boolean(
          newSettings[key]
        );

    }

  }

  enforceSettingRules(
    session
  );

  session.updatedAt =
    Date.now();

  return {
    ...session.settings
  };

}


// ======================================================
// 🔄 UPDATE BOT MODE
// ======================================================

function updateMode(session) {

  session.botInformation.mode =
    session.settings.privateMode
      ? "Private"
      : "Public";

}


// ======================================================
// 🤖 UPDATE BOT INFORMATION
// ======================================================

function updateBotInformation(
  sessionId,
  information = {}
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  /*
   * BOT NAME
   */

  if (
    typeof information.name ===
    "string"
  ) {

    const name =
      information.name.trim();

    session.botInformation.name =
      name ||
      "TOPFEROS MD";

  }

  /*
   * LOCATION
   */

  if (
    typeof information.location ===
    "string"
  ) {

    const location =
      information.location.trim();

    session.botInformation.location =
      location ||
      "TOPFEROS CHINWA";

  }

  /*
   * AGE
   */

  if (
    information.age !==
    undefined &&
    information.age !==
    null &&
    information.age !== ""
  ) {

    const age =
      Number(
        information.age
      );

    if (
      Number.isFinite(age) &&
      age >= 0
    ) {

      session.botInformation.age =
        age;

    }

  }

  /*
   * PREFIX
   */

  if (
    typeof information.prefix ===
    "string"
  ) {

    const prefix =
      information.prefix.trim();

    session.botInformation.prefix =
      prefix ||
      ".";

  }

  /*
   * FOOTER
   */

  if (
    typeof information.footer ===
    "string"
  ) {

    const footer =
      information.footer.trim();

    session.botInformation.footer =
      footer ||
      "🦁 TECH BY TOPFEROS MD 🐑";

  }

  /*
   * NUMBER TOUJOU SOTI NAN WHATSAPP.
   */

  if (session.number) {

    session.botInformation.number =
      session.number;

  }

  updateMode(session);

  session.updatedAt =
    Date.now();

  return {
    ...session.botInformation
  };

}


// ======================================================
// ✅ IS FEATURE ENABLED
// ======================================================

function isEnabled(
  sessionId,
  key
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      defaultSettings,
      key
    )
  ) {

    return false;

  }

  return Boolean(
    session.settings[key]
  );

}


// ======================================================
// 📥 LOAD SETTINGS
// ======================================================

function loadSettings(
  sessionId
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  updateMode(session);

  return {

    settings: {
      ...session.settings
    },

    botInformation: {
      ...session.botInformation
    }

  };

}


// ======================================================
// 🌐 SEND SETTINGS PANEL LINK
// ======================================================

async function sendPanelLink(
  sock,
  jid,
  quoted,
  sessionId = null
) {

  if (!sock || !jid) {
    return false;
  }

  const session =
    sessionId
      ? createSession(
          sock,
          sessionId
        )
      : createNewSession(
          sock
        );

  if (!session) {

    console.error(
      "❌ sendPanelLink: session not found"
    );

    return false;

  }

  const text =
`🦁 *TOPFEROS MD SETTINGS*

🔐 *Settings Code:* ${session.code}

🌐 *Settings Panel:*
${session.link}

⚠️ Pa pataje Settings Code ou ak lòt moun.`;

  try {

    await sock.sendMessage(
      jid,
      {
        text
      },
      {
        quoted
      }
    );

    return true;

  } catch (error) {

    console.error(
      "❌ sendPanelLink error:",
      error?.stack ||
      error?.message ||
      error
    );

    return false;

  }

}


// ======================================================
// 🗑️ REMOVE SESSION
// ======================================================

function removeSession(
  sessionId
) {

  if (!sessionId) {
    return false;
  }

  return sessions.delete(
    String(sessionId)
  );

}


// ======================================================
// 🧹 CLEAR ALL SESSIONS
// ======================================================

function clearSessions() {

  sessions.clear();

}


// ======================================================
// 📋 LIST SESSIONS
// ======================================================

function listSessions() {

  return Array.from(
    sessions.values()
  ).map(
    session => ({

      sessionId:
        session.sessionId,

      number:
        session.number,

      authenticated:
        Boolean(
          session.authenticated
        ),

      connected:
        Boolean(
          session.connected &&
          session.socket
        ),

      createdAt:
        session.createdAt,

      updatedAt:
        session.updatedAt

    })
  );

}


// ======================================================
// 📤 EXPORTS
// ======================================================

module.exports = {

  PANEL_URL,

  sessions,

  defaultSettings,
  defaultBotInformation,

  generateCode,

  normalizeNumber,
  getPhoneFromSocket,

  createNewSession,
  createSession,

  setBotConnected,
  setBotDisconnected,

  getSession,
  getSessionByNumber,
  getSessionBySocket,

  verifySession,
  isAuthenticated,
  logoutSession,

  getSettings,
  getBotInformation,

  setSetting,
  applySettings,
  updateBotInformation,

  isEnabled,
  loadSettings,

  sendPanelLink,

  removeSession,
  clearSessions,
  listSessions

};


// ╔════════════════════════════════════════════════════╗
// ║             🚀 TECH BY TOPFEROS MD               ║
// ╚════════════════════════════════════════════════════╝