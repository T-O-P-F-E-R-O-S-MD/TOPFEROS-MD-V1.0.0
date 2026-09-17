"use strict";

const fs = require("fs");
const path = require("path");

const COMMANDS_DIR = __dirname;

const commands = new Map();
const commandFiles = new Map();

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function loadCommands() {
  commands.clear();
  commandFiles.clear();

  let files;

  try {
    files = fs.readdirSync(COMMANDS_DIR);
  } catch (error) {
    console.error(
      "❌ COMMANDS DIRECTORY ERROR:",
      error.message
    );
    return commands;
  }

  for (const file of files) {
    if (
      !file.toLowerCase().endsWith(".js") ||
      file.toLowerCase() === "index.js"
    ) {
      continue;
    }

    const filePath = path.join(
      COMMANDS_DIR,
      file
    );

    try {
      delete require.cache[
        require.resolve(filePath)
      ];

      const command = require(filePath);

      // Welcome.js / Goodbye.js elatriye
      // ka pa gen execute(). Yo pa command.
      if (
        !command ||
        typeof command !== "object" ||
        typeof command.name !== "string" ||
        typeof command.execute !== "function"
      ) {
        continue;
      }

      const name = normalize(command.name);

      if (!name) {
        continue;
      }

      if (commands.has(name)) {
        console.warn(
          `⚠️ COMMAND DUPLICATE: ${name}`
        );
        continue;
      }

      commands.set(name, command);
      commandFiles.set(name, file);

      console.log(
        `✅ COMMAND LOADED: .${name} ← ${file}`
      );

      if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          const aliasName = normalize(alias);

          if (!aliasName) {
            continue;
          }

          if (commands.has(aliasName)) {
            console.warn(
              `⚠️ ALIAS DUPLICATE: .${aliasName} — ignored`
            );
            continue;
          }

          commands.set(
            aliasName,
            command
          );

          commandFiles.set(
            aliasName,
            file
          );
        }
      }
    } catch (error) {
      console.error(
        `❌ COMMAND LOAD ERROR [${file}]:`,
        error?.stack ||
        error?.message ||
        error
      );
    }
  }

  console.log(
    `📦 COMMAND SYSTEM READY: ${commands.size} names/aliases`
  );

  return commands;
}

function getCommand(name) {
  return commands.get(
    normalize(name)
  ) || null;
}

function getCommands() {
  return commands;
}

function getCommandList() {
  const unique = new Map();

  for (const command of commands.values()) {
    if (!command?.name) {
      continue;
    }

    const name = normalize(
      command.name
    );

    if (!unique.has(name)) {
      unique.set(name, command);
    }
  }

  return [...unique.values()];
}

function getCommandFile(name) {
  return commandFiles.get(
    normalize(name)
  ) || null;
}

function reloadCommands() {
  return loadCommands();
}

loadCommands();

module.exports = {
  loadCommands,
  reloadCommands,
  getCommand,
  getCommands,
  getCommandList,
  getCommandFile
};