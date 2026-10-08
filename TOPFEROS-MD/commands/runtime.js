"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                 RUNTIME COMMAND                  ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

function formatRuntime(seconds) {
  const days =
    Math.floor(seconds / 86400);

  const hours =
    Math.floor(
      (seconds % 86400) / 3600
    );

  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );

  const secs =
    Math.floor(seconds % 60);

  const parts = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(" ");
}

async function runtimeCommand(ctx) {
  try {
    const runtime =
      formatRuntime(
        process.uptime()
      );

    await ctx.sock.sendMessage(
      ctx.jid,
      {
        text:
          [
            "╭━━━〔 🦁 TOPFEROS MD 〕━━━╮",
            "",
            "          ⏱️ RUNTIME",
            "",
            `🕐 Running: ${runtime}`,
            "🤖 Bot: TOPFEROS MD",
            "📦 Version: V2.0.0",
            "🟢 Status: ONLINE",
            "",
            "╰━━━━━━━━━━━━━━━━━━━━━━╯",
            "",
            "🦁 TECH BY TOPFEROS MD 🐑"
          ].join("\n")
      },
      {
        quoted:
          ctx.message
      }
    );

    return {
      success: true,
      runtime
    };
  } catch (error) {
    console.error(
      "[RUNTIME] Error:",
      error?.stack ||
        error
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
  "runtime",
  runtimeCommand,
  {
    aliases: [
      "uptime"
    ],
    description:
      "Show how long the bot has been running.",
    usage:
      ".runtime",
    category:
      "UTILITY"
  }
);

module.exports = {
  runtimeCommand
};