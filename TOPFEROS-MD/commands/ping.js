// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                    PING COMMAND                  ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

"use strict";

const config = require("../config");

async function execute(context) {
  const {
    sock,
    message
  } = context;

  const startTime = Date.now();

  const processingTime =
    Date.now() - startTime;

  const botName =
    config.bot?.name || "TOPFEROS MD";

  const version =
    config.bot?.version || "V1.0.0";

  const prefix =
    config.bot?.prefix || ".";

  const developer =
    config.bot?.developer || "TOPFEROS TECH";

  const response = `╭━━━〔 🤖 ${botName} 〕━━━╮
┃
┃ 🏓 *PONG!*
┃
┃ ⚡ Response: ${processingTime} ms
┃ 📦 Version: ${version}
┃ 🔰 Prefix: ${prefix}
┃
┃ 🚀 Status: Online
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© ${developer}`;

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
  name: "ping",
  aliases: ["p"],
  description: "Verifye si TOPFEROS MD ap fonksyone.",
  execute
};