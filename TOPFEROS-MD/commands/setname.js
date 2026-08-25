"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏷️ TOPFEROS MD — SETNAME COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message,
    text = ""
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

  const newName = text.trim();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY NEW NAME
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!newName) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Mete nouvo non group la.\n\nEgzanp: .setname TOPFEROS MD"
      },
      {
        quoted: message
      }
    );

    return;
  }

  if (newName.length > 100) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Non group la twò long. Tanpri itilize 100 karaktè oswa mwens."
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
    // 🤖 CHECK BOT ADMIN STATUS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const botNumber =
      sock.user?.id?.split(":")[0];

    const botParticipant =
      participants.find(
        participant =>
          participant.id?.split(":")[0] ===
          botNumber
      );

    if (
      !botParticipant ||
      (
        botParticipant.admin !== "admin" &&
        botParticipant.admin !== "superadmin"
      )
    ) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Bot la dwe admin pou li kapab chanje non group la."
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🏷️ CHANGE GROUP NAME
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.groupUpdateSubject(
      chatId,
      newName
    );

    const developer =
      config.bot?.developer ||
      "TOPFEROS TECH";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND RESULT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 🏷️ SET NAME 〕━━━╮
┃
┃ ✅ Non group la chanje.
┃
┃ 🏷️ Nouvo non:
┃ ${newName}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${developer}`
      },
      {
        quoted: message
      }
    );

  } catch (error) {

    console.error(
      "❌ SETNAME ERROR:",
      error.message
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 🏷️ SET NAME 〕━━━╮
┃
┃ ❌ Mwen pa kapab chanje
┃    non group la.
┃
┃ ⚠️ Verifye permissions
┃    bot la nan group la.
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
  name: "setname",
  aliases: ["groupname", "rename"],
  description: "Chanje non group WhatsApp la.",
  usage: ".setname <nouvo non>",
  execute
};