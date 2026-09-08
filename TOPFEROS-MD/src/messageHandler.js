"use strict";

const fs = require("fs");
const path = require("path");

const settingsPanel = require("../settings/panel");

// ============================================================
// CONFIG
// ============================================================

let config = {};

try {
  config = require("../config");
} catch (error) {
  console.warn(
    "⚠️ config.js pa jwenn, prefix default = ."
  );
}

const PREFIX =
  config?.PREFIX ||
  config?.prefix ||
  ".";

// ============================================================
// PATHS
// ============================================================

const logoPath = path.join(
  __dirname,
  "..",
  "assets",
  "logo.png"
);

// ============================================================
// LINKS
// ============================================================

const LINKS = {
  group:
    "https://chat.whatsapp.com/HnuMcwjqfplDrP6KLFA9Iq?s=cl&p=a&mlu=4",

  channel:
    "https://whatsapp.com/channel/0029Vb98522IXnlxdL8Sxj2m",

  connect:
    "https://topferos-md-v1-0-0.onrender.com/"
};

// ============================================================
// ACTIVATION MESSAGE
// ============================================================

const activationMessage = `
🦁 *TOPFEROS MD V1.0.0*

🌸 *BOT OU A AP AKTIVE*

⏳ Sa pran anviwon *03 minit* pou aktive.

✨ Apre 03 minit, itilize:
➜ *.alive*

⚠️ *Si bot la pa aktive:*
➜ Dekonekte epi rekonekte bot la.

────────────────────────────

⚙️ *PARAMÈT BOT LA*

Pou chanje paramèt bot la:
➜ *.settings*

🌐 *KONEKSYON*

Lè w ap konekte sou entènèt la,
mete kòd peyi a ansanm ak nimewo
telefòn ou san 0 ki devan an.

Egzanp:
➜ *947629xxxx*

⏳ Apre ou fin chanje paramèt yo,
sa ka pran anviwon *03 minit* pou
nouvo paramèt yo aplike.

────────────────────────────

📱 *GROUP WHATSAPP*
➜ ${LINKS.group}

📢 *CHANNEL WHATSAPP*
➜ ${LINKS.channel}

🔗 *CONNECT BOT*
➜ ${LINKS.connect}

────────────────────────────

🦁 *Mèsi anpil,*
*Ekip TOPFEROS MD* 🐑

🚀 *TOPFEROS TECH*
`;

// ============================================================
// GET MESSAGE TEXT
// ============================================================

function getMessageText(message) {
  return (
    message?.message?.conversation ||
    message?.message?.extendedTextMessage?.text ||
    message?.message?.imageMessage?.caption ||
    message?.message?.videoMessage?.caption ||
    message?.message?.documentMessage?.caption ||
    message?.message?.buttonsResponseMessage
      ?.selectedButtonId ||
    message?.message?.listResponseMessage
      ?.singleSelectReply
      ?.selectedRowId ||
    ""
  );
}

// ============================================================
// SEND LOGO + TEXT
// ============================================================

async function sendLogoMessage(
  sock,
  jid,
  caption,
  quoted
) {
  try {
    if (fs.existsSync(logoPath)) {
      await sock.sendMessage(
        jid,
        {
          image: {
            url: logoPath
          },
          caption
        },
        {
          quoted
        }
      );

      return true;
    }

    console.warn(
      "⚠️ Logo pa jwenn:",
      logoPath
    );

    await sock.sendMessage(
      jid,
      {
        text: caption
      },
      {
        quoted
      }
    );

    return true;

  } catch (error) {
    console.error(
      "❌ SEND LOGO ERROR:",
      error?.message || error
    );

    try {
      await sock.sendMessage(
        jid,
        {
          text: caption
        },
        {
          quoted
        }
      );

      return true;

    } catch (fallbackError) {
      console.error(
        "❌ FALLBACK MESSAGE ERROR:",
        fallbackError?.message ||
        fallbackError
      );

      return false;
    }
  }
}

// ============================================================
// ALIVE MESSAGE
// ============================================================

async function sendAliveMessage(
  sock,
  jid,
  quoted
) {
  const text = `
🦁 *TOPFEROS MD V1.0.0*

🟢 *BOT LA AKTIF*

✅ Bot la konekte e li pare pou itilize.

🚀 *TOPFEROS TECH*
`;

  await sock.sendMessage(
    jid,
    {
      text
    },
    {
      quoted
    }
  );
}

// ============================================================
// SETTINGS STATUS
// ============================================================

function getStatus(
  settings,
  key
) {
  return settings?.[key] === true
    ? "✅ Aktif"
    : "❌ Dezaktive";
}

// ============================================================
// SETTINGS INFORMATION
// ============================================================

function buildSettingsInformation(
  sessionId
) {
  const bot =
    settingsPanel.getBotInformation(
      sessionId
    ) || {};

  const settings =
    settingsPanel.getSettings(
      sessionId
    ) || {};

  const prefix =
    bot.prefix || PREFIX;

  const name =
    bot.name || "TOPFEROS MD";

  const age =
    bot.age ?? 24;

  return `
╭━━━━━━━━━━━❀━━━━━━━━━━━╮
🦁 *PARAMÈT BOT LA* 🐑
╰━━━━━━━━━━━❀━━━━━━━━━━━╯

┌─────── ⋆⋅☆⋅⋆ ──────────┐
💗 *ENFÒMASYON BOT LA* 💗
└────────── ⋆⋅☆⋅⋆ ──────────┘

🎀 Non       » ${name}
🎂 Laj       » ${age}
🔤 Prefiks   » ${prefix}
🌐 Mòd       » ${getStatus(
    settings,
    "publicMode"
  )}

┌─────── ⋆⋅☆⋅⋆ ──────────┐
🛡️ *PROTECTION* 🛡️
└────────── ⋆⋅☆⋅⋆ ──────────┘

📞 Anti Call       » ${getStatus(
    settings,
    "antiCall"
  )}
🗑️ Anti Delete     » ${getStatus(
    settings,
    "antiDelete"
  )}
🚫 Anti Spam       » ${getStatus(
    settings,
    "antiSpam"
  )}
🔗 Anti Link       » ${getStatus(
    settings,
    "groupAntiLink"
  )}

┌─────── ⋆⋅☆⋅⋆ ──────────┐
⚙️ *AUTOMATIK* ⚙️
└────────── ⋆⋅☆⋅⋆ ──────────┘

📡 Always Online   » ${getStatus(
    settings,
    "alwaysOnline"
  )}
⌨️ Fake Typing     » ${getStatus(
    settings,
    "fakeTyping"
  )}
🎙️ Fake Recording  » ${getStatus(
    settings,
    "fakeRecording"
  )}
❤️ Auto React      » ${getStatus(
    settings,
    "autoReact"
  )}
📱 Auto Status     » ${getStatus(
    settings,
    "autoStatus"
  )}
💬 Status Reply    » ${getStatus(
    settings,
    "statusReply"
  )}
👍 Status Like     » ${getStatus(
    settings,
    "statusLike"
  )}
❤️ Status React    » ${getStatus(
    settings,
    "statusReact"
  )}

┌─────── ⋆⋅☆⋅⋆ ──────────┐
👥 *GROUP SETTINGS* 👥
└────────── ⋆⋅☆⋅⋆ ──────────┘

🚫 Group Anti Spam   » ${getStatus(
    settings,
    "groupAntiSpam"
  )}
🗑️ Group Anti Delete » ${getStatus(
    settings,
    "groupAntiDelete"
  )}
👑 Admin Group       » ${getStatus(
    settings,
    "adminGroup"
  )}
🔒 Group Close       » ${getStatus(
    settings,
    "groupClose"
  )}
🔓 Group Open        » ${getStatus(
    settings,
    "groupOpen"
  )}

┌─────── ⋆⋅☆⋅⋆ ──────────┐
🤖 *AI & SYSTEM* 🤖
└────────── ⋆⋅☆⋅⋆ ──────────┘

🤖 AI Chat » ${getStatus(
    settings,
    "aiChat"
  )}

╭━━━━━━━━━━━❀━━━━━━━━━━━╮
✨ *Aksè Pwopriyetè Sèlman* ✨
🌸 *Chat Pèsonèl* 🌸
╰━━━━━━━━━━━❀━━━━━━━━━━━╯

*ɢᴏʟᴅᴇɴ Qᴜᴇᴇɴ ᴛᴇᴄʜ*
`;
}

// ============================================================
// SETTINGS COMMAND
// ============================================================

async function handleSettings(
  sock,
  jid,
  quoted,
  sessionId
) {
  try {

    // --------------------------------------------------------
    // VERIFY SESSION ID
    // --------------------------------------------------------

    if (!sessionId) {
      await sock.sendMessage(
        jid,
        {
          text:
`❌ *SESSION PA JWENN*

Mwen pa kapab idantifye session bot sa a.

Tanpri rekonekte bot la epi eseye:
➜ *.settings*`
        },
        {
          quoted
        }
      );

      return;
    }

    // --------------------------------------------------------
    // MAKE SURE PANEL SESSION EXISTS
    // IMPORTANT:
    // Use the SAME WhatsApp sessionId.
    // --------------------------------------------------------

    const panel =
      settingsPanel.createSession(
        sock,
        sessionId
      );

    if (!panel) {
      throw new Error(
        "Settings session lan pa kapab kreye."
      );
    }

    // --------------------------------------------------------
    // SETTINGS INFORMATION
    // --------------------------------------------------------

    const settingsText =
      buildSettingsInformation(
        sessionId
      );

    await sock.sendMessage(
      jid,
      {
        text: settingsText
      },
      {
        quoted
      }
    );

    // --------------------------------------------------------
    // SETTINGS CODE + PANEL LINK
    // --------------------------------------------------------

    await settingsPanel.sendPanelLink(
      sock,
      jid,
      quoted,
      sessionId
    );

  } catch (error) {
    console.error(
      "❌ SETTINGS COMMAND ERROR:",
      error?.message || error
    );

    try {
      await sock.sendMessage(
        jid,
        {
          text:
`❌ *ERÈ SETTINGS*

Mwen pa kapab kreye Settings Session lan kounya.

Tanpri eseye ankò:
➜ *.settings*

🚀 *TOPFEROS TECH*`
        },
        {
          quoted
        }
      );
    } catch (sendError) {
      console.error(
        "❌ SETTINGS ERROR MESSAGE:",
        sendError?.message ||
        sendError
      );
    }
  }
}

// ============================================================
// HANDLE MESSAGE
// ============================================================

async function handleMessage(
  sock,
  message,
  sessionId
) {
  try {

    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------

    if (!sock || !message) {
      return;
    }

    // --------------------------------------------------------
    // SESSION VALIDATION
    // --------------------------------------------------------

    if (!sessionId) {
      console.warn(
        "⚠️ Message received without sessionId."
      );

      return;
    }

    // --------------------------------------------------------
    // IGNORE BOT'S OWN MESSAGE
    // --------------------------------------------------------

    if (message?.key?.fromMe) {
      return;
    }

    // --------------------------------------------------------
    // GET JID
    // --------------------------------------------------------

    const jid =
      message?.key?.remoteJid;

    if (!jid) {
      return;
    }

    // --------------------------------------------------------
    // IGNORE STATUS
    // --------------------------------------------------------

    if (
      jid === "status@broadcast"
    ) {
      return;
    }

    // --------------------------------------------------------
    // GET MESSAGE TEXT
    // --------------------------------------------------------

    const rawText =
      getMessageText(message);

    const text =
      String(
        rawText || ""
      ).trim();

    if (!text) {
      return;
    }

    // --------------------------------------------------------
    // PREFIX CHECK
    // --------------------------------------------------------

    if (!text.startsWith(PREFIX)) {
      return;
    }

    // --------------------------------------------------------
    // COMMAND LINE
    // --------------------------------------------------------

    const commandLine =
      text
        .slice(PREFIX.length)
        .trim();

    if (!commandLine) {
      return;
    }

    // --------------------------------------------------------
    // COMMAND PARTS
    // --------------------------------------------------------

    const parts =
      commandLine.split(/\s+/);

    const command =
      String(
        parts.shift() || ""
      ).toLowerCase();

    // ========================================================
    // MENU / START / HELP
    // ========================================================

    if (
      command === "menu" ||
      command === "start" ||
      command === "help"
    ) {
      await sendLogoMessage(
        sock,
        jid,
        activationMessage,
        message
      );

      return;
    }

    // ========================================================
    // WELCOME
    // ========================================================

    if (
      command === "welcome" ||
      command === "byenvini"
    ) {
      await sendLogoMessage(
        sock,
        jid,
        activationMessage,
        message
      );

      return;
    }

    // ========================================================
    // ALIVE
    // ========================================================

    if (
      command === "alive"
    ) {
      await sendAliveMessage(
        sock,
        jid,
        message
      );

      return;
    }

    // ========================================================
    // SETTINGS
    // ========================================================

    if (
      command === "settings"
    ) {
      await handleSettings(
        sock,
        jid,
        message,
        sessionId
      );

      return;
    }

    // ========================================================
    // CONNECT
    // ========================================================

    if (
      command === "connect"
    ) {
      await sock.sendMessage(
        jid,
        {
          text:
`🔗 *CONNECT TOPFEROS MD*

🌐 ${LINKS.connect}

🚀 *TOPFEROS TECH*`
        },
        {
          quoted: message
        }
      );

      return;
    }

  } catch (error) {
    console.error(
      "❌ HANDLE MESSAGE ERROR:",
      error?.message || error
    );
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  handleMessage
};