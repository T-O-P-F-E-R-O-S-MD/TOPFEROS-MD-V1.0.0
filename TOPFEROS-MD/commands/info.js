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

  const ownerName =
    config.owner?.name || "TOPFEROS MD";

  const ownerNumber =
    config.owner?.number || "Not configured";

  const channel =
    config.links?.channel ||
    "Not configured";

  const group =
    config.links?.group ||
    "Not configured";

  const web =
    config.links?.web ||
    "Coming soon";

  const response = `╭━━━━━━━━━━━━━━━━━━━━━━╮
┃      🤖 *BOT INFO*       ┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

🤖 *Bot Name*
➜ ${botName}

📦 *Version*
➜ ${version}

🔰 *Prefix*
➜ ${prefix}

⚙️ *Mode*
➜ ${mode.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━

👑 *OWNER*

👤 Name
➜ ${ownerName}

📱 Number
➜ ${ownerNumber}

━━━━━━━━━━━━━━━━━━━━━━

🔗 *OFFICIAL LINKS*

📢 Channel
➜ ${channel}

👥 Group
➜ ${group}

🌐 Web Portal
➜ ${web}

━━━━━━━━━━━━━━━━━━━━━━

🚀 *Developer*
➜ ${developer}

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
  name: "info",
  aliases: ["botinfo", "about"],
  description: "Montre enfòmasyon konplè sou TOPFEROS MD.",
  execute
};