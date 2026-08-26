"use strict";

const crypto = require("crypto");

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                🤝 PARRAIN SERVICE                ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 PARRAIN CODE STORAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Tout Parrain Code yo rete nan memwa pandan bot la ap mache.
// Lè bot la fèmen/restart, codes yo ap reset.
const parrainCodes = new Map();


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 GENERATE RANDOM PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateParrainCode() {
  const randomPart = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `TOP-${randomPart}`;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAN OWNER NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAN PARRAIN CODE
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

  // Evite kreye yon code ki deja egziste.
  do {
    code =
      generateParrainCode();
  } while (
    parrainCodes.has(code)
  );

  const data = {
    code,
    ownerNumber: number,
    createdAt: Date.now(),
    used: false,
    usedAt: null
  };

  parrainCodes.set(
    code,
    data
  );

  return data;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 GET PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getParrainCode(code) {
  const clean =
    cleanCode(code);

  if (!clean) {
    return null;
  }

  return (
    parrainCodes.get(clean) ||
    null
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ VERIFY PARRAIN CODE
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
        "❌ Parrain Code la pa egziste."
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
    message:
      "✅ Parrain Code valide.",
    data
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

  const data =
    result.data;

  data.used = true;
  data.usedAt = Date.now();

  return {
    success: true,
    message:
      "✅ Parrain Code itilize avèk siksè.",
    data
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 CHECK CODE STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isParrainCodeUsed(code) {
  const data =
    getParrainCode(code);

  if (!data) {
    return false;
  }

  return data.used === true;
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
// 🗑️ DELETE ONE PARRAIN CODE
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
// 📋 GET ALL PARRAIN CODES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getAllParrainCodes() {
  return Array.from(
    parrainCodes.values()
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔢 GET TOTAL CODES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getParrainCodeCount() {
  return parrainCodes.size;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAR ALL PARRAIN CODES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function clearParrainCodes() {
  parrainCodes.clear();

  return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  // 🔐 Generation
  generateParrainCode,

  // 🆕 Creation
  createParrainCode,

  // 🔎 Retrieval
  getParrainCode,
  getAllParrainCodes,
  getParrainCodeCount,

  // ✅ Verification
  verifyParrainCode,

  // 🟢 Usage
  useParrainCode,
  isParrainCodeUsed,

  // 🔍 Existence
  hasParrainCode,

  // 🗑️ Management
  deleteParrainCode,
  clearParrainCodes
};


// ╔════════════════════════════════════════════════════╗
// ║                 🚀 TOPFEROS TECH                  ║
// ║                TOPFEROS MD V1.0.0                 ║
// ╚════════════════════════════════════════════════════╝