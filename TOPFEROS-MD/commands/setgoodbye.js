"use strict";

const fs = require("fs");
const path = require("path");
const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👋 TOPFEROS MD — SETGOODBYE COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const GOODBYE_FILE = path.join(
  __dirname,
  "..",
  "database",
  "goodbye.json"
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 LOAD GOODBYE SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadGoodbyeSettings() {
  try {
    if (!fs.existsSync(GOODBYE_FILE)) {
      return {};
    }

    const data = fs.readFileSync(
      GOODBYE_FILE,
      "utf8"
    );

    return JSON.parse(data);
  } catch (error) {
    console.error(
      "❌ GOODBYE LOAD ERROR:",
      error.message
    );

    return {};
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 SAVE GOODBYE SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function saveGoodbyeSettings(settings) {
  const databaseDir =
    path.dirname(GOODBYE_FILE);

  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(
      databaseDir,
      {
        recursive: true
      }
    );
  }

  fs.writeFileSync(
    GOODBYE_FILE,
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
      await sock.groupMetadata(chatId);

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
            "❌ Bot la dwe admin pou li kapab chanje goodbye group la."
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 GET GOODBYE MESSAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const goodbyeMessage =
      text.trim();

    if (!goodbyeMessage) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Mete mesaj goodbye ou vle itilize a."
        },
        {
          quoted: message
        }
      );

      return;
    }

    if (goodbyeMessage.length > 1000) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Mesaj goodbye lan twò long. Maksimòm 1000 karaktè."
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
      loadGoodbyeSettings();

    settings[chatId] = {
      enabled: true,
      message: goodbyeMessage,
      updatedAt:
        new Date().toISOString()
    };

    saveGoodbyeSettings(
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
        text: `╭━━━〔 👋 SET GOODBYE 〕━━━╮
┃
┃ ✅ Goodbye message aktive.
┃
┃ 📝 Mesaj:
┃ ${goodbyeMessage}
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
      "❌ SETGOODBYE ERROR:",
      error.message
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 👋 SET GOODBYE 〕━━━╮
┃
┃ ❌ Mwen pa kapab sove
┃    goodbye message la.
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
  name: "setgoodbye",
  aliases: ["goodbye", "setbye"],
  description:
    "Konfigire mesaj goodbye pou group la.",
  usage:
    ".setgoodbye <mesaj>",
  execute
};