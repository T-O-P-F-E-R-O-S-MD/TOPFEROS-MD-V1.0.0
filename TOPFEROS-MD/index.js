"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const pino = require("pino");

const connection = require("./src/connection");
const sessionManager = require("./src/sessionManager");

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const logger = pino({
level: process.env.LOG_LEVEL || "info"
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
res.status(200).send(`

<!DOCTYPE html><html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TOPFEROS MD V2.0.0</title>
</head>
<body>
  <h1>🦁 TOPFEROS MD V2.0.0 🐑</h1>
  <p>🟢 Status: ONLINE &amp; READY</p>
  <p>🦁 TECH BY TOPFEROS MD 🐑</p>
</body>
</html>
  `);
});app.get("/health", (req, res) => {
res.status(200).json({
status: "ok",
bot: "TOPFEROS MD V2.0.0",
version: "2.0.0",
activeSessions: sessionManager.getActiveSessionCount(),
uptime: process.uptime()
});
});

const server = app.listen(PORT, () => {
logger.info(
"🦁 TOPFEROS MD V2.0.0 server running on port ${PORT}"
);

restoreSessions().catch((error) => {
logger.error(
{
error: error?.stack || String(error)
},
"❌ Failed to restore WhatsApp sessions."
);
});
});

async function restoreSessions() {
const sessionsDir =
sessionManager.ensureSessionsDirectory();

const entries = await fs.promises.readdir(
sessionsDir,
{
withFileTypes: true
}
);

const sessionIds = entries
.filter((entry) => entry.isDirectory())
.map((entry) => entry.name)
.filter((name) => /^\d{8,15}$/.test(name));

if (sessionIds.length === 0) {
logger.info(
"ℹ️ No stored WhatsApp sessions to restore."
);
return;
}

logger.info(
"🔄 Restoring ${sessionIds.length} stored WhatsApp session(s)..."
);

for (const sessionId of sessionIds) {
const sessionPath = path.join(
sessionsDir,
sessionId
);

const credsPath = path.join(
  sessionPath,
  "creds.json"
);

if (!fs.existsSync(credsPath)) {
  logger.warn(
    `[${sessionId}] Skipping session without creds.json.`
  );
  continue;
}

try {
  await connection.connectSession(sessionId);

  logger.info(
    `[${sessionId}] 🟢 Stored WhatsApp session restored.`
  );
} catch (error) {
  logger.error(
    {
      error: error?.stack || String(error)
    },
    `[${sessionId}] ❌ Failed to restore WhatsApp session.`
  );
}

}
}

let shuttingDown = false;

async function shutdown(signal) {
if (shuttingDown) {
return;
}

shuttingDown = true;

logger.info(
"🛑 ${signal} received. Closing TOPFEROS MD V2.0.0..."
);

try {
await connection.disconnectAllSessions();
} catch (error) {
logger.error(
{
error: error?.stack || String(error)
},
"❌ Failed to close WhatsApp sessions cleanly."
);
}

server.close(() => {
logger.info("🟢 Server closed.");
process.exit(0);
});
}

process.on("SIGINT", () => {
shutdown("SIGINT").catch((error) => {
logger.error(error, "❌ Shutdown failed.");
process.exit(1);
});
});

process.on("SIGTERM", () => {
shutdown("SIGTERM").catch((error) => {
logger.error(error, "❌ Shutdown failed.");
process.exit(1);
});
});

process.on("uncaughtException", (error) => {
logger.error(error, "❌ UNCAUGHT EXCEPTION");
});

process.on("unhandledRejection", (reason) => {
logger.error(reason, "❌ UNHANDLED REJECTION");
});