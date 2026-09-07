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

const settingsPanel = require("../settings/panel");
const messageHandler = require("./messageHandler");
const config = require("../config");

// ======================================================
// TOPFEROS MD — WHATSAPP CONNECTION
// Stable Pairing Code System
// ======================================================

const AUTH_DIR = path.join(
  __dirname,
  "..",
  "auth"
);

// ------------------------------------------------------
// SOCKET STATE
// ------------------------------------------------------

let sock = null;

let starting = false;
let stopped = false;

let reconnectTimer = null;

// ------------------------------------------------------
// PAIRING STATE
// ------------------------------------------------------

// Anpeche plizyè pairing request an menm tan.
let pairingInProgress = false;

// Nimewo ki gen pairing request aktif la.
let pairingNumber = "";

// Dènye pairing code ki te pwodwi.
let activePairingCode = "";

// Lè active pairing code la te pwodwi.
let pairingCreatedAt = 0;

// Cooldown apre yon code fin pwodwi.
// 90 segonn pou evite spam/repeated requests.
const PAIRING_COOLDOWN = 90 * 1000;

// Code la pa dwe konsidere aktif pou tout tan.
// Apre 2 minit, yon nouvo request ka fèt.
const PAIRING_CACHE_TIME = 2 * 60 * 1000;

// ------------------------------------------------------
// DEFAULT PHONE NUMBER
// ------------------------------------------------------

const DEFAULT_PHONE_NUMBER =
  String(
    config?.whatsapp?.phoneNumber ||
    process.env.WHATSAPP_NUMBER ||
    ""
  ).replace(/\D/g, "");

// ======================================================
// AUTH DIRECTORY
// ======================================================

function prepareAuthDirectory() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, {
      recursive: true
    });
  }
}

// ======================================================
// PHONE NUMBER HELPERS
// ======================================================

function cleanPhoneNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}

function validatePhoneNumber(number) {
  const cleaned = cleanPhoneNumber(number);

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

  if (cleaned.length > 15) {
    return {
      valid: false,
      number: cleaned,
      message:
        "WhatsApp phone number lan twò long."
    };
  }

  return {
    valid: true,
    number: cleaned,
    message: ""
  };
}

// ======================================================
// PAIRING STATE RESET
// ======================================================

function clearPairingState(options = {}) {
  const {
    clearCache = false
  } = options;

  pairingInProgress = false;
  pairingNumber = "";

  if (clearCache) {
    activePairingCode = "";
    pairingCreatedAt = 0;
  }
}

// ======================================================
// PAIRING CACHE CHECK
// ======================================================

function getCachedPairingCode(number) {
  const phoneNumber =
    cleanPhoneNumber(number);

  if (
    !activePairingCode ||
    !pairingCreatedAt ||
    !pairingNumber
  ) {
    return null;
  }

  const age =
    Date.now() - pairingCreatedAt;

  // Cache expired.
  if (age >= PAIRING_CACHE_TIME) {
    clearPairingState({
      clearCache: true
    });

    return null;
  }

  // Pa sèvi ak code yon lòt nimewo.
  if (
    pairingNumber !== phoneNumber
  ) {
    return null;
  }

  return activePairingCode;
}

// ======================================================
// PAIRING COOLDOWN
// ======================================================

function getPairingCooldownRemaining(number) {
  const phoneNumber =
    cleanPhoneNumber(number);

  if (
    !pairingCreatedAt ||
    !pairingNumber ||
    pairingNumber !== phoneNumber
  ) {
    return 0;
  }

  const elapsed =
    Date.now() - pairingCreatedAt;

  const remaining =
    PAIRING_COOLDOWN - elapsed;

  return Math.max(
    0,
    remaining
  );
}

// ======================================================
// MESSAGE HANDLER
// ======================================================

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

// ======================================================
// RECONNECT
// ======================================================

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

      if (stopped) {
        return;
      }

      try {
        await start();
      } catch (error) {
        console.error(
          "❌ RECONNECT ERROR:",
          error?.message || error
        );

        if (!stopped) {
          scheduleReconnect();
        }
      }
    },
    5000
  );
}

// ======================================================
// START WHATSAPP
// ======================================================

async function start() {
  // Pa kreye plizyè socket.
  if (starting) {
    return sock;
  }

  // Si deja konekte, pa rekonekte.
  if (sock && sock.user) {
    return sock;
  }

  starting = true;
  stopped = false;

  try {
    prepareAuthDirectory();

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      AUTH_DIR
    );

    // --------------------------------------------------
    // GET BAILEYS VERSION
    // --------------------------------------------------

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
      console.log(
        "⚠️ Could not fetch latest Baileys version. Using default version."
      );
    }

    // --------------------------------------------------
    // SOCKET OPTIONS
    // --------------------------------------------------

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
      socketOptions.version = version;
    }

    // --------------------------------------------------
    // CREATE SOCKET
    // --------------------------------------------------

    sock = makeWASocket(
      socketOptions
    );

    // --------------------------------------------------
    // SAVE CREDENTIALS
    // --------------------------------------------------

    sock.ev.on(
      "creds.update",
      saveCreds
    );

    // ==================================================
    // CONNECTION UPDATE
    // ==================================================

    sock.ev.on(
      "connection.update",
      async (update) => {
        try {
          const {
            connection,
            lastDisconnect
          } = update;

          // --------------------------------------------
          // CONNECTING
          // --------------------------------------------

          if (
            connection === "connecting"
          ) {
            console.log(
              "🟡 TOPFEROS MD: Connecting to WhatsApp..."
            );
          }

          // --------------------------------------------
          // OPEN
          // --------------------------------------------

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
              sock?.user?.id
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

            // ------------------------------------------
            // SETTINGS PANEL
            // ------------------------------------------

            try {
              settingsPanel.setBotConnected(
                sock
              );
            } catch (error) {
              console.error(
                "❌ SETTINGS PANEL CONNECTION ERROR:",
                error?.message || error
              );
            }

            // ------------------------------------------
            // CLEAR PAIRING STATE
            // ------------------------------------------

            clearPairingState({
              clearCache: true
            });

            starting = false;
            stopped = false;

            return;
          }

          // --------------------------------------------
          // CLOSE
          // --------------------------------------------

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

            console.log("");

            console.log(
              "🔴 TOPFEROS MD: WhatsApp disconnected."
            );

            console.log(
              `📌 Status code: ${
                statusCode || "unknown"
              }`
            );

            // ------------------------------------------
            // SETTINGS PANEL DISCONNECT
            // ------------------------------------------

            if (sock) {
              try {
                settingsPanel.setBotDisconnected(
                  sock,
                  loggedOut
                );
              } catch (error) {
                console.error(
                  "❌ SETTINGS PANEL DISCONNECT ERROR:",
                  error?.message || error
                );
              }
            }

            // ------------------------------------------
            // REMOVE SOCKET
            // ------------------------------------------

            sock = null;

            starting = false;

            // Pairing request la pa rete aktif
            // si socket la fèmen.
            pairingInProgress = false;

            // ------------------------------------------
            // LOGGED OUT
            // ------------------------------------------

            if (loggedOut) {
              clearPairingState({
                clearCache: true
              });

              console.log(
                "❌ TOPFEROS MD: WhatsApp session logged out."
              );

              console.log(
                "⚠️ Auth session lan bezwen rekonekte."
              );

              return;
            }

            // ------------------------------------------
            // NORMAL DISCONNECT
            // ------------------------------------------

            if (!stopped) {
              console.log(
                "🔄 TOPFEROS MD: Reconnecting in 5 seconds..."
              );

              scheduleReconnect();
            }
          }
        } catch (error) {
          console.error(
            "❌ CONNECTION UPDATE ERROR:",
            error?.message || error
          );
        }
      }
    );

    // ==================================================
    // MESSAGES
    // ==================================================

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

    pairingInProgress = false;

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

// ======================================================
// REQUEST PAIRING CODE
// ======================================================

async function requestPairingCode(number) {
  // ----------------------------------------------------
  // VALIDATE NUMBER
  // ----------------------------------------------------

  const validation =
    validatePhoneNumber(number);

  if (!validation.valid) {
    throw new Error(
      validation.message
    );
  }

  const phoneNumber =
    validation.number;

  // ----------------------------------------------------
  // IF ALREADY CONNECTED
  // ----------------------------------------------------

  if (
    sock &&
    sock.user
  ) {
    throw new Error(
      "WhatsApp session lan deja konekte. Pairing Code pa disponib sou session sa a."
    );
  }

  // ----------------------------------------------------
  // ACTIVE REQUEST
  // ----------------------------------------------------

  if (pairingInProgress) {
    if (
      pairingNumber === phoneNumber &&
      activePairingCode
    ) {
      return activePairingCode;
    }

    throw new Error(
      "Yon pairing code request deja an pwogrè. Tanpri tann li fini."
    );
  }

  // ----------------------------------------------------
  // CHECK CACHED CODE
  // ----------------------------------------------------

  const cachedCode =
    getCachedPairingCode(
      phoneNumber
    );

  if (cachedCode) {
    const remaining =
      getPairingCooldownRemaining(
        phoneNumber
      );

    console.log(
      `ℹ️ TOPFEROS MD: Pairing code aktif toujou. ${Math.ceil(
        remaining / 1000
      )}s cooldown rete.`
    );

    return cachedCode;
  }

  // ----------------------------------------------------
  // COOLDOWN
  // ----------------------------------------------------

  const cooldownRemaining =
    getPairingCooldownRemaining(
      phoneNumber
    );

  if (
    cooldownRemaining > 0
  ) {
    const seconds =
      Math.ceil(
        cooldownRemaining / 1000
      );

    throw new Error(
      `Tanpri tann ${seconds} segonn anvan ou mande yon nouvo pairing code.`
    );
  }

  // ----------------------------------------------------
  // START SOCKET IF NEEDED
  // ----------------------------------------------------

  if (!sock) {
    await start();
  }

  if (!sock) {
    throw new Error(
      "WhatsApp socket pa disponib."
    );
  }

  // ----------------------------------------------------
  // CHECK AGAIN AFTER START
  // ----------------------------------------------------

  if (
    sock.user
  ) {
    throw new Error(
      "WhatsApp session lan deja konekte. Pairing Code pa disponib sou session sa a."
    );
  }

  // ----------------------------------------------------
  // BAILEYS SUPPORT
  // ----------------------------------------------------

  if (
    typeof sock.requestPairingCode !==
    "function"
  ) {
    throw new Error(
      "Baileys version sa a pa sipòte requestPairingCode()."
    );
  }

  // ----------------------------------------------------
  // SET PAIRING STATE BEFORE REQUEST
  // ----------------------------------------------------

  pairingInProgress = true;
  pairingNumber = phoneNumber;

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
    "⏳ Preparing WhatsApp pairing request..."
  );

  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  try {
    // --------------------------------------------------
    // SMALL DELAY
    // --------------------------------------------------

    // Bay socket la yon ti moman pou initialize.
    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          1500
        )
    );

    if (!sock) {
      throw new Error(
        "WhatsApp socket la disparèt pandan pairing."
      );
    }

    if (
      sock.user
    ) {
      throw new Error(
        "WhatsApp session lan deja konekte."
      );
    }

    // --------------------------------------------------
    // REQUEST REAL WHATSAPP CODE
    // --------------------------------------------------

    const pairingCode =
      await sock.requestPairingCode(
        phoneNumber
      );

    // --------------------------------------------------
    // VALIDATE RESPONSE
    // --------------------------------------------------

    if (
      pairingCode ===
      undefined ||
      pairingCode ===
      null
    ) {
      throw new Error(
        "WhatsApp pa retounen pairing code."
      );
    }

    // Pa modifye code WhatsApp la.
    // Nou sèlman retire espas ki ka vini alantou li.
    const normalizedCode =
      String(pairingCode).trim();

    if (!normalizedCode) {
      throw new Error(
        "WhatsApp retounen yon pairing code vid."
      );
    }

    // --------------------------------------------------
    // SAVE ACTIVE CODE
    // --------------------------------------------------

    activePairingCode =
      normalizedCode;

    pairingNumber =
      phoneNumber;

    pairingCreatedAt =
      Date.now();

    // --------------------------------------------------
    // DISPLAY CODE
    // --------------------------------------------------

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

    console.log(
      "⏳ Pairing cooldown: 90 seconds."
    );

    return normalizedCode;

  } catch (error) {
    console.error(
      "❌ PAIRING CODE ERROR:",
      error?.message || error
    );

    // Si request la echwe,
    // pa kite yon fo code cache.
    activePairingCode = "";
    pairingCreatedAt = 0;

    throw error;

  } finally {
    pairingInProgress = false;
  }
}

// ======================================================
// STOP
// ======================================================

async function stop() {
  stopped = true;

  // ----------------------------------------------------
  // CANCEL RECONNECT
  // ----------------------------------------------------

  if (reconnectTimer) {
    clearTimeout(
      reconnectTimer
    );

    reconnectTimer = null;
  }

  // ----------------------------------------------------
  // SETTINGS DISCONNECT
  // ----------------------------------------------------

  if (sock) {
    try {
      settingsPanel.setBotDisconnected(
        sock,
        true
      );
    } catch (error) {
      console.error(
        "❌ SETTINGS PANEL STOP ERROR:",
        error?.message || error
      );
    }
  }

  // ----------------------------------------------------
  // CLOSE SOCKET
  // ----------------------------------------------------

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

  // ----------------------------------------------------
  // RESET
  // ----------------------------------------------------

  sock = null;

  starting = false;

  pairingInProgress = false;

  clearPairingState({
    clearCache: true
  });

  console.log(
    "🛑 TOPFEROS MD: WhatsApp connection stopped."
  );
}

// ======================================================
// GET SOCKET
// ======================================================

function getSocket() {
  return sock;
}

// ======================================================
// CONNECTION STATUS
// ======================================================

function isConnected() {
  return !!(
    sock &&
    sock.user
  );
}

// ======================================================
// GET PHONE NUMBER
// ======================================================

function getPhoneNumber() {
  if (
    sock &&
    sock.user &&
    sock.user.id
  ) {
    return cleanPhoneNumber(
      sock.user.id
        .split(":")[0]
        .split("@")[0]
    );
  }

  return DEFAULT_PHONE_NUMBER;
}

// ======================================================
// GET PAIRING STATUS
// ======================================================

function getPairingStatus() {
  const cooldownRemaining =
    pairingNumber
      ? getPairingCooldownRemaining(
          pairingNumber
        )
      : 0;

  return {
    inProgress:
      pairingInProgress,

    number:
      pairingNumber,

    hasActiveCode:
      !!activePairingCode,

    cooldownRemaining,

    cooldownSeconds:
      Math.ceil(
        cooldownRemaining / 1000
      )
  };
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  start,
  stop,

  getSocket,

  isConnected,

  getPhoneNumber,

  requestPairingCode,

  getPairingStatus
};
  