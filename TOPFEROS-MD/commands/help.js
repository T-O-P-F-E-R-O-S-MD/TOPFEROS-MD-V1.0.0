// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                    HELP COMMAND                  ║
// ║              🚀 TOPFEROS TECH                    ║
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

  const developer =
    config.bot?.developer || "TOPFEROS TECH";

  const response = `╭━━━〔 🤖 ${botName} 〕━━━╮
┃
┃ 👋 *Bonjour!*
┃
┃ Men kèk command ou ka itilize:
┃
┃ 📚 *BASIC*
┃ • ${prefix}help
┃ • ${prefix}ping
┃ • ${prefix}alive
┃ • ${prefix}owner
┃ • ${prefix}info
┃ • ${prefix}runtime
┃ • ${prefix}uptime
┃
┃ 🤖 *AI*
┃ • ${prefix}ai <kesyon>
┃ • ${prefix}chat <mesaj>
┃ • ${prefix}ask <kesyon>
┃ • ${prefix}imagine <prompt>
┃
┃ 🎵 *MEDIA*
┃ • ${prefix}play <non>
┃ • ${prefix}song <non>
┃ • ${prefix}video <non>
┃ • ${prefix}ytmp3 <url>
┃ • ${prefix}ytmp4 <url>
┃ • ${prefix}tiktok <url>
┃ • ${prefix}instagram <url>
┃ • ${prefix}facebook <url>
┃
┃ 🛠️ *TOOLS*
┃ • ${prefix}sticker
┃ • ${prefix}toimg
┃ • ${prefix}tomp3
┃ • ${prefix}compress
┃ • ${prefix}quoted
┃
┃ 👥 *GROUP*
┃ • ${prefix}kick
┃ • ${prefix}add
┃ • ${prefix}promote
┃ • ${prefix}demote
┃ • ${prefix}mute
┃ • ${prefix}unmute
┃ • ${prefix}tagall
┃ • ${prefix}hidetag
┃ • ${prefix}warn
┃ • ${prefix}unwarn
┃ • ${prefix}warnings
┃ • ${prefix}groupinfo
┃ • ${prefix}welcome
┃ • ${prefix}invite
┃ • ${prefix}link
┃ • ${prefix}revoke
┃ • ${prefix}setname
┃ • ${prefix}setdesc
┃
┃ ⚙️ *SYSTEM*
┃ • ${prefix}broadcast
┃ • ${prefix}block
┃ • ${prefix}unblock
┃ • ${prefix}join
┃ • ${prefix}leave
┃ • ${prefix}restart
┃ • ${prefix}shutdown
┃ • ${prefix}setprefix
┃ • ${prefix}setbio
┃ • ${prefix}settings
┃
┃ ⚙️ *SETTINGS*
┃ • ${prefix}setting
┃
┃ 📦 Version: *${version}*
┃ 🚀 Developer: *${developer}*
┃
╰━━━━━━━━━━━━━━━━━━━━╯`;

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
  name: "help",
  aliases: ["h", "commands"],
  description: "Montre lis command TOPFEROS MD yo.",
  execute
};