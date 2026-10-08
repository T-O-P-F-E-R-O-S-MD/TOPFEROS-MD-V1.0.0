"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                    OPEN COMMAND                   ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

/*
|--------------------------------------------------------------------------
| NORMALIZE JID
|--------------------------------------------------------------------------
*/

function normalizeJid(jid) {
  if (!jid) {
    return "";
  }

  return String(jid)
    .trim()
    .replace(/:\d+(?=@)/, "");
}

/*
|--------------------------------------------------------------------------
| CHECK ADMIN
|--------------------------------------------------------------------------
*/

function isAdmin(
  metadata,
  jid
) {
  const normalizedJid =
    normalizeJid(jid);

  const participant =
    metadata?.participants?.find(
      (item) =>
        normalizeJid(
          item?.id
        ) === normalizedJid
    );

  return (
    participant?.admin ===
      "admin" ||
    participant?.admin ===
      "superadmin"
  );
}

/*
|--------------------------------------------------------------------------
| OPEN COMMAND
|--------------------------------------------------------------------------
*/

async function openCommand(ctx) {
  /*
   * Group only.
   */

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

  /*
   * Get group metadata.
   */

  let metadata;

  try {
    metadata =
      await ctx.sock.groupMetadata(
        ctx.jid
      );
  } catch (error) {
    console.error(
      "[OPEN] Group metadata error:",
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

  /*
   * Check command sender.
   */

  const sender =
    ctx.sender ||
    ctx.message?.key?.participant ||
    "";

  if (
    !isAdmin(
      metadata,
      sender
    )
  ) {
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

  /*
   * Check bot admin status.
   */

  const botJid =
    ctx.sock?.user?.id ||
    "";

  if (
    !isAdmin(
      metadata,
      botJid
    )
  ) {
    await ctx.send(
      [
        "❌ BOT IS NOT ADMIN",
        "",
        "I need to be a group admin to open the group.",
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

  /*
   * Allow all participants to send messages.
   */

  try {
    await ctx.sock.groupSettingUpdate(
      ctx.jid,
      "not_announcement"
    );
  } catch (error) {
    console.error(
      "[OPEN] Group setting update error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ OPEN FAILED",
        "",
        "WhatsApp did not allow the group setting to be changed.",
        "",
        "Make sure the bot still has admin permissions.",
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

  /*
   * Success response.
   */

  await ctx.send(
    [
      "╭━━━〔 🔓 OPEN 〕━━━╮",
      "┃",
      "┃ ✅ Group opened successfully.",
      "┃",
      "┃ 👥 All members can send",
      "┃    messages now.",
      "┃",
      "╰━━━━━━━━━━━━━━━━━━╯",
      "",
      "🦁 TECH BY TOPFEROS MD 🐑"
    ].join("\n")
  );

  return {
    success: true,
    mode:
      "all-members"
  };
}

/*
|--------------------------------------------------------------------------
| REGISTER COMMAND
|--------------------------------------------------------------------------
*/

registerCommand(
  "open",
  openCommand,
  {
    aliases: [],
    description:
      "Allow all group members to send messages.",
    usage:
      ".open",
    category:
      "GROUP"
  }
);

module.exports = {
  openCommand
};