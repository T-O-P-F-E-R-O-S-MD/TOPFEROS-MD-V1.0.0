"use strict";

const crypto = require("crypto");

const PANEL_URL =
  process.env.PANEL_URL ||
  "https://topferos-md-v1-0-0.onrender.com";

// ============================================================
// SESSION STORAGE
// ============================================================

const sessions = new Map();

// ============================================================
// DEFAULT SETTINGS
// ============================================================

const defaultSettings = {
  publicMode: true,
  privateMode: false,

  alwaysOnline: true,
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

// ============================================================
// BOT INFORMATION
// ============================================================

const defaultBotInformation = {
  name: "TOPFEROS MD",
  age: 24,
  prefix: "."
};

// ============================================================
// GENERATE 6 CHARACTER SETTINGS CODE
// LETTERS + NUMBERS
// ============================================================

const CODE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateCode() {
  let code = "";

  for (let i = 0; i < 6; i++) {
    const index = crypto.randomInt(0, CODE_CHARS.length);
    code += CODE_CHARS[index];
  }

  return code;
}

// ============================================================
// GET BOT NUMBER
// ============================================================

function getBotNumber(sock) {
  try {
    const id = sock?.user?.id;

    if (!id) {
      return "";
    }

    return String(id)
      .split(":")[0]
      .split("@")[0];
  } catch {
    return "";
  }
}

// ============================================================
// CREATE NEW SESSION
// ============================================================

function createNewSession(sock, number) {
  const sessionId = crypto.randomBytes(16).toString("hex");

  const session = {
    sessionId,

    number,

    // IMPORTANT:
    // This code is generated ONLY once for this session.
    code: generateCode(),

    authenticated: false,

    sock,

    createdAt: Date.now(),

    settings: {
      ...defaultSettings
    },

    bot: {
      ...defaultBotInformation
    }
  };

  sessions.set(sessionId, session);

  return session;
}

// ============================================================
// BOT CONNECTED
// ============================================================

function setBotConnected(sock) {
  const number = getBotNumber(sock);

  if (!number) {
    console.warn(
      "⚠️ Impossible pou kreye Settings Session: nimewo bot la pa disponib."
    );

    return null;
  }

  // Check if this bot already has a session.
  for (const session of sessions.values()) {
    if (session.number === number) {
      // Update socket only.
      session.sock = sock;

      return session;
    }
  }

  // New connection = new session = new code.
  return createNewSession(sock, number);
}

// ============================================================
// BOT DISCONNECTED
// ============================================================

function setBotDisconnected(sock) {
  const number = getBotNumber(sock);

  if (!number) {
    return;
  }

  for (const [sessionId, session] of sessions.entries()) {
    if (
      session.number === number ||
      session.sock === sock
    ) {
      sessions.delete(sessionId);

      console.log(
        `🗑️ Settings session deleted: ${sessionId}`
      );
    }
  }
}

// ============================================================
// CREATE / GET PANEL SESSION
// ============================================================

function createSession(sock) {
  const number = getBotNumber(sock);

  if (!number) {
    throw new Error(
      "Bot la poko gen nimewo WhatsApp li."
    );
  }

  let session = null;

  // Reuse existing session for same connected bot.
  for (const current of sessions.values()) {
    if (current.number === number) {
      session = current;
      session.sock = sock;
      break;
    }
  }

  // Create new session only if none exists.
  if (!session) {
    session = createNewSession(sock, number);
  }

  return {
    sessionId: session.sessionId,
    number: session.number,
    code: session.code,
    link:
      `${PANEL_URL}/?session=` +
      encodeURIComponent(session.sessionId)
  };
}

// ============================================================
// VERIFY SETTINGS SESSION
// ============================================================

function verifySession(sessionId, number, code) {
  const session = sessions.get(sessionId);

  if (!session) {
    return {
      success: false,
      message: "Session pa jwenn."
    };
  }

  if (
    String(session.number) !== String(number)
  ) {
    return {
      success: false,
      message: "Nimewo a pa kòrèk."
    };
  }

  if (
    String(session.code).toUpperCase() !==
    String(code).toUpperCase()
  ) {
    return {
      success: false,
      message: "Code Settings la pa kòrèk."
    };
  }

  session.authenticated = true;

  return {
    success: true,
    session
  };
}

// ============================================================
// GET SESSION
// ============================================================

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

// ============================================================
// GET SETTINGS
// ============================================================

function getSettings(sessionId) {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  return {
    ...session.settings
  };
}

// ============================================================
// GET ONE SETTING
// ============================================================

function getSetting(sessionId, key) {
  const session = sessions.get(sessionId);

  if (!session) {
    return undefined;
  }

  return session.settings[key];
}

// ============================================================
// CHECK IF SETTING IS ENABLED
// ============================================================

function isEnabled(sessionId, key) {
  const value = getSetting(sessionId, key);

  return value === true;
}

// ============================================================
// SET ONE SETTING
// ============================================================

function setSetting(sessionId, key, value) {
  const session = sessions.get(sessionId);

  if (!session) {
    return false;
  }

  if (!(key in session.settings)) {
    return false;
  }

  session.settings[key] = Boolean(value);

  return true;
}

// ============================================================
// APPLY MULTIPLE SETTINGS
// ============================================================

function applySettings(sessionId, newSettings = {}) {
  const session = sessions.get(sessionId);

  if (!session) {
    return false;
  }

  for (const [key, value] of Object.entries(newSettings)) {
    if (key in session.settings) {
      session.settings[key] = Boolean(value);
    }
  }

  return true;
}

// ============================================================
// BOT INFORMATION
// ============================================================

function getBotInformation(sessionId) {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  return {
    ...session.bot
  };
}

// ============================================================
// UPDATE BOT INFORMATION
// ============================================================

function updateBotInformation(sessionId, information = {}) {
  const session = sessions.get(sessionId);

  if (!session) {
    return false;
  }

  if (
    typeof information.name === "string" &&
    information.name.trim()
  ) {
    session.bot.name = information.name.trim();
  }

  if (
    information.age !== undefined &&
    information.age !== null
  ) {
    session.bot.age = information.age;
  }

  if (
    typeof information.prefix === "string" &&
    information.prefix.trim()
  ) {
    session.bot.prefix = information.prefix.trim();
  }

  return true;
}

// ============================================================
// LOAD SETTINGS
// ============================================================

function loadSettings(sessionId) {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  return {
    settings: {
      ...session.settings
    },

    bot: {
      ...session.bot
    }
  };
}

// ============================================================
// SEND SETTINGS MESSAGE
// ============================================================
//
// Menm WhatsApp message la gen:
// - Nimewo
// - Code Settings
// - Settings Link
// - Bouton KOPYE CODE
//
// Bouton an itilize native flow "cta_copy".
// ============================================================

async function sendPanelLink(sock, jid, quoted) {
  try {
    const panel = createSession(sock);

    const messageText =
`✧･ﾟ: ✧･ﾟ: 🔐 KONEKSYON TOPFEROS MD 🔐 :･ﾟ✧:･ﾟ✧

🌸 Nimewo Pwopriyetè a
╰┈➤ ${panel.number}

🌸 Code Settings
╰┈➤ ${panel.code}

🌐 Paramèt sou Entènèt
╰┈➤ ${panel.link}

╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈╯
💖 Kenbe enfòmasyon sa yo an sekirite epi pa pataje yo 💖`;

    await sock.sendMessage(
      jid,
      {
        interactiveMessage: {
          header: {
            title: "🔐 TOPFEROS MD SETTINGS",
            hasMediaAttachment: false
          },

          body: {
            text: messageText
          },

          footer: {
            text: "🚀 TOPFEROS TECH"
          },

          nativeFlowMessage: {
            messageParamsJson: "",

            buttons: [
              {
                name: "cta_copy",

                buttonParamsJson: JSON.stringify({
                  display_text: "📋 KOPYE CODE",
                  id: "copy_settings_code",
                  copy_code: panel.code
                })
              }
            ]
          }
        }
      },
      {
        quoted
      }
    );

    return panel;
  } catch (error) {
    console.error(
      "❌ SEND SETTINGS ERROR:",
      error?.message || error
    );

    return null;
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  PANEL_URL,

  sessions,

  defaultSettings,
  defaultBotInformation,

  generateCode,

  getBotNumber,

  setBotConnected,
  setBotDisconnected,

  createSession,
  getSession,
  verifySession,

  getSettings,
  getSetting,
  isEnabled,
  setSetting,
  applySettings,

  getBotInformation,
  updateBotInformation,

  loadSettings,

  sendPanelLink
};