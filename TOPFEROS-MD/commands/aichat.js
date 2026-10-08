"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                  AI CHAT COMMAND                 ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

const {
  startAIChat,
  setLastAIMessage
} = require("../services/aiChat");

/*
|--------------------------------------------------------------------------
| AI CHAT COMMAND
|--------------------------------------------------------------------------
|
| Usage:
|
| .ai chat Hello
|
| This starts a new AI Chat session for the current chat.
|
| Important:
| - "chat" is the keyword separating AI Question from AI Chat.
| - Every .ai chat command creates a NEW session.
| - There is NO OFF command.
| - After the first response, continuation is handled by
|   the AI Chat message handler when the user replies to/forwards
|   the latest AI response.
|
|--------------------------------------------------------------------------
*/

async function aiChatCommand(ctx) {
  try {
    /*
    |--------------------------------------------------------------------------
    | VALIDATE MESSAGE
    |--------------------------------------------------------------------------
    */

    const rawText =
      String(
        ctx.text || ""
      ).trim();

    /*
    |--------------------------------------------------------------------------
    | REMOVE THE CHAT KEYWORD
    |--------------------------------------------------------------------------
    */

    const match =
      rawText.match(
        /^chat(?:\s+([\s\S]+))?$/i
      );

    if (!match) {
      await ctx.send(
        [
          "╭━━━〔 💬 AI CHAT 〕━━━╮",
          "",
          "Start an AI Chat session with:",
          "",
          "`.ai chat Bonjour`",
          "",
          "The word `chat` is the keyword",
          "that starts AI Chat mode.",
          "",
          "After TOPFEROS MD replies,",
          "reply to or forward the latest AI",
          "response to continue the conversation.",
          "",
          "🦁 TECH BY TOPFEROS MD 🐑"
        ].join("\n")
      );

      return {
        success: false,
        reason:
          "AI Chat keyword or message missing."
      };
    }

    const firstMessage =
      String(
        match[1] || ""
      ).trim();

    /*
    |--------------------------------------------------------------------------
    | REQUIRE FIRST MESSAGE
    |--------------------------------------------------------------------------
    */

    if (!firstMessage) {
      await ctx.send(
        [
          "╭━━━〔 💬 AI CHAT 〕━━━╮",
          "",
          "Please include your first message.",
          "",
          "Example:",
          "`.ai chat Bonjour`",
          "",
          "🦁 TECH BY TOPFEROS MD 🐑"
        ].join("\n")
      );

      return {
        success: false,
        reason:
          "First AI Chat message is empty."
      };
    }

    /*
    |--------------------------------------------------------------------------
    | START NEW AI SESSION
    |--------------------------------------------------------------------------
    */

    try {
      await ctx.react("🤔");
    } catch {
      // Ignore reaction errors.
    }

    const result =
      await startAIChat(
        ctx.jid,
        firstMessage
      );

    /*
    |--------------------------------------------------------------------------
    | SEND AI RESPONSE
    |--------------------------------------------------------------------------
    */

    const message = [
      "╭━━━〔 🤖 TOPFEROS AI CHAT 〕━━━╮",
      "",
      result.answer,
      "",
      "╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯",
      "",
      "🦁 TECH BY TOPFEROS MD 🐑",
      "",
      "🌐 *Web Connect*",
      "└──➤TRUE",
      "🌐 *Web Channel*",
      "└──➤https://whatsapp.com/channel/0029Vb98522IXnlxdL8Sxj2m"
    ].join("\n");

    const sentMessage =
      await ctx.sock.sendMessage(
        ctx.jid,
        {
          text: message
        },
        {
          quoted:
            ctx.message
        }
      );

    /*
    |--------------------------------------------------------------------------
    | SAVE THE LATEST AI MESSAGE ID
    |--------------------------------------------------------------------------
    |
    | The message handler will later use this ID to determine
    | whether a new user message is replying to/forwarding
    | the latest AI response.
    |
    |--------------------------------------------------------------------------
    */

    const messageId =
      sentMessage?.key?.id ||
      null;

    setLastAIMessage(
      ctx.jid,
      messageId,
      message
    );

    try {
      await ctx.react("✅");
    } catch {
      // Ignore reaction errors.
    }

    return {
      success: true,

      sessionStarted:
        true,

      messageId
    };
  } catch (error) {
    console.error(
      "[AI CHAT] Error:",
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
        "❌ AI CHAT ERROR",
        "",
        "I could not start the AI Chat session.",
        "",
        "Please try again.",
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
  "aichat",
  aiChatCommand,
  {
    aliases: [
      "chat"
    ],

    description:
      "Start a continuous AI Chat conversation.",

    usage:
      ".ai chat <message>",

    category:
      "AI"
  }
);

module.exports = {
  aiChatCommand
};