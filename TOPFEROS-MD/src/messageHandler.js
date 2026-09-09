"use strict";

const fs = require("fs");
const path = require("path");

const settingsPanel =
  require("../settings/panel");

let config = {};

try {
  config = require("../config");
} catch {
  config = {};
}

const PREFIX =
  config?.PREFIX ||
  config?.prefix ||
  ".";

const logoPath =
  path.join(
    __dirname,
    "..",
    "assets",
    "logo.png"
  );

const LINKS = {
  group:
    "https://chat.whatsapp.com/HnuMcwjqfplDrP6KLFA9Iq?s=cl&p=a&mlu=4",

  channel:
    "https://whatsapp.com/channel/0029Vb98522IXnlxdL8Sxj2m",

  connect:
    "https://topferos-md-v1-0-0.onrender.com/"
};

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

async function sendLogoMessage(
  sock,
  jid,
  caption,
  quoted
) {
  try {
    if (
      fs.existsSync(logoPath)
    ) {
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

      return;
    }

    await sock.sendMessage(
      jid,
      {
        text: caption
      },
      {
        quoted
      }
    );
  } catch {
    await sock.sendMessage(
      jid,
      {
        text: caption
      },
      {
        quoted
      }
    );
  }
}

async function sendAliveMessage(
  sock,
  jid,
  quoted
) {
  await sock.sendMessage(
    jid,
    {
      text: `
🦁 *TOPFEROS MD V1.0.0*

🟢 *BOT LA AKTIF*

✅ Bot la konekte e li pare pou itilize.

🚀 *TOPFEROS TECH*
`
    },
    {
      quoted
    }
  );
}

function getStatus(
  settings,
  key
) {
  return settings?.[key] === true
    ? "✅ Aktif"
    : "❌ Dezaktive";
}

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

  return `
╭━━━━━━━━━━━❀━━━━━━━━━━━╮
🦁 *PARAMÈT BOT LA* 🐑
╰━━━━━━━━━━━❀━━━━━━━━━━━╯

🎀 Non » ${
    bot.name || "TOPFEROS MD"
  }

🎂 Laj » ${
    bot.age ?? 24
  }

🔤 Prefiks » ${
    bot.prefix || PREFIX
  }

🌐 Mòd » ${
    getStatus(
      settings,
      "publicMode"
    )
  }

🛡️ *PROTECTION*

📞 Anti Call » ${
    getStatus(settings, "antiCall")
  }

🗑️ Anti Delete » ${
    getStatus(settings, "antiDelete")
  }

🚫 Anti Spam » ${
    getStatus(settings, "antiSpam")
  }

🔗 Anti Link » ${
    getStatus(settings, "groupAntiLink")
  }

⚙️ *AUTOMATIK*

📡 Always Online » ${
    getStatus(settings, "alwaysOnline")
  }

⌨️ Fake Typing » ${
    getStatus(settings, "fakeTyping")
  }

🎙️ Fake Recording » ${
    getStatus(settings, "fakeRecording")
  }

❤️ Auto React » ${
    getStatus(settings, "autoReact")
  }

📱 Auto Status » ${
    getStatus(settings, "autoStatus")
  }

💬 Status Reply » ${
    getStatus(settings, "statusReply")
  }

👍 Status Like » ${
    getStatus(settings, "statusLike")
  }

❤️ Status React » ${
    getStatus(settings, "statusReact")
  }

👥 *GROUP SETTINGS*

🚫 Group Anti Spam » ${
    getStatus(settings, "groupAntiSpam")
  }

🗑️ Group Anti Delete » ${
    getStatus(settings, "groupAntiDelete")
  }

👑 Admin Group » ${
    getStatus(settings, "adminGroup")
  }

🔒 Group Close » ${
    getStatus(settings, "groupClose")
  }

🔓 Group Open » ${
    getStatus(settings, "groupOpen")
  }

🤖 AI Chat » ${
    getStatus(settings, "aiChat")
  }

✨ *Aksè Pwopriyetè Sèlman*
🌸 *Chat Pèsonèl* 🌸

*TOPFEROS TECH* 🦁
`;
}

async function handleSettings(
  sock,
  jid,
  quoted,
  sessionId
) {
  if (!sessionId) {
    await sock.sendMessage(
      jid,
      {
        text:
`❌ *SESSION PA JWENN*

Tanpri rekonekte bot la epi eseye:
➜ *.settings*`
      },
      {
        quoted
      }
    );

    return;
  }

  try {
    const panel =
      settingsPanel.createSession(
        sock,
        sessionId
      );

    if (!panel) {
      throw new Error(
        "Unable to create settings session."
      );
    }

    await sock.sendMessage(
      jid,
      {
        text:
          buildSettingsInformation(
            sessionId
          )
      },
      {
        quoted
      }
    );

    await settingsPanel.sendPanelLink(
      sock,
      jid,
      quoted,
      sessionId
    );

  } catch (error) {
    console.error(
      "❌ SETTINGS ERROR:",
      error?.message || error
    );

    await sock.sendMessage(
      jid,
      {
        text:
`❌ *ERÈ SETTINGS*

Tanpri eseye ankò:
➜ *.settings*

🚀 *TOPFEROS TECH*`
      },
      {
        quoted
      }
    );
  }
}

async function handleMessage(
  sock,
  message,
  sessionId
) {
  try {
    if (!sock || !message) {
      return;
    }

    if (!sessionId) {
      return;
    }

    if (
      message?.key?.fromMe
    ) {
      return;
    }

    const jid =
      message?.key?.remoteJid;

    if (!jid) {
      return;
    }

    if (
      jid ===
      "status@broadcast"
    ) {
      return;
    }

    const text =
      String(
        getMessageText(
          message
        ) || ""
      ).trim();

    if (!text) {
      return;
    }

    if (
      !text.startsWith(
        PREFIX
      )
    ) {
      return;
    }

    const commandLine =
      text
        .slice(PREFIX.length)
        .trim();

    if (!commandLine) {
      return;
    }

    const parts =
      commandLine.split(
        /\s+/
      );

    const command =
      String(
        parts.shift() || ""
      ).toLowerCase();

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
    }

  } catch (error) {
    console.error(
      "❌ HANDLE MESSAGE ERROR:",
      error?.message || error
    );
  }
}

module.exports = {
  handleMessage
};