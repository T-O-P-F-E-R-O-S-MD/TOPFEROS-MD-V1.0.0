"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                 GROUP INFO COMMAND                ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

/*
|--------------------------------------------------------------------------
| FORMAT JID
|--------------------------------------------------------------------------
*/

function formatJid(jid) {
  if (!jid) {
    return "Unknown";
  }

  return String(jid)
    .replace("@s.whatsapp.net", "")
    .replace("@g.us", "");
}

/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

function formatDate(timestamp) {
  if (!timestamp) {
    return "Unknown";
  }

  try {
    return new Date(
      Number(timestamp) * 1000
    ).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return "Unknown";
  }
}

/*
|--------------------------------------------------------------------------
| GET ADMIN LIST
|--------------------------------------------------------------------------
*/

function getAdminList(participants) {
  if (!Array.isArray(participants)) {
    return [];
  }

  return participants.filter(
    (participant) =>
      participant?.admin === "admin" ||
      participant?.admin === "superadmin"
  );
}

/*
|--------------------------------------------------------------------------
| GET GROUP PROFILE PHOTO
|--------------------------------------------------------------------------
*/

async function getGroupProfilePicture(
  sock,
  groupJid
) {
  try {
    if (
      typeof sock.profilePictureUrl !==
      "function"
    ) {
      return null;
    }

    return await sock.profilePictureUrl(
      groupJid,
      "image"
    );
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| BUILD GROUP INFORMATION
|--------------------------------------------------------------------------
*/

function buildGroupInfo(
  ctx,
  metadata,
  participants,
  admins,
  owner,
  created,
  inviteLink,
  announce,
  memberAddMode,
  ephemeral
) {
  const description =
    metadata?.desc ||
    "No group description.";

  const adminLines =
    admins.length
      ? admins.map(
          (admin, index) => {
            const jid =
              admin?.id ||
              admin?.jid ||
              "";

            const role =
              admin?.admin ===
              "superadmin"
                ? "Owner"
                : "Admin";

            return `┃ ${index + 1}. ${formatJid(jid)} — ${role}`;
          }
        )
      : [
          "┃ No admin information available."
        ];

  const output = [
    "╭━━━〔 👥 GROUP INFO 〕━━━╮",
    "┃",
    `┃ 🏷️ Name        : ${metadata?.subject || "Unknown"}`,
    `┃ 🆔 Group ID    : ${ctx.jid}`,
    `┃ 👤 Owner       : ${formatJid(owner)}`,
    `┃ 👥 Members     : ${participants.length}`,
    `┃ 👑 Admins      : ${admins.length}`,
    `┃ 📅 Created     : ${created}`,
    `┃ 🔒 Messages    : ${announce}`,
    `┃ ➕ Add Members : ${memberAddMode}`,
    `┃ ⏳ Ephemeral    : ${ephemeral}`,
    "┃",
    "┃ 👑 ADMIN LIST",
    "┃",
    ...adminLines,
    "┃",
    "┃ 📝 DESCRIPTION",
    "┃",
    `┃ ${description}`,
    "┃",
    "┃ 🔗 INVITE LINK",
    "┃",
    `┃ ${inviteLink}`,
    "┃",
    "╰━━━━━━━━━━━━━━━━━━━━━━╯",
    "",
    "🦁 TECH BY TOPFEROS MD 🐑"
  ];

  return output.join("\n");
}

/*
|--------------------------------------------------------------------------
| GROUP INFO COMMAND
|--------------------------------------------------------------------------
*/

async function groupInfoCommand(ctx) {
  /*
   * This command works ONLY inside groups.
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

  let metadata;

  /*
   * Get group metadata.
   */

  try {
    metadata =
      await ctx.sock.groupMetadata(
        ctx.jid
      );
  } catch (error) {
    console.error(
      "[GROUP INFO] Metadata error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ GROUP INFO ERROR",
        "",
        "I could not retrieve this group's information.",
        "",
        "Make sure the bot is still a member of the group.",
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

  const participants =
    Array.isArray(
      metadata?.participants
    )
      ? metadata.participants
      : [];

  const admins =
    getAdminList(
      participants
    );

  const owner =
    metadata?.owner ||
    metadata?.subjectOwner ||
    null;

  const created =
    formatDate(
      metadata?.creation
    );

  /*
   * Get invite link.
   */

  let inviteLink =
    "Unavailable";

  try {
    if (
      typeof ctx.sock.groupInviteCode ===
      "function"
    ) {
      const inviteCode =
        await ctx.sock.groupInviteCode(
          ctx.jid
        );

      if (inviteCode) {
        inviteLink =
          `https://chat.whatsapp.com/${inviteCode}`;
      }
    }
  } catch {
    /*
     * Invite link is optional.
     */
  }

  /*
   * Group announcement mode.
   */

  const announce =
    metadata?.announce === true
      ? "Admins only"
      : "All participants";

  /*
   * Member add restriction.
   */

  const memberAddMode =
    metadata?.memberAddMode === true
      ? "Admins only"
      : "Participants";

  /*
   * Ephemeral messages.
   */

  const ephemeral =
    metadata?.ephemeralDuration
      ? `${metadata.ephemeralDuration} seconds`
      : "Off";

  /*
   * Build information text.
   */

  const info =
    buildGroupInfo(
      ctx,
      metadata,
      participants,
      admins,
      owner,
      created,
      inviteLink,
      announce,
      memberAddMode,
      ephemeral
    );

  /*
   * Get group profile picture.
   */

  const profilePicture =
    await getGroupProfilePicture(
      ctx.sock,
      ctx.jid
    );

  /*
   * Send group photo with information.
   */

  if (profilePicture) {
    try {
      await ctx.sock.sendMessage(
        ctx.jid,
        {
          image: {
            url: profilePicture
          },
          caption: info
        },
        {
          quoted:
            ctx.message
        }
      );
    } catch (error) {
      console.error(
        "[GROUP INFO] Profile picture send failed:",
        error?.message ||
          error
      );

      /*
       * If sending the image fails,
       * send the information as text.
       */

      await ctx.send(
        info
      );
    }
  } else {
    /*
     * No group picture available.
     */

    await ctx.send(
      info
    );
  }

  return {
    success: true,

    groupId:
      ctx.jid,

    name:
      metadata?.subject ||
      null,

    owner:
      owner ||
      null,

    members:
      participants.length,

    admins:
      admins.length,

    inviteLink,

    hasProfilePicture:
      Boolean(profilePicture)
  };
}

/*
|--------------------------------------------------------------------------
| REGISTER COMMAND
|--------------------------------------------------------------------------
*/

registerCommand(
  "groupinfo",
  groupInfoCommand,
  {
    aliases: [
      "ginfo"
    ],

    description:
      "Display detailed information about the current WhatsApp group.",

    usage:
      ".groupinfo",

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
  groupInfoCommand
};