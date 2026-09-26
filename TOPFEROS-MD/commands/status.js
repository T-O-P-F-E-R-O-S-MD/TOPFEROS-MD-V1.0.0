"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");
const { promisify } = require("util");

const {
  downloadContentFromMessage
} = require("@whiskeysockets/baileys");

const execFileAsync = promisify(execFile);

// ============================================================
// 🦁 TOPFEROS MD — AI STATUS LIKE SYSTEM
// ============================================================
// 👁️ Auto Seen
// 📸 AI Vision PHOTO
// 🎥 AI Vision VIDEO
// ❤️ AI Contextual Like
//
// AI chwazi EGZAKTEMAN 1 emoji.
//
// ❌ Auto Save       = OFF
// ❌ Auto Send       = OFF
// ❌ Auto Anrejistre = OFF
//
// Video yo analize atravè plizyè frame tanporè.
// Frame yo efase apre analiz la.
// ============================================================


// ============================================================
// STATUS SENDER
// ============================================================

function getStatusSender(message) {
  return (
    message?.key?.participant ||
    message?.participant ||
    "Unknown"
  );
}


// ============================================================
// UNWRAP STATUS MESSAGE
// ============================================================

function unwrapStatusMessage(message) {
  let current =
    message?.message ||
    message ||
    null;

  let safety = 0;

  const wrappers = [
    "ephemeralMessage",
    "viewOnceMessage",
    "viewOnceMessageV2",
    "viewOnceMessageV2Extension",
    "documentWithCaptionMessage",
    "associatedChildMessage"
  ];

  while (
    current &&
    safety < 10
  ) {
    safety++;

    let found = false;

    for (const key of wrappers) {
      if (
        current[key] &&
        typeof current[key] === "object"
      ) {
        current =
          current[key].message ||
          current[key];

        found = true;
        break;
      }
    }

    if (!found) {
      break;
    }
  }

  return current;
}


// ============================================================
// GET MEDIA
// ============================================================

function getMediaMessage(message) {
  const msg =
    unwrapStatusMessage(message);

  if (!msg) {
    return null;
  }

  if (msg.imageMessage) {
    return {
      type: "image",
      media: msg.imageMessage
    };
  }

  if (msg.videoMessage) {
    return {
      type: "video",
      media: msg.videoMessage
    };
  }

  if (msg.audioMessage) {
    return {
      type: "audio",
      media: msg.audioMessage
    };
  }

  if (msg.documentMessage) {
    return {
      type: "document",
      media: msg.documentMessage
    };
  }

  return null;
}


// ============================================================
// DOWNLOAD MEDIA TO MEMORY
// ============================================================
// Sa pa yon Save Status.
// Li download kontni an sèlman an RAM pou analiz AI.
// ============================================================

async function downloadMedia(
  media,
  type
) {
  if (!media || !type) {
    return null;
  }

  try {
    const stream =
      await downloadContentFromMessage(
        media,
        type
      );

    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);

  } catch (error) {

    console.warn(
      "⚠️ STATUS MEDIA DOWNLOAD ERROR:",
      error?.message ||
      error
    );

    return null;
  }
}


// ============================================================
// 🤖❤️ AI STATUS LIKE EMOJIS
// ============================================================

const STATUS_EMOJIS = [
  // Original
  "🥰",
  "💚",
  "😂",
  "😜",
  "🥳",
  "🤩",
  "😎",
  "😡",
  "🥶",
  "💪",
  "🙄",
  "🤮",
  "☠️",
  "💩",
  "🫶",
  "🤝",
  "👍",
  "🫵",
  "🫦",
  "🧠",
  "🏃‍♂️",
  "🙊",
  "🦇",
  "🪼",
  "🫈",
  "🦍",
  "🦥",
  "🌚",
  "💫",
  "🔥",
  "🌈",
  "🥃",
  "🍺",
  "☕",
  "🎂",
  "🤾‍♀️",
  "🤺",
  "⛹️‍♂️",
  "🏌️",
  "🏇",
  "🏄‍♀️",
  "🥇",
  "🎤",
  "🌅",
  "❤️‍🔥",
  "🇭🇹",
  "🚮",
  "❌",
  "❤️",
  "😢",
  "😱",
  "🤔",
  "👏",
  "😍",
  "🤣",
  "😭",
  "🙏",
  "✨",
  "🌸",
  "🌴",
  "🐶",
  "🐱",
  "🍕",

  // Emotion
  "😁",
  "😅",
  "😉",
  "😘",
  "😌",
  "🤗",
  "🥹",
  "😮",
  "😳",
  "😴",
  "🤒",
  "🤯",
  "😇",
  "😏",
  "🤭",
  "🥺",
  "🤤",
  "😋",
  "🤠",
  "👀",
  "🫡",
  "🗿",

  // Love
  "💖",
  "💕",
  "💓",
  "💗",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "💛",
  "🩷",
  "🩵",
  "🩶",
  "💔",
  "❤️‍🩹",
  "💋",
  "🌹",
  "🌺",
  "🌻",

  // Celebration
  "🙌",
  "💯",
  "👌",
  "✌️",
  "🤞",
  "🎉",
  "🎊",
  "🥂",
  "🍾",
  "🏆",

  // Music / entertainment
  "🎶",
  "🎵",
  "🎸",
  "📸",

  // Sport
  "⚽",
  "🏀",

  // Travel / nature
  "✈️",
  "🚗",
  "🏖️",
  "🌊",
  "☀️",
  "🌙",
  "🌧️",
  "❄️",

  // Animals
  "🐼",
  "🦁",
  "🐯",
  "🐸",
  "🐵",
  "🦋",

  // Food
  "🍔",
  "🍎",
  "🍰",
  "🍫"
];


// ============================================================
// IMAGE MIME
// ============================================================

function getImageMime(media) {
  const mime =
    String(
      media?.mimetype ||
      "image/jpeg"
    );

  return mime.startsWith("image/")
    ? mime
    : "image/jpeg";
}


// ============================================================
// GET STATUS TEXT
// ============================================================

function getStatusText(message) {
  const msg =
    unwrapStatusMessage(message);

  if (!msg) {
    return "";
  }

  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    ""
  );
}


// ============================================================
// EXTRACT JSON
// ============================================================

function extractJsonObject(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_) {}

  const match =
    String(text).match(
      /\{[\s\S]*\}/
    );

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]);
  } catch (_) {
    return null;
  }
}


// ============================================================
// TEMP DIRECTORY
// ============================================================

async function createTempDirectory() {
  const dir =
    path.join(
      os.tmpdir(),
      `topferos-status-${crypto.randomBytes(6).toString("hex")}`
    );

  await fs.promises.mkdir(
    dir,
    {
      recursive: true
    }
  );

  return dir;
}


// ============================================================
// DELETE TEMP DIRECTORY
// ============================================================

async function removeTempDirectory(dir) {
  if (!dir) {
    return;
  }

  try {
    await fs.promises.rm(
      dir,
      {
        recursive: true,
        force: true
      }
    );
  } catch (_) {}
}


// ============================================================
// CHECK FFMPEG
// ============================================================

async function hasFFmpeg() {
  try {
    await execFileAsync(
      "ffmpeg",
      [
        "-version"
      ],
      {
        timeout: 5000
      }
    );

    return true;

  } catch (_) {
    return false;
  }
}


// ============================================================
// EXTRACT VIDEO FRAMES
// ============================================================
// Nou pran 3 frame:
// 00%
// 50%
// 90%
//
// Sa pèmèt AI wè diferan moman nan video a.
// ============================================================

async function extractVideoFrames(
  videoBuffer
) {
  if (
    !videoBuffer ||
    !Buffer.isBuffer(videoBuffer)
  ) {
    return [];
  }

  const ffmpegAvailable =
    await hasFFmpeg();

  if (!ffmpegAvailable) {

    console.warn(
      "⚠️ STATUS VIDEO: ffmpeg pa disponib sou hosting lan."
    );

    return [];
  }

  let tempDir = null;

  try {

    tempDir =
      await createTempDirectory();

    const inputPath =
      path.join(
        tempDir,
        "status.mp4"
      );

    const outputPattern =
      path.join(
        tempDir,
        "frame-%02d.jpg"
      );

    await fs.promises.writeFile(
      inputPath,
      videoBuffer
    );

    // --------------------------------------------------------
    // Extract 3 representative frames.
    // FPS=1/3 means approximately one frame every 3 seconds,
    // then -frames:v 3 limits it to 3 frames.
    // --------------------------------------------------------

    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-i",
        inputPath,
        "-vf",
        "fps=1/3,scale=768:-2",
        "-frames:v",
        "3",
        "-q:v",
        "5",
        outputPattern
      ],
      {
        timeout: 30000,
        maxBuffer:
          1024 * 1024
      }
    );

    const files =
      await fs.promises.readdir(
        tempDir
      );

    const frameFiles =
      files
        .filter(
          file =>
            /^frame-\d+\.jpg$/i.test(
              file
            )
        )
        .sort();

    const frames = [];

    for (
      const file of frameFiles
    ) {

      const framePath =
        path.join(
          tempDir,
          file
        );

      const buffer =
        await fs.promises.readFile(
          framePath
        );

      if (
        buffer &&
        buffer.length
      ) {
        frames.push(buffer);
      }
    }

    return frames;

  } catch (error) {

    console.warn(
      "⚠️ STATUS VIDEO FRAME ERROR:",
      error?.message ||
      error
    );

    return [];

  } finally {

    await removeTempDirectory(
      tempDir
    );
  }
}


// ============================================================
// 🤖 ANALYZE STATUS WITH AI
// ============================================================

async function analyzeStatusWithAI({
  message,
  media,
  buffer,
  buffers,
  config = {}
}) {

  const imageBuffers =
    Array.isArray(buffers) &&
    buffers.length
      ? buffers
      : buffer
        ? [buffer]
        : [];

  if (
    !imageBuffers.length
  ) {
    return null;
  }

  const apiUrl =
    config?.ai?.apiUrl ||
    process.env.AI_API_URL ||
    "https://api.groq.com/openai/v1/chat/completions";

  const apiKey =
    config?.ai?.apiKey ||
    process.env.AI_API_KEY ||
    "";

  const model =
    config?.ai?.visionModel ||
    process.env.AI_VISION_MODEL ||
    "qwen/qwen3.8-27b";

  if (!apiKey) {

    console.warn(
      "⚠️ STATUS AI: AI_API_KEY pa configure."
    );

    return null;
  }

  const caption =
    media?.caption ||
    getStatusText(message) ||
    "";

  const maxBytes =
    18 * 1024 * 1024;

  for (
    const item of imageBuffers
  ) {
    if (
      !Buffer.isBuffer(item) ||
      item.length > maxBytes
    ) {
      console.warn(
        "⚠️ STATUS AI: Yon image/frame twò gwo."
      );

      return null;
    }
  }

  // ----------------------------------------------------------
  // CREATE IMAGE CONTENT
  // ----------------------------------------------------------

  const imageContents =
    imageBuffers.map(
      imageBuffer => ({
        type: "image_url",

        image_url: {
          url:
            `data:image/jpeg;base64,${imageBuffer.toString("base64")}`
        }
      })
    );

  const isVideo =
    media?.mimetype &&
    String(
      media.mimetype
    ).startsWith(
      "video/"
    );

  const prompt = `
You are the smart contextual Like engine
of TOPFEROS MD WhatsApp bot.

Analyze this WhatsApp Status carefully.

${
  isVideo
    ? `
This Status is a VIDEO.

The images provided are representative
frames extracted from the video.

Use ALL frames together to understand
the video's overall content and mood.
`
    : `
This Status is a PHOTO.

Analyze the image itself carefully.
`
}

Your job is to choose the ONE emoji that
should be used as the bot's Like on this Status.

Do NOT choose randomly.

Look carefully at:
- people
- facial expressions
- emotions
- love
- friendship
- humor
- celebration
- sports
- music
- food
- drinks
- Haiti
- nature
- animals
- travel
- success
- sadness
- anger
- cold
- disgust
- danger
- beauty
- fashion
- lifestyle
- general mood

The caption can help,
but visual content is primary.

Allowed emojis:
${STATUS_EMOJIS.join(" ")}

STRICT RULES:
- Return ONLY valid JSON.
- Return exactly ONE emoji.
- The emoji MUST come from the allowed list.
- Never invent another emoji.
- Never return two emojis.
- Never return an array.
- Never return text outside JSON.
- Choose the most natural contextual Like.
- If the Status is neutral or unclear, use 👍.

Caption:
${caption || "none"}

Return exactly:

{"emoji":"👍","reason":"short reason"}
`;

  try {

    const response =
      await fetch(
        apiUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${apiKey}`
          },

          body:
            JSON.stringify({
              model,

              messages: [
                {
                  role: "system",

                  content:
                    "You are TOPFEROS MD's contextual WhatsApp Status Like AI. Choose exactly one emoji from the provided allowed list and return valid JSON only."
                },

                {
                  role: "user",

                  content: [
                    {
                      type: "text",
                      text: prompt
                    },

                    ...imageContents
                  ]
                }
              ],

              temperature:
                0.2,

              max_completion_tokens:
                200,

              response_format: {
                type: "json_object"
              },

              reasoning_effort:
                "none"
            })
        }
      );

    if (!response.ok) {

      const errorText =
        await response
          .text()
          .catch(() => "");

      console.warn(
        "⚠️ STATUS AI API ERROR:",
        response.status,
        errorText
      );

      return null;
    }

    const data =
      await response.json();

    const content =
      data?.choices?.[0]
        ?.message?.content ||
      "";

    const result =
      extractJsonObject(
        content
      );

    const emoji =
      result?.emoji;

    if (
      !emoji ||
      !STATUS_EMOJIS.includes(
        emoji
      )
    ) {

      console.warn(
        "⚠️ STATUS AI returned invalid emoji:",
        content
      );

      return null;
    }

    return {
      emoji,

      reason:
        String(
          result?.reason ||
          "AI contextual Like"
        )
          .replace(
            /[\r\n]+/g,
            " "
          )
          .slice(
            0,
            160
          )
    };

  } catch (error) {

    console.warn(
      "⚠️ STATUS AI ANALYSIS ERROR:",
      error?.message ||
      error
    );

    return null;
  }
}


// ============================================================
// 🧠 GET AI STATUS LIKE
// ============================================================

async function getSmartStatusReaction({
  message,
  config = {}
}) {

  try {

    const mediaData =
      getMediaMessage(
        message
      );

    if (!mediaData) {

      return {
        emoji: "👍",
        reason:
          "Status media pa disponib."
      };
    }

    // ========================================================
    // 📸 PHOTO STATUS
    // ========================================================

    if (
      mediaData.type ===
      "image"
    ) {

      const buffer =
        await downloadMedia(
          mediaData.media,
          "image"
        );

      if (!buffer) {

        return {
          emoji: "👍",
          reason:
            "Foto a pa disponib."
        };
      }

      const result =
        await analyzeStatusWithAI({
          message,
          media:
            mediaData.media,
          buffer,
          config
        });

      return (
        result || {
          emoji: "👍",
          reason:
            "AI pa disponib; fallback Like."
        }
      );
    }


    // ========================================================
    // 🎥 VIDEO STATUS
    // ========================================================

    if (
      mediaData.type ===
      "video"
    ) {

      // ------------------------------------------------------
      // FIRST: TRY WHATSAPP VIDEO THUMBNAIL
      // ------------------------------------------------------

      const thumbnail =
        mediaData.media
          ?.jpegThumbnail;

      if (
        thumbnail &&
        Buffer.isBuffer(
          thumbnail
        )
      ) {

        const result =
          await analyzeStatusWithAI({
            message,

            media:
              mediaData.media,

            buffers: [
              thumbnail
            ],

            config
          });

        if (result) {
          return result;
        }
      }

      // ------------------------------------------------------
      // SECOND: DOWNLOAD VIDEO TEMPORARILY
      // ------------------------------------------------------

      const videoBuffer =
        await downloadMedia(
          mediaData.media,
          "video"
        );

      if (!videoBuffer) {

        return {
          emoji: "👍",
          reason:
            "Video a pa disponib; fallback Like."
        };
      }

      // ------------------------------------------------------
      // EXTRACT MULTIPLE FRAMES
      // ------------------------------------------------------

      const frames =
        await extractVideoFrames(
          videoBuffer
        );

      // ------------------------------------------------------
      // AI ANALYZE FRAMES
      // ------------------------------------------------------

      if (
        frames.length
      ) {

        const result =
          await analyzeStatusWithAI({
            message,

            media:
              mediaData.media,

            buffers:
              frames,

            config
          });

        if (result) {
          return result;
        }
      }

      return {
        emoji: "👍",
        reason:
          "Video a pa kapab analize; fallback Like."
      };
    }


    // ========================================================
    // OTHER MEDIA
    // ========================================================

    return {
      emoji: "👍",
      reason:
        "Kalite Status sa a pa sipòte pou AI Vision."
    };

  } catch (error) {

    console.warn(
      "⚠️ SMART STATUS LIKE ERROR:",
      error?.message ||
      error
    );

    return {
      emoji: "👍",
      reason:
        "Fallback Like."
    };
  }
}


// ============================================================
// .status COMMAND
// ============================================================

async function execute(context) {

  const {
    sock,
    message
  } = context || {};

  const chatId =
    message?.key?.remoteJid;

  if (!chatId) {
    return;
  }

  await sock.sendMessage(
    chatId,
    {
      text:
        "╭━━━〔 🖼️ STATUS 〕━━━╮\n" +
        "┃\n" +
        "┃ 👁️ Seen: AUTOMATIC\n" +
        "┃ 📸 Photo AI Like: ON\n" +
        "┃ 🎥 Video AI Like: ON\n" +
        "┃ ❤️ AI chwazi 1 emoji\n" +
        "┃ 📥 Save: OFF\n" +
        "┃ 📤 Send: OFF\n" +
        "┃ 🗂️ Anrejistre: OFF\n" +
        "┃ 🚫 Pa bezwen prefix pou Status\n" +
        "┃\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯"
    },
    {
      quoted: message
    }
  );
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  name: "status",

  aliases: [],

  description:
    "AI chwazi emoji Like pou Foto ak Video Status otomatikman.",

  usage:
    ".status",

  execute,

  getMediaMessage,

  downloadMedia,

  analyzeStatusWithAI,

  getSmartStatusReaction,

  getStatusText,

  getStatusSender,

  extractVideoFrames
};