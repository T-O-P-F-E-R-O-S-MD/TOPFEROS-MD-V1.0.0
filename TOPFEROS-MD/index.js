// ╔════════════════════════════════════════════════════╗
// ║                 🤖 TOPFEROS MD                    ║
// ║                    V1.0.0                         ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

"use strict";

const fs = require("fs");
const path = require("path");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ LOAD CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("./config");


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 CONSOLE COLORS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bold: "\x1b[1m"
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 LOGGER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function log(message, color = colors.white) {
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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 REQUIRED DIRECTORIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createDirectories() {
  const directories = [
    "auth",
    "database",
    "temp",
    "downloads",
    "uploads",
    "logs",
    "src",
    "commands",
    "features",
    "services",
    "utils",
    "portal"
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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ LOGO CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function checkLogo() {
  const logoPath = path.join(__dirname, config.bot.logo);

  if (fs.existsSync(logoPath)) {
    success(`Bot logo found: ${config.bot.logo}`);
  } else {
    warning(`Bot logo not found: ${config.bot.logo}`);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ CONFIGURATION CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function checkConfiguration() {
  if (!config.bot.name) {
    throw new Error("Bot name is missing.");
  }

  if (!config.bot.version) {
    throw new Error("Bot version is missing.");
  }

  if (!config.bot.prefix) {
    throw new Error("Bot prefix is missing.");
  }

  if (!config.bot.developer) {
    throw new Error("Developer name is missing.");
  }

  success(`Bot: ${config.bot.name}`);
  success(`Version: ${config.bot.version}`);
  success(`Prefix: ${config.bot.prefix}`);
  success(`Mode: ${config.bot.mode}`);
  success(`Developer: ${config.bot.developer}`);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔗 OFFICIAL LINKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showLinks() {
  log("");
  log("🔗 Official Links", colors.cyan);
  log("");

  log(`📢 Channel: ${config.links.channel}`);

  log(`👥 Group: ${config.links.group}`);

  if (config.links.web) {
    log(`🌐 Web: ${config.links.web}`);
  } else {
    log("🌐 Web: Coming after deployment", colors.yellow);
  }

  log("");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👑 OWNER INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showOwner() {
  log("👑 Owner Information", colors.magenta);
  log("");

  log(`👤 Owner Name: ${config.owner.name}`);

  if (config.owner.number) {
    log(`📱 Owner Number: ${config.owner.number}`);
  } else {
    warning("Owner number is not configured.");
  }

  log("");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 WEB PORTAL STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showPortalStatus() {
  if (config.portal.enabled) {
    success(
      `Web Settings Portal enabled on port ${config.portal.port}.`
    );
  } else {
    warning("Web Settings Portal is disabled.");
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗄️ DATABASE DIRECTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function prepareDatabase() {
  const databasePath = path.resolve(
    __dirname,
    config.database.path
  );

  const databaseDirectory = path.dirname(databasePath);

  if (!fs.existsSync(databaseDirectory)) {
    fs.mkdirSync(databaseDirectory, {
      recursive: true
    });
  }

  success("Database directory ready.");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 LOAD WHATSAPP CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startWhatsApp() {
  const connectionFile = path.join(
    __dirname,
    "src",
    "connection.js"
  );

  if (!fs.existsSync(connectionFile)) {
    warning(
      "src/connection.js is not created yet."
    );

    warning(
      "WhatsApp connection will be enabled after connection.js is added."
    );

    return;
  }

  try {
    const connection = require("./src/connection");

    if (typeof connection.start === "function") {
      await connection.start();
      success("WhatsApp connection started.");
    } else if (typeof connection === "function") {
      await connection();
      success("WhatsApp connection started.");
    } else {
      warning(
        "connection.js loaded, but no start() function was found."
      );
    }
  } catch (err) {
    error(
      `WhatsApp connection error: ${err.message}`
    );
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 LOAD WEB PORTAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startPortal() {
  if (!config.portal.enabled) {
    return;
  }

  const portalFile = path.join(
    __dirname,
    "portal",
    "server.js"
  );

  if (!fs.existsSync(portalFile)) {
    warning(
      "portal/server.js is not created yet."
    );

    warning(
      "Web Settings Portal will be enabled after the portal files are created."
    );

    return;
  }

  try {
    const portal = require("./portal/server");

    if (typeof portal.start === "function") {
      await portal.start();
      success("Web Settings Portal started.");
    } else {
      warning(
        "portal/server.js loaded, but no start() function was found."
      );
    }
  } catch (err) {
    error(
      `Web Portal error: ${err.message}`
    );
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 STARTUP BANNER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showBanner() {
  console.clear();

  log("");
  log("╔══════════════════════════════════════════════╗", colors.cyan);
  log("║                                              ║", colors.cyan);
  log("║             🤖 TOPFEROS MD                   ║", colors.cyan);
  log("║                 V1.0.0                       ║", colors.cyan);
  log("║                                              ║", colors.cyan);
  log("║             🚀 TOPFEROS TECH                 ║", colors.cyan);
  log("║                                              ║", colors.cyan);
  log("╚══════════════════════════════════════════════╝", colors.cyan);
  log("");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 MAIN START FUNCTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startBot() {
  try {
    showBanner();

    log("🚀 Starting TOPFEROS MD...", colors.bold);
    log("");

    createDirectories();

    checkConfiguration();

    checkLogo();

    prepareDatabase();

    showOwner();

    showLinks();

    showPortalStatus();

    log("");
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", colors.cyan);
    log("📦 System Initialization", colors.cyan);
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", colors.cyan);
    log("");

    await startWhatsApp();

    await startPortal();

    log("");
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", colors.green);
    success("TOPFEROS MD initialization completed.");
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", colors.green);
    log("");

  } catch (err) {
    error(`Startup failed: ${err.message}`);

    if (process.env.NODE_ENV !== "production") {
      console.error(err);
    }

    process.exit(1);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛑 PROCESS ERROR HANDLING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

process.on("uncaughtException", (err) => {
  error(`Uncaught Exception: ${err.message}`);
});

process.on("unhandledRejection", (reason) => {
  error(
    `Unhandled Promise Rejection: ${
      reason?.message || reason
    }`
  );
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛑 GRACEFUL SHUTDOWN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function shutdown(signal) {
  log("");
  warning(`${signal} received.`);
  log("🛑 Shutting down TOPFEROS MD...");

  // Connection shutdown ap ajoute pita
  // lè src/connection.js fin fèt.

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ RUN BOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

startBot();