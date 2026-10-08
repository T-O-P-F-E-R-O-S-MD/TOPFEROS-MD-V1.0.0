"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                   REMOVE COMMAND                  ║
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
| GET GROUP OWNER
|--------------------------------------------------------------------------
*/

function getGroupOwner(metadata) {
  return normalizeJid(
    metadata?.owner ||
    metadata?.subjectOwner ||
    ""
  );
}

/*
|--------------------------------------------------------------------------
| REMOVE COMMAND
|--------------------------------------------------------------------------
*/

async function removeCommand(ctx) {
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
      "[REMOVE] Group metadata error:",
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
    normalizeJid(
      ctx.sock?.user?.id ||
      ""
    );

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
   * Identify the group owner.
   */

  const groupOwner =
    getGroupOwner(
      metadata
    );

  /*
   * Build the removal list.
   *
   * Protect:
   * - Group owner
   * - Bot itself
   * - All admins
   */

  const removableMembers =
    Array.isArray(
      metadata?.participants
    )
      ? metadata.participants.filter(
          (participant) => {
            const participantJid =
              normalizeJid(
                participant?.id
              );

            const isOwner =
              Boolean(
                groupOwner &&
                participantJid ===
                  groupOwner
              );

            const isBot =
              Boolean(
                botJid &&
                participantJid ===
                  botJid
              );

            const isAdmin =
              participant?.admin ===
                "admin" ||
              participant?.admin ===
                "superadmin";

            return (
              participantJid &&
              !isOwner &&
              !isBot &&
              !isAdmin
            );
          }
        )
      : [];

  /*
   * Nothing to remove.
   */

  if (
    removableMembers.length === 0
  ) {
    await ctx.send(
      [
        "ℹ️ NOTHING TO REMOVE",
        "",
        "There are no removable members in this group.",
        "",
        "The group owner and administrators were protected.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: true,
      removed: 0,
      failed: 0,
      protected:
        metadata?.participants?.length ||
        0
    };
  }

  /*
   * Remove members one by one.
   *
   * Doing this sequentially is safer than sending
   * a very large request at once.
   */

  let removed = 0;
  let failed = 0;

  for (
    const participant of
      removableMembers
  ) {
    const participantJid =
      normalizeJid(
        participant?.id
      );

    if (!participantJid) {
      failed++;
      continue;
    }

    try {
      const result =
        await ctx.sock.groupParticipantsUpdate(
          ctx.jid,
          [participantJid],
          "remove"
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

      if (
        status &&
        status !== "200"
      ) {
        failed++;
        continue;
      }

      removed++;
    } catch (error) {
      failed++;

      console.error(
        "[REMOVE] Failed to remove:",
        participantJid,
        error?.message ||
          error
      );
    }
  }

  /*
   * Final report.
   */

  await ctx.send(
    [
      "╭━━━〔 🗑️ REMOVE 〕━━━╮",
      "┃",
      `┃ ✅ Removed : ${removed}`,
      `┃ ❌ Failed  : ${failed}`,
      `┃ 👑 Owner   : Protected`,
      "┃",
      "┃ Admins and the bot were protected.",
      "┃",
      "╰━━━━━━━━━━━━━━━━━━━━━╯",
      "",
      "🦁 TECH BY TOPFEROS MD 🐑"
    ].join("\n")
  );

  return {
    success:
      failed === 0,
    removed,
    failed,
    ownerProtected:
      groupOwner || null
  };
}

/*
|--------------------------------------------------------------------------
| REGISTER COMMAND
|--------------------------------------------------------------------------
*/

registerCommand(
  "remove",
  removeCommand,
  {
    aliases: [],
    description:
      "Remove all removable members from the current group while protecting the group owner.",
    usage:
      ".remove",
    category:
      "GROUP"
  }
);

module.exports = {
  removeCommand
};