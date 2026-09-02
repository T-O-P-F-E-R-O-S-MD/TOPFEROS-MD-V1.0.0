"use strict";

const fs = require("fs");
const path = require("path");
const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 TOPFEROS MD — MENU COMMAND
// 🚀 TOPFEROS TECH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🖼️ Logo bot la
const LOGO_PATH = path.join(
  __dirname,
  "..",
  "assets",
  "logo.png"
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👤 GET CONNECTED WHATSAPP USER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getConnectedUser(sock) {
  const user = sock?.user;

  if (!user) {
    return {
      name: "Unknown",
      number: "Unknown"
    };
  }

  // 👤 Non kont WhatsApp la
  const name =
    user.name ||
    user.verifiedName ||
    "Unknown";

  // 📱 JID kont WhatsApp la
  const id =
    user.id ||
    "";

  // 📱 Retire :device ak @s.whatsapp.net
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 MENU EXECUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context;

  const chatId =
    message?.key?.remoteJid;

  if (!chatId) {
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚙️ BOT CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const botName =
    config.bot?.name ||
    "TOPFEROS MD";

  const version =
    config.bot?.version ||
    "V1.0.0";

  const prefix =
    config.bot?.prefix ||
    ".";

  const mode =
    String(
      config.bot?.mode ||
      "public"
    ).toLowerCase();

  const developer =
    config.bot?.developer ||
    "TOPFEROS TECH";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👤 CONNECTED USER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const connectedUser =
    getConnectedUser(sock);

  const showUserName =
    config.bot?.session?.showUserName !== false;

  const showUserNumber =
    config.bot?.session?.showUserNumber !== false;

  const userName =
    showUserName
      ? connectedUser.name
      : "Hidden";

  const userNumber =
    showUserNumber
      ? connectedUser.number
      : "Hidden";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👑 OWNER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const ownerName =
    config.owner?.name ||
    "TOPFEROS MD";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔗 LINKS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const channel =
    config.links?.channel ||
    "Not configured";

  const group =
    config.links?.group ||
    "Not configured";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🦁 SESSION HEADER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const sessionHeader = `
╔════════════════════════════════════════════════════╗
║                  🦁 SESSION                       ║
╠════════════════════════════════════════════════════╣
║ 🤖 Name       : ${botName}
║ 📦 Version    : ${version}
║ 📡 Status     : ONLINE
║ 🔑 Prefix     : ${prefix}
║ ⚙️ Mode       : ${mode}
║ 👤 User Name  : ${userName}
║ 📱 User No.   : ${userNumber}
╚════════════════════════════════════════════════════╝
`;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📋 MENU
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const menu = `${sessionHeader}

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃       🤖 ${botName}
┃       🚀 ${developer}
┃       📦 ${version}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 ℹ️ INFORMATION 〕━━━╮
┃
┃ ${prefix}menu
┃ ${prefix}help
┃ ${prefix}info
┃ ${prefix}owner
┃ ${prefix}alive
┃ ${prefix}runtime
┃ ${prefix}uptime
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🤖 ARTIFICIAL INTELLIGENCE 〕━━━╮
┃
┃ ${prefix}ai
┃ ${prefix}chat
┃ ${prefix}ask
┃ ${prefix}imagine
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🎵 MEDIA 〕━━━╮
┃
┃ ${prefix}play
┃ ${prefix}download
┃ ${prefix}sticker
┃ ${prefix}toimg
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🖼️ STATUS & MEDIA 〕━━━╮
┃
┃ 🖼️ Status Saver
┃ 📥 Save / Send
┃
┃ 👁️ View Once
┃ ${prefix}vv2
┃
┃ 👁️ View Once
┃   Reply / Forward View Once
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 👥 GROUP MANAGEMENT 〕━━━╮
┃
┃ ${prefix}tagall
┃ ${prefix}groupinfo
┃ ${prefix}admin
┃ ${prefix}promote
┃ ${prefix}demote
┃ ${prefix}kick
┃ ${prefix}add
┃ ${prefix}open
┃ ${prefix}close
┃ ${prefix}setname
┃ ${prefix}setdesc
┃ ${prefix}setpp
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 👋 WELCOME SYSTEM 〕━━━╮
┃
┃ ${prefix}setwelcome
┃ ${prefix}setgoodbye
┃ ${prefix}welcome
┃ ${prefix}goodbye
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🔐 SECURITY 〕━━━╮
┃
┃ ${prefix}antilink
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 📡 AUTOMATIC SYSTEMS 〕━━━╮
┃
┃ 🤖 Automatic message listener
┃ 📡 Message processing
┃ 👋 Group event listener
┃ 🖼️ Media processing
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 ⚙️ BOT INFORMATION 〕━━━╮
┃
┃ 🤖 Bot: ${botName}
┃ 📦 Version: ${version}
┃ 👑 Owner: ${ownerName}
┃ 🚀 Developer: ${developer}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🔗 OFFICIAL LINKS 〕━━━╮
┃
┃ 📢 Channel:
┃ ${channel}
┃
┃ 👥 Group:
┃ ${group}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃
┃ 🤖 ${botName}
┃ 🚀 ${developer}
┃ ❤️ Thanks for using the bot
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╔════════════════════════════════════════════════════╗
║              🚀 By TOPFEROS TECH                 ║
╚════════════════════════════════════════════════════╝`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 SEND MENU WITH LOGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  try {
    if (fs.existsSync(LOGO_PATH)) {
      const logo =
        fs.readFileSync(LOGO_PATH);

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
      console.warn(
        `⚠️ Logo pa jwenn: ${LOGO_PATH}`
      );

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
      error?.message || error
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
// ║                 🚀 BY TOPFEROS TECH              ║
// ╚════════════════════════════════════════════════════╝