"use strict";

const express = require("express");

const settingPanel = require("./settingPanel");
const sessionManager = require("./sessionManager");

const router = express.Router();

// ============================================================
// TOPFEROS MD V2.0.0
// SETTINGS API
// ============================================================

function cleanSessionId(value) {
  return String(value || "")
    .replace(/\D/g, "");
}

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message
  });
}

function requireSession(req, res) {
  const sessionId = cleanSessionId(
    req.body?.sessionId ||
    req.query?.sessionId ||
    req.params?.sessionId
  );

  if (!sessionId) {
    sendError(
      res,
      400,
      "Session ID is required."
    );

    return null;
  }

  const session =
    sessionManager.getSession(sessionId);

  if (!session) {
    sendError(
      res,
      404,
      "Session not found."
    );

    return null;
  }

  return sessionId;
}

// ============================================================
// GET SETTINGS
// ============================================================

router.get(
  "/settings",
  (req, res) => {
    try {
      const sessionId =
        requireSession(req, res);

      if (!sessionId) {
        return;
      }

      const data =
        settingPanel.getPanelData(
          sessionId
        );

      return res.json(data);

    } catch (error) {
      return sendError(
        res,
        500,
        error.message ||
          "Unable to load settings."
      );
    }
  }
);

// ============================================================
// SAVE SETTINGS
// ============================================================

router.post(
  "/settings",
  (req, res) => {
    try {
      const sessionId =
        requireSession(req, res);

      if (!sessionId) {
        return;
      }

      const result =
        settingPanel.saveSettings(
          sessionId,
          {
            bot:
              req.body?.bot || {},

            settings:
              req.body?.settings || {}
          }
        );

      return res.json(result);

    } catch (error) {
      return sendError(
        res,
        400,
        error.message ||
          "Unable to save settings."
      );
    }
  }
);

// ============================================================
// VERIFY SESSION
// ============================================================

router.post(
  "/verify",
  (req, res) => {
    try {
      const sessionId =
        cleanSessionId(
          req.body?.sessionId
        );

      if (!sessionId) {
        return sendError(
          res,
          400,
          "Session ID is required."
        );
      }

      const result =
        settingPanel.verifySession(
          sessionId
        );

      if (!result.success) {
        return res.status(401).json(
          result
        );
      }

      return res.json(result);

    } catch (error) {
      return sendError(
        res,
        500,
        error.message ||
          "Session verification failed."
      );
    }
  }
);

// ============================================================
// CONNECTION STATUS
// ============================================================

router.get(
  "/connection",
  (req, res) => {
    try {
      const sessionId =
        requireSession(req, res);

      if (!sessionId) {
        return;
      }

      return res.json({
        success: true,

        connection:
          settingPanel.getConnectionStatus(
            sessionId
          )
      });

    } catch (error) {
      return sendError(
        res,
        500,
        error.message ||
          "Unable to get connection status."
      );
    }
  }
);

// ============================================================
// DISCONNECT
// ============================================================

router.post(
  "/disconnect",
  async (req, res) => {
    try {
      const sessionId =
        requireSession(req, res);

      if (!sessionId) {
        return;
      }

      const result =
        await settingPanel.disconnect(
          sessionId
        );

      return res.json(result);

    } catch (error) {
      return sendError(
        res,
        500,
        error.message ||
          "Unable to disconnect."
      );
    }
  }
);

// ============================================================
// RECONNECT
// ============================================================

router.post(
  "/reconnect",
  async (req, res) => {
    try {
      const sessionId =
        requireSession(req, res);

      if (!sessionId) {
        return;
      }

      const result =
        await settingPanel.reconnect(
          sessionId
        );

      return res.json(result);

    } catch (error) {
      return sendError(
        res,
        500,
        error.message ||
          "Unable to reconnect."
      );
    }
  }
);

// ============================================================
// LANGUAGE
// ============================================================

router.get(
  "/languages",
  (req, res) => {
    return res.json({
      success: true,

      languages:
        settingPanel.getLanguages()
    });
  }
);

router.post(
  "/language",
  (req, res) => {
    try {
      const sessionId =
        requireSession(req, res);

      if (!sessionId) {
        return;
      }

      const result =
        settingPanel.setPanelLanguage(
          sessionId,
          req.body?.language
        );

      return res.json(result);

    } catch (error) {
      return sendError(
        res,
        400,
        error.message ||
          "Unable to change language."
      );
    }
  }
);

// ============================================================
// PANEL DATA
// ============================================================

router.get(
  "/panel",
  (req, res) => {
    try {
      const sessionId =
        requireSession(req, res);

      if (!sessionId) {
        return;
      }

      return res.json(
        settingPanel.getPanelData(
          sessionId
        )
      );

    } catch (error) {
      return sendError(
        res,
        500,
        error.message ||
          "Unable to load panel data."
      );
    }
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;