"use strict";

const config = require("../config");

async function execute(context) {
  const {
    sock,
    message,
    text = ""
  } = context;

  const question = text.trim();

  if (!question) {
    const response = `╭━━━〔 🤖 AI 〕━━━╮
┃
┃ ❌ Tanpri ekri kesyon ou.
┃
┃ 📌 Egzanp:
┃ ${config.bot?.prefix || "."}ai Ki sa ki WhatsApp?
┃
╰━━━━━━━━━━━━━━━━━━━━╯`;

    if (sock && message?.key?.remoteJid) {
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

    return;
  }

  const apiUrl = config.ai?.apiUrl;
  const apiKey = config.ai?.apiKey;

  if (!apiUrl || !apiKey) {
    const response = `╭━━━〔 🤖 AI 〕━━━╮
┃
┃ ⚠️ *AI API pa configure.*
┃
┃ Owner la bezwen mete
┃ AI_API_URL ak AI_API_KEY
┃ nan configuration bot la.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${config.bot?.developer || "TOPFEROS TECH"}`;

    if (sock && message?.key?.remoteJid) {
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

    return;
  }

  try {
    await sock.sendPresenceUpdate(
      "composing",
      message.key.remoteJid
    );

    const response = await fetch(apiUrl, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },

      body: JSON.stringify({
        message: question,
        prompt: question
      })
    });

    if (!response.ok) {
      throw new Error(
        `AI API returned ${response.status}`
      );
    }

    const data = await response.json();

    const answer =
      data.answer ||
      data.response ||
      data.message ||
      data.result ||
      data.output;

    if (!answer) {
      throw new Error(
        "AI API returned no answer."
      );
    }

    const botName =
      config.bot?.name || "TOPFEROS MD";

    const developer =
      config.bot?.developer || "TOPFEROS TECH";

    const finalMessage = `╭━━━〔 🤖 ${botName} AI 〕━━━╮
┃
┃ 🧠 *Question:*
┃ ${question}
┃
┃ 💬 *Answer:*
┃
┃ ${answer}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${developer}`;

    await sock.sendMessage(
      message.key.remoteJid,
      {
        text: finalMessage
      },
      {
        quoted: message
      }
    );

    await sock.sendPresenceUpdate(
      "paused",
      message.key.remoteJid
    );

  } catch (error) {
    console.error(
      "❌ AI Command Error:",
      error.message
    );

    const errorMessage = `╭━━━〔 🤖 AI 〕━━━╮
┃
┃ ❌ *AI pa disponib kounye a.*
┃
┃ Tanpri verifye configuration
┃ AI API a epi eseye ankò.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${config.bot?.developer || "TOPFEROS TECH"}`;

    await sock.sendMessage(
      message.key.remoteJid,
      {
        text: errorMessage
      },
      {
        quoted: message
      }
    );

    await sock.sendPresenceUpdate(
      "paused",
      message.key.remoteJid
    );
  }
}

module.exports = {
  name: "ai",
  aliases: ["askai"],
  description: "Poze yon kesyon ak sistèm AI a.",
  execute
};