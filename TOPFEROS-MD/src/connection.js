"use strict";

const path = require("path");
const fs = require("fs");
const pino = require("pino");

const makeWASocket =
  require("@whiskeysockets/baileys").default;

const {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const config = require("./config");

/*
|--------------------------------------------------------------------------
| LOGGER
|--------------------------------------------------------------------------
*/

const logger = pino({
  level: process.env.LOG_LEVEL || "info"
});

/*
|--------------------------------------------------------------------------
| SESSION DIRECTORY
|--------------------------------------------------------------------------
*/

const SESSIONS_DIR = path.resolve(
  process.env.SESSIONS_DIR ||
    path.join(process.cwd(), "sessions")
);

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, {
    recursive: true
  });
}

/*
|--------------------------------------------------------------------------
| ACTIVE SESSIONS
|--------------------------------------------------------------------------
*/

const activeSessions = new Map();

const reconnectTimers = new Map();

const manuallyStopped = new Set();

/*
|--------------------------------------------------------------------------
| DEFAULT AUTOMATIONS
|--------------------------------------------------------------------------
|
| Sa yo aktive otomatikman lè WhatsApp konekte.
|
| IMPORTANT:
| autoStatusReact pa chwazi emoji a.
| AI reaction service la ap analize status la epi chwazi
| emoji ki apwopriye a.
|
|--------------------------------------------------------------------------
*/

const DEFAULT_AUTOMATION = {
  alwaysOnline: false,

  fakeTyping: false,

  fakeRecording: false,

  autoStatusSeen: true,

  autoStatusReply: true,

  autoStatusReact: true,

  antiDelete: true,

  antiDeleteMode: "private",

  antiCall: false,

  antiBugProtection: false,

  antiBotFilter: false,

  antiBotAction: "delete",

  antiBlock: []
};

/*
|--------------------------------------------------------------------------
| WELCOME MESSAGE
|--------------------------------------------------------------------------
*/

function createWelcomeMessage(userNumber) {
  const user = String(userNumber || "").replace(
    /\D/g,
    ""
  );

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
┃ ├─ Name     : TOPFEROS MD
┃ ├─ Version  : V2.0.0
┃ ├─ Prefix   : .
┃ ├─ Mode     : Public
┃ └─ Language : English
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
┃ └─ Type .menu to explore
┃
┃ ⚙️ SETTINGS
┃ └─ Type .setting to configure
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🦁 TECH BY TOPFEROS MD 🐑
`;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE NUMBER
|--------------------------------------------------------------------------
*/

function normalizeNumber(number) {
  return String(number || "")
    .replace(/\D/g, "")
    .trim();
}

/*
|--------------------------------------------------------------------------
| SESSION ID
|--------------------------------------------------------------------------
*/

function getSessionId(number) {
  const sessionId = normalizeNumber(number);

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

function getSessionPath(sessionId) {
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

function getSession(sessionId) {
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
| DEFAULT AUTOMATION SETTINGS
|--------------------------------------------------------------------------
*/

function getDefaultAutomationSettings() {
  return {
    ...DEFAULT_AUTOMATION
  };
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
    if (!sock?.user?.id) {
      logger.warn(
        `[${sessionId}] Cannot send welcome message: bot JID unavailable.`
      );

      return false;
    }

    const jid =
      sock.user.id.split(":")[0];

    const message =
      createWelcomeMessage(sessionId);

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
          error?.message
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
   * Do not create duplicate sockets.
   */

  const existing =
    activeSessions.get(sessionId);

  if (existing?.sock) {
    return existing.sock;
  }

  /*
   * Allow automatic reconnect.
   */

  manuallyStopped.delete(
    sessionId
  );

  /*
   * Session directory.
   */

  const sessionPath =
    getSessionPath(sessionId);

  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, {
      recursive: true
    });
  }

  /*
   * WhatsApp authentication state.
   */

  const {
    state,
    saveCreds
  } =
    await useMultiFileAuthState(
      sessionPath
    );

  /*
   * Fetch current Baileys WhatsApp version.
   */

  let version;

  try {
    const latest =
      await fetchLatestBaileysVersion();

    if (latest?.version) {
      version = latest.version;
    }
  } catch (error) {
    logger.warn(
      {
        error:
          error?.message
      },
      `[${sessionId}] Could not fetch latest WhatsApp version.`
    );
  }

  /*
   * Automation settings.
   *
   * Panel settings can override these later.
   */

  const automation = {
    ...getDefaultAutomationSettings(),
    ...(options.automation || {})
  };

  /*
   * Create socket configuration.
   */

  const socketConfig = {
    auth: {
      creds: state.creds,

      keys: makeCacheableSignalKeyStore(
        state.keys,
        logger
      )
    },

    browser:
      Browsers.ubuntu("Chrome"),

    printQRInTerminal: false,

    syncFullHistory: false,

    markOnlineOnConnect:
      automation.alwaysOnline === true
  };

  /*
   * Use fetched version when available.
   */

  if (version) {
    socketConfig.version = version;
  }

  /*
   * Create WhatsApp socket.
   */

  const sock =
    makeWASocket(socketConfig);

  /*
   * Save active session.
   */

  activeSessions.set(
    sessionId,
    {
      sock,

      sessionId,

      number: sessionId,

      sessionPath,

      automation,

      connected: false,

      welcomeSent: false,

      createdAt: Date.now(),

      lastConnectedAt: null
    }
  );

  /*
   * Save authentication credentials.
   *
   * This is required so updated WhatsApp keys
   * remain available after restart/reconnect.
   */

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  /*
   |--------------------------------------------------------------------------
   | CONNECTION UPDATE
   |--------------------------------------------------------------------------
   */

  sock.ev.on(
    "connection.update",
    async (update) => {
      const {
        connection,
        lastDisconnect,
        qr
      } = update;

      /*
       * QR generated.
       *
       * The panel can use this later.
       */

      if (qr) {
        logger.info(
          `[${sessionId}] WhatsApp pairing QR generated.`
        );

        const current =
          activeSessions.get(
            sessionId
          );

        if (current) {
          current.qr = qr;
        }
      }

      /*
       * CONNECTION OPEN
       */

      if (connection === "open") {
        const current =
          activeSessions.get(
            sessionId
          );

        if (!current) {
          return;
        }

        current.connected = true;

        current.lastConnectedAt =
          Date.now();

        current.qr = null;

        logger.info(
          `[${sessionId}] 🟢 TOPFEROS MD V2.0.0 connected.`
        );

        /*
         * Log active automations.
         */

        logger.info(
          `[${sessionId}] Automations: ` +
          `autoStatusSeen=${automation.autoStatusSeen}, ` +
          `autoStatusReply=${automation.autoStatusReply}, ` +
          `autoStatusReact=${automation.autoStatusReact}, ` +
          `antiDelete=${automation.antiDelete}, ` +
          `antiDeleteMode=${automation.antiDeleteMode}`
        );

        /*
         * Send welcome message only once
         * for this active connection.
         *
         * Normal reconnects should not spam
         * the same welcome message repeatedly.
         */

        if (!current.welcomeSent) {
          current.welcomeSent = true;

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
          clearTimeout(timer);

          reconnectTimers.delete(
            sessionId
          );
        }
      }

      /*
       * CONNECTION CLOSED
       */

      if (connection === "close") {
        const current =
          activeSessions.get(
            sessionId
          );

        if (current) {
          current.connected = false;
        }

        /*
         * User manually disconnected
         * from Settings Panel.
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
         * Determine disconnect reason.
         */

        const statusCode =
          lastDisconnect?.error?.output
            ?.statusCode;

        /*
         * Logged out means WhatsApp
         * explicitly terminated the session.
         */

        const shouldReconnect =
          statusCode !==
          DisconnectReason.loggedOut;

        logger.warn(
          `[${sessionId}] Connection closed. ` +
          `Status=${statusCode || "unknown"} ` +
          `Reconnect=${shouldReconnect}`
        );

        /*
         * Do not automatically reconnect
         * a logged-out account.
         *
         * Session files are NOT deleted here.
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
         * Prevent multiple reconnect timers.
         */

        if (
          reconnectTimers.has(
            sessionId
          )
        ) {
          return;
        }

        /*
         * Reconnect after 5 seconds.
         */

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
                      error?.message
                  },
                  `[${sessionId}] Reconnection failed.`
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
    }
  );

  /*
   |--------------------------------------------------------------------------
   | MESSAGE EVENTS
   |--------------------------------------------------------------------------
   |
   | connection.js does not contain the AI.
   |
   | The main message handler will process
   | normal WhatsApp commands.
   |
   */

  sock.ev.on(
    "messages.upsert",
    async (event) => {
      if (
        !event ||
        event.type !== "notify"
      ) {
        return;
      }

      const current =
        activeSessions.get(
          sessionId
        );

      if (
        !current ||
        !current.sock
      ) {
        return;
      }

      /*
       * Message handling belongs to
       * the dedicated message handler.
       *
       * AI status reaction will also be
       * handled separately.
       */
    }
  );

  /*
   |--------------------------------------------------------------------------
   | RETURN SOCKET
   |--------------------------------------------------------------------------
   */

  return sock;
}

/*
|--------------------------------------------------------------------------
| DISCONNECT SESSION
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This does NOT delete the WhatsApp
| authentication/session files.
|
| The user can reconnect later.
|
|--------------------------------------------------------------------------
*/

async function disconnectSession(
  number
) {
  const sessionId =
    getSessionId(number);

  /*
   * Stop automatic reconnect.
   */

  manuallyStopped.add(
    sessionId
  );

  /*
   * Clear pending reconnect timer.
   */

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

  /*
   * Get current session.
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
   *
   * Do NOT delete credentials.
   */

  try {
    session.sock.end(
      undefined
    );
  } catch (error) {
    logger.warn(
      {
        error:
          error?.message
      },
      `[${sessionId}] Error while closing WhatsApp socket.`
    );
  }

  /*
   * Remove from active memory.
   *
   * Session files remain on disk.
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

  /*
   * Allow reconnect again.
   */

  manuallyStopped.delete(
    sessionId
  );

  /*
   * Close old socket if it exists.
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
| IS CONNECTED
|--------------------------------------------------------------------------
*/

function isConnected(number) {
  const sessionId =
    getSessionId(number);

  return Boolean(
    activeSessions.get(
      sessionId
    )?.connected
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
  changes = {}
) {
  const sessionId =
    getSessionId(number);

  const session =
    activeSessions.get(
      sessionId
    );

  if (!session) {
    return false;
  }

  session.automation = {
    ...session.automation,
    ...changes
  };

  /*
   * Keep the socket's online state
   * synchronized with the setting.
   */

  if (
    Object.prototype.hasOwnProperty.call(
      changes,
      "alwaysOnline"
    )
  ) {
    /*
     * Baileys connection state is handled
     * by the socket lifecycle.
     *
     * The setting is stored here for
     * the automation system.
     */
  }

  logger.info(
    `[${sessionId}] Automation settings updated.`
  );

  return true;
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  connectSession,

  disconnectSession,

  reconnectSession,

  getSession,

  getActiveSessions,

  isConnected,

  getSessionAutomation,

  updateSessionAutomation,

  getDefaultAutomationSettings,

  createWelcomeMessage,

  sendWelcomeMessage,

  SESSIONS_DIR
};