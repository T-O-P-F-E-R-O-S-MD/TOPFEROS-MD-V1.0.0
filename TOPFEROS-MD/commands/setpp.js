"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ TOPFEROS MD — SETPP COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context;

  const chatId =
    message?.key?.remoteJid;

  if (!chatId || !chatId.endsWith("@g.us")) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Command sa disponib sèlman nan group."
      },
      {
        quoted: message
      }
    );

    return;
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📋 GET GROUP INFORMATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const metadata =
      await sock.groupMetadata(chatId);

    const participants =
      metadata.participants || [];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🤖 CHECK BOT ADMIN STATUS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const botNumber =
      sock.user?.id?.split(":")[0];

    const botParticipant =
      participants.find(
        participant =>
          participant.id?.split(":")[0] === botNumber
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
            "❌ Bot la dwe admin pou li kapab chanje foto group la."
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🖼️ GET IMAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const imageMessage =
      message.message?.imageMessage;

    const quotedMessage =
      message.message?.extendedTextMessage
        ?.contextInfo?.quotedMessage;

    const quotedImage =
      quotedMessage?.imageMessage;

    const source =
      imageMessage || quotedImage;

    if (!source) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Voye yon foto oswa reply sou yon foto pou sèvi kòm foto group la."
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📥 DOWNLOAD IMAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const tempDir =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "topferos-setpp-"
        )
      );

    const imageFile =
      path.join(
        tempDir,
        "group-profile.jpg"
      );

    try {
      const stream =
        await sock.downloadContentFromMessage(
          source,
          "image"
        );

      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      fs.writeFileSync(
        imageFile,
        Buffer.concat(chunks)
      );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🖼️ UPDATE GROUP PROFILE PHOTO
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      await sock.updateProfilePicture(
        chatId,
        {
          url: imageFile
        }
      );

      const developer =
        config.bot?.developer ||
        "TOPFEROS TECH";

      await sock.sendMessage(
        chatId,
        {
          text: `╭━━━〔 🖼️ SETPP 〕━━━╮
┃
┃ ✅ Foto group la chanje.
┃
┃ 👥 Nouvo foto a mete
┃    kòm foto profil group la.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${developer}`
        },
        {
          quoted: message
        }
      );

    } finally {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🧹 CLEAN TEMP FILE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      try {
        if (fs.existsSync(imageFile)) {
          fs.unlinkSync(imageFile);
        }

        if (fs.existsSync(tempDir)) {
          fs.rmdirSync(tempDir);
        }
      } catch (cleanupError) {
        console.error(
          "⚠️ SETPP CLEANUP ERROR:",
          cleanupError.message
        );
      }
    }

  } catch (error) {

    console.error(
      "❌ SETPP ERROR:",
      error.message
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 🖼️ SETPP 〕━━━╮
┃
┃ ❌ Mwen pa kapab chanje
┃    foto group la.
┃
┃ ⚠️ Verifye permissions
┃    bot la nan group la.
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
  name: "setpp",
  aliases: ["setphoto", "gcpp"],
  description: "Chanje foto profil group WhatsApp la.",
  usage: ".setpp",
  execute
};