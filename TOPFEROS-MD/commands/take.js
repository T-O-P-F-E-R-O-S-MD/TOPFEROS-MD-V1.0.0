"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                   TAKE COMMAND                   ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

function getQuotedMessage(message) {
  return (
    message?.message?.extendedTextMessage
      ?.contextInfo?.quotedMessage ||
    null
  );
}

function getText(message) {
  if (!message) {
    return "";
  }

  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    ""
  ).trim();
}

async function takeCommand(ctx) {
  const quoted =
    getQuotedMessage(
      ctx.message
    );

  const stickerMessage =
    quoted?.stickerMessage;

  if (!stickerMessage) {
    await ctx.send(
      [
        "❌ STICKER REQUIRED",
        "",
        "Reply to a sticker with:",
        `${ctx.prefix}take`,
        "",
        "You can also use:",
        `${ctx.prefix}take Pack Name | Author`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "No sticker found."
    };
  }

  let packName =
    "TOPFEROS MD";

  let author =
    "🦁 TECH BY TOPFEROS MD 🐑";

  const text =
    getText(
      ctx.message
    );

  if (text) {
    const parts =
      text
        .split("|")
        .map(
          (part) =>
            part.trim()
        )
        .filter(Boolean);

    if (parts[0]) {
      packName =
        parts[0];
    }

    if (parts[1]) {
      author =
        parts[1];
    }
  }

  try {
    const media =
      await ctx.sock.downloadMediaMessage(
        {
          key: {
            remoteJid:
              ctx.jid,
            fromMe:
              false,
            id:
              ctx.message?.key?.id ||
              ""
          },
          message: {
            stickerMessage
          }
        },
        "buffer",
        {},
        {
          logger:
            ctx.sock?.logger
        }
      );

    if (!media) {
      throw new Error(
        "Sticker download returned no data."
      );
    }

    await ctx.sock.sendMessage(
      ctx.jid,
      {
        sticker: media,
        packname:
          packName,
        author:
          author
      },
      {
        quoted:
          ctx.message
      }
    );

    return {
      success: true,
      packName,
      author
    };
  } catch (error) {
    console.error(
      "[TAKE] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ TAKE FAILED",
        "",
        "I could not recreate this sticker.",
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
  "take",
  takeCommand,
  {
    aliases: [
      "steal"
    ],
    description:
      "Recreate a replied sticker with a custom pack name and author.",
    usage:
      ".take [Pack Name | Author]",
    category:
      "MEDIA"
  }
);

module.exports = {
  takeCommand
};