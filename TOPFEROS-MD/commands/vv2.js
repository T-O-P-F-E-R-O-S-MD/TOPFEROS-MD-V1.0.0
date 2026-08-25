"use strict";

const status = require("./status");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👁️ TOPFEROS MD — VV2 COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context;

  if (!sock || !message) {
    return;
  }

  try {
    const processed =
      await status.handleVV2(
        context
      );

    if (!processed) {
      const chatId =
        message?.key?.remoteJid;

      if (!chatId) {
        return;
      }

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Mwen pa jwenn yon View Once pou trete.\n\n" +
            "👁️ Reponn sou yon View Once epi itilize .vv2."
        },
        {
          quoted: message
        }
      );

      return;
    }

    console.log(
      "✅ VV2: View Once trete avèk siksè."
    );

  } catch (error) {
    console.error(
      "❌ VV2 ERROR:",
      error
    );

    const chatId =
      message?.key?.remoteJid;

    if (chatId) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Gen yon erè pandan m t ap trete View Once la."
        },
        {
          quoted: message
        }
      );
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "vv2",

  aliases: [
    "vv",
    "viewonce"
  ],

  description:
    "Trete yon View Once ki disponib pou bot la.",

  usage:
    ".vv2",

  execute
};