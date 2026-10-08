"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                   MUTE COMMAND                   ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

/*
|--------------------------------------------------------------------------
| MUTE COMMAND
|--------------------------------------------------------------------------
*/

async function muteCommand(ctx) {
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
   * Get current group metadata.
   */

  let metadata;

  try {
    metadata =
      await ctx.sock.groupMetadata(
        ctx.jid
      );
  } catch (error) {
    console.error(
      "[MUTE] Group metadata error:",
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
   * Check whether the bot is an admin.
   */

  const botJid =
    String(
      ctx.sock?.user?.id ||
      ""
    )
      .trim()
      .replace(
        /:\d+(?=@)/,
        ""
      );

  const botParticipant =
    metadata?.participants?.find(
      (participant) =>
        String(
          participant?.id ||
          ""
        )
          .trim()
          .replace(
            /:\d+(?=@)/,
            ""
          ) === botJid
    );

  const botIsAdmin =
    botParticipant?.admin ===
      "admin" ||
    botParticipant?.admin ===
      "superadmin";

  if (!botIsAdmin) {
    await ctx.send(
      [
        "❌ BOT IS NOT ADMIN",
        "",
        "I need to be a group admin to mute the group.",
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
   * Change group setting:
   * announcement = true
   *
   * This makes the group admins-only
   * for sending messages.
   */

  try {
    await ctx.sock.groupSettingUpdate(
      ctx.jid,
      "announcement"
    );
  } catch (error) {
    console.error(
      "[MUTE] Group setting update error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ MUTE FAILED",
        "",
        "WhatsApp did not allow the group setting to be changed.",
        "",
        "Make sure the bot has admin permissions.",
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
      "╭━━━〔 🔇 MUTE 〕━━━╮",
      "┃",
      "┃ ✅ Group muted successfully.",
      "┃",
      "┃ 👑 Only admins can send",
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
      "admins-only"
  };
}

/*
|--------------------------------------------------------------------------
| REGISTER COMMAND
|--------------------------------------------------------------------------
*/

registerCommand(
  "mute",
  muteCommand,
  {
    aliases: [],
    description:
      "Restrict the group so only admins can send messages.",
    usage:
      ".mute",
    category:
      "GROUP"
  }
);

module.exports = {
  muteCommand
};