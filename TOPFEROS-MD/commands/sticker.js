"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                  STICKER COMMAND                 ║
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

async function stickerCommand(ctx) {
  if (ctx.isGroup) {
    await ctx.send(
      [
        "❌ PRIVATE COMMAND ONLY",
        "",
        "This command can only be used in a private chat.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Command used inside a group."
    };
  }

  const quoted =
    getQuotedMessage(
      ctx.message
    );

  const imageMessage =
    quoted?.imageMessage;

  const videoMessage =
    quoted?.videoMessage;

  if (
    !imageMessage &&
    !videoMessage
  ) {
    await ctx.send(
      [
        "❌ MEDIA REQUIRED",
        "",
        "Reply to an image or a short video with:",
        `${ctx.prefix}sticker`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "No supported media found."
    };
  }

  if (
    videoMessage &&
    Number(
      videoMessage.seconds ||
        0
    ) > 10
  ) {
    await ctx.send(
      [
        "❌ VIDEO TOO LONG",
        "",
        "Please use a short video for the sticker.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Video is too long."
    };
  }

  try {
    const quotedMessage =
      imageMessage
        ? {
            imageMessage
          }
        : {
            videoMessage
          };

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
          message:
            quotedMessage
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
        "Media download returned no data."
      );
    }

    await ctx.sock.sendMessage(
      ctx.jid,
      {
        sticker: media
      },
      {
        quoted:
          ctx.message
      }
    );

    return {
      success: true,
      type:
        imageMessage
          ? "image"
          : "video"
    };
  } catch (error) {
    console.error(
      "[STICKER] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ STICKER FAILED",
        "",
        "I could not create the sticker from this media.",
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
  "sticker",
  stickerCommand,
  {
    aliases: [
      "s"
    ],
    description:
      "Convert a replied image or short video into a sticker in private chat.",
    usage:
      ".sticker",
    category:
      "PRIVATE"
  }
);

module.exports = {
  stickerCommand
};