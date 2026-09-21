"use strict";

// ============================================================
// TOPFEROS MD
// MESSAGE HANDLER
// WhatsApp / Baileys
// ============================================================

let config = {};

try {
  config = require("../config");
} catch (error) {
  console.warn(
    "⚠️ CONFIG LOAD WARNING:",
    error?.message || error
  );
}

const commandIndex =
  require("../commands/index");

// ============================================================
// PREFIX
// ============================================================

const PREFIX =
  config?.bot?.prefix ||
  config?.PREFIX ||
  config?.prefix ||
  ".";

// ============================================================
// UNWRAP WHATSAPP MESSAGE
// ============================================================
// Baileys ka mete mesaj la andedan plizyè wrapper.
// Fonksyon sa a retire wrapper yo pou nou jwenn vrè mesaj la.
// ============================================================

function unwrapMessageContent(messageContent) {
  let current = messageContent;

  if (!current) {
    return null;
  }

  const wrapperKeys = [
    "ephemeralMessage",
    "viewOnceMessage",
    "viewOnceMessageV2",
    "viewOnceMessageV2Extension",
    "documentWithCaptionMessage",
    "editedMessage",
    "associatedChildMessage"
  ];

  let safety = 0;

  while (
    current &&
    safety < 10
  ) {
    safety++;

    let found = false;

    for (
      const key of wrapperKeys
    ) {
      if (
        current[key] &&
        typeof current[key] === "object"
      ) {
        current =
          current[key].message ||
          current[key];

        found = true;
        break;
      }
    }

    if (!found) {
      break;
    }
  }

  return current || null;
}

// ============================================================
// GET MESSAGE CONTENT
// ============================================================

function getMessageContent(message) {
  return unwrapMessageContent(
    message?.message
  );
}

// ============================================================
// GET MESSAGE TEXT
// ============================================================

function getMessageText(message) {
  const msg =
    getMessageContent(message);

  if (!msg) {
    return "";
  }

  // ----------------------------------------------------------
  // NORMAL TEXT
  // ----------------------------------------------------------

  if (
    typeof msg.conversation === "string"
  ) {
    return msg.conversation;
  }

  // ----------------------------------------------------------
  // EXTENDED TEXT
  // ----------------------------------------------------------

  if (
    typeof msg.extendedTextMessage?.text ===
      "string"
  ) {
    return msg.extendedTextMessage.text;
  }

  // ----------------------------------------------------------
  // IMAGE CAPTION
  // ----------------------------------------------------------

  if (
    typeof msg.imageMessage?.caption ===
      "string"
  ) {
    return msg.imageMessage.caption;
  }

  // ----------------------------------------------------------
  // VIDEO CAPTION
  // ----------------------------------------------------------

  if (
    typeof msg.videoMessage?.caption ===
      "string"
  ) {
    return msg.videoMessage.caption;
  }

  // ----------------------------------------------------------
  // DOCUMENT CAPTION
  // ----------------------------------------------------------

  if (
    typeof msg.documentMessage?.caption ===
      "string"
  ) {
    return msg.documentMessage.caption;
  }

  // ----------------------------------------------------------
  // AUDIO
  // ----------------------------------------------------------

  if (
    typeof msg.audioMessage?.caption ===
      "string"
  ) {
    return msg.audioMessage.caption;
  }

  // ----------------------------------------------------------
  // BUTTON RESPONSE
  // ----------------------------------------------------------

  if (
    typeof
      msg.buttonsResponseMessage
        ?.selectedButtonId ===
      "string"
  ) {
    return (
      msg.buttonsResponseMessage
        .selectedButtonId
    );
  }

  // ----------------------------------------------------------
  // LIST RESPONSE
  // ----------------------------------------------------------

  if (
    typeof
      msg.listResponseMessage
        ?.singleSelectReply
        ?.selectedRowId ===
      "string"
  ) {
    return (
      msg.listResponseMessage
        .singleSelectReply
        .selectedRowId
    );
  }

  // ----------------------------------------------------------
  // TEMPLATE BUTTON
  // ----------------------------------------------------------

  if (
    typeof
      msg.templateButtonReplyMessage
        ?.selectedId ===
      "string"
  ) {
    return (
      msg.templateButtonReplyMessage
        .selectedId
    );
  }

  // ----------------------------------------------------------
  // INTERACTIVE RESPONSE
  // ----------------------------------------------------------

  const interactive =
    msg.interactiveResponseMessage;

  if (interactive) {
    try {
      const nativeFlow =
        interactive.nativeFlowResponseMessage;

      if (
        nativeFlow?.paramsJson
      ) {
        const parsed =
          JSON.parse(
            nativeFlow.paramsJson
          );

        return (
          parsed?.id ||
          parsed?.selectedId ||
          parsed?.button_id ||
          ""
        );
      }
    } catch {}
  }

  // ----------------------------------------------------------
  // CONVERSATION INSIDE WRAPPER
  // ----------------------------------------------------------

  for (
    const value of
    Object.values(msg)
  ) {
    if (
      value &&
      typeof value === "object"
    ) {
      if (
        typeof value.text ===
        "string"
      ) {
        return value.text;
      }

      if (
        typeof value.caption ===
        "string"
      ) {
        return value.caption;
      }
    }
  }

  return "";
}

// ============================================================
// GET QUOTED MESSAGE
// ============================================================

function getQuotedMessage(message) {
  const msg =
    getMessageContent(message);

  if (!msg) {
    return null;
  }

  // ----------------------------------------------------------
  // DIRECT EXTENDED TEXT
  // ----------------------------------------------------------

  const directContext =
    msg.extendedTextMessage
      ?.contextInfo;

  if (
    directContext?.quotedMessage
  ) {
    return (
      directContext.quotedMessage
    );
  }

  // ----------------------------------------------------------
  // IMAGE
  // ----------------------------------------------------------

  const imageContext =
    msg.imageMessage
      ?.contextInfo;

  if (
    imageContext?.quotedMessage
  ) {
    return (
      imageContext.quotedMessage
    );
  }

  // ----------------------------------------------------------
  // VIDEO
  // ----------------------------------------------------------

  const videoContext =
    msg.videoMessage
      ?.contextInfo;

  if (
    videoContext?.quotedMessage
  ) {
    return (
      videoContext.quotedMessage
    );
  }

  // ----------------------------------------------------------
  // DOCUMENT
  // ----------------------------------------------------------

  const documentContext =
    msg.documentMessage
      ?.contextInfo;

  if (
    documentContext?.quotedMessage
  ) {
    return (
      documentContext.quotedMessage
    );
  }

  // ----------------------------------------------------------
  // AUDIO
  // ----------------------------------------------------------

  const audioContext =
    msg.audioMessage
      ?.contextInfo;

  if (
    audioContext?.quotedMessage
  ) {
    return (
      audioContext.quotedMessage
    );
  }

  return null;
}

// ============================================================
// GET SENDER
// ============================================================

function getSender(message) {
  return (
    message?.key?.participant ||
    message?.participant ||
    message?.key?.remoteJid ||
    null
  );
}

// ============================================================
// GET CHAT ID
// ============================================================

function getChatId(message) {
  return (
    message?.key?.remoteJid ||
    null
  );
}

// ============================================================
// CHECK GROUP
// ============================================================

function isGroupMessage(message) {
  const chatId =
    getChatId(message);

  return (
    typeof chatId === "string" &&
    chatId.endsWith("@g.us")
  );
}

// ============================================================
// REACT TO COMMAND
// ============================================================

async function reactToCommand(
  sock,
  message
) {
  try {
    if (
      !sock ||
      !message?.key
    ) {
      return false;
    }

    const chatId =
      getChatId(message);

    if (!chatId) {
      return false;
    }

    await sock.sendMessage(
      chatId,
      {
        react: {
          text: "🦁",
          key: message.key
        }
      }
    );

    console.log(
      `🦁 COMMAND REACTION SENT [${chatId}]`
    );

    return true;

  } catch (error) {

    console.warn(
      "⚠️ COMMAND REACTION ERROR:",
      error?.message ||
      error
    );

    return false;
  }
}

// ============================================================
// HANDLE MESSAGE
// ============================================================

async function handleMessage(
  sock,
  message,
  sessionId
) {
  try {

    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------

    if (
      !sock ||
      !message ||
      !sessionId
    ) {
      return;
    }

    // --------------------------------------------------------
    // IGNORE BOT'S OWN MESSAGE
    // --------------------------------------------------------

    if (
      message?.key?.fromMe
    ) {
      console.log(
        `⏭️ MESSAGE IGNORED [${sessionId}] — fromMe`
      );

      return;
    }

    // --------------------------------------------------------
    // CHAT ID
    // --------------------------------------------------------

    const chatId =
      getChatId(message);

    if (!chatId) {
      return;
    }

    // --------------------------------------------------------
    // IGNORE STATUS
    // --------------------------------------------------------

    if (
      chatId ===
      "status@broadcast"
    ) {
      return;
    }

    // --------------------------------------------------------
    // EXTRACT TEXT
    // --------------------------------------------------------

    const text =
      String(
        getMessageText(message) ||
        ""
      ).trim();

    console.log(
      `📝 MESSAGE [${sessionId}]: ${
        text || "[MEDIA]"
      }`
    );

    // --------------------------------------------------------
    // NO TEXT
    // --------------------------------------------------------

    if (!text) {
      return;
    }

    // --------------------------------------------------------
    // PREFIX CHECK
    // --------------------------------------------------------

    if (
      !text.startsWith(PREFIX)
    ) {
      console.log(
        `ℹ️ MESSAGE WITHOUT PREFIX [${sessionId}]: ${text}`
      );

      return;
    }

    // --------------------------------------------------------
    // REMOVE PREFIX
    // --------------------------------------------------------

    const commandLine =
      text
        .slice(
          PREFIX.length
        )
        .trim();

    if (!commandLine) {
      return;
    }

    // --------------------------------------------------------
    // SPLIT COMMAND
    // --------------------------------------------------------

    const parts =
      commandLine.split(
        /\s+/
      );

    const commandName =
      String(
        parts.shift() || ""
      ).toLowerCase();

    const args =
      parts;

    console.log(
      `🔎 COMMAND SEARCH [${sessionId}]: ${PREFIX}${commandName}`
    );

    // --------------------------------------------------------
    // FIND COMMAND
    // --------------------------------------------------------

    const command =
      commandIndex.getCommand(
        commandName
      );

    if (!command) {

      console.log(
        `❓ UNKNOWN COMMAND [${sessionId}]: ${PREFIX}${commandName}`
      );

      return;
    }

    console.log(
      `✅ COMMAND FOUND [${sessionId}]: ${command.name}`
    );

    // --------------------------------------------------------
    // COMMAND TEXT
    // --------------------------------------------------------

    const commandText =
      args
        .join(" ")
        .trim();

    // --------------------------------------------------------
    // MESSAGE CONTEXT
    // --------------------------------------------------------

    const context = {

      // Baileys socket
      sock,

      // Original Baileys message
      message,

      // Alias for compatibility
      msg:
        message,

      // Session
      sessionId,

      // Chat
      chatId,

      // Sender
      sender:
        getSender(message),

      // Group
      isGroup:
        isGroupMessage(
          message
        ),

      // Quoted message
      quoted:
        getQuotedMessage(
          message
        ),

      // Command
      command:
        commandName,

      commandName,

      // Arguments
      args,

      // Text after command
      text:
        commandText,

      // Prefix
      prefix:
        PREFIX,

      // Config
      config
    };

    // --------------------------------------------------------
    // LOG COMMAND
    // --------------------------------------------------------

    console.log(
      `🚀 EXECUTING COMMAND [${sessionId}]: ${PREFIX}${commandName}`
    );

    // --------------------------------------------------------
    // REACTION
    // --------------------------------------------------------

    await reactToCommand(
      sock,
      message
    );

    // --------------------------------------------------------
    // EXECUTE COMMAND
    // --------------------------------------------------------

    await command.execute(
      context
    );

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    console.log(
      `✅ COMMAND COMPLETED [${sessionId}]: ${PREFIX}${commandName}`
    );

  } catch (error) {

    console.error(
      `❌ HANDLE MESSAGE ERROR [${
        sessionId || "unknown"
      }]`,
      error?.stack ||
      error?.message ||
      error
    );
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  handleMessage,
  getMessageText,
  getQuotedMessage,
  getSender,
  getChatId,
  isGroupMessage,
  reactToCommand
};