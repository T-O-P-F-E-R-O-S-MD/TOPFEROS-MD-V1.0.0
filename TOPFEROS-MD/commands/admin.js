"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👑 TOPFEROS MD — ADMIN COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context;

  const chatId =
    message?.key?.remoteJid;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY GROUP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!chatId || !chatId.endsWith("@g.us")) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Command sa disponib sèlman nan group."
      },
      {
        quoted: message
      }
    );

    return;
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📋 GET GROUP INFORMATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const metadata =
      await sock.groupMetadata(chatId);

    const participants =
      metadata.participants || [];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 👑 FIND ADMINS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const admins =
      participants.filter(
        participant =>
          participant.admin === "admin" ||
          participant.admin === "superadmin"
      );

    if (!admins.length) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "⚠️ Pa gen admin ki disponib nan group sa a."
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 👥 CREATE ADMIN LIST
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const mentions =
      admins
        .map(
          participant =>
            participant.id
        )
        .filter(Boolean);

    const adminList =
      admins
        .map(
          (participant, index) => {
            const role =
              participant.admin === "superadmin"
                ? "👑 Owner"
                : "🛡️ Admin";

            return `${index + 1}. ${role} @${participant.id.split("@")[0]}`;
          }
        )
        .join("\n");

    const groupName =
      metadata.subject ||
      "TOPFEROS GROUP";

    const developer =
      config.bot?.developer ||
      "TOPFEROS TECH";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND ADMIN LIST
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const response = `╭━━━〔 👑 GROUP ADMINS 〕━━━╮
┃
┃ 🏷️ *Group:* ${groupName}
┃
┃ 👥 *Total Admins:* ${admins.length}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

${adminList}

🚀 ${developer}`;

    await sock.sendMessage(
      chatId,
      {
        text: response,
        mentions
      },
      {
        quoted: message
      }
    );

  } catch (error) {

    console.error(
      "❌ ADMIN ERROR:",
      error.message
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 👑 ADMIN 〕━━━╮
┃
┃ ❌ Mwen pa kapab jwenn
┃    lis admin group la.
┃
┃ ⚠️ Verifye koneksyon bot la.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${config.bot?.developer || "TOPFEROS TECH"}`
      },
      {
        quoted: message
      }
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "admin",
  aliases: ["admins", "adminslist"],
  description: "Montre tout admin ak owner group la.",
  usage: ".admin",
  execute
};