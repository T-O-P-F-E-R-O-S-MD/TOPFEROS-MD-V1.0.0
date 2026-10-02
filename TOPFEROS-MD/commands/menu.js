"use strict";

const fs = require("fs");
const path = require("path");
const config = require("../config");

// ============================================================
// TOPFEROS MD V1.0.0
// MENU COMMAND
// ============================================================

const LOGO_PATH = path.join(
  __dirname,
  "..",
  "assets",
  "logo.png"
);

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

  const id = user.id || "";

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
    "TOPFEROS MD V1.0.0";

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

  const menu = `
━━━━━━━━━━━━━━━━━━━━━━
          COMMANDS
━━━━━━━━━━━━━━━━━━━━━━

🤖 Bot       : ${botName} ${version}
📦 Version   : ${version}
🟢 Status    : ONLINE
🔑 Prefix    : ${prefix}
⚙️ Mode      : ${mode}

👑 OWNER
👤 Name      : ${ownerName}
📱 Number    : ${userNumber}

━━━━━━━━━━━━━━━━━━━━━━
          COMMANDS
━━━━━━━━━━━━━━━━━━━━━━

👑 GENERAL
│ ${prefix}alive
│ ${prefix}ping
│ ${prefix}menu
│ ${prefix}help
│ ${prefix}info
│ ${prefix}owner
│ ${prefix}runtime
│ ${prefix}uptime
│ ${prefix}status
│ ${prefix}setting

👥 GROUP
│ ${prefix}add <NUMBER>
│ ${prefix}admin
│ ${prefix}close
│ ${prefix}demote
│ ${prefix}groupinfo
│ ${prefix}kick <NUMBER>
│ ${prefix}open
│ ${prefix}promote <NUMBER>
│ ${prefix}setdesc <TEXT>
│ ${prefix}setgoodbye <TEXT>
│ ${prefix}setname <NAME>
│ ${prefix}setpp
│ ${prefix}setwelcome <TEXT>
│ ${prefix}tagall

🎬 MEDIA
│ ${prefix}download <URL>
│ ${prefix}play <TITLE SONG>
│ ${prefix}sticker
│ ${prefix}toimg
│ ${prefix}vv2

🤖 AI
│ ${prefix}ai <QUESTION>
│ ${prefix}ask <QUESTION>
│ ${prefix}chat <MESSAGE>
│ ${prefix}imagine <PROMPT>

🔐 OTHER
│ ${prefix}pair <NUMBER>

━━━━━━━━━━━━━━━━━━━━━━

👤 USER
│ Name   : ${userName}
│ Number : ${userNumber}

🌐 Web Connect
└──➤ ${webConnect}
🌐 Web Settings
└──➤ ${webSettings}
🌐 Web Channel
└──➤ ${webChannel}
🌐 Web GROUP
└──➤ ${webGroup}

╔════════════════════════════════════════════════════╗
║             🚀 TECH BY TOPFEROS MD               ║
╚════════════════════════════════════════════════════╝
`;

  try {
    if (fs.existsSync(LOGO_PATH)) {
      const logo = fs.readFileSync(LOGO_PATH);

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
  }
}

module.exports = {
  name: "menu",
  aliases: [
    "commands",
    "cmds",
    "list"
  ],
  description:
    "Montre tout command TOPFEROS MD yo.",
  usage: ".menu",
  execute
};