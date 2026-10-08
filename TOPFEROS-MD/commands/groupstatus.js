"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                GROUP STATUS COMMAND              ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

function normalizeJid(jid) {
  if (!jid) {
    return "";
  }

  return String(jid)
    .split(":")[0]
    .trim()
    .toLowerCase();
}

function isAdmin(metadata, jid) {
  const normalizedJid =
    normalizeJid(jid);

  const participant =
    metadata?.participants?.find(
      (item) =>
        normalizeJid(item?.id) ===
        normalizedJid
    );

  return (
    participant?.admin === "admin" ||
    participant?.admin === "superadmin"
  );
}

function getQuotedMessage(message) {
  return (
    message?.message?.extendedTextMessage
      ?.contextInfo?.quotedMessage ||
    null
  );
}

async function groupStatusCommand(ctx) {
  if (!ctx.isGroup) {
    await ctx.send(
      [
        "❌ GROUP COMMAND ONLY",
        "",
        "This command can only be used inside a WhatsApp group.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Command used outside a group."
    };
  }

  let metadata;

  try {
    metadata =
      await ctx.sock.groupMetadata(
        ctx.jid
      );
  } catch (error) {
    console.error(
      "[GSTATUS] Group metadata error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ GROUP INFO ERROR",
        "",
        "Unable to retrieve group information.",
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

  const sender =
    ctx.sender ||
    ctx.message?.key?.participant ||
    "";

  if (!isAdmin(metadata, sender)) {
    await ctx.send(
      [
        "❌ ADMIN ONLY",
        "",
        "Only group admins can publish a group status.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Sender is not a group admin."
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
        "❌ IMAGE OR VIDEO REQUIRED",
        "",
        "Reply to an image or video with:",
        `${ctx.prefix}gstatus`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "No quoted image or video found."
    };
  }

  const caption =
    ctx.text?.trim() ||
    "";

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

    const statusMessage =
      imageMessage
        ? {
            image: media,
            caption
          }
        : {
            video: media,
            caption
          };

    await ctx.sock.sendMessage(
      "status@broadcast",
      statusMessage
    );

    await ctx.send(
      [
        "✅ STATUS PUBLISHED",
        "",
        imageMessage
          ? "🖼️ Image published to WhatsApp Status."
          : "🎥 Video published to WhatsApp Status.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
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
      "[GSTATUS] Status publish error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ STATUS PUBLISH FAILED",
        "",
        "I could not publish the media to WhatsApp Status.",
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
  "gstatus",
  groupStatusCommand,
  {
    aliases: [
      "groupstatus"
    ],
    description:
      "Publish a replied image or video to WhatsApp Status.",
    usage:
      ".gstatus [caption]",
    category:
      "GROUP"
  }
);

module.exports = {
  groupStatusCommand
};