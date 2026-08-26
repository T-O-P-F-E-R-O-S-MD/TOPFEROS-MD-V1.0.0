"use strict";

const crypto = require("crypto");

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                 🤝 PARRAIN CODE                  ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 PARRAIN CODE STORAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Parrain codes yo rete sèlman pandan bot la ap mache.
// Lè process Node.js la fèmen, Map sa a reset.
const parrainCodes = new Map();


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 GENERATE PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateParrainCode() {
  const randomPart = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `TOP-${randomPart}`;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAN NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase();
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆕 CREATE PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createParrainCode(ownerNumber) {
  const number =
    cleanNumber(ownerNumber);

  if (!number) {
    throw new Error(
      "Owner number pa disponib."
    );
  }

  let code;

  // Evite kreye menm code la de fwa.
  do {
    code = generateParrainCode();
  } while (parrainCodes.has(code));

  parrainCodes.set(
    code,
    {
      code,
      ownerNumber: number,
      createdAt: Date.now(),
      used: false
    }
  );

  return code;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 VERIFY PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function verifyParrainCode(code) {
  const clean =
    cleanCode(code);

  if (!clean) {
    return {
      success: false,
      message:
        "❌ Parrain Code obligatwa."
    };
  }

  const data =
    parrainCodes.get(clean);

  if (!data) {
    return {
      success: false,
      message:
        "❌ Parrain Code la pa valid."
    };
  }

  if (data.used) {
    return {
      success: false,
      message:
        "❌ Parrain Code sa deja itilize."
    };
  }

  return {
    success: true,
    code: data
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 USE PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function useParrainCode(code) {
  const result =
    verifyParrainCode(code);

  if (!result.success) {
    return result;
  }

  result.code.used = true;
  result.code.usedAt = Date.now();

  return {
    success: true,
    message:
      "✅ Parrain Code valide.",
    data:
      result.code
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗑️ DELETE PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function deleteParrainCode(code) {
  const clean =
    cleanCode(code);

  if (!clean) {
    return false;
  }

  return parrainCodes.delete(
    clean
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 CHECK CODE EXISTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function hasParrainCode(code) {
  const clean =
    cleanCode(code);

  if (!clean) {
    return false;
  }

  return parrainCodes.has(
    clean
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 GET ALL PARRAIN CODES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getParrainCodes() {
  return Array.from(
    parrainCodes.values()
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAR ALL CODES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function clearParrainCodes() {
  parrainCodes.clear();
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📩 PARRAIN COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleParrainCommand({
  sock,
  jid,
  args = [],
  config
}) {
  try {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 👑 GET OWNER NUMBER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const ownerNumber =
      config?.owner?.number;

    if (!ownerNumber) {
      throw new Error(
        "Owner number pa configured nan config la."
      );
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔐 CREATE CODE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const code =
      createParrainCode(
        ownerNumber
      );


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND CODE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendMessage(
      jid,
      {
        text:
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
          "🚀 TOPFEROS TECH\n" +
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      }
    );

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

    if (
      sock &&
      jid
    ) {
      try {
        await sock.sendMessage(
          jid,
          {
            text:
              "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
              "┃        ❌ ERROR\n" +
              "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

              "Pa kapab kreye Parrain Code la.\n\n" +

              "⚙️ Verifye:\n" +
              "• config.owner.number\n" +
              "• WhatsApp connection\n" +
              "• Bot permissions\n\n" +

              "🚀 TOPFEROS TECH"
          }
        );
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

  // 🤝 Main command
  handleParrainCommand,

  // 🔐 Code management
  generateParrainCode,
  createParrainCode,
  verifyParrainCode,
  useParrainCode,

  // 🗑️ Code management
  deleteParrainCode,
  hasParrainCode,
  getParrainCodes,
  clearParrainCodes
};


// ╔════════════════════════════════════════════════════╗
// ║                 TOPFEROS TECH                     ║
// ║                TOPFEROS MD V1.0.0                 ║
// ╚════════════════════════════════════════════════════╝