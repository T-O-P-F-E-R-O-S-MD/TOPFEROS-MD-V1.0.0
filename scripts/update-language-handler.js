"use strict";

// Update /api/language to be more forgiving and return next-step info for UI
// - Accept session in multiple places (body.sessionId, body.session, query, header)
// - Accept more language codes (including 'ht' for Haitian Creole)
// - Return explicit next-step flags so frontend can proceed to number/parrain inputs
// - Log request payload for debugging

const fs = require("fs");
const path = require("path");

// Load existing file content and replace the /api/language handler block
// We'll perform a simple string replacement to insert the improved handler.

const filePath = "TOPFEROS-MD/panel/server.js";
const file = fs.readFileSync(filePath, "utf8");

const oldHandlerStart = "// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n// 🌐 LANGUAGE\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\napp.post(\n  \"/api/language\",\n  (req, res) => {";

const oldHandlerEnd = "  }\n);\n\n\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n// ⚙️ SETTINGS API";

if (!file.includes(oldHandlerStart)) {
  throw new Error("Expected language handler start not found");
}

const newHandler = `// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/language",
  (req, res) => {

    try {

      const sessionId = String(
        req.body?.sessionId || req.body?.session || req.query?.session || req.headers['x-session-id'] || ""
      ).trim();

      const language = String(
        req.body?.language || req.body?.lang || req.query?.language || 'en'
      ).trim();

      // Log for debugging
      console.error('LANG CHANGE REQ', { sessionId, language, body: req.body });

      // If session not provided, allow language selection for pre-login flows
      // but inform frontend that session is missing.
      const sessionMissing = !sessionId;

      // Accept more languages including Haitian Creole
      const supportedLanguages = [
        "en",
        "fr",
        "es",
        "ht",
        "ht-HT"
      ];

      if (!supportedLanguages.includes(language)) {
        return res.status(400).json({
          success: false,
          message: "Language not supported.",
          supported: supportedLanguages
        });
      }

      // If there's no session, return next-step info so frontend can show inputs
      const response = {
        success: true,
        language,
        next: "enter_number_and_parrain",
        showParrainInput: true,
        showNumberInput: true,
        sessionMissing
      };

      return res.json(response);

    } catch (error) {

      console.error(
        "❌ LANGUAGE ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to save language."
        });
    }

  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS API`;

const newFile = file.replace(oldHandlerStart + file.split(oldHandlerStart)[1].split(oldHandlerEnd)[0] + oldHandlerEnd, newHandler);

fs.writeFileSync(filePath, newFile, "utf8");
