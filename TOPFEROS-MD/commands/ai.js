"use strict";

const config = require("../config");

async function execute(context) {
  const {
    sock,
    message,
    text = ""
  } = context;

  const question = text.trim();
  const chatId = message?.key?.remoteJid;

  if (!chatId) return;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ NO QUESTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!question) {
    const response = `╭━━━〔 🤖 AI 〕━━━╮
┃
┃ ❌ Tanpri ekri kesyon ou.
┃
┃ 📌 Egzanp:
┃ ${config.bot?.prefix || "."}ai Ki sa ki WhatsApp?
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${config.bot?.developer || "TOPFEROS TECH"}`;

    await sock.sendMessage(
      chatId,
      { text: response },
      { quoted: message }
    );

    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🤖 GROQ CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const apiUrl =
    config.ai?.apiUrl ||
    "https://api.groq.com/openai/v1/chat/completions";

  const apiKey =
    config.ai?.apiKey;

  const model =
    config.ai?.model ||
    "openai/gpt-oss-20b";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔑 API KEY MANQUANTE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!apiKey) {
    const response = `╭━━━〔 🤖 AI 〕━━━╮
┃
┃ ⚠️ *AI API KEY PA CONFIGURE.*
┃
┃ Mete API key Groq la nan
┃ Environment Variables Render yo.
┃
┃ Variable:
┃ AI_API_KEY
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${config.bot?.developer || "TOPFEROS TECH"}`;

    await sock.sendMessage(
      chatId,
      { text: response },
      { quoted: message }
    );

    return;
  }

  try {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✍️ AI AP PREPARE REPONS LAN
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    try {
      await sock.sendPresenceUpdate(
        "composing",
        chatId
      );
    } catch (_) {}

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🚀 GROQ API REQUEST
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const response = await fetch(
      apiUrl,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model,

          messages: [
            {
              role: "system",
              content:
                "You are TOPFEROS MD AI, a helpful and friendly WhatsApp assistant. Answer clearly and concisely."
            },
            {
              role: "user",
              content: question
            }
          ],

          temperature: 0.7,

          max_completion_tokens: 1024
        })
      }
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ API ERROR
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!response.ok) {

      let errorText = "";

      try {
        errorText = await response.text();
      } catch (_) {}

      console.error(
        "❌ GROQ API ERROR:",
        response.status,
        errorText
      );

      throw new Error(
        `Groq API returned ${response.status}`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📥 API RESPONSE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const data =
      await response.json();

    const answer =
      data?.choices?.[0]?.message?.content;

    if (!answer) {
      console.error(
        "❌ GROQ RESPONSE:",
        JSON.stringify(data)
      );

      throw new Error(
        "Groq API returned no answer."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💬 SEND ANSWER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const botName =
      config.bot?.name ||
      "TOPFEROS MD";

    const developer =
      config.bot?.developer ||
      "TOPFEROS TECH";

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
      chatId,
      {
        text: finalMessage
      },
      {
        quoted: message
      }
    );

    try {
      await sock.sendPresenceUpdate(
        "paused",
        chatId
      );
    } catch (_) {}

  } catch (error) {

    console.error(
      "❌ AI COMMAND ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    const errorMessage = `╭━━━〔 🤖 AI 〕━━━╮
┃
┃ ❌ *AI pa disponib kounye a.*
┃
┃ Verifye AI_API_KEY ak
┃ configuration Groq la.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${config.bot?.developer || "TOPFEROS TECH"}`;

    await sock.sendMessage(
      chatId,
      {
        text: errorMessage
      },
      {
        quoted: message
      }
    );

    try {
      await sock.sendPresenceUpdate(
        "paused",
        chatId
      );
    } catch (_) {}
  }
}

module.exports = {
  name: "ai",

  aliases: [
    "askai"
  ],

  description:
    "Poze yon kesyon ak Groq AI.",

  usage:
    ".ai <kesyon>",

  execute
};