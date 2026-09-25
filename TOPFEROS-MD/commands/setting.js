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

/* ======================================================
   FIND REAL PANEL SESSION
====================================================== */

function getRealSession(sock) {
  try {

    // 1. Find session by exact socket
    if (
      typeof settingPanel.getSessionBySocket ===
      "function"
    ) {

      const session =
        settingPanel.getSessionBySocket(sock);

      if (session?.sessionId) {

        console.log(
          `[TOPFEROS] Session found by socket: ${session.sessionId}`
        );

        return session;
      }
    }

    // 2. Fallback: find session by WhatsApp number
    const socketNumber =
      cleanNumber(
        sock?.user?.id
      );

    if (
      socketNumber &&
      typeof settingPanel.getSessionByNumber ===
        "function"
    ) {

      const session =
        settingPanel.getSessionByNumber(
          socketNumber
        );

      if (session?.sessionId) {

        console.log(
          `[TOPFEROS] Session found by number: ${session.sessionId}`
        );

        return session;
      }
    }

    console.error(
      "[TOPFEROS] Pa jwenn panel session pou socket/number:",
      socketNumber || "UNKNOWN"
    );

    return null;

  } catch (error) {

    console.error(
      "[TOPFEROS] Erè jwenn panel session:",
      error?.stack ||
      error?.message ||
      error
    );

    return null;
  }
}

/* ======================================================
   ON / OFF
====================================================== */

function onOff(value) {
  return value
    ? "✅ ON"
    : "❌ OFF";
}

/* ======================================================
   DELETE DESTINATION
====================================================== */

function getDeleteDestination(settings) {

  if (
    settings?.antiDeleteSameChat
  ) {
    return "📥 INBOX";
  }

  if (
    settings?.antiDeleteDM
  ) {
    return "📩 Sender";
  }

  return "❌ OFF";
}

/* ======================================================
   MODE
====================================================== */

function getMode(
  info,
  settings
) {

  if (
    settings?.privateMode
  ) {
    return "🔒 Private";
  }

  if (
    settings?.publicMode
  ) {
    return "🌐 Public";
  }

  return (
    info?.mode ||
    "Unknown"
  );
}

/* ======================================================
   REAL PANEL LINK
====================================================== */

function getSettingsUrl(session) {

  /*
   * IMPORTANT:
   * Itilize vrè link sessionPanel la kreye.
   * Pa konstwi yon lòt URL.
   */

  if (
    session?.link &&
    /^https?:\/\//i.test(
      session.link
    )
  ) {

    return session.link;
  }

  /*
   * Si session.link pa disponib,
   * nou itilize menm PANEL_URL
   * settingPanel.js itilize a.
   */

  const panelUrl =
    settingPanel?.PANEL_URL ||
    process.env.SETTINGS_PANEL_URL ||
    process.env.PANEL_URL ||
    "";

  if (
    !panelUrl ||
    !session?.sessionId
  ) {
    return "";
  }

  return (
    `${String(panelUrl).replace(/\/+$/, "")}` +
    `/?session=${encodeURIComponent(
      session.sessionId
    )}`
  );
}

/* ======================================================
   MESSAGE 1
   REAL CURRENT SETTINGS
====================================================== */

function buildSettingsMessage(
  info,
  settings
) {

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
    getMode(
      info,
      settings
    );

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
====================================================== */

function buildAccessMessage(
  session
) {

  const settingsUrl =
    getSettingsUrl(session);

  /*
   * Nou pa mete /contactsave paske
   * pa gen route sa nan panel aktyèl la.
   */

  return `✧･ﾟ: *✧･ﾟ:* 🔐 *TOPFEROS MD V1.0.0* 🔐 *:･ﾟ✧*:･ﾟ✧

   🌸 *Owner Number*
   ╰┈➤ ${session?.number || "Not Set"}

   🌸 *Password*
   ╰┈➤ ${session?.code || "Not Set"}

   🌐 *Web Settings*
   ╰┈➤ ${settingsUrl || "Not Set"}

╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈╯
   💖 *Keep Safe & Don't Share* 💖

🦁 *By TOPFEROS MD TECH*`;
}

/* ======================================================
   COPY PASSWORD
====================================================== */

async function sendCopyPassword(
  sock,
  chatId,
  session
) {

  const code =
    String(
      session?.code || ""
    ).trim();

  if (!code) {
    return false;
  }

  try {

    await sock.sendMessage(
      chatId,
      {
        interactiveMessage: {

          header:
            "🔐 TOPFEROS MD",

          title:
            "Settings Password",

          footer:
            "🦁 By TOPFEROS MD TECH",

          buttons: [
            {
              name:
                "cta_copy",

              buttonParamsJson:
                JSON.stringify({

                  display_text:
                    "📋 Copy Password",

                  id:
                    "copy_settings_password",

                  copy_code:
                    code

                })
            }
          ]
        }
      }
    );

    console.log(
      "[TOPFEROS] Copy Password button sent."
    );

    return true;

  } catch (error) {

    console.warn(
      "[TOPFEROS] Copy button pa disponib:",
      error?.message ||
      error
    );

    /*
     * Fallback:
     * si WhatsApp pa sipòte bouton an,
     * password la toujou disponib.
     */

    try {

      await sock.sendMessage(
        chatId,
        {
          text:
            `📋 *Copy Password*\n\n` +
            `\`${code}\``
        }
      );

    } catch (
      fallbackError
    ) {

      console.error(
        "[TOPFEROS] Copy fallback error:",
        fallbackError?.message ||
        fallbackError
      );
    }

    return false;
  }
}

/* ======================================================
   MESSAGE 3
====================================================== */

function buildInstructionsMessage() {

  return `

To change your bot settings, please click the web link in the message above and go to the web page. Use the ownerNumber and password provided in the message above to log in and change your bot settings. After submitting your settings on the website, your bot will update the new settings within 3 minutes. ✅



Pour modifier les paramètres de votre bot, veuillez cliquer sur le lien web dans le message ci-dessus et accéder à la page web. Utilisez l’ownerNumber et le mot de passe indiqués dans le message ci-dessus pour vous connecter et modifier les paramètres de votre bot. Après avoir soumis les paramètres sur le site web, votre bot mettra à jour les nouveaux paramètres dans un délai de 3 minutes. ✅



Para cambiar la configuración de tu bot, haz clic en el enlace web del mensaje anterior y accede a la página web. Utiliza el ownerNumber y la contraseña que aparecen en el mensaje anterior para iniciar sesión y cambiar la configuración de tu bot. Después de enviar la configuración en el sitio web, tu bot actualizará los nuevos ajustes en un plazo de 3 minutos. ✅

🦁 *By TOPFEROS MD TECH*`;
}

/* ======================================================
   COMMAND
====================================================== */

async function execute({
  sock,
  message
}) {

  const chatId =
    message?.key?.remoteJid;

  if (!chatId) {
    return;
  }

  try {

    /*
     * FIND REAL SESSION
     */

    const session =
      getRealSession(sock);

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

    /*
     * LOAD REAL SETTINGS
     */

    const loaded =
      settingPanel.loadSettings(
        session.sessionId
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
      loaded.botInformation ||
      {};

    const settings =
      loaded.settings ||
      {};

    /*
     * MESSAGE 1
     */

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

    /*
     * SMALL DELAY
     */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          350
        )
    );

    /*
     * MESSAGE 2
     */

    await sock.sendMessage(
      chatId,
      {
        text:
          buildAccessMessage(
            session
          )
      }
    );

    /*
     * COPY PASSWORD
     */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          350
        )
    );

    await sendCopyPassword(
      sock,
      chatId,
      session
    );

    /*
     * MESSAGE 3
     */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          350
        )
    );

    await sock.sendMessage(
      chatId,
      {
        text:
          buildInstructionsMessage()
      }
    );

    console.log(
      `[TOPFEROS] .setting OK | session=${session.sessionId} | number=${session.number}`
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
        }
      );

    } catch {}
  }
}

/* ======================================================
   EXPORT
====================================================== */

module.exports = {

  name:
    "setting",

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