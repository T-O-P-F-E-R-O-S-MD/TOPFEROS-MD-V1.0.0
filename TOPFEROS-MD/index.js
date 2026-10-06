4"use strict";

require("dotenv").config();

const express = require("express");
const pino = require("pino");

const config = require("./src/config");
const {
  connectSession,
  disconnectAllSessions
} = require("./src/connection");

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const logger = pino({
  level: process.env.LOG_LEVEL || "info"
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| WEB SERVER
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >
        <title>TOPFEROS MD V2.0.0</title>
      </head>

      <body>
        <h1>🦁 TOPFEROS MD V2.0.0 🐑</h1>
        <p>Bot is running.</p>
        <p>🟢 Status: ONLINE & READY</p>
        <p>🦁 TECH BY TOPFEROS MD 🐑</p>
      </body>
    </html>
  `);
});

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    bot: "TOPFEROS MD V2.0.0",
    version: "2.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/*
|--------------------------------------------------------------------------
| START WEB SERVER
|--------------------------------------------------------------------------
*/

const server = app.listen(PORT, () => {
  logger.info(
    `🦁 TOPFEROS MD V2.0.0 web server running on port ${PORT}`
  );
});

/*
|--------------------------------------------------------------------------
| START WHATSAPP SESSION
|--------------------------------------------------------------------------
|
| Si OWNER_NUMBER pa defini, server la toujou rete aktif.
| Sa pèmèt Render health check pase san li pa kraze.
|
*/

async function startBot() {
  try {
    const ownerNumber = String(
      config?.bot?.ownerNumber ||
      process.env.OWNER_NUMBER ||
      ""
    ).replace(/\D/g, "");

    if (!ownerNumber) {
      logger.warn(
        "⚠️ OWNER_NUMBER is not configured. WhatsApp session was not started."
      );
      return;
    }

    logger.info(
      `📱 Starting TOPFEROS MD WhatsApp session for ${ownerNumber}`
    );

    await connectSession(ownerNumber);

    logger.info("🟢 TOPFEROS MD V2.0.0 WhatsApp session started.");
  } catch (error) {
    logger.error(
      {
        error: error?.message || error
      },
      "❌ Failed to start WhatsApp session."
    );
  }
}

/*
|--------------------------------------------------------------------------
| GRACEFUL SHUTDOWN
|--------------------------------------------------------------------------
*/

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;

  shuttingDown = true;

  logger.info(`🛑 ${signal} received. Shutting down...`);

  try {
    await disconnectAllSessions();
  } catch (error) {
    logger.error(
      {
        error: error?.message || error
      },
      "❌ Error while disconnecting WhatsApp sessions."
    );
  }

  server.close(() => {
    logger.info("🟢 Web server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(0);
  }, 5000).unref();
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

/*
|--------------------------------------------------------------------------
| ERROR HANDLERS
|--------------------------------------------------------------------------
*/

process.on("uncaughtException", (error) => {
  logger.error(
    {
      error: error?.stack || error
    },
    "❌ UNCAUGHT EXCEPTION"
  );
});

process.on("unhandledRejection", (reason) => {
  logger.error(
    {
      error: reason?.stack || reason
    },
    "❌ UNHANDLED REJECTION"
  );
});

/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

startBot();