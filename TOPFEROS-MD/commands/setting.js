"use strict";

const config = require("../config");
const settingPanel = require("../src/settingPanel");

function cleanNumber(v) {
  return String(v || "")
    .split(":")[0]
    .split("@")[0]
    .replace(/\D/g, "");
}

function onOff(v) {
  return v ? "✅ ON" : "❌ OFF";
}

function getMode(info, s) {
  if (s?.privateMode) return "🔒 Private";
  if (s?.publicMode) return "🌐 Public";
  return info?.mode || "Unknown";
}

function getDeleteDestination(s) {
  if (s?.antiDeleteSameChat) return "📥 INBOX";
  if (s?.antiDeleteDM) return "📩 Sender";
  return "❌ OFF";
}

function getSettingsUrl() {
  const base =
    settingPanel?.PANEL_URL ||
    process.env.SETTINGS_PANEL_URL ||
    process.env.PANEL_URL ||
    "";

  return base
    ? `${String(base).replace(/\/+$/, "")}/setting`
    : "Not Set";
}

function buildSettingsMessage(info, s) {
  const name =
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

  return `╭━━━━━━━━━━━❀━━━━━━━━━━━╮
       🦁 *BOT SETTINGS* 🐑
      🐑 *${name}* 🦁
╰━━━━━━━━━━━❀━━━━━━━━━━━╯

✨ *USER INFO*

🎀 Name   » ${name}
📱 Number » ${number}
🎂 Age    » 24
📍 From   » TOPFEROS TECH
🔤 Prefix » ${prefix}
🌐 Mode   » ${getMode(info, s)}

🛡️ *PROTECTION*

🔗 Anti Link      » ${onOff(s?.antiLink)}
📞 Anti Call      » ${onOff(s?.antiCall)}
🛸 Anti Bot       » ${onOff(s?.antiRobot)}

🗑️ *DELETE LOGS*

👀 Anti Delete    » ${onOff(s?.antiDelete)}
📤 Delete Send    » ${getDeleteDestination(s)}

📊 *STATUS*

👁️ Status Read    » ${onOff(s?.autoStatus)}
❤️ Status React   » ${onOff(s?.statusReact)}
📤 Status Reply   » ${onOff(s?.statusReply)}

🤖 *AUTOMATION*

🟢 Always Online  » ${onOff(s?.alwaysOnline)}
⌨️ Auto Typing    » ${onOff(s?.fakeTyping)}
🎙️ Recording      » ${onOff(s?.fakeRecording)}

╭━━━━━━━━━━━❀━━━━━━━━━━━╮
  ✨ *Owner Only Access* ✨
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

🦁 *By TOPFEROS MD TECH*`;
}

function buildAccessText(session) {
  const number =
    cleanNumber(session?.number) ||
    "Not Set";

  const code =
    String(session?.code || "").trim() ||
    "Not Set";

  return `🔐 *TOPFEROS MD LOGIN*

🌸 *Owner Number*
╰┈➤ ${number}

🔑 *6-Digit Settings Code*
╰┈➤ *${code}*

🌐 *Web Settings*
╰┈➤ ${getSettingsUrl()}

⚠️ *Keep the code private.*

🦁 TOPFEROS MD TECH`;
}

async function sendAccessMessage(
  sock,
  chatId,
  session,
  quoted
) {
  const text =
    buildAccessText(session);

  const code =
    String(session?.code || "").trim();

  if (!code) {
    await sock.sendMessage(
      chatId,
      { text },
      { quoted }
    );

    return;
  }

  try {
    await sock.sendMessage(
      chatId,
      {
        interactiveMessage: {
          header: {
            title:
              "🔐 TOPFEROS MD SETTINGS"
          },

          body: {
            text
          },

          footer: {
            text:
              "🦁 TOPFEROS MD TECH"
          },

          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_copy",

                buttonParamsJson:
                  JSON.stringify({
                    display_text:
                      "📋 Copy code",

                    id:
                      "copy_settings_code",

                    copy_code:
                      code
                  })
              }
            ],

            messageParamsJson: ""
          }
        }
      },
      {
        quoted
      }
    );

  } catch (e) {

    console.warn(
      "[SETTING] interactive failed:",
      e?.message || e
    );

    await sock.sendMessage(
      chatId,
      {
        text:
          `${text}\n\n` +
          `📋 *Copy code:* ${code}`
      },
      {
        quoted
      }
    );
  }
}

async function execute({
  sock,
  message,
  session
}) {
  const chatId =
    message?.key?.remoteJid;

  if (!chatId) return;

  try {

    if (!session?.sessionId) {

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *TOPFEROS MD*\n\n" +
            "Bot session lan pa jwenn."
        },
        {
          quoted: message
        }
      );

      return;
    }

    const panelSession =
      settingPanel.createSession(
        sock,
        session.sessionId
      ) || session;

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

    await sock.sendMessage(
      chatId,
      {
        text:
          buildSettingsMessage(
            loaded.botInformation || {},
            loaded.settings || {}
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

    await sock.sendMessage(
      chatId,
      {
        text:
          `🌐 *Settings Panel*\n\n` +
          `Antre Owner Number ak kòd 6 chif ` +
          `ki nan mesaj anlè a.\n\n` +
          `Apre SAVE, nouvo settings yo ` +
          `ap aplike nan session sa a.\n\n` +
          `${getSettingsUrl()}`
      },
      {
        quoted: message
      }
    );

  } catch (e) {

    console.error(
      "[SETTING] ERROR:",
      e?.stack || e
    );

    try {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Gen yon erè pandan " +
            "m ap prepare Settings Panel la."
        },
        {
          quoted: message
        }
      );
    } catch {}
  }
}

module.exports = {
  name: "setting",

  aliases: [
    "settings",
    "config",
    "configuration"
  ],

  description:
    "Montre settings bot la ak Settings Panel.",

  usage:
    ".setting",

  execute
};