"use strict";

/*
|--------------------------------------------------------------------------
| TOPFEROS MD V2.0.0
| AI COMMAND
|--------------------------------------------------------------------------
|
| OpenAI Responses API + Web Search
|
|--------------------------------------------------------------------------
*/

const OpenAI =
  require("openai");

/*
|--------------------------------------------------------------------------
| OPENAI CLIENT
|--------------------------------------------------------------------------
*/

const apiKey =
  process.env.OPENAI_API_KEY || "";

const openai =
  apiKey
    ? new OpenAI({
        apiKey
      })
    : null;

/*
|--------------------------------------------------------------------------
| AI COMMAND
|--------------------------------------------------------------------------
*/

async function aiCommand(ctx) {
  /*
   * Check question
   */

  if (!ctx.text) {
    await ctx.send(
      [
        "🤖 Please provide a question.",
        "",
        `Example: ${ctx.prefix}ai What is artificial intelligence?`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false
    };
  }

  /*
   * Check API configuration
   */

  if (!openai) {
    await ctx.send(
      [
        "🤖 TOPFEROS MD AI",
        "",
        "❌ OpenAI API key is not configured.",
        "",
        "⚙️ Add OPENAI_API_KEY to your environment variables.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "OPENAI_API_KEY is missing."
    };
  }

  try {
    /*
     * Tell the user that the request is being processed.
     */

    await ctx.send(
      [
        "🤖 TOPFEROS MD AI",
        "",
        "⏳ Thinking..."
      ].join("\n")
    );

    /*
     |--------------------------------------------------------------------------
     | OPENAI RESPONSES API
     |--------------------------------------------------------------------------
     |
     | Web search is enabled.
     | The model decides when a web search is useful.
     |
     |--------------------------------------------------------------------------
     */

    const response =
      await openai.responses.create({
        model:
          process.env.OPENAI_MODEL ||
          "gpt-5.5",

        tools: [
          {
            type:
              "web_search"
          }
        ],

        tool_choice:
          "auto",

        input: [
          {
            role:
              "system",

            content:
              [
                {
                  type:
                    "input_text",

                  text:
                    [
                      "You are the official AI assistant for TOPFEROS MD.",
                      "Give accurate, useful, and clear answers.",
                      "When the question requires current or changing information, use web search.",
                      "Do not invent facts.",
                      "If you are uncertain, clearly say so.",
                      "Answer in the same language used by the user whenever possible."
                    ].join(" ")
                }
              ]
          },
          {
            role:
              "user",

            content:
              [
                {
                  type:
                    "input_text",

                  text:
                    ctx.text
                }
              ]
          }
        ]
      });

    /*
     * Get the final text response.
     */

    const answer =
      String(
        response?.output_text ||
          ""
      ).trim();

    if (!answer) {
      await ctx.send(
        [
          "🤖 TOPFEROS MD AI",
          "",
          "❌ I could not generate an answer.",
          "",
          "🦁 TECH BY TOPFEROS MD 🐑"
        ].join("\n")
      );

      return {
        success: false,
        reason:
          "Empty AI response."
      };
    }

    /*
     * Send the AI answer to WhatsApp.
     */

    await ctx.send(
      [
        "🤖 TOPFEROS MD AI",
        "",
        answer,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: true,
      answer
    };
  } catch (error) {
    console.error(
      "[OPENAI AI] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "🤖 TOPFEROS MD AI",
        "",
        "❌ The AI request failed.",
        "",
        "Please try again later.",
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
  }
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  aiCommand
};