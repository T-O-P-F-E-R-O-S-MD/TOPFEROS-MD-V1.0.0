"use strict";

/*
|--------------------------------------------------------------------------
| TOPFEROS MD V2.0.0
| HELP COMMAND
|--------------------------------------------------------------------------
|
| Shows users how to use TOPFEROS MD and its commands.
|
|--------------------------------------------------------------------------
*/

async function helpCommand(ctx) {
  const prefix =
    ctx.prefix || ".";

  const help = [
    "╭━━━〔 🦁 TOPFEROS MD HELP 〕━━━╮",
    "┃",
    "┃ 📖 HOW TO USE TOPFEROS MD",
    "┃",
    "┃ Use the bot prefix before commands.",
    `┃ Prefix: ${prefix}`,
    "┃",
    "┃ Example:",
    `┃ ${prefix}menu`,
    `┃ ${prefix}help`,
    `┃ ${prefix}ai Hello`,
    "┃",
    "",
    "┣━━━〔 📋 GENERAL COMMANDS 〕━━━",
    "┃",
    `┃ ${prefix}menu`,
    "┃ └─ Display the complete command menu.",
    `┃ ${prefix}help`,
    "┃ └─ Display this user guide.",
    `┃ ${prefix}info`,
    "┃ └─ Display bot information.",
    "┃",
    "┣━━━〔 ⚙️ SETTINGS PANEL 〕━━━",
    "┃",
    `┃ ${prefix}setting`,
    "┃ └─ Open the TOPFEROS MD Settings Panel.",
    "┃",
    "┃ The Settings Panel allows you to manage",
    "┃ available bot settings from the web panel.",
    "┃",
    "┃ Depending on the settings enabled for",
    "┃ your bot, you can manage options such as:",
    "┃",
    "┃ • Bot name",
    "┃ • Location",
    "┃ • Age",
    "┃ • Prefix",
    "┃ • Footer",
    "┃ • Public / Private mode",
    "┃ • Always Online",
    "┃ • Fake Typing",
    "┃ • Fake Recording",
    "┃ • AI Chat",
    "┃ • Auto Reply",
    "┃ • Auto Status Seen",
    "┃ • Auto Status Like",
    "┃ • Anti Call",
    "┃ • Anti Delete",
    "┃ • Anti Spam",
    "┃ • Anti Bot",
    "┃",
    "┣━━━〔 🤖 AI COMMANDS 〕━━━",
    "┃",
    `┃ ${prefix}ai <question>`,
    "┃ └─ Ask the TOPFEROS MD AI assistant.",
    "┃",
    `┃ ${prefix}prompt <request>`,
    "┃ └─ Create or improve an AI prompt.",
    "┃",
    "┣━━━〔 🎵 MEDIA COMMANDS 〕━━━",
    "┃",
    `┃ ${prefix}play song <direct-url>`,
    "┃ └─ Download and send authorized audio.",
    "┃",
    `┃ ${prefix}play video <direct-url>`,
    "┃ └─ Download and send authorized video.",
    "┃",
    `┃ ${prefix}video <direct-url>`,
    "┃ └─ Process and send a video.",
    "┃",
    "┣━━━〔 👁️ VIEW ONCE 〕━━━",
    "┃",
    `┃ ${prefix}vv2`,
    "┃ └─ Reply to a View Once photo or video",
    "┃    to decode and retrieve it.",
    "┃",
    "┃ 📩 PRIVATE DM AUTO-DECODE",
    "┃",
    "┃ If someone sends a View Once photo or",
    "┃ video directly to the bot's private DM,",
    "┃ TOPFEROS MD can automatically decode it",
    "┃ without requiring a command.",
    "┃",
    "┃ No prefix is required for this feature.",
    "┃",
    "┣━━━〔 🔗 SYSTEM COMMANDS 〕━━━",
    "┃",
    `┃ ${prefix}pair <phone-number>`,
    "┃ └─ Create a WhatsApp pairing session.",
    `┃ ${prefix}parrain`,
    "┃ └─ Generate a Parrain code.",
    "┃",
    "┣━━━〔 💡 HOW COMMANDS WORK 〕━━━",
    "┃",
    "┃ 1. Type the prefix.",
    "┃ 2. Type the command.",
    "┃ 3. Add the required information.",
    "┃ 4. Send the message.",
    "┃",
    "┃ Example:",
    `┃ ${prefix}ai What is artificial intelligence?`,
    "┃",
    `┃ ${prefix}play song https://example.com/song.mp3`,
    "┃",
    "┃ ⚠️ Some commands require a specific",
    "┃ chat type, reply, URL, or other input.",
    "┃",
    "╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯",
    "",
    "🦁 TECH BY TOPFEROS MD 🐑"
  ].join("\n");

  await ctx.send(help);

  return {
    success: true
  };
}

module.exports = {
  helpCommand
};