"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                  UNMUTE COMMAND                  ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

/*
|--------------------------------------------------------------------------
| UNMUTE COMMAND
|--------------------------------------------------------------------------
*/

async function unmuteCommand(ctx) {
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
      "[UNMUTE] Group metadata error:",
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
        "I need to be a group admin to unmute the group.",
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
   * not_announcement = everyone can send messages.
   */

  try {
    await ctx.sock.groupSettingUpdate(
      ctx.jid,
      "not_announcement"
    );
  } catch (error) {
    console.error(
      "[UNMUTE] Group setting update error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ UNMUTE FAILED",
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
      "╭━━━〔 🔊 UNMUTE 〕━━━╮",
      "┃",
      "┃ ✅ Group unmuted successfully.",
      "┃",
      "┃ 👥 All members can send",
      "┃    messages again.",
      "┃",
      "╰━━━━━━━━━━━━━━━━━━━━╯",
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
  "unmute",
  unmuteCommand,
  {
    aliases: [],
    description:
      "Allow all group members to send messages.",
    usage:
      ".unmute",
    category:
      "GROUP"
  }
);

module.exports = {
  unmuteCommand
};