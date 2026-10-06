"use strict";

require("dotenv").config();

const express = require("express");
const pino = require("pino");

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const logger = pino({
  level: process.env.LOG_LEVEL || "info"
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        <p>🟢 Status: ONLINE &amp; READY</p>
        <p>🦁 TECH BY TOPFEROS MD 🐑</p>
      </body>
    </html>
  `);
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    bot: "TOPFEROS MD V2.0.0",
    version: "2.0.0",
    uptime: process.uptime()
  });
});

const server = app.listen(PORT, () => {
  logger.info(
    `🦁 TOPFEROS MD V2.0.0 server running on port ${PORT}`
  );
});

process.on("SIGINT", () => {
  logger.info("🛑 SIGINT received. Closing server...");

  server.close(() => {
    logger.info("🟢 Server closed.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  logger.info("🛑 SIGTERM received. Closing server...");

  server.close(() => {
    logger.info("🟢 Server closed.");
    process.exit(0);
  });
});

process.on("uncaughtException", (error) => {
  logger.error(
    error,
    "❌ UNCAUGHT EXCEPTION"
  );
});

process.on("unhandledRejection", (reason) => {
  logger.error(
    reason,
    "❌ UNHANDLED REJECTION"
  );
});