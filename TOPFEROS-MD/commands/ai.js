"use strict";

const config = require("../config");

async function execute({
  sock,
  message,
  text = ""
}) {
  const chatId =
    message?.key?.remoteJid;

  const question =
    String(text || "").trim();

  if (!chatId) return;

  if (!question) {
    return sock.sendMessage(
      chatId,
      {
        text:
          `🤖 *TOPFEROS MD AI*\n\n` +
          `Ekri kesyon an apre ` +
          `${config.bot?.prefix || "."}ai.\n\n` +
          `Egzanp:\n` +
          `.ai Ki sa ki WhatsApp?`
      },
      {
        quoted: message
      }
    );
  }

  const apiUrl =
    String(
      config.ai?.apiUrl ||
      "https://api.groq.com/openai/v1/chat/completions"
    ).trim();

  const apiKey =
    String(
      config.ai?.apiKey || ""
    ).trim();

  const model =
    String(
      config.ai?.model ||
      "openai/gpt-oss-20b"
    ).trim();

  if (!apiKey) {
    return sock.sendMessage(
      chatId,
      {
        text:
          "⚠️ AI_API_KEY pa configure " +
          "sou Render."
      },
      {
        quoted: message
      }
    );
  }

  try {

    await sock
      .sendPresenceUpdate(
        "composing",
        chatId
      )
      .catch(() => {});

    const response =
      await fetch(
        apiUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${apiKey}`
          },

          body:
            JSON.stringify({
              model,

              messages: [
                {
                  role: "system",

                  content:
                    "You are TOPFEROS MD AI. " +
                    "Answer accurately and naturally. " +
                    "If the user writes Haitian Creole, " +
                    "answer in Haitian Creole. " +
                    "If French, answer in French. " +
                    "If English, answer in English. " +
                    "Do not invent facts. " +
                    "Keep answers clear unless the user " +
                    "asks for detail."
                },

                {
                  role: "user",
                  content: question
                }
              ],

              temperature: 0.4,

              max_completion_tokens:
                1024
            })
        }
      );

    const raw =
      await response.text();

    let data;

    try {
      data =
        JSON.parse(raw);
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        `Groq HTTP ${response.status}: ` +
        `${data?.error?.message || raw.slice(0, 300)}`
      );
    }

    const answer =
      data
        ?.choices?.[0]
        ?.message
        ?.content
        ?.trim();

    if (!answer) {
      throw new Error(
        "No answer returned by Groq"
      );
    }

    await sock.sendMessage(
      chatId,
      {
        text:
          `🤖 *TOPFEROS MD AI*\n\n${answer}`
      },
      {
        quoted: message
      }
    );

  } catch (e) {

    console.error(
      "[AI]",
      e?.stack || e
    );

    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ AI pa disponib kounye a.\n\n" +
          "Verifye AI_API_KEY, AI_API_URL " +
          "ak AI_MODEL sou Render."
      },
      {
        quoted: message
      }
    );

  } finally {

    await sock
      .sendPresenceUpdate(
        "paused",
        chatId
      )
      .catch(() => {});
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