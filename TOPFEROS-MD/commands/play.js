"use strict";

/*
|--------------------------------------------------------------------------
| TOPFEROS MD V2.0.0
| PLAY COMMAND
|--------------------------------------------------------------------------
|
| Usage:
|   .play song <direct-url>
|   .play video <direct-url>
|
| The command downloads authorized media, converts it into a
| WhatsApp-friendly format, sends it, then removes temporary files.
|
|--------------------------------------------------------------------------
*/

const fs = require("fs");

const {
  downloadMedia,
  isMediaFile,
  removeFile
} = require("../services/mediaDownloader");

const {
  convertToAudio,
  convertToVideo
} = require("../services/mediaConverter");

/*
|--------------------------------------------------------------------------
| SEND AUDIO
|--------------------------------------------------------------------------
*/

async function sendAudio(
  ctx,
  filePath
) {
  await ctx.sock.sendMessage(
    ctx.jid,
    {
      audio:
        fs.readFileSync(
          filePath
        ),
      mimetype:
        "audio/mpeg",
      ptt:
        false
    }
  );
}

/*
|--------------------------------------------------------------------------
| SEND VIDEO
|--------------------------------------------------------------------------
*/

async function sendVideo(
  ctx,
  filePath
) {
  await ctx.sock.sendMessage(
    ctx.jid,
    {
      video:
        fs.readFileSync(
          filePath
        ),
      mimetype:
        "video/mp4",
      caption:
        "🎬 TOPFEROS MD MEDIA"
    }
  );
}

/*
|--------------------------------------------------------------------------
| PLAY COMMAND
|--------------------------------------------------------------------------
*/

async function playCommand(
  ctx
) {
  if (!ctx.text) {
    await ctx.send(
      [
        "🎵 TOPFEROS MD PLAY",
        "",
        "Usage:",
        `${ctx.prefix}play song <direct-url>`,
        `${ctx.prefix}play video <direct-url>`,
        "",
        "Example:",
        `${ctx.prefix}play song https://example.com/song.mp3`,
        `${ctx.prefix}play video https://example.com/video.mp4`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Media URL is required."
    };
  }

  const parts =
    ctx.text
      .trim()
      .split(/\s+/);

  const type =
    String(
      parts.shift() || ""
    )
      .toLowerCase()
      .trim();

  const url =
    parts.join(" ").trim();

  if (
    ![
      "song",
      "audio",
      "music",
      "video"
    ].includes(type)
  ) {
    await ctx.send(
      [
        "❌ Invalid media type.",
        "",
        "Use:",
        `${ctx.prefix}play song <direct-url>`,
        `${ctx.prefix}play video <direct-url>`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Invalid media type."
    };
  }

  if (!url) {
    await ctx.send(
      [
        "❌ Media URL is required.",
        "",
        `Example: ${ctx.prefix}play ${type} https://example.com/media`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Media URL is missing."
    };
  }

  let downloadedFile =
    null;

  let convertedFile =
    null;

  try {
    await ctx.send(
      [
        "⏳ TOPFEROS MD MEDIA",
        "",
        "📥 Downloading media...",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    const download =
      await downloadMedia(
        url
      );

    downloadedFile =
      download.path;

    if (
      !isMediaFile(
        downloadedFile
      )
    ) {
      throw new Error(
        "Downloaded media file is invalid."
      );
    }

    await ctx.send(
      [
        "⚙️ TOPFEROS MD MEDIA",
        "",
        "🔄 Preparing media for WhatsApp...",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    if (
      [
        "song",
        "audio",
        "music"
      ].includes(type)
    ) {
      convertedFile =
        await convertToAudio(
          downloadedFile
        );

      await sendAudio(
        ctx,
        convertedFile
      );
    } else {
      convertedFile =
        await convertToVideo(
          downloadedFile
        );

      await sendVideo(
        ctx,
        convertedFile
      );
    }

    return {
      success: true,
      type,
      path:
        convertedFile
    };
  } catch (error) {
    console.error(
      "[PLAY COMMAND] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ TOPFEROS MD MEDIA",
        "",
        "The media could not be downloaded or converted.",
        "",
        `Reason: ${error?.message || "Unknown error."}`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      error:
        error?.message ||
        String(error)
    };
  } finally {
    if (
      convertedFile
    ) {
      removeFile(
        convertedFile
      );
    }

    if (
      downloadedFile
    ) {
      removeFile(
        downloadedFile
      );
    }
  }
}

module.exports = {
  playCommand
};