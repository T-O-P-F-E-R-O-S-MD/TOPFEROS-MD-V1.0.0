"use strict";

const fs = require("fs");
const path = require("path");

const COMMANDS_DIR = __dirname;

const commands = new Map();
const commandFiles = new Map();

/* ===============================
   NORMALIZE
================================ */

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/* ===============================
   LOAD COMMANDS
================================ */

function loadCommands() {
  commands.clear();
  commandFiles.clear();

  let files;

  try {
    files =
      fs.readdirSync(
        COMMANDS_DIR
      );
  } catch (error) {
    console.error(
      "❌ COMMANDS DIRECTORY ERROR:",
      error?.message || error
    );

    return commands;
  }

  for (const file of files) {
    if (
      !file
        .toLowerCase()
        .endsWith(".js")
    ) {
      continue;
    }

    /* Pa chaje Index.js li menm */

    if (
      file.toLowerCase() ===
      "index.js"
    ) {
      continue;
    }

    const filePath =
      path.join(
        COMMANDS_DIR,
        file
      );

    try {
      delete require.cache[
        require.resolve(filePath)
      ];

      const command =
        require(filePath);

      if (
        !command ||
        typeof command !==
          "object"
      ) {
        continue;
      }

      if (
        typeof command.name !==
          "string"
      ) {
        console.warn(
          `⚠️ COMMAND SAN NAME: ${file}`
        );

        continue;
      }

      if (
        typeof command.execute !==
          "function"
      ) {
        console.warn(
          `⚠️ COMMAND SAN EXECUTE: ${file}`
        );

        continue;
      }

      const name =
        normalize(
          command.name
        );

      if (!name) {
        continue;
      }

      if (
        commands.has(name)
      ) {
        console.warn(
          `⚠️ COMMAND DUPLICATE: ${name}`
        );

        continue;
      }

      commands.set(
        name,
        command
      );

      commandFiles.set(
        name,
        file
      );

      console.log(
        `✅ COMMAND LOADED: ${PREFIX_LOG(name)} ← ${file}`
      );

      /* ALIASES */

      if (
        Array.isArray(
          command.aliases
        )
      ) {
        for (
          const alias
          of command.aliases
        ) {
          const aliasName =
            normalize(alias);

          if (!aliasName) {
            continue;
          }

          if (
            commands.has(
              aliasName
            )
          ) {
            console.warn(
              `⚠️ ALIAS DUPLICATE: .${aliasName}`
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

          console.log(
            `   ↳ ALIAS: .${aliasName}`
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
    `📦 COMMAND SYSTEM READY: ${commands.size} commands/aliases`
  );

  return commands;
}

/* ===============================
   LOG PREFIX
================================ */

function PREFIX_LOG(name) {
  return `.${name}`;
}

/* ===============================
   GET COMMAND
================================ */

function getCommand(name) {
  return (
    commands.get(
      normalize(name)
    ) || null
  );
}

/* ===============================
   GET ALL
================================ */

function getCommands() {
  return commands;
}

/* ===============================
   UNIQUE COMMAND LIST
================================ */

function getCommandList() {
  const unique =
    new Map();

  for (
    const command
    of commands.values()
  ) {
    if (
      !command?.name
    ) {
      continue;
    }

    const name =
      normalize(
        command.name
      );

    if (
      !unique.has(name)
    ) {
      unique.set(
        name,
        command
      );
    }
  }

  return [
    ...unique.values()
  ];
}

/* ===============================
   COMMAND FILE
================================ */

function getCommandFile(name) {
  return (
    commandFiles.get(
      normalize(name)
    ) || null
  );
}

/* ===============================
   RELOAD
================================ */

function reloadCommands() {
  return loadCommands();
}

/* ===============================
   INITIAL LOAD
================================ */

loadCommands();

/* ===============================
   EXPORT
================================ */

module.exports = {
  loadCommands,
  reloadCommands,
  getCommand,
  getCommands,
  getCommandList,
  getCommandFile
};