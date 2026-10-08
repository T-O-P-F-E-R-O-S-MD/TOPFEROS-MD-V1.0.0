"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                     ADD COMMAND                   ║
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
   * Priority 2:
   * Phone number argument.
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
| CHECK EXISTING MEMBER
|--------------------------------------------------------------------------
*/

function isGroupMember(
  metadata,
  targetJid
) {
  const normalizedTarget =
    normalizeJid(
      targetJid
    );

  return Boolean(
    metadata?.participants?.some(
      (participant) =>
        normalizeJid(
          participant?.id
        ) === normalizedTarget
    )
  );
}

/*
|--------------------------------------------------------------------------
| ADD COMMAND
|--------------------------------------------------------------------------
*/

async function addCommand(ctx) {
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
      "[ADD] Group metadata error:",
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
        "I need to be a group admin to add members.",
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
   * Find target.
   */

  const targetJid =
    getTarget(ctx);

  if (!targetJid) {
    await ctx.send(
      [
        "❌ MEMBER NOT FOUND",
        "",
        "Mention a user or provide their phone number.",
        "",
        "Examples:",
        `• ${ctx.prefix}add @member`,
        `• ${ctx.prefix}add 509xxxxxxxx`,
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
   * Check whether the user is already
   * a group member.
   */

  if (
    isGroupMember(
      metadata,
      targetJid
    )
  ) {
    await ctx.send(
      [
        "ℹ️ ALREADY IN GROUP",
        "",
        "This user is already a member of the group.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "User is already a group member."
    };
  }

  /*
   * Add target.
   */

  try {
    const result =
      await ctx.sock.groupParticipantsUpdate(
        ctx.jid,
        [targetJid],
        "add"
      );

    const update =
      Array.isArray(result)
        ? result[0]
        : result;

    const status =
      String(
        update?.status ||
        ""
      );

    /*
     * WhatsApp/Baileys can return a status
     * instead of throwing an error.
     */

    if (
      status &&
      status !== "200"
    ) {
      await ctx.send(
        [
          "❌ ADD FAILED",
          "",
          `WhatsApp returned status: ${status}`,
          "",
          "The user may have privacy restrictions.",
          "",
          "🦁 TECH BY TOPFEROS MD 🐑"
        ].join("\n")
      );

      return {
        success: false,
        status
      };
    }
  } catch (error) {
    console.error(
      "[ADD] Add member error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ ADD FAILED",
        "",
        "WhatsApp did not allow this user to be added.",
        "",
        "The user may have privacy restrictions or may not be eligible to join.",
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
      targetJid
    ).replace(
      "@s.whatsapp.net",
      ""
    );

  await ctx.send(
    [
      "╭━━━〔 ➕ ADD 〕━━━╮",
      "┃",
      "┃ ✅ Member added successfully.",
      `┃ 👤 Member: ${targetNumber}`,
      "┃",
      "╰━━━━━━━━━━━━━━━━━╯",
      "",
      "🦁 TECH BY TOPFEROS MD 🐑"
    ].join("\n")
  );

  return {
    success: true,
    target:
      targetJid
  };
}

/*
|--------------------------------------------------------------------------
| REGISTER COMMAND
|--------------------------------------------------------------------------
*/

registerCommand(
  "add",
  addCommand,
  {
    aliases: [],

    description:
      "Add a member to the current WhatsApp group.",

    usage:
      ".add @member",

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
  addCommand
};