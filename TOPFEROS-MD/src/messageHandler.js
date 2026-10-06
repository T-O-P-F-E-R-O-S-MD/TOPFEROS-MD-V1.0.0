"use strict";

const {
  getContentType
} = require("@whiskeysockets/baileys");

const config = require("./config");

const {
  attachStatusHandler
} = require("./statusHandler");

/*
|--------------------------------------------------------------------------
| TOPFEROS MD V2.0.0
| MESSAGE HANDLER
|--------------------------------------------------------------------------
|
| This file handles incoming WhatsApp messages and commands.
|
| AI Status Reaction is NOT implemented here.
| It is handled by:
|
| services/aiReactionService.js
|            ↓
| src/statusHandler.js
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| STATUS HANDLER REGISTRY
|--------------------------------------------------------------------------
|
| We attach the status handler only once per socket.
|
|--------------------------------------------------------------------------
*/

const attachedSockets =
  new WeakSet();

/*
|--------------------------------------------------------------------------
| COMMAND REGISTRY
|--------------------------------------------------------------------------
*/

const commands =
  new Map();

/*
|--------------------------------------------------------------------------
| REGISTER COMMAND
|--------------------------------------------------------------------------
*/

function registerCommand(
  name,
  handler,
  options = {}
) {
  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    throw new Error(
      "Command name is required."
    );
  }

  if (
    typeof handler !==
    "function"
  ) {
    throw new Error(
      `Handler for .${name} must be a function.`
    );
  }

  const commandName =
    name
      .trim()
      .toLowerCase()
      .replace(/^\./, "");

  commands.set(
    commandName,
    {
      handler,

      aliases:
        Array.isArray(
          options.aliases
        )
          ? options.aliases.map(
              (alias) =>
                String(alias)
                  .toLowerCase()
                  .replace(
                    /^\./,
                    ""
                  )
            )
          : [],

      description:
        options.description ||
        "",

      usage:
        options.usage ||
        `.${commandName}`,

      category:
        options.category ||
        "GENERAL"
    }
  );
}

/*
|--------------------------------------------------------------------------
| REGISTER ALIAS
|--------------------------------------------------------------------------
*/

function findCommand(
  commandName
) {
  const normalized =
    String(commandName || "")
      .trim()
      .toLowerCase()
      .replace(/^\./, "");

  if (
    commands.has(normalized)
  ) {
    return {
      name: normalized,
      command:
        commands.get(normalized)
    };
  }

  for (
    const [
      name,
      command
    ] of commands
  ) {
    if (
      command.aliases.includes(
        normalized
      )
    ) {
      return {
        name,
        command
      };
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| EXTRACT MESSAGE TEXT
|--------------------------------------------------------------------------
*/

function extractMessageText(
  message
) {
  if (!message) {
    return "";
  }

  const type =
    getContentType(message);

  if (
    type ===
    "conversation"
  ) {
    return (
      message.conversation ||
      ""
    );
  }

  if (
    type ===
    "extendedTextMessage"
  ) {
    return (
      message.extendedTextMessage
        ?.text ||
      ""
    );
  }

  if (
    type ===
    "imageMessage"
  ) {
    return (
      message.imageMessage
        ?.caption ||
      ""
    );
  }

  if (
    type ===
    "videoMessage"
  ) {
    return (
      message.videoMessage
        ?.caption ||
      ""
    );
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| GET MESSAGE TYPE
|--------------------------------------------------------------------------
*/

function getMessageType(
  message
) {
  if (!message) {
    return null;
  }

  return getContentType(
    message
  );
}

/*
|--------------------------------------------------------------------------
| GET CHAT JID
|--------------------------------------------------------------------------
*/

function getChatJid(
  message
) {
  return (
    message?.key
      ?.remoteJid ||
    ""
  );
}

/*
|--------------------------------------------------------------------------
| GET SENDER JID
|--------------------------------------------------------------------------
*/

function getSenderJid(
  message
) {
  if (
    message?.key?.participant
  ) {
    return (
      message.key.participant
    );
  }

  return (
    message?.key?.remoteJid ||
    ""
  );
}

/*
|--------------------------------------------------------------------------
| GET BOT JID
|--------------------------------------------------------------------------
*/

function getBotJid(
  sock
) {
  return (
    sock?.user?.id || ""
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE JID
|--------------------------------------------------------------------------
*/

function normalizeJid(
  jid
) {
  return String(
    jid || ""
  )
    .split(":")[0]
    .trim();
}

/*
|--------------------------------------------------------------------------
| IS BOT MESSAGE
|--------------------------------------------------------------------------
*/

function isFromBot(
  message,
  sock
) {
  if (
    message?.key?.fromMe
  ) {
    return true;
  }

  const sender =
    normalizeJid(
      getSenderJid(message)
    );

  const bot =
    normalizeJid(
      getBotJid(sock)
    );

  if (
    sender &&
    bot &&
    sender === bot
  ) {
    return true;
  }

  return false;
}

/*
|--------------------------------------------------------------------------
| IS GROUP
|--------------------------------------------------------------------------
*/

function isGroup(
  jid
) {
  return String(
    jid || ""
  ).endsWith("@g.us");
}

/*
|--------------------------------------------------------------------------
| IS STATUS
|--------------------------------------------------------------------------
*/

function isStatus(
  jid
) {
  return (
    jid ===
    "status@broadcast"
  );
}

/*
|--------------------------------------------------------------------------
| GET PREFIX
|--------------------------------------------------------------------------
*/

function getPrefix() {
  return (
    config?.bot?.prefix ||
    "."
  );
}

/*
|--------------------------------------------------------------------------
| PARSE COMMAND
|--------------------------------------------------------------------------
*/

function parseCommand(
  text
) {
  const prefix =
    getPrefix();

  const cleanText =
    String(text || "")
      .trim();

  if (
    !cleanText.startsWith(
      prefix
    )
  ) {
    return null;
  }

  const withoutPrefix =
    cleanText
      .slice(
        prefix.length
      )
      .trim();

  if (!withoutPrefix) {
    return null;
  }

  const parts =
    withoutPrefix.split(
      /\s+/
    );

  const command =
    String(
      parts.shift() || ""
    )
      .toLowerCase();

  const args =
    parts;

  return {
    prefix,

    command,

    args,

    text:
      args.join(" "),

    raw:
      withoutPrefix
  };
}

/*
|--------------------------------------------------------------------------
| SEND TEXT
|--------------------------------------------------------------------------
*/

async function sendText(
  sock,
  jid,
  text,
  options = {}
) {
  if (!sock) {
    throw new Error(
      "WhatsApp socket is required."
    );
  }

  if (!jid) {
    throw new Error(
      "Chat JID is required."
    );
  }

  return sock.sendMessage(
    jid,
    {
      text:
        String(text || "")
    },
    options
  );
}

/*
|--------------------------------------------------------------------------
| SEND REACTION
|--------------------------------------------------------------------------
*/

async function reactToMessage(
  sock,
  message,
  emoji
) {
  if (!sock) {
    return false;
  }

  if (
    !message?.key
  ) {
    return false;
  }

  if (
    typeof emoji !==
    "string"
  ) {
    return false;
  }

  try {
    await sock.sendMessage(
      message.key.remoteJid,
      {
        react: {
          text: emoji,
          key: message.key
        }
      }
    );

    return true;
  } catch (error) {
    console.error(
      "[MESSAGE] Reaction failed:",
      error?.message ||
        error
    );

    return false;
  }
}

/*
|--------------------------------------------------------------------------
| GET MODE
|--------------------------------------------------------------------------
*/

function getBotMode() {
  return (
    config?.bot?.mode ||
    "Public"
  );
}

/*
|--------------------------------------------------------------------------
| CHECK MODE
|--------------------------------------------------------------------------
*/

function canProcessMessage(
  message
) {
  const mode =
    getBotMode()
      .toLowerCase();

  const jid =
    getChatJid(message);

  /*
   * Public:
   * Accept messages everywhere.
   */

  if (
    mode ===
    "public"
      .toLowerCase()
  ) {
    return true;
  }

  /*
   * Private:
   * Ignore group messages.
   */

  if (
    mode ===
    "privé" ||
    mode ===
    "prive"
  ) {
    return !isGroup(jid);
  }

  /*
   * Group:
   * Accept only groups.
   */

  if (
    mode ===
    "group"
  ) {
    return isGroup(jid);
  }

  /*
   * Unknown mode:
   * Default to public behavior.
   */

  return true;
}

/*
|--------------------------------------------------------------------------
| BUILD COMMAND CONTEXT
|--------------------------------------------------------------------------
*/

function buildContext(
  sock,
  message,
  parsed
) {
  const jid =
    getChatJid(message);

  const sender =
    getSenderJid(message);

  return {
    sock,

    message,

    jid,

    sender,

    isGroup:
      isGroup(jid),

    isStatus:
      isStatus(jid),

    command:
      parsed?.command ||
      null,

    args:
      parsed?.args ||
      [],

    text:
      parsed?.text ||
      "",

    prefix:
      parsed?.prefix ||
      getPrefix(),

    bot:
      config.bot,

    config,

    send:
      (text, options = {}) =>
        sendText(
          sock,
          jid,
          text,
          options
        ),

    react:
      (emoji) =>
        reactToMessage(
          sock,
          message,
          emoji
        )
  };
}

/*
|--------------------------------------------------------------------------
| DEFAULT COMMAND: MENU
|--------------------------------------------------------------------------
*/

registerCommand(
  "menu",
  async (
    ctx
  ) => {
    const menu = `
╭━━━〔 🦁 TOPFEROS MD V2.0.0 🐑 〕━━━╮
┃
┃ ✨ COMMAND MENU
┃
┃ 👥 GROUP
┃ ├─ .group
┃ ├─ .rules
┃ └─ .warn
┃
┃ 🛡️ SECURITY
┃ ├─ .antidelete
┃ ├─ .anticall
┃ ├─ .antibug
┃ └─ .antibot
┃
┃ ⚡ AUTOMATION
┃ ├─ .alwaysonline
┃ ├─ .autoreply
┃ ├─ .autoreact
┃ └─ .status
┃
┃ 🤖 AI
┃ ├─ .ai
┃ └─ .prompt
┃
┃ 🎵 MEDIA
┃ ├─ .play song
┃ ├─ .play v
┃ └─ .video
┃
┃ ⚙️ SYSTEM
┃ ├─ .language
┃ └─ .info
┃
┃ ⚙️ SETTINGS
┃ └─ .setting
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🦁 TECH BY TOPFEROS MD 🐑
`;

    await ctx.send(
      menu
    );

    return {
      success: true
    };
  },
  {
    description:
      "Display the TOPFEROS MD command menu.",

    category:
      "SYSTEM"
  }
);

/*
|--------------------------------------------------------------------------
| DEFAULT COMMAND: INFO
|--------------------------------------------------------------------------
*/

registerCommand(
  "info",
  async (
    ctx
  ) => {
    const info = `
╭━━━〔 ⚙️ BOT INFORMATION 〕━━━╮
┃
┃ 🦁 Name     : ${config.bot.name}
┃ 📦 Version  : V${config.bot.version}
┃ 🔹 Prefix   : ${config.bot.prefix}
┃ 🌐 Mode     : ${config.bot.mode}
┃ 📍 Location : ${config.bot.location}
┃ 🌎 Language : English
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🦁 TECH BY TOPFEROS MD 🐑
`;

    await ctx.send(
      info
    );

    return {
      success: true
    };
  },
  {
    description:
      "Display bot information.",

    category:
      "SYSTEM"
  }
);

/*
|--------------------------------------------------------------------------
| DEFAULT COMMAND: AI
|--------------------------------------------------------------------------
|
| The real AI provider will be connected
| when the AI service is added.
|
|--------------------------------------------------------------------------
*/

registerCommand(
  "ai",
  async (
    ctx
  ) => {
    if (!ctx.text) {
      await ctx.send(
        `🤖 Please provide a question.\n\nExample:\n.ai What is artificial intelligence?\n\n🦁 TECH BY TOPFEROS MD 🐑`
      );

      return {
        success: false
      };
    }

    await ctx.send(
      `🤖 AI REQUEST RECEIVED\n\nYour request:\n${ctx.text}\n\n⚙️ AI service is being prepared.\n\n🦁 TECH BY TOPFEROS MD 🐑`
    );

    return {
      success: true
    };
  },
  {
    description:
      "Ask the TOPFEROS AI assistant.",

    usage:
      ".ai <question>",

    category:
      "AI"
  }
);

/*
|--------------------------------------------------------------------------
| DEFAULT COMMAND: PROMPT
|--------------------------------------------------------------------------
*/

registerCommand(
  "prompt",
  async (
    ctx
  ) => {
    if (!ctx.text) {
      await ctx.send(
        `🤖 Please provide a prompt request.\n\nExample:\n.prompt Create a cinematic lion logo\n\n🦁 TECH BY TOPFEROS MD 🐑`
      );

      return {
        success: false
      };
    }

    await ctx.send(
      `🤖 PROMPT REQUEST RECEIVED\n\n${ctx.text}\n\n⚙️ Prompt AI service is being prepared.\n\n🦁 TECH BY TOPFEROS MD 🐑`
    );

    return {
      success: true
    };
  },
  {
    description:
      "Generate or improve an AI prompt.",

    usage:
      ".prompt <request>",

    category:
      "AI"
  }
);

/*
|--------------------------------------------------------------------------
| DEFAULT COMMAND: SETTING
|--------------------------------------------------------------------------
*/

registerCommand(
  "setting",
  async (
    ctx
  ) => {
    const panelUrl =
      process.env.SETTINGS_PANEL_URL ||
      "";

    if (!panelUrl) {
      await ctx.send(
        `⚙️ SETTINGS PANEL\n\nThe Settings Panel URL has not been configured yet.\n\n🦁 TECH BY TOPFEROS MD 🐑`
      );

      return {
        success: false
      };
    }

    await ctx.send(
      `⚙️ TOPFEROS MD SETTINGS\n\nOpen the Settings Panel:\n${panelUrl}\n\n🦁 TECH BY TOPFEROS MD 🐑`
    );

    return {
      success: true
    };
  },
  {
    description:
      "Open the TOPFEROS MD Settings Panel.",

    category:
      "SETTINGS"
  }
);

/*
|--------------------------------------------------------------------------
| ATTACH STATUS AI
|--------------------------------------------------------------------------
*/

function attachStatusAI(
  sock,
  options = {}
) {
  if (!sock) {
    throw new Error(
      "WhatsApp socket is required."
    );
  }

  /*
   * Prevent duplicate listeners.
   */

  if (
    attachedSockets.has(
      sock
    )
  ) {
    return false;
  }

  /*
   * Attach only when enabled.
   */

  if (
    options.enabled === false
  ) {
    return false;
  }

  attachStatusHandler(
    sock,
    {
      enabled: true
    }
  );

  attachedSockets.add(
    sock
  );

  return true;
}

/*
|--------------------------------------------------------------------------
| HANDLE MESSAGE
|--------------------------------------------------------------------------
*/

async function handleMessage(
  sock,
  message,
  sessionId
) {
  try {
    /*
     * Validate message.
     */

    if (
      !sock ||
      !message
    ) {
      return {
        success: false,
        reason:
          "Invalid message."
      };
    }

    /*
     * Ignore bot messages.
     */

    if (
      isFromBot(
        message,
        sock
      )
    ) {
      return {
        success: false,
        ignored: true,
        reason:
          "Message originated from bot."
      };
    }

    /*
     * Get chat.
     */

    const jid =
      getChatJid(
        message
      );

    /*
     * Ignore Status here.
     *
     * Status is handled by statusHandler.js.
     */

    if (
      isStatus(jid)
    ) {
      return {
        success: false,
        ignored: true,
        reason:
          "Status handled by statusHandler."
      };
    }

    /*
     * Check bot mode.
     */

    if (
      !canProcessMessage(
        message
      )
    ) {
      return {
        success: false,
        ignored: true,
        reason:
          "Message not allowed in current bot mode."
      };
    }

    /*
     * Extract text.
     */

    const messageText =
      extractMessageText(
        message.message
      );

    /*
     * Ignore empty messages.
     */

    if (
      !messageText
    ) {
      return {
        success: false,
        ignored: true,
        reason:
          "No command text."
      };
    }

    /*
     * Parse command.
     */

    const parsed =
      parseCommand(
        messageText
      );

    /*
     * Normal chat without prefix.
     *
     * Natural-language AI handling can be
     * connected later.
     */

    if (!parsed) {
      return {
        success: false,
        ignored: true,
        reason:
          "Not a command."
      };
    }

    /*
     * Find command.
     */

    const found =
      findCommand(
        parsed.command
      );

    /*
     * Unknown command.
     */

    if (!found) {
      await sendText(
        sock,
        jid,
        `❌ Unknown command: ${getPrefix()}${parsed.command}\n\n📖 Type ${getPrefix()}menu to see available commands.\n\n🦁 TECH BY TOPFEROS MD 🐑`
      );

      return {
        success: false,
        reason:
          "Unknown command."
      };
    }

    /*
     * Build command context.
     */

    const context =
      buildContext(
        sock,
        message,
        parsed
      );

    /*
     * Execute command.
     */

    const result =
      await found.command.handler(
        context
      );

    return {
      success: true,

      command:
        found.name,

      result,

      sessionId:
        sessionId || null
    };
  } catch (error) {
    console.error(
      "[MESSAGE HANDLER] Error:",
      error?.stack ||
        error
    );

    try {
      const jid =
        getChatJid(
          message
        );

      if (jid) {
        await sendText(
          sock,
          jid,
          `❌ An error occurred while processing your request.\n\n🦁 TECH BY TOPFEROS MD 🐑`
        );
      }
    } catch {
      /*
       * Do not throw another error while
       * attempting to report an error.
       */
    }

    return {
      success: false,

      error:
        error?.message ||
        String(error)
    };
  }
}

/*
|--------------------------------------------------------------------------
| GET REGISTERED COMMANDS
|--------------------------------------------------------------------------
*/

function getCommands() {
  const result = [];

  for (
    const [
      name,
      command
    ] of commands
  ) {
    result.push({
      name,

      aliases:
        [...command.aliases],

      description:
        command.description,

      usage:
        command.usage,

      category:
        command.category
    });
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  handleMessage,

  registerCommand,

  findCommand,

  getCommands,

  parseCommand,

  extractMessageText,

  getMessageType,

  getChatJid,

  getSenderJid,

  isGroup,

  isStatus,

  isFromBot,

  sendText,

  reactToMessage,

  attachStatusAI
};