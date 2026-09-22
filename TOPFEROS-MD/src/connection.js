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

// Pa kite yon socket ki te sispann manyèlman rekonekte
const manuallyStopped = new Set();

// Pa mande pairing code plizyè fwa sou menm socket
const pairingRequested = new Set();

// Socket la dwe rive nan etap QR/ready avan pairing code
const pairingReady = new Set();
const pairingWaiters = new Map();

// ============================================================
// MESSAGE RETRY CACHE
// ============================================================

class SimpleMessageRetryCache {
  constructor(ttl = 60 * 60 * 1000) {
    this.ttl = ttl;
    this.cache = new Map();
  }

  async get(key) {
    const item = this.cache.get(String(key));

    if (!item) {
      return undefined;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(String(key));
      return undefined;
    }

    return item.value;
  }

  async set(key, value, ttlSeconds) {
    const ttl =
      Number(ttlSeconds) > 0
        ? Number(ttlSeconds) * 1000
        : this.ttl;

    this.cache.set(String(key), {
      value,
      expiresAt: Date.now() + ttl
    });

    return true;
  }

  async del(key) {
    this.cache.delete(String(key));
    return true;
  }

  async has(key) {
    return (await this.get(key)) !== undefined;
  }

  async clear() {
    this.cache.clear();
  }
}

// IMPORTANT:
// Cache la deyò socket la.
// Lè socket la rekòmanse, retry counter yo pa reset.
const msgRetryCounterCache =
  new SimpleMessageRetryCache();

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
// PAIRING READY
// ============================================================

function markPairingReady(sessionId) {
  const cleanId = safeSessionId(sessionId);

  if (!cleanId) {
    return;
  }

  pairingReady.add(cleanId);

  const waiter = pairingWaiters.get(cleanId);

  if (waiter) {
    pairingWaiters.delete(cleanId);

    try {
      waiter.resolve();
    } catch {}
  }
}

function clearPairingReady(sessionId) {
  const cleanId = safeSessionId(sessionId);

  pairingReady.delete(cleanId);
}

function failPairingWaiter(sessionId, error) {
  const cleanId = safeSessionId(sessionId);

  const waiter = pairingWaiters.get(cleanId);

  if (waiter) {
    pairingWaiters.delete(cleanId);

    try {
      waiter.reject(error);
    } catch {}
  }
}

function waitForPairingReady(
  sessionId,
  timeout = 30000
) {
  const cleanId = safeSessionId(sessionId);

  if (pairingReady.has(cleanId)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pairingWaiters.delete(cleanId);

      reject(
        new Error(
          "WhatsApp socket pa rive nan etap pairing la alè."
        )
      );
    }, timeout);

    pairingWaiters.set(cleanId, {
      resolve: () => {
        clearTimeout(timer);
        resolve();
      },

      reject: error => {
        clearTimeout(timer);
        reject(error);
      }
    });
  });
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
  // CANCEL MANUAL STOP ONLY WHEN WE ARE REALLY STARTING
  // A NEW SOCKET
  // ----------------------------------------------------------

  manuallyStopped.delete(cleanId);

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

  let session =
    sessionManager.getSession(cleanId);

  if (!session) {
    session =
      sessionManager.restoreSession(cleanId);
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
      version = latest.version;

      console.log(
        `📦 BAILEYS VERSION [${cleanId}]: ${version.join(".")}`
      );
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

    // Pa pran fake/requestId messages
    // kòm vrè messages pou commands.
    shouldSyncHistoryMessage: () => false,

    shouldIgnoreJid: () => false,

    // Retry cache la rete deyò socket la.
    msgRetryCounterCache,

    // Opsyon ki disponib nan vèsyon ki pi resan yo.
    enableAutoSessionRecreation: false,

    enableRecentMessageCache: true
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
        // QR / PAIRING READY
        // ----------------------------------------------------

        if (qr) {

          console.log(
            `ℹ️ QR RECEIVED [${cleanId}]`
          );

          markPairingReady(cleanId);
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

          markPairingReady(
            cleanId
          );

          manuallyStopped.delete(
            cleanId
          );

          pairingRequested.delete(
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

        if (
          connection === "close"
        ) {

          active.delete(
            cleanId
          );

          sessionManager.setSocket(
            cleanId,
            null
          );

          clearPairingReady(
            cleanId
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
          // MANUAL STOP
          // --------------------------------------------------

          if (
            manuallyStopped.has(
              cleanId
            )
          ) {

            clearReconnectTimer(
              cleanId
            );

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
              `🛑 NO RECONNECT - SESSION STOPPED [${cleanId}]`
            );

            return;
          }

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

            pairingRequested.delete(
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

            pairingRequested.delete(
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

                if (
                  manuallyStopped.has(
                    cleanId
                  )
                ) {

                  console.log(
                    `🛑 RECONNECT CANCELLED [${cleanId}]`
                  );

                  return;
                }

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

                  if (
                    !manuallyStopped.has(
                      cleanId
                    )
                  ) {

                    scheduleReconnect(
                      cleanId
                    );
                  }
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

      try {

        console.log(
          `📩 MESSAGES.UPSERT RECEIVED [${cleanId}]:`,
          upsert?.type,
          upsert?.messages?.length || 0
        );

        // Pa trete history oswa lòt upsert ki pa notify.
        if (
          upsert?.type !== "notify"
        ) {
          return;
        }

        // Security:
        // Pa trete fake/requestId upsert events.
        if (
          upsert?.requestId
        ) {
          console.log(
            `⚠️ REQUEST-ID MESSAGE IGNORED [${cleanId}]`
          );

          return;
        }

        for (
          const msg of
          upsert.messages || []
        ) {

          if (!msg) {
            continue;
          }

          if (
            msg?.key?.fromMe
          ) {
            continue;
          }

          if (
            !msg?.message
          ) {

            console.log(
              `⚠️ MESSAGE WITHOUT CONTENT [${cleanId}]`
            );

            continue;
          }

          const remoteJid =
            msg?.key?.remoteJid ||
            "unknown";

          console.log(
            `📨 DECRYPTED MESSAGE [${cleanId}] FROM: ${remoteJid}`
          );

          // --------------------------------------------------
          // MESSAGE HANDLER
          // --------------------------------------------------

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
    manuallyStopped.has(cleanId)
  ) {
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

        if (
          manuallyStopped.has(
            cleanId
          )
        ) {
          return;
        }

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

          if (
            !manuallyStopped.has(
              cleanId
            )
          ) {

            scheduleReconnect(
              cleanId
            );
          }
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

async function startSession(
  sessionId
) {
  return createSocket(
    sessionId
  );
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

  if (
    session?.pairing
  ) {

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
          `session_${number}`,

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

  pairingRequested.delete(
    sessionId
  );

  clearPairingReady(
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
  // DO NOT LOAD auth state AGAIN
  // ----------------------------------------------------------
  //
  // createSocket() already loaded the auth state.
  // Loading another useMultiFileAuthState() here can create
  // another in-memory view of the same auth directory.
  //
  // Use the socket's current auth state instead.
  // ----------------------------------------------------------

  if (
    sock?.authState?.creds?.registered
  ) {

    clearReconnectTimer(
      sessionId
    );

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
  // WAIT UNTIL SOCKET IS READY
  // ----------------------------------------------------------

  try {

    await waitForPairingReady(
      sessionId,
      30000
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
  // PREVENT DUPLICATE REQUEST
  // ----------------------------------------------------------

  if (
    pairingRequested.has(
      sessionId
    )
  ) {

    const current =
      sessionManager.getSession(
        sessionId
      );

    return {
      sessionId,
      number,
      code:
        current?.pairingCode ||
        null,
      socket: sock
    };
  }

  pairingRequested.add(
    sessionId
  );

  // ----------------------------------------------------------
  // REQUEST CODE
  // ----------------------------------------------------------

  try {

    console.log(
      `🔐 Requesting NEW pairing code [${sessionId}]`
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

    pairingRequested.delete(
      sessionId
    );

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

  manuallyStopped.add(
    cleanId
  );

  pairingRequested.delete(
    cleanId
  );

  clearPairingReady(
    cleanId
  );

  failPairingWaiter(
    cleanId,
    new Error(
      "Session stopped."
    )
  );

  const sock =
    active.get(cleanId) ||
    sessionManager.getSocket(cleanId);

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

  manuallyStopped.add(
    cleanId
  );

  pairingRequested.delete(
    cleanId
  );

  clearPairingReady(
    cleanId
  );

  failPairingWaiter(
    cleanId,
    new Error(
      "Session removed."
    )
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

  for (
    const timer of
    reconnectTimers.values()
  ) {

    clearTimeout(
      timer
    );
  }

  reconnectTimers.clear();

  pairingRequested.clear();
  pairingReady.clear();

  for (
    const [id, waiter] of
    pairingWaiters.entries()
  ) {

    try {

      waiter.reject(
        new Error(
          "TOPFEROS MD stopped."
        )
      );

    } catch {}

    pairingWaiters.delete(
      id
    );
  }

  manuallyStopped.clear();

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