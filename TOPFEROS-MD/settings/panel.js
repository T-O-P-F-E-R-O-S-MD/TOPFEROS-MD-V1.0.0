"use strict";

const crypto = require("crypto");

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║          ⚙️ MULTI-SESSION SETTINGS PANEL         ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 PANEL URL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PANEL_URL =
  process.env.PANEL_URL ||
  "http://localhost:3000";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 MULTI-SESSION STORAGE
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
// 🔐 GENERATE REAL PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Code la kreye ak crypto.randomBytes.
// Li fèt pou session bot la sèlman.
// Li pa chanje pandan session lan rete konekte.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateCode() {

  return crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 NORMALIZE SETTINGS
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

function normalizeBotInformation(bot = {}) {

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
    ) &&
    Number(bot.age) >= 0
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
// 🟢 REGISTER / CONNECT BOT SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setBotConnected(sock) {

  if (!sock) {
    return null;
  }

  const number =
    getBotNumber(sock);

  if (!number) {

    console.error(
      "❌ SETTINGS: Bot number pa disponib."
    );

    return null;
  }


  // Chèche si nimewo sa a deja gen yon session.

  for (
    const session of sessions.values()
  ) {

    if (
      session.number === number
    ) {

      session.sock =
        sock;

      // Pa chanje Parrain Code la.

      if (!session.code) {
        session.code =
          generateCode();
      }

      session.authenticated =
        false;

      console.log(
        `🟢 SETTINGS: Session refreshed for ${number}`
      );

      return session;
    }
  }


  // Nouvo session.

  const sessionId =
    crypto
      .randomBytes(32)
      .toString("hex");


  const session = {

    sessionId,

    number,

    // Yon sèl Parrain Code pou session sa a.
    code:
      generateCode(),

    authenticated:
      false,

    sock,

    createdAt:
      Date.now(),

    settings: {
      ...defaultSettings
    },

    bot: {
      ...defaultBotInformation
    }
  };


  sessions.set(
    sessionId,
    session
  );


  console.log(
    `🟢 SETTINGS: New bot session connected: ${number}`
  );

  console.log(
    `🔐 SETTINGS: Parrain Code generated for ${number}: ${session.code}`
  );


  return session;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔴 DISCONNECT BOT SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setBotDisconnected(
  sockOrSessionId
) {

  let targetSessionId = null;


  if (
    typeof sockOrSessionId ===
    "string"
  ) {

    targetSessionId =
      sockOrSessionId;
  }

  else if (sockOrSessionId) {

    for (
      const [sessionId, session]
      of sessions.entries()
    ) {

      if (
        session.sock ===
        sockOrSessionId
      ) {

        targetSessionId =
          sessionId;

        break;
      }
    }
  }


  if (!targetSessionId) {
    return false;
  }


  const session =
    sessions.get(
      targetSessionId
    );


  if (!session) {
    return false;
  }


  // Lè session WhatsApp la dekonekte,
  // Parrain Code la pa rete valid.

  session.authenticated =
    false;

  session.sock =
    null;


  sessions.delete(
    targetSessionId
  );


  console.log(
    `🔴 SETTINGS: Session disconnected: ${session.number}`
  );

  console.log(
    `🔐 SETTINGS: Parrain Code invalidated for ${session.number}`
  );


  return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 CHECK ANY BOT CONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isBotConnected() {

  return sessions.size > 0;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 CHECK SPECIFIC SESSION CONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isSessionConnected(
  sessionId
) {

  const session =
    sessions.get(
      sessionId
    );

  return !!(
    session &&
    session.sock
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔌 GET ACTIVE SOCKET BY SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getActiveSocket(
  sessionId
) {

  const session =
    sessions.get(
      sessionId
    );

  if (!session) {
    return null;
  }

  return session.sock || null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 GET SESSION BY NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessionByNumber(
  number
) {

  const cleanNumber =
    String(number || "")
      .replace(/\D/g, "");


  if (!cleanNumber) {
    return null;
  }


  for (
    const session
    of sessions.values()
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
// 🪪 CREATE PANEL SESSION
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


  let session =
    getSessionByNumber(
      number
    );


  if (!session) {

    session =
      setBotConnected(
        sock
      );
  }


  if (!session) {

    throw new Error(
      "Pa kapab kreye session bot la."
    );
  }


  // Toujou mete socket aktyèl la.

  session.sock =
    sock;


  // Code la pa janm chanje
  // pandan menm session lan egziste.

  if (!session.code) {

    session.code =
      generateCode();
  }


  return {

    sessionId:
      session.sessionId,

    number:
      session.number,

    code:
      session.code,

    link:
      `${PANEL_URL}/?session=${encodeURIComponent(
        session.sessionId
      )}`
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 VERIFY NUMBER + PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function verifySession(
  sessionId,
  number,
  code
) {

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
    sessions.get(
      sessionId
    );


  if (!session) {

    return {

      success: false,

      message:
        "❌ Session la pa valid ankò."
    };
  }


  // Session dwe gen vrè socket WhatsApp la.

  if (!session.sock) {

    return {

      success: false,

      message:
        "❌ Bot sa a pa konekte."
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
        "❌ Parrain Code la pa kòrèk."
    };
  }


  session.authenticated =
    true;


  return {

    success: true,

    session: {

      sessionId:
        session.sessionId,

      number:
        session.number,

      authenticated:
        true
    }
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 CHECK AUTHENTICATED SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isAuthenticated(
  sessionId
) {

  const session =
    sessions.get(
      sessionId
    );


  if (!session) {
    return false;
  }


  if (!session.sock) {
    return false;
  }


  return (
    session.authenticated ===
    true
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


  const session =
    sessions.get(
      sessionId
    );


  if (session) {

    session.authenticated =
      false;

    session.sock =
      null;
  }


  return sessions.delete(
    sessionId
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 SEND PANEL LINK + PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendPanelLink(
  sock,
  jid,
  quoted
) {

  if (
    !sock ||
    !jid
  ) {

    return false;
  }


  try {

    const panel =
      createSession(
        sock
      );


    const text =

      "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
      "┃\n" +
      "┃       ⚙️ SETTINGS PANEL\n" +
      "┃\n" +
      "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

      "🤖 *BOT:* TOPFEROS MD V1.0.0\n\n" +

      "🔗 *Link:*\n" +
      `${panel.link}\n\n` +

      "🔐 *PARRAIN CODE:*\n" +
      `${panel.code}\n\n` +

      "📱 *NUMBER:*\n" +
      `${panel.number}\n\n` +

      "🟢 Parrain Code sa a mare ak session WhatsApp sa a.\n" +
      "🔴 Li vin invalid lè session WhatsApp la dekonekte.\n\n" +

      "Louvri link lan epi antre:\n" +
      "• Number\n" +
      "• Parrain Code\n\n" +

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
// ⚙️ GET SETTINGS FOR SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSettings(
  sessionId
) {

  const session =
    sessions.get(
      sessionId
    );


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
    sessions.get(
      sessionId
    );


  if (!session) {
    return defaultSettings[name];
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
    sessions.get(
      sessionId
    );


  if (!session) {
    return false;
  }


  if (!session.sock) {
    return false;
  }


  const incoming =
    data.settings ||
    data;


  session.settings =
    normalizeSettings(
      incoming
    );


  console.log(
    `⚙️ SETTINGS: Runtime settings updated for ${session.number}`
  );


  return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 UPDATE BOT INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function updateBotInformation(
  sessionId,
  bot = {}
) {

  const session =
    sessions.get(
      sessionId
    );


  if (!session) {
    return false;
  }


  if (!session.sock) {
    return false;
  }


  session.bot =
    normalizeBotInformation(
      {
        ...session.bot,
        ...bot
      }
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
    sessions.get(
      sessionId
    );


  if (!session) {

    return {
      ...defaultBotInformation
    };
  }


  return {
    ...session.bot
  };
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
    sessions.get(
      sessionId
    );


  if (!session) {
    return false;
  }


  if (!session.sock) {
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
    sessions.get(
      sessionId
    );


  if (!session) {
    return null;
  }


  session.settings =
    normalizeSettings(
      settings
    );


  return getSettings(
    sessionId
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 GET ALL SESSIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessions() {

  return Array.from(
    sessions.values()
  ).map(session => ({

    sessionId:
      session.sessionId,

    number:
      session.number,

    authenticated:
      session.authenticated,

    connected:
      !!session.sock,

    createdAt:
      session.createdAt
  }));
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 GET SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSession(
  sessionId
) {

  const session =
    sessions.get(
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

    authenticated:
      session.authenticated,

    connected:
      !!session.sock,

    createdAt:
      session.createdAt
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 GET SESSION COUNT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSessionCount() {

  return sessions.size;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  PANEL_URL,

  // Connection
  setBotConnected,
  setBotDisconnected,
  isBotConnected,
  isSessionConnected,
  getActiveSocket,

  // Session
  createSession,
  verifySession,
  isAuthenticated,
  deleteSession,
  getSession,
  getSessionByNumber,
  getSessions,
  getSessionCount,

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

  // Default settings
  defaultSettings,
  defaultBotInformation
};


// ╔════════════════════════════════════════════════════╗
// ║                    By TOPFEROS TECH               ║
// ╚════════════════════════════════════════════════════╝