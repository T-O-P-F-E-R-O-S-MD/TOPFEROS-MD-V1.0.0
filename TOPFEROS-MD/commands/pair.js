"use strict";

/*
|--------------------------------------------------------------------------
| 🦁 TOPFEROS MD V2.0.0

PAIR COMMAND

|
| Usage:
| .pair 509XXXXXXXX
|
| The phone number is used to create an
| independent WhatsApp session.

async function pairCommand(
sock,
message,
args = []
) {
const number =
String(args?.[0] || "")
.replace(/\D/g, "");

/*

* A phone number is required.
  */

if (!number) {
const jid =
message?.key?.remoteJid;

if (jid && sock) {
  await sock.sendMessage(
    jid,
    {
      text: [
        "❌ PHONE NUMBER REQUIRED",
        "",
        "Use the command like this:",
        ".pair 509XXXXXXXX",
        "",
        "📱 Include the country code.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    }
  );
}

return {
  success: false,
  error: "Phone number is required."
};

}

/*

* Basic phone-number length validation.
* The final validation is also handled by
* pairSession() in src/connection.js.
  */

if (
number.length < 8 ||
number.length > 15
) {
const jid =
message?.key?.remoteJid;

if (jid && sock) {
  await sock.sendMessage(
    jid,
    {
      text: [
        "❌ INVALID PHONE NUMBER",
        "",
        "Use the international format:",
        ".pair 509XXXXXXXX",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    }
  );
}

return {
  success: false,
  error: "Invalid phone number."
};

}

/*

* Load connection lazily.
* 
* This avoids creating a circular dependency
* while messageHandler.js loads.
  */

const {
pairSession
} = require("../src/connection");

try {
/*
* Create or reuse the independent session
* and request its WhatsApp pairing code.
*/

const result =
  await pairSession(number);

const jid =
  message?.key?.remoteJid;

if (jid && sock) {
  await sock.sendMessage(
    jid,
    {
      text: [
        "╭━━━〔 🦁 TOPFEROS MD V2.0.0 🐑 〕━━━╮",
        "┃",
        "┃ 🔐 PAIRING CODE",
        "┃",
        `┃ 📱 NUMBER: ${result.sessionId}`,
        "┃",
        `┃ 🔑 CODE: ${result.pairingCode}`,
        "┃",
        "┃ 📲 Open WhatsApp on the number above.",
        "┃ ⚙️ Go to Linked Devices.",
        "┃ 🔗 Choose Link a Device.",
        "┃ 🔢 Enter the pairing code above.",
        "┃",
        "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯",
        "",
        "🟢 The session will connect after pairing.",
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    }
  );
}

return {
  success: true,
  sessionId:
    result.sessionId,
  pairingCode:
    result.pairingCode
};

} catch (error) {
const jid =
message?.key?.remoteJid;

if (jid && sock) {
  await sock.sendMessage(
    jid,
    {
      text: [
        "❌ PAIRING FAILED",
        "",
        `📱 NUMBER: ${number}`,
        `⚠️ ${error?.message || "Unable to generate pairing code."}`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    }
  );
}

return {
  success: false,
  error:
    error?.message ||
    "Unable to generate pairing code."
};

}
}

module.exports = {
pairCommand
};