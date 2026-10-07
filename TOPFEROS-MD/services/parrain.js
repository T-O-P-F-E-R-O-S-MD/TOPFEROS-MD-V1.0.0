"use strict";

const crypto = require("crypto");

const PARRAIN_CODE_TTL = 60 * 1000;

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

function createCodeEntry(code) {
  return {
    code,
    createdAt: Date.now(),
    expiresAt: Date.now() + PARRAIN_CODE_TTL
  };
}

function isExpired(entry) {
  if (!entry) {
    return true;
  }

  return Date.now() >= entry.expiresAt;
}

function removeExpiredCode(number) {
  const entry = parrainCodes.get(number);

  if (!entry) {
    return false;
  }

  if (!isExpired(entry)) {
    return false;
  }

  parrainCodes.delete(number);

  return true;
}

async function generateParrainCode(number) {
  const normalizedNumber = normalizeNumber(number);

  if (!normalizedNumber) {
    throw new Error("A valid phone number is required.");
  }

  const existingEntry =
    parrainCodes.get(normalizedNumber);

  // Si ansyen code la toujou valid,
  // retounen menm code la pou evite kreye plizyè code
  // pandan menm peryòd 60 segonn lan.
  if (
    existingEntry &&
    !isExpired(existingEntry)
  ) {
    return existingEntry.code;
  }

  // Si li ekspire, retire li.
  removeExpiredCode(normalizedNumber);

  const code = generateCode();

  parrainCodes.set(
    normalizedNumber,
    createCodeEntry(code)
  );

  return code;
}

function getParrainCode(number) {
  const normalizedNumber = normalizeNumber(number);

  if (!normalizedNumber) {
    return null;
  }

  const entry =
    parrainCodes.get(normalizedNumber);

  if (!entry) {
    return null;
  }

  if (isExpired(entry)) {
    parrainCodes.delete(normalizedNumber);
    return null;
  }

  return entry.code;
}

function verifyParrainCode(code) {
  if (!code) {
    return null;
  }

  const normalizedCode = String(code)
    .trim()
    .toUpperCase();

  for (
    const [number, entry]
    of parrainCodes.entries()
  ) {
    if (isExpired(entry)) {
      parrainCodes.delete(number);
      continue;
    }

    if (entry.code === normalizedCode) {
      return {
        valid: true,
        number,
        code: entry.code,
        createdAt: entry.createdAt,
        expiresAt: entry.expiresAt
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

  return parrainCodes.delete(
    normalizedNumber
  );
}

function getAllParrainCodes() {
  const activeCodes = {};

  for (
    const [number, entry]
    of parrainCodes.entries()
  ) {
    if (isExpired(entry)) {
      parrainCodes.delete(number);
      continue;
    }

    activeCodes[number] = {
      code: entry.code,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt
    };
  }

  return activeCodes;
}

function cleanupExpiredCodes() {
  for (
    const [number, entry]
    of parrainCodes.entries()
  ) {
    if (isExpired(entry)) {
      parrainCodes.delete(number);
    }
  }
}

const cleanupTimer = setInterval(
  cleanupExpiredCodes,
  10 * 1000
);

// Pa anpeche timer la kenbe Node process la vivan.
if (
  cleanupTimer &&
  typeof cleanupTimer.unref === "function"
) {
  cleanupTimer.unref();
}

module.exports = {
  generateParrainCode,
  getParrainCode,
  verifyParrainCode,
  deleteParrainCode,
  getAllParrainCodes,
  cleanupExpiredCodes,
  PARRAIN_CODE_TTL
};