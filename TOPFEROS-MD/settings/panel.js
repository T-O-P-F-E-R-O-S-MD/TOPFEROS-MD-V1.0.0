"use strict";

const crypto = require("crypto");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ TOPFEROS MD — SETTINGS PANEL + RUNTIME SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// URL Web Panel la
const PANEL_URL =
  process.env.PANEL_URL ||
  "http://localhost:3000";

// Sessions yo rete sèlman pandan bot la konekte.
const sessions = new Map();

// Eta koneksyon bot la
let botConnected = false;

// Socket bot aktyèl la
let activeSock = null;

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

// Settings aktyèl yo nan RAM
let runtimeSettings = {
  ...defaultSettings
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔢 JWENN NUMERO BOT LA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getBotNumber(sock) {
  if (!sock?.user?.id) {
    return null;
  }

  return sock.user.id
    .split(":")[0]
    .split("@")[0];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 KREYE CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateCode() {
  return crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 VERIFY SETTINGS
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
// 🟢 BOT CONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setBotConnected(sock) {
  botConnected = true;

  activeSock = sock || null;

  // Lè bot rekonekte, ansyen sessions yo
  // pa sèvi ankò.
  sessions.clear();

  console.log(
    "🟢 SETTINGS: Bot connected."
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔴 BOT DISCONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setBotDisconnected() {
  botConnected = false;

  activeSock = null;

  // Tout code panel yo vin invalid
  // imedyatman lè bot la dekonekte.
  sessions.clear();

  console.log(
    "🔴 SETTINGS: Bot disconnected. All panel codes invalidated."
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📡 CHECK CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isBotConnected() {
  return botConnected;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔌 GET ACTIVE SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getActiveSocket() {
  return activeSock;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🪪 KREYE PANEL SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createSession(sock) {
  if (!botConnected) {
    throw new Error(
      "Bot la pa konekte."
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
    crypto
      .randomBytes(24)
      .toString("hex");

  const code =
    generateCode();

  const session = {
    sessionId,
    number,
    code,
    authenticated: false,
    createdAt: Date.now()
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
// 🔎 VERIFY NUMBER + CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function verifySession(
  sessionId,
  number,
  code
) {
  // Bot dwe toujou konekte
  if (!botConnected) {
    return {
      success: false,
      message:
        "❌ Bot la dekonekte. Code panel la pa valid ankò."
    };
  }

  if (
    !sessionId ||
    !number ||
    !code
  ) {
    return {
      success: false,
      message:
        "❌ Number ak Code obligatwa."
    };
  }

  const session =
    sessions.get(sessionId);

  if (!session) {
    return {
      success: false,
      message:
        "❌ Session la pa valid ankò."
    };
  }

  const cleanNumber =
    String(number)
      .replace(/\D/g, "");

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
        "❌ Number lan pa koresponn ak bot la."
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

  return {
    success: true,
    session
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 VERIFY SESSION APRÈ NEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isAuthenticated(
  sessionId
) {
  // Bot la dwe toujou konekte.
  if (!botConnected) {
    return false;
  }

  const session =
    sessions.get(sessionId);

  if (!session) {
    return false;
  }

  return (
    session.authenticated === true
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗑️ DELETE SESSION
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

  if (!botConnected) {
    await sock.sendMessage(
      jid,
      {
        text:
          "❌ Bot la pa konekte.\n\n" +
          "⚙️ Settings Panel la disponib sèlman lè bot la konekte."
      },
      {
        quoted
      }
    );

    return false;
  }

  try {
    const panel =
      createSession(sock);

    const text =
      "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
      "┃\n" +
      "┃       ⚙️ SETTINGS PANEL\n" +
      "┃\n" +
      "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

      "🔗 *Link:*\n" +
      `${panel.link}\n\n` +

      "🔐 *Code:*\n" +
      `${panel.code}\n\n` +

      "🟢 Code sa a valid toutotan bot la konekte.\n" +
      "🔴 Si bot la dekonekte, code la vin invalid.\n\n" +

      "Louvri link lan epi antre:\n" +
      "• Number\n" +
      "• Code\n" +
      "• NEXT\n\n" +

      "Made in TOPFEROS TECH\n" +
      "========================";

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
      error
    );

    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ GET ALL RUNTIME SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSettings() {
  return {
    ...runtimeSettings
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ GET ONE SETTING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSetting(name) {
  if (
    !Object.prototype.hasOwnProperty.call(
      defaultSettings,
      name
    )
  ) {
    return undefined;
  }

  return runtimeSettings[name];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔘 CHECK SETTING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isEnabled(name) {
  return getSetting(name) === true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 APPLY SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// SAVE nan panel la rive isit la.
// Settings yo antre nan RAM bot la touswit.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function applySettings(data = {}) {
  if (!botConnected) {
    return false;
  }

  const incoming =
    data.settings || data;

  runtimeSettings =
    normalizeSettings(
      incoming
    );

  console.log(
    "⚙️ SETTINGS: Runtime settings updated."
  );

  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 UPDATE BOT INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let botInformation = {
  name: "TOPFEROS MD",
  age: 24,
  prefix: "."
};

async function updateBotInformation(
  bot = {}
) {
  if (!botConnected) {
    return false;
  }

  if (
    typeof bot.name === "string" &&
    bot.name.trim()
  ) {
    botInformation.name =
      bot.name.trim();
  }

  if (
    Number.isFinite(
      Number(bot.age)
    )
  ) {
    botInformation.age =
      Number(bot.age);
  }

  if (
    typeof bot.prefix === "string" &&
    bot.prefix.trim()
  ) {
    botInformation.prefix =
      bot.prefix.trim();
  }

  console.log(
    "🤖 SETTINGS: Bot information updated."
  );

  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 GET BOT INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getBotInformation() {
  return {
    ...botInformation
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 UPDATE ONE SETTING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function setSetting(
  name,
  value
) {
  if (!botConnected) {
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

  runtimeSettings[name] =
    value === true;

  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 LOAD SETTINGS INTO RUNTIME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadSettings(
  settings = {}
) {
  runtimeSettings =
    normalizeSettings(
      settings
    );

  return getSettings();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  PANEL_URL,

  // Connection
  setBotConnected,
  setBotDisconnected,
  isBotConnected,
  getActiveSocket,

  // Session
  createSession,
  verifySession,
  isAuthenticated,
  deleteSession,
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

  // Default settings
  defaultSettings
};