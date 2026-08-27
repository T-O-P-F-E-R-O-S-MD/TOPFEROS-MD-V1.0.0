"use strict";

const fs = require("fs");
const path = require("path");

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤝 TOPFEROS MD — PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🖼️ Logo bot la
const LOGO_PATH = path.join(
__dirname,
"..",
"assets",
"logo.png"
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤝 LOAD PARRAIN SERVICE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const parrainService =
require("../services/parrain");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📩 PARRAIN COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleParrainCommand({
sock,
jid,
args = [],
config: commandConfig
}) {

try {

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const botConfig =
  commandConfig || config;

const ownerNumber =
  botConfig?.owner?.number;

if (!ownerNumber) {
  throw new Error(
    "Owner number pa configured nan config la."
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 CREATE PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const result =
  parrainService.createParrainCode(
    ownerNumber
  );

const code =
  typeof result === "string"
    ? result
    : result?.code;

if (!code) {
  throw new Error(
    "Parrain Code la pa kapab kreye."
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤝 PARRAIN MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const parrainMessage =
  "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
  "┃\n" +
  "┃        🤝 PARRAIN CODE\n" +
  "┃\n" +
  "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

  "🔐 *Code Parrain:*\n" +
  `${code}\n\n` +

  "🟢 Code la pare pou itilize.\n" +
  "⏳ Li rete disponib jiskaske li itilize.\n\n" +

  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
  "By TOPFEROS MD\n" +
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 SEND PARRAIN CODE WITH LOGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (fs.existsSync(LOGO_PATH)) {

  const logo =
    fs.readFileSync(LOGO_PATH);

  await sock.sendMessage(
    jid,
    {
      image: logo,
      caption: parrainMessage
    }
  );

} else {

  console.warn(
    `⚠️ Logo pa jwenn: ${LOGO_PATH}`
  );

  await sock.sendMessage(
    jid,
    {
      text: parrainMessage
    }
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 LOG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log(
  `🤝 Parrain Code created: ${code}`
);

return {
  success: true,
  code
};

} catch (error) {

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❌ ERROR HANDLING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.error(
  "❌ PARRAIN COMMAND ERROR:",
  error?.message || error
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 SEND ERROR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (sock && jid) {

  try {

    const errorMessage =
      "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
      "┃        ❌ PARRAIN ERROR\n" +
      "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

      "Pa kapab kreye Parrain Code la.\n\n" +

      "⚙️ Verifye:\n" +
      "• config.owner.number\n" +
      "• services/parrain.js\n" +
      "• WhatsApp connection\n\n" +

      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "By TOPFEROS MD\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";


    if (fs.existsSync(LOGO_PATH)) {

      const logo =
        fs.readFileSync(LOGO_PATH);

      await sock.sendMessage(
        jid,
        {
          image: logo,
          caption: errorMessage
        }
      );

    } else {

      await sock.sendMessage(
        jid,
        {
          text: errorMessage
        }
      );
    }

  } catch (sendError) {

    console.error(
      "❌ PARRAIN ERROR MESSAGE:",
      sendError?.message || sendError
    );

  }
}


return {
  success: false,
  message:
    error?.message ||
    "Unknown error"
};

}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
handleParrainCommand
};

// ╔════════════════════════════════════════════════════╗
// ║                    By TOPFEROS MD                 ║
// ╚════════════════════════════════════════════════════╝