"use strict";

/*
|--------------------------------------------------------------------------
| TOPFEROS MD V2.0.0
| AI COMMAND
|--------------------------------------------------------------------------
*/

async function aiCommand(ctx) {
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

  await ctx.send(
    [
      "🤖 AI REQUEST RECEIVED",
      "",
      `📝 ${ctx.text}`,
      "",
      "⚙️ AI service is not connected yet.",
      "",
      "🦁 TECH BY TOPFEROS MD 🐑"
    ].join("\n")
  );

  return {
    success: true,
    pending: true
  };
}

module.exports = {
  aiCommand
};