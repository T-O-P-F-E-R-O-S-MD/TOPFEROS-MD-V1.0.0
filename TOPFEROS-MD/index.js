"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pino = require("pino");

const connection = require("./src/connection");
const sessionManager = require("./src/sessionManager");

/*
|--------------------------------------------------------------------------
| WEB PANEL
|--------------------------------------------------------------------------
|
| panel/server.js se web server prensipal V2 a.
| Li deja jere:
|   /
|   /setting
|   /api/*
|
| index.js pa kreye yon dezyèm Express server.
|
|--------------------------------------------------------------------------
*/

require("./panel/server");

const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    "info"
});

/*
|--------------------------------------------------------------------------
| RESTORE STORED SESSIONS
|--------------------------------------------------------------------------
|
| Lè application lan kòmanse:
|
| 1. Li sessions directory a.
| 2. Li chèche sèlman folders ki sanble ak session ID.
| 3. Li verifye creds.json egziste.
| 4. Li reconnect chak session atravè connection.js.
|
| Pa gen nimewo fiks.
| Pa gen session o aza.
| Pa gen credentials deletion.
|
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