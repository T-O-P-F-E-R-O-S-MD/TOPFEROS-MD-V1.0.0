"use strict";

const {
  generateParrainCode
} = require("../services/parrain");

async function parrainCommand(sock, message) {
  if (!sock || !message) {
    throw new Error("Socket or message is missing.");
  }

  const jid = message.key?.remoteJid;

  if (!jid) {
    throw new Error("Message remoteJid is missing.");
  }

  const participant =
    message.key?.participant ||
    jid;

  const number = participant.split("@")[0];

  const code = await generateParrainCode(number);

  const text = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃      🦁 TOPFEROS MD 🐑       ┃
┃        PARRAIN CODE          ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👤 NUMBER
${number}

🎟️ YOUR PARRAIN CODE

┌──────────────────────────────┐
│ ${code}
└──────────────────────────────┘

📋 Copy this code and give it
to the person you want to refer.

🟢 CODE GENERATED SUCCESSFULLY

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
│ 🦁 TECH BY TOPFEROS MD 🐑
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`.trim();

  await sock.sendMessage(
    jid,
    {
      text,
      mentions: participant.includes("@")
        ? [participant]
        : []
    },
    {
      quoted: message
    }
  );

  return {
    success: true,
    number,
    code
  };
}

module.exports = {
  parrainCommand
};