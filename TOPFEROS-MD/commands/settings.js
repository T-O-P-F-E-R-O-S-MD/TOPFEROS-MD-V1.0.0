"use strict";

const config = require("../src/config");
const sessionManager = require("../src/sessionManager");
const settingPanel = require("../src/settingPanel");

// ============================================================
// 🦁 TOPFEROS MD V2.0.0
// SETTINGS COMMAND
// ============================================================

function getSessionId(ctx) {
  const rawId =
    ctx.sessionId ||
    ctx.sock?.user?.id ||
    "";

  return String(rawId)
    .split("@")[0]
    .split(":")[0]
    .replace(/\D/g, "");
}

function value(value, fallback = "Not configured") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function status(value) {
  return value === true ? "ON" : "OFF";
}

function buildSettingsOverview(data) {
  const settings = data.settings || {};
  const bot = settings.bot || {};
  const automation = settings.automation || {};

  return [
    "╭━━━〔 🦁 TOPFEROS MD 〕━━━╮",
    "┃     ⚙️ SETTINGS PANEL",
    "┃        VERSION 2.0.0",
    "╰━━━━━━━━━━━━━━━━━━━━━━╯",
    "",
    "┏━━〔 USER INFO 〕",
    `┃ OWNER NUMBER: ${value(bot.ownerNumber)}`,
    `┃ BOT NAME: ${value(bot.name)}`,
    `┃ LOCATION: ${value(bot.location)}`,
    `┃ AGE: ${value(bot.age)}`,
    `┃ PREFIX: ${value(bot.prefix)}`,
    `┃ MODE: ${value(bot.mode)}`,
    "┗━━━━━━━━━━━━━━━━━━━━",
    "",
    "┏━━〔 AUTOMATION 〕",
    `┃ Always Online: ${status(automation.alwaysOnline)}`,
    `┃ Fake Typing: ${status(automation.fakeTyping)}`,
    `┃ Fake Recording: ${status(automation.fakeRecording)}`,
    `┃ Auto Status Seen: ${status(automation.autoStatusSeen)}`,
    `┃ Auto Status Reply: ${status(automation.autoStatusReply)}`,
    `┃ Auto Status React: ${status(automation.autoStatusReact)}`,
    "┗━━━━━━━━━━━━━━━━━━━━",
    "",
    "┏━━〔 PROTECTION 〕",
    `┃ Anti Delete: ${status(automation.antiDelete)}`,
    `┃ Anti Call: ${status(automation.antiCall)}`,
    `┃ Anti Bug: ${status(automation.antiBug)}`,
    `┃ Anti Bot Filter: ${status(automation.antiBotFilter)}`,
    `┃ Anti Block Numbers: ${
      Array.isArray(automation.antiBlockNumbers) &&
      automation.antiBlockNumbers.length > 0
        ? "ON"
        : "OFF"
    }`,
    `┃ Anti Delete Mode: ${value(automation.antiDeleteMode)}`,
    `┃ Anti Bot Action: ${value(automation.antiBotAction)}`,
    "┗━━━━━━━━━━━━━━━━━━━━",
    "",
    "┏━━〔 GROUP AUTOMATION 〕",
    `┃ Group Automation: ${status(settings.groupAutomation?.enabled)}`,
    `┃ Group ID: ${value(settings.groupAutomation?.groupGid)}`,
    `┃ Timezone: ${value(settings.groupAutomation?.timezone)}`,
    `┃ Close Time: ${value(settings.groupAutomation?.closeTime)}`,
    `┃ Open Time: ${value(settings.groupAutomation?.openTime)}`,
    `┃ Warning Limit: ${value(settings.groupAutomation?.warningLimit)}`,
    "┗━━━━━━━━━━━━━━━━━━━━",
    "",
    "🦁 TECH BY TOPFEROS MD 🐑"
  ].join("\n");
}

async function settingsCommand(ctx) {
  try {
    if (!ctx || !ctx.sock || !ctx.message) {
      throw new Error("Command context is incomplete.");
    }

    if (ctx.isGroup) {
      return ctx.send(
        "⚠️ Tanpri itilize .settings nan chat prive ak bot la."
      );
    }

    if (!ctx.isOwner) {
      return ctx.send(
        "⛔ Kòmand sa a rezève pou owner bot la."
      );
    }

    const sessionId = getSessionId(ctx);

    if (!sessionId || !sessionManager.getSession(sessionId)) {
      return ctx.send("❌ Session bot la pa disponib.");
    }

    if (!sessionManager.isConnected(sessionId)) {
      return ctx.send("❌ Bot la pa konekte.");
    }

    const panelData = settingPanel.getPanelData(sessionId);
    const code = settingPanel.generatePanelAccessCode(sessionId);

    const panelUrl =
      process.env.PANEL_URL ||
      config.panel?.url ||
      config.web?.panelUrl ||
      "";

    // MESSAGE 1: SETTINGS OVERVIEW
    await ctx.send(buildSettingsOverview(panelData));

    // MESSAGE 2: PANEL ACCESS
    await ctx.send([
      "╭━━━〔 🔐 PANEL ACCESS 〕━━━╮",
      `┃ NUMBER: ${sessionId}`,
      `┃ CODE: ${code}`,
      `┃ LINK: ${panelUrl || "PANEL_URL pa konfigire"}`,
      "╰━━━━━━━━━━━━━━━━━━━━━━╯",
      "",
      "🦁 TECH BY TOPFEROS MD 🐑"
    ].join("\n"));

    // MESSAGE 3: INSTRUCTIONS
    await ctx.send([
      "╭━━━〔 📘 INSTRUCTIONS 〕━━━╮",
      "┃ 1. Louvri lyen panel la.",
      "┃ 2. Chwazi lang ou.",
      "┃ 3. Antre nimewo ak kòd session ou.",
      "┃ 4. Modifye paramèt ou vle yo.",
      "┃ 5. Sove chanjman yo.",
      "╰━━━━━━━━━━━━━━━━━━━━━━╯",
      "",
      "Sèvi ak .menu pou wè kòmand yo.",
      "Sèvi ak .help pou konnen kijan pou itilize yo.",
      "🦁 TECH BY TOPFEROS MD 🐑"
    ].join("\n"));
  } catch (error) {
    console.error("[SETTINGS COMMAND]", error);

    return ctx.send(
      "❌ Gen yon pwoblèm pandan ouvèti Settings Panel la."
    );
  }
}

module.exports = settingsCommand;