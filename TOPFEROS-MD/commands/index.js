"use strict";

const fs =
  require("fs");

const path =
  require("path");

const COMMANDS_DIR =
  __dirname;

const commands =
  new Map();

const commandFiles =
  new Map();

/* ============================================================
   NORMALIZE
============================================================ */

function normalize(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

/* ============================================================
   LOAD COMMANDS
============================================================ */

function loadCommands() {
  commands.clear();
  commandFiles.clear();

  let files = [];

  try {
    files =
      fs.readdirSync(
        COMMANDS_DIR
      );
  } catch (error) {
    console.error(
      "❌ COMMANDS DIRECTORY ERROR:",
      error?.message ||
      error
    );

    return commands;
  }

  for (
    const file of files
  ) {
    /* --------------------------------------------------------
       ONLY JS FILES
    -------------------------------------------------------- */

    if (
      !file
        .toLowerCase()
        .endsWith(".js")
    ) {
      continue;
    }

    /* Pa chaje index.js */

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
      /* ------------------------------------------------------
         CLEAR CACHE
      ------------------------------------------------------ */

      delete require.cache[
        require.resolve(
          filePath
        )
      ];

      const command =
        require(
          filePath
        );

      if (
        !command ||
        typeof command !==
          "object"
      ) {
        console.warn(
          `⚠️ COMMAND INVALID: ${file}`
        );

        continue;
      }

      /* ------------------------------------------------------
         SPECIAL LEGACY PARRAIN COMMAND
      ------------------------------------------------------ */

      if (
        typeof command.name !==
          "string" &&
        typeof command.handleParrainCommand ===
          "function"
      ) {
        command.name =
          "parrain";

        command.aliases = [
          "parrainage",
          "referral",
          "ref"
        ];

        command.execute =
          command.handleParrainCommand;
      }

      /* ------------------------------------------------------
         COMMAND NAME
      ------------------------------------------------------ */

      if (
        typeof command.name !==
          "string"
      ) {
        console.warn(
          `⚠️ COMMAND SAN NAME: ${file}`
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

      /* ------------------------------------------------------
         EXECUTE
      ------------------------------------------------------ */

      if (
        typeof command.execute !==
          "function"
      ) {
        console.warn(
          `⚠️ COMMAND SAN EXECUTE: ${file}`
        );

        continue;
      }

      /* ------------------------------------------------------
         DUPLICATE
      ------------------------------------------------------ */

      if (
        commands.has(
          name
        )
      ) {
        console.warn(
          `⚠️ COMMAND DUPLICATE: .${name} — ${file}`
        );

        continue;
      }

      /* ------------------------------------------------------
         REGISTER COMMAND
      ------------------------------------------------------ */

      commands.set(
        name,
        command
      );

      commandFiles.set(
        name,
        file
      );

      console.log(
        `✅ COMMAND LOADED: .${name} ← ${file}`
      );

      /* ------------------------------------------------------
         ALIASES
      ------------------------------------------------------ */

      if (
        Array.isArray(
          command.aliases
        )
      ) {
        for (
          const alias of
            command.aliases
        ) {
          const aliasName =
            normalize(
              alias
            );

          if (!aliasName) {
            continue;
          }

          if (
            commands.has(
              aliasName
            )
          ) {
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
    `📦 COMMAND SYSTEM READY: ${commands.size} COMMANDS / ALIASES`
  );

  return commands;
}

/* ============================================================
   GET COMMAND
============================================================ */

function getCommand(
  name
) {
  return (
    commands.get(
      normalize(
        name
      )
    ) || null
  );
}

/* ============================================================
   GET COMMANDS
============================================================ */

function getCommands() {
  return commands;
}

/* ============================================================
   GET UNIQUE COMMAND LIST
============================================================ */

function getCommandList() {
  const unique =
    new Map();

  for (
    const command of
      commands.values()
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
      !unique.has(
        name
      )
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

/* ============================================================
   GET COMMAND FILE
============================================================ */

function getCommandFile(
  name
) {
  return (
    commandFiles.get(
      normalize(
        name
      )
    ) || null
  );
}

/* ============================================================
   RELOAD
============================================================ */

function reloadCommands() {
  return loadCommands();
}

/* ============================================================
   INITIAL LOAD
============================================================ */

loadCommands();

/* ============================================================
   EXPORTS
============================================================ */

module.exports = {
  loadCommands,
  reloadCommands,
  getCommand,
  getCommands,
  getCommandList,
  getCommandFile
};