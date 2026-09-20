"use strict";

// ============================================================
// TOPFEROS MD
// CONNECTION MANAGER
// WhatsApp / Baileys 6.7.21
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
const settingPanel = require("./settingPanel");

// ============================================================
// ACTIVE SOCKETS
// ============================================================

const active = new Map();

// ============================================================
// RECONNECT CONTROL
// ============================================================

const reconnectTimers = new Map();
const reconnectAttempts = new Map();

const MIN_RECONNECT_DELAY = 5000;
const MAX_RECONNECT_DELAY = 60000;

// ============================================================
// OPTIONAL COMMANDS
// ============================================================

let welcome = null;
let goodbye = null;

try {
  welcome = require("../commands/welcome");
} catch {
  console.warn("⚠️ welcome.js pa disponib.");
}

try {
  goodbye = require("../commands/goodbye");
} catch {
  console.warn("⚠️ goodbye.js pa disponib.");
}

// ============================================================
// CLEAN NUMBER
// ============================================================

function cleanNumber(number) {
  return String(number || "").replace(/\D/g, "");
}

// ============================================================
// SAFE SESSION ID
// ============================================================

function safeSessionId(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100);
}

// ============================================================
// GET DISCONNECT CODE
// ============================================================

function getDisconnectCode(lastDisconnect) {
  return (
    lastDisconnect?.error?.output?.statusCode ??
    lastDisconnect?.error?.statusCode ??
    null
  );
}

// ============================================================
// RECONNECT DELAY
// ============================================================

function getReconnectDelay(sessionId) {
  const attempt = reconnectAttempts.get(sessionId) || 0;

  return Math.min(
    MIN_RECONNECT_DELAY * Math.pow(2, Math.min(attempt, 4)),
    MAX_RECONNECT_DELAY
  );
}

// ============================================================
// CLEAR RECONNECT TIMER
// ============================================================

function clearReconnectTimer(sessionId) {
  const timer = reconnectTimers.get(sessionId);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(sessionId);
  }
}

// ============================================================
// RESET RECONNECT ATTEMPTS
// ============================================================

function resetReconnectAttempts(sessionId) {
  reconnectAttempts.delete(sessionId);
}

// ============================================================
// SCHEDULE RECONNECT
// ============================================================

function scheduleReconnect(sessionId) {
  const cleanId = safeSessionId(sessionId);

  if (!cleanId) {
    return;
  }

  if (reconnectTimers.has(cleanId)) {
    return;
  }

  if (active.has(cleanId)) {
    return;
  }

  const attempt =
    (reconnectAttempts.get(cleanId) || 0) + 1;

  reconnectAttempts.set(cleanId, attempt);

  const delay = getReconnectDelay(cleanId);

  console.log(
    `🔁 RECONNECT SCHEDULED [${cleanId}] ` +
      `attempt=${attempt} delay=${delay}ms`
  );

  const timer = setTimeout(async () => {
    reconnectTimers.delete(cleanId);

    try {
      const session =
        sessionManager.getSession(cleanId);

      if (!session) {
        console.error(
          `❌ RECONNECT CANCELLED: session not found [${cleanId}]`
        );
        return;
      }

      if (
        session.status === "logged_out" ||
        session.status === "stopped"
      ) {
        console.log(
          `⏭️ RECONNECT SKIPPED [${cleanId}] status=${session.status}`
        );
        return;
      }

      if (active.has(cleanId)) {
        return;
      }

      console.log(
        `🔄 RECONNECTING WHATSAPP [${cleanId}]...`
      );

      await createSocket(cleanId);
    } catch (error) {
      console.error(
        `❌ RECONNECT ERROR [${cleanId}]`,
        error?.stack ||
          error?.message ||
          error
      );

      scheduleReconnect(cleanId);
    }
  }, delay);

  reconnectTimers.set(cleanId, timer);
}

// ============================================================
// CONNECTED MESSAGE
// ============================================================

async function sendConnectedMessage(sock, sessionId) {
  try {
    if (!sock?.user?.id) {
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
│ 💞 Allways Online
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

  const existing = active.get(cleanId);

  if (existing) {
    return existing;
  }

  // ----------------------------------------------------------
  // GET SESSION
  // ----------------------------------------------------------

  const session =
    sessionManager.getSession(cleanId);

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

  // ----------------------------------------------------------
  // AUTH STATE
  // ----------------------------------------------------------

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(
    authDir
  );

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
  } catch {
    version = undefined;
  }

  // ----------------------------------------------------------
  // SOCKET OPTIONS
  // ----------------------------------------------------------

  const socketOptions = {
    ...(version ? { version } : {}),

    auth: {
      creds: state.creds,

      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino({
          level: "silent"
        })
      )
    },

    browser: Browsers.ubuntu("Chrome"),

    logger: pino({
      level: "silent"
    }),

    printQRInTerminal: false,

    markOnlineOnConnect: false,

    generateHighQualityLinkPreview: false,

    syncFullHistory: false,

    shouldIgnoreJid: jid => false
  };

  const sock =
    makeWASocket(socketOptions);

  // ----------------------------------------------------------
  // REGISTER SOCKET
  // ----------------------------------------------------------

  active.set(cleanId, sock);

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

  // ==========================================================
  // CREDENTIALS
  // ==========================================================

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
    async update => {
      const {
        connection,
        lastDisconnect,
        qr
      } = update || {};

      try {
        // ----------------------------------------------------
        // CONNECTING
        // ----------------------------------------------------

        if (
          connection === "connecting"
        ) {
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

        if (
          connection === "open"
        ) {
          clearReconnectTimer(
            cleanId
          );

          resetReconnectAttempts(
            cleanId
          );

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
          // ACTIVATE PANEL SESSION
          // --------------------------------------------------

          try {
            settingPanel.setBotConnected(
              sock,
              cleanId
            );
          } catch (error) {
            console.error(
              `❌ PANEL CONNECT ERROR [${cleanId}]`,
              error?.message ||
                error
            );
          }

          console.log(
            `✅ WhatsApp CONNECTED [${cleanId}]`
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

        if (
          connection === "close"
        ) {
          // Remove old socket first
          if (
            active.get(cleanId) ===
            sock
          ) {
            active.delete(cleanId);
          }

          sessionManager.setSocket(
            cleanId,
            null
          );

          // --------------------------------------------------
          // INVALIDATE PANEL IMMEDIATELY
          // --------------------------------------------------

          try {
            settingPanel.setBotDisconnected(
              sock,
              false,
              cleanId
            );
          } catch (error) {
            console.error(
              `❌ PANEL DISCONNECT ERROR [${cleanId}]`,
              error?.message ||
                error
            );
          }

          const statusCode =
            getDisconnectCode(
              lastDisconnect
            );

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
            clearReconnectTimer(
              cleanId
            );

            resetReconnectAttempts(
              cleanId
            );

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
            clearReconnectTimer(
              cleanId
            );

            resetReconnectAttempts(
              cleanId
            );

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
          // STOPPED MANUALLY
          // --------------------------------------------------

          const currentSession =
            sessionManager.getSession(
              cleanId
            );

          if (
            currentSession?.status ===
            "stopped"
          ) {
            console.log(
              `🛑 SESSION WAS STOPPED MANUALLY [${cleanId}]`
            );

            return;
          }

          // --------------------------------------------------
          // MARK RECONNECTING
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

          // --------------------------------------------------
          // AUTO RECONNECT
          // --------------------------------------------------

          scheduleReconnect(
            cleanId
          );
        }
      } catch (error) {
        console.error(
          `❌ CONNECTION UPDATE ERROR [${cleanId}]`,
          error?.stack ||
            error?.message ||
            error
        );

        if (
          connection === "close"
        ) {
          scheduleReconnect(
            cleanId
          );
        }
      }
    }
  );

  // ==========================================================
  // MESSAGES
  // ==========================================================

  sock.ev.on(
    "messages.upsert",
    async upsert => {
      try {
        console.log(
          `📩 MESSAGES.UPSERT RECEIVED [${cleanId}]:`,
          upsert?.type,
          upsert?.messages?.length || 0
        );

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

          if (
            msg?.key?.fromMe
          ) {
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
          typeof welcome?.sendWelcome ===
            "function"
        ) {
          await welcome.sendWelcome(
            sock,
            update
          );
        }

        if (
          update?.action === "remove" &&
          typeof goodbye?.sendGoodbye ===
            "function"
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
  let requestedSessionId;
  let clean;

  if (
       maybeNumber !== undefined &&
    maybeNumber !== null &&
    String(maybeNumber).trim() !== ""
  ) {
    requestedSessionId =
      safeSessionId(
        sessionIdOrNumber
      );

    clean = cleanNumber(
      maybeNumber
    );
  } else {
    clean = cleanNumber(
      sessionIdOrNumber
    );

    requestedSessionId =
      safeSessionId(clean);
  }

  if (!clean) {
    throw new Error(
      "Numéro invalide"
    );
  }

  if (!requestedSessionId) {
    throw new Error(
      "sessionId invalide"
    );
  }

  console.log(
    `📲 PAIRING REQUEST [${requestedSessionId}]`
  );

  let session =
    sessionManager.getSession(
      requestedSessionId
    );

  if (!session) {
    try {
      session =
        sessionManager.getSessionByNumber(
          clean
        );
    } catch {
      session = null;
    }
  }

  if (!session) {
    session =
      sessionManager.createSession({
        sessionId:
          requestedSessionId,
        number: clean
      });
  } else {
    try {
      sessionManager.setNumber(
        session.sessionId,
        clean
      );
    } catch {
      try {
        sessionManager.updateSession(
          session.sessionId,
          {
            number: clean
          }
        );
      } catch {}
    }

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

  if (session.pairing) {
    const err =
      new Error(
        "PAIRING_IN_PROGRESS"
      );

    err.code =
      "PAIRING_IN_PROGRESS";

    throw err;
  }

  if (session.connected === true) {
    const err =
      new Error(
        "SESSION_ALREADY_CONNECTED"
      );

    err.code =
      "SESSION_ALREADY_CONNECTED";

    throw err;
  }

  let sock =
    active.get(
      safeSessionId(sessionId)
    );

  sessionManager.startPairing(
    sessionId
  );

  try {
    if (!sock) {
      sock =
        await createSocket(
          sessionId
        );
    }
  } catch (error) {
    try {
      sessionManager.updateSession(
        sessionId,
        {
          status: "pairing_error",
          pairing: false,
          pairingCode: null
        }
      );
    } catch {}

    throw error;
  }

  const authDir =
    session.authDir;

  const {
    state
  } =
    await useMultiFileAuthState(
      authDir
    );

  if (
    state?.creds?.registered
  ) {
    sessionManager.endPairing(
      sessionId
    );

    const err =
      new Error(
        "SESSION_ALREADY_REGISTERED"
      );

    err.code =
      "SESSION_ALREADY_REGISTERED";

    throw err;
  }

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
        clean
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
          normalizedCode,
        number: clean
      }
    );

    console.log(
      `🔐 PAIRING CODE [${sessionId}]: ${normalizedCode}`
    );

    return {
      sessionId,
      number: clean,
      code: normalizedCode,
      socket: sock
    };
  } catch (error) {
    try {
      sessionManager.updateSession(
        sessionId,
        {
          status: "pairing_error",
          pairing: false,
          pairingCode: null
        }
      );
    } catch {}

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

  resetReconnectAttempts(
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

  try {
    settingPanel.setBotDisconnected(
      sock,
      false,
      cleanId
    );
  } catch {}

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

async function removeSession(
  sessionId
) {
  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    return false;
  }

  clearReconnectTimer(
    cleanId
  );

  resetReconnectAttempts(
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
      const session =
        sessionManager.getSession(id);

      if (!session) {
        continue;
      }

      if (
        session.status ===
        "logged_out"
      ) {
        console.log(
          `⏭️ SKIPPING LOGGED OUT SESSION [${id}]`
        );

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
// ATTACH LISTENERS
// ============================================================

async function attachMessageListener(
  sock,
  sessionId
) {
  return sock || null;
}

async function attachConnectionListener(
  sock,
  sessionId
) {
  return sock || null;
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

  reconnectTimers.forEach(
    timer =>
      clearTimeout(timer)
  );

  reconnectTimers.clear();
  reconnectAttempts.clear();

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
  start,
  stop
};