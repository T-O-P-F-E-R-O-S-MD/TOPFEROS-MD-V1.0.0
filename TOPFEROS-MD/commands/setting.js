"use strict";

const config = require("../config");
const settingPanel = require("../src/settingPanel");

/* ======================================================
   HELPERS
====================================================== */

function cleanNumber(value) {
  return String(value || "")
    .split(":")[0]
    .split("@")[0]
    .replace(/\D/g, "");
}

function onOff(value) {
  return value ? "✅ ON" : "❌ OFF";
}

function getDeleteDestination(settings) {
  if (settings?.antiDeleteSameChat) {
    return "📥 INBOX";
  }

  if (settings?.antiDeleteDM) {
    return "📩 Sender";
  }

  return "❌ OFF";
}

function getMode(info, settings) {
  if (settings?.privateMode) {
    return "🔒 Private";
  }

  if (settings?.publicMode) {
    return "🌐 Public";
  }

  return info?.mode || "Unknown";
}

/* ======================================================
   SETTINGS URL
====================================================== */

function getSettingsUrl() {
  const panelUrl =
    settingPanel?.PANEL_URL ||
    process.env.SETTINGS_PANEL_URL ||
    process.env.PANEL_URL ||
    "";

  if (!panelUrl) {
    return "";
  }

  return `${String(panelUrl).replace(/\/+$/, "")}/setting`;
}

/* ======================================================
   MESSAGE 1
   CURRENT BOT SETTINGS
====================================================== */

function buildSettingsMessage(info, settings) {
  const botName =
    info?.name ||
    config?.bot?.name ||
    "TOPFEROS MD";

  const number =
    info?.number ||
    config?.owner?.number ||
    "Not Set";

  const prefix =
    info?.prefix ||
    config?.bot?.prefix ||
    ".";

  const mode =
    getMode(info, settings);

  return `╭━━━━━━━━━━━❀━━━━━━━━━━━╮
       🦁 *BOT SETTINGS* 🐑
      🐑 *${botName}* 🦁
╰━━━━━━━━━━━❀━━━━━━━━━━━╯

┌─────── ⋆⋅☆⋅⋆ ──────────┐
       ✨ *USER INFO* ✨
└────────── ⋆⋅☆⋅⋆ ──────────┘

   🎀 *Name*   » ${botName}
   📱 *Number* » ${number}
   🎂 *Age*    » 24
   📍 *From*   » TOPFEROS TECH
   🔤 *Prefix* » ${prefix}
   🌐 *Mode*   » ${mode}

┌─────── ⋆⋅☆⋅⋆ ──────────┐
      🛡️ *PROTECTION* 🛡️
└────────── ⋆⋅☆⋅⋆ ──────────┘

   🔗 Anti Link         » ${onOff(settings?.antiLink)}
   🤬 Anti Bad Words    » ❌ OFF
   📞 Anti Call         » ${onOff(settings?.antiCall)}
   ⛔ Auto Block        » ❌ OFF
   🧭 Anti Bugs         » ❌ OFF
   🛸 Anti Bot          » ${onOff(settings?.antiRobot)}
   ⚽ Anti Bot Action   » 💥 Delete

┌─────── ⋆⋅☆⋅⋆ ──────────┐
       🗑️ *DELETE LOGS* 🗑️
└────────── ⋆⋅☆⋅⋆ ──────────┘

   👀 Anti Delete       » ${onOff(settings?.antiDelete)}
   📤 Delete Send       » ${getDeleteDestination(settings)}

┌─────── ⋆⋅☆⋅⋆ ──────────┐
      📊 *STATUS SECTION* 📊
└────────── ⋆⋅☆⋅⋆ ──────────┘

   👁️ Status Read          » ${onOff(settings?.autoStatus)}
   ❤️ Status React         » ${onOff(settings?.statusReact)}
   😉 Status Custom React  » None
   💬 Auto Save Contact    » ❌ OFF
   📝 Contact Send Msg     » 📋 Default
   📤 Status Msg Send      » ${onOff(settings?.statusReply)}

┌─────── ⋆⋅☆⋅⋆ ──────────┐
       🤖 *AUTOMATION* 🤖
└────────── ⋆⋅☆⋅⋆ ──────────┘

   🟢 Always Online      » ${onOff(settings?.alwaysOnline)}
   ⌨️ Auto Typing        » ${onOff(settings?.fakeTyping)}
   🎙️ Auto Recording     » ${onOff(settings?.fakeRecording)}
   👁️ Auto Read Msg      » ${onOff(settings?.autoStatus)}

┌─────── ⋆⋅☆⋅⋆ ──────────┐
       ⚙️ *CONFIGS* ⚙️
└────────── ⋆⋅☆⋅⋆ ──────────┘

   💭 Custom Status  » Not Set
   📵 Exclude Nums   » None

┌─────── ⋆⋅☆⋅⋆ ──────────┐
       🖼️ *MEDIA URLS* 🖼️
└────────── ⋆⋅☆⋅⋆ ──────────┘

   🎯 Alive Logo  » ${config?.bot?.logo ? "✅ Set" : "❌ Not Set"}
   🎨 Menu Logo   » ${config?.bot?.logo ? "✅ Set" : "❌ Not Set"}
   👑 Owner Logo  » ${config?.bot?.logo ? "✅ Set" : "❌ Not Set"}

╭━━━━━━━━━━━❀━━━━━━━━━━━╮
  ✨ *Owner Only Access* ✨
     🌸 *Personal Chat* 🌸
╰━━━━━━━━━━━❀━━━━━━━━━━━╯

🦁 *By TOPFEROS MD TECH*`;
}

/* ======================================================
   MESSAGE 2
   LOGIN INFORMATION
   NO COPY BUTTON
====================================================== */

function buildAccessText(session) {
  const ownerNumber =
    cleanNumber(session?.number) || "Not Set";

  const password =
    String(session?.code || "")
      .trim()
      .toUpperCase() || "Not Set";

  const settingsUrl =
    session?.link ||
    getSettingsUrl() ||
    "Not Set";

  return `🦁✧･ﾟ: *✧･ﾟ:* 🔐 *TOPFEROS MD LOGIN* 🔐 *:･ﾟ✧*:･ﾟ✧🐑

   🌸 *Owner Number*
   ╰┈➤ ${ownerNumber}

   🌸 *6-Digit Settings Code*
   ╰┈➤

   *${password}*

   🌐 *Web Settings*
   ╰┈➤ ${settingsUrl}

   ╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈╯
   ✨ *Keep Safe & Don't Share* ✨

TACH By TOPFEROS MD
_________________________________`;
}

/* ======================================================
   MESSAGE 3
   ORIGINAL IMPORTANT INSTRUCTIONS
====================================================== */

function buildInstructionsMessage() {
  return `To change your bot settings, please click the web link in the message above and go to the web page. Use the ownerNumber and password provided in the message above to log in and change your bot settings. After submitting your settings on the website, your bot will update the new settings within 3 minutes. ✅


Pour modifier les paramètres de votre bot, veuillez cliquer sur le lien web dans le message ci-dessus et accéder à la page web. Utilisez l’ownerNumber et le mot de passe indiqués dans le message ci-dessus pour vous connecter et modifier les paramètres de votre bot. Après avoir soumis les paramètres sur le site web, votre bot mettra à jour les nouveaux paramètres dans un délai de 3 minutes. ✅


Para cambiar la configuración de tu bot, haz clic en el enlace web del mensaje anterior y accede a la página web. Utiliza el ownerNumber y la contraseña que aparecen en el mensaje anterior para iniciar sesión y cambiar la configuración de tu bot. Después de enviar la configuración en el sitio web, tu bot actualizará los nuevos ajustes en un plazo de 3 minutos. ✅

🦁 *By TOPFEROS MD TECH*`;
}

/* ======================================================
   SEND ACCESS MESSAGE
   NO INTERACTIVE BUTTON
====================================================== */

async function sendAccessMessage(
  sock,
  chatId,
  session,
  quoted
) {
  try {
    const text = buildAccessText(session);

    await sock.sendMessage(
      chatId,
      {
        text
      },
      {
        quoted
      }
    );

    console.log(
      "[TOPFEROS] PANEL ACCESS SENT:",
      session?.code || "NO_CODE"
    );

    return true;
  } catch (error) {
    console.error(
      "[TOPFEROS] PANEL ACCESS ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    return false;
  }
}

/* ======================================================
   COMMAND
====================================================== */

async function execute({
  sock,
  message,
  sessionId,
  session
}) {
  const chatId =
    message?.key?.remoteJid;

  if (!chatId) {
    return;
  }

  try {
    if (!session?.sessionId) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *TOPFEROS MD*\n\n" +
            "Bot session lan pa jwenn.\n" +
            "Tanpri verifye koneksyon bot la."
        },
        {
          quoted: message
        }
      );

      return;
    }

    /* ==================================================
       GET REAL PANEL SESSION
       SA GARANTI CODE 6 CHIF LA SOTI NAN PANEL SESSION
    ================================================== */

    const panelSession =
      settingPanel.createSession(
        sock,
        session.sessionId
      );

    if (!panelSession) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *TOPFEROS MD*\n\n" +
            "Settings Panel session lan pa disponib."
        },
        {
          quoted: message
        }
      );

      return;
    }

    /* ==================================================
       LOAD REAL SETTINGS
    ================================================== */

    const loaded =
      settingPanel.loadSettings(
        panelSession.sessionId
      );

    if (!loaded) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *TOPFEROS MD*\n\n" +
            "Settings session lan pa disponib."
        },
        {
          quoted: message
        }
      );

      return;
    }

    const info =
      loaded.botInformation || {};

    const settings =
      loaded.settings || {};

    /* ==================================================
       MESSAGE 1
    ================================================== */

    await sock.sendMessage(
      chatId,
      {
        text:
          buildSettingsMessage(
            info,
            settings
          )
      },
      {
        quoted: message
      }
    );

    await new Promise(
      resolve =>
        setTimeout(resolve, 350)
    );

    /* ==================================================
       MESSAGE 2
       CODE + LOGIN
       NO COPY BUTTON
    ================================================== */

    await sendAccessMessage(
      sock,
      chatId,
      panelSession,
      message
    );

    await new Promise(
      resolve =>
        setTimeout(resolve, 350)
    );

    /* ==================================================
       MESSAGE 3
       ORIGINAL MESSAGE
    ================================================== */

    await sock.sendMessage(
      chatId,
      {
        text:
          buildInstructionsMessage()
      },
      {
        quoted: message
      }
    );

    console.log(
      `[TOPFEROS] .setting OK | session=${panelSession.sessionId} | number=${panelSession.number} | code=${panelSession.code}`
    );

  } catch (error) {
    console.error(
      "[TOPFEROS] ERÈ .setting:",
      error?.stack ||
      error?.message ||
      error
    );

    try {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *TOPFEROS MD*\n\n" +
            "Gen yon erè pandan m ap prepare Settings Panel la."
        },
        {
          quoted: message
        }
      );
    } catch {}
  }
}

/* ======================================================
   EXPORT
====================================================== */

module.exports = {
  name: "setting",

  aliases: [
    "settings",
    "config",
    "configuration"
  ],

  description:
    "Montre vrè settings bot la ak Settings Panel.",

  usage:
    ".setting",

  execute
};

// ╔════════════════════════════════════════════════════╗
// ║             🦁 By TOPFEROS MD TECH               ║
// ╚════════════════════════════════════════════════════╝