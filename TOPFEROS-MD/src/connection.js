"use strict";

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const sessionManager =
  require("./sessionManager");

const settingsPanel =
  require("../settings/panel");

const messageHandler =
  require("./messageHandler");

// ============================================================
// STATE
// ============================================================

const reconnectTimers =
  new Map();

const startingPromises =
  new Map();

const stoppedSessions =
  new Set();

const RECONNECT_DELAY = 5000;

// ============================================================
// PHONE NUMBER HELPERS
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
    phone.length < 7 ||
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

// ============================================================
// MESSAGE HANDLER
// ============================================================

async function handleMessages(update) {
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
      await messageHandler(update);
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
      "❌ Erè nan message handler:",
      error?.message || error
    );
  }
}

// ============================================================
// RECONNECT
// ============================================================

function clearReconnectTimer(sessionId) {
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

function scheduleReconnect(sessionId) {
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
            `❌ Erè pandan rekoneksyon ${sessionId}:`,
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

async function createSocket(sessionId) {
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
      latest.version
    ) {
      version =
        latest.version;

      console.log(
        `📦 Baileys version: ${version.join(".")}`
      );
    }
  } catch (error) {
    console.warn(
      "⚠️ Pa kapab jwenn dènye vèsyon Baileys:",
      error?.message || error
    );
  }

  const socketConfig = {
    auth: state,

    printQRInTerminal: false,

    markOnlineOnConnect: false,

    syncFullHistory: false,

    generateHighQualityLinkPreview:
      false,

    /*
     * Browser configuration ki te
     * itilize nan ansyen version lan.
     */
    browser:
      Browsers.ubuntu(
        "Chrome"
      )
  };

  if (version) {
    socketConfig.version =
      version;
  }

  const socket =
    makeWASocket(
      socketConfig
    );

  socket.ev.on(
    "creds.update",
    async () => {
      try {
        await saveCreds();
      } catch (error) {
        console.error(
          "❌ Erè saveCreds:",
          error?.message || error
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
// START SESSION
// ============================================================

async function startSession(sessionId) {
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

      /*
       * Si session nan logged_out,
       * pa eseye konekte l dirèkteman.
       * requestPairingCode() ap reset auth la.
       */
      if (
        session.status ===
        "logged_out"
      ) {
        throw new Error(
          "Session sa a dekonekte. Fè yon nouvo pairing code."
        );
      }

      /*
       * Si socket la deja konekte,
       * pa kreye yon lòt socket.
       */
      if (
        session.socket &&
        session.socket.user
      ) {
        sessionManager.setStatus(
          sessionId,
          "connected"
        );

        return session.socket;
      }

      sessionManager.setStatus(
        sessionId,
        "connecting"
      );

      let socket =
        sessionManager.getSocket(
          sessionId
        );

      if (!socket) {
        socket =
          await createSocket(
            sessionId
          );
      }

      /*
       * Connection events.
       */
      socket.ev.on(
        "connection.update",
        async update => {
          const {
            connection,
            lastDisconnect
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

            // ==================================================
            // OPEN
            // ==================================================

            if (
              connection ===
              "open"
            ) {
              clearReconnectTimer(
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
                  error?.message || error
                );
              }

              console.log(
                `✅ TOPFEROS MD konekte: ${sessionId}`
              );
            }

            // ==================================================
            // CLOSE
            // ==================================================

            if (
              connection ===
              "close"
            ) {
              let statusCode =
                null;

              try {
                statusCode =
                  lastDisconnect
                    ?.error
                    ?.output
                    ?.statusCode ||
                  null;
              } catch (_) {
                statusCode =
                  null;
              }

              const errorMessage =
                lastDisconnect
                  ?.error
                  ?.message ||
                lastDisconnect
                  ?.error
                  ?.output
                  ?.payload
                  ?.message ||
                "unknown";

              const loggedOut =
                statusCode ===
                DisconnectReason.loggedOut;

              const connectionReplaced =
                statusCode ===
                DisconnectReason.connectionReplaced;

              sessionManager.setSocket(
                sessionId,
                null
              );

              // ==============================================
              // LOGGED OUT
              // ==============================================

              if (loggedOut) {
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

                console.log(
                  `🔴 Session ${sessionId} LOGGED OUT`,
                  {
                    statusCode,
                    error:
                      errorMessage
                  }
                );

                return;
              }

              // ==============================================
              // CONNECTION REPLACED
              // ==============================================

              if (
                connectionReplaced
              ) {
                sessionManager.setStatus(
                  sessionId,
                  "disconnected"
                );

                console.log(
                  `⚠️ Session ${sessionId} ranplase pa yon lòt koneksyon.`,
                  {
                    statusCode,
                    error:
                      errorMessage
                  }
                );

                return;
              }

              // ==============================================
              // NORMAL DISCONNECT
              // ==============================================

              sessionManager.setStatus(
                sessionId,
                "disconnected"
              );

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

              console.log(
                `⚠️ Session ${sessionId} fèmen.`,
                {
                  statusCode,
                  error:
                    errorMessage
                }
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
              `❌ Erè connection.update (${sessionId}):`,
              error?.message || error
            );
          }
        }
      );

      // ========================================================
      // MESSAGES
      // ========================================================

      socket.ev.on(
        "messages.upsert",
        async messageUpdate => {
          await handleMessages(
            messageUpdate
          );
        }
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

  // ==========================================================
  // GET OR CREATE SESSION
  // ==========================================================

  let session =
    sessionManager.getSessionByNumber(
      phoneNumber
    );

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

  // ==========================================================
  // LOGGED OUT / RESET AUTH
  // ==========================================================

  if (
    session.status ===
    "logged_out"
  ) {
    console.log(
      `♻️ Reset auth pou nouvo pairing: ${sessionId}`
    );

    /*
     * Fèmen ansyen socket anvan reset auth.
     */
    try {
      await stopSession(
        sessionId
      );
    } catch (error) {
      console.warn(
        "⚠️ Pa kapab stop ansyen socket:",
        error?.message || error
      );
    }

    /*
     * Reset auth directory la.
     */
    if (
      typeof sessionManager.resetAuth ===
      "function"
    ) {
      const resetResult =
        sessionManager.resetAuth(
          sessionId
        );

      if (!resetResult) {
        throw new Error(
          "Pa kapab reset auth session lan."
        );
      }
    } else {
      throw new Error(
        "sessionManager.resetAuth() pa disponib."
      );
    }

    /*
     * Rekipere session lan apre reset.
     */
    session =
      sessionManager.getSession(
        sessionId
      );

    if (!session) {
      throw new Error(
        "Session disparèt apre reset auth."
      );
    }

    console.log(
      `✅ Auth reset fini pou ${sessionId}`
    );
  }

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

      number:
        phoneNumber,

      status:
        "connected",

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
    console.log(
      `♻️ Pairing code deja disponib pou ${phoneNumber}`
    );

    return {
      success: true,

      sessionId,

      number:
        phoneNumber,

      status:
        "pairing",

      code:
        session.pairingCode,

      message:
        "Pairing code la deja disponib."
    };
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

  // ==========================================================
  // REQUEST CODE
  // ==========================================================

  try {
    /*
     * IMPORTANT:
     *
     * Nou pa tann QR.
     * Nou pa tann "open".
     * Nou pa tann 30 segonn.
     *
     * Nou mande WhatsApp pairing code
     * dirèkteman sou socket la.
     */
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
        .replace(/[\s-]/g, "")
        .trim();

    if (!code) {
      throw new Error(
        "Pairing code la vid."
      );
    }

    /*
     * Sove code la.
     */
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
      error?.message || error
    );

    /*
     * Pa efase authDir la isit la.
     * Si WhatsApp ap tann validation,
     * efase auth state la ka kraze pairing.
     */
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
      "⚠️ sessionManager.getStoredSessionIds() pa disponib."
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
    const sessionId of
      sessionIds
  ) {
    try {
      const session =
        sessionManager.getSession(
          sessionId
        );

      if (!session) {
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
        error?.message || error
      );
    }
  }

  return restored;
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
  }

  sessionManager.setSocket(
    sessionId,
    null
  );

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
// STOP ALL
// ============================================================

async function stop() {
  const sessions =
    sessionManager.getAllSessions();

  const sessionIds =
    Array.isArray(sessions)
      ? sessions.map(
          session =>
            session.sessionId
        )
      : [];

  for (
    const sessionId of
      sessionIds
  ) {
    try {
      await stopSession(
        sessionId
      );
    } catch (error) {
      console.error(
        `❌ Erè stop session ${sessionId}:`,
        error?.message || error
      );
    }
  }

  return true;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  start:
    restoreStoredSessions,

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