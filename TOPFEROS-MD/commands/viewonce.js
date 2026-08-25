"use strict";

const status = require("./status");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👁️ TOPFEROS MD — REPLY / FORWARD VIEW ONCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔁 REPLY / FORWARD HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleReplyForward(context) {
  const {
    message
  } = context;

  if (!message?.message) {
    return false;
  }

  try {
    const processed =
      await status.handleReplyViewOnce(
        context
      );

    if (!processed) {
      return false;
    }

    console.log(
      "✅ VIEW ONCE: Reply/Forward processed."
    );

    return true;

  } catch (error) {
    console.error(
      "❌ REPLY/FORWARD VIEW ONCE ERROR:",
      error
    );

    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 COMMAND EXECUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context;

  const chatId =
    message?.key?.remoteJid;

  if (!chatId) {
    return;
  }

  try {
    const processed =
      await handleReplyForward(
        context
      );

    if (processed) {
      return;
    }

    await sock.sendMessage(
      chatId,
      {
        text:
          "👁️ *VIEW ONCE*\n\n" +
          "❌ Mwen pa jwenn yon View Once nan reply/forward sa a."
      },
      {
        quoted: message
      }
    );

  } catch (error) {
    console.error(
      "❌ VIEW ONCE COMMAND ERROR:",
      error
    );

    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Gen yon erè pandan m t ap trete View Once la."
      },
      {
        quoted: message
      }
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "viewonce",

  aliases: [
    "vreply",
    "vforward"
  ],

  description:
    "Trete yon View Once ki vini kòm reply oswa forward.",

  usage:
    "Reply/forward View Once",

  execute,

  handleReplyForward
};