"use strict";

const crypto = require("crypto");

const PANEL_URL =
  process.env.SETTINGS_PANEL_URL ||
  process.env.PANEL_URL ||
  "https://topferos-md-v1-0-0.onrender.com";

const sessions = new Map();

const defaultSettings = {
  publicMode: true,
  privateMode: false,
  alwaysOnline: true,
  fakeTyping: false,
  fakeRecording: false,

  antiCall: false,
  antiDelete: false,
  antiSpam: false,
  antiLink: false,
  antiRobot: false,

  autoStatus: false,
  statusReply: false,
  statusLike: false,
  statusReact: false,

  groupAntiSpam: false,
  groupAntiLink: false,
  groupAntiDelete: false,
  groupClose: false,
  groupOpen: false,

  aiChat: false
};

const defaultBotInformation = {
  name: "TOPFEROS MD",
  number: "",
  prefix: ".",
  mode: "Public"
};

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }

  return code;
}

function normalizeNumber(number) {
  return String(number || "").replace(/\D/g, "");
}

function getPhoneFromSocket(sock) {
  try {
    const jid = sock?.user?.id || "";
    return normalizeNumber(jid.split(":")[0].split("@")[0]);
  } catch {
    return "";
  }
}

function createNewSession(sock, number = "") {
  const phoneNumber =
    normalizeNumber(number) ||
    getPhoneFromSocket(sock);

  const sessionId = crypto.randomBytes(18).toString("hex");

  const session = {
    sessionId,
    number: phoneNumber,
    code: generateCode(),
    authenticated: false,
    createdAt: Date.now(),
    settings: { ...defaultSettings },
    botInformation: {
      ...defaultBotInformation,
      number: phoneNumber
    },
    socket: sock || null
  };

  sessions.set(sessionId, session);

  return session;
}

function findSessionByNumber(number) {
  const phoneNumber = normalizeNumber(number);

  if (!phoneNumber) return null;

  for (const session of sessions.values()) {
    if (session.number === phoneNumber) {
      return session;
    }
  }

  return null;
}

function findSessionBySocket(sock) {
  for (const session of sessions.values()) {
    if (session.socket === sock) {
      return session;
    }
  }

  return null;
}

function setBotConnected(sock) {
  const number = getPhoneFromSocket(sock);

  let session = findSessionByNumber(number);

  if (!session) {
    session = createNewSession(sock, number);
  } else {
    session.socket = sock;

    if (number) {
      session.number = number;
      session.botInformation.number = number;
    }
  }

  return session;
}

function setBotDisconnected(sock, remove = false) {
  if (!sock) return;

  const session = findSessionBySocket(sock);

  if (!session) return;

  session.socket = null;

  if (remove) {
    sessions.delete(session.sessionId);
  }
}

function createSession(sock) {
  let session = findSessionBySocket(sock);

  if (session) {
    return {
      sessionId: session.sessionId,
      number: session.number,
      code: session.code,
      link: `${PANEL_URL}/?session=${session.sessionId}`
    };
  }

  const number = getPhoneFromSocket(sock);

  session = findSessionByNumber(number);

  if (!session) {
    session = createNewSession(sock, number);
  } else {
    session.socket = sock;
  }

  return {
    sessionId: session.sessionId,
    number: session.number,
    code: session.code,
    link: `${PANEL_URL}/?session=${session.sessionId}`
  };
}

function getSession(sessionId) {
  return sessions.get(String(sessionId || "")) || null;
}

function verifySession(sessionId, code) {
  const session = getSession(sessionId);

  if (!session) {
    return {
      success: false,
      error: "SESSION_NOT_FOUND"
    };
  }

  if (
    String(code || "").trim().toUpperCase() !==
    session.code
  ) {
    return {
      success: false,
      error: "INVALID_SETTINGS_CODE"
    };
  }

  session.authenticated = true;

  return {
    success: true,
    session
  };
}

function isAuthenticated(sessionId) {
  const session = getSession(sessionId);

  return !!(session && session.authenticated);
}

function getSettings(sessionId) {
  const session = getSession(sessionId);

  if (!session) return null;

  return { ...session.settings };
}

function getBotInformation(sessionId) {
  const session = getSession(sessionId);

  if (!session) return null;

  return { ...session.botInformation };
}

function setSetting(sessionId, key, value) {
  const session = getSession(sessionId);

  if (!session) return false;

  if (!Object.prototype.hasOwnProperty.call(defaultSettings, key)) {
    return false;
  }

  session.settings[key] = Boolean(value);

  if (key === "publicMode" && value) {
    session.settings.privateMode = false;
  }

  if (key === "privateMode" && value) {
    session.settings.publicMode = false;
  }

  if (key === "groupClose" && value) {
    session.settings.groupOpen = false;
  }

  if (key === "groupOpen" && value) {
    session.settings.groupClose = false;
  }

  return true;
}

function applySettings(sessionId, newSettings = {}) {
  const session = getSession(sessionId);

  if (!session) return null;

  for (const key of Object.keys(defaultSettings)) {
    if (Object.prototype.hasOwnProperty.call(newSettings, key)) {
      session.settings[key] = Boolean(newSettings[key]);
    }
  }

  if (session.settings.publicMode) {
    session.settings.privateMode = false;
  }

  if (session.settings.privateMode) {
    session.settings.publicMode = false;
  }

  if (session.settings.groupClose) {
    session.settings.groupOpen = false;
  }

  if (session.settings.groupOpen) {
    session.settings.groupClose = false;
  }

  return { ...session.settings };
}

function updateBotInformation(sessionId, information = {}) {
  const session = getSession(sessionId);

  if (!session) return null;

  if (typeof information.name === "string") {
    session.botInformation.name =
      information.name.trim() || "TOPFEROS MD";
  }

  if (typeof information.prefix === "string") {
    session.botInformation.prefix =
      information.prefix.trim() || ".";
  }

  session.botInformation.number = session.number;

  session.botInformation.mode =
    session.settings.privateMode
      ? "Private"
      : "Public";

  return { ...session.botInformation };
}

function isEnabled(sessionId, key) {
  const session = getSession(sessionId);

  if (!session) return false;

  return Boolean(session.settings[key]);
}

function loadSettings(sessionId) {
  const session = getSession(sessionId);

  if (!session) return null;

  return {
    settings: { ...session.settings },
    botInformation: { ...session.botInformation }
  };
}

async function sendPanelLink(sock, jid, quoted) {
  if (!sock || !jid) return false;

  const session = createSession(sock);

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
      { quoted }
    );

    return true;
  } catch (error) {
    console.error("sendPanelLink error:", error);
    return false;
  }
}

module.exports = {
  PANEL_URL,
  sessions,
  defaultSettings,
  defaultBotInformation,

  generateCode,
  createNewSession,
  createSession,

  setBotConnected,
  setBotDisconnected,

  getSession,
  verifySession,
  isAuthenticated,

  getSettings,
  getBotInformation,

  setSetting,
  applySettings,
  updateBotInformation,

  isEnabled,
  loadSettings,
  sendPanelLink
};