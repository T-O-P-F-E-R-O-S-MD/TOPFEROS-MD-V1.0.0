"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                 SHORT URL COMMAND                ║
// ╚════════════════════════════════════════════════════╝

const axios = require("axios");

const {
  registerCommand
} = require("../src/messageHandler");

async function shortUrlCommand(ctx) {
  const url =
    String(ctx.text || "").trim();

  if (!url) {
    await ctx.send(
      [
        "❌ URL REQUIRED",
        "",
        "Use:",
        `${ctx.prefix}shorturl <URL>`,
        "",
        "Example:",
        `${ctx.prefix}shorturl https://example.com`,
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

  try {
    let parsedUrl;

    try {
      parsedUrl =
        new URL(url);
    } catch {
      throw new Error(
        "Invalid URL."
      );
    }

    if (
      ![
        "http:",
        "https:"
      ].includes(
        parsedUrl.protocol
      )
    ) {
      throw new Error(
        "Only HTTP and HTTPS URLs are supported."
      );
    }

    const response =
      await axios.get(
        "https://is.gd/create.php",
        {
          params: {
            format: "simple",
            url
          },
          timeout: 15000
        }
      );

    const shortUrl =
      String(
        response.data || ""
      ).trim();

    if (
      !shortUrl ||
      !/^https?:\/\//i.test(
        shortUrl
      )
    ) {
      throw new Error(
        "Short URL service returned an invalid response."
      );
    }

    await ctx.send(
      [
        "🔗 SHORT URL",
        "",
        `Original: ${url}`,
        "",
        `Short: ${shortUrl}`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: true,
      original:
        url,
      shortUrl
    };
  } catch (error) {
    console.error(
      "[SHORTURL] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ SHORT URL FAILED",
        "",
        error?.message ||
          "I could not shorten this URL.",
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
  "shorturl",
  shortUrlCommand,
  {
    aliases: [
      "short",
      "tinyurl"
    ],
    description:
      "Shorten a valid HTTP or HTTPS URL.",
    usage:
      ".shorturl <URL>",
    category:
      "UTILITY"
  }
);

module.exports = {
  shortUrlCommand
};