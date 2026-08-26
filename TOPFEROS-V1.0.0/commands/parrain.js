"commands/parrain.js"

"use strict";

const crypto = require("crypto");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤝 TOPFEROS MD — PARRAIN CODE
// 🚀 TOPFEROS TECH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Parrain codes yo rete pandan pwosesis bot la ap mache.
const parrainCodes = new Map();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 GENERATE PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateParrainCode() {
  return (
    "TOP-" +
    crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆕 CREATE CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createParrainCode(ownerNumber) {
  const number = String(ownerNumber || "")
    .replace(/\D/g, "");

  if (!number) {
    throw new Error(
      "Owner number pa disponib."
    );
  }

  const code = generateParrainCode();

  parrainCodes.set(code, {
    code,
    ownerNumber: number,
    createdAt: Date.now(),
    used: false
  });

  return code;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 VERIFY CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function verifyParrainCode(code) {
  if (!code) {
    return {
      success: false,
      message: "❌ Parrain Code obligatwa."
    };
  }

  const cleanCode = String(code)
    .trim()
    .toUpperCase();

  const data = parrainCodes.get(cleanCode);

  if (!data) {
    return {
      success: false,
      message: "❌ Parrain Code la pa valid."
    };
  }

  if (data.used) {
    return {
      success: false,
      message: "❌ Parrain Code sa deja itilize."
    };
  }

  return {
    success: true,
    code: data
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 USE CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function useParrainCode(code) {
  const result = verifyParrainCode(code);

  if (!result.success) {
    return result;
  }

  result.code.used = true;

  return {
    success: true,
    message: "✅ Parrain Code valide.",
    data: result.code
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 DELETE CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function deleteParrainCode(code) {
  if (!code) {
    return false;
  }

  return parrainCodes.delete(
    String(code).trim().toUpperCase()
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📩 COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleParrainCommand({
  sock,
  jid,
  args,
  config
}) {
  try {
    const ownerNumber =
      config?.owner?.number;

    const code =
      createParrainCode(ownerNumber);

    await sock.sendMessage(
      jid,
      {
        text:
          "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
          "┃ 🤝 PARRAIN CODE\n" +
          "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +
          "🔐 Code:\n" +
          `${code}\n\n` +
          "🟢 Code la pare pou itilize.\n\n" +
          "Made in TOPFEROS TECH\n" +
          "========================"
      }
    );

    return {
      success: true,
      code
    };

  } catch (error) {
    console.error(
      "❌ PARRAIN COMMAND ERROR:",
      error?.message || error
    );

    if (sock && jid) {
      await sock.sendMessage(
        jid,
        {
          text:
            "❌ Pa kapab kreye Parrain Code la.\n\n" +
            "Verifye owner.number nan config la."
        }
      );
    }

    return {
      success: false,
      message: error?.message || "Unknown error"
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  handleParrainCommand,
  createParrainCode,
  verifyParrainCode,
  useParrainCode,
  deleteParrainCode
};