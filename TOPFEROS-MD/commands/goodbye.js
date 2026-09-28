"use strict";

const fs = require("fs");
const path = require("path");

const GOODBYE_FILE = path.join(
  __dirname,
  "..",
  "database",
  "goodbye.json"
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 LOAD GOODBYE SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadSettings() {
  try {
    if (!fs.existsSync(GOODBYE_FILE)) {
      return {};
    }

    return JSON.parse(
      fs.readFileSync(
        GOODBYE_FILE,
        "utf8"
      )
    );
  } catch (error) {
    console.error(
      "❌ GOODBYE LOAD ERROR:",
      error.message
    );

    return {};
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👤 GET SENDER NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getUserNumber(jid) {
  if (!jid) {
    return "Unknown";
  }

  return String(jid)
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

  return String(template)
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
// 👋 GOODBYE COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context;

  const chatId =
    message?.key?.remoteJid;

  if (
    !sock ||
    !chatId
  ) {
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👥 GROUP ONLY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (
    !chatId.endsWith("@g.us")
  ) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ *Goodbye* disponib sèlman nan group."
      },
      {
        quoted: message
      }
    );

    return;
  }

  try {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📋 GROUP METADATA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const metadata =
      await sock.groupMetadata(
        chatId
      );

    /*
     * announce === true
     * = group la nan announcement/mute mode.
     *
     * Lè li mute, .goodbye pap voye mesaj.
     */

    if (
      metadata?.announce === true
    ) {

      await sock.sendMessage(
        chatId,
        {
          text:
            "🔇 *TOPFEROS MD*\n\n" +
            "Goodbye pa disponib pandan group la sou mute."
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💾 LOAD SETTINGS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const settings =
      loadSettings();

    const groupSettings =
      settings[chatId];

    if (
      !groupSettings ||
      groupSettings.enabled !== true ||
      !groupSettings.message
    ) {

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *TOPFEROS MD*\n\n" +
            "Pa gen mesaj Goodbye ki konfigire pou group sa a.\n\n" +
            "Admin nan ka itilize:\n" +
            "`.setgoodbye <mesaj>`"
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 GET GROUP NAME
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const groupName =
      metadata?.subject ||
      "Group";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 👤 GET PERSON WHO USED THE COMMAND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const userJid =
      message?.key?.participant ||
      message?.participant ||
      message?.key?.remoteJid;

    if (!userJid) {
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 FORMAT MESSAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const text =
      formatMessage(
        groupSettings.message,
        userJid,
        groupName
      );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND GOODBYE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendMessage(
      chatId,
      {
        text,
        mentions: [
          userJid
        ]
      },
      {
        quoted: message
      }
    );

    console.log(
      `[GOODBYE] .goodbye sent | group=${chatId}`
    );

  } catch (error) {

    console.error(
      "❌ GOODBYE COMMAND ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    try {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *TOPFEROS MD*\n\n" +
            "Gen yon erè pandan Goodbye la t ap prepare."
        },
        {
          quoted: message
        }
      );
    } catch (_) {}
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "goodbye",

  aliases: [
    "bye"
  ],

  description:
    "Voye mesaj Goodbye configured pou group la.",

  usage:
    ".goodbye",

  execute
};