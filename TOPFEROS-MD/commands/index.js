"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pino = require("pino");

const connection = require("./src/connection");
const sessionManager = require("./src/sessionManager");

const logger = pino({
  level: process.env.LOG_LEVEL || "info"
});

/*
|--------------------------------------------------------------------------
| COMMAND LOADER
|--------------------------------------------------------------------------
|
| Tout fichye .js ki nan commands/ chaje otomatikman.
|
| Sa vle di:
|
| commands/menu.js
| commands/pair.js
| commands/parrain.js
| commands/nouvo.js
|
| Lè ou ajoute nouvo.js, ou pa bezwen modifye index.js.
|--------------------------------------------------------------------------
*/

const COMMANDS_DIR = path.resolve(
  __dirname,
  "commands"
);

function loadCommands() {
  if (!fs.existsSync(COMMANDS_DIR)) {
    logger.warn(
      "⚠️ commands/ directory not found."
    );

    return;
  }

  const files = fs
    .readdirSync(COMMANDS_DIR)
    .filter(
      (file) =>
        file.endsWith(".js") &&
        !file.startsWith("_")
    )
    .sort();

  let loaded = 0;

  for (const file of files) {
    const filePath = path.join(
      COMMANDS_DIR,
      file
    );

    try {
      delete require.cache[
        require.resolve(filePath)
      ];

      const commandModule =
        require(filePath);

      if (
        commandModule &&
        typeof commandModule.init === "function"
      ) {
        commandModule.init({
          connection,
          sessionManager,
          logger
        });
      }

      loaded += 1;

      logger.info(
        `✅ Command module loaded: ${file}`
      );
    } catch (error) {
      logger.error(
        {
          error:
            error?.stack ||
            error?.message ||
            String(error)
        },
        `❌ Failed to load command module: ${file}`
      );
    }
  }

  logger.info(
    `📖 ${loaded} command module(s) loaded automatically.`
  );
}

/*
|--------------------------------------------------------------------------
| WEB PANEL
|--------------------------------------------------------------------------
*/

require("./panel/server");

/*
|--------------------------------------------------------------------------
| RESTORE STORED SESSIONS
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

  if (sessionIds.length === 0) {
    logger.info(
      "ℹ️ No stored WhatsApp sessions to restore."
    );

    return;
  }

  logger.info(
    `🔄 Restoring ${sessionIds.length} stored WhatsApp session(s)...`
  );

  for (const sessionId of sessionIds) {
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
*/

let shuttingDown = false;

async function shutdown(signal) {
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

    loadCommands();

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