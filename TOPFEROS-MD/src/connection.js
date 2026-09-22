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
const creatingSockets = new Map();

const manuallyStopped = new Set();
const pairingRequested = new Set();
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

    if (!item) return undefined;

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

const msgRetryCounterCache =
  new SimpleMessageRetryCache();

// ============================================================
// OPTIONAL COMMANDS
// ============================================================

let welcome = null;
let goodbye = null;

try {
  welcome = require("../commands/welcome");
} catch {}

try {
  goodbye = require("../commands/goodbye");
} catch {}

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
  const id = safeSessionId(sessionId);
  const timer = reconnectTimers.get(id);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(id);
  }
}

// ============================================================
// PAIRING HELPERS
// ============================================================

function markPairingReady(sessionId) {
  const id = safeSessionId(sessionId);

  if (!id) return;

  pairingReady.add(id);

  const waiter = pairingWaiters.get(id);

  if (waiter) {
    pairingWaiters.delete(id);

    try {
      waiter.resolve();
    } catch {}
  }
}

function clearPairingReady(sessionId) {
  pairingReady.delete(
    safeSessionId(sessionId)
  );
}

function failPairingWaiter(sessionId, error) {
  const id = safeSessionId(sessionId);
  const waiter = pairingWaiters.get(id);

  if (!waiter) return;

  pairingWaiters.delete(id);

  try {
    waiter.reject(error);
  } catch {}
}

function waitForPairingReady(
  sessionId,
  timeout = 30000
) {
  const id = safeSessionId(sessionId);

  if (pairingReady.has(id)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pairingWaiters.delete(id);

      reject(
        new Error(
          "WhatsApp socket pa rive nan etap pairing la alè."
        )
      );
    }, timeout);

    pairingWaiters.set(id, {
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
  return sessionManager.getConnectionState(
    safeSessionId(sessionId)
  );
}

// ============================================================
// CONNECTED MESSAGE
// ============================================================

async function sendConnectedMessage(
  sock,
  sessionId
) {
  try {
    if (!sock?.user?.id) return;

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

    const text = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃      🌟 TOPFEROS MD 🌟       ┃
┃          V1.0.0              ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭───────❖ 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 ❖───────╮
│ 🎉 🦁 TOPFEROS MD V1.0.0 ONLINE 🎉
│
│ ⚡ Prefix   : .
│ 🌐 Mode     : Public
│ 👤 Username : ${username}
│ 📱 Number   : ${number}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭──────❖ 𝐐𝐔𝐈𝐂𝐊 𝐌𝐄𝐍𝐔 ❖──────╮
│ 📋 Type .menu
│ ⚙️ Type .setting
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
      await sock.sendMessage(
        user.id,
        {
          image: fs.readFileSync(logoPath),
          caption: text
        }
      );
    } else {
      await sock.sendMessage(
        user.id,
        {
          text
        }
      );
    }

  } catch (error) {
    console.error(
      `❌ CONNECTED MESSAGE ERROR [${sessionId}]`,
      error?.message || error
    );
  }
}

// ============================================================
// CREATE SOCKET
// ============================================================

async function createSocket(sessionId) {
  const id = safeSessionId(sessionId);

  if (!id) {
    throw new Error("sessionId obligatwa.");
  }

  const existing = active.get(id);

  if (existing) {
    return existing;
  }

  // Prevent two sockets for same session
  if (creatingSockets.has(id)) {
    return creatingSockets.get(id);
  }

  const creation = (async () => {
    manuallyStopped.delete(id);

    let session =
      sessionManager.getSession(id);

    if (!session) {
      session =
        sessionManager.restoreSession(id);
    }

    if (!session) {
      throw new Error(
        `Session introuvable: ${id}`
      );
    }

    const authDir = session.authDir;

    if (!authDir) {
      throw new Error(
        `authDir manke pou session ${id}`
      );
    }

    fs.mkdirSync(authDir, {
      recursive: true
    });

    console.log(
      `📁 AUTH DIR [${id}]: ${authDir}`
    );

    // ========================================================
    // AUTH STATE
    // ========================================================

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      authDir
    );

    // ========================================================
    // SOCKET
    // ========================================================

    const sock = makeWASocket({
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

      shouldSyncHistoryMessage:
        () => false,

      shouldIgnoreJid:
        () => false,

      msgRetryCounterCache
    });

    active.set(id, sock);

    sessionManager.setSocket(
      id,
      sock
    );

    sessionManager.updateSession(
      id,
      {
        status: "connecting",
        connected: false
      }
    );

    // ========================================================
    // SAVE CREDS - SERIALIZED
    // ========================================================

    let credsSavePromise =
      Promise.resolve();

    sock.ev.on(
      "creds.update",
      () => {
        credsSavePromise =
          credsSavePromise
            .then(() => saveCreds())
            .catch(error => {
              console.error(
                `❌ CREDS SAVE ERROR [${id}]`,
                error?.message || error
              );
            });
      }
    );

    // ========================================================
    // CONNECTION UPDATE
    // ========================================================

    sock.ev.on(
      "connection.update",
      async update => {
        const {
          connection,
          lastDisconnect,
          qr
        } = update || {};

        try {
          if (connection === "connecting") {
            sessionManager.updateSession(
              id,
              {
                status: "connecting",
                connected: false
              }
            );

            // Pairing-code mode can become ready
            // without a QR event.
            markPairingReady(id);

            console.log(
              `🔄 WhatsApp CONNECTING [${id}]`
            );
          }

          if (qr) {
            console.log(
              `ℹ️ QR RECEIVED [${id}]`
            );

            markPairingReady(id);
          }

          if (connection === "open") {
            clearReconnectTimer(id);
            markPairingReady(id);

            manuallyStopped.delete(id);
            pairingRequested.delete(id);

            sessionManager.updateSession(
              id,
              {
                status: "connected",
                connected: true,
                pairing: false,
                pairingCode: null
              }
            );

            sessionManager.endPairing(id);

            try {
              if (
                settingsPanel &&
                typeof settingsPanel.setBotConnected ===
                  "function"
              ) {
                settingsPanel.setBotConnected(
                  sock,
                  id
                );
              }
            } catch (error) {
              console.error(
                `❌ SETTING PANEL CONNECT ERROR [${id}]`,
                error?.message || error
              );
            }

            console.log(
              `✅ WhatsApp CONNECTED: ${id}`
            );

            await sendConnectedMessage(
              sock,
              id
            );
          }

          if (connection === "close") {
            active.delete(id);

            sessionManager.setSocket(
              id,
              null
            );

            clearPairingReady(id);

            const statusCode =
              lastDisconnect?.error?.output?.statusCode ??
              lastDisconnect?.error?.statusCode ??
              null;

            const errorMessage =
              lastDisconnect?.error?.message ||
              "Unknown connection error";

            console.error(
              `❌ WhatsApp CONNECTION CLOSED [${id}]`,
              {
                statusCode,
                error: errorMessage
              }
            );

            try {
              if (
                settingsPanel &&
                typeof settingsPanel.setBotDisconnected ===
                  "function"
              ) {
                settingsPanel.setBotDisconnected(
                  sock,
                  false,
                  id
                );
              }
            } catch {}

            if (
              manuallyStopped.has(id)
            ) {
              sessionManager.updateSession(
                id,
                {
                  status: "stopped",
                  connected: false,
                  pairing: false,
                  pairingCode: null
                }
              );

              return;
            }

            if (
              statusCode ===
              DisconnectReason.loggedOut
            ) {
              clearReconnectTimer(id);
              pairingRequested.delete(id);

              sessionManager.updateSession(
                id,
                {
                  status: "logged_out",
                  connected: false,
                  pairing: false,
                  pairingCode: null
                }
              );

              return;
            }

            if (
              statusCode ===
              DisconnectReason.badSession
            ) {
              clearReconnectTimer(id);
              pairingRequested.delete(id);

              sessionManager.updateSession(
                id,
                {
                  status: "error",
                  connected: false,
                  pairing: false,
                  pairingCode: null
                }
              );

              return;
            }

            sessionManager.updateSession(
              id,
              {
                status: "reconnecting",
                connected: false,
                pairing: false,
                pairingCode: null
              }
            );

            scheduleReconnect(id);
          }

        } catch (error) {
          console.error(
            `❌ CONNECTION UPDATE ERROR [${id}]`,
            error?.message || error
          );
        }
      }
    );

    // ========================================================
    // MESSAGES
    // ========================================================

    sock.ev.on(
      "messages.upsert",
      async upsert => {
        try {
          console.log(
            `📩 MESSAGES.UPSERT [${id}]:`,
            upsert?.type,
            upsert?.messages?.length || 0
          );

          if (
            upsert?.type !== "notify"
          ) {
            return;
          }

          if (
            upsert?.requestId
          ) {
            console.log(
              `⚠️ REQUEST-ID MESSAGE IGNORED [${id}]`
            );

            return;
          }

          for (
            const msg of
            upsert.messages || []
          ) {

            if (
              msg?.key?.fromMe
            ) {
              continue;
            }

            const remoteJid =
              msg?.key?.remoteJid ||
              "unknown";

            console.log(
              `📨 MESSAGE RECEIVED [${id}] FROM: ${remoteJid}`
            );

            if (
              messageHandler &&
              typeof messageHandler.handleMessage ===
                "function"
            ) {
              await messageHandler.handleMessage(
                sock,
                msg,
                id
              );
            } else {
              console.error(
                `❌ handleMessage pa jwenn nan messageHandler.js [${id}]`
              );
            }
          }

        } catch (error) {
          console.error(
            `❌ MESSAGE HANDLER ERROR [${id}]`,
            error?.stack ||
            error?.message ||
            error
          );
        }
      }
    );

    // ========================================================
    // GROUP PARTICIPANTS
    // ========================================================

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
            `❌ GROUP EVENT ERROR [${id}]`,
            error?.message || error
          );
        }
      }
    );

    return sock;
  })();

  creatingSockets.set(id, creation);

  try {
    return await creation;
  } finally {
    creatingSockets.delete(id);
  }
}

// ============================================================
// RECONNECT
// ============================================================

function scheduleReconnect(sessionId) {
  const id = safeSessionId(sessionId);

  if (!id) return;

  if (
    manuallyStopped.has(id)
  ) {
    return;
  }

  if (
    reconnectTimers.has(id)
  ) {
    return;
  }

  const timer =
    setTimeout(
      async () => {
        reconnectTimers.delete(id);

        if (
          manuallyStopped.has(id)
        ) {
          return;
        }

        try {
          console.log(
            `🔁 Reconnecting [${id}]...`
          );

          await createSocket(id);

        } catch (error) {
          console.error(
            `❌ RECONNECT ERROR [${id}]`,
            error?.message || error
          );

          if (
            !manuallyStopped.has(id)
          ) {
            scheduleReconnect(id);
          }
        }
      },
      5000
    );

  reconnectTimers.set(
    id,
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

  let session =
    sessionManager.getSessionByNumber(
      number
    );

  if (
    !session &&
    requestedSessionId
  ) {
    session =
      sessionManager.getSession(
        requestedSessionId
      );
  }

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
  }

  const id = session.sessionId;

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

  sessionManager.startPairing(id);

  pairingRequested.delete(id);
  clearPairingReady(id);

  const sock =
    await createSocket(id);

  try {
    await waitForPairingReady(
      id,
      30000
    );
  } catch (error) {
    sessionManager.updateSession(
      id,
      {
        status: "pairing_error",
        pairing: false,
        pairingCode: null
      }
    );

    throw error;
  }

  if (
    pairingRequested.has(id)
  ) {
    const current =
      sessionManager.getSession(id);

    return {
      sessionId: id,
      number,
      code:
        current?.pairingCode ||
        null,
      socket: sock
    };
  }

  pairingRequested.add(id);

  try {
    console.log(
      `🔐 Requesting pairing code [${id}]`
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
      id,
      normalizedCode
    );

    console.log(
      `🔐 PAIRING CODE [${id}]: ${normalizedCode}`
    );

    return {
      sessionId: id,
      number,
      code: normalizedCode,
      socket: sock
    };

  } catch (error) {
    pairingRequested.delete(id);

    sessionManager.updateSession(
      id,
      {
        status: "pairing_error",
        pairing: false,
        pairingCode: null
      }
    );

    console.error(
      `❌ PAIRING CODE ERROR [${id}]`,
      error?.message || error
    );

    throw error;
  }
}

// ============================================================
// STOP SESSION
// ============================================================

async function stopSession(sessionId) {
  const id = safeSessionId(sessionId);

  if (!id) return false;

  clearReconnectTimer(id);

  manuallyStopped.add(id);
  pairingRequested.delete(id);
  clearPairingReady(id);

  failPairingWaiter(
    id,
    new Error("Session stopped.")
  );

  const sock =
    active.get(id) ||
    sessionManager.getSocket(id);

  active.delete(id);

  if (sock) {
    try {
      sock.end(
        new Error("Session stopped")
      );
    } catch {}
  }

  sessionManager.setSocket(
    id,
    null
  );

  sessionManager.updateSession(
    id,
    {
      status: "stopped",
      connected: false,
      pairing: false,
      pairingCode: null
    }
  );

  return true;
}

// ============================================================
// REMOVE SESSION
// ============================================================

async function removeSession(sessionId) {
  const id = safeSessionId(sessionId);

  if (!id) return false;

  clearReconnectTimer(id);
  manuallyStopped.add(id);
  pairingRequested.delete(id);
  clearPairingReady(id);

  failPairingWaiter(
    id,
    new Error("Session removed.")
  );

  await stopSession(id);

  return sessionManager.removeSession(id);
}

// ============================================================
// RESTORE STORED SESSIONS
// ============================================================

async function restoreStoredSessions() {
  const ids =
    sessionManager.getStoredSessionIds();

  const restored = [];

  for (const id of ids) {
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
        error?.message || error
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
      error?.message || error
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

  for (const id of ids) {
    await stopSession(id);
  }

  for (
    const timer of
    reconnectTimers.values()
  ) {
    clearTimeout(timer);
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

    pairingWaiters.delete(id);
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