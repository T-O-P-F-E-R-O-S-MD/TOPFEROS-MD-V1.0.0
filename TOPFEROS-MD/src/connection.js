"use strict";

// ============================================================
// TOPFEROS MD
// CONNECTION MANAGER
// WhatsApp / Baileys
// ============================================================

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const path = require("path");
const fs = require("fs");

const sessionManager =
  require("./sessionManager");

const messageHandler =
  require("./messageHandler");

// IMPORTANT:
// Fichye a rele settingPanel.js
const settingsPanel =
  require("./settingPanel");

// ============================================================
// ACTIVE SOCKETS
// ============================================================

const active = new Map();

// ============================================================
// RECONNECT TIMERS
// ============================================================

const reconnectTimers = new Map();

// ============================================================
// INTENTIONAL STOP / REMOVE
// ============================================================
// Lè nou fè stopSession() oswa removeSession(),
// connection.update ka toujou voye "close".
// Set sa a anpeche close event lan rekonekte session lan.
// ============================================================

const intentionalStops =
  new Set();

// ============================================================
// OPTIONAL COMMANDS
// ============================================================

let welcome = null;
let goodbye = null;

try {
  welcome =
    require("../commands/welcome");
} catch (error) {
  welcome = null;
}

try {
  goodbye =
    require("../commands/goodbye");
} catch (error) {
  goodbye = null;
}

// ============================================================
// CLEAN NUMBER
// ============================================================

function cleanNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}

// ============================================================
// SAFE SESSION ID
// ============================================================

function safeSessionId(value) {
  return String(value || "")
    .replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    )
    .slice(0, 100);
}

// ============================================================
// CLEAR RECONNECT TIMER
// ============================================================

function clearReconnectTimer(
  sessionId
) {
  const cleanId =
    safeSessionId(sessionId);

  const timer =
    reconnectTimers.get(cleanId);

  if (timer) {
    clearTimeout(timer);

    reconnectTimers.delete(
      cleanId
    );
  }
}

// ============================================================
// MARK INTENTIONAL STOP
// ============================================================

function markIntentionalStop(
  sessionId
) {
  const cleanId =
    safeSessionId(sessionId);

  if (cleanId) {
    intentionalStops.add(
      cleanId
    );
  }
}

// ============================================================
// CLEAR INTENTIONAL STOP
// ============================================================

function clearIntentionalStop(
  sessionId
) {
  const cleanId =
    safeSessionId(sessionId);

  if (cleanId) {
    intentionalStops.delete(
      cleanId
    );
  }
}

// ============================================================
// IS INTENTIONAL STOP
// ============================================================

function isIntentionalStop(
  sessionId
) {
  const cleanId =
    safeSessionId(sessionId);

  return intentionalStops.has(
    cleanId
  );
}

// ============================================================
// CONNECTED SUCCESS MESSAGE
// ============================================================

async function sendConnectedMessage(
  sock,
  sessionId
) {
  try {

    if (!sock?.user?.id) {

      console.warn(
        `⚠️ CONNECTED MESSAGE: user.id manke [${sessionId}]`
      );

      return;
    }

    const user =
      sock.user;

    const username =
      user.name ||
      user.verifiedName ||
      "Unknown";

    const number =
      String(user.id || "")
        .split(":")[0]
        .split("@")[0]
        .replace(/\D/g, "") ||
      "Unknown";

    const connectedMessage = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃      🌟 TOPFEROS MD 🌟       ┃
┃          V1.0.0              ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭───────❖ 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 ❖───────╮
│                              │
│ 🎉 🦁𝕋𝕆ℙ𝔽𝔼ℝ𝕆𝕊 𝕄𝔻 𝕍1.0.0 𝕆ℕ𝕃𝕀ℕ𝔼 🎉
│                              │
│ ⚡ Prefix   : .
│ 🌐 Mode     : Public
│ 👤 Username : ${username}
│ 📱 Number   : ${number}
│                              │
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭──────❖ 𝐅𝐄𝐀𝐓𝐔𝐑𝐄𝐒 ❖──────╮
│                            │
│ 💞 Allways Online
│ 🔌 Fake Typing
│ 🎤 Fake Recording
│ 🖇️ Auto Status Seen & Like
│ 😋 Auto Status Reply
│ 🌈 Auto React
│ 📞 Anti Call
│ 🤖 Mode Change
│ 📥 Media Download Command
│ 🎞️ Send Song For WhatsApp Channels
│ 🤖 Smart AI Command & Auto Chat
│ 🎀 & Many More Commands...
│                            │
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭──────❖ 𝐐𝐔𝐈𝐂𝐊 𝐌𝐄𝐍𝐔 ❖──────╮
│                              │
│ 📋 Type .menu
│    ➜ To view all commands
│
│ ⚙️ Type .setting
│    ➜ To get the settings portal link
│                              │
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
│      🦁 By TOPFEROS MD
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`;

    const logoPath =
      path.join(
        __dirname,
        "..",
        "assets",
        "logo.png"
      );

    if (
      fs.existsSync(
        logoPath
      )
    ) {

      const logo =
        fs.readFileSync(
          logoPath
        );

      await sock.sendMessage(
        user.id,
        {
          image:
            logo,

          caption:
            connectedMessage
        }
      );

    } else {

      console.warn(
        `⚠️ Logo pa jwenn: ${logoPath}`
      );

      await sock.sendMessage(
        user.id,
        {
          text:
            connectedMessage
        }
      );
    }

    console.log(
      `✅ CONNECTED MESSAGE SENT [${sessionId}]`
    );

  } catch (error) {

    console.error(
      `❌ CONNECTED MESSAGE ERROR [${sessionId}]`,
      error?.stack ||
      error?.message ||
      error
    );
  }
}

// ============================================================
// ACTIVATE SETTINGS PANEL
// ============================================================

function activateSettingsPanel(
  sock,
  sessionId
) {
  try {

    if (
      settingsPanel &&
      typeof
        settingsPanel.setBotConnected ===
        "function"
    ) {

      settingsPanel.setBotConnected(
        sock,
        sessionId
      );

      console.log(
        `⚙️ SETTING PANEL ACTIVATED [${sessionId}]`
      );

      return true;
    }

    console.warn(
      `⚠️ setBotConnected pa jwenn nan settingPanel.js [${sessionId}]`
    );

  } catch (error) {

    console.error(
      `❌ SETTING PANEL CONNECT ERROR [${sessionId}]`,
      error?.stack ||
      error?.message ||
      error
    );
  }

  return false;
}

// ============================================================
// INVALIDATE SETTINGS PANEL
// ============================================================

function invalidateSettingsPanel(
  sock,
  sessionId
) {
  try {

    if (
      settingsPanel &&
      typeof
        settingsPanel.setBotDisconnected ===
        "function"
    ) {

      settingsPanel.setBotDisconnected(
        sock,
        false,
        sessionId
      );

      console.log(
        `⚙️ SETTING PANEL INVALIDATED [${sessionId}]`
      );

      return true;
    }

  } catch (error) {

    console.error(
      `❌ SETTING PANEL DISCONNECT ERROR [${sessionId}]`,
      error?.stack ||
      error?.message ||
      error
    );
  }

  return false;
}

// ============================================================
// CREATE SOCKET
// ============================================================

async function createSocket(
  sessionId
) {

  const cleanId =
    safeSessionId(
      sessionId
    );

  if (!cleanId) {
    throw new Error(
      "sessionId obligatwa."
    );
  }

  // ----------------------------------------------------------
  // IF THIS SESSION WAS INTENTIONALLY STOPPED,
  // DO NOT CREATE IT AGAIN.
  // ----------------------------------------------------------

  if (
    intentionalStops.has(
      cleanId
    )
  ) {

    throw new Error(
      `Session ${cleanId} make intentionally stopped.`
    );
  }

  // ----------------------------------------------------------
  // PREVENT DUPLICATE SOCKET
  // ----------------------------------------------------------

  const existingSocket =
    active.get(
      cleanId
    );

  if (
    existingSocket
  ) {
    return existingSocket;
  }

  // ----------------------------------------------------------
  // LOAD SESSION
  // ----------------------------------------------------------

  let session =
    sessionManager.getSession(
      cleanId
    );

  // ----------------------------------------------------------
  // RESTORE SESSION FROM DISK
  // ----------------------------------------------------------

  if (!session) {

    try {

      session =
        sessionManager.restoreSession(
          cleanId
        );

    } catch (restoreError) {

      console.error(
        `❌ SESSION RESTORE ERROR [${cleanId}]`,
        restoreError?.stack ||
        restoreError?.message ||
        restoreError
      );
    }
  }

  if (!session) {

    throw new Error(
      `Session introuvable: ${cleanId}`
    );
  }

  // ----------------------------------------------------------
  // AUTH DIRECTORY
  // ----------------------------------------------------------

  const authDir =
    session.authDir;

  if (!authDir) {

    throw new Error(
      `authDir manke pou session ${cleanId}`
    );
  }

  fs.mkdirSync(
    authDir,
    {
      recursive:
        true
    }
  );

  console.log(
    `📁 AUTH DIR [${cleanId}]: ${authDir}`
  );

  // ----------------------------------------------------------
  // AUTH STATE
  // ----------------------------------------------------------

  const {
    state,
    saveCreds
  } =
    await useMultiFileAuthState(
      authDir
    );

  // ----------------------------------------------------------
  // BAILEYS VERSION
  // ----------------------------------------------------------

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

    console.warn(
      `⚠️ Impossible jwenn latest Baileys version [${cleanId}]`
    );

    version =
      undefined;
  }

  // ----------------------------------------------------------
  // SOCKET OPTIONS
  // ----------------------------------------------------------

  const socketOptions = {

    ...(version
      ? {
          version
        }
      : {}),

    auth: {

      creds:
        state.creds,

      keys:
        makeCacheableSignalKeyStore(
          state.keys,

          pino({
            level:
              "silent"
          })
        )
    },

    browser:
      Browsers.ubuntu(
        "Chrome"
      ),

    logger:
      pino({
        level:
          "silent"
      }),

    printQRInTerminal:
      false,

    markOnlineOnConnect:
      false,

    generateHighQualityLinkPreview:
      false,

    syncFullHistory:
      false,

    shouldIgnoreJid:
      () => false
  };

  // ----------------------------------------------------------
  // CREATE SOCKET
  // ----------------------------------------------------------

  const sock =
    makeWASocket(
      socketOptions
    );

  // ----------------------------------------------------------
  // REGISTER ACTIVE SOCKET
  // ----------------------------------------------------------

  active.set(
    cleanId,
    sock
  );

  sessionManager.setSocket(
    cleanId,
    sock
  );

  sessionManager.updateSession(
    cleanId,
    {
      status:
        "connecting",

      connected:
        false
    }
  );

  // ----------------------------------------------------------
  // CREDENTIALS
  // ----------------------------------------------------------

  sock.ev.on(
    "creds.update",
    async () => {

      try {

        await saveCreds();

      } catch (error) {

        console.error(
          `❌ CREDS SAVE ERROR [${cleanId}]`,
          error?.message ||
          error
        );
      }
    }
  );

  // ==========================================================
  // CONNECTION UPDATE
  // ==========================================================

  sock.ev.on(
    "connection.update",
    async ({
      connection,
      lastDisconnect,
      qr
    }) => {

      try {

        // ----------------------------------------------------
        // CONNECTING
        // ----------------------------------------------------

        if (
          connection ===
          "connecting"
        ) {

          sessionManager.updateSession(
            cleanId,
            {
              status:
                "connecting",

              connected:
                false
            }
          );

          console.log(
            `🔄 WhatsApp CONNECTING [${cleanId}]`
          );
        }

        // ----------------------------------------------------
        // QR
        // ----------------------------------------------------

        if (qr) {

          console.log(
            `ℹ️ QR received [${cleanId}] - Pairing Code mode active`
          );
        }

        // ----------------------------------------------------
        // OPEN
        // ----------------------------------------------------

        if (
          connection ===
          "open"
        ) {

          clearReconnectTimer(
            cleanId
          );

          clearIntentionalStop(
            cleanId
          );

          sessionManager.updateSession(
            cleanId,
            {
              status:
                "connected",

              connected:
                true,

              pairing:
                false,

              pairingCode:
                null
            }
          );

          sessionManager.endPairing(
            cleanId
          );

          // --------------------------------------------------
          // SETTINGS PANEL
          // --------------------------------------------------

          activateSettingsPanel(
            sock,
            cleanId
          );

          console.log(
            `✅ WhatsApp CONNECTED: ${cleanId}`
          );

          // --------------------------------------------------
          // SEND SUCCESS MESSAGE
          // --------------------------------------------------

          await sendConnectedMessage(
            sock,
            cleanId
          );
        }

        // ----------------------------------------------------
        // CLOSE
        // ----------------------------------------------------

        if (
          connection ===
          "close"
        ) {

          // --------------------------------------------------
          // REMOVE ACTIVE SOCKET
          // --------------------------------------------------

          const currentSocket =
            active.get(
              cleanId
            );

          if (
            currentSocket ===
            sock
          ) {

            active.delete(
              cleanId
            );
          }

          sessionManager.setSocket(
            cleanId,
            null
          );

          // --------------------------------------------------
          // INVALIDATE SETTINGS PANEL
          // --------------------------------------------------

          invalidateSettingsPanel(
            sock,
            cleanId
          );

          const statusCode =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode ??
            lastDisconnect
              ?.error
              ?.statusCode ??
            null;

          const errorMessage =
            lastDisconnect
              ?.error
              ?.message ||
            "Unknown connection error";

          console.error(
            `❌ WhatsApp CONNECTION CLOSED [${cleanId}]`,
            {
              statusCode,

              error:
                errorMessage
            }
          );

          // --------------------------------------------------
          // INTENTIONAL STOP
          // --------------------------------------------------

          if (
            isIntentionalStop(
              cleanId
            )
          ) {

            clearReconnectTimer(
              cleanId
            );

            sessionManager.updateSession(
              cleanId,
              {
                status:
                  "stopped",

                connected:
                  false,

                pairing:
                  false,

                pairingCode:
                  null
              }
            );

            console.log(
              `🛑 INTENTIONAL SESSION STOP [${cleanId}] — NO RECONNECT`
            );

            return;
          }

          // --------------------------------------------------
          // LOGGED OUT
          // --------------------------------------------------

          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {

            clearReconnectTimer(
              cleanId
            );

            sessionManager.updateSession(
              cleanId,
              {
                status:
                  "logged_out",

                connected:
                  false,

                pairing:
                  false,

                pairingCode:
                  null
              }
            );

            console.log(
              `🚪 WhatsApp LOGGED OUT [${cleanId}]`
            );

            return;
          }

          // --------------------------------------------------
          // BAD SESSION
          // --------------------------------------------------

          if (
            statusCode ===
            DisconnectReason.badSession
          ) {

            clearReconnectTimer(
              cleanId
            );

            sessionManager.updateSession(
              cleanId,
              {
                status:
                  "error",

                connected:
                  false,

                pairing:
                  false,

                pairingCode:
                  null
              }
            );

            console.error(
              `❌ BAD SESSION [${cleanId}]`
            );

            return;
          }

          // --------------------------------------------------
          // CONNECTION CLOSED BECAUSE OF MAC / DECRYPTION
          // --------------------------------------------------

          const lowerError =
            String(
              errorMessage || ""
            ).toLowerCase();

          const isCryptoError =
            lowerError.includes(
              "bad mac"
            ) ||
            lowerError.includes(
              "decrypt"
            ) ||
            lowerError.includes(
              "failed to decrypt"
            );

          if (
            isCryptoError
          ) {

            sessionManager.updateSession(
              cleanId,
              {
                status:
                  "crypto_error",

                connected:
                  false,

                pairing:
                  false,

                pairingCode:
                  null
              }
            );

            console.error(
              `🔐 CRYPTO/DECRYPTION ERROR [${cleanId}] — Session auth may need to be reset.`
            );

            // Do NOT automatically delete auth files.
            // Do NOT reconnect endlessly.
            clearReconnectTimer(
              cleanId
            );

            return;
          }

          // --------------------------------------------------
          // NORMAL DISCONNECT → RECONNECT
          // --------------------------------------------------

          sessionManager.updateSession(
            cleanId,
            {
              status:
                "reconnecting",

              connected:
                false,

              pairing:
                false,

              pairingCode:
                null
            }
          );

          // --------------------------------------------------
          // PREVENT DUPLICATE TIMER
          // --------------------------------------------------

          if (
            reconnectTimers.has(
              cleanId
            )
          ) {
            return;
          }

          const timer =
            setTimeout(
              async () => {

                reconnectTimers.delete(
                  cleanId
                );

                if (
                  isIntentionalStop(
                    cleanId
                  )
                ) {

                  console.log(
                    `⏭️ RECONNECT CANCELLED [${cleanId}] — intentional stop`
                  );

                  return;
                }

                try {

                  console.log(
                    `🔁 Reconnecting [${cleanId}]...`
                  );

                  await createSocket(
                    cleanId
                  );

                } catch (error) {

                  console.error(
                    `❌ RECONNECT ERROR [${cleanId}]`,
                    error?.stack ||
                    error?.message ||
                    error
                  );

                  // ------------------------------------------------
                  // SECOND TRY
                  // ------------------------------------------------

                  if (
                    isIntentionalStop(
                      cleanId
                    )
                  ) {
                    return;
                  }

                  if (
                    reconnectTimers.has(
                      cleanId
                    )
                  ) {
                    return;
                  }

                  const retryTimer =
                    setTimeout(
                      async () => {

                        reconnectTimers.delete(
                          cleanId
                        );

                        if (
                          isIntentionalStop(
                            cleanId
                          )
                        ) {
                          return;
                        }

                        try {

                          await createSocket(
                            cleanId
                          );

                        } catch (
                          retryError
                        ) {

                          console.error(
                            `❌ SECOND RECONNECT ERROR [${cleanId}]`,
                            retryError?.stack ||
                            retryError?.message ||
                            retryError
                          );

                        }

                      },
                      5000
                    );

                  reconnectTimers.set(
                    cleanId,
                    retryTimer
                  );
                }

              },
              5000
            );

          reconnectTimers.set(
            cleanId,
            timer
          );
        }

      } catch (error) {

        console.error(
          `❌ CONNECTION UPDATE ERROR [${cleanId}]`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );

  // ==========================================================
  // MESSAGES
  // ==========================================================

  sock.ev.on(
    "messages.upsert",
    async upsert => {

      console.log(
        `📩 MESSAGES.UPSERT RECEIVED [${cleanId}]:`,
        upsert?.type,
        upsert?.messages?.length ||
          0
      );

      try {

        if (
          upsert?.type !==
          "notify"
        ) {
          return;
        }

        for (
          const msg of
          upsert.messages || []
        ) {

          if (
            !msg?.message
          ) {
            continue;
          }

          // ------------------------------------------------
          // IGNORE BOT'S OWN MESSAGE
          // ------------------------------------------------

          if (
            msg?.key?.fromMe
          ) {

            console.log(
              `⏭️ MESSAGE IGNORED [${cleanId}] — fromMe`
            );

            continue;
          }

          // ------------------------------------------------
          // MESSAGE HANDLER
          // ------------------------------------------------

          if (
            messageHandler &&
            typeof
              messageHandler.handleMessage ===
              "function"
          ) {

            await messageHandler.handleMessage(
              sock,
              msg,
              cleanId
            );

          } else {

            console.error(
              `❌ handleMessage pa jwenn nan messageHandler.js [${cleanId}]`
            );
          }
        }

      } catch (error) {

        console.error(
          `❌ MESSAGE HANDLER ERROR [${cleanId}]`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );

  // ==========================================================
  // GROUP PARTICIPANTS
  // ==========================================================

  sock.ev.on(
    "group-participants.update",
    async update => {

      try {

        if (
          update?.action ===
            "add" &&
          welcome?.sendWelcome
        ) {

          await welcome.sendWelcome(
            sock,
            update
          );
        }

        if (
          update?.action ===
            "remove" &&
          goodbye?.sendGoodbye
        ) {

          await goodbye.sendGoodbye(
            sock,
            update
          );
        }

      } catch (error) {

        console.error(
          `❌ GROUP EVENT ERROR [${cleanId}]`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );

  return sock;
}

// ============================================================
// START SESSION
// ============================================================

async function startSession(
  sessionId
) {
  clearIntentionalStop(
    sessionId
  );

  return createSocket(
    sessionId
  );
}

// ============================================================
// REQUEST PAIRING CODE
// ============================================================
// Supports:
// requestPairingCode(number)
// requestPairingCode(sessionId, number)
// ============================================================

async function requestPairingCode(
  sessionIdOrNumber,
  maybeNumber
) {

  let requestedSessionId =
    null;

  let number =
    "";

  // ----------------------------------------------------------
  // FORMAT 1
  // requestPairingCode(number)
  // ----------------------------------------------------------

  if (
    maybeNumber ===
    undefined
  ) {

    number =
      cleanNumber(
        sessionIdOrNumber
      );

  } else {

    // --------------------------------------------------------
    // FORMAT 2
    // requestPairingCode(sessionId, number)
    // --------------------------------------------------------

    requestedSessionId =
      safeSessionId(
        sessionIdOrNumber
      );

    number =
      cleanNumber(
        maybeNumber
      );
  }

  if (!number) {

    throw new Error(
      "Numéro invalide"
    );
  }

  // ----------------------------------------------------------
  // FIND SESSION BY NUMBER
  // ----------------------------------------------------------

  let session =
    sessionManager.getSessionByNumber(
      number
    );

  // ----------------------------------------------------------
  // TRY PANEL SESSION ID
  // ----------------------------------------------------------

  if (
    !session &&
    requestedSessionId
  ) {

    session =
      sessionManager.getSession(
        requestedSessionId
      );

    if (
      !session
    ) {

      try {

        session =
          sessionManager.restoreSession(
            requestedSessionId
          );

      } catch {}
    }
  }

  // ----------------------------------------------------------
  // PREVENT DUPLICATE PAIRING
  // ----------------------------------------------------------

  if (
    session?.pairing
  ) {

    const err =
      new Error(
        "PAIRING_IN_PROGRESS"
      );

    err.code =
      "PAIRING_IN_PROGRESS";

    throw err;
  }

  // ----------------------------------------------------------
  // CREATE SESSION
  // ----------------------------------------------------------

  if (!session) {

    session =
      sessionManager.createSession(
        {
          sessionId:
            requestedSessionId ||
            number,

          number
        }
      );

  } else {

    sessionManager.setNumber(
      session.sessionId,
      number
    );

    session =
      sessionManager.getSession(
        session.sessionId
      );
  }

  if (!session) {

    throw new Error(
      "Session pa kapab kreye."
    );
  }

  const sessionId =
    session.sessionId;

  // ----------------------------------------------------------
  // NEW PAIRING SESSION MUST NOT BE INTENTIONALLY STOPPED
  // ----------------------------------------------------------

  clearIntentionalStop(
    sessionId
  );

  // ----------------------------------------------------------
  // CHECK ALREADY CONNECTED
  // ----------------------------------------------------------

  if (
    session.connected ===
    true
  ) {

    const err =
      new Error(
        "SESSION_ALREADY_CONNECTED"
      );

    err.code =
      "SESSION_ALREADY_CONNECTED";

    throw err;
  }

  // ----------------------------------------------------------
  // START PAIRING
  // ----------------------------------------------------------

  sessionManager.startPairing(
    sessionId
  );

  // ----------------------------------------------------------
  // CREATE SOCKET
  // ----------------------------------------------------------

  let sock;

  try {

    sock =
      await createSocket(
        sessionId
      );

  } catch (error) {

    sessionManager.updateSession(
      sessionId,
      {
        status:
          "pairing_error",

        pairing:
          false,

        pairingCode:
          null
      }
    );

    throw error;
  }

  // ----------------------------------------------------------
  // LOAD AUTH STATE
  // ----------------------------------------------------------

  let state;

  try {

    const auth =
      await useMultiFileAuthState(
        session.authDir
      );

    state =
      auth.state;

  } catch (error) {

    sessionManager.updateSession(
      sessionId,
      {
        status:
          "pairing_error",

        pairing:
          false,

        pairingCode:
          null
      }
    );

    throw error;
  }

  // ----------------------------------------------------------
  // CHECK REGISTERED
  // ----------------------------------------------------------

  if (
    state?.creds?.registered
  ) {

    sessionManager.endPairing(
      sessionId
    );

    sessionManager.updateSession(
      sessionId,
      {
        status:
          "error",

        pairing:
          false,

        pairingCode:
          null
      }
    );

    const err =
      new Error(
        "SESSION_ALREADY_REGISTERED"
      );

    err.code =
      "SESSION_ALREADY_REGISTERED";

    throw err;
  }

  // ----------------------------------------------------------
  // REQUEST PAIRING CODE
  // ----------------------------------------------------------

  try {

    // Give Baileys time to initialize.
    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          1500
        )
    );

    const code =
      await sock.requestPairingCode(
        number
      );

    if (!code) {

      throw new Error(
        "WhatsApp pa retounen pairing code."
      );
    }

    const normalizedCode =
      String(code)
        .trim()
        .replace(
          /\s+/g,
          ""
        );

    sessionManager.setPairingCode(
      sessionId,
      normalizedCode
    );

    sessionManager.updateSession(
      sessionId,
      {
        status:
          "pairing",

        pairing:
          true,

        connected:
          false,

        pairingCode:
          normalizedCode
      }
    );

    console.log(
      `🔐 PAIRING CODE [${sessionId}]: ${normalizedCode}`
    );

    return {
      sessionId,

      number,

      code:
        normalizedCode,

      socket:
        sock
    };

  } catch (error) {

    sessionManager.updateSession(
      sessionId,
      {
        status:
          "pairing_error",

        pairing:
          false,

        pairingCode:
          null
      }
    );

    console.error(
      `❌ PAIRING CODE ERROR [${sessionId}]`,
      error?.stack ||
      error?.message ||
      error
    );

    throw error;
  }
}

// ============================================================
// STOP SESSION
// ============================================================

async function stopSession(
  sessionId
) {

  const cleanId =
    safeSessionId(
      sessionId
    );

  if (!cleanId) {
    return false;
  }

  // ----------------------------------------------------------
  // MARK BEFORE ENDING SOCKET
  // ----------------------------------------------------------

  markIntentionalStop(
    cleanId
  );

  clearReconnectTimer(
    cleanId
  );

  // ----------------------------------------------------------
  // GET SOCKET
  // ----------------------------------------------------------

  const sock =
    active.get(
      cleanId
    ) ||
    sessionManager.getSocket(
      cleanId
    );

  // ----------------------------------------------------------
  // REMOVE FROM ACTIVE
  // ----------------------------------------------------------

  active.delete(
    cleanId
  );

  // ----------------------------------------------------------
  // INVALIDATE PANEL FIRST
  // ----------------------------------------------------------

  invalidateSettingsPanel(
    sock,
    cleanId
  );

  // ----------------------------------------------------------
  // END SOCKET
  // ----------------------------------------------------------

  if (sock) {

    try {

      sock.end(
        new Error(
          "Session stopped"
        )
      );

    } catch (error) {

      console.warn(
        `⚠️ SOCKET END WARNING [${cleanId}]`,
        error?.message ||
        error
      );
    }
  }

  // ----------------------------------------------------------
  // CLEAR SOCKET
  // ----------------------------------------------------------

  sessionManager.setSocket(
    cleanId,
    null
  );

  // ----------------------------------------------------------
  // UPDATE STATE
  // ----------------------------------------------------------

  sessionManager.updateSession(
    cleanId,
    {
      status:
        "stopped",

      connected:
        false,

      pairing:
        false,

      pairingCode:
        null
    }
  );

  console.log(
    `🛑 SESSION STOPPED [${cleanId}]`
  );

  return true;
}

// ============================================================
// REMOVE SESSION
// ============================================================

async function removeSession(
  sessionId
) {

  const cleanId =
    safeSessionId(
      sessionId
    );

  if (!cleanId) {
    return false;
  }

  // ----------------------------------------------------------
  // MARK INTENTIONAL STOP BEFORE REMOVAL
  // ----------------------------------------------------------

  markIntentionalStop(
    cleanId
  );

  clearReconnectTimer(
    cleanId
  );

  // ----------------------------------------------------------
  // STOP SOCKET
  // ----------------------------------------------------------

  await stopSession(
    cleanId
  );

  // ----------------------------------------------------------
  // REMOVE SESSION + AUTH DIRECTORY
  // ----------------------------------------------------------

  const removed =
    sessionManager.removeSession(
      cleanId
    );

  // ----------------------------------------------------------
  // KEEP INTENTIONAL STOP MARK
  // ----------------------------------------------------------
  // It prevents a late connection.close event from
  // creating another socket.
  // It will be cleared when a new pairing starts.

  console.log(
    `🗑️ SESSION REMOVED [${cleanId}]`
  );

  return removed;
}

// ============================================================
// RESET SESSION
// ============================================================
// This is OPTIONAL and useful for a corrupted auth session.
// It removes ONLY the selected session's auth directory.
// ============================================================

async function resetSession(
  sessionId
) {

  const cleanId =
    safeSessionId(
      sessionId
    );

  if (!cleanId) {
    return false;
  }

  console.log(
    `♻️ RESETTING SESSION [${cleanId}]`
  );

  return removeSession(
    cleanId
  );
}

// ============================================================
// RESTORE STORED SESSIONS
// ============================================================

async function restoreStoredSessions() {

  const ids =
    sessionManager.getStoredSessionIds();

  const restored = [];

  for (
    const id of ids
  ) {

    const cleanId =
      safeSessionId(id);

    if (!cleanId) {
      continue;
    }

    if (
      isIntentionalStop(
        cleanId
      )
    ) {
      continue;
    }

    try {

      let session =
        sessionManager.getSession(
          cleanId
        );

      if (!session) {

        session =
          sessionManager.restoreSession(
            cleanId
          );
      }

      if (!session) {
        continue;
      }

      if (
        session.status ===
        "logged_out"
      ) {
        continue;
      }

      // ------------------------------------------------------
      // Check whether auth files actually exist.
      // ------------------------------------------------------

      if (
        !session.authDir ||
        !fs.existsSync(
          session.authDir
        )
      ) {
        continue;
      }

      await createSocket(
        cleanId
      );

      restored.push(
        cleanId
      );

    } catch (error) {

      console.error(
        `❌ RESTORE ERROR [${cleanId}]`,
        error?.stack ||
        error?.message ||
        error
      );
    }
  }

  return restored;
}

// ============================================================
// ATTACH MESSAGE LISTENER
// ============================================================

async function attachMessageListener(
  sock,
  sessionId
) {

  if (!sock) {
    return null;
  }

  // Message listener is attached directly
  // inside createSocket().
  return sock;
}

// ============================================================
// ATTACH CONNECTION LISTENER
// ============================================================

async function attachConnectionListener(
  sock,
  sessionId
) {

  if (!sock) {
    return null;
  }

  // Connection listener is attached directly
  // inside createSocket().
  return sock;
}

// ============================================================
// START
// ============================================================

async function start() {

  try {

    const restored =
      await restoreStoredSessions();

    console.log(
      `🚀 TOPFEROS MD: ${restored.length} session(s) restored.`
    );

    return restored;

  } catch (error) {

    console.error(
      "❌ TOPFEROS START ERROR",
      error?.stack ||
      error?.message ||
      error
    );

    return [];
  }
}

// ============================================================
// STOP ALL
// ============================================================

async function stop() {

  const ids = [
    ...active.keys()
  ];

  for (
    const id of ids
  ) {

    await stopSession(
      id
    );
  }

  for (
    const timer of
    reconnectTimers.values()
  ) {

    clearTimeout(
      timer
    );
  }

  reconnectTimers.clear();

  return true;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {

  createSocket,

  startSession,

  requestPairingCode,

  stopSession,

  removeSession,

  resetSession,

  restoreStoredSessions,

  attachMessageListener,

  attachConnectionListener,

  start,

  stop
};