"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                  OWNER COMMAND                   ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

const config = require("../config");

function formatNumber(number) {
  if (!number) {
    return "Not configured";
  }

  return String(number)
    .replace(/@s\.whatsapp\.net$/i, "")
    .trim();
}

function formatDate(date) {
  if (!date) {
    return "Not available";
  }

  const value =
    new Date(date);

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return "Not available";
  }

  return value.toLocaleDateString(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}

async function ownerCommand(ctx) {
  try {
    const ownerName =
      config.ownerName ||
      "TOPFEROS MD";

    const ownerNumber =
      formatNumber(
        config.ownerNumber
      );

    const stats =
      ctx.bot?.ownerStats ||
      {};

    const firstUsedAt =
      stats.firstUsedAt ||
      config.botCreatedAt ||
      null;

    const totalCommands =
      Number(
        stats.totalCommands ||
          0
      );

    const todayCommands =
      Number(
        stats.todayCommands ||
          0
      );

    const mostUsedCommand =
      stats.mostUsedCommand ||
      "No data yet";

    const message = [
      "╭━━━〔 🦁 TOPFEROS MD 〕━━━╮",
      "",
      "             👑 OWNER",
      "",
      `👤 Name       : ${ownerName}`,
      `📱 Number     : ${ownerNumber}`,
      "🤖 Bot        : TOPFEROS MD",
      "📦 Version    : V2.0.0",
      "🟢 Status     : ONLINE",
      "",
      "╭━━〔 📊 OWNER ACTIVITY 〕━━╮",
      "",
      `📅 Using Bot  : Since ${formatDate(firstUsedAt)}`,
      `⚡ Commands   : ${totalCommands}`,
      `🏆 Most Used  : ${mostUsedCommand}`,
      `📈 Today      : ${todayCommands} commands`,
      "",
      "╰━━━━━━━━━━━━━━━━━━━━━━━━━╯",
      "",
      "🦁 TECH BY TOPFEROS MD 🐑",
      "",
      "🌐 Web Connect",
      "└──➤ TRUE",
      "",
      "🌐 Web Channel",
      "└──➤ https://whatsapp.com/channel/0029Vb98522IXnlxdL8Sxj2m"
    ].join("\n");

    await ctx.sock.sendMessage(
      ctx.jid,
      {
        text: message
      },
      {
        quoted: ctx.message
      }
    );

    return {
      success: true
    };
  } catch (error) {
    console.error(
      "[OWNER] Error:",
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
  "owner",
  ownerCommand,
  {
    aliases: [
      "creator"
    ],
    description:
      "Show owner information and activity statistics.",
    usage:
      ".owner",
    category:
      "INFO"
  }
);

module.exports = {
  ownerCommand
};