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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ LOGO CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function checkLogo() {
  if (!config.bot || !config.bot.logo) {
    warning("Bot logo path is not configured.");
    return;
  }

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

  if (!config.bot.developer) {
    throw new Error("Developer name is missing.");
  }

  success(`Bot: ${config.bot.name}`);
  success(`Version: ${config.bot.version}`);
  success(`Prefix: ${config.bot.prefix}`);
  success(`Mode: ${config.bot.mode || "default"}`);
  success(`Developer: ${config.bot.developer}`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔗 OFFICIAL LINKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showLinks() {
  if (!config.links) {
    return;
  }

  log("");
  log("🔗 Official Links", colors.cyan);
  log("");

  if (config.links.channel) {
    log(`📢 Channel: ${config.links.channel}`);
  }

  if (config.links.group) {
    log(`👥 Group: ${config.links.group}`);
  }

  if (config.links.web) {
    log(`🌐 Web: ${config.links.web}`);
  } else {
    log("🌐 Web: Configured through Panel", colors.yellow);
  }

  log("");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👑 OWNER INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showOwner() {
  if (!config.owner) {
    return;
  }

  log("👑 Owner Information", colors.magenta);
  log("");

  if (config.owner.name) {
    log(`👤 Owner Name: ${config.owner.name}`);
  }

  if (config.owner.number) {
    log(`📱 Owner Number: ${config.owner.number}`);
  } else {
    warning("Owner number is not configured.");
  }

  log("");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 PANEL STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showPanelStatus() {
  if (config.portal && config.portal.enabled === false) {
    warning("Web Settings Panel is disabled.");
    return;
  }

  const port =
    config.portal?.port ||
    process.env.PORT ||
    3000;

  success(`Web Settings Panel enabled on port ${port}.`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗄️ DATABASE DIRECTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 LOAD WHATSAPP CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let connection = null;

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
        "src/connection.js returned an empty module."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Restore saved Multi-Sessions first
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      typeof connection.restoreStoredSessions ===
      "function"
    ) {
      try {
        const restored =
          await connection.restoreStoredSessions();

        if (Array.isArray(restored)) {
          success(
            `Multi-Session records restored: ${restored.length}`
          );
        } else {
          success(
            "Multi-Session records restored."
          );
        }
      } catch (restoreError) {
        warning(
          `Session restore warning: ${restoreError.message}`
        );
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Start default/configured WhatsApp session
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (typeof connection.start === "function") {
      const result = await connection.start();

      if (result) {
        success("WhatsApp connection started.");
      } else {
        log(
          "ℹ️ No default WhatsApp session configured. Panel is ready for new sessions.",
          colors.cyan
        );
      }

      return;
    }

    if (typeof connection === "function") {
      await connection();
      success("WhatsApp connection started.");
      return;
    }

    throw new Error(
      "connection.js does not expose a start() function."
    );

  } catch (err) {
    error(
      `WhatsApp connection error: ${err.message}`
    );

    throw err;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 LOAD WEB PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let panelServer = null;

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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // panel/server.js already starts its Express server
    // when required. We do NOT start another server.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (panel.server) {
      success("TOPFEROS MD Web Panel loaded.");
    } else if (panel.app) {
      success("TOPFEROS MD Web Panel loaded.");
    } else {
      success("TOPFEROS MD Web Panel loaded.");
    }

  } catch (err) {
    error(
      `Web Panel error: ${err.message}`
    );

    throw err;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 STARTUP BANNER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showBanner() {
  console.clear();

  log("");
  log(
    "╔══════════════════════════════════════════════╗",
    colors.cyan
  );
  log(
    "║                                              ║",
    colors.cyan
  );
  log(
    "║             🤖 TOPFEROS MD                   ║",
    colors.cyan
  );
  log(
    "║                 V1.0.0                       ║",
    colors.cyan
  );
  log(
    "║                                              ║",
    colors.cyan
  );
  log(
    "║             🚀 TOPFEROS TECH                 ║",
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
  log("");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 SYSTEM INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showSystemInformation() {
  log("");
  log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    colors.cyan
  );
  log(
    "📦 System Initialization",
    colors.cyan
  );
  log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    colors.cyan
  );
  log("");

  log(`🟢 Node.js: ${process.version}`);
  log(`🟢 Platform: ${process.platform}`);
  log(`🟢 PID: ${process.pid}`);

  log("");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 MAIN START FUNCTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startBot() {
  try {
    showBanner();

    log(
      "🚀 Starting TOPFEROS MD...",
      colors.bold
    );
    log("");

    createDirectories();

    checkConfiguration();

    checkLogo();

    prepareDatabase();

    showOwner();

    showLinks();

    showPanelStatus();

    showSystemInformation();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // WhatsApp
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await startWhatsApp();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Web Panel
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await startPanel();

    log("");
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

    log("");
    log(
      "🌐 Panel is ready for Multi-Session connections.",
      colors.cyan
    );
    log(
      "📱 Users can connect their WhatsApp numbers through the Panel.",
      colors.cyan
    );
    log("");

  } catch (err) {
    error(
      `Startup failed: ${err.message}`
    );

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
  error(
    `Uncaught Exception: ${err.message}`
  );

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }
});

process.on("unhandledRejection", (reason) => {
  error(
    `Unhandled Promise Rejection: ${
      reason?.message || reason
    }`
  );

  if (process.env.NODE_ENV !== "production") {
    console.error(reason);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛑 GRACEFUL SHUTDOWN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  log("");
  warning(`${signal} received.`);
  log("🛑 Shutting down TOPFEROS MD...");

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Stop WhatsApp Multi-Sessions
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
      `WhatsApp shutdown error: ${err.message}`
    );
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Close Express Panel server if available
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

      success("Web Panel server stopped.");
    }
  } catch (err) {
    error(
      `Panel shutdown error: ${err.message}`
    );
  }

  log("");
  success(
    "TOPFEROS MD shutdown completed."
  );

  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ RUN BOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

startBot();