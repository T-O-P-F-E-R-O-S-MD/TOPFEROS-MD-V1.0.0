"src/messageHandler.js"

"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                📩 MESSAGE HANDLER                ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_PREFIX = ".";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📩 MAIN MESSAGE HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleMessage(sock, message) {
  try {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🛡️ BASIC VALIDATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      !sock ||
      !message ||
      !message.message
    ) {
      return;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📍 CHAT JID
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const remoteJid =
      message.key?.remoteJid;

    if (!remoteJid) {
      return;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🚫 IGNORE STATUS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      remoteJid === "status@broadcast"
    ) {
      return;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 👤 SENDER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const sender =
      message.key?.participant ||
      remoteJid;

    const isFromMe =
      message.key?.fromMe === true;


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💬 EXTRACT TEXT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const text =
      getMessageText(message);


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔰 GET PREFIX
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const prefix =
      getPrefix();


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📦 COMMAND DETECTION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const hasPrefix =
      typeof text === "string" &&
      text.startsWith(prefix);


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⚙️ COMMAND HANDLING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (hasPrefix) {

      const commandText =
        text
          .slice(prefix.length)
          .trim();

      if (!commandText) {
        return;
      }


      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🧩 PARSE COMMAND
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const parts =
        commandText.split(/\s+/);

      const command =
        String(
          parts.shift() || ""
        )
          .trim()
          .toLowerCase();

      const args =
        parts;

      if (!command) {
        return;
      }


      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📝 ARGUMENTS TEXT
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const commandArgsText =
        args.join(" ").trim();


      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📦 COMMAND CONTEXT
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const commandData = {

        // 🤖 WhatsApp socket
        sock,

        // 📨 Original message
        message,

        // 📍 Chat
        jid: remoteJid,

        // 👤 Sender
        sender,

        // 👑 Bot account
        isFromMe,

        // 💬 Original text
        text,

        // 🔰 Prefix
        prefix,

        // ⚡ Command
        command,

        // 📋 Arguments
        args,

        // 📝 Arguments as text
        commandText: commandArgsText,

        // ⚙️ Config
        config

      };


      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📝 COMMAND LOG
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        `📩 COMMAND: ${prefix}${command}`
      );

      console.log(
        `👤 SENDER: ${sender}`
      );

      console.log(
        `💬 TEXT: ${text}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );


      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔌 LOAD COMMAND ROUTER
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const commandRouter =
        require("../commands");


      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ⚡ EXECUTE COMMAND
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      if (
        commandRouter &&
        typeof commandRouter.handle ===
          "function"
      ) {

        const handled =
          await commandRouter.handle(
            commandData
          );


        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ✅ COMMAND EXECUTED
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        if (handled) {

          console.log(
            `✅ COMMAND EXECUTED: ${prefix}${command}`
          );

          return;
        }


        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ⚠️ COMMAND NOT FOUND
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        console.log(
          `⚠️ COMMAND NOT HANDLED: ${prefix}${command}`
        );

      } else {

        console.error(
          "❌ Command router pa disponib."
        );

      }

      return;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🤖 NON-PREFIX MESSAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //
    // Mesaj san prefix yo pa command.
    //
    // Yo rete disponib pou fonksyon otomatik yo:
    //
    // • Auto Status
    // • View Once
    // • Auto Chat / AI
    // • Auto React
    // • Anti Spam
    // • Lòt handlers otomatik
    //
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const automaticContext = {

      sock,

      message,

      jid: remoteJid,

      sender,

      isFromMe,

      text,

      prefix,

      config

    };


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔄 AUTOMATIC HANDLER HOOK
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //
    // Pou kounye a nou pa fòse okenn fonksyon isit la.
    // Sa pèmèt nou ajoute yo san nou pa kraze commands.
    //
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      typeof module.exports.handleAutomatic ===
        "function"
    ) {

      await module.exports.handleAutomatic(
        automaticContext
      );

    }

  } catch (error) {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🚨 GLOBAL ERROR
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.error(
      "❌ MESSAGE HANDLER ERROR:"
    );

    console.error(
      error?.message || error
    );

    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 GET MESSAGE TEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getMessageText(message) {

  const content =
    message?.message;

  if (!content) {
    return null;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💬 PLAIN TEXT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (
    typeof content.conversation ===
      "string"
  ) {

    return content.conversation;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 EXTENDED TEXT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (
    typeof content
      .extendedTextMessage
      ?.text === "string"
  ) {

    return content
      .extendedTextMessage
      .text;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🖼️ IMAGE CAPTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (
    typeof content
      .imageMessage
      ?.caption === "string"
  ) {

    return content
      .imageMessage
      .caption;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎥 VIDEO CAPTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (
    typeof content
      .videoMessage
      ?.caption === "string"
  ) {

    return content
      .videoMessage
      .caption;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📄 DOCUMENT CAPTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (
    typeof content
      .documentMessage
      ?.caption === "string"
  ) {

    return content
      .documentMessage
      .caption;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ NO TEXT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔰 GET PREFIX
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getPrefix() {

  return (
    config?.bot?.prefix ||
    DEFAULT_PREFIX
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 AUTOMATIC HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Fonksyon sa a se yon hook pou handlers otomatik.
// Nou kite l vid pou kounye a pou evite erè.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleAutomatic(context = {}) {

  // Fonksyon otomatik yo pral ajoute isit la.
  return false;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  // 📩 Main handler
  handleMessage,

  // 💬 Text extractor
  getMessageText,

  // 🔰 Prefix helper
  getPrefix,

  // 🔄 Automatic handler
  handleAutomatic

};


// ╔════════════════════════════════════════════════════╗
// ║                    By TOPFEROS MD                 ║
// ╚════════════════════════════════════════════════════╝