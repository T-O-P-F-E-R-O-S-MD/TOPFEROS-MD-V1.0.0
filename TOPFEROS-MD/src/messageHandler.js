"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 MESSAGE HANDLER
// TOPFEROS MD V1.0.0
// 🚀 TOPFEROS TECH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleMessage(sock, message) {
  try {
    if (!message || !message.message) {
      return;
    }

    const remoteJid = message.key?.remoteJid;

    if (!remoteJid) {
      return;
    }

    // Ignore status messages for now.
    if (remoteJid === "status@broadcast") {
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 👤 MESSAGE SENDER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const sender =
      message.key?.participant ||
      remoteJid;

    const isFromMe =
      message.key?.fromMe === true;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💬 EXTRACT MESSAGE TEXT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const text = getMessageText(message);

    if (!text) {
      return;
    }

    const prefix =
      config.bot?.prefix || ".";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔰 CHECK PREFIX
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!text.startsWith(prefix)) {
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🧩 PARSE COMMAND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const commandText =
      text.slice(prefix.length).trim();

    if (!commandText) {
      return;
    }

    const parts =
      commandText.split(/\s+/);

    const command =
      parts.shift().toLowerCase();

    const args = parts;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📦 COMMAND DATA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const commandData = {
      sock,
      message,
      jid: remoteJid,
      sender,
      isFromMe,
      text,
      command,
      args,
      prefix
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 LOG COMMAND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log(
      `[COMMAND] ${prefix}${command} | ${sender}`
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔌 LOAD COMMAND ROUTER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const commandRouter =
      require("../commands");

    if (
      commandRouter &&
      typeof commandRouter.handle === "function"
    ) {
      await commandRouter.handle(
        commandData
      );
    }

  } catch (error) {
    console.error(
      "❌ Message Handler Error:",
      error.message
    );
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 GET MESSAGE TEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getMessageText(message) {
  const content =
    message.message;

  if (!content) {
    return null;
  }

  // Plain text
  if (content.conversation) {
    return content.conversation;
  }

  // Extended text
  if (
    content.extendedTextMessage?.text
  ) {
    return content.extendedTextMessage.text;
  }

  // Image caption
  if (
    content.imageMessage?.caption
  ) {
    return content.imageMessage.caption;
  }

  // Video caption
  if (
    content.videoMessage?.caption
  ) {
    return content.videoMessage.caption;
  }

  // Document caption
  if (
    content.documentMessage?.caption
  ) {
    return content.documentMessage.caption;
  }

  return null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  handleMessage,
  getMessageText
};