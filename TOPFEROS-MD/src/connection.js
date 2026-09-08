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
// TOPFEROS MD — MULTI SESSION WHATSAPP CONNECTION
// ======================================================
//
// Chak session genyen:
// - pwòp sessionId
// - pwòp socket
// - pwòp auth directory
// - pwòp pairing state
// - pwòp reconnect timer
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
  return sessionManager.cleanPhoneNumber(number);
}

function validatePhoneNumber(number) {
  const cleaned = cleanPhoneNumber(number);

  if (!cleaned) {
    return {
      valid: false,
      number: "",
      message: "WhatsApp phone number obligatwa."
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
// DELAY
// ======================================================

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

// ======================================================
// SOCKET IDENTITY
// ======================================================

function getSocketPhoneNumber(sock) {
  try {
    if (!sock?.user?.id) {
      return "";
    }

    return cleanPhoneNumber(
      String(sock.user.id)
        .split(":")[0]
        .split("@")[0]
    );
  } catch {
    return "";
  }
}

// ======================================================
// SESSION LOG
// ======================================================

function logSession(sessionId, message) {
  console.log(
    `[TOPFEROS MD][SESSION ${sessionId}] ${message}`
  );
}

// ======================================================
// MESSAGE HANDLER
// ======================================================

async function handleMessages(sessionId, messages) {
  if (
    !messages ||
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    return;
  }

  const session =
    sessionManager.getSession(sessionId);

  if (!session) {
    return;
  }

  const socket = session.socket;

  if (!socket) {
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
// CLEAR RECONNECT TIMER
// ======================================================

function clearReconnectTimer(sessionId) {
  const timer =
    reconnectTimers.get(sessionId);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(sessionId);
  }
}

// ======================================================
// RECONNECT
// ======================================================

function scheduleReconnect(sessionId) {
  if (!sessionId) {
    return;
  }

  if (stoppedSessions.has(sessionId)) {
    return;
  }

  if (reconnectTimers.has(sessionId)) {
    return;
  }

  const session =
    sessionManager.getSession(sessionId);

  if (!session) {
    return;
  }

  logSession(
    sessionId,
    "🔄 Reconnecting in 5 seconds..."
  );

  const timer = setTimeout(async () => {
    reconnectTimers.delete(sessionId);

    if (stoppedSessions.has(sessionId)) {
      return;
    }

    try {
      await startSession(sessionId);
    } catch (error) {
      console.error(
        `[SESSION ${sessionId}] ❌ RECONNECT ERROR:`,
        error?.message || error
      );

      scheduleReconnect(sessionId);
    }
  }, 5000);

  reconnectTimers.set(
    sessionId,
    timer
  );
}

// ======================================================
// WAIT FOR PAIRING READY
// ======================================================

async function waitForSocket(
  sessionId,
  timeout = 15000
) {
  const startedAt = Date.now();

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

    /*
     * Si session nan deja konekte,
     * pairing pa nesesè.
     */
    if (socket.user) {
      return false;
    }

    /*
     * Baileys disponib pou pairing.
     */
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

function createSession(number = "") {
  const validation =
    validatePhoneNumber(number);

  if (!validation.valid) {
    throw new Error(
      validation.message
    );
  }

  /*
   * IMPORTANT:
   * Nou pa itilize number kòm sessionId.
   * Chak request jwenn pwòp ID li.
   */

  const existing =
    sessionManager.getSessionByNumber(
      validation.number
    );

  if (existing) {
    /*
     * Si menm nimewo a deja konekte,
     * pa kreye yon dezyèm session pou li.
     */
    if (
      existing.connected ||
      existing.socket?.user
    ) {
      throw new Error(
        "Nimewo WhatsApp sa a deja konekte sou TOPFEROS MD."
      );
    }

    /*
     * Si yon pairing ap fèt pou menm nimewo a,
     * itilize session ki egziste a.
     */
    if (
      existing.pairing?.inProgress
    ) {
      return existing;
    }
  }

  return sessionManager.createSession({
    number: validation.number
  });
}

// ======================================================
// CREATE WHATSAPP SOCKET
// ======================================================

async function createSocket(sessionId) {
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

    /*
     * Nou itilize yon browser tuple ki estab.
     * Sa ede evite kèk pwoblèm pairing ki soti
     * nan browser label ki pa canonical.
     */
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
  // CREATE SOCKET
  // ====================================================

  const socket =
    makeWASocket(
      socketOptions
    );

  // ====================================================
  // SAVE SOCKET
  // ====================================================

  sessionManager.setSocket(
    sessionId,
    socket
  );

  // ====================================================
  // CREDENTIALS
  // ====================================================

  socket.ev.on(
    "creds.update",
    saveCreds
  );

  return socket;
}

// ======================================================
// START ONE SESSION
// ======================================================

async function startSession(sessionId) {
  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    throw new Error(
      `Session ${sessionId} pa egziste.`
    );
  }

  /*
   * Pa kite yon session kòmanse plizyè fwa.
   */
  if (
    startingSessions.has(
      sessionId
    )
  ) {
    return session.socket;
  }

  /*
   * Si socket la deja konekte,
   * retounen li.
   */
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

          // ============================================
          // CONNECTING
          // ============================================

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

          // ============================================
          // OPEN
          // ============================================

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
              try {
                sessionManager.setNumber(
                  sessionId,
                  connectedNumber
                );
              } catch (error) {
                console.error(
                  `[SESSION ${sessionId}] ❌ NUMBER UPDATE ERROR:`,
                  error?.message ||
                    error
                );
              }
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

            // ==========================================
            // SETTINGS PANEL
            // ==========================================

            try {
              if (
                settingsPanel &&
                typeof settingsPanel.setBotConnected ===
                  "function"
              ) {
                settingsPanel.setBotConnected(
                  socket
                );
              }
            } catch (error) {
              console.error(
                `[SESSION ${sessionId}] ❌ SETTINGS PANEL CONNECTION ERROR:`,
                error?.message ||
                  error
              );
            }

            return;
          }

          // ============================================
          // CLOSE
          // ============================================

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

            const currentSession =
              sessionManager.getSession(
                sessionId
              );

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

            // ==========================================
            // SETTINGS PANEL DISCONNECT
            // ==========================================

            try {
              if (
                settingsPanel &&
                typeof settingsPanel.setBotDisconnected ===
                  "function"
              ) {
                settingsPanel.setBotDisconnected(
                  socket,
                  loggedOut
                );
              }
            } catch (error) {
              console.error(
                `[SESSION ${sessionId}] ❌ SETTINGS PANEL DISCONNECT ERROR:`,
                error?.message ||
                  error
              );
            }

            // ==========================================
            // REMOVE SOCKET ONLY IF IT IS THE CURRENT ONE
            // ==========================================

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

            // ==========================================
            // LOGGED OUT
            // ==========================================

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

              logSession(
                sessionId,
                "⚠️ Auth session lan pa valid ankò."
              );

              return;
            }

            // ==========================================
            // NORMAL DISCONNECT
            // ==========================================

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
            error?.message ||
              error
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
            error?.message ||
              error
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
      error?.message ||
        error
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
//
// Backward compatible:
// start() kapab toujou rele san sessionId.
// Nan ka sa, li kreye/reprann default session.
//

async function start(sessionId = null) {
  let targetSessionId =
    sessionId;

  // ----------------------------------------------------
  // Si yo bay sessionId
  // ----------------------------------------------------

  if (targetSessionId) {
    if (
      !sessionManager.hasSession(
        targetSessionId
      )
    ) {
      throw new Error(
        "Session ID pa egziste."
      );
    }

    return startSession(
      targetSessionId
    );
  }

  // ----------------------------------------------------
  // Chèche default session
  // ----------------------------------------------------

  let session =
    DEFAULT_PHONE_NUMBER
      ? sessionManager.getSessionByNumber(
          DEFAULT_PHONE_NUMBER
        )
      : null;

  // ----------------------------------------------------
  // Si pa genyen, kreye youn
  // ----------------------------------------------------

  if (!session) {
    if (
      DEFAULT_PHONE_NUMBER &&
      validatePhoneNumber(
        DEFAULT_PHONE_NUMBER
      ).valid
    ) {
      session =
        sessionManager.createSession({
          number:
            DEFAULT_PHONE_NUMBER
        });
    } else {
      /*
       * Pou Multi-Session panel la,
       * pa oblije gen default number.
       *
       * Nou kreye yon session vid sèlman
       * pou API legacy yo.
       */
      session =
        sessionManager.createSession();
    }
  }

  return startSession(
    session.sessionId
  );
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
  // FIND EXISTING SESSION FOR THIS NUMBER
  // ====================================================

  let session =
    sessionManager.getSessionByNumber(
      phoneNumber
    );

  // ====================================================
  // CONNECTED CHECK
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
  // EXISTING PAIRING CHECK
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
  // CREATE NEW SESSION
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

  // ====================================================
  // PAIRING LOCK
  // ====================================================

  sessionManager.setPairingState(
    sessionId,
    {
      inProgress: true,
      number: phoneNumber,
      code: "",
      createdAt: 0
    }
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
    // START THIS SESSION ONLY
    // ==================================================

    let socket =
      sessionManager.getSocket(
        sessionId
      );

    if (
      !socket
    ) {
      socket =
        await startSession(
          sessionId
        );
    }

    // ==================================================
    // WAIT UNTIL PAIRING IS READY
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

    // ==================================================
    // GET CURRENT SOCKET
    // ==================================================

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

    console.log(
      `[SESSION ${sessionId}] 🔐 Asking WhatsApp for a fresh pairing code...`
    );

    const pairingCode =
      await socket.requestPairingCode(
        phoneNumber
      );

    // ==================================================
    // VALIDATE CODE
    // ==================================================

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
    // SAVE CODE TO THIS SESSION ONLY
    // ==================================================

    sessionManager.setPairingState(
      sessionId,
      {
        inProgress: true,
        number: phoneNumber,
        code: normalizedCode,
        createdAt:
          Date.now()
      }
    );

    // ==================================================
    // LOG CODE
    // ==================================================

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

    /*
     * IMPORTANT:
     * Nou pa mete inProgress=false imedyatman.
     *
     * Session nan dwe rete pairing-active pandan
     * itilizatè a ap antre code la.
     *
     * Li pral netwaye lè:
     * - connection.open
     * - close
     * - explicit stop
     */

    return {
      sessionId,
      number: phoneNumber,
      code: normalizedCode
    };
  } catch (error) {
    console.error(
      `[SESSION ${sessionId}] ❌ PAIRING CODE ERROR:`,
      error?.message ||
        error
    );

    sessionManager.clearPairingState(
      sessionId
    );

    throw error;
  }
}

// ======================================================
// GET SESSION
// ======================================================

function getSession(sessionId) {
  return sessionManager.getSession(
    sessionId
  );
}

// ======================================================
// GET SOCKET
// ======================================================

function getSocket(sessionId = null) {
  if (sessionId) {
    return sessionManager.getSocket(
      sessionId
    );
  }

  /*
   * Backward compatibility:
   * si yo pa bay sessionId,
   * retounen premye socket aktif la.
   */
  for (
    const session of
      sessionManager.getAllSessions()
  ) {
    if (session.socket) {
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
  if (sessionId) {
    return sessionManager.isConnected(
      sessionId
    );
  }

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
// GET PHONE NUMBER
// ======================================================

function getPhoneNumber(
  sessionId = null
) {
  // ----------------------------------------------------
  // Specific session
  // ----------------------------------------------------

  if (sessionId) {
    const session =
      sessionManager.getSession(
        sessionId
      );

    if (!session) {
      return "";
    }

    const socket =
      session.socket;

    if (
      socket?.user?.id
    ) {
      return getSocketPhoneNumber(
        socket
      );
    }

    return (
      session.number ||
      ""
    );
  }

  // ----------------------------------------------------
  // Backward compatibility
  // ----------------------------------------------------

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
// GET PAIRING INFO
// ======================================================

function getPairingInfo(
  sessionId = null
) {
  // ----------------------------------------------------
  // Specific session
  // ----------------------------------------------------

  if (sessionId) {
    const session =
      sessionManager.getSession(
        sessionId
      );

    if (!session) {
      return {
        sessionId,
        inProgress: false,
        number: "",
        code: "",
        createdAt: 0
      };
    }

    return {
      sessionId:
        session.sessionId,

      inProgress:
        session.pairing
          ?.inProgress ||
        false,

      number:
        session.pairing
          ?.number ||
        "",

      code:
        session.pairing
          ?.code ||
        "",

      createdAt:
        session.pairing
          ?.createdAt ||
        0
    };
  }

  // ----------------------------------------------------
  // Return all pairing sessions
  // ----------------------------------------------------

  return sessionManager
    .getAllSessions()
    .map(session => ({
      sessionId:
        session.sessionId,

      inProgress:
        session.pairing
          ?.inProgress ||
        false,

      number:
        session.pairing
          ?.number ||
        "",

      code:
        session.pairing
          ?.code ||
        "",

      createdAt:
        session.pairing
          ?.createdAt ||
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
        settingsPanel &&
        typeof settingsPanel.setBotDisconnected ===
          "function"
      ) {
        settingsPanel.setBotDisconnected(
          socket,
          true
        );
      }
    } catch (error) {
      console.error(
        `[SESSION ${sessionId}] ❌ SETTINGS STOP ERROR:`,
        error?.message ||
          error
      );
    }
  }

  // ====================================================
  // CLOSE SOCKET
  // ====================================================

  try {
    if (
      socket &&
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
      error?.message ||
        error
    );
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
  const sessions =
    sessionManager.getAllSessions();

  for (const session of sessions) {
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
//
// Sa sèlman restore records yo.
// Li pa konekte tout sessions otomatikman.
// Nou ka itilize l pita nan startup si nou vle.
//

function restoreStoredSessions() {
  const ids =
    sessionManager.getStoredSessionIds();

  const restored = [];

  for (const sessionId of ids) {
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
        error?.message ||
          error
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
  await stopSession(
    sessionId
  );

  clearReconnectTimer(
    sessionId
  );

  startingSessions.delete(
    sessionId
  );

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
  // Main
  start,
  startSession,
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