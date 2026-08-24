// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                 COMMAND HANDLER                  ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

"use strict";

const fs = require("fs");
const path = require("path");

const COMMANDS_DIR = __dirname;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 COMMAND CACHE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const commandCache = new Map();


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 LOAD COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadCommand(commandName) {
  const normalizedName = commandName.toLowerCase();

  if (commandCache.has(normalizedName)) {
    return commandCache.get(normalizedName);
  }

  const possibleFiles = [
    `${normalizedName}.js`,
    `${normalizedName}.command.js`
  ];

  for (const fileName of possibleFiles) {
    const filePath = path.join(
      COMMANDS_DIR,
      fileName
    );

    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      delete require.cache[
        require.resolve(filePath)
      ];

      const command = require(filePath);

      commandCache.set(
        normalizedName,
        command
      );

      return command;
    } catch (error) {
      console.error(
        `❌ Failed to load command "${normalizedName}":`,
        error.message
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
  const command = loadCommand(commandName);

  if (command) {
    return command;
  }

  return null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚡ EXECUTE COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleCommand(context) {
  const {
    command,
    args = [],
    text = "",
    message,
    sock
  } = context;

  if (!command) {
    return false;
  }

  const commandModule =
    findCommand(command);

  if (!commandModule) {
    return false;
  }

  try {
    if (
      typeof commandModule === "function"
    ) {
      await commandModule(context);
      return true;
    }

    if (
      typeof commandModule.execute === "function"
    ) {
      await commandModule.execute(context);
      return true;
    }

    if (
      typeof commandModule.run === "function"
    ) {
      await commandModule.run(context);
      return true;
    }

    if (
      typeof commandModule.handler === "function"
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

    console.warn(
      `⚠️ Command "${command}" has no executable handler.`
    );

    return false;

  } catch (error) {
    console.error(
      `❌ Error executing ".${command}":`,
      error.message
    );

    return false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAR CACHE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function clearCommandCache() {
  commandCache.clear();
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 LIST LOADED COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getLoadedCommands() {
  return Array.from(
    commandCache.keys()
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  handleCommand,
  findCommand,
  loadCommand,
  clearCommandCache,
  getLoadedCommands
};