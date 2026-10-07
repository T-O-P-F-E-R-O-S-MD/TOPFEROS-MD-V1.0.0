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
    message.key?.participant || jid;

  const number = String(participant)
    .split("@")[0]
    .replace(/\D/g, "");

  if (!number) {
    throw new Error("A valid phone number is required.");
  }

  const code = await generateParrainCode(number);

  const text =
`╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🦁 TOPFEROS MD 🐑
┃     PARRAIN CODE
╰━━━━━━━━━━━━━━━━━━━━━━╯

👤 NUMBER
${number}

🔐 YOUR CODE
${code}

⏳ VALID FOR
60 SECONDS

📋 COPY THE CODE ABOVE
⚠️ After 60 seconds, the code expires
and you can request a new one.

╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🦁 TECH BY TOPFEROS MD 🐑
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

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