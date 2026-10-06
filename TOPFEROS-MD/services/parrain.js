"use strict";

const crypto = require("crypto");

const parrainCodes = new Map();

function normalizeNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}

function generateCode() {
  const randomPart = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `TOP-${randomPart}`;
}

async function generateParrainCode(number) {
  const normalizedNumber = normalizeNumber(number);

  if (!normalizedNumber) {
    throw new Error("A valid phone number is required.");
  }

  const existingCode = parrainCodes.get(normalizedNumber);

  if (existingCode) {
    return existingCode;
  }

  const code = generateCode();

  parrainCodes.set(normalizedNumber, code);

  return code;
}

function getParrainCode(number) {
  const normalizedNumber = normalizeNumber(number);

  if (!normalizedNumber) {
    return null;
  }

  return parrainCodes.get(normalizedNumber) || null;
}

function verifyParrainCode(code) {
  if (!code) {
    return null;
  }

  const normalizedCode = String(code)
    .trim()
    .toUpperCase();

  for (const [number, savedCode] of parrainCodes.entries()) {
    if (savedCode === normalizedCode) {
      return {
        valid: true,
        number,
        code: savedCode
      };
    }
  }

  return {
    valid: false,
    number: null,
    code: normalizedCode
  };
}

function deleteParrainCode(number) {
  const normalizedNumber = normalizeNumber(number);

  if (!normalizedNumber) {
    return false;
  }

  return parrainCodes.delete(normalizedNumber);
}

function getAllParrainCodes() {
  return Object.fromEntries(parrainCodes);
}

module.exports = {
  generateParrainCode,
  getParrainCode,
  verifyParrainCode,
  deleteParrainCode,
  getAllParrainCodes
};