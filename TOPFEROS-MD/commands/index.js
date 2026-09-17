"use strict";

const fs = require("fs");
const path = require("path");

const COMMANDS_DIR = __dirname;

const commands = new Map();
const loadedFiles = new Set();

function normalizeName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\.js$/i, "");
}

function loadCommands() {
  commands.clear();
  loadedFiles.clear();

  let files = [];

  try {
    files = fs.readdirSync(COMMANDS_DIR);
  } catch (error) {
    console.error("❌ COMMAND DIRECTORY ERROR:", error.message);
    return commands;
  }

  for (const file of files) {
    if (!file.toLowerCase().endsWith(".js")) {
      continue;
    }

    // Pa chaje Index.js li menm
    if (file.toLowerCase() === "index.js") {
      continue;
    }

    const fullPath = path.join(COMMANDS_DIR, file);

    try {
      delete require.cache[require.resolve(fullPath)];

      const command = require(fullPath);

      // Helper files tankou Welcome.js / Goodbye.js
      // pa obligatwa pou yo gen name/execute.
      if (
        !command ||
        typeof command !== "object" ||
        typeof command.name !== "string" ||
        typeof command.execute !== "function"
      ) {
        continue;
      }

      const name = normalizeName(command.name);

      if (!name) {
        continue;
      }

      if (commands.has(name)) {
        console.warn(
          `⚠️ COMMAND DUPLICATE: ${name} (${file})`
        );
        continue;
      }

      commands.set(name, command);
      loadedFiles.add(file);

      // Aliases
      if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          const aliasName = normalizeName(alias);

          if (!aliasName) {
            continue;
          }

          if (commands.has(aliasName)) {
            console.warn(
              `⚠️ ALIAS DUPLICATE: ${aliasName} — ` +
              `kenbe premye command lan.`
            );
            continue;
          }

          commands.set(aliasName, command);
        }
      }

      console.log(
        `✅ COMMAND LOADED: ${name} ← ${file}`
      );

    } catch (error) {
      console.error(
        `❌ COMMAND LOAD ERROR [${file}]:`,
        error.message
      );
    }
  }

  console.log(
    `📦 TOTAL COMMANDS LOADED: ${commands.size}`
  );

  return commands;
}

function getCommand(name) {
  const key = normalizeName(name);

  if (!key) {
    return null;
  }

  return commands.get(key) || null;
}

function getCommands() {
  return commands;
}

function getCommandList() {
  const unique = new Map();

  for (const command of commands.values()) {
    if (!command?.name) continue;

    const name = normalizeName(command.name);

    if (!unique.has(name)) {
      unique.set(name, command);
    }
  }

  return [...unique.values()];
}

function reloadCommands() {
  return loadCommands();
}

// Chaje command yo depi kòmansman
loadCommands();

module.exports = {
  loadCommands,
  reloadCommands,
  getCommand,
  getCommands,
  getCommandList
};