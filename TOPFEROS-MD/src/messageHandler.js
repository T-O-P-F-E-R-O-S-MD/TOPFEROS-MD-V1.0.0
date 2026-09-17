"use strict";

let config = {};

try {
  config = require("../config");
} catch (error) {
  console.warn(
    "⚠️ CONFIG LOAD WARNING:",
    error.message
  );
}

const commandIndex =
  require("../commands/Index");

const PREFIX =
  config?.bot?.prefix ||
  config?.PREFIX ||
  config?.prefix ||
  ".";

function getMessageText(message) {
  const msg =
    message?.message;

  if (!msg) {
    return "";
  }

  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.audioMessage?.caption ||
    msg.buttonsResponseMessage
      ?.selectedButtonId ||
    msg.listResponseMessage
      ?.singleSelectReply
      ?.selectedRowId ||
    msg.templateButtonReplyMessage
      ?.selectedId ||
    ""
  );
}

function getQuotedMessage(message) {
  return (
    message?.message
      ?.extendedTextMessage
      ?.contextInfo
      ?.quotedMessage ||
    null
  );
}

function getSender(message) {
  return (
    message?.key?.participant ||
    message?.participant ||
    message?.key?.remoteJid ||
    null
  );
}

async function handleMessage(
  sock,
  message,
  sessionId
) {
  try {
    if (!sock || !message) {
      return;
    }

    if (!sessionId) {
      console.error(
        "❌ MESSAGE HANDLER: sessionId manke."
      );
      return;
    }

    if (message?.key?.fromMe) {
      return;
    }

    const chatId =
      message?.key?.remoteJid;

    if (!chatId) {
      return;
    }

    if (
      chatId ===
      "status@broadcast"
    ) {
      return;
    }

    const text =
      String(
        getMessageText(message) || ""
      ).trim();

    console.log(
      `📝 MESSAGE [${sessionId}]:`,
      text || "[MEDIA]"
    );

    if (!text) {
      return;
    }

    if (!text.startsWith(PREFIX)) {
      return;
    }

    const commandLine =
      text
        .slice(PREFIX.length)
        .trim();

    if (!commandLine) {
      return;
    }

    const parts =
      commandLine.split(/\s+/);

    const commandName =
      String(
        parts.shift() || ""
      ).toLowerCase();

    const args = parts;

    const command =
      commandIndex.getCommand(
        commandName
      );

    console.log(
      `🔎 COMMAND SEARCH: .${commandName}`
    );

    if (!command) {
      console.log(
        `❓ UNKNOWN COMMAND: .${commandName}`
      );

      return;
    }

    const commandText =
      args.join(" ").trim();

    const context = {
      sock,
      message,

      sessionId,

      chatId,

      sender:
        getSender(message),

      quoted:
        getQuotedMessage(message),

      command:
        commandName,

      commandName,

      args,

      text:
        commandText,

      prefix:
        PREFIX,

      config
    };

    console.log(
      `🚀 EXECUTING COMMAND: ${command.name}`
    );

    await command.execute(
      context
    );

    console.log(
      `✅ COMMAND COMPLETED: ${command.name}`
    );

  } catch (error) {
    console.error(
      "❌ HANDLE MESSAGE ERROR:",
      error?.stack ||
      error?.message ||
      error
    );
  }
}

module.exports = {
  handleMessage,
  getMessageText
};