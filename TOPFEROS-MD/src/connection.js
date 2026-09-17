"use strict";

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");

const sessionManager =
  require("./sessionManager");

const settingsPanel =
  require("../settings/panel");

const messageHandler =
  require("./messageHandler");

// ============================================================
// STATE
// ============================================================

const reconnectTimers = new Map();
const startingPromises = new Map();
const configuredSockets = new Set();
const stoppedSessions = new Set();

const RECONNECT_DELAY = 5000;

const logger = pino({
  level:
    process.env.BAILEYS_LOG_LEVEL ||
    "warn"
});

// ============================================================
// HELPERS
// ============================================================

function cleanPhoneNumber(number) {
  if (
    typeof number !== "string" &&
    typeof number !== "number"
  ) {
    return "";
  }

  return String(number).replace(
    /\D/g,
    ""
  );
}

function validatePhoneNumber(number) {
  const phone =
    cleanPhoneNumber(number);

  if (!phone) {
    return {
      valid: false,
      number: "",
      error:
        "Nimewo WhatsApp la obligatwa."
    };
  }

  if (
    phone.length < 8 ||
    phone.length > 15
  ) {
    return {
      valid: false,
      number: phone,
      error:
        "Nimewo WhatsApp la pa valid."
    };
  }

  return {
    valid: true,
    number: phone,
    error: null
  };
}

function getDisconnectCode(
  lastDisconnect
) {
  return (
    lastDisconnect?.error?.output
      ?.statusCode ||
    lastDisconnect?.error?.statusCode ||
    null
  );
}

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

function isPairingSession(
  sessionId
) {
  const session =
    sessionManager.getSession(
      sessionId
    );

  return Boolean(
    session &&
      session.pairing
  );
}

// ============================================================
// MESSAGE HANDLER
// ============================================================

async function handleMessages(
  update
) {
  try {
    if (
      !update ||
      !update.messages
    ) {
      return;
    }

    if (
      typeof messageHandler ===
      "function"
    ) {
      await messageHandler(
        update
      );
      return;
    }

    if (
      messageHandler &&
      typeof messageHandler.handleMessages ===
        "function"
    ) {
      await messageHandler.handleMessages(
        update
      );
      return;
    }

    if (
      messageHandler &&
      typeof messageHandler.handle ===
        "function"
    ) {
      await messageHandler.handle(
        update
      );
    }
  } catch (error) {
    console.error(
      "❌ Erè message handler:",
      error?.message ||
        error
    );
  }
}

// ============================================================
// RECONNECT
// ============================================================

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

  /*
   * Pa reconnect otomatik pandan yon
   * pairing code ap tann validation.
   *
   * Sa evite:
   *
   * pairing code
   *      ↓
   * 408
   *      ↓
   * reconnect
   *      ↓
   * 401
   */
  if (
    isPairingSession(
      sessionId
    )
  ) {
    console.log(
      `⏸️ Pairing session ${sessionId} pa pral reconnect otomatikman.`
    );

    return;
  }

  clearReconnectTimer(
    sessionId
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
          const session =
            sessionManager.getSession(
              sessionId
            );

          if (!session) {
            return;
          }

          if (
            session.status ===
            "logged_out"
          ) {
            return;
          }

          console.log(
            `🔄 Rekonekte session: ${sessionId}`
          );

          await startSession(
            sessionId
          );
        } catch (error) {
          console.error(
            `❌ Erè rekoneksyon ${sessionId}:`,
            error?.message ||
              error
          );

          if (
            !stoppedSessions.has(
              sessionId
            ) &&
            !isPairingSession(
              sessionId
            )
          ) {
            scheduleReconnect(
              sessionId
            );
          }
        }
      },
      RECONNECT_DELAY
    );

  reconnectTimers.set(
    sessionId,
    timer
  );
}

// ============================================================
// CREATE SOCKET
// ============================================================

async function createSocket(
  sessionId
) {
  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    throw new Error(
      "Session pa jwenn."
    );
  }

  if (!session.authDir) {
    throw new Error(
      "Auth directory session lan pa disponib."
    );
  }

  const {
    state,
    saveCreds
  } =
    await useMultiFileAuthState(
      session.authDir
    );

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

      console.log(
        `📦 Baileys version: ${version.join(
          "."
        )}`
      );

      if (
        latest.isLatest ===
        false
      ) {
        console.warn(
          "⚠️ Baileys version returned by WhatsApp is newer than installed version."
        );
      }
    }
  } catch (error) {
    console.warn(
      "⚠️ Pa kapab jwenn dènye WhatsApp Web version:",
      error?.message ||
        error
    );
  }

  const socketConfig = {
    auth: state,

    printQRInTerminal: false,

    markOnlineOnConnect: false,

    syncFullHistory: false,

    shouldSyncHistoryMessage:
      () => false,

    generateHighQualityLinkPreview:
      false,

    browser:
      Browsers.ubuntu(
        "Chrome"
      ),

    connectTimeoutMs:
      120000,

    keepAliveIntervalMs:
      10000,

    defaultQueryTimeoutMs:
      60000,

    logger
  };

  if (version) {
    socketConfig.version =
      version;
  }

  const socket =
    makeWASocket(
      socketConfig
    );

  /*
   * Save WhatsApp credentials.
   *
   * Sa trè enpòtan pou pairing lan.
   */
  socket.ev.on(
    "creds.update",
    async () => {
      try {
        await saveCreds();
      } catch (error) {
        console.error(
          "❌ Erè saveCreds:",
          error?.message ||
            error
        );
      }
    }
  );

  sessionManager.setSocket(
    sessionId,
    socket
  );

  return socket;
}

// ============================================================
// CONFIGURE SOCKET
// ============================================================

function configureSocket(
  sessionId,
  socket
) {
  if (!socket) {
    return;
  }

  if (
    configuredSockets.has(
      socket
    )
  ) {
    return;
  }

  configuredSockets.add(
    socket
  );

  // ==========================================================
  // CONNECTION UPDATE
  // ==========================================================

  socket.ev.on(
    "connection.update",
    async update => {
      const {
        connection,
        lastDisconnect,
        isNewLogin
      } = update;

      try {
        if (
          connection ===
          "connecting"
        ) {
          sessionManager.setStatus(
            sessionId,
            "connecting"
          );

          console.log(
            `🔄 TOPFEROS MD ap konekte: ${sessionId}`
          );
        }

        // ====================================================
        // OPEN
        // ====================================================

        if (
          connection ===
          "open"
        ) {
          clearReconnectTimer(
            sessionId
          );

          stoppedSessions.delete(
            sessionId
          );

          let phoneNumber =
            sessionManager.getPhoneNumber(
              sessionId
            );

          if (
            !phoneNumber &&
            socket.user &&
            socket.user.id
          ) {
            phoneNumber =
              cleanPhoneNumber(
                socket.user.id.split(
                  ":"
                )[0]
              );
          }

          if (phoneNumber) {
            sessionManager.setNumber(
              sessionId,
              phoneNumber
            );
          }

          sessionManager.setSocket(
            sessionId,
            socket
          );

          sessionManager.setStatus(
            sessionId,
            "connected"
          );

          if (
            typeof sessionManager.endPairing ===
            "function"
          ) {
            sessionManager.endPairing(
              sessionId
            );
          }

          try {
            if (
              settingsPanel &&
              typeof settingsPanel.setBotConnected ===
                "function"
            ) {
              settingsPanel.setBotConnected(
                sessionId,
                true
              );
            }
          } catch (error) {
            console.warn(
              "⚠️ settingsPanel.setBotConnected:",
              error?.message ||
                error
            );
          }

          console.log(
            `✅ TOPFEROS MD konekte: ${sessionId}`
          );

          if (
            isNewLogin
          ) {
            console.log(
              `🎉 Nouvo WhatsApp login konfime: ${sessionId}`
            );
          }
        }

        // ====================================================
        // CLOSE
        // ====================================================

        if (
          connection ===
          "close"
        ) {
          const statusCode =
            getDisconnectCode(
              lastDisconnect
            );

          console.log(
            `⚠️ WhatsApp fèmen pou session ${sessionId}. Code: ${
              statusCode ||
              "unknown"
            }`
          );

          sessionManager.setSocket(
            sessionId,
            null
          );

          // ==================================================
          // LOGGED OUT
          // ==================================================

          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {
            sessionManager.setStatus(
              sessionId,
              "logged_out"
            );

            if (
              typeof sessionManager.endPairing ===
              "function"
            ) {
              sessionManager.endPairing(
                sessionId
              );
            }

            stoppedSessions.add(
              sessionId
            );

            clearReconnectTimer(
              sessionId
            );

            console.log(
              `🚪 Session ${sessionId} logged out.`
            );
          }

          // ==================================================
          // PAIRING 408
          // ==================================================

          else if (
            statusCode ===
            DisconnectReason.timedOut ||
            statusCode === 408
          ) {
            const wasPairing =
              isPairingSession(
                sessionId
              );

            if (
              wasPairing
            ) {
              console.warn(
                `⏱️ Pairing timeout 408 pou ${sessionId}.`
              );

              console.warn(
                "⚠️ Pairing code la pa pral reuse. Nouvo request ap bezwen yon nouvo auth state."
              );

              clearReconnectTimer(
                sessionId
              );

              try {
                if (
                  typeof sessionManager.endPairing ===
                  "function"
                ) {
                  sessionManager.endPairing(
                    sessionId
                  );
                }
              } catch (_) {}

              try {
                sessionManager.setStatus(
                  sessionId,
                  "error"
                );
              } catch (_) {}

              /*
               * Reset auth la pou pwochen pairing
               * pa sèvi ak credential partial ki
               * soti nan ansyen attempt la.
               */
              try {
                if (
                  typeof sessionManager.resetAuth ===
                  "function"
                ) {
                  sessionManager.resetAuth(
                    sessionId
                  );
                }
              } catch (resetError) {
                console.error(
                  "❌ Pairing auth reset error:",
                  resetError?.message ||
                    resetError
                );
              }

              stoppedSessions.delete(
                sessionId
              );
            } else {
              sessionManager.setStatus(
                sessionId,
                "disconnected"
              );

              scheduleReconnect(
                sessionId
              );
            }
          }

          // ==================================================
          // OTHER DISCONNECT
          // ==================================================

          else {
            sessionManager.setStatus(
              sessionId,
              "disconnected"
            );

            if (
              !isPairingSession(
                sessionId
              )
            ) {
              scheduleReconnect(
                sessionId
              );
            }
          }

          try {
            if (
              settingsPanel &&
              typeof settingsPanel.setBotConnected ===
                "function"
            ) {
              settingsPanel.setBotConnected(
                sessionId,
                false
              );
            }
          } catch (_) {}
        }
      } catch (error) {
        console.error(
          `❌ Erè connection.update (${sessionId}):`,
          error?.message ||
            error
        );
      }
    }
  );

  // ==========================================================
  // MESSAGES
  // ==========================================================

  socket.ev.on(
    "messages.upsert",
    async messageUpdate => {
      await handleMessages(
        messageUpdate
      );
    }
  );
}

// ============================================================
// START SESSION
// ============================================================

async function startSession(
  sessionId
) {
  if (!sessionId) {
    throw new Error(
      "Session ID obligatwa."
    );
  }

  const existingStart =
    startingPromises.get(
      sessionId
    );

  if (existingStart) {
    return existingStart;
  }

  const startPromise =
    (async () => {
      if (
        stoppedSessions.has(
          sessionId
        )
      ) {
        throw new Error(
          "Session sa a te kanpe."
        );
      }

      const session =
        sessionManager.getSession(
          sessionId
        );

      if (!session) {
        throw new Error(
          "Session pa jwenn."
        );
      }

      if (
        session.status ===
        "logged_out"
      ) {
        throw new Error(
          "Session sa a dekonekte. Fè yon nouvo pairing code."
        );
      }

      let socket =
        sessionManager.getSocket(
          sessionId
        );

      // ======================================================
      // EXISTING CONNECTED SOCKET
      // ======================================================

      if (
        socket &&
        socket.user
      ) {
        configureSocket(
          sessionId,
          socket
        );

        sessionManager.setStatus(
          sessionId,
          "connected"
        );

        return socket;
      }

      // ======================================================
      // START NEW SOCKET
      // ======================================================

      sessionManager.setStatus(
        sessionId,
        "connecting"
      );

      if (!socket) {
        socket =
          await createSocket(
            sessionId
          );
      }

      configureSocket(
        sessionId,
        socket
      );

      sessionManager.setSocket(
        sessionId,
        socket
      );

      return socket;
    })();

  startingPromises.set(
    sessionId,
    startPromise
  );

  try {
    return await startPromise;
  } finally {
    startingPromises.delete(
      sessionId
    );
  }
}

// ============================================================
// REQUEST PAIRING CODE
// ============================================================

async function requestPairingCode(
  number
) {
  const validation =
    validatePhoneNumber(
      number
    );

  if (!validation.valid) {
    throw new Error(
      validation.error
    );
  }

  const phoneNumber =
    validation.number;

  console.log(
    `📱 Demann pairing code pou: ${phoneNumber}`
  );

  let session =
    sessionManager.getSessionByNumber(
      phoneNumber
    );

  // ==========================================================
  // CREATE SESSION
  // ==========================================================

  if (!session) {
    session =
      sessionManager.createSession(
        phoneNumber
      );
  }

  if (
    !session ||
    !session.sessionId
  ) {
    throw new Error(
      "Pa kapab kreye session pou nimewo sa a."
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

  // ==========================================================
  // ALREADY CONNECTED
  // ==========================================================

  if (
    session.status ===
      "connected" &&
    session.socket
  ) {
    return {
      success: true,
      sessionId,
      number: phoneNumber,
      status: "connected",
      code: null,
      message:
        "Bot la deja konekte."
    };
  }

  // ==========================================================
  // EXISTING PAIRING CODE
  // ==========================================================

  if (
    session.pairing &&
    session.pairingCode
  ) {
    return {
      success: true,
      sessionId,
      number: phoneNumber,
      status: "pairing",
      code:
        session.pairingCode,
      message:
        "Pairing code la deja disponib."
    };
  }

  // ==========================================================
  // RESET FAILED PAIRING
  // ==========================================================

  if (
    session.status ===
      "error" ||
    session.status ===
      "disconnected"
  ) {
    try {
      if (
        typeof sessionManager.resetAuth ===
        "function"
      ) {
        console.log(
          `♻️ Reset auth avan nouvo pairing: ${sessionId}`
        );

        sessionManager.resetAuth(
          sessionId
        );
      }
    } catch (error) {
      console.warn(
        "⚠️ Pa kapab reset auth avan pairing:",
        error?.message ||
          error
      );
    }

    session =
      sessionManager.getSession(
        sessionId
      );

    if (!session) {
      throw new Error(
        "Session pa disponib apre reset auth."
      );
    }
  }

  // ==========================================================
  // START PAIRING
  // ==========================================================

  if (
    typeof sessionManager.startPairing ===
    "function"
  ) {
    sessionManager.startPairing(
      sessionId
    );
  }

  sessionManager.setNumber(
    sessionId,
    phoneNumber
  );

  let socket =
    sessionManager.getSocket(
      sessionId
    );

  if (!socket) {
    socket =
      await startSession(
        sessionId
      );
  } else {
    configureSocket(
      sessionId,
      socket
    );
  }

  if (!socket) {
    throw new Error(
      "Pa kapab kreye WhatsApp socket pou pairing."
    );
  }

  // ==========================================================
  // CHECK AUTH STATE
  // ==========================================================

  try {
    if (
      socket.authState &&
      socket.authState.creds &&
      socket.authState.creds.registered
    ) {
      console.log(
        `ℹ️ Session ${sessionId} deja registered.`
      );

      sessionManager.setStatus(
        sessionId,
        "connected"
      );

      return {
        success: true,
        sessionId,
        number: phoneNumber,
        status: "connected",
        code: null,
        message:
          "Session lan deja registered."
      };
    }
  } catch (_) {}

  // ==========================================================
  // REQUEST PAIRING CODE
  // ==========================================================

  try {
    console.log(
      `⏳ WhatsApp ap prepare pairing code pou ${phoneNumber}...`
    );

    const rawCode =
      await socket.requestPairingCode(
        phoneNumber
      );

    if (!rawCode) {
      throw new Error(
        "WhatsApp pa retounen okenn pairing code."
      );
    }

    const code =
      String(rawCode)
        .replace(
          /[\s-]/g,
          ""
        )
        .trim();

    if (!code) {
      throw new Error(
        "Pairing code la vid."
      );
    }

    sessionManager.setPairingCode(
      sessionId,
      code
    );

    sessionManager.setStatus(
      sessionId,
      "pairing"
    );

    console.log(
      `✅ Pairing code pwodwi pou ${phoneNumber}: ${code}`
    );

    console.log(
      `📲 Antre code ${code} nan WhatsApp sou telefòn ${phoneNumber}.`
    );

    return {
      success: true,

      sessionId,

      number:
        phoneNumber,

      status:
        "pairing",

      code,

      message:
        "Pairing code la pwodwi avèk siksè."
    };
  } catch (error) {
    console.error(
      `❌ Erè pairing code (${phoneNumber}):`,
      error?.message ||
        error
    );

    try {
      sessionManager.endPairing(
        sessionId
      );
    } catch (_) {}

    try {
      sessionManager.setStatus(
        sessionId,
        "error"
      );
    } catch (_) {}

    throw error;
  }
}

// ============================================================
// RESTORE STORED SESSIONS
// ============================================================

async function restoreStoredSessions() {
  if (
    typeof sessionManager.getStoredSessionIds !==
    "function"
  ) {
    console.warn(
      "⚠️ getStoredSessionIds() pa disponib."
    );

    return [];
  }

  const sessionIds =
    sessionManager.getStoredSessionIds();

  if (
    !Array.isArray(
      sessionIds
    )
  ) {
    return [];
  }

  const restored = [];

  for (
    const sessionId of sessionIds
  ) {
    try {
      const session =
        sessionManager.getSession(
          sessionId
        );

      if (!session) {
        continue;
      }

      /*
       * Pa restore yon pairing code ki te
       * rete anndan disk la apre restart.
       */
      if (
        session.pairing
      ) {
        console.log(
          `⏭️ Session ${sessionId} te nan pairing; li pap restore kòm connected.`
        );

        continue;
      }

      if (
        session.status ===
        "logged_out"
      ) {
        continue;
      }

      stoppedSessions.delete(
        sessionId
      );

      await startSession(
        sessionId
      );

      restored.push(
        sessionId
      );

      console.log(
        `♻️ Session restore: ${sessionId}`
      );
    } catch (error) {
      console.error(
        `❌ Pa kapab restore session ${sessionId}:`,
        error?.message ||
          error
      );
    }
  }

  return restored;
}

// ============================================================
// SERVICE START
// ============================================================

async function start() {
  console.log(
    "🚀 TOPFEROS MD connection service ap demare..."
  );

  return true;
}

// ============================================================
// STOP SESSION
// ============================================================

async function stopSession(
  sessionId
) {
  if (!sessionId) {
    return false;
  }

  stoppedSessions.add(
    sessionId
  );

  clearReconnectTimer(
    sessionId
  );

  const socket =
    sessionManager.getSocket(
      sessionId
    );

  if (socket) {
    try {
      socket.end(
        undefined
      );
    } catch (_) {}

    try {
      socket.ws?.close();
    } catch (_) {}
  }

  sessionManager.setSocket(
    sessionId,
    null
  );

  try {
    sessionManager.endPairing(
      sessionId
    );
  } catch (_) {}

  try {
    sessionManager.setStatus(
      sessionId,
      "disconnected"
    );
  } catch (_) {}

  return true;
}

// ============================================================
// REMOVE SESSION
// ============================================================

async function removeSession(
  sessionId
) {
  if (!sessionId) {
    return false;
  }

  await stopSession(
    sessionId
  );

  stoppedSessions.delete(
    sessionId
  );

  clearReconnectTimer(
    sessionId
  );

  return sessionManager.removeSession(
    sessionId
  );
}

// ============================================================
// STOP SERVICE
// ============================================================

async function stop() {
  const sessions =
    sessionManager.getAllSessions();

  const sessionIds =
    Array.isArray(
      sessions
    )
      ? sessions
          .map(
            session =>
              session.sessionId
          )
          .filter(Boolean)
      : [];

  for (
    const sessionId of sessionIds
  ) {
    try {
      await stopSession(
        sessionId
      );
    } catch (error) {
      console.error(
        `❌ Erè stop session ${sessionId}:`,
        error?.message ||
          error
      );
    }
  }

  console.log(
    "🛑 TOPFEROS MD connection service kanpe."
  );

  return true;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  start,

  stop,

  startSession,

  stopSession,

  removeSession,

  restoreStoredSessions,

  requestPairingCode,

  createSession:
    sessionManager.createSession,

  getSession:
    sessionManager.getSession,

  getAllSessions:
    sessionManager.getAllSessions,

  getSocket:
    sessionManager.getSocket,

  isConnected:
    sessionManager.isConnected,

  getPhoneNumber:
    sessionManager.getPhoneNumber,

  getPairingInfo:
    sessionManager.getPairingInfo,

  cleanPhoneNumber,

  validatePhoneNumber
};