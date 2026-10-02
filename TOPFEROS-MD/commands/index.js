"use strict";

// ============================================================
// TOPFEROS MD V1.0.0
// COMMAND MANAGER
// ============================================================

const fs = require("fs");
const path = require("path");

// ============================================================
// COMMAND STORAGE
// ============================================================

const commands = new Map();
const aliases = new Map();

// ============================================================
// FILES THAT MUST NOT LOAD AS COMMANDS
// ============================================================
//
// viewonce.js = sistèm View Once entèn
// parrain.js  = ansyen command ki ranplase pa .pair
//
// Yo pa dwe parèt kòm commands.
// ============================================================

const HELPERS = new Set([
  "index.js",
  "welcome.js",
  "viewonce.js",
  "parrain.js"
]);

// ============================================================
// LOAD ALL COMMANDS
// ============================================================

function loadCommands() {

  commands.clear();
  aliases.clear();

  const dir = __dirname;

  let files = [];

  try {

    files = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".js"))
      .filter((file) => !HELPERS.has(file));

  } catch (error) {

    console.error(
      "❌ COMMAND DIRECTORY ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    return commands;
  }

  for (const file of files) {

    const fullPath =
      path.join(dir, file);

    try {

      // Clear require cache
      delete require.cache[
        require.resolve(fullPath)
      ];

      const command =
        require(fullPath);

      // --------------------------------------------------------
      // VALIDATE COMMAND
      // --------------------------------------------------------

      if (
        !command ||
        typeof command.name !== "string" ||
        typeof command.execute !== "function"
      ) {

        console.warn(
          `⚠️ COMMAND SKIP [${file}] — name/execute manquant`
        );

        continue;
      }

      const name =
        command.name
          .trim()
          .toLowerCase();

      if (!name) {

        console.warn(
          `⚠️ COMMAND SKIP [${file}] — command name vid`
        );

        continue;
      }

      // --------------------------------------------------------
      // REGISTER COMMAND
      // --------------------------------------------------------

      if (commands.has(name)) {

        console.warn(
          `⚠️ DUPLICATE COMMAND [${name}] — ${file}`
        );

        continue;
      }

      commands.set(
        name,
        command
      );

      console.log(
        `✅ COMMAND LOADED: ${name}`
      );

      // --------------------------------------------------------
      // REGISTER ALIASES
      // --------------------------------------------------------

      const commandAliases =
        Array.isArray(command.aliases)
          ? command.aliases
          : [];

      for (const alias of commandAliases) {

        const aliasName =
          String(alias || "")
            .trim()
            .toLowerCase();

        if (!aliasName) {
          continue;
        }

        // Pa kite alias ranplase yon vrè command
        if (
          commands.has(aliasName) ||
          aliases.has(aliasName)
        ) {

          console.warn(
            `⚠️ ALIAS SKIP [${aliasName}] — deja itilize`
          );

          continue;
        }

        aliases.set(
          aliasName,
          name
        );

        console.log(
          `   ↳ ALIAS: ${aliasName} -> ${name}`
        );
      }

    } catch (error) {

      console.error(
        `❌ COMMAND LOAD ERROR [${file}]`,
        error?.stack ||
        error?.message ||
        error
      );
    }
  }

  console.log(
    `📦 COMMANDS READY: ${commands.size}`
  );

  console.log(
    `🔗 ALIASES READY: ${aliases.size}`
  );

  return commands;
}

// ============================================================
// GET COMMAND
// ============================================================

function getCommand(name) {

  const key =
    String(name || "")
      .trim()
      .toLowerCase();

  if (!key) {
    return null;
  }

  // Command dirèk
  if (commands.has(key)) {
    return commands.get(key);
  }

  // Alias
  const resolvedName =
    aliases.get(key);

  if (!resolvedName) {
    return null;
  }

  return (
    commands.get(resolvedName) ||
    null
  );
}

// ============================================================
// HAS COMMAND
// ============================================================

function hasCommand(name) {

  return Boolean(
    getCommand(name)
  );
}

// ============================================================
// GET ALL COMMANDS
// ============================================================

function getAllCommands() {

  return Array.from(
    commands.values()
  );
}

// ============================================================
// GET COMMAND NAMES
// ============================================================

function getCommandNames() {

  return Array.from(
    commands.keys()
  );
}

// ============================================================
// GET ALIASES
// ============================================================

function getAliases() {

  return new Map(
    aliases
  );
}

// ============================================================
// RELOAD COMMANDS
// ============================================================

function reloadCommands() {

  console.log(
    "🔄 RELOADING COMMANDS..."
  );

  return loadCommands();
}

// ============================================================
// INITIAL LOAD
// ============================================================

loadCommands();

// ============================================================
// EXPORTS
// ============================================================

module.exports = {

  loadCommands,

  reloadCommands,

  getCommand,

  hasCommand,

  getAllCommands,

  getCommandNames,

  getAliases

};