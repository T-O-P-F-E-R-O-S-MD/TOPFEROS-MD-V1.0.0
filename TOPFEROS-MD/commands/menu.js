"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 TOPFEROS MD — MENU COMMAND
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

  const menu = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃
┃       🤖 ${botName}
┃       🚀 ${developer}
┃       📦 ${version}
┃
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
┃ 👁️View Once
┃   reply/forward View Once 
┃    
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
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📤 SEND MENU
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  try {
    await sock.sendMessage(
      chatId,
      {
        text: menu
      },
      {
        quoted: message
      }
    );

  } catch (error) {

    console.error(
      "❌ MENU ERROR:",
      error.message
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