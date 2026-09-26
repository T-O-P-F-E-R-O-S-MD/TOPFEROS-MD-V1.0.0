"use strict";

const crypto = require("crypto");
const sessionManager = require("./sessionManager");

const PANEL_URL =
  process.env.SETTINGS_PANEL_URL ||
  process.env.PANEL_URL ||
  "https://topferos-md-v1-0-0.onrender.com";


/* ======================================================
   DEFAULT SETTINGS
====================================================== */

const defaultSettings = {

  publicMode: true,
  privateMode: false,

  alwaysOnline: true,
  fakeTyping: false,
  fakeRecording: false,

  antiCall: false,

  antiDelete: false,
  antiDeleteSameChat: true,
  antiDeleteDM: false,

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


/* ======================================================
   DEFAULT BOT INFORMATION
====================================================== */

const defaultBotInformation = {

  name: "TOPFEROS MD",

  number: "",

  prefix: ".",

  mode: "Public"

};


/* ======================================================
   LOCAL PANEL SESSION CACHE
====================================================== */

const sessions = new Map();


/* ======================================================
   HELPERS
====================================================== */

function normalizeNumber(number) {

  return String(number || "")
    .replace(/\D/g, "");

}


function getPhoneFromSocket(sock) {

  try {

    const jid =
      sock?.user?.id || "";

    return normalizeNumber(
      jid
        .split(":")[0]
        .split("@")[0]
    );

  } catch {

    return "";

  }

}


function generateCode() {

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";

  for (let i = 0; i < 6; i++) {

    code += chars[
      crypto.randomInt(
        0,
        chars.length
      )
    ];

  }

  return code;

}


function getPanelLink(sessionId) {
  return `${PANEL_URL}/setting`;
}


/* ======================================================
   CHECK IF WHATSAPP SESSION IS CONNECTED
====================================================== */

function isBotConnected(session) {

  if (!session) {
    return false;
  }

  if (!session.socket) {
    return false;
  }

  return true;

}


/* ======================================================
   ENSURE PANEL SESSION
====================================================== */

function ensureSession(
  sessionId,
  number = "",
  sock = null
) {

  if (!sessionId) {
    return null;
  }


  let session =
    sessions.get(
      String(sessionId)
    );


  const waSession =
    sessionManager.getSession(
      String(sessionId)
    );


  if (!waSession) {
    return null;
  }


  const phoneNumber =
    normalizeNumber(number) ||
    normalizeNumber(
      waSession.number
    ) ||
    getPhoneFromSocket(sock);


  if (!session) {

    session = {

      sessionId:
        String(sessionId),

      number:
        phoneNumber,

      code:
        generateCode(),

      authenticated:
        false,

      connected:
        Boolean(sock),

      createdAt:
        Date.now(),

      updatedAt:
        Date.now(),

      settings: {
        ...defaultSettings
      },

      botInformation: {
        ...defaultBotInformation,
        number:
          phoneNumber
      },

      socket:
        sock || null

    };


    sessions.set(
      String(sessionId),
      session
    );


  } else {

    if (phoneNumber) {

      session.number =
        phoneNumber;

      session.botInformation.number =
        phoneNumber;

    }


    if (sock) {

      session.socket =
        sock;

      session.connected =
        true;

    }


    session.updatedAt =
      Date.now();

  }


  return session;

}


/* ======================================================
   CREATE NEW PANEL SESSION
====================================================== */

function createNewSession(
  sock = null,
  number = "",
  sessionId = null
) {

  let id =
    sessionId;


  if (!id && number) {

    const normalized =
      normalizeNumber(number);


    const waSession =
      sessionManager.getSessionByNumber(
        normalized
      );


    if (waSession) {

      id =
        waSession.sessionId;

    }

  }


  if (!id && sock) {

    const existing =
      sessionManager.getSessionBySocket?.(
        sock
      );


    if (existing) {

      id =
        existing.sessionId;

    }

  }


  if (!id) {
    return null;
  }


  return ensureSession(
    id,
    number,
    sock
  );

}


/* ======================================================
   CREATE / GET SESSION FROM SOCKET
====================================================== */

function createSession(
  sock,
  sessionId = null
) {

  let id =
    sessionId;


  if (id) {

    const session =
      ensureSession(
        id,
        "",
        sock
      );


    if (!session) {
      return null;
    }


    return formatSession(
      session
    );

  }


  if (sock) {

    const waSession =
      sessionManager.getSessionBySocket?.(
        sock
      );


    if (waSession) {

      const session =
        ensureSession(
          waSession.sessionId,
          waSession.number,
          sock
        );


      return session
        ? formatSession(session)
        : null;

    }


    const number =
      getPhoneFromSocket(sock);


    if (number) {

      const waSession =
        sessionManager.getSessionByNumber(
          number
        );


      if (waSession) {

        const session =
          ensureSession(
            waSession.sessionId,
            number,
            sock
          );


        return session
          ? formatSession(session)
          : null;

      }

    }

  }


  return null;

}


/* ======================================================
   FORMAT SESSION
====================================================== */

function formatSession(session) {

  return {

    sessionId:
      session.sessionId,

    number:
      session.number,

    code:
      session.code,

    link:
      getPanelLink(
        session.sessionId
      ),

    connected:
      isBotConnected(session)

  };

}


/* ======================================================
   GET SESSION
====================================================== */

function getSession(sessionId) {

  if (!sessionId) {
    return null;
  }


  const id =
    String(sessionId);


  let session =
    sessions.get(id);


  if (!session) {

    const waSession =
      sessionManager.getSession(id);


    if (!waSession) {
      return null;
    }


    session =
      ensureSession(
        id,
        waSession.number,
        waSession.socket || null
      );

  }


  return session || null;

}


/* ======================================================
   GET SESSION BY NUMBER
====================================================== */

function getSessionByNumber(number) {

  const normalized =
    normalizeNumber(number);


  if (!normalized) {
    return null;
  }


  const waSession =
    sessionManager.getSessionByNumber(
      normalized
    );


  if (waSession) {

    return ensureSession(
      waSession.sessionId,
      normalized,
      waSession.socket || null
    );

  }


  for (
    const session of
    sessions.values()
  ) {

    if (
      session.number ===
      normalized
    ) {

      return session;

    }

  }


  return null;

}


/* ======================================================
   GET SESSION BY SOCKET
====================================================== */

function getSessionBySocket(sock) {

  if (!sock) {
    return null;
  }


  const waSession =
    sessionManager.getSessionBySocket?.(
      sock
    );


  if (waSession) {

    return ensureSession(
      waSession.sessionId,
      waSession.number,
      sock
    );

  }


  for (
    const session of
    sessions.values()
  ) {

    if (
      session.socket ===
      sock
    ) {

      return session;

    }

  }


  return null;

}


/* ======================================================
   BOT CONNECTED
====================================================== */

function setBotConnected(
  sock,
  sessionId = null
) {

  if (!sock) {
    return null;
  }


  let id =
    sessionId;


  if (!id) {

    const waSession =
      sessionManager.getSessionBySocket?.(
        sock
      );


    if (waSession) {

      id =
        waSession.sessionId;

    }

  }


  if (!id) {

    const number =
      getPhoneFromSocket(sock);


    if (number) {

      const waSession =
        sessionManager.getSessionByNumber(
          number
        );


      if (waSession) {

        id =
          waSession.sessionId;

      }

    }

  }


  if (!id) {

    console.error(
      "❌ setBotConnected: WhatsApp session not found"
    );

    return null;

  }


  const session =
    ensureSession(
      id,
      getPhoneFromSocket(sock),
      sock
    );


  if (!session) {
    return null;
  }


  session.code =
    generateCode();


  session.socket =
    sock;


  session.connected =
    true;


  session.authenticated =
    false;


  session.updatedAt =
    Date.now();


  return session;

}


/* ======================================================
   BOT DISCONNECTED
====================================================== */

function setBotDisconnected(
  sock,
  remove = false,
  sessionId = null
) {

  let session = null;


  if (sessionId) {

    session =
      getSession(
        sessionId
      );

  }


  if (!session && sock) {

    session =
      getSessionBySocket(
        sock
      );

  }


  if (!session) {
    return false;
  }


  session.socket =
    null;


  session.connected =
    false;


  session.authenticated =
    false;


  session.code =
    generateCode();


  session.updatedAt =
    Date.now();


  if (remove) {

    sessions.delete(
      session.sessionId
    );

  }


  return true;

}


/* ======================================================
   VERIFY SETTINGS CODE
====================================================== */

function verifySession(
  sessionId,
  code
) {

  const session =
    getSession(
      sessionId
    );


  if (!session) {

    return {

      success:
        false,

      error:
        "SESSION_NOT_FOUND"

    };

  }


  if (
    !isBotConnected(session)
  ) {

    session.authenticated =
      false;


    return {

      success:
        false,

      error:
        "BOT_NOT_CONNECTED"

    };

  }


  const submitted =
    String(code || "")
      .trim()
      .toUpperCase();


  if (
    !submitted ||
    submitted !==
      session.code
  ) {

    return {

      success:
        false,

      error:
        "INVALID_SETTINGS_CODE"

    };

  }


  session.authenticated =
    true;


  session.updatedAt =
    Date.now();


  return {

    success:
      true,

    session

  };

}


/* ======================================================
   AUTHENTICATION
====================================================== */

function isAuthenticated(
  sessionId
) {

  const session =
    getSession(
      sessionId
    );


  if (!session) {
    return false;
  }


  if (
    !isBotConnected(session)
  ) {

    session.authenticated =
      false;


    return false;

  }


  return Boolean(
    session.authenticated
  );

}


/* ======================================================
   LOGOUT PANEL
====================================================== */

function logoutSession(
  sessionId
) {

  const session =
    getSession(
      sessionId
    );


  if (!session) {
    return false;
  }


  session.authenticated =
    false;


  session.updatedAt =
    Date.now();


  return true;

}


/* ======================================================
   GET SETTINGS
====================================================== */

function getSettings(
  sessionId
) {

  const session =
    getSession(
      sessionId
    );


  if (!session) {
    return null;
  }


  return {
    ...session.settings
  };

}


/* ======================================================
   GET BOT INFORMATION
====================================================== */

function getBotInformation(
  sessionId
) {

  const session =
    getSession(
      sessionId
    );


  if (!session) {
    return null;
  }


  return {
    ...session.botInformation
  };

}


/* ======================================================
   SET ONE SETTING
====================================================== */

function setSetting(
  sessionId,
  key,
  value
) {

  const session =
    getSession(
      sessionId
    );


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


  session.settings[key] =
    Boolean(value);


  /*
   * Public / Private mutually exclusive.
   */

  if (
    key === "publicMode" &&
    session.settings.publicMode
  ) {

    session.settings.privateMode =
      false;

  }


  if (
    key === "privateMode" &&
    session.settings.privateMode
  ) {

    session.settings.publicMode =
      false;

  }


  /*
   * Anti Delete destination
   * mutually exclusive.
   */

  if (
    key === "antiDeleteSameChat" &&
    session.settings.antiDeleteSameChat
  ) {

    session.settings.antiDeleteDM =
      false;

  }


  if (
    key === "antiDeleteDM" &&
    session.settings.antiDeleteDM
  ) {

    session.settings.antiDeleteSameChat =
      false;

  }


  /*
   * Group Open / Close mutually exclusive.
   */

  if (
    key === "groupClose" &&
    session.settings.groupClose
  ) {

    session.settings.groupOpen =
      false;

  }


  if (
    key === "groupOpen" &&
    session.settings.groupOpen
  ) {

    session.settings.groupClose =
      false;

  }


  updateMode(session);


  session.updatedAt =
    Date.now();


  return true;

}


/* ======================================================
   APPLY SETTINGS
====================================================== */

function applySettings(
  sessionId,
  newSettings = {}
) {

  const session =
    getSession(
      sessionId
    );


  if (!session) {
    return null;
  }


  for (
    const key of
    Object.keys(defaultSettings)
  ) {

    if (
      Object.prototype.hasOwnProperty.call(
        newSettings,
        key
      )
    ) {

      session.settings[key] =
        Boolean(
          newSettings[key]
        );

    }

  }


  /*
   * Public / Private.
   */

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


  /*
   * Anti Delete destination.
   *
   * Same Chat and DM Bot cannot
   * be active at the same time.
   */

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


  /*
   * Group Open / Close.
   */

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


  session.updatedAt =
    Date.now();


  return {
    ...session.settings
  };

}


/* ======================================================
   UPDATE BOT MODE
====================================================== */

function updateMode(session) {

  session.botInformation.mode =
    session.settings.privateMode
      ? "Private"
      : "Public";

}


/* ======================================================
   UPDATE BOT INFORMATION
====================================================== */

function updateBotInformation(
  sessionId,
  information = {}
) {

  const session =
    getSession(
      sessionId
    );


  if (!session) {
    return null;
  }


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
   * Number always comes from WhatsApp.
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


/* ======================================================
   IS FEATURE ENABLED
====================================================== */

function isEnabled(
  sessionId,
  key
) {

  const session =
    getSession(
      sessionId
    );


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


/* ======================================================
   LOAD SETTINGS
====================================================== */

function loadSettings(
  sessionId
) {

  const session =
    getSession(
      sessionId
    );


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


/* ======================================================
   SEND SETTINGS PANEL LINK
====================================================== */

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
    createSession(
      sock,
      sessionId
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


/* ======================================================
   REMOVE PANEL SESSION
====================================================== */

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


/* ======================================================
   CLEAR ALL PANEL SESSIONS
====================================================== */

function clearSessions() {

  sessions.clear();

}


/* ======================================================
   LIST PANEL SESSIONS
====================================================== */

function listSessions() {

  return Array.from(
    sessions.values()
  ).map(session => ({

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

  }));

}


/* ======================================================
   EXPORTS
====================================================== */

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