"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏱️ BOT START TIME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const startedAt = Date.now();


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🕐 FORMAT UPTIME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatUptime(milliseconds) {
  let seconds = Math.floor(milliseconds / 1000);

  const days = Math.floor(seconds / 86400);
  seconds %= 86400;

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  return [
    days ? `${days}d` : null,
    hours ? `${hours}h` : null,
    minutes ? `${minutes}m` : null,
    `${seconds}s`
  ]
    .filter(Boolean)
    .join(" ");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 UPTIME COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context;

  const uptime =
    formatUptime(
      Date.now() - startedAt
    );

  const botName =
    config.bot?.name || "TOPFEROS MD";

  const version =
    config.bot?.version || "V1.0.0";

  const mode =
    config.bot?.mode || "public";

  const prefix =
    config.bot?.prefix || ".";

  const developer =
    config.bot?.developer || "TOPFEROS TECH";

  const response = `╭━━━〔 🤖 ${botName} 〕━━━╮
┃
┃ 🟢 *BOT STATUS*
┃
┃ ✅ Status: ONLINE
┃ ⏱️ Uptime: ${uptime}
┃ 📦 Version: ${version}
┃ ⚙️ Mode: ${mode.toUpperCase()}
┃ 🔰 Prefix: ${prefix}
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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "uptime",
  aliases: ["up"],
  description: "Montre depi konbyen tan bot la ap fonksyone.",
  execute
};