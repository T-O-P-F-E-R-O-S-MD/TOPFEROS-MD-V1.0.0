"use strict";

const axios = require("axios");

/*
|--------------------------------------------------------------------------
| TOPFEROS MD V2.0.0
| AI STATUS REACTION SERVICE
|--------------------------------------------------------------------------
|
| Purpose:
| - Analyze a WhatsApp Status
| - Ask the configured AI to choose ONE natural emoji
| - Return exactly ONE emoji
|
| Environment variables:
|
| AI_API_URL
| AI_API_KEY
| AI_MODEL
| AI_TIMEOUT_MS
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const AI_API_URL =
  String(
    process.env.AI_API_URL || ""
  ).trim();

const AI_API_KEY =
  String(
    process.env.AI_API_KEY || ""
  ).trim();

const AI_MODEL =
  String(
    process.env.AI_MODEL ||
      "gpt-4o-mini"
  ).trim();

const AI_TIMEOUT_MS =
  Number(
    process.env.AI_TIMEOUT_MS
  ) || 15000;

/*
|--------------------------------------------------------------------------
| FALLBACK
|--------------------------------------------------------------------------
|
| This is NOT an emoji selection list.
| It is used only if the AI cannot respond
| or returns an invalid response.
|
|--------------------------------------------------------------------------
*/

const FALLBACK_EMOJI =
  "❤️";

/*
|--------------------------------------------------------------------------
| EXTRACT EMOJI
|--------------------------------------------------------------------------
|
| No fixed emoji list is used.
| The AI is free to choose any appropriate
| Unicode emoji.
|--------------------------------------------------------------------------
*/

function extractEmoji(text) {
  if (
    typeof text !== "string"
  ) {
    return null;
  }

  let value =
    text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/```/g, "")
      .trim();

  if (!value) {
    return null;
  }

  /*
   * Remove surrounding quotes.
   */

  value =
    value
      .replace(/^["'`]+/, "")
      .replace(/["'`]+$/, "")
      .trim();

  /*
   * Find Unicode emoji/pictographic
   * sequences.
   */

  const matches =
    value.match(
      /\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier}|\u200D\p{Extended_Pictographic})*/gu
    );

  if (
    !matches ||
    matches.length === 0
  ) {
    return null;
  }

  /*
   * Return exactly one emoji.
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

  const messageContent =
    response.data
      ?.choices?.[0]
      ?.message?.content;

  if (
    typeof messageContent ===
    "string"
  ) {
    return messageContent.trim();
  }

  /*
   * Some providers return
   * an array of content blocks.
   */

  if (
    Array.isArray(
      messageContent
    )
  ) {
    return messageContent
      .map(
        (item) =>
          typeof item === "string"
            ? item
            : item?.text || ""
      )
      .join("")
      .trim();
  }

  /*
   * Alternative completion format.
   */

  const completionText =
    response.data
      ?.choices?.[0]
      ?.text;

  if (
    typeof completionText ===
    "string"
  ) {
    return completionText.trim();
  }

  /*
   * Generic provider format.
   */

  if (
    typeof response.data
      ?.response === "string"
  ) {
    return response.data.response.trim();
  }

  if (
    typeof response.data
      ?.text === "string"
  ) {
    return response.data.text.trim();
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| BUILD STATUS PROMPT
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

  return `
You are the automatic WhatsApp Status reaction assistant for TOPFEROS MD V2.0.0.

Analyze the WhatsApp Status and choose the ONE emoji that most naturally matches its meaning, emotion, subject, or situation.

STRICT RULES:
- Return EXACTLY ONE emoji.
- Return the emoji only.
- Do not return words.
- Do not explain your choice.
- Do not return multiple emojis.
- Do not return punctuation.
- Do not use a predefined emoji list.
- Choose naturally based on the actual status.
- Use any appropriate Unicode emoji.
- Match the emotion when the status is emotional.
- Match humor when the status is funny.
- Match romance when the status is romantic.
- Match sympathy when the status is sad.
- Match motivation when the status is motivational.
- Match celebration when the status is celebratory.
- Match the subject when the status discusses a specific subject.
- If the content is neutral, choose one relevant neutral emoji.
- Never invent information that is not present in the status.

STATUS TEXT:
${text || "[No text or caption]"}

MEDIA TYPE:
${mediaType}

Return ONE emoji only.
`.trim();
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
  const apiUrl =
    String(
      options.apiUrl ||
        AI_API_URL ||
        ""
    ).trim();

  const apiKey =
    String(
      options.apiKey ||
        AI_API_KEY ||
        ""
    ).trim();

  const model =
    String(
      options.model ||
        AI_MODEL
    ).trim();

  if (!apiUrl) {
    throw new Error(
      "AI_API_URL is not configured."
    );
  }

  const headers = {
    "Content-Type":
      "application/json"
  };

  if (apiKey) {
    headers.Authorization =
      `Bearer ${apiKey}`;
  }

  const payload = {
    model,

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

    temperature:
      options.temperature ??
      0.7,

    max_tokens:
      options.maxTokens ??
      10
  };

  const response =
    await axios.post(
      apiUrl,
      payload,
      {
        headers,

        timeout:
          Number(
            options.timeout ||
              AI_TIMEOUT_MS
          ) || 15000
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
      "[AI REACTION] AI returned no valid emoji. Using fallback."
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

  const usedFallback =
    emoji ===
    FALLBACK_EMOJI;

  return {
    emoji,

    source:
      usedFallback
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
      "none",

    messageId:
      statusData.messageId ||
      null,

    participant:
      statusData.participant ||
      null
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

  buildPrompt,

  callAI
};