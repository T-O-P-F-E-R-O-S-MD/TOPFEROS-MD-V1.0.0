"use strict";

const crypto = require("crypto");

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║          ⚙️ MULTI-SESSION SETTINGS PANEL         ║
// ║              🚀 TOPFEROS TECH                    ║
// ╚════════════════════════════════════════════════════╝


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 PANEL URL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PANEL_URL =
  process.env.PANEL_URL ||
  "http://localhost:3000";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 SESSIONS
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
// 📱 GET BOT NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getBotNumber(sock) {

  if (!sock?.user?.id) {
    return null;
  }

  const number =
    String(sock.user.id)
      .split(":")[0]
      .split("@")[0]
      .replace(/\D/g, "");

  return number || null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 GENERATE ONE REAL PANEL CODE
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

  for (const key of Object.keys(defaultSettings)) {

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
    Number.isFinite(Number(bot.age)) &&
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
// 🟢 CONNECT / REGISTER BOT
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


  // Chèche session ki deja asosye ak nimewo a.
  for (
    const session of sessions.values()
  ) {

    if (
      session.number === number
    ) {

      session.sock =
        sock;

      session.connected =
        true;

      return session;
    }
  }


  // Kreye yon nouvo session.
  const sessionId =
    generateSessionId();


  // Yon sèl Parrain Code pou session sa a.
  const code =
    generateCode();


  const session = {

    sessionId,

    number,

    code,

    authenticated: false,

    connected: true,

    sock,

    createdAt:
      Date.now(),

    settings:
      normalizeSettings(),

    bot:
      normalizeBotInformation()
  };


  sessions.set(
    sessionId,
    session
  );


  console.log(
    `🟢 SETTINGS: Bot connected: ${number}`
  );

  console.log(
    `🔐 SETTINGS: Parrain Code generated for session ${sessionId}`
  );


  return session;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔴 DISCONNECT BOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setBotDisconnected(
  sockOrSessionId
) {

  let sessionId = null;


  if (
    typeof sockOrSessionId ===
    "string"
  ) {

    sessionId =
      sockOrSessionId;

  } else if (
    sockOrSessionId
  ) {

    for (
      const [
        id,
        session
      ] of sessions.entries()
    ) {

      if (
        session.sock ===
        sockOrSessionId
      ) {

        sessionId =
          id;

        break;
      }
    }
  }


  if (!sessionId) {
    return false;
  }


  const session =
    sessions.get(
      sessionId
    );


  if (!session) {
    return false;
  }


  // Code la pa valab ankò.
  session.authenticated =
    false;

  session.connected =
    false;

  session.sock =
    null;


  // Nou efase session nan pou code la pa ka itilize ankò.
  sessions.delete(
    sessionId
  );


  console.log(
    `🔴 SETTINGS: Session disconnected: ${session.number}`
  );


  return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 ANY BOT CONNECTED?
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isBotConnected() {

  return sessions.size > 0;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 SESSION CONNECTED?
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
    session.sock &&
    session.connected === true
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔌 GET ACTIVE SOCKET
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

  session.connected =
    true;


  // Pa janm regenerate code la pou menm session lan.
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
      `${PANEL_URL}/?session=${encodeURIComponent(session.sessionId)}`
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 VERIFY SESSION
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


  if (
    !session.sock ||
    session.connected !== true
  ) {

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
// 🔐 CHECK AUTHENTICATED
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


  if (
    !session.sock ||
    session.connected !== true
  ) {

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

  return sessions.delete(
    sessionId
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 SEND PANEL LINK + REAL PARRAIN CODE
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
      "┃       ⚙️ SETTINGS PANEL    ┃\n" +
      "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

      "🤖 *BOT:* TOPFEROS MD V1.0.0\n\n" +

      "🔗 *Panel Link:*\n" +
      `${panel.link}\n\n` +

      "🔐 *PARRAIN CODE:*\n" +
      `${panel.code}\n\n` +

      "📱 *NUMBER:*\n" +
      `${panel.number}\n\n` +

      "🟢 Code sa a asosye ak session WhatsApp bot sa a.\n" +
      "🔴 Lè session bot la dekonekte, code sa a pa valid ankò.\n\n" +

      "Louvri link lan epi antre:\n" +
      "• Number\n" +
      "• Parrain Code\n" +
      "• LOGIN\n\n" +

      "=========================\n" +
      "       By TOPFEROS TECH\n" +
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
    !Object.prototype.hasOwn