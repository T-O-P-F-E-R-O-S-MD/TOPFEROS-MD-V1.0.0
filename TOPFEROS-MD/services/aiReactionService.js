"use strict";

const axios = require("axios");

/*
|--------------------------------------------------------------------------
| TOPFEROS MD V2.0.0
| AI STATUS REACTION SERVICE
|--------------------------------------------------------------------------
|
| Purpose:
| - Analyze a WhatsApp status
| - Ask the configured AI to choose ONE natural emoji
| - Return only one emoji
|
| Environment variables:
|
| AI_API_URL
| AI_API_KEY
| AI_MODEL
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
  "gpt-4o-mini";

/*
|--------------------------------------------------------------------------
| FALLBACK
|--------------------------------------------------------------------------
|
| This is only used when the AI service is unavailable
| or returns an invalid response.
|
|--------------------------------------------------------------------------
*/

const FALLBACK_EMOJI = "❤️";

/*
|--------------------------------------------------------------------------
| EMOJI EXTRACTION
|--------------------------------------------------------------------------
|
| We do NOT maintain a fixed list of emojis.
|
| The AI can choose any appropriate Unicode emoji.
|
|--------------------------------------------------------------------------
*/

function extractEmoji(text) {
  if (
    typeof text !== "string"
  ) {
    return null;
  }

  const value =
    text.trim();

  if (!value) {
    return null;
  }

  /*
   * Remove common formatting that an AI
   * might accidentally return.
   */

  const cleaned =
    value
      .replace(/```/g, "")
      .replace(/^["'`]+/, "")
      .replace(/["'`]+$/, "")
      .trim();

  /*
   * Emoji-aware Unicode extraction.
   *
   * Extended pictographic characters are
   * supported by modern Node.js versions.
   */

  const matches =
    cleaned.match(
      /\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier}|\u200D\p{Extended_Pictographic})*/gu
    );

  if (
    !matches ||
    matches.length === 0
  ) {
    return null;
  }

  /*
   * Return the first emoji only.
   */

  return matches[0];
}

/*
|--------------------------------------------------------------------------
| EXTRACT AI TEXT
|--------------------------------------------------------------------------
*/

function extractAIText(
  response
) {
  if (!response) {
    return "";
  }

  /*
   * OpenAI-compatible response.
   */

  if (
    response.data?.choices?.[0]
      ?.message?.content
  ) {
    return String(
      response.data.choices[0]
        .message.content
    ).trim();
  }

  /*
   * Some APIs return:
   *
   * choices[0].text
   */

  if (
    response.data?.choices?.[0]
      ?.text
  ) {
    return String(
      response.data.choices[0].text
    ).trim();
  }

  /*
   * Generic response format.
   */

  if (
    response.data?.response
  ) {
    return String(
      response.data.response
    ).trim();
  }

  if (
    response.data?.text
  ) {
    return String(
      response.data.text
    ).trim();
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| BUILD PROMPT
|--------------------------------------------------------------------------
*/

function buildPrompt(
  statusData = {}
) {
  const text =
    String(
      statusData.text ||
      statusData.caption ||
      ""
    ).trim();

  const mediaType =
    String(
      statusData.mediaType ||
      "none"
    ).toLowerCase();

  const prompt = `
You are the automatic WhatsApp Status reaction assistant for TOPFEROS MD V2.0.0.

Analyze the status content and choose ONE single emoji that naturally matches the emotion, meaning, situation, or subject of the status.

Rules:
- Return EXACTLY ONE emoji.
- Do not return words.
- Do not explain your choice.
- Do not return multiple emojis.
- Do not return punctuation.
- Choose the most natural emoji for the content.
- You may use any appropriate Unicode emoji.
- If the status is neutral, choose a natural neutral/relevant emoji.
- If the status is emotional, match the emotion.
- If the status is funny, use an appropriate humorous emoji.
- If it is romantic, use an appropriate romantic emoji.
- If it is motivational, use an appropriate motivational emoji.
- If it is sad, use an appropriate sympathetic emoji.
- If it contains a question, choose an emoji that naturally fits the question.
- Never invent text.

STATUS TEXT:
${text || "[No text/caption]"}

MEDIA TYPE:
${mediaType}

Return ONE emoji only.
`;

  return prompt.trim();
}

/*
|--------------------------------------------------------------------------
| CALL AI
|--------------------------------------------------------------------------
*/

async function callAI(
  prompt,
  options = {}
) {
  if (
    !AI_API_URL
  ) {
    throw new Error(
      "AI_API_URL is not configured."
    );
  }

  const headers = {
    "Content-Type":
      "application/json"
  };

  if (
    AI_API_KEY
  ) {
    headers.Authorization =
      `Bearer ${AI_API_KEY}`;
  }

  const payload = {
    model:
      options.model ||
      AI_MODEL,

    messages: [
      {
        role: "system",
        content:
          "Return exactly one appropriate Unicode emoji and nothing else."
      },
      {
        role: "user",
        content: prompt
      }
    ],

    temperature: 0.7,

    max_tokens: 10
  };

  const response =
    await axios.post(
      AI_API_URL,
      payload,
      {
        headers,

        timeout:
          Number(
            process.env.AI_TIMEOUT_MS
          ) ||
          15000
      }
    );

  return extractAIText(
    response
  );
}

/*
|--------------------------------------------------------------------------
| CHOOSE EMOJI
|--------------------------------------------------------------------------
*/

async function chooseEmoji(
  statusData = {},
  options = {}
) {
  try {
    const prompt =
      buildPrompt(
        statusData
      );

    const aiResponse =
      await callAI(
        prompt,
        options
      );

    const emoji =
      extractEmoji(
        aiResponse
      );

    if (emoji) {
      return emoji;
    }

    console.warn(
      "[AI REACTION] AI returned no valid emoji."
    );

    return FALLBACK_EMOJI;
  } catch (error) {
    console.error(
      "[AI REACTION] AI request failed:",
      error?.message ||
        error
    );

    return FALLBACK_EMOJI;
  }
}

/*
|--------------------------------------------------------------------------
| ANALYZE STATUS
|--------------------------------------------------------------------------
*/

async function analyzeStatus(
  statusData = {},
  options = {}
) {
  const emoji =
    await chooseEmoji(
      statusData,
      options
    );

  return {
    emoji,

    source:
      emoji ===
      FALLBACK_EMOJI
        ? "fallback"
        : "ai",

    statusText:
      String(
        statusData.text ||
        statusData.caption ||
        ""
      ).trim(),

    mediaType:
      statusData.mediaType ||
      "none"
  };
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  chooseEmoji,

  analyzeStatus,

  extractEmoji,

  extractAIText,

  buildPrompt
};