"use strict";

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const path = require("path");

const config = require("../config");

let sock = null;
let reconnecting = false;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 AUTH DIRECTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const authPath = path.join(
  __dirname,
  "..",
  "auth"
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 START WHATSAPP CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function start() {
  if (reconnecting) return;

  reconnecting = true;

  try {
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🤖 TOPFEROS MD - WhatsApp Connection");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    const { state, saveCreds } =
      await useMultiFileAuthState(authPath);

    const { version } =
      await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,

      logger: pino({
        level: "silent"
      }),

      printQRInTerminal: false,

      browser: [
        "TOPFEROS MD",
        "Chrome",
        "1.0.0"
      ],

      generateHighQualityLinkPreview: true,

      markOnlineOnConnect: false
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💾 SAVE AUTH CREDENTIALS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on(
      "creds.update",
      saveCreds
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔌 CONNECTION UPDATE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect
        } = update;

        if (connection === "connecting") {
          console.log(
            "🔄 Connecting to WhatsApp..."
          );
        }

        if (connection === "open") {
          reconnecting = false;

          console.log("");
          console.log(
            "╔══════════════════════════════════════════════╗"
          );
          console.log(
            "║          ✅ WHATSAPP CONNECTED              ║"
          );
          console.log(
            "╠══════════════════════════════════════════════╣"
          );
          console.log(
            `║ 🤖 Bot: ${config.bot.name}`
          );
          console.log(
            `║ 📦 Version: ${config.bot.version}`
          );
          console.log(
            `║ 🔰 Prefix: ${config.bot.prefix}`
          );
          console.log(
            "║ 🚀 TOPFEROS TECH"
          );
          console.log(
            "╚══════════════════════════════════════════════╝"
          );
          console.log("");
        }

        if (connection === "close") {
          reconnecting = false;

          const statusCode =
            lastDisconnect?.error?.output?.statusCode;

          const shouldReconnect =
            statusCode !==
            DisconnectReason.loggedOut;

          if (shouldReconnect) {
            console.log(
              "🔄 WhatsApp disconnected. Reconnecting..."
            );

            setTimeout(() => {
              start();
            }, 5000);
          } else {
            console.log(
              "🚪 WhatsApp session logged out."
            );
            console.log(
              "🔐 Please authenticate again."
            );
          }
        }
      }
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📩 MESSAGE EVENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {
        if (!messages || !messages.length) {
          return;
        }

        for (const message of messages) {
          try {
            await handleMessage(
              message
            );
          } catch (error) {
            console.error(
              "❌ Message handler error:",
              error.message
            );
          }
        }
      }
    );

  } catch (error) {
    reconnecting = false;

    console.error(
      "❌ WhatsApp connection error:",
      error.message
    );

    setTimeout(() => {
      start();
    }, 5000);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 MESSAGE HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleMessage(message) {
  if (!message.message) {
    return;
  }

  const remoteJid =
    message.key?.remoteJid;

  if (!remoteJid) {
    return;
  }

  // Message processing ap ajoute
  // nan command/message handler yo.
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛑 GET SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSocket() {
  return sock;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛑 LOGOUT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function logout() {
  if (!sock) {
    return;
  }

  try {
    await sock.logout();

    sock = null;

    console.log(
      "🚪 WhatsApp session logged out."
    );
  } catch (error) {
    console.error(
      "❌ Logout error:",
      error.message
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  start,
  getSocket,
  logout
};