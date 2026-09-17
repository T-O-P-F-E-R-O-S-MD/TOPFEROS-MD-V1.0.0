const fs = require("fs");
const path = require("path");

const commands = new Map();
const aliases = new Map();

const HELPERS = new Set([
  "index.js",
  "welcome.js",
  "goodbye.js"
]);

function loadCommands() {
  commands.clear();
  aliases.clear();

  const dir = __dirname;

  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".js"))
    .filter((file) => !HELPERS.has(file));

  for (const file of files) {
    const fullPath = path.join(dir, file);

    try {
      delete require.cache[require.resolve(fullPath)];

      const command = require(fullPath);

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

      const name = command.name.toLowerCase();

      commands.set(name, command);

      const commandAliases = Array.isArray(command.aliases)
        ? command.aliases
        : [];

      for (const alias of commandAliases) {
        const aliasName = String(alias).toLowerCase();

        if (
          !aliases.has(aliasName) &&
          !commands.has(aliasName)
        ) {
          aliases.set(aliasName, name);
        }
      }

      console.log(`✅ COMMAND LOADED: ${name}`);
    } catch (error) {
      console.error(
        `❌ COMMAND LOAD ERROR [${file}]`,
        error
      );
    }
  }

  return commands;
}

function getCommand(name) {
  const key = String(name || "").toLowerCase();

  const resolvedName = commands.has(key)
    ? key
    : aliases.get(key);

  if (!resolvedName) {
    return null;
  }

  return commands.get(resolvedName) || null;
}

loadCommands();

module.exports = {
  commands,
  aliases,
  loadCommands,
  getCommand
};