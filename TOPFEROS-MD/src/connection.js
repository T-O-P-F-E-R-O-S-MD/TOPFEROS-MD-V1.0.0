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

const reconnectTimers =
  new Map();

const startingSessions =
  new Set();

const startingPromises =
  new Map();

const stoppedSessions =
  new Set();

const socketReadyPromises =
  new Map();

// ============================================================
// PHONE HELPERS
// ============================================================

function cleanPhoneNumber(
  number
) {
  return String(number || "")
    .replace(/\D/g, "");
}

function validatePhoneNumber(
  number
) {
  const phone =
    cleanPhoneNumber(number);

  return (
    phone.length >= 8 &&
    phone.length <= 15
  );
}

// ============================================================
// MESSAGES
// ============================================================

async function handleMessages(
  sessionId,
  update
) {
  try {
    if (
      !update ||
      !update.messages ||
      !update.messages.length
    ) {
      return;
    }

    await messageHandler(
      sessionId,
      update
    );
  } catch (error) {
    console.error(
      `[${sessionId}] MESSAGE ERROR:`,
      error.message
    );
  }
}

// ============================================================
// READY PROMISE
// ============================================================

function createSocketReadyPromise(
  sessionId,
  socket
) {
  const existing =
    socketReadyPromises.get(
      sessionId
    );

  if (existing) {
    return existing.promise;
  }

  let resolvePromise;
  let rejectPromise;

  let finished = false;

  const timer =
    setTimeout(() => {
      finishReject(
        new Error(
          "WhatsApp socket connection timeout"
        )
      );
    }, 30000);

  function cleanup() {
    clearTimeout(timer);

    try {
      socket.ev.off(
        "connection.update",
        listener
      );
    } catch {}
  }

  function finishResolve(
    value
  ) {
    if (finished) {
      return;
    }

    finished = true;

    cleanup();

    resolvePromise(value);
  }

  function finishReject(
    error
  ) {
    if (finished) {
      return;
    }

    finished = true;

    cleanup();

    rejectPromise(error);
  }

  function listener(update) {
    if (
      update.connection ===
      "connecting"
    ) {
      finishResolve(socket);
      return;
    }

    if (
      update.connection ===
      "open"
    ) {
      finishResolve(socket);
      return;
    }

    if (
      update.connection ===
      "close"
    ) {
      finishReject(
        new Error(
          "WhatsApp connection closed before pairing socket became ready"
        )
      );
    }
  }

  const promise =
    new Promise(
      (resolve, reject) => {
        resolvePromise =
          resolve;

        rejectPromise =
          reject;
      }
    );

  socket.ev.on(
    "connection.update",
    listener
  );

  const entry = {
    promise,
    socket
  };

  socketReadyPromises.set(
    sessionId,
    entry
  );

  promise.finally(() => {
    const current =
      socketReadyPromises.get(
        sessionId
      );

    if (
      current &&
      current.promise === promise
    ) {
      socketReadyPromises.delete(
        sessionId
      );
    }
  });

  return promise;
}

// ============================================================
// RECONNECT
// ============================================================

function scheduleReconnect(
  sessionId
) {
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

  const timer =
    setTimeout(
      async () => {
        reconnectTimers.delete(
          sessionId
        );

        try {
          await startSession(
            sessionId
          );
        } catch (error) {
          console.error(
            `[${sessionId}] RECONNECT ERROR:`,
            error.message
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
      `Session not found: ${sessionId}`
    );
  }

  if (
    !session.authDir
  ) {
    throw new Error(
      "Session auth directory is missing"
    );
  }

  const {
    state: auth,
    saveCreds
  } =
    await useMultiFileAuthState(
      session.authDir
    );

  let version;

  try {
    const latest =
      await fetchLatestBaileysVersion();

    version =
      latest.version;
  } catch {
    version =
      undefined;
  }

  const socketOptions = {
    auth,

    logger:
      pino({
        level: "silent"
      }),

    browser:
      Browsers.ubuntu(
        "Chrome"
      ),

    printQRInTerminal:
      false,

    generateHighQualityLinkPreview:
      false,

    markOnlineOnConnect:
      false,

    syncFullHistory:
      false,

    connectTimeoutMs:
      60000,

    defaultQueryTimeoutMs:
      60000,

    keepAliveIntervalMs:
      30000
  };

  if (version) {
    socketOptions.version =
      version;
  }

  const socket =
    makeWASocket(
      socketOptions
    );

  socket.ev.on(
    "creds.update",
    saveCreds
  );

  sessionManager.setSocket(
    sessionId,
    socket
  );

  createSocketReadyPromise(
    sessionId,
    socket
  );

  return socket;
}

// ============================================================
// START SESSION
// ============================================================

async function startSession(
  sessionId
) {
  if (!sessionId) {
    throw new Error(
      "Session ID is required"
    );
  }

  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    throw new Error(
      `Session not found: ${sessionId}`
    );
  }

  stoppedSessions.delete(
    sessionId
  );

  if (
    session.socket &&
    session.connected &&
    session.socket.user
  ) {
    return session.socket;
  }

  const existing =
    startingPromises.get(
      sessionId
    );

  if (existing) {
    return existing;
  }

  const promise =
    (async () => {
      startingSessions.add(
        sessionId
      );

      sessionManager.setStatus(
        sessionId,
        "connecting"
      );

      try {
        const socket =
          await createSocket(
            sessionId
          );

        socket.ev.on(
          "connection.update",
          async update => {
            const {
              connection,
              lastDisconnect
            } = update;

            // ----------------------------------------------
            // CONNECTING
            // ----------------------------------------------

            if (
              connection ===
              "connecting"
            ) {
              sessionManager.setStatus(
                sessionId,
                "connecting"
              );

              console.log(
                `[${sessionId}] WHATSAPP CONNECTING`
              );
            }

            // ----------------------------------------------
            // OPEN
            // ----------------------------------------------

            if (
              connection ===
              "open"
            ) {
              let number =
                sessionManager.getPhoneNumber(
                  sessionId
                );

              if (
                socket.user &&
                socket.user.id
              ) {
                number =
                  cleanPhoneNumber(
                    socket.user.id.split(
                      ":"
                    )[0]
                  );
              }

              if (number) {
                sessionManager.setNumber(
                  sessionId,
                  number
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

              sessionManager.endPairing(
                sessionId
              );

              try {
                settingsPanel.setBotConnected(
                  sessionId
                );
              } catch {}

              console.log(
                `[${sessionId}] WHATSAPP CONNECTED: ${number || "UNKNOWN"}`
              );
            }

            // ----------------------------------------------
            // CLOSE
            // ----------------------------------------------

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

              const connectionReplaced =
                statusCode ===
                DisconnectReason.connectionReplaced;

              console.log(
                `[${sessionId}] WHATSAPP CONNECTION CLOSED`
              );

              console.log(
                `[${sessionId}] STATUS CODE: ${statusCode || "UNKNOWN"}`
              );

              console.log(
                `[${sessionId}] LOGGED OUT: ${loggedOut}`
              );

              console.log(
                `[${sessionId}] REPLACED: ${connectionReplaced}`
              );

              sessionManager.setSocket(
                sessionId,
                null
              );

              sessionManager.endPairing(
                sessionId
              );

              sessionManager.setStatus(
                sessionId,
                loggedOut
                  ? "logged_out"
                  : "disconnected"
              );

              try {
                settingsPanel.setBotDisconnected(
                  sessionId
                );
              } catch {}

              // --------------------------------------------
              // IMPORTANT
              // If WhatsApp explicitly logged out this
              // session, do NOT reconnect stale auth.
              //
              // We keep the session itself, but its auth
              // will be reset only when a new pairing is
              // requested.
              // --------------------------------------------

              if (
                loggedOut
              ) {
                console.log(
                  `[${sessionId}] AUTH INVALID / LOGGED OUT. WAITING FOR NEW PAIRING.`
                );

                return;
              }

              if (
                connectionReplaced
              ) {
                return;
              }

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
          }
        );

        socket.ev.on(
          "messages.upsert",
          update =>
            handleMessages(
              sessionId,
              update
            )
        );

        return socket;
      } finally {
        startingSessions.delete(
          sessionId
        );
      }
    })();

  startingPromises.set(
    sessionId,
    promise
  );

  try {
    return await promise;
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
  const phoneNumber =
    cleanPhoneNumber(number);

  if (
    !validatePhoneNumber(
      phoneNumber
    )
  ) {
    throw new Error(
      "Invalid WhatsApp phone number"
    );
  }

  let session =
    sessionManager.getSessionByNumber(
      phoneNumber
    );

  // ----------------------------------------------------------
  // CREATE NEW SESSION
  // ----------------------------------------------------------

  if (!session) {
    session =
      sessionManager.createSession(
        phoneNumber
      );
  }

  const sessionId =
    session.sessionId;

  // ----------------------------------------------------------
  // IF SESSION IS LOGGED OUT:
  // RESET ONLY ITS AUTH
  // ----------------------------------------------------------

  if (
    session.status ===
    "logged_out"
  ) {
    console.log(
      `[${sessionId}] RESETTING INVALID AUTH FOR NEW PAIRING`
    );

    await stopSession(
      sessionId
    );

    sessionManager.resetAuth(
      sessionId
    );

    session =
      sessionManager.getSession(
        sessionId
      );
  }

  // ----------------------------------------------------------
  // ALREADY CONNECTED
  // ----------------------------------------------------------

  if (
    session.connected &&
    session.socket &&
    session.socket.user
  ) {
    return {
      success: true,

      sessionId,

      number: phoneNumber,

      code: null,

      status: "connected",

      message:
        "WhatsApp is already connected"
    };
  }

  // ----------------------------------------------------------
  // PREVENT DUPLICATE PAIRING
  // ----------------------------------------------------------

  if (
    session.pairing
  ) {
    return {
      success: true,

      sessionId,

      number: phoneNumber,

      code:
        session.pairingCode,

      status: "pairing"
    };
  }

  stoppedSessions.delete(
    sessionId
  );

  // ----------------------------------------------------------
  // START PAIRING
  // ----------------------------------------------------------

  sessionManager.startPairing(
    sessionId
  );

  try {
    let socket =
      sessionManager.getSocket(
        sessionId
      );

    if (
      !socket ||
      !socket.ws
    ) {
      socket =
        await startSession(
          sessionId
        );
    }

    await createSocketReadyPromise(
      sessionId,
      socket
    );

    // --------------------------------------------------------
    // WAIT A LITTLE FOR SOCKET
    // --------------------------------------------------------

    if (
      !socket.requestPairingCode
    ) {
      throw new Error(
        "This Baileys version does not support requestPairingCode()"
      );
    }

    console.log(
      `[${sessionId}] REQUESTING PAIRING CODE FOR ${phoneNumber}`
    );

    const code =
      await socket.requestPairingCode(
        phoneNumber
      );

    const normalizedCode =
      String(code || "")
        .replace(
          /[^A-Z0-9]/gi,
          ""
        )
        .toUpperCase();

    if (
      !normalizedCode
    ) {
      throw new Error(
        "WhatsApp did not return a pairing code"
      );
    }

    sessionManager.setNumber(
      sessionId,
      phoneNumber
    );

    sessionManager.setPairingCode(
      sessionId,
      normalizedCode
    );

    sessionManager.setStatus(
      sessionId,
      "pairing"
    );

    console.log(
      `[${sessionId}] PAIRING CODE: ${normalizedCode}`
    );

    return {
      success: true,

      sessionId,

      number: phoneNumber,

      code:
        normalizedCode,

      status: "pairing"
    };
  } catch (error) {
    sessionManager.endPairing(
      sessionId
    );

    sessionManager.setStatus(
      sessionId,
      "error"
    );

    console.error(
      `[${sessionId}] PAIRING ERROR:`,
      error.message
    );

    throw error;
  }
}

// ============================================================
// RESTORE STORED SESSIONS
// ============================================================

async function restoreStoredSessions() {
  const ids =
    sessionManager.getStoredSessionIds();

  console.log(
    `RESTORING ${ids.length} STORED SESSION(S)...`
  );

  for (
    const sessionId of ids
  ) {
    try {
      sessionManager.restoreSession(
        sessionId
      );

      await startSession(
        sessionId
      );

      console.log(
        `[${sessionId}] SESSION RESTORED`
      );
    } catch (error) {
      console.error(
        `[${sessionId}] RESTORE ERROR:`,
        error.message
      );
    }
  }

  return true;
}

// ============================================================
// STOP SESSION
// ============================================================

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

  try {
    if (
      session.socket
    ) {
      try {
        session.socket.end(
          new Error(
            "Session stopped"
          )
        );
      } catch {}
    }
  } catch {}

  sessionManager.setSocket(
    sessionId,
    null
  );

  sessionManager.setStatus(
    sessionId,
    "disconnected"
  );

  sessionManager.endPairing(
    sessionId
  );

  try {
    settingsPanel.setBotDisconnected(
      sessionId
    );
  } catch {}

  return true;
}

// ============================================================
// STOP ALL
// ============================================================

async function stop() {
  const sessions =
    sessionManager.getAllSessions();

  for (
    const session of sessions
  ) {
    await stopSession(
      session.sessionId
    );
  }

  return true;
}

// ============================================================
// REMOVE SESSION
// ============================================================

async function removeSession(
  sessionId
) {
  await stopSession(
    sessionId
  );

  stoppedSessions.delete(
    sessionId
  );

  socketReadyPromises.delete(
    sessionId
  );

  startingPromises.delete(
    sessionId
  );

  startingSessions.delete(
    sessionId
  );

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

  return sessionManager.removeSession(
    sessionId
  );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // IMPORTANT:
  // index.js calls connection.start()
  // without a sessionId.
  //
  // Therefore start MUST restore stored sessions.

  start:
    restoreStoredSessions,

  startSession,

  stop,
  stopSession,

  requestPairingCode,

  restoreStoredSessions,

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

  removeSession,

  cleanPhoneNumber,
  validatePhoneNumber
};