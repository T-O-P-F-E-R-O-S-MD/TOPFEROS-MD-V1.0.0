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
// STATUS SYSTEM
// ============================================================

let statusSystem = null;

try {
  statusSystem =
    require("../commands/status");
} catch (error) {
  console.warn(
    "⚠️ STATUS SYSTEM LOAD WARNING:",
    error?.message || error
  );
}

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

  if (
    typeof msg.conversation === "string"
  ) {
    return msg.conversation;
  }

  if (
    typeof msg.extendedTextMessage?.text ===
      "string"
  ) {
    return msg.extendedTextMessage.text;
  }

  if (
    typeof msg.imageMessage?.caption ===
      "string"
  ) {
    return msg.imageMessage.caption;
  }

  if (
    typeof msg.videoMessage?.caption ===
      "string"
  ) {
    return msg.videoMessage.caption;
  }

  if (
    typeof msg.documentMessage?.caption ===
      "string"
  ) {
    return msg.documentMessage.caption;
  }

  if (
    typeof msg.audioMessage?.caption ===
      "string"
  ) {
    return msg.audioMessage.caption;
  }

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
// 👁️ STATUS AUTOMATIC ACTIONS
// ============================================================

async function handleStatusActions(
  sock,
  message,
  sessionId
) {
  try {
    if (
      !sock ||
      !message?.key ||
      message?.key?.remoteJid !==
        "status@broadcast"
    ) {
      return;
    }

    const features =
      config?.features || {};

    // --------------------------------------------------------
    // 👁️ AUTO STATUS SEEN
    // --------------------------------------------------------

    if (
      features.autoStatusSeen === true &&
      typeof sock.readMessages ===
        "function"
    ) {
      try {
        await sock.readMessages([
          message.key
        ]);

        console.log(
          `👁️ STATUS SEEN [${sessionId}]`
        );

      } catch (error) {
        console.warn(
          `⚠️ STATUS SEEN ERROR [${sessionId}]:`,
          error?.message ||
          error
        );
      }
    }

    // --------------------------------------------------------
    // ❤️ STATUS LIKE
    // --------------------------------------------------------

    if (
      features.statusLike === true &&
      typeof sock.sendMessage ===
        "function"
    ) {
      try {
        await sock.sendMessage(
          "status@broadcast",
          {
            react: {
              text: "❤️",
              key: message.key
            }
          }
        );

        console.log(
          `❤️ STATUS LIKE SENT [${sessionId}]`
        );

      } catch (error) {
        console.warn(
          `⚠️ STATUS LIKE ERROR [${sessionId}]:`,
          error?.message ||
          error
        );
      }
    }

    // --------------------------------------------------------
    // ⚡ STATUS REACT
    // --------------------------------------------------------

    if (
      features.statusReact === true &&
      typeof sock.sendMessage ===
        "function"
    ) {
      try {
        await sock.sendMessage(
          "status@broadcast",
          {
            react: {
              text: "🔥",
              key: message.key
            }
          }
        );

        console.log(
          `⚡ STATUS REACTION SENT [${sessionId}]`
        );

      } catch (error) {
        console.warn(
          `⚠️ STATUS REACTION ERROR [${sessionId}]:`,
          error?.message ||
          error
        );
      }
    }

  } catch (error) {
    console.error(
      `❌ STATUS ACTIONS ERROR [${sessionId}]`,
      error?.stack ||
      error?.message ||
      error
    );
  }
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
// SEND COMMAND ERROR
// ============================================================

async function sendCommandError(
  sock,
  chatId,
  commandName,
  error
) {
  try {

    if (
      !sock ||
      !chatId
    ) {
      return;
    }

    const errorText =
      "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
      "┃       ❌ COMMAND ERROR\n" +
      "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

      `⚙️ Kòmand: ${PREFIX}${commandName}\n\n` +

      "Bot la jwenn kòmand lan, men li pa kapab fini ekzekisyon an.\n\n" +

      "🔧 Verifye:\n" +
      "• Paramèt kòmand lan\n" +
      "• Configuration bot la\n" +
      "• Permission bot la\n" +
      "• Service/API kòmand lan\n\n" +

      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "🚀 TECH BY TOPFEROS MD\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

    await sock.sendMessage(
      chatId,
      {
        text: errorText
      }
    );

    console.log(
      `📤 COMMAND ERROR RESPONSE SENT: ${PREFIX}${commandName}`
    );

  } catch (sendError) {

    console.error(
      "❌ FAILED TO SEND COMMAND ERROR:",
      sendError?.stack ||
      sendError?.message ||
      sendError
    );
  }
}

// ============================================================
// UNKNOWN COMMAND RESPONSE
// ============================================================

async function sendUnknownCommand(
  sock,
  chatId,
  commandName
) {
  try {

    if (
      !sock ||
      !chatId
    ) {
      return;
    }

    const unknownText =
      "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
      "┃       ❓ UNKNOWN COMMAND\n" +
      "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

      `❌ Kòmand ${PREFIX}${commandName} pa egziste.\n\n` +

      `📖 Ekri ${PREFIX}menu pou wè tout kòmand disponib yo.\n\n` +

      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "🚀 TECH BY TOPFEROS MD\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

    await sock.sendMessage(
      chatId,
      {
        text: unknownText
      }
    );

  } catch (error) {

    console.error(
      "❌ UNKNOWN COMMAND RESPONSE ERROR:",
      error?.message ||
      error
    );
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
    // CHAT ID
    // --------------------------------------------------------

    const chatId =
      getChatId(message);

    if (!chatId) {
      return;
    }

    // --------------------------------------------------------
    // AUTOMATIC STATUS SYSTEM
    // --------------------------------------------------------
    // Status pa bezwen prefix.
    // Save / Send / Anrejistre fèt otomatikman.
    // --------------------------------------------------------

    if (
      chatId ===
      "status@broadcast"
    ) {

      // Pa trete pwòp Status bot la
      if (
        message?.key?.fromMe
      ) {
        console.log(
          `⏭️ STATUS IGNORED [${sessionId}] — fromMe`
        );

        return;
      }

      if (
        statusSystem &&
        typeof
          statusSystem.handleAutoStatus ===
          "function"
      ) {

        try {

          await statusSystem.handleAutoStatus({
            sock,
            message,
            sessionId,
            chatId,
            config
          });

          console.log(
            `✅ STATUS AUTO SAVE/SEND COMPLETED [${sessionId}]`
          );

        } catch (statusError) {

          console.error(
            `❌ STATUS AUTO SAVE/SEND ERROR [${sessionId}]`,
            statusError?.stack ||
            statusError?.message ||
            statusError
          );
        }

      } else {

        console.warn(
          "⚠️ STATUS SYSTEM NOT AVAILABLE"
        );
      }

      return;
    }

    // --------------------------------------------------------
    // IGNORE BOT'S OWN NORMAL MESSAGE
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

      await sendUnknownCommand(
        sock,
        chatId,
        commandName
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

      sock,

      message,

      msg:
        message,

      sessionId,

      chatId,

      sender:
        getSender(message),

      isGroup:
        isGroupMessage(
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

    try {

      await command.execute(
        context
      );

      console.log(
        `✅ COMMAND COMPLETED [${sessionId}]: ${PREFIX}${commandName}`
      );

    } catch (commandError) {

      console.error(
        `❌ COMMAND EXECUTION ERROR [${sessionId}] [${PREFIX}${commandName}]`,
        commandError?.stack ||
        commandError?.message ||
        commandError
      );

      await sendCommandError(
        sock,
        chatId,
        commandName,
        commandError
      );
    }

  } catch (error) {

    console.error(
      `❌ HANDLE MESSAGE ERROR [${
        sessionId || "unknown"
      }]`,
      error?.stack ||
      error?.message ||
      error
    );

    // --------------------------------------------------------
    // GLOBAL HANDLER ERROR RESPONSE
    // --------------------------------------------------------

    try {

      const chatId =
        getChatId(message);

      if (
        sock &&
        chatId &&
        chatId !== "status@broadcast"
      ) {

        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ Yon erè rive pandan bot la t ap trete kòmand lan.\n\n" +
              "🔧 Tanpri eseye ankò."
          }
        );
      }

    } catch (sendError) {

      console.error(
        "❌ GLOBAL ERROR RESPONSE FAILED:",
        sendError?.message ||
        sendError
      );
    }
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

// ╔════════════════════════════════════════════════════╗
// ║             🚀 TECH BY TOPFEROS MD               ║
// ╚════════════════════════════════════════════════════╝