// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                   ALIVE COMMAND                  ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

"use strict";

const config = require("../config");

async function execute(context) {
  const {
    sock,
    message
  } = context;

  const botName =
    config.bot?.name || "TOPFEROS MD";

  const version =
    config.bot?.version || "V1.0.0";

  const prefix =
    config.bot?.prefix || ".";

  const mode =
    config.bot?.mode || "public";

  const developer =
    config.bot?.developer || "TOPFEROS TECH";

  const response = `╭━━━〔 🤖 ${botName} 〕━━━╮
┃
┃ 👋 *Bonjour! Mwen vivan.*
┃
┃ 🟢 Status: *ONLINE*
┃ ⚡ Mode: *${mode.toUpperCase()}*
┃ 📦 Version: *${version}*
┃ 🔰 Prefix: *${prefix}*
┃
┃ 🤖 Bot la pare pou resevwa
┃    command ou yo.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 *${developer}*`;

  if (!sock || !message?.key?.remoteJid) {
    console.log(response);
    return;
  }

  await sock.sendMessage(
    message.key.remoteJid,
    {
      text: response
    },
    {
      quoted: message
    }
  );
}

module.exports = {
  name: "alive",
  aliases: ["online", "status"],
  description: "Verifye si TOPFEROS MD online.",
  execute
};