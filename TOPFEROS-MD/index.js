"use strict";

const fs = require("fs");
const path = require("path");
const config = require("./config");

let connection = null;
let panelServer = null;
let shuttingDown = false;

// ============================================================
// COLORS / LOGGING
// ============================================================

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m"
};

function log(message, color = "") {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

// ============================================================
// DIRECTORIES
// ============================================================

function createDirectories() {
  const directories = [
    "auth",
    "auth/sessions",
    "database",
    "temp",
    "downloads",
    "uploads",
    "logs",
    "commands",
    "features",
    "services",
    "utils",
    "panel",
    "panel/public"
  ];

  for (const directory of directories) {
    const directoryPath = path.join(__dirname, directory);

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, {
        recursive: true
      });
    }
  }

  success("Project directories checked.");
}

// ============================================================
// CONFIGURATION
// ============================================================

function checkConfiguration() {
  if (!config.bot) {
    throw new Error("Bot configuration is missing.");
  }

  if (!config.bot.name) {
    throw new Error("Bot name is missing.");
  }

  if (!config.bot.version) {
    throw new Error("Bot version is missing.");
  }

  if (!config.bot.prefix) {
    throw new Error("Bot prefix is missing.");
  }

  success(`Bot: ${config.bot.name}`);
  success(`Version: ${config.bot.version}`);
  success(`Prefix: ${config.bot.prefix}`);
  success(`Mode: ${config.bot.mode || "default"}`);

  if (config.bot.developer) {
    success(`Developer: ${config.bot.developer}`);
  }
}

// ============================================================
// LOGO
// ============================================================

function checkLogo() {
  if (!config.bot?.logo) {
    return;
  }

  const logoPath = path.join(
    __dirname,
    config.bot.logo
  );

  if (fs.existsSync(logoPath)) {
    success(`Bot logo found: ${config.bot.logo}`);
  } else {
    warning(`Bot logo not found: ${config.bot.logo}`);
  }
}

// ============================================================
// DATABASE
// ============================================================

function prepareDatabase() {
  const databasePath = path.resolve(
    __dirname,
    config.database?.path || "database/topferos.db"
  );

  const databaseDirectory = path.dirname(databasePath);

  if (!fs.existsSync(databaseDirectory)) {
    fs.mkdirSync(databaseDirectory, {
      recursive: true
    });
  }

  success("Database directory ready.");
}

// ============================================================
// LINKS
// ============================================================

function showLinks() {
  if (!config.links) {
    return;
  }

  if (config.links.channel) {
    log(`📢 Channel: ${config.links.channel}`, colors.cyan);
  }

  if (config.links.group) {
    log(`👥 Group: ${config.links.group}`, colors.cyan);
  }

  if (config.links.web) {
    log(`🌐 Web: ${config.links.web}`, colors.cyan);
  }
}

// ============================================================
// OWNER
// ============================================================

function showOwner() {
  if (!config.owner) {
    return;
  }

  if (config.owner.name) {
    log(`👤 Owner: ${config.owner.name}`, colors.magenta);
  }

  if (config.owner.number) {
    log(`📱 Owner Number: ${config.owner.number}`, colors.magenta);
  }
}

// ============================================================
// WHATSAPP
// ============================================================

async function startWhatsApp() {
  const connectionFile = path.join(
    __dirname,
    "src",
    "connection.js"
  );

  if (!fs.existsSync(connectionFile)) {
    throw new Error(
      "src/connection.js was not found."
    );
  }

  try {
    connection = require("./src/connection");

    if (!connection) {
      throw new Error(
        "connection.js returned an empty module."
      );
    }

    if (typeof connection.start !== "function") {
      throw new Error(
        "connection.js does not expose start()."
      );
    }

    await connection.start();

    success(
      "WhatsApp connection service started."
    );

  } catch (err) {
    error(
      `WhatsApp connection error: ${
        err?.message || err
      }`
    );

    console.error(err?.stack || err);

    throw err;
  }
}

// ============================================================
// PANEL
// ============================================================

async function startPanel() {
  const panelFile = path.join(
    __dirname,
    "panel",
    "server.js"
  );

  if (!fs.existsSync(panelFile)) {
    throw new Error(
      "panel/server.js was not found."
    );
  }

  try {
    const panel = require("./panel/server");

    if (!panel) {
      throw new Error(
        "panel/server.js returned an empty module."
      );
    }

    panelServer = panel;

    success(
      "TOPFEROS MD Web Panel loaded."
    );

  } catch (err) {
    error(
      `Web Panel error: ${
        err?.message || err
      }`
    );

    throw err;
  }
}

// ============================================================
// BANNER
// ============================================================

function showBanner() {
  console.log("");
  log(
    "╔══════════════════════════════════════════════╗",
    colors.cyan
  );
  log(
    "║                                              ║",
    colors.cyan
  );
  log(
    "║              🤖 TOPFEROS MD                 ║",
    colors.cyan
  );
  log(
    "║                 V1.0.0                      ║",
    colors.cyan
  );
  log(
    "║                                              ║",
    colors.cyan
  );
  log(
    "║              🚀 TOPFEROS TECH               ║",
    colors.cyan
  );
  log(
    "║                                              ║",
    colors.cyan
  );
  log(
    "╚══════════════════════════════════════════════╝",
    colors.cyan
  );
  console.log("");
}

// ============================================================
// SYSTEM INFORMATION
// ============================================================

function showSystemInformation() {
  log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    colors.cyan
  );

  log("📦 System Initialization", colors.cyan);
  log(`🟢 Node.js: ${process.version}`);
  log(`🟢 Platform: ${process.platform}`);
  log(`🟢 PID: ${process.pid}`);

  log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    colors.cyan
  );
}

// ============================================================
// START BOT
// ============================================================

async function startBot() {
  try {
    showBanner();

    log(
      "🚀 Starting TOPFEROS MD...",
      colors.bold
    );

    createDirectories();
    checkConfiguration();
    checkLogo();
    prepareDatabase();
    showOwner();
    showLinks();
    showSystemInformation();

    await startWhatsApp();

    await startPanel();

    console.log("");

    log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      colors.green
    );

    success(
      "TOPFEROS MD initialization completed."
    );

    log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      colors.green
    );

    console.log("");

    log(
      "🌐 Panel is ready for Multi-Session connections.",
      colors.cyan
    );

    log(
      "📱 Users can connect their WhatsApp numbers through the Panel.",
      colors.cyan
    );

  } catch (err) {
    error(
      `Startup failed: ${
        err?.message || err
      }`
    );

    console.error(
      err?.stack || err
    );

    process.exit(1);
  }
}

// ============================================================
// ERROR HANDLING
// ============================================================

process.on(
  "uncaughtException",
  (err) => {
    error(
      `Uncaught Exception: ${
        err?.message || err
      }`
    );

    console.error(
      err?.stack || err
    );
  }
);

process.on(
  "unhandledRejection",
  (reason) => {
    error(
      `Unhandled Promise Rejection: ${
        reason?.message || reason
      }`
    );

    console.error(reason);
  }
);

// ============================================================
// SHUTDOWN
// ============================================================

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  warning(
    `${signal} received.`
  );

  try {
    if (
      connection &&
      typeof connection.stop === "function"
    ) {
      await connection.stop();
      success(
        "WhatsApp Multi-Sessions stopped."
      );
    }
  } catch (err) {
    error(
      `WhatsApp shutdown error: ${
        err?.message || err
      }`
    );
  }

  try {
    if (
      panelServer &&
      panelServer.server &&
      typeof panelServer.server.close === "function"
    ) {
      await new Promise((resolve) => {
        panelServer.server.close(() => {
          resolve();
        });
      });

      success(
        "Web Panel server stopped."
      );
    }
  } catch (err) {
    error(
      `Panel shutdown error: ${
        err?.message || err
      }`
    );
  }

  process.exit(0);
}

// ============================================================
// SIGNALS
// ============================================================

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

// ============================================================
// RUN
// ============================================================

startBot();