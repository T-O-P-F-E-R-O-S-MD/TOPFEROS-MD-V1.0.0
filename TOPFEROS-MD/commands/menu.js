"use strict";

const fs = require("fs");
const path = require("path");
const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 TOPFEROS MD — MENU COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🖼️ Logo bot la
const LOGO_PATH = path.join(
__dirname,
"..",
"assets",
"logo.png"
);

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
config.bot?.mode ||
"public";

const developer =
config.bot?.developer ||
"TOPFEROS TECH";

const ownerName =
config.owner?.name ||
"TOPFEROS MD";

const channel =
config.links?.channel ||
"Not configured";

const group =
config.links?.group ||
"Not configured";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const menu = `======= 🦁 Session ========
║
║ ${botName} ${version}
║ STATUT : ONLINE
║ MODE : ${String(mode).toUpperCase()}
║ PREFIX : (${prefix})
║
╚════════════════════════════

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
║                    By TOPFEROS MD                  ║
╚════════════════════════════════════════════════════╝`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 SEND MENU WITH LOGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

try {

if (
  fs.existsSync(LOGO_PATH)
) {

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
// ║                    by TOPFEROS MD                    ║
// ╚════════════════════════════════════════════════════╝