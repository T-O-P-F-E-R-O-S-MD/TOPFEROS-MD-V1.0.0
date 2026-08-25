"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ➕ TOPFEROS MD — ADD COMMAND
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

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🤖 CHECK BOT ADMIN STATUS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const metadata =
      await sock.groupMetadata(chatId);

    const participants =
      metadata.participants || [];

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
            "❌ Bot la dwe admin pou li kapab ajoute yon moun."
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 👤 GET TARGET NUMBER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const mentionedJid =
      message.message?.extendedTextMessage
        ?.contextInfo?.mentionedJid || [];

    let target =
      mentionedJid[0];

    if (!target && text.trim()) {
      let number =
        text.trim()
          .replace(/[^\d+]/g, "")
          .replace(/^\+/, "");

      if (number.length < 7) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ Nimewo a pa sanble valab."
          },
          {
            quoted: message
          }
        );

        return;
      }

      target =
        `${number}@s.whatsapp.net`;
    }

    if (!target) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Mention yon moun oswa mete nimewo WhatsApp li.\n\nEgzanp: .add 509XXXXXXXX"
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ➕ ADD USER TO GROUP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const result =
      await sock.groupParticipantsUpdate(
        chatId,
        [target],
        "add"
      );

    const action =
      result?.[0]?.status;

    const developer =
      config.bot?.developer ||
      "TOPFEROS TECH";

    const targetNumber =
      target
        .split("@")[0]
        .split(":")[0];

    let statusText =
      "Moun nan ajoute nan group la avèk siksè.";

    if (action === 409) {
      statusText =
        "Moun sa a deja nan group la.";
    } else if (
      action === 403 ||
      action === 401
    ) {
      statusText =
        "WhatsApp pa pèmèt bot la ajoute moun sa a dirèkteman.";
    } else if (
      action &&
      action !== 200
    ) {
      statusText =
        `WhatsApp retounen status ${action}.`;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND RESULT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 ➕ ADD 〕━━━╮
┃
┃ ${statusText}
┃
┃ 👤 @${targetNumber}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${developer}`,
        mentions: [
          target
        ]
      },
      {
        quoted: message
      }
    );

  } catch (error) {

    console.error(
      "❌ ADD ERROR:",
      error.message
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 ➕ ADD 〕━━━╮
┃
┃ ❌ Mwen pa kapab ajoute
┃    moun sa a.
┃
┃ ⚠️ Verifye si bot la
┃    se admin nan group la.
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
  name: "add",
  aliases: ["adduser", "invite"],
  description: "Ajoute yon moun nan group la.",
  usage: ".add <nimewo>",
  execute
};