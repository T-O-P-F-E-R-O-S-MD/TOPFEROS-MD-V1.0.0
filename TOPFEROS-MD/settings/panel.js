"use strict";

const crypto = require("crypto");

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║            ⚙️ MULTI-SESSION SETTINGS              ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 PANEL URL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PANEL_URL =
  process.env.PANEL_URL ||
  "http://localhost:3000";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗂️ MULTI-SESSION STORAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Chak session gen pwòp:
// • sock
// • number
// • code
// • settings
// • botInformation
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sessions = new Map();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ DEFAULT SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const defaultSettings = {

  publicMode: false,
  privateMode: false,

  alwaysOnline: false,
  fakeTyping: false,
  fakeRecording: false,
  autoReact: false,

  autoStatus: false,
  statusReply: false,
  statusLike: false,
  statusReact: false,

  antiCall: false,
  antiDelete: false,
  antiSpam: false,

  aiChat: false,

  groupAntiSpam: false,
  groupAntiLink: false,
  groupAntiDelete: false,

  adminGroup: false,

  groupClose: false,
  groupOpen: false
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 DEFAULT BOT INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const defaultBotInformation = {

  name: "TOPFEROS MD",

  age: 24,

  prefix: "."

};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔢 GET BOT NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getBotNumber(sock) {

  if (!sock?.user?.id) {
    return null;
  }

  return String(sock.user.id)
    .split(":")[0]
    .split("@")[0]
    .replace(/\D/g, "");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 NORMALIZE NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function normalizeNumber(number) {

  return String(number || "")
    .replace(/\D/g, "");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 GENERATE CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateCode() {

  return crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆔 GENERATE SESSION ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateSessionId() {

  return crypto
    .randomBytes(24)
    .toString("hex");

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ NORMALIZE SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function normalizeSettings(settings = {}) {

  const result = {
    ...defaultSettings
  };

  for (
    const key of Object.keys(defaultSettings)
  ) {

    if (
      Object.prototype.hasOwnProperty.call(
        settings,
        key
      )
    ) {

      result[key] =
        settings[key] === true;

    }

  }

  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 NORMALIZE BOT INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function normalizeBotInformation(
  bot = {}
) {

  const result = {
    ...defaultBotInformation
  };

  if (
    typeof bot.name === "string" &&
    bot.name.trim()
  ) {

    result.name =
      bot.name.trim();

  }

  if (
    Number.isFinite(
      Number(bot.age)
    )
  ) {

    result.age =
      Number(bot.age);

  }

  if (
    typeof bot.prefix === "string" &&
    bot.prefix.trim()
  ) {

    result.prefix =
      bot.prefix.trim();

  }

  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 REGISTER / UPDATE SESSION SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Rele menm sessionId la:
// socket la sèlman mete ajou.
// Sessions lòt nimewo yo pa touche.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function registerSession(
  sock,
  options = {}
) {

  if (!sock) {
    throw new Error(
      "Socket bot la obligatwa."
    );
  }

  const number =
    normalizeNumber(
      options.number ||
      getBotNumber(sock)
    );

  if (!number) {
    throw new Error(
      "Bot number pa disponib."
    );
  }

  let sessionId =
    options.sessionId;

  if (
    sessionId &&
    sessions.has(sessionId)
  ) {

    const existing =
      sessions.get(sessionId);

    existing.sock =
      sock;

    existing.number =
      number;

    existing.connected =
      true;

    existing.updatedAt =
      Date.now();

    return {
      ...existing
    };

  }

  sessionId =
    sessionId ||
    generateSessionId();

  const session = {

    sessionId,

    number,

    code:
      options.code ||
      generateCode(),

    authenticated:
      false,

    connected:
      true,

    sock,

    settings:
      normalizeSettings(
        options.settings
      ),

    botInformation:
      normalizeBotInformation(
        options.bot
      ),

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
    `🟢 MULTI-SESSION REGISTERED: ${number}`
  );

  return {
    ...session
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 BOT CONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Chak socket gen pwòp session li.
// Pa gen sessions.clear() ankò.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setBotConnected(sock) {

  if (!sock) {
    return null;
  }

  return registerSession(
    sock
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔴 BOT DISCONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Si yo bay sessionId:
// sèlman session sa a disconnect.
//
// Si yo bay sock:
// chèche session socket la epi disconnect li.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setBotDisconnected(
  sessionId,
  sock
) {

  let session = null;

  if (
    sessionId &&
    sessions.has(sessionId)
  ) {

    session =
      sessions.get(sessionId);

  } else if (sock) {

    for (
      const item of sessions.values()
    ) {

      if (
        item.sock === sock
      ) {

        session = item;
        break;

      }

    }

  }

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

  console.log(
    `🔴 MULTI-SESSION DISCONNECTED: ${session.number}`
  );

  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔌 GET SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSession(
  sessionId
) {

  if (!sessionId) {
    return null;
  }

  return (
    sessions.get(sessionId) ||
    null
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 FIND SESSION BY NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessionByNumber(
  number
) {

  const cleanNumber =
    normalizeNumber(number);

  if (!cleanNumber) {
    return null;
  }

  for (
    const session of sessions.values()
  ) {

    if (
      session.number ===
      cleanNumber
    ) {

      return session;
    }

  }

  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 FIND SESSION BY SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessionBySocket(
  sock
) {

  if (!sock) {
    return null;
  }

  for (
    const session of sessions.values()
  ) {

    if (
      session.sock === sock
    ) {

      return session;
    }

  }

  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 CHECK SESSION CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isSessionConnected(
  sessionId
) {

  const session =
    getSession(sessionId);

  return (
    !!session &&
    session.connected === true &&
    !!session.sock
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 CHECK ANY BOT CONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isBotConnected() {

  for (
    const session of sessions.values()
  ) {

    if (
      session.connected === true &&
      session.sock
    ) {

      return true;
    }

  }

  return false;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔌 GET ACTIVE SOCKET BY SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getActiveSocket(
  sessionId
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  return session.sock || null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 GET ALL CONNECTED SESSIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getConnectedSessions() {

  const result = [];

  for (
    const session of sessions.values()
  ) {

    if (
      session.connected === true &&
      session.sock
    ) {

      result.push({

        sessionId:
          session.sessionId,

        number:
          session.number,

        connected:
          true,

        createdAt:
          session.createdAt,

        updatedAt:
          session.updatedAt

      });

    }

  }

  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🪪 CREATE PANEL SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Si socket la deja anrejistre:
// nou kreye yon nouvo panel login pou socket sa.
// Sessions lòt bot yo rete jan yo ye.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createSession(
  sock
) {

  if (!sock) {
    throw new Error(
      "Socket bot la obligatwa."
    );
  }

  const number =
    getBotNumber(sock);

  if (!number) {
    throw new Error(
      "Bot number pa disponib."
    );
  }

  const sessionId =
    generateSessionId();

  const code =
    generateCode();

  const session = {

    sessionId,

    number,

    code,

    authenticated:
      false,

    connected:
      true,

    sock,

    settings:
      normalizeSettings(),

    botInformation:
      normalizeBotInformation(),

    createdAt:
      Date.now(),

    updatedAt:
      Date.now()

  };

  sessions.set(
    sessionId,
    session
  );

  return {

    sessionId,

    number,

    code,

    link:
      `${PANEL_URL}/?session=${sessionId}`

  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 VERIFY NUMBER + CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
        "❌ Session la pa valid ankò."

    };

  }

  if (
    session.connected !== true ||
    !session.sock
  ) {

    return {

      success: false,

      message:
        "❌ Bot sa a dekonekte. Session la pa disponib."

    };

  }

  if (
    !number ||
    !code
  ) {

    return {

      success: false,

      message:
        "❌ Number ak Code obligatwa."

    };

  }

  const cleanNumber =
    normalizeNumber(number);

  const cleanCode =
    String(code)
      .trim()
      .toUpperCase();

  if (
    cleanNumber !==
    session.number
  ) {

    return {

      success: false,

      message:
        "❌ Number lan pa koresponn ak session sa a."

    };

  }

  if (
    cleanCode !==
    session.code
  ) {

    return {

      success: false,

      message:
        "❌ Code la pa kòrèk."

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 CHECK AUTHENTICATED SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isAuthenticated(
  sessionId
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return false;
  }

  return (
    session.connected === true &&
    !!session.sock &&
    session.authenticated === true
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗑️ DELETE PANEL SESSION
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
// 📤 VOYE LINK + CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendPanelLink(
  sock,
  jid,
  quoted
) {

  if (!sock || !jid) {
    return false;
  }

  const session =
    registerSession(sock);

  try {

    const panel =
      createSession(sock);

    const text =
      "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
      "┃\n" +
      "┃       ⚙️ SETTINGS PANEL\n" +
      "┃       🤖 TOPFEROS MD V1.0.0\n" +
      "┃\n" +
      "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

      "📱 *Number:*\n" +
      `${panel.number}\n\n` +

      "🔗 *Link:*\n" +
      `${panel.link}\n\n` +

      "🔐 *Code:*\n" +
      `${panel.code}\n\n` +

      "🟢 Code sa a valid toutotan session bot sa a konekte.\n" +
      "🔴 Si session sa a dekonekte, code li vin invalid.\n\n" +

      "Louvri link lan epi antre:\n" +
      "• Number\n" +
      "• Code\n" +
      "• NEXT\n\n" +

      "=========================\n" +
      "        By TOPFEROS TECH\n" +
      "=========================";

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
      "❌ SETTINGS LINK ERROR:",
      error?.message || error
    );

    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ GET SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSettings(
  sessionId
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return {
      ...defaultSettings
    };
  }

  return {
    ...session.settings
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ GET ONE SETTING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSetting(
  sessionId,
  name
) {

  if (
    !Object.prototype.hasOwnProperty.call(
      defaultSettings,
      name
    )
  ) {

    return undefined;
  }

  const session =
    getSession(sessionId);

  if (!session) {
    return undefined;
  }

  return session.settings[name];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔘 CHECK SETTING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isEnabled(
  sessionId,
  name
) {

  return (
    getSetting(
      sessionId,
      name
    ) === true
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 APPLY SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function applySettings(
  sessionId,
  data = {}
) {

  const session =
    getSession(sessionId);

  if (
    !session ||
    !session.connected ||
    !session.sock
  ) {

    return false;
  }

  const incoming =
    data.settings ||
    data;

  session.settings =
    normalizeSettings(
      incoming
    );

  session.updatedAt =
    Date.now();

  console.log(
    `⚙️ SETTINGS UPDATED: ${session.number}`
  );

  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 UPDATE ONE SETTING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function setSetting(
  sessionId,
  name,
  value
) {

  const session =
    getSession(sessionId);

  if (
    !session ||
    !session.connected ||
    !session.sock
  ) {

    return false;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      defaultSettings,
      name
    )
  ) {

    return false;
  }

  session.settings[name] =
    value === true;

  session.updatedAt =
    Date.now();

  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 LOAD SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadSettings(
  sessionId,
  settings = {}
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  session.settings =
    normalizeSettings(
      settings
    );

  session.updatedAt =
    Date.now();

  return {
    ...session.settings
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 UPDATE BOT INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function updateBotInformation(
  sessionId,
  bot = {}
) {

  const session =
    getSession(sessionId);

  if (
    !session ||
    !session.connected ||
    !session.sock
  ) {

    return false;
  }

  session.botInformation =
    normalizeBotInformation({
      ...session.botInformation,
      ...bot
    });

  session.updatedAt =
    Date.now();

  console.log(
    `🤖 BOT INFORMATION UPDATED: ${session.number}`
  );

  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 GET BOT INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getBotInformation(
  sessionId
) {

  const session =
    getSession(sessionId);

  if (!session) {

    return {
      ...defaultBotInformation
    };

  }

  return {
    ...session.botInformation
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 GET BOT NUMBER BY SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getNumber(
  sessionId
) {

  const session =
    getSession(sessionId);

  if (!session) {
    return null;
  }

  return session.number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 GET PANEL SESSION INFO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Pa retounen code la pou sekirite.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessionInfo(
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

    authenticated:
      session.authenticated,

    connected:
      session.connected,

    createdAt:
      session.createdAt,

    updatedAt:
      session.updatedAt

  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 GET SESSION COUNT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessionCount() {

  return sessions.size;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAR DISCONNECTED SESSIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function clearDisconnectedSessions() {

  let removed = 0;

  for (
    const [
      sessionId,
      session
    ] of sessions.entries()
  ) {

    if (
      session.connected !== true
    ) {

      sessions.delete(
        sessionId
      );

      removed++;

    }

  }

  return removed;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  PANEL_URL,

  // Session management
  registerSession,
  createSession,
  getSession,
  getSessionByNumber,
  getSessionBySocket,
  getSessionInfo,
  getSessionCount,
  getConnectedSessions,
  clearDisconnectedSessions,

  // Connection
  setBotConnected,
  setBotDisconnected,
  isBotConnected,
  isSessionConnected,
  getActiveSocket,

  // Authentication
  verifySession,
  isAuthenticated,
  deleteSession,

  // Panel
  sendPanelLink,

  // Runtime settings
  getSettings,
  getSetting,
  isEnabled,
  setSetting,
  applySettings,
  loadSettings,

  // Bot information
  updateBotInformation,
  getBotInformation,
  getNumber,

  // Defaults
  defaultSettings,
  defaultBotInformation
};


// ╔════════════════════════════════════════════════════╗
// ║                 By TOPFEROS TECH                  ║
// ╚════════════════════════════════════════════════════╝