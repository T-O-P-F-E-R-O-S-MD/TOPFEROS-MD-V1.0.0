"use strict";

const config = require("../config");

const startedAt = Date.now();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏱️ FORMAT RUNTIME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatRuntime(milliseconds) {
  let seconds = Math.floor(milliseconds / 1000);

  const days = Math.floor(seconds / 86400);
  seconds %= 86400;

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  const parts = [];

  if (days) {
    parts.push(`${days}d`);
  }

  if (hours) {
    parts.push(`${hours}h`);
  }

  if (minutes) {
    parts.push(`${minutes}m`);
  }

  parts.push(`${seconds}s`);

  return parts.join(" ");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 RUNTIME COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context;

  const runtime =
    formatRuntime(
      Date.now() - startedAt
    );

  const botName =
    config.bot?.name || "TOPFEROS MD";

  const version =
    config.bot?.version || "V1.0.0";

  const developer =
    config.bot?.developer || "TOPFEROS TECH";

  const response = `╭━━━〔 ⏱️ RUNTIME 〕━━━╮
┃
┃ 🤖 *${botName}*
┃
┃ 🟢 Status: *ONLINE*
┃ ⏱️ Runtime:
┃    *${runtime}*
┃
┃ 📦 Version:
┃    *${version}*
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
  name: "runtime",
  aliases: ["rt"],
  description: "Montre konbyen tan bot la ap kouri.",
  execute
};