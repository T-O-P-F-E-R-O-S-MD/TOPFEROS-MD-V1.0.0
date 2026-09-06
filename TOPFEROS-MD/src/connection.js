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

const settingsPanel = require("../settings/panel");
const messageHandler = require("./messageHandler");
const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 AUTH DIRECTORY
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
// 📱 DEFAULT PHONE NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_PHONE_NUMBER =
  String(
    config?.whatsapp?.phoneNumber ||
    process.env.WHATSAPP_NUMBER ||
    ""
  ).replace(/\D/g, "");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 PREPARE AUTH DIRECTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function prepareAuthDirectory() {

  if (!fs.existsSync(AUTH_DIR)) {

    fs.mkdirSync(
      AUTH_DIR,
      {
        recursive: true
      }
    );

  }

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 CLEAN PHONE NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanPhoneNumber(number) {

  return String(number || "")
    .replace(/\D/g, "");

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 VALIDATE PHONE NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function validatePhoneNumber(number) {

  const cleaned =
    cleanPhoneNumber(number);

  if (!cleaned) {

    return {
      valid: false,
      number: "",
      message:
        "WhatsApp phone number obligatwa."
    };

  }

  if (cleaned.length < 8) {

    return {
      valid: false,
      number: cleaned,
      message:
        "WhatsApp phone number lan pa sanble valid."
    };

  }

  return {
    valid: true,
    number: cleaned,
    message: ""
  };

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏳ WAIT FOR SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function waitForSocketReady(timeout = 15000) {

  return new Promise(
    (resolve, reject) => {

      if (!sock) {

        reject(
          new Error(
            "WhatsApp socket pa disponib."
          )
        );

        return;

      }

      let finished = false;
      let timer = null;

      const finish = (
        callback,
        value
      ) => {

        if (finished) {
          return;
        }

        finished = true;

        if (timer) {

          clearTimeout(timer);
          timer = null;

        }

        if (
          sock &&
          sock.ev &&
          typeof sock.ev.off === "function"
        ) {

          sock.ev.off(
            "connection.update",
            onUpdate
          );

        }

        callback(value);

      };

      const onUpdate = (
        update
      ) => {

        const state =
          update?.connection;

        if (state === "open") {

          finish(
            resolve,
            true
          );

          return;

        }

        if (state === "close") {

          finish(
            reject,
            new Error(
              "WhatsApp connection closed before pairing code was generated."
            )
          );

        }

      };

      if (
        sock.ev &&
        typeof sock.ev.on === "function"
      ) {

        sock.ev.on(
          "connection.update",
          onUpdate
        );

      }

      timer =
        setTimeout(
          () => {

            finish(
              reject,
              new Error(
                "WhatsApp connection pa pare nan tan li te bay la."
              )
            );

          },
          timeout
        );

    }
  );

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📨 MESSAGE HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleMessages(
  messages
) {

  if (
    !messages ||
    !Array.isArray(messages) ||
    messages.length === 0
  ) {

    return;

  }

  for (
    const message of messages
  ) {

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

  reconnectTimer =
    setTimeout(
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
    } =
      await useMultiFileAuthState(
        AUTH_DIR
      );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📡 BAILEYS VERSION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let version;

    try {

      const latest =
        await fetchLatestBaileysVersion();

      version =
        latest.version;

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

      logger:
        pino({
          level: "silent"
        }),

      browser:
        Browsers?.ubuntu("TOPFEROS MD") ||
        [
          "TOPFEROS MD",
          "Chrome",
          "1.0.0"
        ],

      printQRInTerminal: false,

      markOnlineOnConnect: false,

      syncFullHistory: false,

      generateHighQualityLinkPreview: false

    };

    if (version) {

      socketOptions.version =
        version;

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

          if (
            sock.user?.id
          ) {

            console.log(
              `📞 Connected account: ${sock.user.id}`
            );

          }

          console.log(
            "👥 TOPFEROS MD: Session active."
          );

          console.log(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          );

          console.log("");

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
            !Array.isArray(
              data.messages
            )
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
// 🔐 REQUEST REAL WHATSAPP PAIRING CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function requestPairingCode(
  number
) {

  const validation =
    validatePhoneNumber(
      number
    );

  if (!validation.valid) {

    throw new Error(
      validation.message
    );

  }

  const phoneNumber =
    validation.number;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔒 PAIRING ALREADY REQUESTED
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (pairingRequested) {

    throw new Error(
      "Yon pairing code request deja an pwogrè. Tanpri tann li fini."
    );

  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔌 START SOCKET SI LI PA EXISTE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!sock) {

    await start();

  }

  if (!sock) {

    throw new Error(
      "WhatsApp socket pa disponib."
    );

  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📱 SESSION DEJA REGISTERED
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (
    sock.user
  ) {

    throw new Error(
      "WhatsApp session lan deja konekte. Pairing Code pa disponib sou session sa a."
    );

  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔎 VERIFY METHOD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (
    typeof sock.requestPairingCode !==
    "function"
  ) {

    throw new Error(
      "Baileys version sa a pa sipòte requestPairingCode()."
    );

  }

  console.log("");

  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  console.log(
    "📱 TOPFEROS MD — WHATSAPP PAIRING"
  );

  console.log(
    `📞 Number: ${phoneNumber}`
  );

  console.log(
    "⏳ Waiting for WhatsApp socket..."
  );

  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  try {

    pairingRequested = true;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⏳ BAY SOCKET LA TAN POU LI PREPARE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await new Promise(
      (resolve) => {

        setTimeout(
          resolve,
          1500
        );

      }
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔐 REQUEST REAL CODE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const pairingCode =
      await sock.requestPairingCode(
        phoneNumber
      );

    if (!pairingCode) {

      throw new Error(
        "WhatsApp pa retounen pairing code."
      );

    }

    const normalizedCode =
      String(
        pairingCode
      )
        .replace(/\s/g, "")
        .trim();

    if (
      !normalizedCode
    ) {

      throw new Error(
        "WhatsApp retounen yon pairing code vid."
      );

    }

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
      `║  CODE: ${normalizedCode}`
    );

    console.log(
      "╚══════════════════════════════════════╝"
    );

    console.log("");

    console.log(
      "📱 WhatsApp → Linked Devices"
    );

    console.log(
      "🔢 Link with phone number instead"
    );

    console.log(
      "🔐 Mete pairing code la."
    );

    console.log("");

    return normalizedCode;

  } catch (error) {

    console.error(
      "❌ PAIRING CODE ERROR:",
      error?.message || error
    );

    throw error;

  } finally {

    pairingRequested = false;

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
      typeof sock.end ===
        "function"
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

  return DEFAULT_PHONE_NUMBER;

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  start,

  stop,

  getSocket,

  isConnected,

  getPhoneNumber,

  requestPairingCode

};