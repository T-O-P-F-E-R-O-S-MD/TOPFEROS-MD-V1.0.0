"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 TOPFEROS MD — ASK COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message,
    text = ""
  } = context;

  const chatId =
    message?.key?.remoteJid;

  const question =
    text.trim();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY QUESTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!question) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Tanpri ekri kesyon ou apre .ask."
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
    // ✍️ BOT AP EKRI
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendPresenceUpdate(
      "composing",
      chatId
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND QUESTION TO AI
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
          message: question,
          prompt: question,
          mode: "ask"
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
    // 📥 GET AI RESPONSE
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
    // 📤 SEND ANSWER TO WHATSAPP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const botName =
      config.bot?.name ||
      "TOPFEROS MD";

    const developer =
      config.bot?.developer ||
      "TOPFEROS TECH";

    const response = `╭━━━〔 🧠 ${botName} ASK 〕━━━╮
┃
┃ 💬 *Question:*
┃ ${question}
┃
┃ 🤖 *Answer:*
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
      "❌ ASK ERROR:",
      error.message
    );

    await sock.sendPresenceUpdate(
      "paused",
      chatId
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 🧠 ASK 〕━━━╮
┃
┃ ❌ AI pa kapab reponn
┃    kounye a.
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
  name: "ask",
  aliases: ["question"],
  description: "Poze yon kesyon dirèkteman bay AI.",
  usage: ".ask <kesyon>",
  execute
};