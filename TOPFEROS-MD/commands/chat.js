"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 TOPFEROS MD — CHAT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message,
    text = ""
  } = context;

  const chatId =
    message?.key?.remoteJid;

  const userMessage =
    text.trim();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY MESSAGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!userMessage) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Tanpri ekri yon mesaj apre .chat."
      },
      {
        quoted: message
      }
    );

    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 AI CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const apiUrl =
    config.ai?.apiUrl;

  const apiKey =
    config.ai?.apiKey;

  if (!apiUrl || !apiKey) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "⚠️ AI API pa configure nan config.js."
      },
      {
        quoted: message
      }
    );

    return;
  }

  try {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✍️ TYPING STATUS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendPresenceUpdate(
      "composing",
      chatId
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND MESSAGE TO AI
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const apiResponse =
      await fetch(apiUrl, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          message: userMessage,
          prompt: userMessage,
          chat: true
        })
      });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ API ERROR
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!apiResponse.ok) {
      throw new Error(
        `AI API Error: ${apiResponse.status}`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📥 READ RESPONSE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const data =
      await apiResponse.json();

    const answer =
      data.answer ||
      data.response ||
      data.message ||
      data.result ||
      data.output;

    if (!answer) {
      throw new Error(
        "AI API pa retounen yon repons."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND RESPONSE TO WHATSAPP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const botName =
      config.bot?.name ||
      "TOPFEROS MD";

    const developer =
      config.bot?.developer ||
      "TOPFEROS TECH";

    const response = `╭━━━〔 💬 ${botName} CHAT 〕━━━╮
┃
┃ ${answer}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${developer}`;

    await sock.sendMessage(
      chatId,
      {
        text: response
      },
      {
        quoted: message
      }
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⏸️ STOP TYPING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendPresenceUpdate(
      "paused",
      chatId
    );

  } catch (error) {

    console.error(
      "❌ CHAT ERROR:",
      error.message
    );

    await sock.sendPresenceUpdate(
      "paused",
      chatId
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 💬 CHAT 〕━━━╮
┃
┃ ❌ Chat AI pa kapab
┃    reponn kounye a.
┃
┃ ⚠️ Verifye AI API a.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${config.bot?.developer || "TOPFEROS TECH"}`
      },
      {
        quoted: message
      }
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "chat",
  aliases: ["talk", "conversation"],
  description: "Fè yon konvèsasyon ak AI.",
  usage: ".chat <mesaj>",
  execute
};