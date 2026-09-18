"use strict";

let config = {};

try {
  config = require("../config");
} catch (error) {
  console.warn(
    "⚠️ CONFIG LOAD WARNING:",
    error?.message || error
  );
}

const commandIndex = require("../commands/index");

const PREFIX =
  config?.bot?.prefix ||
  config?.PREFIX ||
  config?.prefix ||
  ".";

/* ===============================
   GET TEXT
================================ */

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

/* ===============================
   QUOTED MESSAGE
================================ */

function getQuotedMessage(message) {
  return (
    message?.message?.extendedTextMessage?.contextInfo
      ?.quotedMessage || null
  );
}

/* ===============================
   SENDER
================================ */

function getSender(message) {
  return (
    message?.key?.participant ||
    message?.participant ||
    message?.key?.remoteJid ||
    null
  );
}

/* ===============================
   REACT TO COMMAND
================================ */

async function reactToCommand(sock, message) {
  try {
    if (!sock || !message?.key) {
      return false;
    }

    const chatId = message.key.remoteJid;

    if (!chatId) {
      return false;
    }

    /*
     * 🦁 REACTION REYÈL SOU MESAJ COMMAND LAN
     *
     * Egzanp:
     * .menu
     *   ↓
     * 🦁 reaction sou .menu
     *   ↓
     * Menu voye
     */

    await sock.sendMessage(chatId, {
      react: {
        text: "🦁",
        key: message.key
      }
    });

    console.log(
      `🦁 COMMAND REACTION SENT [${chatId}]`
    );

    return true;

  } catch (error) {
    /*
     * Si reaction lan pa pase, command lan
     * dwe toujou kontinye egzekite.
     */
    console.warn(
      "⚠️ COMMAND REACTION ERROR:",
      error?.message || error
    );

    return false;
  }
}

/* ===============================
   HANDLE MESSAGE
================================ */

async function handleMessage(sock, message, sessionId) {
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

    /*
     * Pa trete mesaj bot la voye pou evite
     * loop/repons sou pwòp mesaj li.
     */
    if (message?.key?.fromMe) {
      return;
    }

    const chatId = message?.key?.remoteJid;

    if (!chatId) {
      return;
    }

    /*
     * STATUS
     *
     * Status yo pa pase nan command handler la.
     * Yo dwe trete nan sistèm Status reaction lan.
     */
    if (chatId === "status@broadcast") {
      return;
    }

    const text = String(
      getMessageText(message) || ""
    ).trim();

    console.log(
      `📝 MESSAGE [${sessionId}]: ${
        text || "[MEDIA]"
      }`
    );

    if (!text) {
      return;
    }

    /* ===============================
       PREFIX
    ================================ */

    if (!text.startsWith(PREFIX)) {
      return;
    }

    const commandLine = text
      .slice(PREFIX.length)
      .trim();

    if (!commandLine) {
      return;
    }

    const parts = commandLine.split(/\s+/);

    const commandName = String(
      parts.shift() || ""
    ).toLowerCase();

    const args = parts;

    console.log(
      `🔎 COMMAND SEARCH: ${PREFIX}${commandName}`
    );

    /* ===============================
       FIND COMMAND
    ================================ */

    const command = commandIndex.getCommand(
      commandName
    );

    if (!command) {
      console.log(
        `❓ UNKNOWN COMMAND: ${PREFIX}${commandName}`
      );
      return;
    }

    const commandText = args.join(" ").trim();

    /* ===============================
       CONTEXT
    ================================ */

    const context = {
      sock,
      message,

      sessionId,

      chatId,

      sender: getSender(message),

      quoted: getQuotedMessage(message),

      command: commandName,

      commandName,

      args,

      text: commandText,

      prefix: PREFIX,

      config
    };

    console.log(
      `🦁 REACTING TO COMMAND: ${PREFIX}${commandName}`
    );

    /*
     * ==========================================
     * 🦁 REACTION ANVAN COMMAND lan
     * ==========================================
     *
     * Egzanp:
     *
     * User: .menu
     *
     * Bot: 🦁  ← reaction sou .menu
     *
     * Apre sa:
     * Bot: [MENU]
     */

    await reactToCommand(sock, message);

    /* ===============================
       EXECUTE COMMAND
    ================================ */

    console.log(
      `🚀 EXECUTING COMMAND: ${command.name}`
    );

    await command.execute(context);

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

/* ===============================
   EXPORTS
================================ */

module.exports = {
  handleMessage,
  getMessageText,
  reactToCommand
};