"use strict";

const axios = require("axios");

/*
|--------------------------------------------------------------------------
| AI REACTION SERVICE
|--------------------------------------------------------------------------
|
| This service is responsible ONLY for choosing the best emoji
| for a WhatsApp Status.
|
| FLOW:
|
| WhatsApp Status
|       ↓
| statusHandler.js
|       ↓
| aiReactionService.js
|       ↓
| AI analyzes the status
|       ↓
| ONE appropriate emoji
|       ↓
| statusHandler.js sends the reaction
|
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This file does NOT send the WhatsApp reaction itself.
|
| It only returns the emoji.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const AI_API_URL =
  process.env.AI_API_URL || "";

const AI_API_KEY =
  process.env.AI_API_KEY || "";

const AI_MODEL =
  process.env.AI_MODEL ||
  "default";

/*
|--------------------------------------------------------------------------
| LIMITS
|--------------------------------------------------------------------------
*/

const MAX_STATUS_TEXT_LENGTH = 4000;

const AI_TIMEOUT = Number(
  process.env.AI_REACTION_TIMEOUT || 15000
);

/*
|--------------------------------------------------------------------------
| FALLBACK EMOJI
|--------------------------------------------------------------------------
|
| If the AI service is unavailable or returns
| an invalid response, we use a neutral reaction.
|
| This is NOT the AI decision.
|
|--------------------------------------------------------------------------
*/

const FALLBACK_EMOJI = "❤️";

/*
|--------------------------------------------------------------------------
| ALLOWED EMOJIS
|--------------------------------------------------------------------------
|
| The AI may choose only one emoji from this
| controlled list.
|
| This prevents the AI from returning text,
| explanations, or multiple emojis.
|
|--------------------------------------------------------------------------
*/

const ALLOWED_EMOJIS = new Set([
  "❤️",
  "😍",
  "🥰",
  "😂",
  "🤣",
  "😭",
  "😢",
  "😔",
  "😡",
  "😮",
  "😱",
  "😢",
  "🙏",
  "👏",
  "🔥",
  "💯",
  "👍",
  "👎",
  "🤔",
  "😎",
  "🥳",
  "🎉",
  "💔",
  "✨",
  "💪",
  "🙌",
  "😇",
  "🥹",
  "🤩",
  "😴",
  "🤗",
  "😅",
  "😌",
  "🫶"
]);

/*
|--------------------------------------------------------------------------
| EMOJI NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeEmoji(value) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleaned =
    value
      .trim()
      .replace(
        /^["'`]+|["'`]+$/g,
        ""
      )
      .trim();

  /*
   * Exact match.
   */

  if (
    ALLOWED_EMOJIS.has(
      cleaned
    )
  ) {
    return cleaned;
  }

  /*
   * Sometimes an AI may answer:
   *
   * Emoji: ❤️
   *
   * Extract the allowed emoji.
   */

  for (
    const emoji of ALLOWED_EMOJIS
  ) {
    if (
      cleaned.includes(emoji)
    ) {
      return emoji;
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| STATUS TEXT CLEANUP
|--------------------------------------------------------------------------
*/

function cleanStatusText(text) {
  if (
    typeof text !== "string"
  ) {
    return "";
  }

  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(
      0,
      MAX_STATUS_TEXT_LENGTH
    );
}

/*
|--------------------------------------------------------------------------
| BUILD AI PROMPT
|--------------------------------------------------------------------------
*/

function buildReactionPrompt(
  statusText
) {
  return `
You are the emoji reaction AI for TOPFEROS MD V2.0.0.

Analyze the meaning, emotion, tone, and context of the WhatsApp Status below.

Choose exactly ONE emoji that best matches the status.

Rules:
1. Return ONLY ONE emoji.
2. Do not return words.
3. Do not explain your choice.
4. Do not return multiple emojis.
5. Choose the emoji according to the meaning of the status, not randomly.
6. If the status is about love, affection, or romance, choose an appropriate love emoji.
7. If it is funny, choose a laughing emoji.
8. If it is sad or emotional, choose an appropriate sad emoji.
9. If it is motivational or powerful, choose an appropriate positive emoji.
10. If it is a prayer or spiritual message, choose 🙏 when appropriate.
11. If it is congratulations or celebration, choose 👏, 🎉, or 🥳 when appropriate.
12. If it is surprising or shocking, choose 😮 or 😱 when appropriate.
13. If it is beautiful or impressive, choose 😍, 🤩, 🔥, or ✨ when appropriate.
14. If it is reflective or thought-provoking, choose 🤔 when appropriate.
15. Never invent a new emoji.
16. Return only an emoji from the allowed list.

Allowed emojis:
${Array.from(
  ALLOWED_EMOJIS
).join(" ")}

WhatsApp Status:
${statusText}
`.trim();
}

/*
|--------------------------------------------------------------------------
| EXTRACT AI TEXT
|--------------------------------------------------------------------------
|
| Different AI APIs may return different response
| structures.
|
|--------------------------------------------------------------------------
*/

function extractAIText(data) {
  if (!data) {
    return "";
  }

  /*
   * OpenAI-compatible response:
   *
   * choices[0].message.content
   */

  if (
    Array.isArray(
      data.choices
    ) &&
    data.choices[0]
  ) {
    const choice =
      data.choices[0];

    if (
      choice.message &&
      typeof choice.message.content ===
        "string"
    ) {
      return choice.message.content;
    }

    if (
      typeof choice.text ===
        "string"
    ) {
      return choice.text;
    }
  }

  /*
   * Generic response:
   *
   * { emoji: "❤️" }
   */

  if (
    typeof data.emoji ===
    "string"
  ) {
    return data.emoji;
  }

  /*
   * Generic response:
   *
   * { response: "❤️" }
   */

  if (
    typeof data.response ===
    "string"
  ) {
    return data.response;
  }

  /*
   * Generic response:
   *
   * { text: "❤️" }
   */

  if (
    typeof data.text ===
    "string"
  ) {
    return data.text;
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| ASK AI
|--------------------------------------------------------------------------
*/

async function askAI(
  statusText
) {
  if (!AI_API_URL) {
    throw new Error(
      "AI_API_URL is not configured."
    );
  }

  if (!AI_API_KEY) {
    throw new Error(
      "AI_API_KEY is not configured."
    );
  }

  const prompt =
    buildReactionPrompt(
      statusText
    );

  /*
   * OpenAI-compatible request format.
   *
   * If your provider uses another API format,
   * only this function needs to be adapted.
   */

  const response =
    await axios.post(
      AI_API_URL,
      {
        model: AI_MODEL,

        messages: [
          {
            role: "system",
            content:
              "You are a WhatsApp Status emoji reaction AI. Return exactly one emoji and nothing else."
          },
          {
            role: "user",
            content: prompt
          }
        ],

        temperature: 0.2,

        max_tokens: 10
      },
      {
        timeout: AI_TIMEOUT,

        headers: {
          Authorization:
            `Bearer ${AI_API_KEY}`,

          "Content-Type":
            "application/json"
        }
      }
    );

  return extractAIText(
    response.data
  );
}

/*
|--------------------------------------------------------------------------
| CHOOSE EMOJI
|--------------------------------------------------------------------------
*/

async function chooseEmoji(
  statusText,
  options = {}
) {
  const text =
    cleanStatusText(
      statusText
    );

  /*
   * Empty status text.
   */

  if (!text) {
    return (
      options.fallbackEmoji ||
      FALLBACK_EMOJI
    );
  }

  /*
   * AI disabled.
   */

  if (
    options.enabled === false
  ) {
    return (
      options.fallbackEmoji ||
      FALLBACK_EMOJI
    );
  }

  try {
    const aiResponse =
      await askAI(text);

    const emoji =
      normalizeEmoji(
        aiResponse
      );

    /*
     * AI returned a valid emoji.
     */

    if (emoji) {
      return emoji;
    }

    /*
     * Invalid AI response.
     */

    console.warn(
      "[AI REACTION] AI returned an invalid emoji."
    );

    return (
      options.fallbackEmoji ||
      FALLBACK_EMOJI
    );
  } catch (error) {
    console.error(
      "[AI REACTION] AI request failed:",
      error?.message ||
        error
    );

    return (
      options.fallbackEmoji ||
      FALLBACK_EMOJI
    );
  }
}

/*
|--------------------------------------------------------------------------
| ANALYZE STATUS
|--------------------------------------------------------------------------
|
| This is the main function the status handler
| will call.
|
|--------------------------------------------------------------------------
*/

async function analyzeStatus(
  status,
  options = {}
) {
  let text = "";

  /*
   * Accept a plain string.
   */

  if (
    typeof status ===
    "string"
  ) {
    text = status;
  }

  /*
   * Accept:
   *
   * {
   *   text: "Hello ❤️"
   * }
   */

  else if (
    status &&
    typeof status ===
      "object"
  ) {
    text =
      status.text ||
      status.caption ||
      "";
  }

  const emoji =
    await chooseEmoji(
      text,
      options
    );

  return {
    emoji,

    text:
      cleanStatusText(
        text
      ),

    usedAI:
      Boolean(
        AI_API_URL &&
        AI_API_KEY &&
        options.enabled !== false
      )
  };
}

/*
|--------------------------------------------------------------------------
| VALIDATE EMOJI
|--------------------------------------------------------------------------
*/

function isAllowedEmoji(
  emoji
) {
  return ALLOWED_EMOJIS.has(
    emoji
  );
}

/*
|--------------------------------------------------------------------------
| GET CONFIGURATION STATUS
|--------------------------------------------------------------------------
*/

function isAIConfigured() {
  return Boolean(
    AI_API_URL &&
    AI_API_KEY
  );
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  chooseEmoji,

  analyzeStatus,

  isAllowedEmoji,

  isAIConfigured,

  normalizeEmoji,

  buildReactionPrompt,

  ALLOWED_EMOJIS,

  FALLBACK_EMOJI
};