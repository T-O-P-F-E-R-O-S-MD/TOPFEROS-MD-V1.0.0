"use strict";

// ============================================================
// TOPFEROS MD
// CONNECTION MANAGER
// WhatsApp / Baileys
// ============================================================

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const path = require("path");
const fs = require("fs");

const sessionManager = require("./sessionManager");
const messageHandler = require("./messageHandler");
const settingsPanel = require("./settingPanel");

// ============================================================
// ACTIVE SOCKETS
// ============================================================

const active = new Map();
const reconnectTimers = new Map();

// ============================================================
// OPTIONAL COMMANDS
// ============================================================

let welcome = null;
let goodbye = null;

try {
  welcome = require("../commands/welcome");
} catch {
  welcome = null;
}

try {
  goodbye = require("../commands/goodbye");
} catch {
  goodbye = null;
}

// ============================================================
// HELPERS
// ============================================================

function cleanNumber(number) {
  return String(number || "").replace(/\D/g, "");
}

function safeSessionId(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100);
}

function clearReconnectTimer(sessionId) {
  const cleanId = safeSessionId(sessionId);

  const timer = reconnectTimers.get(cleanId);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(cleanId);
  }
}

// ============================================================
// CONNECTION STATE
// ============================================================

function getConnectionState(sessionId) {
  const cleanId = safeSessionId(sessionId);

  return sessionManager.getConnectionState(cleanId);
}

// ============================================================
// CONNECTED MESSAGE
// ============================================================

async function sendConnectedMessage(sock, sessionId) {
  try {
    if (!sock?.user?.id) {
      console.warn(
        `⚠️ CONNECTED MESSAGE: user.id manke [${sessionId}]`
      );
      return;
    }

    const user = sock.user;

    const username =
      user.name ||
      user.verifiedName ||
      "Unknown";

    const number =
      String(user.id || "")
        .split(":")[0]
        .split("@")[0]
        .replace(/\D/g, "") ||
      "Unknown";

    const connectedMessage = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃      🌟 TOPFEROS MD 🌟       ┃
┃          V1.0.0              ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭───────❖ 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 ❖───────╮
│                              │
│ 🎉 🦁𝕋𝕆ℙ𝔽𝔼ℝ𝕆𝕊 𝕄𝔻 𝕍1.0.0 𝕆ℕ𝕃𝕀ℕ𝔼 🎉
│                              │
│ ⚡ Prefix   : .
│ 🌐 Mode     : Public
│ 👤 Username : ${username}
│ 📱 Number   : ${number}
│                              │
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭──────❖ 𝐅𝐄𝐀𝐓𝐔𝐑𝐄𝐒 ❖──────╮
│                            │
│ 💞 Always Online
│ 🔌 Fake Typing
│ 🎤 Fake Recording
│ 🖇️ Auto Status Seen & Like
│ 😋 Auto Status Reply
│ 🌈 Auto React
│ 📞 Anti Call
│ 🤖 Mode Change
│ 📥 Media Download Command
│ 🎞️ Send Song For WhatsApp Channels
│ 🤖 Smart AI Command & Auto Chat
│ 🎀 & Many More Commands...
│                            │
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭──────❖ 𝐐𝐔𝐈𝐂𝐊 𝐌𝐄𝐍𝐔 ❖──────╮
│                              │
│ 📋 Type .menu
│    ➜ To view all commands
│
│ ⚙️ Type .setting
│    ➜ To get the settings portal link
│                              │
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
│      🦁 By TOPFEROS MD
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`;

    const logoPath = path.join(
      __dirname,
      "..",
      "assets",
      "logo.png"
    );

    if (fs.existsSync(logoPath)) {
      const logo = fs.readFileSync(logoPath);

      await sock.sendMessage(
        user.id,
        {
          image: logo,
          caption: connectedMessage
        }
      );
    } else {
      console.warn(
        `⚠️ Logo pa jwenn: ${logoPath}`
      );

      await sock.sendMessage(
        user.id,
        {
          text: connectedMessage
        }
      );
    }

    console.log(
      `✅ CONNECTED MESSAGE SENT [${sessionId}]`
    );

  } catch (error) {
    console.error(
      `❌ CONNECTED MESSAGE ERROR [${sessionId}]`,
      error?.stack ||
      error?.message ||
      error
    );
  }
}

// ============================================================
// CREATE SOCKET
// ============================================================

async function createSocket(sessionId) {
  const cleanId = safeSessionId(sessionId);

  if (!cleanId) {
    throw new Error("sessionId obligatwa.");
  }

  // ----------------------------------------------------------
  // PREVENT DUPLICATE SOCKET
  // ----------------------------------------------------------

  const existingSocket = active.get(cleanId);

  if (existingSocket) {
    return existingSocket;
  }

  // ----------------------------------------------------------
  // GET SESSION
  // ----------------------------------------------------------

  let session = sessionManager.getSession(cleanId);

  if (!session) {
    session = sessionManager.restoreSession(cleanId);
  }

  if (!session) {
    throw new Error(
      `Session introuvable: ${cleanId}`
    );
  }

  // ----------------------------------------------------------
  // AUTH DIRECTORY
  // ----------------------------------------------------------

  const authDir = session.authDir;

  if (!authDir) {
    throw new Error(
      `authDir manke pou session ${cleanId}`
    );
  }

  fs.mkdirSync(
    authDir,
    {
      recursive: true
    }
  );

  console.log(
    `📁 AUTH DIR [${cleanId}]: ${authDir}`
  );

  // ----------------------------------------------------------
  // AUTH STATE
  // ----------------------------------------------------------

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(authDir);

  // ----------------------------------------------------------
  // BAILEYS VERSION
  // ----------------------------------------------------------

  let version;

  try {
    const latest =
      await fetchLatestBaileysVersion();

    if (
      latest &&
      Array.isArray(latest.version)
    ) {
      version = latest.version;
    }

  } catch (error) {
    console.warn(
      `⚠️ Impossible jwenn latest Baileys version [${cleanId}]`
    );
  }

  // ----------------------------------------------------------
  // SOCKET OPTIONS
  // ----------------------------------------------------------

  const socketOptions = {
    ...(version ? { version } : {}),

    auth: {
      creds: state.creds,

      keys:
        makeCacheableSignalKeyStore(
          state.keys,
          pino({
            level: "silent"
          })
        )
    },

    browser:
      Browsers.ubuntu("Chrome"),

    logger:
      pino({
        level: "silent"
      }),

    printQRInTerminal: false,

    markOnlineOnConnect: false,

    generateHighQualityLinkPreview: false,

    syncFullHistory: false,

    shouldIgnoreJid: () => false
  };

  // ----------------------------------------------------------
  // CREATE SOCKET
  // ----------------------------------------------------------

  const sock =
    makeWASocket(socketOptions);

  // ----------------------------------------------------------
  // REGISTER SOCKET
  // ----------------------------------------------------------

  active.set(
    cleanId,
    sock
  );

  sessionManager.setSocket(
    cleanId,
    sock
  );

  sessionManager.updateSession(
    cleanId,
    {
      status: "connecting",
      connected: false
    }
  );

  // ----------------------------------------------------------
  // SAVE CREDENTIALS
  // ----------------------------------------------------------

  sock.ev.on(
    "creds.update",
    async () => {
      try {
        await saveCreds();
      } catch (error) {
        console.error(
          `❌ CREDS SAVE ERROR [${cleanId}]`,
          error?.message ||
          error
        );
      }
    }
  );

  // ==========================================================
  // CONNECTION UPDATE
  // ==========================================================

  sock.ev.on(
    "connection.update",
    async ({
      connection,
      lastDisconnect,
      qr
    }) => {

      try {

        // ----------------------------------------------------
        // CONNECTING
        // ----------------------------------------------------

        if (connection === "connecting") {

          sessionManager.updateSession(
            cleanId,
            {
              status: "connecting",
              connected: false
            }
          );

          console.log(
            `🔄 WhatsApp CONNECTING [${cleanId}]`
          );
        }

        // ----------------------------------------------------
        // QR
        // ----------------------------------------------------

        if (qr) {
          console.log(
            `ℹ️ QR received [${cleanId}]`
          );
        }

        // ----------------------------------------------------
        // OPEN
        // ----------------------------------------------------

        if (connection === "open") {

          clearReconnectTimer(cleanId);

          sessionManager.updateSession(
            cleanId,
            {
              status: "connected",
              connected: true,
              pairing: false,
              pairingCode: null
            }
          );

          sessionManager.endPairing(
            cleanId
          );

          // --------------------------------------------------
          // SETTINGS PANEL
          // --------------------------------------------------

          try {

            if (
              settingsPanel &&
              typeof settingsPanel.setBotConnected ===
                "function"
            ) {

              settingsPanel.setBotConnected(
                sock,
                cleanId
              );

              console.log(
                `⚙️ SETTING PANEL ACTIVATED [${cleanId}]`
              );
            }

          } catch (error) {

            console.error(
              `❌ SETTING PANEL CONNECT ERROR [${cleanId}]`,
              error?.stack ||
              error?.message ||
              error
            );
          }

          console.log(
            `✅ WhatsApp CONNECTED: ${cleanId}`
          );

          // --------------------------------------------------
          // CONNECTED MESSAGE
          // --------------------------------------------------

          await sendConnectedMessage(
            sock,
            cleanId
          );
        }

        // ----------------------------------------------------
        // CLOSE
        // ----------------------------------------------------

        if (connection === "close") {

          active.delete(cleanId);

          sessionManager.setSocket(
            cleanId,
            null
          );

          // --------------------------------------------------
          // INVALIDATE PANEL
          // --------------------------------------------------

          try {

            if (
              settingsPanel &&
              typeof settingsPanel.setBotDisconnected ===
                "function"
            ) {

              settingsPanel.setBotDisconnected(
                sock,
                false,
                cleanId
              );

              console.log(
                `⚙️ SETTING PANEL INVALIDATED [${cleanId}]`
              );
            }

          } catch (error) {

            console.error(
              `❌ SETTING PANEL DISCONNECT ERROR [${cleanId}]`,
              error?.stack ||
              error?.message ||
              error
            );
          }

          const statusCode =
            lastDisconnect?.error?.output?.statusCode ??
            lastDisconnect?.error?.statusCode ??
            null;

          const errorMessage =
            lastDisconnect?.error?.message ||
            "Unknown connection error";

          console.error(
            `❌ WhatsApp CONNECTION CLOSED [${cleanId}]`,
            {
              statusCode,
              error: errorMessage
            }
          );

          // --------------------------------------------------
          // LOGGED OUT
          // --------------------------------------------------

          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {

            clearReconnectTimer(cleanId);

            sessionManager.updateSession(
              cleanId,
              {
                status: "logged_out",
                connected: false,
                pairing: false,
                pairingCode: null
              }
            );

            console.log(
              `🚪 WhatsApp LOGGED OUT [${cleanId}]`
            );

            return;
          }

          // --------------------------------------------------
          // BAD SESSION
          // --------------------------------------------------

          if (
            statusCode ===
            DisconnectReason.badSession
          ) {

            clearReconnectTimer(cleanId);

            sessionManager.updateSession(
              cleanId,
              {
                status: "error",
                connected: false,
                pairing: false,
                pairingCode: null
              }
            );

            console.error(
              `❌ BAD SESSION [${cleanId}]`
            );

            return;
          }

          // --------------------------------------------------
          // RECONNECT
          // --------------------------------------------------

          sessionManager.updateSession(
            cleanId,
            {
              status: "reconnecting",
              connected: false,
              pairing: false,
              pairingCode: null
            }
          );

          if (
            reconnectTimers.has(cleanId)
          ) {
            return;
          }

          const timer =
            setTimeout(
              async () => {

                reconnectTimers.delete(
                  cleanId
                );

                try {

                  console.log(
                    `🔁 Reconnecting [${cleanId}]...`
                  );

                  await createSocket(
                    cleanId
                  );

                } catch (error) {

                  console.error(
                    `❌ RECONNECT ERROR [${cleanId}]`,
                    error?.stack ||
                    error?.message ||
                    error
                  );

                  scheduleReconnect(
                    cleanId
                  );
                }

              },
              5000
            );

          reconnectTimers.set(
            cleanId,
            timer
          );
        }

      } catch (error) {

        console.error(
          `❌ CONNECTION UPDATE ERROR [${cleanId}]`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );

  // ==========================================================
  // MESSAGES
  // ==========================================================

  sock.ev.on(
    "messages.upsert",
    async upsert => {

      console.log(
        `📩 MESSAGES.UPSERT RECEIVED [${cleanId}]:`,
        upsert?.type,
        upsert?.messages?.length || 0
      );

      try {

        if (
          upsert?.type !== "notify"
        ) {
          return;
        }

        for (
          const msg of
          upsert.messages || []
        ) {

          if (!msg?.message) {
            continue;
          }

          if (msg?.key?.fromMe) {
            continue;
          }

          if (
            messageHandler &&
            typeof messageHandler.handleMessage ===
              "function"
          ) {

            await messageHandler.handleMessage(
              sock,
              msg,
              cleanId
            );

          } else {

            console.error(
              `❌ handleMessage pa jwenn nan messageHandler.js [${cleanId}]`
            );
          }
        }

      } catch (error) {

        console.error(
          `❌ MESSAGE HANDLER ERROR [${cleanId}]`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );

  // ==========================================================
  // GROUP PARTICIPANTS
  // ==========================================================

  sock.ev.on(
    "group-participants.update",
    async update => {

      try {

        if (
          update?.action === "add" &&
          welcome?.sendWelcome
        ) {

          await welcome.sendWelcome(
            sock,
            update
          );
        }

        if (
          update?.action === "remove" &&
          goodbye?.sendGoodbye
        ) {

          await goodbye.sendGoodbye(
            sock,
            update
          );
        }

      } catch (error) {

        console.error(
          `❌ GROUP EVENT ERROR [${cleanId}]`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );

  return sock;
}

// ============================================================
// RECONNECT HELPER
// ============================================================

function scheduleReconnect(sessionId) {
  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    return;
  }

  if (
    reconnectTimers.has(cleanId)
  ) {
    return;
  }

  const timer =
    setTimeout(
      async () => {

        reconnectTimers.delete(
          cleanId
        );

        try {

          console.log(
            `🔁 Retry reconnect [${cleanId}]...`
          );

          await createSocket(
            cleanId
          );

        } catch (error) {

          console.error(
            `❌ RETRY RECONNECT ERROR [${cleanId}]`,
            error?.stack ||
            error?.message ||
            error
          );

          scheduleReconnect(
            cleanId
          );
        }

      },
      5000
    );

  reconnectTimers.set(
    cleanId,
    timer
  );
}

// ============================================================
// START SESSION
// ============================================================

async function startSession(sessionId) {
  return createSocket(sessionId);
}

// ============================================================
// REQUEST PAIRING CODE
// ============================================================

async function requestPairingCode(
  sessionIdOrNumber,
  maybeNumber
) {

  let requestedSessionId = null;
  let number = "";

  // ----------------------------------------------------------
  // requestPairingCode(number)
  // ----------------------------------------------------------

  if (
    maybeNumber === undefined
  ) {

    number =
      cleanNumber(
        sessionIdOrNumber
      );

  } else {

    // --------------------------------------------------------
    // requestPairingCode(sessionId, number)
    // --------------------------------------------------------

    requestedSessionId =
      safeSessionId(
        sessionIdOrNumber
      );

    number =
      cleanNumber(
        maybeNumber
      );
  }

  if (!number) {
    throw new Error(
      "Numéro invalide"
    );
  }

  // ----------------------------------------------------------
  // FIND SESSION BY NUMBER
  // ----------------------------------------------------------

  let session =
    sessionManager.getSessionByNumber(
      number
    );

  // ----------------------------------------------------------
  // TRY PROVIDED SESSION ID
  // ----------------------------------------------------------

  if (
    !session &&
    requestedSessionId
  ) {

    session =
      sessionManager.getSession(
        requestedSessionId
      );
  }

  // ----------------------------------------------------------
  // PAIRING ALREADY RUNNING
  // ----------------------------------------------------------

  if (session?.pairing) {

    const error =
      new Error(
        "PAIRING_IN_PROGRESS"
      );

    error.code =
      "PAIRING_IN_PROGRESS";

    throw error;
  }

  // ----------------------------------------------------------
  // CREATE SESSION
  // ----------------------------------------------------------

  if (!session) {

    session =
      sessionManager.createSession({
        sessionId:
          requestedSessionId ||
          number,

        number
      });

  } else {

    sessionManager.setNumber(
      session.sessionId,
      number
    );

    session =
      sessionManager.getSession(
        session.sessionId
      );
  }

  if (!session) {
    throw new Error(
      "Session pa kapab kreye."
    );
  }

  const sessionId =
    session.sessionId;

  // ----------------------------------------------------------
  // ALREADY CONNECTED
  // ----------------------------------------------------------

  if (
    session.connected === true
  ) {

    const error =
      new Error(
        "SESSION_ALREADY_CONNECTED"
      );

    error.code =
      "SESSION_ALREADY_CONNECTED";

    throw error;
  }

  // ----------------------------------------------------------
  // START PAIRING
  // ----------------------------------------------------------

  sessionManager.startPairing(
    sessionId
  );

  // ----------------------------------------------------------
  // CREATE SOCKET
  // ----------------------------------------------------------

  let sock;

  try {

    sock =
      await createSocket(
        sessionId
      );

  } catch (error) {

    sessionManager.updateSession(
      sessionId,
      {
        status: "pairing_error",
        pairing: false,
        pairingCode: null
      }
    );

    throw error;
  }

  // ----------------------------------------------------------
  // LOAD AUTH STATE
  // ----------------------------------------------------------

  const authDir =
    session.authDir;

  const {
    state
  } =
    await useMultiFileAuthState(
      authDir
    );

  // ----------------------------------------------------------
  // ALREADY REGISTERED
  // ----------------------------------------------------------

  if (
    state?.creds?.registered
  ) {

    sessionManager.endPairing(
      sessionId
    );

    sessionManager.updateSession(
      sessionId,
      {
        status: "error",
        pairing: false,
        pairingCode: null
      }
    );

    const error =
      new Error(
        "SESSION_ALREADY_REGISTERED"
      );

    error.code =
      "SESSION_ALREADY_REGISTERED";

    throw error;
  }

  // ----------------------------------------------------------
  // REQUEST CODE
  // ----------------------------------------------------------

  try {

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          1000
        )
    );

    const code =
      await sock.requestPairingCode(
        number
      );

    if (!code) {
      throw new Error(
        "WhatsApp pa retounen pairing code."
      );
    }

    const normalizedCode =
      String(code)
        .trim()
        .replace(/\s+/g, "");

    sessionManager.setPairingCode(
      sessionId,
      normalizedCode
    );

    sessionManager.updateSession(
      sessionId,
      {
        status: "pairing",
        pairing: true,
        connected: false,
        pairingCode:
          normalizedCode
      }
    );

    console.log(
      `🔐 PAIRING CODE [${sessionId}]: ${normalizedCode}`
    );

    return {
      sessionId,
      number,
      code: normalizedCode,
      socket: sock
    };

  } catch (error) {

    sessionManager.updateSession(
      sessionId,
      {
        status: "pairing_error",
        pairing: false,
        pairingCode: null
      }
    );

    console.error(
      `❌ PAIRING CODE ERROR [${sessionId}]`,
      error?.stack ||
      error?.message ||
      error
    );

    throw error;
  }
}

// ============================================================
// STOP SESSION
// ============================================================

async function stopSession(sessionId) {

  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    return false;
  }

  clearReconnectTimer(
    cleanId
  );

  const sock =
    active.get(cleanId) ||
    sessionManager.getSocket(cleanId);

  active.delete(cleanId);

  if (sock) {

    try {
      sock.end(
        new Error(
          "Session stopped"
        )
      );
    } catch {}
  }

  sessionManager.setSocket(
    cleanId,
    null
  );

  // ----------------------------------------------------------
  // INVALIDATE PANEL
  // ----------------------------------------------------------

  try {

    if (
      settingsPanel &&
      typeof settingsPanel.setBotDisconnected ===
        "function"
    ) {

      settingsPanel.setBotDisconnected(
        sock,
        false,
        cleanId
      );
    }

  } catch (error) {

    console.error(
      `❌ SETTING PANEL STOP ERROR [${cleanId}]`,
      error?.message ||
      error
    );
  }

  sessionManager.updateSession(
    cleanId,
    {
      status: "stopped",
      connected: false,
      pairing: false,
      pairingCode: null
    }
  );

  console.log(
    `🛑 SESSION STOPPED [${cleanId}]`
  );

  return true;
}

// ============================================================
// REMOVE SESSION
// ============================================================

async function removeSession(sessionId) {

  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    return false;
  }

  clearReconnectTimer(
    cleanId
  );

  await stopSession(
    cleanId
  );

  return sessionManager.removeSession(
    cleanId
  );
}

// ============================================================
// RESTORE STORED SESSIONS
// ============================================================

async function restoreStoredSessions() {

  const ids =
    sessionManager.getStoredSessionIds();

  const restored = [];

  for (
    const id of ids
  ) {

    try {

      let session =
        sessionManager.getSession(id);

      if (!session) {
        session =
          sessionManager.restoreSession(id);
      }

      if (!session) {
        continue;
      }

      if (
        session.status ===
        "logged_out"
      ) {
        continue;
      }

      await createSocket(id);

      restored.push(id);

    } catch (error) {

      console.error(
        `❌ RESTORE ERROR [${id}]`,
        error?.stack ||
        error?.message ||
        error
      );
    }
  }

  return restored;
}

// ============================================================
// ATTACH MESSAGE LISTENER
// ============================================================

async function attachMessageListener(
  sock,
  sessionId
) {
  if (!sock) {
    return null;
  }

  return sock;
}

// ============================================================
// ATTACH CONNECTION LISTENER
// ============================================================

async function attachConnectionListener(
  sock,
  sessionId
) {
  if (!sock) {
    return null;
  }

  return sock;
}

// ============================================================
// START
// ============================================================

async function start() {

  try {

    const restored =
      await restoreStoredSessions();

    console.log(
      `🚀 TOPFEROS MD: ${restored.length} session(s) restored.`
    );

    return restored;

  } catch (error) {

    console.error(
      "❌ TOPFEROS START ERROR",
      error?.stack ||
      error?.message ||
      error
    );

    return [];
  }
}

// ============================================================
// STOP
// ============================================================

async function stop() {

  const ids = [
    ...active.keys()
  ];

  for (
    const id of ids
  ) {

    await stopSession(id);
  }

  for (
    const timer of
    reconnectTimers.values()
  ) {

    clearTimeout(timer);
  }

  reconnectTimers.clear();

  return true;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {

  createSocket,

  startSession,

  requestPairingCode,

  stopSession,

  removeSession,

  restoreStoredSessions,

  attachMessageListener,

  attachConnectionListener,

  getConnectionState,

  start,

  stop
};