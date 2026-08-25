"use strict";

const fs = require("fs");
const path = require("path");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👋 TOPFEROS MD — WELCOME HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const WELCOME_FILE = path.join(
  __dirname,
  "..",
  "database",
  "welcome.json"
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 LOAD SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadSettings() {
  try {
    if (!fs.existsSync(WELCOME_FILE)) {
      return {};
    }

    return JSON.parse(
      fs.readFileSync(
        WELCOME_FILE,
        "utf8"
      )
    );
  } catch (error) {
    console.error(
      "❌ WELCOME LOAD ERROR:",
      error.message
    );

    return {};
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👤 GET USER NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getUserNumber(jid) {
  if (!jid) {
    return "Unknown";
  }

  return jid
    .split("@")[0]
    .split(":")[0];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 FORMAT MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatMessage(
  template,
  userJid,
  groupName
) {
  const userNumber =
    getUserNumber(userJid);

  return template
    .replace(
      /@user/gi,
      `@${userNumber}`
    )
    .replace(
      /@group/gi,
      groupName || "Group"
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👋 SEND WELCOME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendWelcome({
  sock,
  chatId,
  userJid
}) {
  if (!sock || !chatId || !userJid) {
    return;
  }

  try {
    const settings =
      loadSettings();

    const groupSettings =
      settings[chatId];

    if (
      !groupSettings ||
      groupSettings.enabled !== true ||
      !groupSettings.message
    ) {
      return;
    }

    const metadata =
      await sock.groupMetadata(
        chatId
      );

    const groupName =
      metadata.subject ||
      "Group";

    const text =
      formatMessage(
        groupSettings.message,
        userJid