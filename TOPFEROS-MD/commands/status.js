"use strict";

const {
  downloadContentFromMessage
} = require("@whiskeysockets/baileys");

// ============================================================
// 🦁 TOPFEROS MD — AI STATUS LIKE SYSTEM
// ============================================================
// 👁️ Auto Seen
// 🤖 AI Vision
// ❤️ AI Contextual Like
//
// ❌ Auto Save       = OFF
// ❌ Auto Send       = OFF
// ❌ Auto Anrejistre = OFF
//
// AI a chwazi 1 emoji nan STATUS_EMOJIS.
// Emoji sa a se Like ki ale sou Status la.
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
// Sa sèvi sèlman pou AI Vision analize imaj la.
// Li pa sove Status la.
// Li pa voye Status la nan DM.
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
// 🤖❤️ AI STATUS LIKE EMOJIS
// ============================================================
// AI a dwe chwazi egzakteman 1 emoji ladan lis sa a.
// Nou pa retire ansyen emoji yo.
// Nou ajoute lòt emoji pou AI a gen plis chwa.
// ============================================================

const STATUS_EMOJIS = [
  // Original emojis
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

  // Extra emotion emojis
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

  // Extra love emojis
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
// 🤖 ANALYZE STATUS IMAGE WITH AI
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
You are the smart contextual Like engine
of TOPFEROS MD WhatsApp bot.

Analyze the WhatsApp Status IMAGE itself.

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
- general mood

The caption may help, but the IMAGE is primary.

Allowed emojis:
${STATUS_EMOJIS.join(" ")}

Rules:
- Return ONLY valid JSON.
- Return exactly ONE emoji.
- The emoji MUST come from the allowed list.
- Never invent another emoji.
- Never return two emojis.
- Choose the most natural WhatsApp reaction.
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

          body: JSON.stringify({
            model,

            messages: [
              {
                role: "system",

                content:
                  "Choose exactly one contextual WhatsApp Like emoji from the allowed list. Return valid JSON only."
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
          "AI contextual Like"
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
// 🧠 GET AI STATUS LIKE
// ============================================================

async function getSmartStatusReaction({
  message,
  config = {}
}) {
  try {
    const mediaData =
      getMediaMessage(message);

    // Vision analize IMAGE.
    // Lòt kalite Status itilize fallback 👍.
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
          "Imaj la pa disponib."
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
        "┃ 🤖 AI Like: AUTOMATIC\n" +
        "┃ ❤️ AI chwazi emoji a\n" +
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
    "AI chwazi emoji Like Status otomatikman.",

  usage:
    ".status",

  execute,

  getMediaMessage,

  downloadMedia,

  analyzeStatusWithAI,

  getSmartStatusReaction,

  getStatusText,

  getStatusSender
};