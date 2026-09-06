"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0                ║
// ║                 💬 MESSAGE HANDLER                 ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

const fs = require("fs");
const path = require("path");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ BOT LOGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const logoPath = path.join(
  __dirname,
  "..",
  "assets",
  "logo.png"
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let config = {};

try {
  config = require("../config");
} catch (error) {
  config = {};
}

const PREFIX =
  config?.PREFIX ||
  config?.prefix ||
  ".";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔗 TOPFEROS LINKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LINKS = {
  group:
    "https://chat.whatsapp.com/HnuMcwjqfplDrP6KLFA9Iq?s=cl&p=a&mlu=4",

  channel:
    "https://whatsapp.com/channel/0029Vb98522IXnlxdL8Sxj2m",

  connect:
    "https://topferos-md-v1-0-0.onrender.com/"
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌸 ACTIVATION MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 GET MESSAGE TEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getMessageText(message) {
  return (
    message?.message?.conversation ||
    message?.message?.extendedTextMessage?.text ||
    message?.message?.imageMessage?.caption ||
    message?.message?.videoMessage?.caption ||
    message?.message?.documentMessage?.caption ||
    ""
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📨 HANDLE MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleMessage(sock, message) {
  try {
    if (!sock || !message) {
      return;
    }

    // Pa reponn pwòp mesaj bot la
    if (message?.key?.fromMe) {
      return;
    }

    const remoteJid =
      message?.key?.remoteJid;

    if (!remoteJid) {
      return;
    }

    const text =
      String(
        getMessageText(message)
      ).trim();

    if (!text) {
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔎 COMMAND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!text.startsWith(PREFIX)) {
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
      commandLine.split(/\s+/);

    const command =
      String(
        parts.shift() || ""
      ).toLowerCase();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🏠 MENU / START / HELP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      command === "menu" ||
      command === "start" ||
      command === "help"
    ) {

      await sendLogoMessage(
        sock,
        remoteJid,
        activationMessage,
        message
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🌸 WELCOME
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      command === "welcome" ||
      command === "byenvini"
    ) {

      await sendLogoMessage(
        sock,
        remoteJid,
        activationMessage,
        message
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🏓 ALIVE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (command === "alive") {

      await sock.sendMessage(
        remoteJid,
        {
          text:
`🟢 *TOPFEROS MD V1.0.0*

✅ Bot la aktif e li konekte.

🚀 *TOPFEROS TECH*`
        },
        {
          quoted: message
        }
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⚙️ SETTINGS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (command === "settings") {

      await sock.sendMessage(
        remoteJid,
        {
          text:
`⚙️ *TOPFEROS MD SETTINGS*

Pou chanje paramèt bot la,
itilize panel la:

🔗 ${LINKS.connect}

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ SEND LOGO + MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendLogoMessage(
  sock,
  remoteJid,
  caption,
  quoted
) {

  try {

    if (
      fs.existsSync(logoPath)
    ) {

      await sock.sendMessage(
        remoteJid,
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

    console.warn(
      "⚠️ Logo pa jwenn:",
      logoPath
    );

    // Si logo pa jwenn, voye tèks la toujou
    await sock.sendMessage(
      remoteJid,
      {
        text: caption
      },
      {
        quoted
      }
    );

  } catch (error) {

    console.error(
      "❌ LOGO MESSAGE ERROR:",
      error?.message || error
    );

    // Fallback: voye mesaj la san logo
    try {

      await sock.sendMessage(
        remoteJid,
        {
          text: caption
        },
        {
          quoted
        }
      );

    } catch (sendError) {

      console.error(
        "❌ FALLBACK MESSAGE ERROR:",
        sendError?.message || sendError
      );

    }

  }

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  handleMessage
};

// ╔════════════════════════════════════════════════════╗
// ║                 By TOPFEROS TECH                  ║
// ╚════════════════════════════════════════════════════╝