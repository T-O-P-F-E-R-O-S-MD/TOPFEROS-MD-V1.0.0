"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                    KICK COMMAND                   ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

/*
|--------------------------------------------------------------------------
| JID HELPERS
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

function numberToJid(number) {
  const cleanNumber =
    String(number || "")
      .replace(/[^\d]/g, "");

  if (!cleanNumber) {
    return null;
  }

  return `${cleanNumber}@s.whatsapp.net`;
}

/*
|--------------------------------------------------------------------------
| GET QUOTED MESSAGE
|--------------------------------------------------------------------------
*/

function getQuotedMessage(message) {
  const content =
    message?.message;

  if (!content) {
    return null;
  }

  const containers = [
    content.extendedTextMessage,
    content.imageMessage,
    content.videoMessage,
    content.documentMessage
  ];

  for (const container of containers) {
    const quoted =
      container?.contextInfo?.quotedMessage;

    if (quoted) {
      return {
        message: quoted,
        participant:
          container?.contextInfo?.participant ||
          null
      };
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| GET MENTIONED USERS
|--------------------------------------------------------------------------
*/

function getMentionedUsers(message) {
  const content =
    message?.message;

  if (!content) {
    return [];
  }

  const containers = [
    content.extendedTextMessage,
    content.imageMessage,
    content.videoMessage,
    content.documentMessage
  ];

  for (const container of containers) {
    const mentions =
      container?.contextInfo?.mentionedJid;

    if (Array.isArray(mentions)) {
      return mentions;
    }
  }

  return [];
}

/*
|--------------------------------------------------------------------------
| GET TARGET MEMBER
|--------------------------------------------------------------------------
*/

function getTarget(ctx) {
  /*
   * Priority 1:
   * Reply target.
   */

  const quoted =
    getQuotedMessage(
      ctx.message
    );

  if (quoted?.participant) {
    return normalizeJid(
      quoted.participant
    );
  }

  /*
   * Priority 2:
   * Mentioned user.
   */

  const mentioned =
    getMentionedUsers(
      ctx.message
    );

  if (mentioned.length) {
    return normalizeJid(
      mentioned[0]
    );
  }

  /*
   * Priority 3:
   * Phone number.
   */

  if (ctx.args?.length) {
    return numberToJid(
      ctx.args[0]
    );
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| CHECK BOT ADMIN
|--------------------------------------------------------------------------
*/

function isBotAdmin(
  metadata,
  botJid
) {
  const normalizedBot =
    normalizeJid(
      botJid
    );

  return Boolean(
    metadata?.participants?.some(
      (participant) =>
        normalizeJid(
          participant?.id
        ) === normalizedBot &&
        (
          participant?.admin === "admin" ||
          participant?.admin === "superadmin"
        )
    )
  );
}

/*
|--------------------------------------------------------------------------
| FIND PARTICIPANT
|--------------------------------------------------------------------------
*/

function findParticipant(
  metadata,
  targetJid
) {
  const normalizedTarget =
    normalizeJid(
      targetJid
    );

  return metadata?.participants?.find(
    (participant) =>
      normalizeJid(
        participant?.id
      ) === normalizedTarget
  );
}

/*
|--------------------------------------------------------------------------
| KICK COMMAND
|--------------------------------------------------------------------------
*/

async function kickCommand(ctx) {
  /*
   * This command works ONLY in groups.
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
      "[KICK] Group metadata error:",
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
   * Check bot admin status.
   */

  const botJid =
    ctx.sock?.user?.id ||
    "";

  if (
    !isBotAdmin(
      metadata,
      botJid
    )
  ) {
    await ctx.send(
      [
        "❌ BOT IS NOT ADMIN",
        "",
        "I need to be a group admin to remove members.",
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
   * Find target member.
   */

  const targetJid =
    getTarget(ctx);

  if (!targetJid) {
    await ctx.send(
      [
        "❌ MEMBER NOT FOUND",
        "",
        "Reply to a member's message, mention the member, or provide their phone number.",
        "",
        "Examples:",
        `• Reply + ${ctx.prefix}kick`,
        `• ${ctx.prefix}kick @member`,
        `• ${ctx.prefix}kick 509xxxxxxxx`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "No target member provided."
    };
  }

  /*
   * Verify target membership.
   */

  const target =
    findParticipant(
      metadata,
      targetJid
    );

  if (!target) {
    await ctx.send(
      [
        "❌ MEMBER NOT FOUND",
        "",
        "The selected user is not a member of this group.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Target is not a group member."
    };
  }

  /*
   * Protect group admins.
   */

  if (
    target.admin === "admin" ||
    target.admin === "superadmin"
  ) {
    await ctx.send(
      [
        "❌ ADMIN PROTECTED",
        "",
        "This command cannot remove a group admin.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Target is an admin."
    };
  }

  /*
   * Remove target member.
   */

  try {
    await ctx.sock.groupParticipantsUpdate(
      ctx.jid,
      [target.id],
      "remove"
    );
  } catch (error) {
    console.error(
      "[KICK] Remove member error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ KICK FAILED",
        "",
        "WhatsApp did not allow the member to be removed.",
        "",
        "Make sure the bot still has group admin permissions.",
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

  const targetNumber =
    normalizeJid(
      target.id
    ).replace(
      "@s.whatsapp.net",
      ""
    );

  await ctx.send(
    [
      "╭━━━〔 👢 KICK 〕━━━╮",
      "┃",
      "┃ ✅ Member removed successfully.",
      `┃ 👤 Member: ${targetNumber}`,
      "┃",
      "╰━━━━━━━━━━━━━━━━━━╯",
      "",
      "🦁 TECH BY TOPFEROS MD 🐑"
    ].join("\n")
  );

  return {
    success: true,
    target:
      target.id
  };
}

/*
|--------------------------------------------------------------------------
| REGISTER COMMAND
|--------------------------------------------------------------------------
*/

registerCommand(
  "kick",
  kickCommand,
  {
    aliases: [],

    description:
      "Remove a member from the current WhatsApp group.",

    usage:
      ".kick",

    category:
      "GROUP"
  }
);

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
  kickCommand
};