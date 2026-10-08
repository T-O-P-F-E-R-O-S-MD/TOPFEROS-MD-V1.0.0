"use strict";

/*
|--------------------------------------------------------------------------
| TOPFEROS MD V2.0.0
| GEMINI AI COMMAND
|--------------------------------------------------------------------------
|
| Gemini API Free Tier
| Google Search grounding
|
|--------------------------------------------------------------------------
*/

const {
  GoogleGenAI
} = require("@google/genai");

/*
|--------------------------------------------------------------------------
| GEMINI CLIENT
|--------------------------------------------------------------------------
*/

const apiKey =
  process.env.GEMINI_API_KEY || "";

const ai =
  apiKey
    ? new GoogleGenAI({
        apiKey
      })
    : null;

/*
|--------------------------------------------------------------------------
| AI COMMAND
|--------------------------------------------------------------------------
*/

async function aiCommand(ctx) {
  if (!ctx.text) {
    await ctx.send(
      [
        "🤖 Please provide a question.",
        "",
        `Example: ${ctx.prefix}ai What is artificial intelligence?`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false
    };
  }

  if (!ai) {
    await ctx.send(
      [
        "🤖 TOPFEROS MD AI",
        "",
        "❌ Gemini API key is not configured.",
        "",
        "⚙️ Add GEMINI_API_KEY to your environment variables.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "GEMINI_API_KEY is missing."
    };
  }

  try {
    const response =
      await ai.models.generateContent({
        model:
          process.env.GEMINI_MODEL ||
          "gemini-3.8-flash",

        contents:
          ctx.text,

        config: {
          systemInstruction:
            [
              "You are the official AI assistant for TOPFEROS MD.",
              "Give accurate, useful, and clear answers.",
              "Use Google Search when the question requires current or changing information.",
              "Do not invent facts.",
              "If information is uncertain, clearly say so.",
              "Answer in the same language used by the user whenever possible.",
              "Keep answers suitable for a general audience."
            ].join(" "),

          tools: [
            {
              googleSearch: {}
            }
          ]
        }
      });

    const answer =
      String(
        response?.text ||
          ""
      ).trim();

    if (!answer) {
      await ctx.send(
        [
          "🤖 TOPFEROS MD AI",
          "",
          "❌ I could not generate an answer.",
          "",
          "🦁 TECH BY TOPFEROS MD 🐑"
        ].join("\n")
      );

      return {
        success: false,
        reason:
          "Empty Gemini response."
      };
    }

    await ctx.send(
      [
        "🤖 TOPFEROS MD AI",
        "",
        answer,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: true,
      answer
    };
  } catch (error) {
    console.error(
      "[GEMINI AI] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "🤖 TOPFEROS MD AI",
        "",
        "❌ The AI request failed.",
        "",
        "Please try again later.",
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

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  aiCommand
};