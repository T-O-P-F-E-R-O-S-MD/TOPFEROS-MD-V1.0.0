"use strict";

let config = {};

try {
  config = require("../config");
} catch (error) {
  console.warn("⚠️ CONFIG LOAD WARNING:", error?.message || error);
}

const commandIndex = require("../commands/index");

const PREFIX =
  config?.bot?.prefix ||
  config?.PREFIX ||
  config?.prefix ||
  ".";

function getMessageText(message) {
  const msg = message?.message;
  if (!msg) return "";

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
    message?.message?.extendedTextMessage?.contextInfo?.quotedMessage || null
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

async function reactToCommand(sock, message) {
  try {
    const chatId = message?.key?.remoteJid;
    if (!sock || !chatId) return false;

    await sock.sendMessage(chatId, {
      react: {
        text: "🦁",
        key: message.key
      }
    });

    return true;
  } catch (error) {
    console.warn("⚠️ COMMAND REACTION ERROR:", error?.message || error);
    return false;
  }
}

async function handleMessage(sock, message, sessionId) {
  try {
    if (!sock || !message || !sessionId) return;
    if (message?.key?.fromMe) return;

    const chatId = message?.key?.remoteJid;
    if (!chatId || chatId === "status@broadcast") return;

    const text = String(getMessageText(message) || "").trim();
    console.log(`📝 MESSAGE [${sessionId}]: ${text || "[MEDIA]"}`);

    if (!text || !text.startsWith(PREFIX)) return;

    const commandLine = text.slice(PREFIX.length).trim();
    if (!commandLine) return;

    const parts = commandLine.split(/\s+/);
    const commandName = String(parts.shift() || "").toLowerCase();
    const args = parts;

    const command = commandIndex.getCommand(commandName);
    if (!command) {
      console.log(`❓ UNKNOWN COMMAND: ${PREFIX}${commandName}`);
      return;
    }

    const context = {
      sock,
      message,
      msg: message,
      sessionId,
      chatId,
      sender: getSender(message),
      quoted: getQuotedMessage(message),
      command: commandName,
      commandName,
      args,
      text: args.join(" ").trim(),
      prefix: PREFIX,
      config
    };

    await reactToCommand(sock, message);
    await command.execute(context);

  } catch (error) {
    console.error("❌ HANDLE MESSAGE ERROR:", error?.stack || error?.message || error);
  }
}

module.exports = {
  handleMessage,
  getMessageText,
  reactToCommand
};