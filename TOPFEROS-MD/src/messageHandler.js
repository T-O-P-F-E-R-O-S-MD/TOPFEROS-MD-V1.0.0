"use strict";

const path = require("path");

let config = {};

try {
  config = require("../config");
} catch (error) {
  console.warn(
    "⚠️ CONFIG LOAD WARNING:",
    error.message
  );
}

const commandIndex = require("../commands");

const PREFIX =
  config?.bot?.prefix ||
  config?.PREFIX ||
  config?.prefix ||
  ".";

function getMessageText(message) {
  const msg = message?.message;

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
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg.templateButtonReplyMessage?.selectedId ||
    ""
  );
}

function getQuotedMessage(message) {
  return (
    message?.message
      ?.extendedTextMessage
      ?.contextInfo
      ?.quotedMessage || null
  );
}

function getSenderJid(message) {
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
      console.log(
        "⚠️ handleMessage: sock/message manke."
      );
      return;
    }

    if (!sessionId) {
      console.log(
        "⚠️ handleMessage: sessionId manke."
      );
      return;
    }

    if (message?.key?.fromMe) {
      return;
    }

    const remoteJid =
      message?.key?.remoteJid;

    if (!remoteJid) {
      return;
    }

    // Status pa antre nan command system
    if (remoteJid === "status@broadcast") {
      return;
    }

    const text =
      String(getMessageText(message) || "")
        .trim();

    console.log(
      `📨 TEXT [${sessionId}]:`,
      text || "[MEDIA/NO TEXT]"
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
      String(parts.shift() || "")
        .toLowerCase();

    const args = parts;

    const command =
      commandIndex.getCommand(
        commandName
      );

    console.log(
      `🎯 COMMAND [${sessionId}]: ${commandName}`
    );

    if (!command) {
      console.log(
        `❓ UNKNOWN COMMAND: ${commandName}`
      );

      return;
    }

    const commandText =
      args.join(" ").trim();

    const context = {
      sock,
      message,

      // Session
      sessionId,

      // Command
      command: commandName,
      commandName,
      args,
      text: commandText,

      // WhatsApp data
      chatId: remoteJid,
      sender: getSenderJid(message),
      quoted: getQuotedMessage(message),

      // Config
      config,

      // Prefix
      prefix: PREFIX
    };

    console.log(
      `🚀 EXECUTING: ${command.name}`
    );

    await command.execute(context);

    console.log(
      `✅ COMMAND DONE: ${command.name}`
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