"use strict";

let config = {};

try {
  config =
    require("../config");
} catch (error) {
  console.warn(
    "⚠️ CONFIG LOAD WARNING:",
    error?.message || error
  );
}

const commandIndex =
  require("../commands/index");

const PREFIX =
  config?.bot?.prefix ||
  ".";

/* ============================================================
   GET MESSAGE TEXT
============================================================ */

function getMessageText(
  message
) {
  const msg =
    message?.message;

  if (!msg) {
    return "";
  }

  return (
    msg.conversation ||

    msg.extendedTextMessage
      ?.text ||

    msg.imageMessage
      ?.caption ||

    msg.videoMessage
      ?.caption ||

    msg.documentMessage
      ?.caption ||

    msg.audioMessage
      ?.caption ||

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

/* ============================================================
   QUOTED MESSAGE
============================================================ */

function getQuotedMessage(
  message
) {
  return (
    message?.message
      ?.extendedTextMessage
      ?.contextInfo
      ?.quotedMessage ||

    message?.message
      ?.imageMessage
      ?.contextInfo
      ?.quotedMessage ||

    message?.message
      ?.videoMessage
      ?.contextInfo
      ?.quotedMessage ||

    null
  );
}

/* ============================================================
   SENDER
============================================================ */

function getSender(
  message
) {
  return (
    message?.key?.participant ||

    message?.participant ||

    message?.key?.remoteJid ||

    null
  );
}

/* ============================================================
   HANDLE MESSAGE
============================================================ */

async function handleMessage(
  sock,
  message,
  sessionId
) {
  try {
    if (
      !sock ||
      !message
    ) {
      return;
    }

    if (!sessionId) {
      console.error(
        "❌ MESSAGE HANDLER: SESSION ID MANKE."
      );

      return;
    }

    /* Ignore messages bot la voye */

    if (
      message?.key?.fromMe
    ) {
      return;
    }

    const jid =
      message?.key?.remoteJid;

    if (!jid) {
      return;
    }

    /* Ignore status */

    if (
      jid ===
      "status@broadcast"
    ) {
      return;
    }

    const text =
      String(
        getMessageText(
          message
        ) || ""
      ).trim();

    console.log(
      `📝 MESSAGE [${sessionId}]: ${
        text || "[MEDIA]"
      }`
    );

    if (!text) {
      return;
    }

    /* ========================================================
       PREFIX
    ======================================================== */

    if (
      !text.startsWith(
        PREFIX
      )
    ) {
      return;
    }

    const commandLine =
      text
        .slice(
          PREFIX.length
        )
        .trim();

    if (!commandLine) {
      return;
    }

    /* ========================================================
       COMMAND + ARGS
    ======================================================== */

    const parts =
      commandLine.split(
        /\s+/
      );

    const commandName =
      String(
        parts.shift() ||
        ""
      ).toLowerCase();

    const args =
      parts;

    console.log(
      `🔎 COMMAND SEARCH: ${PREFIX}${commandName}`
    );

    /* ========================================================
       FIND COMMAND
    ======================================================== */

    const command =
      commandIndex.getCommand(
        commandName
      );

    if (!command) {
      console.log(
        `❓ UNKNOWN COMMAND: ${PREFIX}${commandName}`
      );

      return;
    }

    /* ========================================================
       COMMAND TEXT
    ======================================================== */

    const commandText =
      args.join(
        " "
      ).trim();

    /* ========================================================
       CONTEXT
    ======================================================== */

    const context = {
      sock,

      message,

      sessionId,

      jid,

      chatId: jid,

      sender:
        getSender(
          message
        ),

      quoted:
        getQuotedMessage(
          message
        ),

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
      `🚀 EXECUTING COMMAND: ${
        command.name ||
        commandName
      }`
    );

    /* ========================================================
       EXECUTE
    ======================================================== */

    if (
      typeof command.execute ===
      "function"
    ) {
      await command.execute(
        context
      );
    }

    else if (
      typeof command.handleParrainCommand ===
      "function"
    ) {
      await command.handleParrainCommand(
        context
      );
    }

    else {
      console.error(
        `❌ COMMAND PA GEN EXECUTE: ${commandName}`
      );

      return;
    }

    console.log(
      `✅ COMMAND COMPLETED: ${
        command.name ||
        commandName
      }`
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

/* ============================================================
   EXPORTS
============================================================ */

module.exports = {
  handleMessage,
  getMessageText,
  getQuotedMessage,
  getSender
};