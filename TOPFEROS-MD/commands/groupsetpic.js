"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                SET GROUP PHOTO COMMAND             ║
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

async function setGroupPicCommand(ctx) {
  if (!ctx.isGroup) {
    await ctx.send(
      "❌ This command can only be used inside a group."
    );
    return;
  }

  let metadata;

  try {
    metadata =
      await ctx.sock.groupMetadata(
        ctx.jid
      );
  } catch {
    await ctx.send(
      "❌ Unable to retrieve group information."
    );
    return;
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
        "Only group admins can change the group photo.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );
    return;
  }

  const botJid =
    ctx.sock?.user?.id ||
    "";

  if (!isAdmin(metadata, botJid)) {
    await ctx.send(
      [
        "❌ BOT MUST BE ADMIN",
        "",
        "The bot must be a group admin to change the group photo.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );
    return;
  }

  const quoted =
    getQuotedMessage(
      ctx.message
    );

  const imageMessage =
    quoted?.imageMessage;

  if (!imageMessage) {
    await ctx.send(
      [
        "❌ IMAGE REQUIRED",
        "",
        "Reply to a group photo or any image with:",
        `${ctx.prefix}setpic`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );
    return;
  }

  try {
    const buffer =
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
          message: quoted
        },
        "buffer",
        {},
        {
          logger:
            ctx.sock?.logger
        }
      );

    if (!buffer) {
      throw new Error(
        "Image download returned no data."
      );
    }

    await ctx.sock.updateProfilePicture(
      ctx.jid,
      buffer
    );

    await ctx.send(
      [
        "✅ GROUP PHOTO UPDATED",
        "",
        "The group profile photo has been changed successfully.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );
  } catch (error) {
    console.error(
      "[SETPIC] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ PHOTO UPDATE FAILED",
        "",
        "I could not change the group profile photo.",
        "",
        "Make sure the image is valid and the bot is still a group admin.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );
  }
}

registerCommand(
  "setpic",
  setGroupPicCommand,
  {
    aliases: [
      "grouppic",
      "setphoto"
    ],
    description:
      "Change the current group profile photo by replying to an image.",
    usage:
      ".setpic",
    category:
      "GROUP"
  }
);

module.exports = {
  setGroupPicCommand
};