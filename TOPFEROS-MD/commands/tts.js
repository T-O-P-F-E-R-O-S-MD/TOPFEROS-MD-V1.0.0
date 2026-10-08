"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                    TTS COMMAND                   ║
// ╚════════════════════════════════════════════════════╝

const axios = require("axios");

const {
  registerCommand
} = require("../src/messageHandler");

async function ttsCommand(ctx) {
  const text =
    String(ctx.text || "").trim();

  if (!text) {
    await ctx.send(
      [
        "❌ TEXT REQUIRED",
        "",
        "Use:",
        `${ctx.prefix}tts Your text here`,
        "",
        "Example:",
        `${ctx.prefix}tts Hello, welcome to TOPFEROS MD`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "No text provided."
    };
  }

  try {
    const url =
      "https://translate.google.com/translate_tts";

    const response =
      await axios.get(
        url,
        {
          params: {
            ie: "UTF-8",
            q: text,
            tl: "en",
            client: "tw-ob"
          },
          responseType:
            "arraybuffer",
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          },
          timeout: 15000
        }
      );

    const audio =
      Buffer.from(
        response.data
      );

    if (!audio.length) {
      throw new Error(
        "TTS returned empty audio."
      );
    }

    await ctx.sock.sendMessage(
      ctx.jid,
      {
        audio,
        mimetype:
          "audio/mpeg",
        ptt: true
      },
      {
        quoted:
          ctx.message
      }
    );

    return {
      success: true
    };
  } catch (error) {
    console.error(
      "[TTS] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ TTS FAILED",
        "",
        "I could not generate the voice message.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      error:
        error?.message ||
        String(error)
    };
  }
}

registerCommand(
  "tts",
  ttsCommand,
  {
    aliases: [
      "say"
    ],
    description:
      "Convert text into a voice message.",
    usage:
      ".tts <text>",
    category:
      "MEDIA"
  }
);

module.exports = {
  ttsCommand
};