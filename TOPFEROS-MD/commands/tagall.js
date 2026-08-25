"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📢 TOPFEROS MD — TAGALL COMMAND
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
  // 👥 VERIFY GROUP
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
    // 📋 GET GROUP METADATA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const metadata =
      await sock.groupMetadata(chatId);

    const participants =
      metadata.participants || [];

    if (!participants.length) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "⚠️ Pa gen okenn participant pou tag."
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 👥 CREATE MENTIONS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const mentions =
      participants
        .map(
          participant =>
            participant.id
        )
        .filter(Boolean);

    const title =
      metadata.subject ||
      "TOPFEROS GROUP";

    const customText =
      text.trim();

    const messageText =
      `╭━━━〔 📢 TAG ALL 〕━━━╮
┃
┃ 👥 *${title}*
┃
┃ ${customText || "📢 Attention tout moun!"}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

${mentions
  .map(
    jid =>
      `@${jid.split("@")[0]}`
  )
  .join(" ")}

🚀 ${config.bot?.developer || "TOPFEROS TECH"}`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND TAG ALL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendMessage(
      chatId,
      {
        text: messageText,
        mentions
      },
      {
        quoted: message
      }
    );

  } catch (error) {

    console.error(
      "❌ TAGALL ERROR:",
      error.message
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 📢 TAG ALL 〕━━━╮
┃
┃ ❌ Mwen pa kapab tag
┃    tout moun kounye a.
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
  name: "tagall",
  aliases: ["all", "everyone", "mentionall"],
  description: "Tag tout patisipan yo nan yon group.",
  usage: ".tagall [mesaj]",
  execute
};