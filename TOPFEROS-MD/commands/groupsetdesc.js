"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║              SET GROUP DESCRIPTION COMMAND        ║
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

async function setGroupDescriptionCommand(ctx) {
  if (!ctx.isGroup) {
    await ctx.send(
      "❌ This command can only be used inside a group."
    );
    return;
  }

  const description =
    ctx.text?.trim();

  if (!description) {
    await ctx.send(
      [
        "❌ DESCRIPTION REQUIRED",
        "",
        `Example: ${ctx.prefix}setdesc Welcome to TOPFEROS FAMILY`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
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
        "Only group admins can change the group description.",
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
        "The bot must be a group admin to change the group description.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );
    return;
  }

  try {
    await ctx.sock.groupUpdateDescription(
      ctx.jid,
      description
    );

    await ctx.send(
      [
        "✅ GROUP DESCRIPTION UPDATED",
        "",
        `📝 ${description}`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );
  } catch (error) {
    console.error(
      "[SETDESC] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ DESCRIPTION UPDATE FAILED",
        "",
        "I could not change the group description.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );
  }
}

registerCommand(
  "setdesc",
  setGroupDescriptionCommand,
  {
    aliases: [
      "groupdesc",
      "setbio"
    ],
    description:
      "Change the current group description.",
    usage:
      ".setdesc Group description",
    category:
      "GROUP"
  }
);

module.exports = {
  setGroupDescriptionCommand
};