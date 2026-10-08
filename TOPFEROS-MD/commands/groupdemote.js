"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                  DEMOTE COMMAND                  ║
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
| GET TARGET
|--------------------------------------------------------------------------
*/

function getTarget(ctx) {
  const mentioned =
    getMentionedUsers(
      ctx.message
    );

  if (mentioned.length) {
    return normalizeJid(
      mentioned[0]
    );
  }

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
| DEMOTE COMMAND
|--------------------------------------------------------------------------
*/

async function demoteCommand(ctx) {
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
      "[DEMOTE] Group metadata error:",
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
        "I need to be a group admin to remove admin permissions.",
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

  const targetJid =
    getTarget(ctx);

  if (!targetJid) {
    await ctx.send(
      [
        "❌ MEMBER NOT FOUND",
        "",
        "Mention an admin or provide their phone number.",
        "",
        "Examples:",
        `• ${ctx.prefix}demote @admin`,
        `• ${ctx.prefix}demote 509xxxxxxxx`,
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
        "This user is not a member of the group.",
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

  if (
    target.admin !== "admin" &&
    target.admin !== "superadmin"
  ) {
    await ctx.send(
      [
        "ℹ️ NOT AN ADMIN",
        "",
        "This member does not have admin permissions.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Target is not an admin."
    };
  }

  /*
   * Protect the group owner/superadmin.
   */

  if (
    target.admin === "superadmin"
  ) {
    await ctx.send(
      [
        "❌ OWNER PROTECTED",
        "",
        "The group owner cannot be demoted by this command.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Target is the group owner."
    };
  }

  try {
    await ctx.sock.groupParticipantsUpdate(
      ctx.jid,
      [target.id],
      "demote"
    );
  } catch (error) {
    console.error(
      "[DEMOTE] Demote member error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ DEMOTE FAILED",
        "",
        "WhatsApp did not allow this member to be demoted.",
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

  const targetNumber =
    normalizeJid(
      target.id
    ).replace(
      "@s.whatsapp.net",
      ""
    );

  await ctx.send(
    [
      "╭━━━〔 ⬇️ DEMOTE 〕━━━╮",
      "┃",
      "┃ ✅ Admin permissions removed.",
      `┃ 👤 Member: ${targetNumber}`,
      "┃",
      "╰━━━━━━━━━━━━━━━━━━━━╯",
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
  "demote",
  demoteCommand,
  {
    aliases: [],
    description:
      "Remove admin permissions from a group member.",
    usage:
      ".demote @admin",
    category:
      "GROUP"
  }
);

module.exports = {
  demoteCommand
};