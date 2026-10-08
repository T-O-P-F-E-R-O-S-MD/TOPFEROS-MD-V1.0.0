"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                TRANSLATE COMMAND                 ║
// ╚════════════════════════════════════════════════════╝

const axios = require("axios");

const {
  registerCommand
} = require("../src/messageHandler");

async function translateCommand(ctx) {
  const text =
    String(ctx.text || "").trim();

  if (!text) {
    await ctx.send(
      [
        "❌ TEXT REQUIRED",
        "",
        "Use:",
        `${ctx.prefix}translate <language> <text>`,
        "",
        "Example:",
        `${ctx.prefix}translate fr Hello everyone`,
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

  const parts =
    text.split(/\s+/);

  const targetLanguage =
    String(
      parts.shift() || ""
    )
      .trim()
      .toLowerCase();

  const sourceText =
    parts.join(" ").trim();

  if (
    !targetLanguage ||
    !sourceText
  ) {
    await ctx.send(
      [
        "❌ INVALID FORMAT",
        "",
        "Use:",
        `${ctx.prefix}translate <language> <text>`,
        "",
        "Example:",
        `${ctx.prefix}translate fr Hello everyone`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Missing language or text."
    };
  }

  try {
    const response =
      await axios.get(
        "https://translate.googleapis.com/translate_a/single",
        {
          params: {
            client: "gtx",
            sl: "auto",
            tl: targetLanguage,
            dt: "t",
            q: sourceText
          },
          timeout: 15000
        }
      );

    const data =
      response.data;

    const translatedText =
      Array.isArray(data?.[0])
        ? data[0]
            .map(
              (item) =>
                item?.[0] || ""
            )
            .join("")
            .trim()
        : "";

    if (!translatedText) {
      throw new Error(
        "Translation returned empty text."
      );
    }

    const detectedLanguage =
      data?.[2] ||
      "auto";

    await ctx.send(
      [
        "🌐 TRANSLATION",
        "",
        `From: ${detectedLanguage}`,
        `To: ${targetLanguage}`,
        "",
        translatedText,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: true,
      from:
        detectedLanguage,
      to:
        targetLanguage,
      translation:
        translatedText
    };
  } catch (error) {
    console.error(
      "[TRANSLATE] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ TRANSLATION FAILED",
        "",
        "I could not translate this text.",
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
  "translate",
  translateCommand,
  {
    aliases: [
      "tr"
    ],
    description:
      "Translate text into another language.",
    usage:
      ".translate <language> <text>",
    category:
      "UTILITY"
  }
);

module.exports = {
  translateCommand
};