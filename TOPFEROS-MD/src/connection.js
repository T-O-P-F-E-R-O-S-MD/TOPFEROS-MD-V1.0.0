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

const pino = require("pino");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 TOPFEROS MD — WHATSAPP CONNECTION
// 🚀 TOPFEROS TECH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Settings panel
const settingsPanel = require("../settings/panel");

// Message handler
const messageHandler = require("./messageHandler");

// Config
const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 PHONE NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Mete nimewo WhatsApp bot la nan config.js:
//
// whatsapp: {
//   phoneNumber: "509XXXXXXXX"
// }
//
// Pa mete +, espas oswa -.
//
// Egzanp:
// 50937000000
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PHONE_NUMBER =
  String(
    config?.whatsapp?.phoneNumber ||
    process.env.WHATSAPP_NUMBER ||
    ""
  )
    .replace(/\D/g, "");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 AUTH DIRECTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Pou kounya se session prensipal la.
// Apre sa nou ka pase sou:
//
// auth/
//   session-1/
//   session-2/
//   session-3/
//
// pou plizyè bot/session.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AUTH_DIR = path.join(
  __dirname,
  "..",
  "auth"
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ CONNECTION STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let sock = null;
let starting = false;
let reconnectTimer = null;
let stopped = false;
let pairingRequested = false;

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
// 🔎 CHECK PHONE NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function validatePhoneNumber() {
  if (!PHONE_NUMBER) {
    console.log("");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log(
      "⚠️ WHATSAPP NUMBER PA CONFIGURED."
    );
    console.log("");
    console.log(
      "📱 Mete nimewo WhatsApp bot la nan:"
    );
    console.log(
      "config.js → whatsapp.phoneNumber"
    );
    console.log("");
    console.log(
      "Egzanp:"
    );
    console.log(
      'phoneNumber: "509XXXXXXXX"'
    );
    console.log("");
    console.log(
      "Pa mete +, espas oswa -."
    );
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("");

    return false;
  }

  if (PHONE_NUMBER.length < 8) {
    console.log(
      "❌ WhatsApp phone number lan pa sanble valid."
    );

    return false;
  }

  return true;
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
      if (
        messageHandler &&
        typeof messageHandler.handleMessage ===
          "function"
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
    // 📱 VERIFY NUMBER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!validatePhoneNumber()) {
      starting = false;
      return null;
    }

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
    // 🤖 SOCKET OPTIONS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const socketOptions = {
      auth: state,

      logger: pino({
        level: "silent"
      }),

      browser:
        Browsers?.ubuntu("TOPFEROS MD") ||
        [
          "TOPFEROS MD",
          "Chrome",
          "1.0.0"
        ],

      // Pa konte sou QR terminal.
      printQRInTerminal: false,

      markOnlineOnConnect: false,

      syncFullHistory: false,

      generateHighQualityLinkPreview: false
    };

    if (version) {
      socketOptions.version = version;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔌 CREATE SOCKET
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
    // 🔐 PAIRING CODE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      !state.creds.registered &&
      PHONE_NUMBER &&
      !pairingRequested
    ) {
      pairingRequested = true;

      try {
        console.log("");
        console.log(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        );

        console.log(
          "📱 WHATSAPP PAIRING"
        );

        console.log(
          `📞 Number: ${PHONE_NUMBER}`
        );

        console.log(
          "⏳ Generating pairing code..."
        );

        console.log(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        );

        const pairingCode =
          await sock.requestPairingCode(
            PHONE_NUMBER
          );

        console.log("");
        console.log(
          "╔══════════════════════════════════════╗"
        );

        console.log(
          "║       🔐 TOPFEROS MD PAIRING        ║"
        );

        console.log(
          "╠══════════════════════════════════════╣"
        );

        console.log(
          `║  CODE: ${pairingCode}`
        );

        console.log(
          "╚══════════════════════════════════════╝"
        );

        console.log("");

        console.log(
          "📱 WhatsApp → Linked Devices → Link a device"
        );

        console.log(
          "🔢 Chwazi: Link with phone number instead"
        );

        console.log(
          "🔐 Mete pairing code ki anlè a."
        );

        console.log("");

      } catch (error) {
        pairingRequested = false;

        console.error(
          "❌ PAIRING CODE ERROR:",
          error?.message || error
        );
      }
    }

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
        // 🟢 OPEN
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        if (
          connection === "open"
        ) {
          console.log("");

          console.log(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          );

          console.log(
            "🟢 TOPFEROS MD: WhatsApp connected."
          );

          console.log(
            "📱 WhatsApp: ONLINE"
          );

          if (sock.user?.id) {
            console.log(
              `📞 Connected account: ${sock.user.id}`
            );
          }

          console.log(
            "👥 Multi-session architecture: ENABLED"
          );

          console.log(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          );

          console.log("");

          // Panel konnen bot la online.
          settingsPanel.setBotConnected(
            sock
          );

          starting = false;
          pairingRequested = false;

          return;
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🔴 CLOSE
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

          settingsPanel.setBotDisconnected();

          console.log(
            "🔴 TOPFEROS MD: WhatsApp disconnected."
          );

          console.log(
            `📌 Status code: ${
              statusCode || "unknown"
            }`
          );

          sock = null;
          starting = false;
          pairingRequested = false;

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

  } catch (error) {

    starting = false;
    sock = null;
    pairingRequested = false;

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
  pairingRequested = false;

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
// 📱 GET PHONE NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getPhoneNumber() {
  return PHONE_NUMBER;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  start,
  stop,
  getSocket,
  isConnected,
  getPhoneNumber
};