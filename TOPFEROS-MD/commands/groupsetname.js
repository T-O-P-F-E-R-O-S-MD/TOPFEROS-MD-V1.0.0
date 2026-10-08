"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                SET GROUP NAME COMMAND             ║
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

async function setGroupNameCommand(ctx) {
  if (!ctx.isGroup) {
    await ctx.send(
      "❌ This command can only be used inside a group."
    );
    return;
  }

  const newName =
    ctx.text?.trim();

  if (!newName) {
    await ctx.send(
      [
        "❌ GROUP NAME REQUIRED",
        "",
        `Example: ${ctx.prefix}setname TOPFEROS FAMILY`,
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
  } catch (error) {
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
        "Only group admins can change the group name.",
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
        "The bot must be a group admin to change the group name.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );
    return;
  }

  try {
    await ctx.sock.groupUpdateSubject(
      ctx.jid,
      newName
    );

    await ctx.send(
      [
        "✅ GROUP NAME UPDATED",
        "",
        `🏷️ New name: ${newName}`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );
  } catch (error) {
    console.error(
      "[SETNAME] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ NAME UPDATE FAILED",
        "",
        "I could not change the group name.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );
  }
}

registerCommand(
  "setname",
  setGroupNameCommand,
  {
    aliases: [
      "groupname"
    ],
    description:
      "Change the current group name.",
    usage:
      ".setname New Group Name",
    category:
      "GROUP"
  }
);

module.exports = {
  setGroupNameCommand
};