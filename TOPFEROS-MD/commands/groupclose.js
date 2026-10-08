"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                   CLOSE COMMAND                  ║
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

  if (!normalizedJid) {
    return false;
  }

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

async function closeCommand(ctx) {
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
      "[CLOSE] Group metadata error:",
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
        "Only group admins can use this command.",
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

  const botJid =
    ctx.sock?.user?.id ||
    "";

  if (!isAdmin(metadata, botJid)) {
    await ctx.send(
      [
        "❌ BOT MUST BE ADMIN",
        "",
        "I need to be a group admin to close this group.",
        "",
        "Promote the bot to admin and try again.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Bot is not a group admin."
    };
  }

  try {
    await ctx.sock.groupSettingUpdate(
      ctx.jid,
      "announcement"
    );
  } catch (error) {
    console.error(
      "[CLOSE] Group setting update error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ CLOSE FAILED",
        "",
        "I could not change the group settings.",
        "",
        "Make sure the bot is still a group admin.",
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

  await ctx.send(
    [
      "🔒 GROUP CLOSED",
      "",
      "Only group admins can now send messages.",
      "",
      "Use .open to allow all members to send messages again.",
      "",
      "🦁 TECH BY TOPFEROS MD 🐑"
    ].join("\n")
  );

  return {
    success: true,
    mode:
      "announcement"
  };
}

registerCommand(
  "close",
  closeCommand,
  {
    aliases: [],
    description:
      "Allow only group admins to send messages.",
    usage:
      ".close",
    category:
      "GROUP"
  }
);

module.exports = {
  closeCommand
};