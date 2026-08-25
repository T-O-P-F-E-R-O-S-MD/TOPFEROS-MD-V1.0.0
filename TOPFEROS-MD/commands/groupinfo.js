"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👥 TOPFEROS MD — GROUPINFO COMMAND
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

    const admins =
      participants.filter(
        participant =>
          participant.admin === "admin" ||
          participant.admin === "superadmin"
      );

    const owner =
      participants.find(
        participant =>
          participant.admin === "superadmin"
      );

    const groupName =
      metadata.subject ||
      "Unknown Group";

    const groupDescription =
      metadata.desc ||
      "Pa gen description.";

    const creationDate =
      metadata.creation
        ? new Date(
            metadata.creation * 1000
          ).toLocaleString()
        : "Unknown";

    const developer =
      config.bot?.developer ||
      "TOPFEROS TECH";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 GROUP INFORMATION MESSAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const response = `╭━━━〔 👥 GROUP INFO 〕━━━╮
┃
┃ 🏷️ *Name:* ${groupName}
┃
┃ 🆔 *ID:* ${chatId}
┃
┃ 👥 *Members:* ${participants.length}
┃
┃ 👑 *Admins:* ${admins.length}
┃
┃ 📅 *Created:* ${creationDate}
┃
┃ 👑 *Creator:* ${
      owner
        ? `@${owner.id.split("@")[0]}`
        : "Unknown"
    }
┃
┃ 📝 *Description:*
┃ ${groupDescription}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${developer}`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND GROUP INFORMATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const mentions =
      owner
        ? [owner.id]
        : [];

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
      "❌ GROUPINFO ERROR:",
      error.message
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 👥 GROUP INFO 〕━━━╮
┃
┃ ❌ Mwen pa kapab jwenn
┃    enfòmasyon group la.
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
  name: "groupinfo",
  aliases: ["ginfo", "group"],
  description: "Montre enfòmasyon sou group la.",
  usage: ".groupinfo",
  execute
};