"use strict";

const fs = require("fs");
const path = require("path");

const config = require("../config");

// ============================================================
// TOPFEROS MD V1.0.0
// MENU COMMAND
// ============================================================

const LOGO_PATH = path.join(
  __dirname,
  "..",
  "assets",
  "logo.png"
);

// ============================================================
// GET CONNECTED USER
// ============================================================

function getConnectedUser(sock) {

  const user =
    sock?.user;

  if (!user) {

    return {
      name: "Unknown",
      number: "Unknown"
    };
  }

  const name =
    user.name ||
    user.verifiedName ||
    "Unknown";

  const id =
    user.id ||
    "";

  const number =
    id
      .split(":")[0]
      .split("@")[0]
      .replace(/\D/g, "") ||
    "Unknown";

  return {
    name,
    number
  };
}

// ============================================================
// MENU COMMAND
// ============================================================

async function execute(context) {

  const {
    sock,
    message
  } = context;

  const chatId =
    message?.key?.remoteJid;

  if (!chatId) {
    return;
  }

  // ==========================================================
  // CONFIG
  // ==========================================================

  const botName =
    config?.bot?.name ||
    "TOPFEROS MD";

  const version =
    config?.bot?.version ||
    "V1.0.0";

  const prefix =
    config?.bot?.prefix ||
    ".";

  const mode =
    String(
      config?.bot?.mode ||
      "public"
    ).toUpperCase();

  const ownerName =
    config?.owner?.name ||
    "TOPFEROS MD V1.0.0";

  // ==========================================================
  // CONNECTED USER
  // ==========================================================

  const connectedUser =
    getConnectedUser(sock);

  const showUserName =
    config?.bot?.session?.showUserName !== false;

  const showUserNumber =
    config?.bot?.session?.showUserNumber !== false;

  const userName =
    showUserName
      ? connectedUser.name
      : "Hidden";

  const userNumber =
    showUserNumber
      ? connectedUser.number
      : "Hidden";

  // ==========================================================
  // MENU TEXT
  // ==========================================================

  const menu = `

╭──⋅──⋅─🦁─⋅──⋅──╮
  💕 \`TOPFEROS MD V1.0.0\` 💕
╰──⋅──⋅─⋅─⋅─⋅──⋅──╯

👤 \`ᴏᴡɴᴇʀ\`   : \`${ownerName}\`
🤖 \`ʙᴏᴛ\`     : \`${botName}\`
📦 \`ᴠᴇʀsɪᴏɴ\` : \`${version}\`
📡 \`sᴛᴀᴛᴜs\`  : \`ONLINE\`
🔑 \`ᴘʀᴇғɪx\`  : \`${prefix}\`
⚙️ \`ᴍᴏᴅᴇ\`    : \`${mode}\`

⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆⋆ ˚｡⋆୨୧˚

.・。.・゜✭・.・✫・゜・。.
   🦁  *ɢᴇɴᴇʀᴀʟ ᴄᴏᴍᴍᴀɴᴅꜱ*  🦁
.・。.・゜✭・.・✫・゜・。.

🦁 \`${prefix}menu\` ➪ Show all commands
🦁 \`${prefix}setting\` ➪ Open settings
🦁 \`${prefix}help\` ➪ Command help
🦁 \`${prefix}info\` ➪ Bot information
🦁 \`${prefix}owner\` ➪ Show owner
🦁 \`${prefix}alive\` ➪ Check bot status
🦁 \`${prefix}ping\` ➪ Check response speed
🦁 \`${prefix}runtime\` ➪ Show runtime
🦁 \`${prefix}uptime\` ➪ Show uptime

.・。.・゜✭・.・✫・゜・。.
   🐜  *ᴀʀᴛɪғɪᴄɪᴀʟ ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ*  🐜
.・。.・゜✭・.・✫・゜・。.

🐜 \`${prefix}ai\` ➪ Ask AI
🐜 \`${prefix}chat\` ➪ Chat with AI
🐜 \`${prefix}ask\` ➪ Ask a question
🐜 \`${prefix}imagine\` ➪ Generate an image

.・。.・゜✭・.・✫・゜・。.
   😹  *ᴍᴇᴅɪᴀ ᴄᴏᴍᴍᴀɴᴅꜱ*  😹
.・。.・゜✭・.・✫・゜・。.

😹 \`${prefix}play\` ➪ Play / download music
😹 \`${prefix}download\` ➪ Download media
😹 \`${prefix}sticker\` ➪ Create sticker
😹 \`${prefix}toimg\` ➪ Sticker to image

.・。.・゜✭・.・✫・゜・。.
   🙊  *sᴛᴀᴛᴜs & ᴠɪᴇᴡ ᴏɴᴄᴇ*  🙊
.・。.・゜✭・.・✫・゜・。.

🙊 \`${prefix}status\` ➪ Status system
🙊 \`${prefix}vv2\` ➪ View Once
🙊 \`${prefix}viewonce\` ➪ View Once reply/forward

.・。.・゜✭・.・✫・゜・。.
   👁️  *ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅꜱ*  👁️
.・。.・゜✭・.・✫・゜・。.

👁️ \`${prefix}groupinfo\` ➪ Group information
👁️ \`${prefix}admin\` ➪ Show group admins
👁️ \`${prefix}tagall\` ➪ Mention all members
👁️ \`${prefix}add\` ➪ Add a member
👁️ \`${prefix}kick\` ➪ Remove a member
👁️ \`${prefix}promote\` ➪ Promote member
👁️ \`${prefix}demote\` ➪ Demote member
👁️ \`${prefix}open\` ➪ Open group
👁️ \`${prefix}close\` ➪ Close group

.・。.・゜✭・.・✫・゜・。.
   🐯  *ɢʀᴏᴜᴘ sᴇᴛᴛɪɴɢs*  🐯
.・。.・゜✭・.・✫・゜・。.

🐯 \`${prefix}setname\` ➪ Change group name
🐯 \`${prefix}setdesc\` ➪ Change group description
🐯 \`${prefix}setpp\` ➪ Change group picture

.・。.・゜✭・.・✫・゜・。.
   🐴  *ᴡᴇʟᴄᴏᴍᴇ sʏsᴛᴇᴍ*  🐴
.・。.・゜✭・.・✫・゜・。.

🐴 \`${prefix}setwelcome\` ➪ Configure welcome
🐴 \`${prefix}setgoodbye\` ➪ Configure goodbye

.・。.・゜✭・.・✫・゜・。.
   🫎  *ᴏᴛʜᴇʀ ᴄᴏᴍᴍᴀɴᴅꜱ*  🫎
.・。.・゜✭・.・✫・゜・。.

🫎 \`${prefix}parrain\` ➪ Generate Parrain code

.・。.・゜✭・.・✫・゜・。.

🐊 \`${prefix}help\` ➪ Show command help
🐊 \`${prefix}info\` ➪ Show bot information

.・。.・゜✭・.・✫・゜・。.

🐼 *ᴜsᴇʀ sᴇssɪᴏɴ*

👤 \`ᴜsᴇʀ\`   : \`${userName}\`
📱 \`ɴᴜᴍʙᴇʀ\` : \`${userNumber}\`

*━━━━━━━━━━━━━━━━━━━━*

</> ᴘᴏᴡᴇʀᴇᴅ ʙʏ TOPFEROS MD TECH 🦁

`;

  // ==========================================================
  // SEND MENU
  // ==========================================================

  try {

    if (
      fs.existsSync(
        LOGO_PATH
      )
    ) {

      const logo =
        fs.readFileSync(
          LOGO_PATH
        );

      await sock.sendMessage(
        chatId,
        {
          image: logo,
          caption: menu
        },
        {
          quoted: message
        }
      );

    } else {

      await sock.sendMessage(
        chatId,
        {
          text: menu
        },
        {
          quoted: message
        }
      );

    }

  } catch (error) {

    console.error(
      "❌ MENU ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

  }
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {

  name: "menu",

  aliases: [
    "commands",
    "cmds",
    "list"
  ],

  description:
    "Montre tout command TOPFEROS MD yo.",

  usage:
    ".menu",

  execute

};


// ╔════════════════════════════════════════════════════╗
// ║              🚀 BY TOPFEROS MD TECH              ║
// ╚════════════════════════════════════════════════════╝