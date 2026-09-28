"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const { promisify } = require("util");

const {
  downloadContentFromMessage
} = require("@whiskeysockets/baileys");

const execFileAsync =
  promisify(execFile);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ TOPFEROS MD — TOIMG COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function downloadSticker(
  sticker
) {
  const stream =
    await downloadContentFromMessage(
      sticker,
      "sticker"
    );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAN TEMP FILES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanupFiles(
  tempDir,
  inputFile,
  outputFile
) {
  try {
    if (
      inputFile &&
      fs.existsSync(inputFile)
    ) {
      fs.unlinkSync(inputFile);
    }

    if (
      outputFile &&
      fs.existsSync(outputFile)
    ) {
      fs.unlinkSync(outputFile);
    }

    if (
      tempDir &&
      fs.existsSync(tempDir)
    ) {
      fs.rmSync(
        tempDir,
        {
          recursive: true,
          force: true
        }
      );
    }
  } catch (error) {
    console.error(
      "⚠️ TOIMG CLEANUP ERROR:",
      error?.message || error
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ CONVERT STICKER TO IMAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context || {};

  const chatId =
    message?.key?.remoteJid;

  if (
    !sock ||
    !message ||
    !chatId
  ) {
    return;
  }

  const quotedMessage =
    message
      ?.message
      ?.extendedTextMessage
      ?.contextInfo
      ?.quotedMessage;

  const stickerMessage =
    message
      ?.message
      ?.stickerMessage;

  const quotedSticker =
    quotedMessage
      ?.stickerMessage;

  const source =
    stickerMessage ||
    quotedSticker;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY STICKER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!source) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ *TOPFEROS MD*\n\n" +
          "Voye oswa reply sou yon sticker " +
          "pou transfòme li an imaj."
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
    // ⏳ PROCESSING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendPresenceUpdate(
      "composing",
      chatId
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📥 DOWNLOAD STICKER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const stickerBuffer =
      await downloadSticker(
        source
      );

    if (
      !stickerBuffer ||
      !stickerBuffer.length
    ) {
      throw new Error(
        "Sticker download failed."
      );
    }

    fs.writeFileSync(
      inputFile,
      stickerBuffer
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

        "-c:v",
        "png",

        outputFile
      ]
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔎 VERIFY OUTPUT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      !fs.existsSync(outputFile)
    ) {
      throw new Error(
        "FFmpeg pa kreye imaj PNG la."
      );
    }

    const imageBuffer =
      fs.readFileSync(
        outputFile
      );

    if (
      !imageBuffer.length
    ) {
      throw new Error(
        "Imaj PNG la vid."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND IMAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendMessage(
      chatId,
      {
        image:
          imageBuffer,

        caption:
          "🖼️ *TOPFEROS MD*\n\n" +
          "✅ Sticker la transfòme " +
          "an imaj avèk siksè.\n\n" +
          "🚀 🦁 TOPFEROS MD"
      },
      {
        quoted: message
      }
    );

  } catch (error) {
    console.error(
      "❌ TOIMG ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    try {
      await sock.sendMessage(
        chatId,
        {
          text:
`╭━━━〔 🖼️ TOIMG 〕━━━╮
┃
┃ ❌ Mwen pa kapab
┃    konvèti sticker la.
┃
┃ ⚠️ Verifye FFmpeg la
┃    enstale sou server la.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 🦁 TOPFEROS MD`
        },
        {
          quoted: message
        }
      );
    } catch (_) {}

  } finally {
    try {
      await sock.sendPresenceUpdate(
        "paused",
        chatId
      );
    } catch (_) {}

    cleanupFiles(
      tempDir,
      inputFile,
      outputFile
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "toimg",

  aliases: [
    "toimage",
    "img"
  ],

  description:
    "Transfòme yon sticker an imaj.",

  usage:
    ".toimg",

  execute
};