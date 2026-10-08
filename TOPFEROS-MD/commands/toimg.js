"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                 TO IMAGE COMMAND                 ║
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

async function toImageCommand(ctx) {
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
        `${ctx.prefix}toimg`,
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
        image: media,
        caption:
          "🖼️ Sticker converted to image\n\n🦁 TECH BY TOPFEROS MD 🐑"
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
      "[TOIMG] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ TO IMAGE FAILED",
        "",
        "I could not convert this sticker to an image.",
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
  "toimg",
  toImageCommand,
  {
    aliases: [
      "toimage"
    ],
    description:
      "Convert a replied sticker into an image.",
    usage:
      ".toimg",
    category:
      "MEDIA"
  }
);

module.exports = {
  toImageCommand
};