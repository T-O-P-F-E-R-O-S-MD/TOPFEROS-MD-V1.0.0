"use strict";

const config = require("../src/config");

function cleanText(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value).trim();
}

function getUserTag(message) {
  const participant =
    message?.key?.participant ||
    message?.participant ||
    "";

  const number = participant.split("@")[0];

  return number ? `@${number}` : "@user";
}

function buildMenu(message) {
  const botName = cleanText(
    config?.bot?.name,
    "TOPFEROS MD"
  );

  const version = cleanText(
    config?.bot?.version,
    "2.0.0"
  );

  const prefix = cleanText(
    config?.bot?.prefix,
    "."
  );

  const mode = cleanText(
    config?.bot?.mode,
    "Public"
  );

  const location = cleanText(
    config?.bot?.location,
    "HAÏTI"
  );

  const user = getUserTag(message);

  return `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃      🦁 ${botName} 🐑       ┃
┃          V${version}              ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭───────❖ 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 ❖───────╮
│                              │
│ 🎉 🦁 𝕋𝕆ℙ𝔽𝔼ℝ𝕆𝕊 𝕄𝔻 𝕍${version} 𝕆ℕ𝕃𝕀ℕ𝔼 🎉
│                              │
│ ⚡ Prefix   : ${prefix}
│ 🌐 Mode     : ${mode}
│ 👤 User     : ${user}
│ 📍 Location : ${location}
│                              │
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭──────❖ 𝐅𝐄𝐀𝐓𝐔𝐑𝐄𝐒 ❖──────╮
│                            │
│ 🟢 Always Online
│ ⌨️ Fake Typing
│ 🎙️ Fake Recording
│ 👁️ Auto Status Seen
│ 💬 Auto Status Reply
│ ❤️ Auto Status React
│ 📞 Anti Call
│ 🛡️ Anti Delete
│ 🤖 Anti Bot Protection
│ 👁️ ViewOnce / VV2
│ 👥 Group Management
│ 🕦 Group Automation
│ 🧠 Smart AI & Auto Chat
│ 🎵 Music & Media
│ 🎬 Video Download
│ 🎀 & Many More Features...
│                            │
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭──────❖ 𝐐𝐔𝐈𝐂𝐊 𝐌𝐄𝐍𝐔 ❖──────╮
│                              │
│ 📋 Type ${prefix}menu
│    ➜ To view all commands
│
│ 👁️ Type ${prefix}vv2
│    ➜ Decode a replied ViewOnce
│
│ ⚙️ Type ${prefix}setting
│    ➜ To open the settings portal
│                              │
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
│ 🦁  TECH BY TOPFEROS MD 🐑
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`.trim();
}

async function sendMenu(sock, message) {
  if (!sock || !message) {
    throw new Error("Socket or message is missing.");
  }

  const jid = message.key?.remoteJid;

  if (!jid) {
    throw new Error("Message remoteJid is missing.");
  }

  const menuText = buildMenu(message);

  await sock.sendMessage(
    jid,
    {
      text: menuText,
      mentions: message.key?.participant
        ? [message.key.participant]
        : []
    },
    {
      quoted: message
    }
  );

  return menuText;
}

module.exports = {
  buildMenu,
  sendMenu
};