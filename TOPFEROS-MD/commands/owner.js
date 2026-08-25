"use strict";

const config = require("../config");

async function execute(context) {
  const { sock, message } = context;

  const ownerName =
    config.owner?.name || "TOPFEROS MD";

  const ownerNumber =
    config.owner?.number || "+18492573434";

  const channel =
    config.links?.channel ||
    "https://whatsapp.com/channel/0029Vb8mtECL7UVSGYQOdm13";

  const group =
    config.links?.group ||
    "https://chat.whatsapp.com/COEEHvkaiu33hXwWfiO0Pq?s=cl&p=a&mlu=4";

  const developer =
    config.bot?.developer || "TOPFEROS TECH";

  const response = `╭━━━━━━━━━━━━━━━━━━━━╮
┃      👑 *OWNER*       ┃
╰━━━━━━━━━━━━━━━━━━━━╯

🤖 *TOPFEROS MD*

👤 *Owner Name*
➜ ${ownerName}

📱 *Owner Number*
➜ ${ownerNumber}

━━━━━━━━━━━━━━━━━━━━

📢 *Official Channel*
➜ ${channel}

👥 *Official Group*
➜ ${group}

━━━━━━━━━━━━━━━━━━━━

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
  name: "owner",
  aliases: ["dev", "creator"],
  description: "Montre enfòmasyon owner, channel ak group.",
  execute
};