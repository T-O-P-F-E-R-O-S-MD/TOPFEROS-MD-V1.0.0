"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                 OWNER STATISTICS                 ║
// ╚════════════════════════════════════════════════════╝

const fs = require("fs");
const path = require("path");

const DATA_DIR =
  path.join(
    __dirname,
    "..",
    "data"
  );

const STATS_FILE =
  path.join(
    DATA_DIR,
    "ownerStats.json"
  );

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(
      DATA_DIR,
      {
        recursive: true
      }
    );
  }

  if (!fs.existsSync(STATS_FILE)) {
    const initialData = {
      firstUsedAt: null,
      totalCommands: 0,
      commands: {},
      daily: {}
    };

    fs.writeFileSync(
      STATS_FILE,
      JSON.stringify(
        initialData,
        null,
        2
      )
    );
  }
}

function loadStats() {
  ensureStorage();

  try {
    const data =
      fs.readFileSync(
        STATS_FILE,
        "utf8"
      );

    return JSON.parse(data);
  } catch (error) {
    console.error(
      "[OWNER STATS] Read error:",
      error?.message ||
        error
    );

    return {
      firstUsedAt: null,
      totalCommands: 0,
      commands: {},
      daily: {}
    };
  }
}

function saveStats(stats) {
  ensureStorage();

  fs.writeFileSync(
    STATS_FILE,
    JSON.stringify(
      stats,
      null,
      2
    )
  );
}

function getTodayKey() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function recordOwnerCommand(
  commandName
) {
  const stats =
    loadStats();

  const command =
    String(
      commandName ||
        "unknown"
    )
      .trim()
      .toLowerCase();

  const now =
    new Date();

  if (!stats.firstUsedAt) {
    stats.firstUsedAt =
      now.toISOString();
  }

  stats.totalCommands =
    Number(
      stats.totalCommands ||
        0
    ) + 1;

  if (
    !stats.commands ||
    typeof stats.commands !==
      "object"
  ) {
    stats.commands = {};
  }

  stats.commands[command] =
    Number(
      stats.commands[command] ||
        0
    ) + 1;

  const today =
    getTodayKey();

  if (
    !stats.daily ||
    typeof stats.daily !==
      "object"
  ) {
    stats.daily = {};
  }

  stats.daily[today] =
    Number(
      stats.daily[today] ||
        0
    ) + 1;

  saveStats(stats);

  return getOwnerStats();
}

function getOwnerStats() {
  const stats =
    loadStats();

  let mostUsedCommand =
    "No data yet";

  let highestCount = 0;

  for (
    const [
      command,
      count
    ] of Object.entries(
      stats.commands || {}
    )
  ) {
    if (
      Number(count) >
      highestCount
    ) {
      highestCount =
        Number(count);

      mostUsedCommand =
        `.${command} (${count}x)`;
    }
  }

  const today =
    getTodayKey();

  return {
    firstUsedAt:
      stats.firstUsedAt,

    totalCommands:
      Number(
        stats.totalCommands ||
          0
      ),

    todayCommands:
      Number(
        stats.daily?.[today] ||
          0
      ),

    mostUsedCommand,

    commands:
      stats.commands || {}
  };
}

module.exports = {
  recordOwnerCommand,
  getOwnerStats
};