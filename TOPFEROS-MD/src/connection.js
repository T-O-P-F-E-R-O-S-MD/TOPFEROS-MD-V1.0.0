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

const sessionManager =
  require("./sessionManager");

const messageHandler =
  require("./messageHandler");

// ============================================================
// ACTIVE SOCKETS
// ============================================================

const active = new Map();

// Prevent duplicate reconnect timers
const reconnectTimers = new Map();

// ============================================================
// OPTIONAL COMMANDS
// ============================================================

let welcome = null;
let goodbye = null;

try {
  welcome = require("../commands/welcome");
} catch (error) {
  console.warn(
    "⚠️ welcome.js pa disponib."
  );
}

try {
  goodbye = require("../commands/goodbye");
} catch (error) {
  console.warn(
    "⚠️ goodbye.js pa disponib."
  );
}

// ============================================================
// CLEAN NUMBER
// ============================================================

function cleanNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
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
// CONNECTED SUCCESS MESSAGE
// ============================================================

async function sendConnectedMessage(
  sock,
  sessionId
) {
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
      const logo =
        fs.readFileSync(logoPath);

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
// CLEAR RECONNECT TIMER
// ============================================================

function clearReconnectTimer(
  sessionId
) {
  const timer =
    reconnectTimers.get(sessionId);

  if (timer) {
    clearTimeout(timer);

    reconnectTimers.delete(
      sessionId
    );
  }
}

// ============================================================
// CREATE SOCKET
// ============================================================

async function createSocket(
  sessionId
) {
  const cleanId =
    safeSessionId(sessionId);

  if (!cleanId) {
    throw new Error(
      "sessionId obligatwa."
    );
  }

  // ----------------------------------------------------------
  // PREVENT DUPLICATE SOCKET
  // ----------------------------------------------------------

  const existingSocket =
    active.get(cleanId);

  if (existingSocket) {
    return existingSocket;
  }

  // ----------------------------------------------------------
  // LOAD SESSION
  // ----------------------------------------------------------

  const session =
    sessionManager.getSession(cleanId);

  if (!session) {
    throw new Error(
      `Session introuvable: ${cleanId}`
    );
  }

  // ----------------------------------------------------------
  // USE SESSION MANAGER AUTH DIRECTORY
  // ----------------------------------------------------------

  const authDir =
    session.authDir;

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
  } =
    await useMultiFileAuthState(
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
      version =
        latest.version;
    }

  } catch (error) {
    console.warn(
      `⚠️ Impossible jwenn latest Baileys version [${cleanId}]`
    );

    version =
      undefined;
  }

  // ----------------------------------------------------------
  // CREATE SOCKET
  // ----------------------------------------------------------

  const socketOptions = {
    ...(version
      ? {
          version
        }
      : {}),

    auth: {
      creds:
        state.creds,

      keys:
        makeCacheableSignalKeyStore(
          state.keys,
          pino({
            level: "silent"
          })
        )
    },

    browser:
      Browsers.ubuntu(
        "Chrome"
      ),

    logger:
      pino({
        level: "silent"
      }),

    printQRInTerminal:
      false,

    markOnlineOnConnect:
      false,

    generateHighQualityLinkPreview:
      false,

    syncFullHistory:
      false,

    shouldIgnoreJid:
      jid => false
  };

  const sock =
    makeWASocket(
      socketOptions
    );

  // ----------------------------------------------------------
  // REGISTER ACTIVE SOCKET
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
      status:
        "connecting"
    }
  );

  // ----------------------------------------------------------
  // CREDENTIALS
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

        if (
          connection ===
          "connecting"
        ) {

          sessionManager.updateSession(
            cleanId,
            {
              status:
                "connecting"
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
            `ℹ️ QR received [${cleanId}] - Pairing Code mode active`
          );
        }

        // ----------------------------------------------------
        // OPEN
        // ----------------------------------------------------

        if (
          connection ===
          "open"
        ) {

          clearReconnectTimer(
            cleanId
          );

          sessionManager.updateSession(
            cleanId,
            {
              status:
                "connected",

              connected:
                true,

              pairing:
                false,

              pairingCode:
                null
            }
          );

          sessionManager.endPairing(
            cleanId
          );

          console.log(
            `✅ WhatsApp CONNECTED: ${cleanId}`
          );

          // --------------------------------------------------
          // SEND CONNECTED MESSAGE
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
          connection ===
          "close"
        ) {

          active.delete(
            cleanId
          );

          sessionManager.setSocket(
            cleanId,
            null
          );

          const statusCode =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode ??
            lastDisconnect
              ?.error
              ?.statusCode;

          const errorMessage =
            lastDisconnect
              ?.error
              ?.message ||
            "Unknown connection error";

          console.error(
            `❌ WhatsApp CONNECTION CLOSED [${cleanId}]`,
            {
              statusCode,
              error:
                errorMessage
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

            sessionManager.updateSession(
              cleanId,
              {
                status:
                  "logged_out",

                connected:
                  false,

                pairing:
                  false,

                pairingCode:
                  null
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

            sessionManager.updateSession(
              cleanId,
              {
                status:
                  "error",

                connected:
                  false,

                pairing:
                  false,

                pairingCode:
                  null
              }
            );

            console.error(
              `❌ BAD SESSION [${cleanId}]`
            );

            return;
          }

          // --------------------------------------------------
          // OTHER DISCONNECT
          // --------------------------------------------------

          sessionManager.updateSession(
            cleanId,
            {
              status:
                "reconnecting",

              connected:
                false
            }
          );

          if (
            reconnectTimers.has(
              cleanId
            )
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
          upsert?.type !==
          "notify"
        ) {
          return;
        }

        for (
          const msg of
          upsert.messages || []
        ) {

          if (
            !msg?.message
          ) {
            continue;
          }

          // --------------------------------------------------
          // IGNORE BOT'S OWN MESSAGES
          // --------------------------------------------------

          if (
            msg?.key?.fromMe
          ) {
            continue;
          }

          // --------------------------------------------------
          // SEND TO COMMAND HANDLER
          // --------------------------------------------------

          if (
            messageHandler &&
            typeof
              messageHandler.handleMessage ===
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
          update?.action ===
            "add" &&
          welcome?.sendWelcome
        ) {

          await welcome.sendWelcome(
            sock,
            update
          );
        }

        if (
          update?.action ===
            "remove" &&
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
// START SESSION
// ============================================================

async function startSession(
  sessionId
) {
  return createSocket(
    sessionId
  );
}

// ============================================================
// REQUEST PAIRING CODE
//
// Supports:
//
// requestPairingCode(number)
//
// AND:
//
// requestPairingCode(sessionId, number)
//
// This keeps compatibility with panel/server.js
// ============================================================

async function requestPairingCode(
  sessionIdOrNumber,
  maybeNumber
) {

  let requestedSessionId;
  let clean;

  // ----------------------------------------------------------
  // PANEL FORM:
  // requestPairingCode(sessionId, number)
  // ----------------------------------------------------------

  if (
    maybeNumber !== undefined &&
    maybeNumber !== null &&
    String(maybeNumber).trim() !== ""
  ) {

    requestedSessionId =
      safeSessionId(
        sessionIdOrNumber
      );

    clean =
      cleanNumber(
        maybeNumber
      );

  } else {

    // --------------------------------------------------------
    // OLD FORM:
    // requestPairingCode(number)
    // --------------------------------------------------------

    clean =
      cleanNumber(
        sessionIdOrNumber
      );

    requestedSessionId =
      safeSessionId(
        clean
      );
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

  console.log(
    `📱 NUMBER [${requestedSessionId}]: ${clean}`
  );

  // ----------------------------------------------------------
  // FIND SESSION
  // ----------------------------------------------------------

  let session =
    sessionManager.getSession(
      requestedSessionId
    );

  // ----------------------------------------------------------
  // If the requested session ID doesn't exist,
  // try finding it by number.
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // CREATE SESSION
  // ----------------------------------------------------------

  if (!session) {

    session =
      sessionManager.createSession(
        {
          sessionId:
            requestedSessionId,

          number:
            clean
        }
      );

  } else {

    /*
     * IMPORTANT:
     * If panel explicitly supplied a sessionId,
     * keep that session ID.
     */

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
            number:
              clean
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

  // ----------------------------------------------------------
  // PREVENT DUPLICATE PAIRING
  // ----------------------------------------------------------

  if (
    session.pairing
  ) {

    const err =
      new Error(
        "PAIRING_IN_PROGRESS"
      );

    err.code =
      "PAIRING_IN_PROGRESS";

    throw err;
  }

  // ----------------------------------------------------------
  // CHECK ALREADY CONNECTED
  // ----------------------------------------------------------

  if (
    session.connected === true
  ) {

    const err =
      new Error(
        "SESSION_ALREADY_CONNECTED"
      );

    err.code =
      "SESSION_ALREADY_CONNECTED";

    throw err;
  }

  // ----------------------------------------------------------
  // CHECK ACTIVE SOCKET
  // ----------------------------------------------------------

  let sock =
    active.get(
      safeSessionId(
        sessionId
      )
    );

  // ----------------------------------------------------------
  // START PAIRING STATE
  // ----------------------------------------------------------

  sessionManager.startPairing(
    sessionId
  );

  // ----------------------------------------------------------
  // CREATE SOCKET IF NEEDED
  // ----------------------------------------------------------

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
          status:
            "pairing_error",

          pairing:
            false,

          pairingCode:
            null
        }
      );

    } catch {}

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
  // CHECK REGISTERED AUTH
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
        status:
          "connected",

        pairing:
          false,

        pairingCode:
          null
      }
    );

    const err =
      new Error(
        "SESSION_ALREADY_REGISTERED"
      );

    err.code =
      "SESSION_ALREADY_REGISTERED";

    throw err;
  }

  // ----------------------------------------------------------
  // REQUEST PAIRING CODE
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
        status:
          "pairing",

        pairing:
          true,

        connected:
          false,

        pairingCode:
          normalizedCode,

        number:
          clean
      }
    );

    console.log(
      `🔐 PAIRING CODE [${sessionId}]: ${normalizedCode}`
    );

    return {
      sessionId,

      number:
        clean,

      code:
        normalizedCode,

      socket:
        sock
    };

  } catch (error) {

    try {

      sessionManager.updateSession(
        sessionId,
        {
          status:
            "pairing_error",

          pairing:
            false,

          pairingCode:
            null
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

async function stopSession(
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

  const sock =
    active.get(cleanId) ||
    sessionManager.getSocket(
      cleanId
    );

  active.delete(
    cleanId
  );

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

  sessionManager.updateSession(
    cleanId,
    {
      status:
        "stopped",

      connected:
        false,

      pairing:
        false,

      pairingCode:
        null
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
        sessionManager.getSession(
          id
        );

      if (!session) {
        continue;
      }

      // ------------------------------------------------------
      // Don't restore explicitly logged-out sessions
      // ------------------------------------------------------

      if (
        session.status ===
        "logged_out"
      ) {
        console.log(
          `⏭️ SKIPPING LOGGED OUT SESSION [${id}]`
        );

        continue;
      }

      await createSocket(
        id
      );

      restored.push(
        id
      );

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

  /*
   * Listener is already attached
   * inside createSocket().
   */

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

  /*
   * Listener is already attached
   * inside createSocket().
   */

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

    await stopSession(
      id
    );
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

  start,

  stop
};