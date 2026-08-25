"use strict";

const fs = require("fs");
const path = require("path");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const P = require("@whiskeysockets/baileys").Browsers;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 TOPFEROS MD — WHATSAPP CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Settings panel la
const settingsPanel = require("../settings/panel");

// Message handler la
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

async function handleMessages(updates) {
  if (
    !updates ||
    !Array.isArray(updates) ||
    updates.length === 0
  ) {
    return;
  }

  for (const update of updates) {
    try {
      if (
        typeof messageHandler === "function"
      ) {
        await messageHandler(
          sock,
          update
        );
      }

      else if (
        typeof messageHandler.handleMessages ===
        "function"
      ) {
        await messageHandler.handleMessages(
          sock,
          update
        );
      }

      else if (
        typeof messageHandler.handle ===
        "function"
      ) {
        await messageHandler.handle(
          sock,
          update
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

    } catch {
      version = undefined;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🤖 CREATE SOCKET
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const socketOptions = {
      auth: state,

      browser:
        P?.ubuntu("TOPFEROS MD") ||
        ["TOPFEROS MD", "Chrome", "1.0.0"],

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
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          );

          // Mete panel la konnen bot la konekte.
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

          // Panel code yo dwe invalid touswit.
          settingsPanel.setBotDisconnected();

          console.log(
            `🔴 TOPFEROS MD: WhatsApp disconnected. Code: ${statusCode || "unknown"}`
          );

          sock = null;
          starting = false;

          // Si session WhatsApp la pa efase,
          // nou eseye rekonekte otomatikman.
          if (!loggedOut && !stopped) {
            console.log(
              "🔄 TOPFEROS MD: Reconnecting in 5 seconds..."
            );

            scheduleReconnect();

          } else if (loggedOut) {
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
            !data?.messages
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
    // 🛑 CATCH SOCKET ERROR
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on(
      "connection.update",
      (update) => {
        if (
          update?.connection === "connecting"
        ) {
          console.log(
            "🟡 TOPFEROS MD: Connecting to WhatsApp..."
          );
        }
      }
    );

    starting = false;

    return sock;

  } catch (error) {
    starting = false;
    sock = null;

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