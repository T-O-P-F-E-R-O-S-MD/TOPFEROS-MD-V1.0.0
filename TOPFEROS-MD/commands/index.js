"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║          ⚡ MULTI-SESSION COMMAND HANDLER         ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

const fs = require("fs");
const path = require("path");


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 COMMAND DIRECTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const COMMANDS_DIR = __dirname;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 COMMAND CACHE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const commandCache = new Map();


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 LOAD COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadCommand(commandName) {

  if (!commandName) {
    return null;
  }

  const normalizedName =
    String(commandName)
      .trim()
      .toLowerCase();

  if (!normalizedName) {
    return null;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚡ CHECK CACHE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (commandCache.has(normalizedName)) {
    return commandCache.get(normalizedName);
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📄 POSSIBLE COMMAND FILES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const possibleFiles = [
    `${normalizedName}.js`,
    `${normalizedName}.command.js`
  ];


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔎 FIND COMMAND FILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  for (const fileName of possibleFiles) {

    const filePath =
      path.join(
        COMMANDS_DIR,
        fileName
      );

    if (!fs.existsSync(filePath)) {
      continue;
    }


    try {

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔄 CLEAR REQUIRE CACHE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      delete require.cache[
        require.resolve(filePath)
      ];


      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📦 LOAD COMMAND
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const command =
        require(filePath);


      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 💾 SAVE CACHE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      commandCache.set(
        normalizedName,
        command
      );


      return command;

    } catch (error) {

      console.error(
        `❌ Failed to load command "${normalizedName}":`,
        error?.message || error
      );

      return null;
    }
  }


  return null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 FIND COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function findCommand(commandName) {

  return loadCommand(
    commandName
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚡ EXECUTE COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleCommand(context = {}) {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📦 GET CONTEXT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const {
    command,
    args = [],
    text = "",
    message = null,
    sock = null,

    jid = null,
    sender = null,

    sessionId = null,
    botNumber = null,

    config = require("../config")
  } = context;


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🛑 NO COMMAND
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!command) {
    return false;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🛑 NO SOCKET
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  // Multi-session mande command lan gen socket pa li.
  //
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!sock) {

    console.error(
      `❌ COMMAND "${command}": Socket session lan pa disponib.`
    );

    return false;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔎 FIND COMMAND
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const commandModule =
    findCommand(command);


  if (!commandModule) {

    console.log(
      `⚠️ COMMAND NOT FOUND: ${command}`
    );

    return false;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📦 COMPLETE SESSION CONTEXT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  // Nou kreye yon nouvo context pou command lan.
  // Sa anpeche session yo melanje.
  //
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const commandContext = {

    ...context,

    // 🤖 Socket session aktyèl la
    sock,

    // 📨 WhatsApp message
    message,

    // 📍 Chat
    jid,

    // 👤 Sender
    sender,

    // ⚡ Command
    command,

    // 📋 Arguments
    args,

    // 💬 Original text
    text,

    // 🔐 Session ID
    sessionId,

    // 📱 Bot number
    botNumber,

    // ⚙️ Config
    config
  };


  try {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 COMMAND LOG
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      "⚡ EXECUTING COMMAND"
    );

    console.log(
      `📌 COMMAND: ${command}`
    );

    console.log(
      `📱 BOT: ${botNumber || "UNKNOWN"}`
    );

    console.log(
      `🔐 SESSION: ${sessionId || "DEFAULT"}`
    );

    console.log(
      `📍 JID: ${jid || "UNKNOWN"}`
    );

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🧩 FUNCTION COMMAND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      typeof commandModule ===
      "function"
    ) {

      await commandModule(
        commandContext
      );

      return true;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ▶️ EXECUTE METHOD
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      typeof commandModule.execute ===
      "function"
    ) {

      await commandModule.execute(
        commandContext
      );

      return true;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ▶️ RUN METHOD
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      typeof commandModule.run ===
      "function"
    ) {

      await commandModule.run(
        commandContext
      );

      return true;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ▶️ HANDLER METHOD
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      typeof commandModule.handler ===
      "function"
    ) {

      await commandModule.handler(
        sock,
        message,
        args,
        text,
        commandContext
      );

      return true;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ▶️ PARRAIN COMMAND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //
    // Sipòte:
    //
    // handleParrainCommand({
    //   sock,
    //   jid,
    //   args,
    //   config
    // })
    //
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      typeof commandModule
        .handleParrainCommand ===
      "function"
    ) {

      await commandModule.handleParrainCommand({

        // 🤖 Socket session aktyèl la
        sock,

        // 📍 Chat
        jid:
          jid ||
          message?.key?.remoteJid,

        // 📋 Arguments
        args,

        // ⚙️ Config
        config,

        // 🔐 Multi-session information
        sessionId,

        // 📱 Bot number
        botNumber

      });

      return true;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ▶️ HANDLE METHOD
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      typeof commandModule.handle ===
      "function"
    ) {

      await commandModule.handle(
        commandContext
      );

      return true;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⚠️ NO HANDLER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.warn(
      `⚠️ Command "${command}" has no executable handler.`
    );

    return false;

  } catch (error) {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🚨 COMMAND ERROR
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.error(
      `❌ COMMAND ERROR: ${command}`
    );

    console.error(
      `📱 BOT: ${botNumber || "UNKNOWN"}`
    );

    console.error(
      `🔐 SESSION: ${sessionId || "DEFAULT"}`
    );

    console.error(
      error?.message || error
    );

    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    return false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAR COMMAND CACHE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function clearCommandCache() {

  commandCache.clear();

  console.log(
    "🧹 Command cache cleared."
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 GET LOADED COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getLoadedCommands() {

  return Array.from(
    commandCache.keys()
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 GET COMMAND COUNT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getCommandCount() {

  return commandCache.size;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  // 🔥 Main handler
  handle: handleCommand,

  // ⚡ Full handler
  handleCommand,

  // 🔎 Command finder
  findCommand,

  // 📥 Command loader
  loadCommand,

  // 🧹 Cache control
  clearCommandCache,

  // 📋 Loaded commands
  getLoadedCommands,

  // 📊 Command count
  getCommandCount
};


// ╔════════════════════════════════════════════════════╗
// ║                    By TOPFEROS TECH               ║
// ╚════════════════════════════════════════════════════╝