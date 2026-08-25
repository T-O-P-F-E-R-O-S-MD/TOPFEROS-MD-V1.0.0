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

  const menu = `╭━━━━━━━━━━━━━━━━━━━━━━╮
┃   🤖 ${botName}
┃   🚀 ${developer}
╰━━━━━━━━━━━━━━━━━━━━━━╯

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
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🤖 AI 〕━━━╮
┃
┃ ${prefix}ai
┃ ${prefix}chat
┃ ${prefix}ask
┃ ${prefix}imagine
┃
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🎵 MEDIA 〕━━━╮
┃
┃ ${prefix}play
┃ ${prefix}download
┃ ${prefix}sticker
┃ ${prefix}toimg
┃
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 👥 GROUP 〕━━━╮
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
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 👋 WELCOME 〕━━━╮
┃
┃ ${prefix}setwelcome
┃ ${prefix}setgoodbye
┃ ${prefix}welcome
┃ ${prefix}goodbye
┃
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🔗 SECURITY 〕━━━╮
┃
┃ ${prefix}antilink
┃
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 ⚙️ SYSTEM 〕━━━╮
┃
┃ Prefix: ${prefix}
┃ Version: ${version}
┃ Owner: ${ownerName}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🔗 OFFICIAL 〕━━━╮
┃
┃ 📢 Channel:
┃ ${channel}
┃
┃ 👥 Group:
┃ ${group}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

> 🤖 ${botName}
> 🚀 Powered by ${developer}`;

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
  aliases: ["help", "commands", "list"],
  description:
    "Montre tout command TOPFEROS MD yo.",
  usage:
    ".menu",
  execute
};