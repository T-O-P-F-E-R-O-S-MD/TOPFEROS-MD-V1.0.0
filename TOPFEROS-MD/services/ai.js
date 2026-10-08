"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                    AI SERVICE                    ║
// ╚════════════════════════════════════════════════════╝

const axios =
  require("axios");

/*
|--------------------------------------------------------------------------
| AI CONFIGURATION
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
      "llama-3.3-70b-versatile"
  ).trim();

/*
|--------------------------------------------------------------------------
| VALIDATE CONFIGURATION
|--------------------------------------------------------------------------
*/

function isAIConfigured() {
  return Boolean(
    AI_API_URL &&
    AI_API_KEY &&
    AI_MODEL
  );
}

/*
|--------------------------------------------------------------------------
| CLEAN AI RESPONSE
|--------------------------------------------------------------------------
*/

function cleanResponse(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim();
}

/*
|--------------------------------------------------------------------------
| ASK AI
|--------------------------------------------------------------------------
*/

async function askAI(
  prompt,
  options = {}
) {
  const question =
    cleanResponse(prompt);

  if (!question) {
    throw new Error(
      "AI prompt is empty."
    );
  }

  if (!isAIConfigured()) {
    throw new Error(
      "AI is not configured. Please check AI_API_URL, AI_API_KEY and AI_MODEL."
    );
  }

  const systemPrompt =
    cleanResponse(
      options.systemPrompt
    ) ||
    [
      "You are the AI assistant of TOPFEROS MD.",
      "Answer clearly, naturally and helpfully.",
      "Do not claim to perform actions you cannot perform.",
      "Keep responses appropriate for a general audience.",
      "If the user asks a question in Haitian Creole, answer in Haitian Creole.",
      "If the user asks in English, answer in English.",
      "If the user asks in French, answer in French."
    ].join(" ");

  /*
  |--------------------------------------------------------------------------
  | OPENAI-COMPATIBLE CHAT REQUEST
  |--------------------------------------------------------------------------
  */

  const response =
    await axios.post(
      AI_API_URL,
      {
        model:
          AI_MODEL,

        messages: [
          {
            role:
              "system",
            content:
              systemPrompt
          },
          {
            role:
              "user",
            content:
              question
          }
        ],

        temperature:
          typeof options.temperature ===
          "number"
            ? options.temperature
            : 0.7,

        max_tokens:
          typeof options.maxTokens ===
          "number"
            ? options.maxTokens
            : 1200
      },
      {
        headers: {
          Authorization:
            `Bearer ${AI_API_KEY}`,

          "Content-Type":
            "application/json"
        },

        timeout:
          60000
      }
    );

  const data =
    response?.data;

  /*
  |--------------------------------------------------------------------------
  | OPENAI-COMPATIBLE RESPONSE
  |--------------------------------------------------------------------------
  */

  const content =
    data?.choices?.[0]?.message?.content;

  if (content) {
    return cleanResponse(
      content
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FALLBACK RESPONSE FORMATS
  |--------------------------------------------------------------------------
  */

  const fallback =
    data?.response ||
    data?.answer ||
    data?.text ||
    data?.message;

  if (fallback) {
    return cleanResponse(
      fallback
    );
  }

  throw new Error(
    "The AI provider returned an empty response."
  );
}

/*
|--------------------------------------------------------------------------
| AI CHAT
|--------------------------------------------------------------------------
*/

async function aiChat(
  prompt,
  history = [],
  options = {}
) {
  const question =
    cleanResponse(prompt);

  if (!question) {
    throw new Error(
      "AI chat message is empty."
    );
  }

  if (!isAIConfigured()) {
    throw new Error(
      "AI is not configured. Please check AI_API_URL, AI_API_KEY and AI_MODEL."
    );
  }

  const systemPrompt =
    cleanResponse(
      options.systemPrompt
    ) ||
    [
      "You are TOPFEROS MD AI Chat.",
      "Have a natural and helpful conversation.",
      "Remember the recent conversation messages provided to you.",
      "Answer in the user's language whenever possible.",
      "Keep responses appropriate for a general audience."
    ].join(" ");

  const messages = [
    {
      role:
        "system",
      content:
        systemPrompt
    }
  ];

  /*
  |--------------------------------------------------------------------------
  | ADD RECENT HISTORY
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(history)
  ) {
    for (
      const item of history.slice(-12)
    ) {
      if (
        !item ||
        !item.role ||
        !item.content
      ) {
        continue;
      }

      const role =
        item.role === "assistant"
          ? "assistant"
          : "user";

      messages.push({
        role,
        content:
          cleanResponse(
            item.content
          )
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ADD CURRENT MESSAGE
  |--------------------------------------------------------------------------
  */

  messages.push({
    role:
      "user",
    content:
      question
  });

  const response =
    await axios.post(
      AI_API_URL,
      {
        model:
          AI_MODEL,

        messages,

        temperature:
          typeof options.temperature ===
          "number"
            ? options.temperature
            : 0.7,

        max_tokens:
          typeof options.maxTokens ===
          "number"
            ? options.maxTokens
            : 1200
      },
      {
        headers: {
          Authorization:
            `Bearer ${AI_API_KEY}`,

          "Content-Type":
            "application/json"
        },

        timeout:
          60000
      }
    );

  const data =
    response?.data;

  const content =
    data?.choices?.[0]?.message?.content ||
    data?.response ||
    data?.answer ||
    data?.text ||
    data?.message;

  const answer =
    cleanResponse(content);

  if (!answer) {
    throw new Error(
      "The AI provider returned an empty chat response."
    );
  }

  return answer;
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  askAI,
  aiChat,
  isAIConfigured
};