"use strict";

const path = require("path");
const fs = require("fs");
const pino = require("pino");

const baileys =
  require("@whiskeysockets/baileys");

const makeWASocket =
  baileys.default;

const {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion
} = baileys;

const config =
  require("./config");

const {
  handleMessage
} = require("./messageHandler");

const {
  attachStatusHandler
} = require("./statusHandler");

/*
|--------------------------------------------------------------------------
| LOGGER
|--------------------------------------------------------------------------
*/

const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    "info"
});

/*
|--------------------------------------------------------------------------
| SESSION DIRECTORY
|--------------------------------------------------------------------------
*/

const SESSIONS_DIR =
  path.resolve(
    config?.session?.directory ||
      process.env.SESSIONS_DIR ||
      path.join(
        process.cwd(),
        "sessions"
      )
  );

if (
  !fs.existsSync(
    SESSIONS_DIR
  )
) {
  fs.mkdirSync(
    SESSIONS_DIR,
    {
      recursive: true
    }
  );
}

/*
|--------------------------------------------------------------------------
| ACTIVE SESSIONS
|--------------------------------------------------------------------------
*/

const activeSessions =
  new Map();

const reconnectTimers =
  new Map();

const manuallyStopped =
  new Set();

/*
|--------------------------------------------------------------------------
| DEFAULT AUTOMATIONS
|--------------------------------------------------------------------------
*/

function getDefaultAutomationSettings() {
  const automation =
    config?.automation || {};

  return {
    alwaysOnline:
      automation.alwaysOnline === true,

    fakeTyping:
      automation.fakeTyping === true,

    fakeRecording:
      automation.fakeRecording === true,

    autoStatusSeen:
      automation.autoStatusSeen !== false,

    autoStatusReply:
      automation.autoStatusReply !== false,

    autoStatusReact:
      automation.autoStatusReact !== false,

    antiDelete:
      automation.antiDelete !== false,

    antiDeleteMode:
      automation.antiDeleteMode ||
      "private",

    antiCall:
      automation.antiCall === true,

    antiBug:
      automation.antiBug === true,

    antiBotFilter:
      automation.antiBotFilter === true,

    antiBotAction:
      automation.antiBotAction ||
      "Delete",

    antiBlock:
      Array.isArray(
        config?.security
          ?.antiBlockNumbers
      )
        ? [
            ...config.security
              .antiBlockNumbers
          ]
        : []
  };
}

/*
|--------------------------------------------------------------------------
| NORMALIZE NUMBER
|--------------------------------------------------------------------------
*/

function normalizeNumber(number) {
  return String(
    number || ""
  )
    .replace(/\D/g, "")
    .trim();
}

/*
|--------------------------------------------------------------------------
| SESSION ID
|--------------------------------------------------------------------------
*/

function getSessionId(number) {
  const sessionId =
    normalizeNumber(number);

  if (!sessionId) {
    throw new Error(
      "A valid WhatsApp number is required."
    );
  }

  return sessionId;
}

/*
|--------------------------------------------------------------------------
| SESSION PATH
|--------------------------------------------------------------------------
*/

function getSessionPath(
  sessionId
) {
  return path.join(
    SESSIONS_DIR,
    sessionId
  );
}

/*
|--------------------------------------------------------------------------
| GET SESSION
|--------------------------------------------------------------------------
*/

function getSession(
  sessionId
) {
  return activeSessions.get(
    String(sessionId)
  );
}

/*
|--------------------------------------------------------------------------
| GET ACTIVE SESSIONS
|--------------------------------------------------------------------------
*/

function getActiveSessions() {
  return activeSessions;
}

/*
|--------------------------------------------------------------------------
| GET SESSION QR
|--------------------------------------------------------------------------
*/

function getSessionQR(
  number
) {
  const sessionId =
    getSessionId(number);

  const session =
    activeSessions.get(
      sessionId
    );

  return (
    session?.qr ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| CHECK CONNECTION
|--------------------------------------------------------------------------
*/

function isConnected(
  number
) {
  const sessionId =
    getSessionId(number);

  const session =
    activeSessions.get(
      sessionId
    );

  return (
    session?.connected === true
  );
}

/*
|--------------------------------------------------------------------------
| GET SESSION AUTOMATION
|--------------------------------------------------------------------------
*/

function getSessionAutomation(
  number
) {
  const sessionId =
    getSessionId(number);

  const session =
    activeSessions.get(
      sessionId
    );

  if (!session) {
    return null;
  }

  return {
    ...session.automation
  };
}

/*
|--------------------------------------------------------------------------
| UPDATE SESSION AUTOMATION
|--------------------------------------------------------------------------
*/

function updateSessionAutomation(
  number,
  updates = {}
) {
  const sessionId =
    getSessionId(number);

  const session =
    activeSessions.get(
      sessionId
    );

  if (!session) {
    return null;
  }

  session.automation = {
    ...session.automation,
    ...updates
  };

  session.automation.alwaysOnline =
    session.automation.alwaysOnline === true;

  session.automation.fakeTyping =
    session.automation.fakeTyping === true;

  session.automation.fakeRecording =
    session.automation.fakeRecording === true;

  session.automation.autoStatusSeen =
    session.automation.autoStatusSeen !== false;

  session.automation.autoStatusReply =
    session.automation.autoStatusReply !== false;

  session.automation.autoStatusReact =
    session.automation.autoStatusReact !== false;

  session.automation.antiDelete =
    session.automation.antiDelete !== false;

  session.automation.antiCall =
    session.automation.antiCall === true;

  session.automation.antiBug =
    session.automation.antiBug === true;

  session.automation.antiBotFilter =
    session.automation.antiBotFilter === true;

  return {
    ...session.automation
  };
}

/*
|--------------------------------------------------------------------------
| WELCOME MESSAGE
|--------------------------------------------------------------------------
*/

function createWelcomeMessage(
  userNumber
) {
  const user =
    String(
      userNumber || ""
    ).replace(
      /\D/g,
      ""
    );

  const botName =
    config?.bot?.name ||
    "TOPFEROS MD";

  const botVersion =
    config?.bot?.version ||
    "2.0.0";

  const prefix =
    config?.bot?.prefix ||
    ".";

  const mode =
    config?.bot?.mode ||
    "Public";

  const language =
    config?.bot?.language ||
    "English";

  const footer =
    config?.bot?.footer ||
    "🦁 TECH BY TOPFEROS MD 🐑";

  return `
╭━━━〔 🦁 TOPFEROS MD V2.0.0 🐑 〕━━━╮
┃
┃ 🎉 WELCOME TO TOPFEROS MD
┃
┃ 🟢 CONNECTION SUCCESSFUL
┃
┃ 👤 USER
┃ └─ @${user}
┃
┃ 🟢 STATUS: ONLINE & READY
┃
┃ ⚙️ BOT INFORMATION
┃ ├─ Name     : ${botName}
┃ ├─ Version  : V${botVersion}
┃ ├─ Prefix   : ${prefix}
┃ ├─ Mode     : ${mode}
┃ └─ Language : ${language}
┃
┃ ✨ AVAILABLE FEATURES
┃
┃ 👥 GROUP
┃ ├─ Group Management
┃ ├─ Group Rules
┃ ├─ Warnings System
┃ └─ Group Automation
┃
┃ 🛡️ SECURITY
┃ ├─ Anti-Delete
┃ ├─ Anti-Call
┃ ├─ Anti-Bug Protection
┃ ├─ Anti-Bot Filter
┃ └─ Anti-Block
┃
┃ ⚡ AUTOMATION
┃ ├─ Always Online
┃ ├─ Auto Status
┃ ├─ Auto Reply
┃ ├─ Auto React
┃ ├─ Fake Typing
┃ └─ Fake Recording
┃
┃ 🤖 AI
┃ └─ AI Assistant & Prompt System
┃
┃ 🎵 MEDIA
┃ ├─ Music Search & Download
┃ ├─ Video Download
┃ └─ Media Tools
┃
┃ ⚙️ SYSTEM
┃ ├─ Multi-Session
┃ ├─ Language System
┃ └─ Custom Configuration
┃
┃ 📖 COMMANDS
┃ └─ Type ${prefix}menu to explore
┃
┃ ⚙️ SETTINGS
┃ └─ Type ${prefix}setting to configure
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

${footer}
`;
}

/*
|--------------------------------------------------------------------------
| SEND WELCOME MESSAGE
|--------------------------------------------------------------------------
*/

async function sendWelcomeMessage(
  sock,
  sessionId
) {
  try {
    if (
      !sock?.user?.id
    ) {
      logger.warn(
        `[${sessionId}] Cannot send welcome message: bot JID unavailable.`
      );

      return false;
    }

    const jid =
      sock.user.id.split(":")[0] +
      "@s.whatsapp.net";

    const message =
      createWelcomeMessage(
        sessionId
      );

    await sock.sendMessage(
      jid,
      {
        text: message,
        mentions: [jid]
      }
    );

    logger.info(
      `[${sessionId}] Welcome message sent.`
    );

    return true;
  } catch (error) {
    logger.error(
      {
        error:
          error?.stack ||
          error?.message ||
          String(error)
      },
      `[${sessionId}] Failed to send welcome message.`
    );

    return false;
  }
}

/*
|--------------------------------------------------------------------------
| CONNECT SESSION
|--------------------------------------------------------------------------
*/

async function connectSession(
  number,
  options = {}
) {
  const sessionId =
    getSessionId(number);

  /*
   * Prevent duplicate sockets.
   */

  const existing =
    activeSessions.get(
      sessionId
    );

  if (
    existing?.sock
  ) {
    return existing.sock;
  }

  manuallyStopped.delete(
    sessionId
  );

  const sessionPath =
    getSessionPath(
      sessionId
    );

  if (
    !fs.existsSync(
      sessionPath
    )
  ) {
    fs.mkdirSync(
      sessionPath,
      {
        recursive: true
      }
    );
  }

  /*
   * Load multi-file authentication.
   */

  const {
    state,
    saveCreds
  } =
    await useMultiFileAuthState(
      sessionPath
    );

  /*
   * Fetch latest supported version.
   */

  let version;

  try {
    const latest =
      await fetchLatestBaileysVersion();

    if (
      Array.isArray(
        latest?.version
      )
    ) {
      version =
        latest.version;
    }
  } catch (error) {
    logger.warn(
      {
        error:
          error?.message ||
          String(error)
      },
      `[${sessionId}] Could not fetch latest WhatsApp version.`
    );
  }

  /*
   * Session automation.
   */

  const automation = {
    ...getDefaultAutomationSettings(),
    ...(options.automation || {})
  };

  /*
   * Normalize automation.
   */

  automation.autoStatusReact =
    automation.autoStatusReact !== false;

  automation.autoStatusSeen =
    automation.autoStatusSeen !== false;

  automation.autoStatusReply =
    automation.autoStatusReply !== false;

  /*
   * Socket configuration.
   */

  const socketConfig = {
    auth: {
      creds:
        state.creds,

      keys:
        makeCacheableSignalKeyStore(
          state.keys,
          logger
        )
    },

    browser:
      Browsers.ubuntu(
        "Chrome"
      ),

    printQRInTerminal:
      false,

    syncFullHistory:
      false,

    markOnlineOnConnect:
      automation.alwaysOnline === true
  };

  if (version) {
    socketConfig.version =
      version;
  }

  /*
   * Create socket.
   */

  const sock =
    makeWASocket(
      socketConfig
    );

  /*
   * Store session.
   */

const session = {
  sock,

  sessionId,

  number:
    sessionId,

  sessionPath,

  automation,

  registered:
    state.creds.registered === true,

  connected:
    false,
    welcomeSent:
      false,

    qr:
      null,

    pairing:
      false,

    pairingCode:
      null,

    pairingNumber:
      null,

    createdAt:
      Date.now(),

    lastConnectedAt:
      null
  };

  activeSessions.set(
    sessionId,
    session
  );

  /*
   * Save credentials continuously.
   */

  sock.ev.on(
  "creds.update",
  async (creds) => {
    await saveCreds(creds);

    const currentSession =
      activeSessions.get(
        sessionId
      );

    if (currentSession) {
      currentSession.registered =
        state.creds.registered === true;
    }
  }
);

  /*
   |--------------------------------------------------------------------------
   | STATUS HANDLER
   |--------------------------------------------------------------------------
   */

  try {
    attachStatusHandler(
      sock,
      {
        autoStatusReact:
          automation.autoStatusReact === true,

        autoStatusSeen:
          automation.autoStatusSeen === true,

        autoStatusReply:
          automation.autoStatusReply === true,

        aiModel:
          config?.ai?.model || undefined
      }
    );
  } catch (error) {
    logger.error(
      {
        error:
          error?.stack ||
          error?.message ||
          String(error)
      },
      `[${sessionId}] Failed to attach status handler.`
    );
  }

  /*
   |--------------------------------------------------------------------------
   | CONNECTION UPDATE
   |--------------------------------------------------------------------------
   */

  sock.ev.on(
    "connection.update",
    async (
      update
    ) => {
      const {
        connection,
        lastDisconnect,
        qr
      } = update;

      /*
       * QR generated.
       */

      if (qr) {
        const current =
          activeSessions.get(
            sessionId
          );

        if (current) {
          current.qr =
            qr;
        }

        logger.info(
          `[${sessionId}] WhatsApp pairing QR generated.`
        );
      }

      /*
       * CONNECTED.
       */

      if (
        connection ===
        "open"
      ) {
        const current =
          activeSessions.get(
            sessionId
          );

        if (!current) {
          return;
        }

        current.connected =
          true;

        current.lastConnectedAt =
          Date.now();

        current.qr =
          null;

        current.pairing =
          false;

        current.pairingCode =
          null;

        logger.info(
          `[${sessionId}] 🟢 TOPFEROS MD V2.0.0 connected.`
        );

        logger.info(
          `[${sessionId}] Automations: ` +
          `alwaysOnline=${automation.alwaysOnline}, ` +
          `autoStatusSeen=${automation.autoStatusSeen}, ` +
          `autoStatusReply=${automation.autoStatusReply}, ` +
          `autoStatusReact=${automation.autoStatusReact}, ` +
          `antiDelete=${automation.antiDelete}, ` +
          `antiDeleteMode=${automation.antiDeleteMode}`
        );

        /*
         * Send welcome only once for
         * this socket connection.
         */

        if (
          !current.welcomeSent
        ) {
          current.welcomeSent =
            true;

          await sendWelcomeMessage(
            sock,
            sessionId
          );
        }

        /*
         * Clear reconnect timer.
         */

        const timer =
          reconnectTimers.get(
            sessionId
          );

        if (timer) {
          clearTimeout(
            timer
          );

          reconnectTimers.delete(
            sessionId
          );
        }
      }

      /*
       * CONNECTION CLOSED.
       */

      if (
        connection ===
        "close"
      ) {
        const current =
          activeSessions.get(
            sessionId
          );

        if (current) {
          current.connected =
            false;
        }

        /*
         * Manual disconnect.
         */

        if (
          manuallyStopped.has(
            sessionId
          )
        ) {
          logger.info(
            `[${sessionId}] 🔴 Session stopped manually.`
          );

          return;
        }

        /*
         * Disconnect status.
         */

        const statusCode =
          lastDisconnect
            ?.error
            ?.output
            ?.statusCode;

        const shouldReconnect =
          statusCode !==
          DisconnectReason.loggedOut;

        logger.warn(
          `[${sessionId}] Connection closed. ` +
          `Status=${statusCode || "unknown"} ` +
          `Reconnect=${shouldReconnect}`
        );

        /*
         * Logged out:
         * keep session files untouched,
         * but do not reconnect automatically.
         */

        if (!shouldReconnect) {
          logger.error(
            `[${sessionId}] WhatsApp session logged out.`
          );

          activeSessions.delete(
            sessionId
          );

          return;
        }

        /*
         * Prevent duplicate reconnect timers.
         */

        if (
          reconnectTimers.has(
            sessionId
          )
        ) {
          return;
        }

        const reconnectDelay =
          Number(
            config?.connection
              ?.reconnectDelay
          ) ||
          5000;

        const timer =
          setTimeout(
            async () => {
              reconnectTimers.delete(
                sessionId
              );

              if (
                manuallyStopped.has(
                  sessionId
                )
              ) {
                return;
              }

              try {
                activeSessions.delete(
                  sessionId
                );

                await connectSession(
                  sessionId,
                  {
                    automation
                  }
                );
              } catch (error) {
                logger.error(
                  {
                    error:
                      error?.stack ||
                      error?.message ||
                      String(error)
                  },
                  `[${sessionId}] Reconnection failed.`
                );
              }
            },
            reconnectDelay
          );

        reconnectTimers.set(
          sessionId,
          timer
        );
      }
    }
  );

  /*
   |--------------------------------------------------------------------------
   | NORMAL MESSAGE EVENTS
   |--------------------------------------------------------------------------
   */

  sock.ev.on(
    "messages.upsert",
    async (
      event
    ) => {
      if (
        !event ||
        !Array.isArray(
          event.messages
        )
      ) {
        return;
      }

      for (
        const message of
          event.messages
      ) {
        try {
          if (
            !message?.message
          ) {
            continue;
          }

          /*
           * Status messages are handled
           * exclusively by statusHandler.
           */

          if (
            message?.key
              ?.remoteJid ===
            "status@broadcast"
          ) {
            continue;
          }

          await handleMessage(
            sock,
            message,
            sessionId
          );
        } catch (error) {
          logger.error(
            {
              error:
                error?.stack ||
                error?.message ||
                String(error)
            },
            `[${sessionId}] Message handler error.`
          );
        }
      }
    }
  );

  return sock;
}

/*
|--------------------------------------------------------------------------
| PAIR SESSION
|--------------------------------------------------------------------------
|
| Creates an isolated WhatsApp session and
| requests a WhatsApp Pairing Code.
|
| Example:
|
| .pair 509XXXXXXXX
|
| Number format:
| country code + number
| digits only
|
|--------------------------------------------------------------------------
*/

async function pairSession(
  number
) {
  const sessionId =
    getSessionId(number);

  /*
   * Basic phone-number validation.
   */

  if (
    sessionId.length < 8 ||
    sessionId.length > 15
  ) {
    throw new Error(
      "Invalid phone number. Use country code + number."
    );
  }

  /*
   * Do not create another socket if
   * this session is already connected.
   */

  const existing =
    activeSessions.get(
      sessionId
    );

  if (
    existing?.sock &&
    existing.connected === true
  ) {
    throw new Error(
      "This number is already connected."
    );
  }

  /*
   * If a pairing code is already waiting,
   * return the existing one.
   */

  if (
    existing?.pairing &&
    existing?.pairingCode
  ) {
    return {
      sessionId,

      pairingCode:
        existing.pairingCode
    };
  }

  /*
   * Create a normal session first.
   */

  const sock =
    await connectSession(
      sessionId
    );

  /*
   * Get the session object.
   */

  const session =
    activeSessions.get(
      sessionId
    );

  if (!session) {
    throw new Error(
      "Session could not be created."
    );
  }

  /*
   * The session may already have
   * valid credentials.
   */

  if (
  session.registered === true
) {
  throw new Error(
    "This session is already registered."
  );
}

  /*
   * Request WhatsApp Pairing Code.
   *
   * The @dexterid/baileys package used
   * by this project exposes:
   *
   * sock.requestPairingCode(number)
   */

  try {
    session.pairing =
      true;

    session.pairingNumber =
      sessionId;

    const code =
      await sock.requestPairingCode(
        sessionId
      );

    if (!code) {
      session.pairing =
        false;

      session.pairingNumber =
        null;

      throw new Error(
        "WhatsApp did not return a pairing code."
      );
    }

    /*
     * Keep the original code.
     *
     * WhatsApp pairing codes can contain
     * letters and numbers. We do not modify
     * the value returned by Baileys.
     */

    session.pairingCode =
      String(code).trim();

    logger.info(
      `[${sessionId}] Pairing code generated successfully.`
    );

    return {
      sessionId,

      pairingCode:
        session.pairingCode
    };
  } catch (error) {
    session.pairing =
      false;

    session.pairingNumber =
      null;

    session.pairingCode =
      null;

    logger.error(
      {
        error:
          error?.stack ||
          error?.message ||
          String(error)
      },
      `[${sessionId}] Failed to generate pairing code.`
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| DISCONNECT SESSION
|--------------------------------------------------------------------------
|
| IMPORTANT:
| - Socket is closed
| - Session remains on disk
| - Credentials are NOT deleted
| - User can reconnect later
|--------------------------------------------------------------------------
*/

async function disconnectSession(
  number
) {
  const sessionId =
    getSessionId(number);

  manuallyStopped.add(
    sessionId
  );

  /*
   * Cancel reconnect timer.
   */

  const timer =
    reconnectTimers.get(
      sessionId
    );

  if (timer) {
    clearTimeout(
      timer
    );

    reconnectTimers.delete(
      sessionId
    );
  }

  /*
   * Get active session.
   */

  const session =
    activeSessions.get(
      sessionId
    );

  if (!session?.sock) {
    return false;
  }

  /*
   * Close socket only.
   */

  try {
    session.sock.end(
      undefined
    );
  } catch (error) {
    logger.warn(
      {
        error:
          error?.message ||
          String(error)
      },
      `[${sessionId}] Error while closing WhatsApp socket.`
    );
  }

  /*
   * Remove from active memory.
   *
   * Authentication files remain untouched.
   */

  activeSessions.delete(
    sessionId
  );

  logger.info(
    `[${sessionId}] 🔴 WhatsApp disconnected without deleting session credentials.`
  );

  return true;
}

/*
|--------------------------------------------------------------------------
| RECONNECT SESSION
|--------------------------------------------------------------------------
*/

async function reconnectSession(
  number
) {
  const sessionId =
    getSessionId(number);

  manuallyStopped.delete(
    sessionId
  );

  /*
   * Cancel pending reconnect timer.
   */

  const timer =
    reconnectTimers.get(
      sessionId
    );

  if (timer) {
    clearTimeout(
      timer
    );

    reconnectTimers.delete(
      sessionId
    );
  }

  /*
   * Close old socket if present.
   */

  const existing =
    activeSessions.get(
      sessionId
    );

  if (existing?.sock) {
    try {
      existing.sock.end(
        undefined
      );
    } catch {
      /*
       * Ignore socket close errors.
       */
    }

    activeSessions.delete(
      sessionId
    );
  }

  /*
   * Reuse stored authentication.
   */

  return connectSession(
    sessionId
  );
}

/*
|--------------------------------------------------------------------------
| DISCONNECT ALL SESSIONS
|--------------------------------------------------------------------------
|
| Used during application shutdown.
| Credentials remain preserved.
|--------------------------------------------------------------------------
*/

async function disconnectAllSessions() {
  const sessionIds = [
    ...activeSessions.keys()
  ];

  for (
    const sessionId of
      sessionIds
  ) {
    try {
      await disconnectSession(
        sessionId
      );
    } catch (error) {
      logger.error(
        {
          error:
            error?.message ||
            String(error)
        },
        `[${sessionId}] Failed to disconnect session during shutdown.`
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  connectSession,

  pairSession,

  disconnectSession,

  reconnectSession,

  disconnectAllSessions,

  getSession,

  getActiveSessions,

  getSessionQR,

  isConnected,

  getSessionAutomation,

  updateSessionAutomation,

  getDefaultAutomationSettings,

  createWelcomeMessage,

  sendWelcomeMessage,

  getSessionId,

  getSessionPath,

  normalizeNumber,

  SESSIONS_DIR
};