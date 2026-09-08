"use strict";

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");

const sessionManager = require("./sessionManager");
const settingsPanel = require("../settings/panel");
const messageHandler = require("./messageHandler");
const config = require("../config");

// ======================================================
// TOPFEROS MD — MULTI SESSION CONNECTION V2
// ======================================================
//
// Chak WhatsApp account genyen:
// - pwòp sessionId
// - pwòp socket
// - pwòp auth directory
// - pwòp pairing code
// - pwòp reconnect timer
// - pwòp settings
//
// ======================================================

// ======================================================
// GLOBAL STATE
// ======================================================

const reconnectTimers = new Map();
const startingSessions = new Set();
const stoppedSessions = new Set();

// ======================================================
// DEFAULT PHONE NUMBER
// ======================================================

const DEFAULT_PHONE_NUMBER = String(
  config?.whatsapp?.phoneNumber ||
    process.env.WHATSAPP_NUMBER ||
    ""
).replace(/\D/g, "");

// ======================================================
// PHONE NUMBER
// ======================================================

function cleanPhoneNumber(number) {
  return sessionManager.cleanPhoneNumber(
    number
  );
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

  if (
    !/^\d{8,15}$/.test(cleaned)
  ) {
    return {
      valid: false,
      number: cleaned,
      message:
        "WhatsApp phone number lan pa valid."
    };
  }

  return {
    valid: true,
    number: cleaned,
    message: ""
  };
}

// ======================================================
// DELAY
// ======================================================

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

// ======================================================
// SOCKET PHONE
// ======================================================

function getSocketPhoneNumber(socket) {
  try {
    if (!socket?.user?.id) {
      return "";
    }

    return cleanPhoneNumber(
      String(socket.user.id)
        .split(":")[0]
        .split("@")[0]
    );
  } catch {
    return "";
  }
}

// ======================================================
// LOG
// ======================================================

function logSession(
  sessionId,
  message
) {
  console.log(
    `[TOPFEROS MD][SESSION ${sessionId}] ${message}`
  );
}

// ======================================================
// CLEAR RECONNECT TIMER
// ======================================================

function clearReconnectTimer(
  sessionId
) {
  const timer =
    reconnectTimers.get(
      sessionId
    );

  if (timer) {
    clearTimeout(timer);

    reconnectTimers.delete(
      sessionId
    );
  }
}

// ======================================================
// MESSAGE HANDLER
// ======================================================

async function handleMessages(
  sessionId,
  messages
) {
  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    return;
  }

  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    return;
  }

  const socket =
    session.socket;

  if (!socket) {
    return;
  }

  for (
    const message of messages
  ) {
    try {
      if (
        typeof messageHandler?.handleMessage ===
        "function"
      ) {
        await messageHandler.handleMessage(
          socket,
          message,
          sessionId
        );
      }
    } catch (error) {
      console.error(
        `[SESSION ${sessionId}] ❌ MESSAGE HANDLER ERROR:`,
        error?.message || error
      );
    }
  }
}

// ======================================================
// RECONNECT
// ======================================================

function scheduleReconnect(
  sessionId
) {
  if (!sessionId) {
    return;
  }

  if (
    stoppedSessions.has(
      sessionId
    )
  ) {
    return;
  }

  if (
    reconnectTimers.has(
      sessionId
    )
  ) {
    return;
  }

  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    return;
  }

  logSession(
    sessionId,
    "🔄 Reconnecting in 5 seconds..."
  );

  const timer =
    setTimeout(
      async () => {
        reconnectTimers.delete(
          sessionId
        );

        if (
          stoppedSessions.has(
            sessionId
          )
        ) {
          return;
        }

        try {
          await startSession(
            sessionId
          );
        } catch (error) {
          console.error(
            `[SESSION ${sessionId}] ❌ RECONNECT ERROR:`,
            error?.message || error
          );

          scheduleReconnect(
            sessionId
          );
        }
      },
      5000
    );

  reconnectTimers.set(
    sessionId,
    timer
  );
}

// ======================================================
// WAIT FOR SOCKET
// ======================================================

async function waitForSocket(
  sessionId,
  timeout = 15000
) {
  const startedAt =
    Date.now();

  while (
    Date.now() - startedAt <
    timeout
  ) {
    const session =
      sessionManager.getSession(
        sessionId
      );

    if (!session) {
      return false;
    }

    const socket =
      session.socket;

    if (!socket) {
      await sleep(300);
      continue;
    }

    if (socket.user) {
      return false;
    }

    if (
      typeof socket.requestPairingCode ===
      "function"
    ) {
      return true;
    }

    await sleep(300);
  }

  const session =
    sessionManager.getSession(
      sessionId
    );

  return Boolean(
    session?.socket &&
      typeof session.socket
        .requestPairingCode ===
        "function"
  );
}

// ======================================================
// CREATE SESSION
// ======================================================

function createSession(
  number = ""
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

  const existing =
    sessionManager.getSessionByNumber(
      validation.number
    );

  if (existing) {
    if (
      existing.connected ||
      existing.socket?.user
    ) {
      throw new Error(
        "Nimewo WhatsApp sa a deja konekte sou TOPFEROS MD."
      );
    }

    if (
      existing.pairing?.inProgress
    ) {
      return existing;
    }

    return existing;
  }

  return sessionManager.createSession({
    number:
      validation.number
  });
}

// ======================================================
// CREATE SOCKET
// ======================================================

async function createSocket(
  sessionId
) {
  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    throw new Error(
      "Session pa egziste."
    );
  }

  const {
    state,
    saveCreds
  } =
    await useMultiFileAuthState(
      session.authDir
    );

  // ====================================================
  // BAILEYS VERSION
  // ====================================================

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
      version =
        latest.version;
    }
  } catch (error) {
    logSession(
      sessionId,
      "⚠️ Could not fetch latest Baileys version."
    );
  }

  // ====================================================
  // SOCKET OPTIONS
  // ====================================================

  const socketOptions = {
    auth: state,

    logger: pino({
      level: "silent"
    }),

    browser:
      Browsers?.ubuntu("Chrome") ||
      [
        "Ubuntu",
        "Chrome",
        "20.0.04"
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

  // ====================================================
  // CREATE
  // ====================================================

  const socket =
    makeWASocket(
      socketOptions
    );

  sessionManager.setSocket(
    sessionId,
    socket
  );

  socket.ev.on(
    "creds.update",
    saveCreds
  );

  return socket;
}

// ======================================================
// START ONE SESSION
// ======================================================

async function startSession(
  sessionId
) {
  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    throw new Error(
      `Session ${sessionId} pa egziste.`
    );
  }

  if (
    startingSessions.has(
      sessionId
    )
  ) {
    return session.socket;
  }

  if (
    session.socket &&
    session.socket.user
  ) {
    sessionManager.setStatus(
      sessionId,
      "open",
      true
    );

    return session.socket;
  }

  startingSessions.add(
    sessionId
  );

  stoppedSessions.delete(
    sessionId
  );

  clearReconnectTimer(
    sessionId
  );

  try {
    sessionManager.setStatus(
      sessionId,
      "connecting",
      false
    );

    logSession(
      sessionId,
      "🟡 Connecting to WhatsApp..."
    );

    const socket =
      await createSocket(
        sessionId
      );

    // ==================================================
    // CONNECTION UPDATE
    // ==================================================

    socket.ev.on(
      "connection.update",
      async update => {
        try {
          const {
            connection,
            lastDisconnect
          } = update;

          // ==========================================
          // CONNECTING
          // ==========================================

          if (
            connection ===
            "connecting"
          ) {
            sessionManager.setStatus(
              sessionId,
              "connecting",
              false
            );

            logSession(
              sessionId,
              "🟡 WhatsApp connecting..."
            );
          }

          // ==========================================
          // OPEN
          // ==========================================

          if (
            connection ===
            "open"
          ) {
            const currentSession =
              sessionManager.getSession(
                sessionId
              );

            if (!currentSession) {
              return;
            }

            const connectedNumber =
              getSocketPhoneNumber(
                socket
              );

            if (connectedNumber) {
              sessionManager.setNumber(
                sessionId,
                connectedNumber
              );
            }

            sessionManager.setStatus(
              sessionId,
              "open",
              true
            );

            sessionManager.clearPairingState(
              sessionId
            );

            startingSessions.delete(
              sessionId
            );

            stoppedSessions.delete(
              sessionId
            );

            console.log("");

            console.log(
              "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            );

            console.log(
              `🟢 TOPFEROS MD: Session ${sessionId} connected.`
            );

            console.log(
              "📱 WhatsApp: ONLINE"
            );

            if (
              connectedNumber
            ) {
              console.log(
                `📞 Connected account: ${connectedNumber}`
              );
            }

            console.log(
              "👥 TOPFEROS MD: Session active."
            );

            console.log(
              "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            );

            console.log("");

            // ========================================
            // SETTINGS PANEL
            // ========================================

            try {
              if (
                typeof settingsPanel?.setBotConnected ===
                "function"
              ) {
                settingsPanel.setBotConnected(
                  socket,
                  sessionId
                );
              }
            } catch (error) {
              console.error(
                `[SESSION ${sessionId}] ❌ SETTINGS PANEL ERROR:`,
                error?.message || error
              );
            }

            return;
          }

          // ==========================================
          // CLOSE
          // ==========================================

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

            logSession(
              sessionId,
              "🔴 WhatsApp disconnected."
            );

            logSession(
              sessionId,
              `📌 Status code: ${
                statusCode ||
                "unknown"
              }`
            );

            // ========================================
            // SETTINGS PANEL
            // ========================================

            try {
              if (
                typeof settingsPanel?.setBotDisconnected ===
                "function"
              ) {
                settingsPanel.setBotDisconnected(
                  socket,
                  loggedOut,
                  sessionId
                );
              }
            } catch (error) {
              console.error(
                `[SESSION ${sessionId}] ❌ SETTINGS DISCONNECT ERROR:`,
                error?.message || error
              );
            }

            // ========================================
            // CLEAR ONLY CURRENT SOCKET
            // ========================================

            const activeSocket =
              sessionManager.getSocket(
                sessionId
              );

            if (
              activeSocket ===
              socket
            ) {
              sessionManager.setSocket(
                sessionId,
                null
              );
            }

            startingSessions.delete(
              sessionId
            );

            // ========================================
            // LOGGED OUT
            // ========================================

            if (loggedOut) {
              sessionManager.setStatus(
                sessionId,
                "logged_out",
                false
              );

              sessionManager.clearPairingState(
                sessionId
              );

              logSession(
                sessionId,
                "❌ WhatsApp session logged out."
              );

              /*
               * Pa efase session folder la otomatikman.
               * Sa pèmèt nou kontwole re-pairing lan
               * nan panel/connection layer la.
               */

              return;
            }

            // ========================================
            // NORMAL DISCONNECT
            // ========================================

            sessionManager.setStatus(
              sessionId,
              "disconnected",
              false
            );

            if (
              !stoppedSessions.has(
                sessionId
              )
            ) {
              scheduleReconnect(
                sessionId
              );
            }
          }
        } catch (error) {
          console.error(
            `[SESSION ${sessionId}] ❌ CONNECTION UPDATE ERROR:`,
            error?.message || error
          );
        }
      }
    );

    // ==================================================
    // MESSAGES
    // ==================================================

    socket.ev.on(
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
            sessionId,
            data.messages
          );
        } catch (error) {
          console.error(
            `[SESSION ${sessionId}] ❌ MESSAGES UPSERT ERROR:`,
            error?.message || error
          );
        }
      }
    );

    return socket;
  } catch (error) {
    startingSessions.delete(
      sessionId
    );

    sessionManager.setSocket(
      sessionId,
      null
    );

    sessionManager.setStatus(
      sessionId,
      "error",
      false
    );

    console.error(
      `[SESSION ${sessionId}] ❌ WHATSAPP CONNECTION ERROR:`,
      error?.message || error
    );

    if (
      !stoppedSessions.has(
        sessionId
      )
    ) {
      scheduleReconnect(
        sessionId
      );
    }

    throw error;
  }
}

// ======================================================
// START
// ======================================================

async function start(
  sessionId = null
) {
  /*
   * Si yo bay sessionId,
   * konekte session sa sèlman.
   */
  if (sessionId) {
    if (
      !sessionManager.hasSession(
        sessionId
      )
    ) {
      throw new Error(
        "Session ID pa egziste."
      );
    }

    return startSession(
      sessionId
    );
  }

  /*
   * Pa kreye yon session vid
   * jis paske server la kòmanse.
   *
   * Si gen yon default number,
   * nou ka itilize li.
   */
  if (
    DEFAULT_PHONE_NUMBER
  ) {
    let session =
      sessionManager.getSessionByNumber(
        DEFAULT_PHONE_NUMBER
      );

    if (!session) {
      session =
        sessionManager.createSession({
          number:
            DEFAULT_PHONE_NUMBER
        });
    }

    return startSession(
      session.sessionId
    );
  }

  /*
   * Multi-session panel lan se li
   * ki pral kreye nouvo sessions.
   */
  return null;
}

// ======================================================
// REQUEST PAIRING CODE
// ======================================================

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

  // ====================================================
  // FIND EXISTING SESSION
  // ====================================================

  let session =
    sessionManager.getSessionByNumber(
      phoneNumber
    );

  // ====================================================
  // CONNECTED
  // ====================================================

  if (
    session &&
    (
      session.connected ||
      session.socket?.user
    )
  ) {
    throw new Error(
      "Nimewo WhatsApp sa a deja konekte sou TOPFEROS MD."
    );
  }

  // ====================================================
  // PAIRING ALREADY RUNNING
  // ====================================================

  if (
    session &&
    session.pairing?.inProgress
  ) {
    throw new Error(
      "Yon pairing request deja ap fèt pou nimewo sa a. Tanpri tann li fini."
    );
  }

  // ====================================================
  // CREATE SESSION
  // ====================================================

  if (!session) {
    session =
      sessionManager.createSession({
        number:
          phoneNumber
      });
  } else {
    sessionManager.setNumber(
      session.sessionId,
      phoneNumber
    );
  }

  const sessionId =
    session.sessionId;

  stoppedSessions.delete(
    sessionId
  );

  clearReconnectTimer(
    sessionId
  );

  // ====================================================
  // START PAIRING
  // ====================================================

  sessionManager.startPairing(
    sessionId,
    phoneNumber
  );

  console.log("");

  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  console.log(
    "📱 TOPFEROS MD — MULTI SESSION PAIRING"
  );

  console.log(
    `🆔 Session: ${sessionId}`
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
    // ==================================================
    // GET SOCKET
    // ==================================================

    let socket =
      sessionManager.getSocket(
        sessionId
      );

    if (!socket) {
      socket =
        await startSession(
          sessionId
        );
    }

    // ==================================================
    // WAIT
    // ==================================================

    const ready =
      await waitForSocket(
        sessionId,
        15000
      );

    if (!ready) {
      const currentSocket =
        sessionManager.getSocket(
          sessionId
        );

      if (
        currentSocket?.user
      ) {
        throw new Error(
          "WhatsApp session lan deja konekte."
        );
      }

      throw new Error(
        "WhatsApp socket la poko pare pou pwodwi pairing code."
      );
    }

    socket =
      sessionManager.getSocket(
        sessionId
      );

    if (!socket) {
      throw new Error(
        "WhatsApp socket la pa disponib."
      );
    }

    if (
      socket.user
    ) {
      throw new Error(
        "WhatsApp session lan deja konekte."
      );
    }

    if (
      typeof socket.requestPairingCode !==
      "function"
    ) {
      throw new Error(
        "Baileys version sa a pa sipòte requestPairingCode()."
      );
    }

    // ==================================================
    // REQUEST REAL CODE
    // ==================================================

    logSession(
      sessionId,
      "🔐 Asking WhatsApp for a fresh pairing code..."
    );

    const pairingCode =
      await socket.requestPairingCode(
        phoneNumber
      );

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

    // ==================================================
    // SAVE CODE
    // ==================================================

    sessionManager.setPairingCode(
      sessionId,
      normalizedCode
    );

    console.log("");

    console.log(
      "╔════════════════════════════════════════════╗"
    );

    console.log(
      "║      🔐 TOPFEROS MD PAIRING CODE          ║"
    );

    console.log(
      "╠════════════════════════════════════════════╣"
    );

    console.log(
      `║ Session: ${sessionId}`
    );

    console.log(
      `║ Number : ${phoneNumber}`
    );

    console.log(
      `║ CODE   : ${normalizedCode}`
    );

    console.log(
      "╚════════════════════════════════════════════╝"
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
      "→ Connecter avec yon nimewo telefòn"
    );

    console.log(
      "→ Mete pairing code ki parèt sou panel la."
    );

    console.log("");

    return {
      sessionId,
      number: phoneNumber,
      code: normalizedCode
    };
  } catch (error) {
    console.error(
      `[SESSION ${sessionId}] ❌ PAIRING CODE ERROR:`,
      error?.message || error
    );

    sessionManager.clearPairingState(
      sessionId
    );

    /*
     * Si pairing lan echwe, pa kite
     * yon socket ki ka bloke pwochen request la.
     */
    const socket =
      sessionManager.getSocket(
        sessionId
      );

    if (
      socket &&
      !socket.user
    ) {
      try {
        if (
          typeof socket.end ===
          "function"
        ) {
          socket.end(
            undefined
          );
        }
      } catch {}
    }

    sessionManager.setSocket(
      sessionId,
      null
    );

    sessionManager.setStatus(
      sessionId,
      "disconnected",
      false
    );

    throw error;
  }
}

// ======================================================
// GET SESSION
// ======================================================

function getSession(
  sessionId
) {
  return sessionManager.getSession(
    sessionId
  );
}

// ======================================================
// GET SOCKET
// ======================================================

function getSocket(
  sessionId = null
) {
  /*
   * Specific session.
   */
  if (sessionId) {
    return sessionManager.getSocket(
      sessionId
    );
  }

  /*
   * Backward compatibility:
   * premye socket aktif.
   */
  for (
    const session of
      sessionManager.getAllSessions()
  ) {
    if (
      session.socket
    ) {
      return session.socket;
    }
  }

  return null;
}

// ======================================================
// GET ALL SESSIONS
// ======================================================

function getAllSessions() {
  return sessionManager.getAllPublicSessions();
}

// ======================================================
// CONNECTION STATUS
// ======================================================

function isConnected(
  sessionId = null
) {
  /*
   * Specific session.
   */
  if (sessionId) {
    return sessionManager.isConnected(
      sessionId
    );
  }

  /*
   * Any connected session.
   */
  for (
    const session of
      sessionManager.getAllSessions()
  ) {
    if (
      session.connected &&
      session.socket?.user
    ) {
      return true;
    }
  }

  return false;
}

// ======================================================
// PHONE NUMBER
// ======================================================

function getPhoneNumber(
  sessionId = null
) {
  if (sessionId) {
    const session =
      sessionManager.getSession(
        sessionId
      );

    if (!session) {
      return "";
    }

    if (
      session.socket?.user?.id
    ) {
      return getSocketPhoneNumber(
        session.socket
      );
    }

    return (
      session.number ||
      ""
    );
  }

  /*
   * Backward compatibility.
   */
  for (
    const session of
      sessionManager.getAllSessions()
  ) {
    if (
      session.socket?.user?.id
    ) {
      return getSocketPhoneNumber(
        session.socket
      );
    }
  }

  return DEFAULT_PHONE_NUMBER;
}

// ======================================================
// PAIRING INFO
// ======================================================

function getPairingInfo(
  sessionId = null
) {
  /*
   * Specific session.
   */
  if (sessionId) {
    return (
      sessionManager.getPairingInfo(
        sessionId
      ) || {
        sessionId,
        inProgress: false,
        number: "",
        code: "",
        createdAt: 0
      }
    );
  }

  /*
   * All sessions.
   */
  return sessionManager
    .getAllSessions()
    .map(session => ({
      sessionId:
        session.sessionId,

      inProgress:
        Boolean(
          session.pairing?.inProgress
        ),

      number:
        session.pairing?.number ||
        session.number ||
        "",

      code:
        session.pairing?.code ||
        "",

      createdAt:
        session.pairing?.createdAt ||
        0
    }));
}

// ======================================================
// STOP ONE SESSION
// ======================================================

async function stopSession(
  sessionId
) {
  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    return false;
  }

  stoppedSessions.add(
    sessionId
  );

  clearReconnectTimer(
    sessionId
  );

  startingSessions.delete(
    sessionId
  );

  const socket =
    session.socket;

  // ====================================================
  // SETTINGS PANEL
  // ====================================================

  if (socket) {
    try {
      if (
        typeof settingsPanel?.setBotDisconnected ===
        "function"
      ) {
        settingsPanel.setBotDisconnected(
          socket,
          false,
          sessionId
        );
      }
    } catch (error) {
      console.error(
        `[SESSION ${sessionId}] ❌ SETTINGS STOP ERROR:`,
        error?.message || error
      );
    }
  }

  // ====================================================
  // CLOSE SOCKET
  // ====================================================

  if (socket) {
    try {
      if (
        typeof socket.end ===
        "function"
      ) {
        socket.end(
          undefined
        );
      }
    } catch (error) {
      console.error(
        `[SESSION ${sessionId}] ❌ SOCKET STOP ERROR:`,
        error?.message || error
      );
    }
  }

  sessionManager.setSocket(
    sessionId,
    null
  );

  sessionManager.setStatus(
    sessionId,
    "stopped",
    false
  );

  sessionManager.clearPairingState(
    sessionId
  );

  logSession(
    sessionId,
    "🛑 WhatsApp session stopped."
  );

  return true;
}

// ======================================================
// STOP ALL
// ======================================================

async function stop() {
  const activeSessions =
    sessionManager.getAllSessions();

  for (
    const session of
      activeSessions
  ) {
    await stopSession(
      session.sessionId
    );
  }

  console.log(
    "🛑 TOPFEROS MD: All WhatsApp sessions stopped."
  );
}

// ======================================================
// RESTORE STORED SESSIONS
// ======================================================

function restoreStoredSessions() {
  const ids =
    sessionManager.getStoredSessionIds();

  const restored = [];

  for (
    const sessionId of ids
  ) {
    try {
      const session =
        sessionManager.restoreSession(
          sessionId
        );

      if (session) {
        restored.push(
          session
        );
      }
    } catch (error) {
      console.error(
        `[SESSION ${sessionId}] ❌ RESTORE ERROR:`,
        error?.message || error
      );
    }
  }

  return restored;
}

// ======================================================
// REMOVE SESSION
// ======================================================

async function removeSession(
  sessionId,
  options = {}
) {
  clearReconnectTimer(
    sessionId
  );

  stoppedSessions.add(
    sessionId
  );

  startingSessions.delete(
    sessionId
  );

  await stopSession(
    sessionId
  );

  /*
   * Retire sessionId from stopped set
   * because it no longer exists.
   */
  stoppedSessions.delete(
    sessionId
  );

  return sessionManager.removeSession(
    sessionId,
    options
  );
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  // Startup
  start,
  startSession,

  // Stop
  stop,
  stopSession,

  // Pairing
  requestPairingCode,
  getPairingInfo,

  // Sessions
  createSession,
  getSession,
  getAllSessions,
  restoreStoredSessions,
  removeSession,

  // Socket
  getSocket,

  // Status
  isConnected,
  getPhoneNumber,

  // Phone
  cleanPhoneNumber,
  validatePhoneNumber
};