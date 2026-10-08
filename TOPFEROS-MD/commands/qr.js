"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                     QR COMMAND                   ║
// ╚════════════════════════════════════════════════════╝

const axios = require("axios");

const {
  registerCommand
} = require("../src/messageHandler");

async function qrCommand(ctx) {
  const text =
    String(ctx.text || "").trim();

  if (!text) {
    await ctx.send(
      [
        "❌ TEXT REQUIRED",
        "",
        "Use:",
        `${ctx.prefix}qr <text or link>`,
        "",
        "Example:",
        `${ctx.prefix}qr https://topferosmd.store`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "No QR content provided."
    };
  }

  try {
    const response =
      await axios.get(
        "https://api.qrserver.com/v1/create-qr-code/",
        {
          params: {
            size: "500x500",
            data: text
          },
          responseType:
            "arraybuffer",
          timeout: 15000
        }
      );

    const image =
      Buffer.from(
        response.data
      );

    if (!image.length) {
      throw new Error(
        "QR API returned empty data."
      );
    }

    await ctx.sock.sendMessage(
      ctx.jid,
      {
        image,
        caption:
          [
            "📱 QR CODE",
            "",
            `Content: ${text}`,
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
      success: true
    };
  } catch (error) {
    console.error(
      "[QR] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ QR FAILED",
        "",
        "I could not generate the QR code.",
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
  "qr",
  qrCommand,
  {
    aliases: [
      "qrcode"
    ],
    description:
      "Generate a QR code from text or a link.",
    usage:
      ".qr <text or link>",
    category:
      "UTILITY"
  }
);

module.exports = {
  qrCommand
};