"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                 HIDETAG COMMAND                  ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

/*
|--------------------------------------------------------------------------
| HIDETAG COMMAND
|--------------------------------------------------------------------------
*/

async function hideTagCommand(ctx) {
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
   * The message after .hidetag.
   */

  const text =
    ctx.text?.trim();

  if (!text) {
    await ctx.send(
      [
        "❌ MESSAGE REQUIRED",
        "",
        "Write a message after the command.",
        "",
        `Example: ${ctx.prefix}hidetag Hello everyone!`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "No message provided."
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
      "[HIDETAG] Group metadata error:",
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
   * Get all group participants.
   */

  const mentions =
    Array.isArray(
      metadata?.participants
    )
      ? metadata.participants
          .map(
            (participant) =>
              participant?.id
          )
          .filter(Boolean)
      : [];

  if (
    mentions.length === 0
  ) {
    await ctx.send(
      [
        "❌ NO MEMBERS FOUND",
        "",
        "No group members were found.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "No participants found."
    };
  }

  /*
   * Send the message with hidden mentions.
   */

  try {
    await ctx.sock.sendMessage(
      ctx.jid,
      {
        text,
        mentions
      },
      {
        quoted:
          ctx.message
      }
    );
  } catch (error) {
    console.error(
      "[HIDETAG] Send error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ HIDETAG FAILED",
        "",
        "I could not send the hidden group mention.",
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

  return {
    success: true,
    members:
      mentions.length
  };
}

/*
|--------------------------------------------------------------------------
| REGISTER COMMAND
|--------------------------------------------------------------------------
*/

registerCommand(
  "hidetag",
  hideTagCommand,
  {
    aliases: [
      "h",
      "notifyall"
    ],
    description:
      "Send a message while mentioning all group members without displaying the mentions.",
    usage:
      ".hidetag message",
    category:
      "GROUP"
  }
);

module.exports = {
  hideTagCommand
};