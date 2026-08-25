"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 TOPFEROS MD — STICKER COMMAND
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

  const imageMessage =
    message.message?.imageMessage;

  const quotedImage =
    quotedMessage?.imageMessage;

  const source =
    imageMessage || quotedImage;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY IMAGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!source) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Voye oswa reply sou yon imaj pou kreye sticker."
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
        "topferos-sticker-"
      )
    );

  const inputFile =
    path.join(
      tempDir,
      "input.jpg"
    );

  const outputFile =
    path.join(
      tempDir,
      "sticker.webp"
    );

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⏳ DOWNLOAD IMAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendPresenceUpdate(
      "composing",
      chatId
    );

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
      inputFile,
      Buffer.concat(chunks)
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🖼️ CONVERT IMAGE TO WEBP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-i",
        inputFile,

        "-vf",
        "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0",

        "-c:v",
        "libwebp",

        "-quality",
        "80",

        "-compression_level",
        "6",

        outputFile
      ]
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎨 SEND STICKER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const stickerBuffer =
      fs.readFileSync(outputFile);

    await sock.sendMessage(
      chatId,
      {
        sticker: stickerBuffer
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
      "❌ STICKER ERROR:",
      error.message
    );

    await sock.sendPresenceUpdate(
      "paused",
      chatId
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 🎨 STICKER 〕━━━╮
┃
┃ ❌ Mwen pa kapab kreye
┃    sticker la kounye a.
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
        "⚠️ Sticker cleanup error:",
        cleanupError.message
      );
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "sticker",
  aliases: ["s", "stiker"],
  description: "Transfòme yon imaj an sticker WhatsApp.",
  usage: ".sticker",
  execute
};