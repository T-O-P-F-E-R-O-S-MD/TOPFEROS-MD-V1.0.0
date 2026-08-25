"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ TOPFEROS MD — TOIMG COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context;

  const chatId =
    message?.key?.remoteJid;

  if (!sock || !message || !chatId) {
    return;
  }

  const quotedMessage =
    message.message?.extendedTextMessage?.contextInfo
      ?.quotedMessage;

  const stickerMessage =
    message.message?.stickerMessage;

  const quotedSticker =
    quotedMessage?.stickerMessage;

  const source =
    stickerMessage || quotedSticker;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY STICKER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!source) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Voye oswa reply sou yon sticker pou transfòme li an imaj."
      },
      {
        quoted: message
      }
    );

    return;
  }

  const tempDir =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "topferos-toimg-"
      )
    );

  const inputFile =
    path.join(
      tempDir,
      "sticker.webp"
    );

  const outputFile =
    path.join(
      tempDir,
      "image.png"
    );

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⏳ DOWNLOAD STICKER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendPresenceUpdate(
      "composing",
      chatId
    );

    const stream =
      await sock.downloadContentFromMessage(
        source,
        "sticker"
      );

    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    fs.writeFileSync(
      inputFile,
      Buffer.concat(chunks)
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🖼️ CONVERT WEBP → PNG
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-i",
        inputFile,
        "-frames:v",
        "1",
        outputFile
      ]
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND IMAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const imageBuffer =
      fs.readFileSync(outputFile);

    await sock.sendMessage(
      chatId,
      {
        image: imageBuffer,
        caption:
          "🖼️ Sticker la transfòme an imaj avèk siksè.\n\n🚀 TOPFEROS TECH"
      },
      {
        quoted: message
      }
    );

    await sock.sendPresenceUpdate(
      "paused",
      chatId
    );

  } catch (error) {

    console.error(
      "❌ TOIMG ERROR:",
      error.message
    );

    await sock.sendPresenceUpdate(
      "paused",
      chatId
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 🖼️ TOIMG 〕━━━╮
┃
┃ ❌ Mwen pa kapab
┃    konvèti sticker la.
┃
┃ ⚠️ Verifye FFmpeg la
┃    enstale sou server la.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 TOPFEROS TECH`
      },
      {
        quoted: message
      }
    );

  } finally {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🧹 CLEAN TEMP FILES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    try {
      if (fs.existsSync(inputFile)) {
        fs.unlinkSync(inputFile);
      }

      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
      }

      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir);
      }
    } catch (cleanupError) {
      console.error(
        "⚠️ Toimg cleanup error:",
        cleanupError.message
      );
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "toimg",
  aliases: ["toimage", "img"],
  description: "Transfòme yon sticker an imaj.",
  usage: ".toimg",
  execute
};