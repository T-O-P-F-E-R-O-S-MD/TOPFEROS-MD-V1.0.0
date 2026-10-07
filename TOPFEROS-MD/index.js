"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pino = require("pino");

const connection = require("./src/connection");
const sessionManager = require("./src/sessionManager");

const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    "info"
});

/*
|--------------------------------------------------------------------------
| WEB PANEL
|--------------------------------------------------------------------------
|
| panel/server.js se sèl web server V2 la.
|
| Li jere:
|   /
|   /setting
|   /api/*
|
| index.js pa kreye yon dezyèm Express server.
|--------------------------------------------------------------------------
*/

require("./panel/server");

/*
|--------------------------------------------------------------------------
| RESTORE STORED SESSIONS
|--------------------------------------------------------------------------
|
| Lè aplikasyon an demare:
|
| 1. Kreye/verifye sessions directory.
| 2. Chèche sèlman session folders ki gen nimewo.
| 3. Verifye creds.json egziste.
| 4. Reconnect chak session avèk connection.js.
|
| Credentials yo pa efase.
|--------------------------------------------------------------------------
*/

async function restoreSessions() {
  const sessionsDir =
    sessionManager.ensureSessionsDirectory();

  const entries =
    await fs.promises.readdir(
      sessionsDir,
      {
        withFileTypes: true
      }
    );

  const sessionIds =
    entries
      .filter(
        (entry) =>
          entry.isDirectory()
      )
      .map(
        (entry) =>
          entry.name
      )
      .filter(
        (name) =>
          /^\d{8,15}$/.test(name)
      );

  if (
    sessionIds.length === 0
  ) {
    logger.info(
      "ℹ️ No stored WhatsApp sessions to restore."
    );

    return;
  }

  logger.info(
    `🔄 Restoring ${sessionIds.length} stored WhatsApp session(s)...`
  );

  for (
    const sessionId of
      sessionIds
  ) {
    const sessionPath =
      path.join(
        sessionsDir,
        sessionId
      );

    const credentialsPath =
      path.join(
        sessionPath,
        "creds.json"
      );

    if (
      !fs.existsSync(
        credentialsPath
      )
    ) {
      logger.warn(
        `[${sessionId}] ⚠️ Session skipped: creds.json not found.`
      );

      continue;
    }

    try {
      await connection.connectSession(
        sessionId
      );

      logger.info(
        `[${sessionId}] 🟢 Stored WhatsApp session restored.`
      );
    } catch (error) {
      logger.error(
        {
          error:
            error?.stack ||
            error?.message ||
            String(error)
        },
        `[${sessionId}] ❌ Failed to restore WhatsApp session.`
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| GRACEFUL SHUTDOWN
|--------------------------------------------------------------------------
|
| Lè Render voye SIGTERM/SIGINT:
| - Fèmen sessions yo pwòp
| - Pa efase credentials
|--------------------------------------------------------------------------
*/

let shuttingDown = false;

async function shutdown(
  signal
) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  logger.info(
    `🛑 ${signal} received. Shutting down TOPFEROS MD V2.0.0...`
  );

  try {
    await connection.disconnectAllSessions();

    logger.info(
      "🦁 TOPFEROS MD V2.0.0 shutdown completed."
    );
  } catch (error) {
    logger.error(
      {
        error:
          error?.stack ||
          error?.message ||
          String(error)
      },
      "❌ Shutdown error."
    );
  } finally {
    process.exit(0);
  }
}

process.once(
  "SIGTERM",
  () => {
    shutdown("SIGTERM");
  }
);

process.once(
  "SIGINT",
  () => {
    shutdown("SIGINT");
  }
);

/*
|--------------------------------------------------------------------------
| APPLICATION STARTUP
|--------------------------------------------------------------------------
*/

async function startApplication() {
  try {
    logger.info(
      "🚀 Starting TOPFEROS MD V2.0.0..."
    );

    await restoreSessions();

    logger.info(
      "🦁 TOPFEROS MD V2.0.0 startup completed."
    );
  } catch (error) {
    logger.error(
      {
        error:
          error?.stack ||
          error?.message ||
          String(error)
      },
      "❌ TOPFEROS MD V2.0.0 startup failed."
    );

    process.exitCode = 1;
  }
}

startApplication();