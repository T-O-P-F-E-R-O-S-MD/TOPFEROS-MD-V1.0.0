"use strict";

const fs = require("fs");
const path = require("path");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 TOPFEROS MD — WHATSAPP CONNECTION
// 🚀 TOPFEROS TECH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Settings panel
const settingsPanel = require("../settings/panel");

// Message handler
const messageHandler = require("./messageHandler");

// Auth folder
const AUTH_DIR = path.join(
  __dirname,
  "..",
  "auth"
);

// Evite plizyè connection an menm tan
let sock = null;
let starting = false;
let reconnectTimer = null;
let stopped = false;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 PREPARE AUTH DIRECTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function prepareAuthDirectory() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, {
      recursive: true
    });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📩 MESSAGE HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleMessages(messages) {
  if (
    !messages ||
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    return;
  }

  for (const message of messages) {
    try {
      // messageHandler.js ou a ekspòte:
      // { handleMessage, getMessageText }

      if (
        messageHandler &&
        typeof messageHandler.handleMessage === "function"
      ) {
        await messageHandler.handleMessage(
          sock,
          message
        );
      }

    } catch (error) {
      console.error(
        "❌ MESSAGE HANDLER ERROR:",
        error?.message || error
      );
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 RECONNECT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function scheduleReconnect() {
  if (stopped) {
    return;
  }

  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(
    async () => {
      reconnectTimer = null;

      try {
        await start();
      } catch (error) {
        console.error(
          "❌ RECONNECT ERROR:",
          error?.message || error
        );

        scheduleReconnect();
      }
    },
    5000
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 START CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function start() {
  if (starting) {
    return sock;
  }

  if (
    sock &&
    sock.user
  ) {
    return sock;
  }

  starting = true;
  stopped = false;

  try {
    prepareAuthDirectory();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔐 LOAD AUTH SESSION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      AUTH_DIR
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📡 BAILEYS VERSION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let version;

    try {
      const latest =
        await fetchLatestBaileysVersion();

      version = latest.version;

    } catch (error) {
      console.log(
        "⚠️ Could not fetch latest Baileys version."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🤖 CREATE SOCKET
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const socketOptions = {
      auth: state,

      logger: require("pino")({
        level: "silent"
      }),

      browser:
        Browsers?.ubuntu("TOPFEROS MD") ||
        [
          "TOPFEROS MD",
          "Chrome",
          "1.0.0"
        ],

      printQRInTerminal: true,

      markOnlineOnConnect: false,

      syncFullHistory: false,

      generateHighQualityLinkPreview: false
    };

    if (version) {
      socketOptions.version = version;
    }

    sock =
      makeWASocket(
        socketOptions
      );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💾 SAVE CREDENTIALS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on(
      "creds.update",
      saveCreds
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📡 CONNECTION UPDATE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect
        } = update;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🟡 CONNECTING
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        if (
          connection === "connecting"
        ) {
          console.log(
            "🟡 TOPFEROS MD: Connecting to WhatsApp..."
          );
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🟢 CONNECTED
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        if (
          connection === "open"
        ) {
          console.log(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          );

          console.log(
            "🟢 TOPFEROS MD: WhatsApp connected."
          );

          console.log(
            "📱 WhatsApp: ONLINE"
          );

          console.log(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          );

          // ⚙️ Settings panel la konnen bot la konekte.
          // Sa fè nouvo panel code yo valid.
          settingsPanel.setBotConnected(
            sock
          );

          starting = false;

          return;
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🔴 DISCONNECTED
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        if (
          connection === "close"
        ) {
          const statusCode =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;

          const loggedOut =
            statusCode ===
            DisconnectReason.loggedOut;

          // ⚙️ Sa invalid tout panel sessions/codes
          // imedyatman lè WhatsApp dekonekte.
          settingsPanel.setBotDisconnected();

          console.log(
            "🔴 TOPFEROS MD: WhatsApp disconnected."
          );

          console.log(
            `📌 Status code: ${statusCode || "unknown"}`
          );

          sock = null;
          starting = false;

          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // 🔄 AUTO RECONNECT
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

          if (
            !loggedOut &&
            !stopped
          ) {
            console.log(
              "🔄 TOPFEROS MD: Reconnecting in 5 seconds..."
            );

            scheduleReconnect();

          } else if (
            loggedOut
          ) {
            console.log(
              "❌ TOPFEROS MD: WhatsApp session logged out."
            );

            console.log(
              "⚠️ Auth session lan bezwen rekonekte."
            );
          }
        }
      }
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📨 INCOMING MESSAGES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on(
      "messages.upsert",
      async (data) => {
        try {
          if (
            !data ||
            !Array.isArray(data.messages)
          ) {
            return;
          }

          await handleMessages(
            data.messages
          );

        } catch (error) {
          console.error(
            "❌ MESSAGES UPSERT ERROR:",
            error?.message || error
          );
        }
      }
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🛑 CONNECTION ERROR
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  } catch (error) {
    starting = false;
    sock = null;

    // ⚙️ Si connection pa fèt,
    // panel code yo pa dwe konsidere bot la online.
    settingsPanel.setBotDisconnected();

    console.error(
      "❌ WHATSAPP CONNECTION ERROR:",
      error?.message || error
    );

    if (!stopped) {
      scheduleReconnect();
    }

    throw error;
  }

  starting = false;

  return sock;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛑 STOP CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function stop() {
  stopped = true;

  if (reconnectTimer) {
    clearTimeout(
      reconnectTimer
    );

    reconnectTimer = null;
  }

  // ⚙️ Invalid panel sessions yo
  settingsPanel.setBotDisconnected();

  try {
    if (
      sock &&
      typeof sock.end === "function"
    ) {
      sock.end(
        undefined
      );
    }

  } catch (error) {
    console.error(
      "❌ SOCKET STOP ERROR:",
      error?.message || error
    );
  }

  sock = null;
  starting = false;

  console.log(
    "🛑 TOPFEROS MD: WhatsApp connection stopped."
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 GET SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSocket() {
  return sock;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📡 CONNECTION STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isConnected() {
  return !!(
    sock &&
    sock.user
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  start,
  stop,
  getSocket,
  isConnected
};