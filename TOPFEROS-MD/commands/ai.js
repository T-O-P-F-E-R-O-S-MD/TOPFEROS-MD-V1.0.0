"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                    AI COMMAND                    ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

const {
  askAI,
  isAIConfigured
} = require("../services/ai");

/*
|--------------------------------------------------------------------------
| AI QUESTION COMMAND
|--------------------------------------------------------------------------
*/

async function aiCommand(ctx) {
  try {
    /*
    |--------------------------------------------------------------------------
    | CHECK AI CONFIGURATION
    |--------------------------------------------------------------------------
    */

    if (!isAIConfigured()) {
      await ctx.send(
        [
          "❌ AI NOT CONFIGURED",
          "",
          "The AI service is not configured yet.",
          "",
          "Please check:",
          "• AI_API_URL",
          "• AI_API_KEY",
          "• AI_MODEL",
          "",
          "🦁 TECH BY TOPFEROS MD 🐑"
        ].join("\n")
      );

      return {
        success: false,
        reason:
          "AI is not configured."
      };
    }

    /*
    |--------------------------------------------------------------------------
    | GET QUESTION
    |--------------------------------------------------------------------------
    */

    const question =
      String(
        ctx.text || ""
      ).trim();

    if (!question) {
      await ctx.send(
        [
          "╭━━━〔 🤖 AI QUESTION 〕━━━╮",
          "",
          "Ask me anything.",
          "",
          "Example:",
          "`.ai What is artificial intelligence?`",
          "",
          "Alias:",
          "`.ask Your question`",
          "",
          "╰━━━━━━━━━━━━━━━━━━━━━━╯",
          "",
          "🦁 TECH BY TOPFEROS MD 🐑"
        ].join("\n")
      );

      return {
        success: false,
        reason:
          "No question provided."
      };
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW PROCESSING REACTION
    |--------------------------------------------------------------------------
    */

    try {
      await ctx.react("🤔");
    } catch {
      // Ignore reaction errors.
    }

    /*
    |--------------------------------------------------------------------------
    | ASK AI
    |--------------------------------------------------------------------------
    */

    const answer =
      await askAI(
        question
      );

    /*
    |--------------------------------------------------------------------------
    | SEND ANSWER
    |--------------------------------------------------------------------------
    */

    const message = [
      "╭━━━〔 🤖 TOPFEROS AI 〕━━━╮",
      "",
      `❓ ${question}`,
      "",
      "💬 Answer:",
      "",
      answer,
      "",
      "╰━━━━━━━━━━━━━━━━━━━━━━╯",
      "",
      "🦁 TECH BY TOPFEROS MD 🐑",
      "",
      "🌐 *Web Connect*",
      "└──➤TRUE",
      "🌐 *Web Channel*",
      "└──➤https://whatsapp.com/channel/0029Vb98522IXnlxdL8Sxj2m"
    ].join("\n");

    await ctx.send(
      message
    );

    try {
      await ctx.react("✅");
    } catch {
      // Ignore reaction errors.
    }

    return {
      success: true
    };
  } catch (error) {
    console.error(
      "[AI] Error:",
      error?.stack ||
        error
    );

    try {
      await ctx.react("❌");
    } catch {
      // Ignore reaction errors.
    }

    await ctx.send(
      [
        "❌ AI ERROR",
        "",
        "I could not process your question right now.",
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
| REGISTER COMMAND
|--------------------------------------------------------------------------
*/

registerCommand(
  "ai",
  aiCommand,
  {
    aliases: [
      "ask"
    ],

    description:
      "Ask the TOPFEROS MD AI a question.",

    usage:
      ".ai <question>",

    category:
      "AI"
  }
);

module.exports = {
  aiCommand
};