commands/index.js

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                 COMMAND HANDLER                  ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

"use strict";

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
    String(commandName).trim().toLowerCase();

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
      // 🔄 CLEAR NODE REQUIRE CACHE
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
      // 💾 SAVE TO CACHE
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

  const {
    command,
    args = [],
    text = "",
    message,
    sock
  } = context;


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🛑 NO COMMAND
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!command) {
    return false;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔎 FIND COMMAND MODULE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const commandModule =
    findCommand(command);


  if (!commandModule) {
    return false;
  }


  try {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🧩 FUNCTION COMMAND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      typeof commandModule === "function"
    ) {

      await commandModule(
        context
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
        context
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
        context
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
        context
      );

      return true;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ▶️ PARRAIN COMMAND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //
    // commands/parrain.js itilize:
    //
    // handleParrainCommand({ sock, jid, args, config })
    //
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      typeof commandModule.handleParrainCommand ===
      "function"
    ) {

      await commandModule.handleParrainCommand({
        sock,
        jid:
          context.jid ||
          message?.key?.remoteJid,
        args,
        config:
          context.config ||
          require("../config")
      });

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

    console.error(
      `❌ Error executing ".${command}":`,
      error?.message || error
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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 TOPFEROS MD V1.0.0
// 🚀 TOPFEROS TECH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━