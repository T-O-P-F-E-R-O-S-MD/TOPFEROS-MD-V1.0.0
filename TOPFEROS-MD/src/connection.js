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
// REAL WHATSAPP PAIRING CODE SYSTEM
// ======================================================

const AUTH_DIR = path.join(
  __dirname,
  "..",
  "auth"
);

// ======================================================
// SOCKET STATE
// ======================================================

let sock = null;

let starting = false;
let stopped = false;

let reconnectTimer = null;

// ======================================================
// PAIRING STATE
// ======================================================

let pairingInProgress = false;
let pairingNumber = "";
let activePairingCode = "";
let pairingCreatedAt = 0;

// ======================================================
// DEFAULT PHONE NUMBER
// ======================================================

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
// PHONE NUMBER
// ======================================================

function cleanPhoneNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}

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
// CLEAR PAIRING STATE
// ======================================================

function clearPairingState() {
  pairingInProgress = false;
  pairingNumber = "";
  activePairingCode = "";
  pairingCreatedAt = 0;
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
// WAIT FOR SOCKET
// ======================================================

async function waitForSocket(
  timeout = 15000
) {
  const startedAt = Date.now();

  while (
    Date.now() - startedAt <
    timeout
  ) {
    if (!sock) {
      return false;
    }

    /*
     * Si socket la deja konekte,
     * pa bezwen pairing ankò.
     */
    if (sock.user) {
      return false;
    }

    /*
     * requestPairingCode egziste.
     */
    if (
      typeof sock.requestPairingCode ===
      "function"
    ) {
      return true;
    }

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          500
        )
    );
  }

  return !!(
    sock &&
    typeof sock.requestPairingCode ===
      "function"
  );
}

// ======================================================
// START WHATSAPP
// ======================================================

async function start() {
  /*
   * Pa kreye plizyè socket an menm tan.
   */
  if (starting) {
    return sock;
  }

  /*
   * Si deja konekte,
   * sèvi ak socket ki la.
   */
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

    // ==================================================
    // BAILEYS VERSION
    // ==================================================

    let version;

    try {
      const latest =
        await fetchLatestBaileysVersion();

      if (
        latest &&
        Array.isArray(
          latest.version
        )
      ) {
        version = latest.version;
      }
    } catch (error) {
      console.log(
        "⚠️ Could not fetch latest Baileys version."
      );
    }

    // ==================================================
    // SOCKET OPTIONS
    // ==================================================

    const socketOptions = {
      auth: state,

      logger:
        pino({
          level: "silent"
        }),

      browser:
        Browsers?.ubuntu(
          "TOPFEROS MD"
        ) ||
        [
          "TOPFEROS MD",
          "Chrome",
          "1.0.0"
        ],

      printQRInTerminal: false,

      markOnlineOnConnect: false,

      syncFullHistory: false,

      generateHighQualityLinkPreview:
        false
    };

    if (version) {
      socketOptions.version =
        version;
    }

    // ==================================================
    // CREATE SOCKET
    // ==================================================

    sock =
      makeWASocket(
        socketOptions
      );

    // ==================================================
    // SAVE CREDENTIALS
    // ==================================================

    sock.ev.on(
      "creds.update",
      saveCreds
    );

    // ==================================================
    // CONNECTION UPDATE
    // ==================================================

    sock.ev.on(
      "connection.update",
      async update => {
        try {
          const {
            connection,
            lastDisconnect
          } = update;

          // --------------------------------------------
          // CONNECTING
          // --------------------------------------------

          if (
            connection ===
            "connecting"
          ) {
            console.log(
              "🟡 TOPFEROS MD: Connecting to WhatsApp..."
            );
          }

          // --------------------------------------------
          // OPEN
          // --------------------------------------------

          if (
            connection ===
            "open"
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
                error?.message ||
                  error
              );
            }

            // ------------------------------------------
            // CLEAR PAIRING STATE
            // ------------------------------------------

            clearPairingState();

            starting = false;
            stopped = false;

            return;
          }

          // --------------------------------------------
          // CLOSE
          // --------------------------------------------

          if (
            connection ===
            "close"
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
                statusCode ||
                "unknown"
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
                  error?.message ||
                    error
                );
              }
            }

            // ------------------------------------------
            // REMOVE SOCKET
            // ------------------------------------------

            sock = null;

            starting = false;

            pairingInProgress =
              false;

            // ------------------------------------------
            // LOGGED OUT
            // ------------------------------------------

            if (loggedOut) {
              clearPairingState();

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
            error?.message ||
              error
          );
        }
      }
    );

    // ==================================================
    // MESSAGES
    // ==================================================

    sock.ev.on(
      "messages.upsert",
      async data => {
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
            error?.message ||
              error
          );
        }
      }
    );

  } catch (error) {
    starting = false;
    sock = null;

    pairingInProgress =
      false;

    console.error(
      "❌ WHATSAPP CONNECTION ERROR:",
      error?.message ||
        error
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
// REQUEST REAL WHATSAPP PAIRING CODE
// ======================================================

async function requestPairingCode(
  number
) {
  // ----------------------------------------------------
  // VALIDATE NUMBER
  // ----------------------------------------------------

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

  // ----------------------------------------------------
  // CHECK CONNECTED
  // ----------------------------------------------------

  if (
    sock &&
    sock.user
  ) {
    throw new Error(
      "WhatsApp session lan deja konekte. Pairing Code pa disponib."
    );
  }

  // ----------------------------------------------------
  // PREVENT DUPLICATE REQUEST
  // ----------------------------------------------------

  if (
    pairingInProgress
  ) {
    throw new Error(
      "Yon pairing request deja ap fèt. Tanpri tann li fini."
    );
  }

  // ----------------------------------------------------
  // CLEAR OLD CODE
  // ----------------------------------------------------

  /*
   * IMPORTANT:
   * Pa sèvi ak ansyen pairing code.
   * Chak nouvo request dwe mande WhatsApp
   * pou yon nouvo code.
   */

  activePairingCode = "";
  pairingCreatedAt = 0;
  pairingNumber = "";

  // ----------------------------------------------------
  // START SOCKET
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
  // CHECK IF ALREADY CONNECTED
  // ----------------------------------------------------

  if (
    sock.user
  ) {
    throw new Error(
      "WhatsApp session lan deja konekte."
    );
  }

  // ----------------------------------------------------
  // CHECK BAILEYS FUNCTION
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
  // PAIRING STATE
  // ----------------------------------------------------

  pairingInProgress =
    true;

  pairingNumber =
    phoneNumber;

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
    "⏳ Requesting REAL WhatsApp pairing code..."
  );

  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  try {
    // --------------------------------------------------
    // WAIT FOR SOCKET
    // --------------------------------------------------

    const ready =
      await waitForSocket(
        15000
      );

    if (!ready) {
      throw new Error(
        "WhatsApp socket la poko pare pou pwodwi pairing code."
      );
    }

    // --------------------------------------------------
    // CHECK AGAIN
    // --------------------------------------------------

    if (!sock) {
      throw new Error(
        "WhatsApp socket la pa disponib ankò."
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
    // REQUEST REAL CODE FROM WHATSAPP
    // ----------------------------------------------------

    console.log(
      "🔐 Asking WhatsApp for a fresh pairing code..."
    );

    const pairingCode =
      await sock.requestPairingCode(
        phoneNumber
      );

    // --------------------------------------------------
    // VALIDATE CODE
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

    const normalizedCode =
      String(
        pairingCode
      ).trim();

    if (
      !normalizedCode
    ) {
      throw new Error(
        "WhatsApp retounen yon pairing code vid."
      );
    }

    // --------------------------------------------------
    // SAVE ONLY CURRENT CODE
    // --------------------------------------------------

    activePairingCode =
      normalizedCode;

    pairingNumber =
      phoneNumber;

    pairingCreatedAt =
      Date.now();

    // --------------------------------------------------
    // LOG
    // --------------------------------------------------

    console.log("");

    console.log(
      "╔══════════════════════════════════════╗"
    );

    console.log(
      "║      🔐 TOPFEROS MD PAIRING         ║"
    );

    console.log(
      "╠══════════════════════════════════════╣"
    );

    console.log(
      `║  CODE: ${normalizedCode}              `
    );

    console.log(
      "╚══════════════════════════════════════╝"
    );

    console.log("");

    console.log(
      "📱 Sou telefòn ou:"
    );

    console.log(
      "WhatsApp → Paramètres"
    );

    console.log(
      "→ Appareils connectés"
    );

    console.log(
      "→ Connecter un appareil"
    );

    console.log(
      "→ Connecter avec un numéro de téléphone"
    );

    console.log(
      "→ Mete code ki parèt sou panel la."
    );

    console.log("");

    return normalizedCode;

  } catch (error) {
    console.error(
      "❌ PAIRING CODE ERROR:",
      error?.message ||
        error
    );

    /*
     * Pa kite okenn fo/ansyen code.
     */
    activePairingCode = "";
    pairingCreatedAt = 0;

    throw error;

  } finally {
    pairingInProgress =
      false;
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

  if (
    reconnectTimer
  ) {
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
        error?.message ||
          error
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
      error?.message ||
        error
    );
  }

  // ----------------------------------------------------
  // RESET
  // ----------------------------------------------------

  sock = null;

  starting = false;

  clearPairingState();

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
// GET PAIRING INFORMATION
// ======================================================

function getPairingInfo() {
  return {
    inProgress:
      pairingInProgress,

    number:
      pairingNumber,

    code:
      activePairingCode,

    createdAt:
      pairingCreatedAt
  };
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  start,
  stop,

  requestPairingCode,

  getSocket,
  isConnected,
  getPhoneNumber,

  getPairingInfo,

  cleanPhoneNumber,
  validatePhoneNumber
};