"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                SCREENSHOT COMMAND                ║
// ╚════════════════════════════════════════════════════╝

const axios = require("axios");

const {
  registerCommand
} = require("../src/messageHandler");

async function screenshotCommand(ctx) {
  const url =
    String(ctx.text || "").trim();

  if (!url) {
    await ctx.send(
      [
        "❌ URL REQUIRED",
        "",
        "Use:",
        `${ctx.prefix}ss <URL>`,
        "",
        "Example:",
        `${ctx.prefix}ss https://example.com`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "No URL provided."
    };
  }

  let parsedUrl;

  try {
    parsedUrl =
      new URL(url);
  } catch {
    await ctx.send(
      [
        "❌ INVALID URL",
        "",
        "Please provide a valid website URL.",
        "",
        "Example:",
        `${ctx.prefix}ss https://example.com`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Invalid URL."
    };
  }

  if (
    ![
      "http:",
      "https:"
    ].includes(
      parsedUrl.protocol
    )
  ) {
    await ctx.send(
      [
        "❌ INVALID URL",
        "",
        "Only HTTP and HTTPS URLs are supported.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "Unsupported URL protocol."
    };
  }

  try {
    const response =
      await axios.get(
        "https://image.thum.io/get/fullpage/" +
          encodeURIComponent(url),
        {
          responseType:
            "arraybuffer",
          timeout: 30000
        }
      );

    const image =
      Buffer.from(
        response.data
      );

    if (!image.length) {
      throw new Error(
        "Screenshot service returned empty data."
      );
    }

    await ctx.sock.sendMessage(
      ctx.jid,
      {
        image,
        caption:
          [
            "📸 WEBSITE SCREENSHOT",
            "",
            `URL: ${url}`,
            "",
            "🦁 TECH BY TOPFEROS MD 🐑"
          ].join("\n")
      },
      {
        quoted:
          ctx.message
      }
    );

    return {
      success: true,
      url
    };
  } catch (error) {
    console.error(
      "[SS] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ SCREENSHOT FAILED",
        "",
        "I could not capture this website.",
        "",
        "Make sure the URL is public and accessible.",
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

registerCommand(
  "ss",
  screenshotCommand,
  {
    aliases: [
      "screenshot"
    ],
    description:
      "Take a screenshot of a public website.",
    usage:
      ".ss <URL>",
    category:
      "UTILITY"
  }
);

module.exports = {
  screenshotCommand
};