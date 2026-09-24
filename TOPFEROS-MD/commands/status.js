"use strict";

const {
  downloadContentFromMessage
} = require("@whiskeysockets/baileys");

// ============================================================
// 🦁 TOPFEROS MD — STATUS SYSTEM
// ============================================================
// 👁️ Auto Seen
// 🤖 AI Vision Reaction
// 📥 Save
// 📤 Send
// 🗂️ Anrejistre
//
// View Once pa nan fichye sa a.
// ============================================================

function getBotJid(sock) {
  if (!sock?.user?.id) return null;

  const number =
    String(sock.user.id).split(":")[0];

  return `${number}@s.whatsapp.net`;
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
    "documentWithCaptionMessage",
    "associatedChildMessage"
  ];

  while (
    current &&
    safety < 8
  ) {
    safety++;

    let found = false;

    for (const key of wrappers) {
      if (current[key]?.message) {
        current =
          current[key].message;

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
// DOWNLOAD MEDIA
// ============================================================

async function downloadMedia(
  media,
  type
) {
  if (!media || !type) {
    return null;
  }

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
}

// ============================================================
// 🤖 AI SMART STATUS REACTION
// GROQ VISION
// ============================================================

const STATUS_EMOJIS = [
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
  "🍕"
];

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
// 🤖 ANALYZE STATUS IMAGE WITH GROQ VISION
// ============================================================

async function analyzeStatusWithAI({
  message,
  media,
  buffer,
  config = {}
}) {
  if (
    !buffer ||
    !Buffer.isBuffer(buffer)
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

  // WhatsApp Status image yo nòmalman piti,
  // men pa voye fichye ki twò gwo bay Vision API.
  const maxBytes =
    18 * 1024 * 1024;

  if (buffer.length > maxBytes) {
    console.warn(
      "⚠️ STATUS AI: Imaj la twò gwo pou Vision."
    );

    return null;
  }

  const base64 =
    buffer.toString("base64");

  const mime =
    getImageMime(media);

  const prompt = `
You are the smart reaction engine of TOPFEROS MD WhatsApp bot.

Analyze the WhatsApp Status IMAGE itself.
Do NOT rely only on the caption.

Choose EXACTLY ONE emoji that best matches
the main emotion, subject, action, or mood
visible in the image.

The reaction must feel natural for WhatsApp.

Allowed emojis:
${STATUS_EMOJIS.join(" ")}

Rules:
- Return ONLY valid JSON.
- Use exactly ONE emoji.
- The emoji MUST come from the allowed list.
- Never invent another emoji.
- Look at the actual image carefully.
- Consider people, facial expressions, love,
  friendship, humor, celebration, sports,
  music, food, drinks, Haiti, nature,
  animals, travel, success, sadness,
  anger, cold, disgust, danger, beauty
  and general mood.
- If the image is neutral, use 👍.
- The caption can help, but the image is primary.

Optional caption:
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

          body: JSON.stringify({
            model,

            messages: [
              {
                role: "system",

                content:
                  "You select one contextual WhatsApp reaction from an allowed emoji list. Follow the JSON output format exactly."
              },

              {
                role: "user",

                content: [
                  {
                    type: "text",
                    text: prompt
                  },

                  {
                    type: "image_url",

                    image_url: {
                      url:
                        `data:${mime};base64,${base64}`
                    }
                  }
                ]
              }
            ],

            temperature: 0.2,

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
      extractJsonObject(content);

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
          "AI contextual reaction"
        )
          .replace(
            /[\r\n]+/g,
            " "
          )
          .slice(0, 160)
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
// 🧠 SMART STATUS REACTION
// ============================================================

async function getSmartStatusReaction({
  message,
  config = {}
}) {
  try {
    const mediaData =
      getMediaMessage(message);

    // Vision aktyèlman fèt pou IMAGE.
    // Video/audio/document ap itilize fallback.
    if (
      mediaData?.type !==
      "image"
    ) {
      return {
        emoji: "👍",
        reason:
          "Status la pa yon imaj Vision."
      };
    }

    const buffer =
      await downloadMedia(
        mediaData.media,
        mediaData.type
      );

    if (!buffer) {
      return {
        emoji: "👍",
        reason:
          "Imaj la pa t disponib."
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
          "AI pa t disponib; fallback reaction."
      }
    );

  } catch (error) {
    console.warn(
      "⚠️ SMART STATUS REACTION ERROR:",
      error?.message ||
      error
    );

    return {
      emoji: "👍",
      reason:
        "Fallback reaction."
    };
  }
}

// ============================================================
// 📤 SEND MEDIA TO BOT DM
// ============================================================

async function sendMediaToBotDM({
  sock,
  type,
  media,
  buffer,
  caption
}) {
  const botJid =
    getBotJid(sock);

  if (!botJid) {
    return false;
  }

  if (type === "image") {
    await sock.sendMessage(
      botJid,
      {
        image: buffer,
        caption
      }
    );

    return true;
  }

  if (type === "video") {
    await sock.sendMessage(
      botJid,
      {
        video: buffer,
        caption,
        mimetype:
          media?.mimetype ||
          "video/mp4"
      }
    );

    return true;
  }

  if (type === "audio") {
    await sock.sendMessage(
      botJid,
      {
        audio: buffer,
        mimetype:
          media?.mimetype ||
          "audio/mpeg",
        ptt:
          media?.ptt ||
          false
      }
    );

    return true;
  }

  if (type === "document") {
    await sock.sendMessage(
      botJid,
      {
        document: buffer,
        mimetype:
          media?.mimetype ||
          "application/octet-stream",
        fileName:
          media?.fileName ||
          "status"
      }
    );

    return true;
  }

  return false;
}

// ============================================================
// 📝 TEXT STATUS TO BOT DM
// ============================================================

async function sendTextStatusToBotDM({
  sock,
  message
}) {
  const botJid =
    getBotJid(sock);

  if (!botJid) {
    return false;
  }

  const text =
    getStatusText(message);

  if (!text) {
    return false;
  }

  const sender =
    getStatusSender(message);

  await sock.sendMessage(
    botJid,
    {
      text:
        "╭━━━〔 🖼️ STATUS SAVED 〕━━━╮\n" +
        "┃\n" +
        `┃ 👤 From: ${sender}\n` +
        "┃\n" +
        `┃ 📝 ${text}\n` +
        "┃\n" +
        "┃ 📥 Save: AUTO\n" +
        "┃ 📤 Send: AUTO\n" +
        "┃ 🗂️ Anrejistre: AUTO\n" +
        "┃\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯\n" +
        "🦁 TOPFEROS MD"
    }
  );

  return true;
}

// ============================================================
// 📥 SAVE STATUS
// ============================================================

async function saveStatus(context) {
  const {
    sock,
    message
  } = context || {};

  if (
    !sock ||
    !message?.message
  ) {
    return false;
  }

  try {
    const mediaData =
      getMediaMessage(message);

    // -----------------------------
    // TEXT STATUS
    // -----------------------------
    if (!mediaData) {
      return await sendTextStatusToBotDM({
        sock,
        message
      });
    }

    const buffer =
      await downloadMedia(
        mediaData.media,
        mediaData.type
      );

    if (!buffer) {
      return false;
    }

    const sender =
      getStatusSender(message);

    const caption =
      mediaData.media?.caption ||
      "";

    const savedCaption =
      "╭━━━〔 🖼️ STATUS SAVED 〕━━━╮\n" +
      "┃\n" +
      `┃ 👤 From: ${sender}\n` +
      "┃\n" +
      `┃ 📥 Save: AUTO\n` +
      "┃ 📤 Send: AUTO\n" +
      "┃ 🗂️ Anrejistre: AUTO\n" +
      "┃\n" +
      "╰━━━━━━━━━━━━━━━━━━━━╯\n" +
      "🦁 TOPFEROS MD" +
      (caption
        ? `\n\n📝 ${caption}`
        : "");

    return await sendMediaToBotDM({
      sock,
      type:
        mediaData.type,
      media:
        mediaData.media,
      buffer,
      caption:
        savedCaption
    });

  } catch (error) {
    console.error(
      "❌ SAVE STATUS ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    return false;
  }
}

// ============================================================
// 🔄 AUTO STATUS
// ============================================================

async function handleAutoStatus(
  context
) {
  try {
    return await saveStatus(
      context
    );
  } catch (error) {
    console.error(
      "❌ AUTO STATUS ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    return false;
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
        "┃ 🤖 AI Reaction: AUTOMATIC\n" +
        "┃ 📥 Save: AUTOMATIC\n" +
        "┃ 📤 Send: AUTOMATIC\n" +
        "┃ 🗂️ Anrejistre: AUTOMATIC\n" +
        "┃ 🚫 Pa bezwen prefix\n" +
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

  aliases: [
    "savestatus"
  ],

  description:
    "Status Save / Send / Anrejistre + AI reaction otomatikman.",

  usage:
    ".status",

  execute,

  saveStatus,

  handleAutoStatus,

  getMediaMessage,

  downloadMedia,

  analyzeStatusWithAI,

  getSmartStatusReaction,

  sendMediaToBotDM,

  sendTextStatusToBotDM
};