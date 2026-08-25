"use strict";

const fs = require("fs");
const path = require("path");
const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👋 TOPFEROS MD — SETWELCOME COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const WELCOME_FILE = path.join(
  __dirname,
  "..",
  "database",
  "welcome.json"
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 LOAD WELCOME SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadWelcomeSettings() {
  try {
    if (!fs.existsSync(WELCOME_FILE)) {
      return {};
    }

    const data =
      fs.readFileSync(
        WELCOME_FILE,
        "utf8"
      );

    return JSON.parse(data);
  } catch (error) {
    console.error(
      "❌ WELCOME LOAD ERROR:",
      error.message
    );

    return {};
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 SAVE WELCOME SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function saveWelcomeSettings(settings) {
  const databaseDir =
    path.dirname(WELCOME_FILE);

  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(
      databaseDir,
      {
        recursive: true
      }
    );
  }

  fs.writeFileSync(
    WELCOME_FILE,
    JSON.stringify(
      settings,
      null,
      2
    )
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message,
    text = ""
  } = context;

  const chatId =
    message?.key?.remoteJid;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY GROUP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (
    !chatId ||
    !chatId.endsWith("@g.us")
  ) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Command sa disponib sèlman nan group."
      },
      {
        quoted: message
      }
    );

    return;
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 👑 CHECK BOT ADMIN
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const metadata =
      await sock.groupMetadata(
        chatId
      );

    const participants =
      metadata.participants || [];

    const botNumber =
      sock.user?.id?.split(":")[0];

    const botParticipant =
      participants.find(
        participant =>
          participant.id?.split(":")[0] ===
          botNumber
      );

    if (
      !botParticipant ||
      (
        botParticipant.admin !== "admin" &&
        botParticipant.admin !== "superadmin"
      )
    ) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Bot la dwe admin pou li kapab chanje welcome group la."
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 GET MESSAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const welcomeMessage =
      text.trim();

    if (!welcomeMessage) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Mete mesaj welcome ou vle itilize a."
        },
        {
          quoted: message
        }
      );

      return;
    }

    if (welcomeMessage.length > 1000) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Mesaj welcome lan twò long. Maksimòm 1000 karaktè."
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💾 SAVE GROUP SETTINGS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const settings =
      loadWelcomeSettings();

    settings[chatId] = {
      enabled: true,
      message: welcomeMessage,
      updatedAt:
        new Date().toISOString()
    };

    saveWelcomeSettings(
      settings
    );

    const developer =
      config.bot?.developer ||
      "TOPFEROS TECH";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND RESULT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 👋 SET WELCOME 〕━━━╮
┃
┃ ✅ Welcome message aktive.
┃
┃ 📝 Mesaj:
┃ ${welcomeMessage}
┃
┃ 💾 Settings yo sove.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${developer}`
      },
      {
        quoted: message
      }
    );

  } catch (error) {

    console.error(
      "❌ SETWELCOME ERROR:",
      error.message
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 👋 SET WELCOME 〕━━━╮
┃
┃ ❌ Mwen pa kapab sove
┃    welcome message la.
┃
┃ ⚠️ Verifye database la
┃    ak permissions bot la.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${config.bot?.developer || "TOPFEROS TECH"}`
      },
      {
        quoted: message
      }
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "setwelcome",
  aliases: ["welcome", "setwel"],
  description:
    "Konfigire mesaj welcome pou group la.",
  usage:
    ".setwelcome <mesaj>",
  execute
};