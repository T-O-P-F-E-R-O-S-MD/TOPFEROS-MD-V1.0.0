"use strict";

const fs = require("fs");
const path = require("path");
const config = require("../config");

// ============================================================
// TOPFEROS MD V1.0.0
// DYNAMIC MENU COMMAND
// ============================================================

const LOGO_PATH = path.join(
  __dirname,
  "..",
  "assets",
  "logo.png"
);

// ============================================================
// GET CONNECTED USER
// ============================================================

function getConnectedUser(sock) {
  const user = sock?.user;

  if (!user) {
    return {
      name: "Unknown",
      number: "Unknown"
    };
  }

  const name =
    user.name ||
    user.verifiedName ||
    "Unknown";

  const id =
    user.id ||
    "";

  const number =
    id
      .split(":")[0]
      .split("@")[0]
      .replace(/\D/g, "") ||
    "Unknown";

  return {
    name,
    number
  };
}

// ============================================================
// CATEGORY MAP
// ============================================================

const CATEGORY_MAP = {

  "GENERAL": [
    "alive",
    "ping",
    "menu",
    "help",
    "info",
    "owner",
    "runtime",
    "uptime",
    "status",
    "setting"
  ],

  "GROUP": [
    "add",
    "admin",
    "close",
    "demote",
    "groupinfo",
    "kick",
    "open",
    "promote",
    "setdesc",
    "setgoodbye",
    "setname",
    "setpp",
    "setwelcome",
    "tagall"
  ],

  "DOWNLOAD": [
    "download",
    "ytmp3",
    "ytmp4",
    "tiktok",
    "instagram",
    "facebook",
    "pinterest",
    "twitter",
    "snapchat",
    "reddit"
  ],

  "MEDIA": [
    "play",
    "sticker",
    "toimg",
    "vv2"
  ],

  "AI": [
    "ai",
    "ask",
    "chat",
    "imagine"
  ],

  "ACCOUNT": [
    "pair"
  ]
};

// ============================================================
// COMMAND EXCLUSIONS
// ============================================================

const EXCLUDED_COMMANDS = new Set([
  "menu"
]);

// ============================================================
// FORMAT COMMAND
// ============================================================

function formatCommand(command, prefix) {
  if (!command) {
    return "";
  }

  const name =
    String(command.name || "")
      .trim()
      .toLowerCase();

  if (!name) {
    return "";
  }

  let usage =
    String(command.usage || "")
      .trim();

  if (!usage) {
    usage =
      `${prefix}${name}`;
  } else if (!usage.startsWith(prefix)) {
    usage =
      `${prefix}${usage}`;
  }

  return `│ ${usage}`;
}

// ============================================================
// GET ALL LOADED COMMANDS
// ============================================================

function getLoadedCommands() {
  try {

    /*
     * Nou pa require index.js anlè fichye a,
     * paske index.js ap load menu.js tou.
     *
     * Nou fè require la sèlman lè .menu egzekite,
     * lè command manager la deja fin load.
     */

    const commandManager =
      require("./index");

    if (
      typeof commandManager.getAllCommands !==
      "function"
    ) {
      return [];
    }

    return commandManager
      .getAllCommands()
      .filter(Boolean);

  } catch (error) {

    console.error(
      "❌ MENU COMMAND MANAGER ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    return [];
  }
}

// ============================================================
// BUILD CATEGORY
// ============================================================

function buildCategory(
  title,
  commands,
  prefix
) {
  if (!commands.length) {
    return "";
  }

  let output =
    `\n${title}\n`;

  for (const command of commands) {

    const line =
      formatCommand(
        command,
        prefix
      );

    if (line) {
      output += `${line}\n`;
    }
  }

  return output;
}

// ============================================================
// BUILD DYNAMIC COMMAND MENU
// ============================================================

function buildCommandsMenu(
  commands,
  prefix
) {

  const commandMap =
    new Map();

  for (const command of commands) {

    const name =
      String(command?.name || "")
        .trim()
        .toLowerCase();

    if (!name) {
      continue;
    }

    if (
      EXCLUDED_COMMANDS.has(name)
    ) {
      continue;
    }

    commandMap.set(
      name,
      command
    );
  }

  let menu = "";

  // ----------------------------------------------------------
  // KNOWN CATEGORIES
  // ----------------------------------------------------------

  for (
    const [
      category,
      names
    ] of Object.entries(CATEGORY_MAP)
  ) {

    const categoryCommands = [];

    for (const name of names) {

      const command =
        commandMap.get(name);

      if (command) {
        categoryCommands.push(
          command
        );

        commandMap.delete(name);
      }
    }

    if (categoryCommands.length) {

      menu += buildCategory(
        `\n${getCategoryEmoji(category)} ${category}`,
        categoryCommands,
        prefix
      );
    }
  }

  // ----------------------------------------------------------
  // AUTOMATIC / OTHER COMMANDS
  // ----------------------------------------------------------

  if (commandMap.size) {

    const others =
      Array.from(
        commandMap.values()
      ).sort(
        (a, b) =>
          String(a.name)
            .localeCompare(
              String(b.name)
            )
      );

    menu += buildCategory(
      "\n🧩 OTHER",
      others,
      prefix
    );
  }

  return menu;
}

// ============================================================
// CATEGORY EMOJI
// ============================================================

function getCategoryEmoji(category) {

  const emojis = {
    GENERAL: "👑",
    GROUP: "👥",
    DOWNLOAD: "📥",
    MEDIA: "🎬",
    AI: "🤖",
    ACCOUNT: "🔐"
  };

  return (
    emojis[category] ||
    "📂"
  );
}

// ============================================================
// BUILD ALIAS SECTION
// ============================================================

function buildAliasSection(
  commands,
  prefix
) {

  const lines = [];

  for (const command of commands) {

    const name =
      String(command?.name || "")
        .trim()
        .toLowerCase();

    if (!name) {
      continue;
    }

    if (
      EXCLUDED_COMMANDS.has(name)
    ) {
      continue;
    }

    const aliases =
      Array.isArray(command.aliases)
        ? command.aliases
        : [];

    if (!aliases.length) {
      continue;
    }

    const cleanAliases =
      aliases
        .map(alias =>
          String(alias || "")
            .trim()
            .toLowerCase()
        )
        .filter(Boolean);

    if (!cleanAliases.length) {
      continue;
    }

    lines.push(
      `│ ${prefix}${name} → ${cleanAliases
        .map(alias => `${prefix}${alias}`)
        .join(", ")}`
    );
  }

  if (!lines.length) {
    return "";
  }

  return `
🔗 ALIASES
${lines.join("\n")}
`;
}

// ============================================================
// COMMAND
// ============================================================

async function execute(context) {

  const {
    sock,
    message
  } = context || {};

  const chatId =
    message?.key?.remoteJid;

  if (!sock || !chatId) {
    return;
  }

  try {

    // --------------------------------------------------------
    // BOT INFORMATION
    // --------------------------------------------------------

    const botName =
      config?.bot?.name ||
      "TOPFEROS MD";

    const version =
      config?.bot?.version ||
      "V1.0.0";

    const prefix =
      config?.bot?.prefix ||
      ".";

    const mode =
      String(
        config?.bot?.mode ||
        "public"
      ).toUpperCase();

    const ownerName =
      config?.owner?.name ||
      "TOPFEROS MD";

    const ownerNumber =
      config?.owner?.number ||
      "Not Set";

    // --------------------------------------------------------
    // USER INFORMATION
    // --------------------------------------------------------

    const connectedUser =
      getConnectedUser(sock);

    const userName =
      config?.bot?.session?.showUserName === false
        ? "Hidden"
        : connectedUser.name;

    const userNumber =
      config?.bot?.session?.showUserNumber === false
        ? "Hidden"
        : connectedUser.number;

    // --------------------------------------------------------
    // LINKS
    // --------------------------------------------------------

    const webConnect =
      config?.links?.web ||
      "Web Bot link pa configuré";

    const webSettings =
      config?.links?.settings ||
      config?.links?.setting ||
      "Web Settings link pa configuré";

    const webChannel =
      config?.links?.channel ||
      "Web Channel link pa configuré";

    const webGroup =
      config?.links?.group ||
      config?.links?.groups ||
      "Web Group link pa configuré";

    // --------------------------------------------------------
    // LOAD REAL COMMANDS
    // --------------------------------------------------------

    const commands =
      getLoadedCommands();

    // --------------------------------------------------------
    // BUILD MENU
    // --------------------------------------------------------

    const commandsMenu =
      buildCommandsMenu(
        commands,
        prefix
      );

    const aliasSection =
      buildAliasSection(
        commands,
        prefix
      );

    const menu = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
        🦁 *${botName}* 🐑
          *COMMAND MENU*
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🤖 *BOT INFORMATION*

│ 🏷️ Name    : ${botName}
│ 📦 Version : ${version}
│ 🟢 Status  : ONLINE
│ 🔑 Prefix  : ${prefix}
│ ⚙️ Mode    : ${mode}

👑 *OWNER*

│ 👤 Name    : ${ownerName}
│ 📱 Number  : ${ownerNumber}

━━━━━━━━━━━━━━━━━━━━━━━━━━
          📚 *COMMANDS*
━━━━━━━━━━━━━━━━━━━━━━━━━━
${commandsMenu}

${aliasSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *USER*

│ Name   : ${userName}
│ Number : ${userNumber}

🌐 *WEB CONNECT*
└──➤ ${webConnect}

🌐 *WEB SETTINGS*
└──➤ ${webSettings}

🌐 *WEB CHANNEL*
└──➤ ${webChannel}

🌐 *WEB GROUP*
└──➤ ${webGroup}

╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
   🦁 *TOPFEROS MD TECH* 🐑
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`;

    // --------------------------------------------------------
    // SEND MENU WITH LOGO
    // --------------------------------------------------------

    if (
      fs.existsSync(LOGO_PATH)
    ) {

      const logo =
        fs.readFileSync(
          LOGO_PATH
        );

      await sock.sendMessage(
        chatId,
        {
          image: logo,
          caption: menu
        },
        {
          quoted: message
        }
      );

    } else {

      await sock.sendMessage(
        chatId,
        {
          text: menu
        },
        {
          quoted: message
        }
      );
    }

  } catch (error) {

    console.error(
      "❌ MENU ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    try {

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *TOPFEROS MD*\n\n" +
            "Gen yon erè pandan m ap prepare Menu la."
        },
        {
          quoted: message
        }
      );

    } catch (sendError) {

      console.error(
        "❌ MENU ERROR SEND:",
        sendError?.stack ||
        sendError?.message ||
        sendError
      );
    }
  }
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {

  name: "menu",

  aliases: [
    "commands",
    "cmds",
    "list"
  ],

  description:
    "Montre tout command TOPFEROS MD yo.",

  usage:
    ".menu",

  execute
};

// ╔════════════════════════════════════════════════════╗
// ║             🦁 By TOPFEROS MD TECH               ║
// ╚════════════════════════════════════════════════════╝