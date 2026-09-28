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
// 🎨 TOPFEROS MD — STICKER COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function downloadMedia(message, type) {
  const stream =
    await downloadContentFromMessage(
      message,
      type
    );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 SAFE FILE NAME
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
      "⚠️ STICKER CLEANUP ERROR:",
      error?.message || error
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 CREATE STICKER
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

  const imageMessage =
    message
      ?.message
      ?.imageMessage;

  const videoMessage =
    message
      ?.message
      ?.videoMessage;

  const quotedImage =
    quotedMessage
      ?.imageMessage;

  const quotedVideo =
    quotedMessage
      ?.videoMessage;

  const source =
    imageMessage ||
    videoMessage ||
    quotedImage ||
    quotedVideo;

  let mediaType = null;
  let isVideo = false;

  if (
    imageMessage ||
    quotedImage
  ) {
    mediaType = "image";
  } else if (
    videoMessage ||
    quotedVideo
  ) {
    mediaType = "video";
    isVideo = true;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY MEDIA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!source || !mediaType) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ *TOPFEROS MD*\n\n" +
          "Voye oswa reply sou yon 🖼️ imaj " +
          "oswa 🎥 videyo pou kreye sticker."
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
      isVideo
        ? "input.mp4"
        : "input.jpg"
    );

  const outputFile =
    path.join(
      tempDir,
      "sticker.webp"
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
    // 📥 DOWNLOAD MEDIA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const buffer =
      await downloadMedia(
        source,
        mediaType
      );

    if (
      !buffer ||
      !buffer.length
    ) {
      throw new Error(
        "Media download failed."
      );
    }

    fs.writeFileSync(
      inputFile,
      buffer
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎬 CONVERT TO WEBP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const ffmpegArgs = [
      "-y",
      "-i",
      inputFile
    ];

    if (isVideo) {
      ffmpegArgs.push(
        "-t",
        "6",
        "-an",
        "-vf",
        "fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0",
        "-c:v",
        "libwebp",
        "-loop",
        "0",
        "-preset",
        "default",
        "-q:v",
        "60"
      );
    } else {
      ffmpegArgs.push(
        "-vf",
        "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0",
        "-frames:v",
        "1",
        "-c:v",
        "libwebp",
        "-quality",
        "80",
        "-compression_level",
        "6"
      );
    }

    ffmpegArgs.push(
      outputFile
    );

    await execFileAsync(
      "ffmpeg",
      ffmpegArgs
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔎 VERIFY OUTPUT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      !fs.existsSync(outputFile)
    ) {
      throw new Error(
        "FFmpeg pa kreye sticker WebP la."
      );
    }

    const stickerBuffer =
      fs.readFileSync(
        outputFile
      );

    if (
      !stickerBuffer.length
    ) {
      throw new Error(
        "Sticker buffer la vid."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎨 SEND STICKER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendMessage(
      chatId,
      {
        sticker:
          stickerBuffer
      },
      {
        quoted: message
      }
    );

  } catch (error) {
    console.error(
      "❌ STICKER ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    try {
      await sock.sendMessage(
        chatId,
        {
          text:
`╭━━━〔 🎨 STICKER 〕━━━╮
┃
┃ ❌ Mwen pa kapab kreye
┃    sticker la kounye a.
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
  name: "sticker",

  aliases: [
    "s",
    "stiker"
  ],

  description:
    "Transfòme yon imaj oswa videyo an sticker WhatsApp.",

  usage:
    ".sticker",

  execute
};