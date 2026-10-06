"use strict";

const {
  downloadContentFromMessage,
  getContentType
} = require("@whiskeysockets/baileys");

const {
  analyzeStatus
} = require("../services/aiReactionService");

/*
|--------------------------------------------------------------------------
| TOPFEROS MD V2.0.0
| STATUS HANDLER
|--------------------------------------------------------------------------
|
| RESPONSIBILITIES:
|
| 1. Detect incoming WhatsApp Status messages.
| 2. Detect status text/caption.
| 3. Detect image/video/audio status.
| 4. Prepare status content for AI.
| 5. Ask AI to choose ONE appropriate emoji.
| 6. Pass the selected emoji to the reaction layer.
|
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Baileys 6.7.21 currently does not provide a verified
| official status-reaction API.
|
| Therefore this file does NOT fake a reaction call.
|
| Once the selected Baileys/API supports status reactions,
| only sendStatusReaction() needs to be connected.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| STATUS JID
|--------------------------------------------------------------------------
*/

const STATUS_JID =
  "status@broadcast";

/*
|--------------------------------------------------------------------------
| PROCESSED STATUS CACHE
|--------------------------------------------------------------------------
|
| Prevent the same status from being analyzed repeatedly.
|
|--------------------------------------------------------------------------
*/

const processedStatuses =
  new Set();

/*
|--------------------------------------------------------------------------
| MAX CACHE SIZE
|--------------------------------------------------------------------------
*/

const MAX_PROCESSED_STATUSES = 5000;

/*
|--------------------------------------------------------------------------
| CACHE STATUS
|--------------------------------------------------------------------------
*/

function rememberStatus(statusId) {
  if (!statusId) {
    return;
  }

  processedStatuses.add(
    statusId
  );

  /*
   * Prevent unlimited memory growth.
   */

  if (
    processedStatuses.size >
    MAX_PROCESSED_STATUSES
  ) {
    const first =
      processedStatuses.values()
        .next()
        .value;

    if (first) {
      processedStatuses.delete(
        first
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| CHECK IF STATUS WAS PROCESSED
|--------------------------------------------------------------------------
*/

function wasProcessed(statusId) {
  return Boolean(
    statusId &&
      processedStatuses.has(
        statusId
      )
  );
}

/*
|--------------------------------------------------------------------------
| EXTRACT TEXT
|--------------------------------------------------------------------------
*/

function extractStatusText(
  message
) {
  if (!message) {
    return "";
  }

  /*
   * Normal text.
   */

  if (
    typeof message.conversation ===
    "string"
  ) {
    return message.conversation;
  }

  /*
   * Extended text.
   */

  if (
    typeof message.extendedTextMessage
      ?.text === "string"
  ) {
    return message
      .extendedTextMessage
      .text;
  }

  /*
   * Image caption.
   */

  if (
    typeof message.imageMessage
      ?.caption === "string"
  ) {
    return message
      .imageMessage
      .caption;
  }

  /*
   * Video caption.
   */

  if (
    typeof message.videoMessage
      ?.caption === "string"
  ) {
    return message
      .videoMessage
      .caption;
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| GET STATUS CONTENT
|--------------------------------------------------------------------------
*/

function getStatusContent(
  message
) {
  if (!message) {
    return {
      type: null,
      content: null
    };
  }

  const type =
    getContentType(message);

  return {
    type: type || null,

    content:
      message[type] || null
  };
}

/*
|--------------------------------------------------------------------------
| DOWNLOAD MEDIA
|--------------------------------------------------------------------------
|
| This prepares image/video/audio data for a
| future vision/audio AI provider.
|
|--------------------------------------------------------------------------
*/

async function downloadStatusMedia(
  message
) {
  const {
    type,
    content
  } =
    getStatusContent(
      message
    );

  if (
    !type ||
    !content
  ) {
    return null;
  }

  let mediaType = null;

  if (
    type ===
    "imageMessage"
  ) {
    mediaType = "image";
  }

  if (
    type ===
    "videoMessage"
  ) {
    mediaType = "video";
  }

  if (
    type ===
    "audioMessage"
  ) {
    mediaType = "audio";
  }

  /*
   * Unsupported media.
   */

  if (!mediaType) {
    return null;
  }

  try {
    const stream =
      await downloadContentFromMessage(
        content,
        mediaType
      );

    const chunks = [];

    for await (
      const chunk of stream
    ) {
      chunks.push(
        Buffer.from(chunk)
      );
    }

    return {
      type: mediaType,

      buffer:
        Buffer.concat(chunks),

      mimetype:
        content.mimetype ||
        null,

      fileLength:
        content.fileLength ||
        null
    };
  } catch (error) {
    console.error(
      "[STATUS] Media download failed:",
      error?.message ||
        error
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| BUILD AI STATUS DATA
|--------------------------------------------------------------------------
*/

async function buildAIStatusData(
  message
) {
  const text =
    extractStatusText(
      message
    );

  const {
    type
  } =
    getStatusContent(
      message
    );

  /*
   * Text-only status.
   */

  if (
    !type ||
    type ===
      "conversation" ||
    type ===
      "extendedTextMessage"
  ) {
    return {
      text,
      type: "text",
      media: null
    };
  }

  /*
   * Media status.
   */

  const media =
    await downloadStatusMedia(
      message
    );

  return {
    text,
    type,
    media
  };
}

/*
|--------------------------------------------------------------------------
| SEND STATUS REACTION
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This function is intentionally isolated.
|
| Baileys 6.7.21 does not currently expose a verified
| official API for reacting to another user's WhatsApp
| Status.
|
| DO NOT replace this with a guessed API.
|
|--------------------------------------------------------------------------
*/

async function sendStatusReaction(
  sock,
  statusMessage,
  emoji
) {
  if (!sock) {
    throw new Error(
      "WhatsApp socket is required."
    );
  }

  if (
    !statusMessage?.key
  ) {
    throw new Error(
      "Status message key is required."
    );
  }

  if (
    !emoji ||
    typeof emoji !==
      "string"
  ) {
    throw new Error(
      "A valid emoji is required."
    );
  }

  /*
   * Baileys 6.7.21:
   *
   * No verified official status-reaction
   * method is available here.
   *
   * We intentionally stop instead of
   * pretending the reaction was sent.
   */

  throw new Error(
    "Status reactions are not supported by the current verified Baileys 6.7.21 API."
  );
}

/*
|--------------------------------------------------------------------------
| PROCESS ONE STATUS
|--------------------------------------------------------------------------
*/

async function processStatus(
  sock,
  message,
  options = {}
) {
  if (
    !message ||
    !message.key
  ) {
    return {
      success: false,
      reason:
        "Invalid status message."
    };
  }

  /*
   * Only process status messages.
   */

  if (
    message.key.remoteJid !==
    STATUS_JID
  ) {
    return {
      success: false,
      ignored: true,
      reason:
        "Not a WhatsApp Status."
    };
  }

  /*
   * Ignore messages created by the bot itself.
   */

  if (
    message.key.fromMe
  ) {
    return {
      success: false,
      ignored: true,
      reason:
        "Status belongs to the bot."
    };
  }

  /*
   * Status ID.
   */

  const statusId =
    message.key.id;

  /*
   * Prevent duplicate AI calls.
   */

  if (
    wasProcessed(statusId)
  ) {
    return {
      success: false,
      ignored: true,
      reason:
        "Status already processed."
    };
  }

  /*
   * Mark immediately.
   *
   * This prevents duplicate events from
   * triggering multiple AI requests.
   */

  rememberStatus(
    statusId
  );

  /*
   * Prepare status content.
   */

  const statusData =
    await buildAIStatusData(
      message.message
    );

  /*
   * AI must be enabled.
   */

  if (
    options.enabled === false
  ) {
    return {
      success: false,
      ignored: true,
      reason:
        "Auto Status React is disabled.",
      statusId,
      statusData
    };
  }

  /*
   * Ask AI to choose the emoji.
   *
   * IMPORTANT:
   * The AI reaction service decides the emoji.
   */

  const analysis =
    await analyzeStatus(
      {
        text:
          statusData.text,

        type:
          statusData.type,

        media:
          statusData.media
      },
      {
        enabled: true
      }
    );

  const emoji =
    analysis?.emoji;

  /*
   * AI failed to provide emoji.
   */

  if (!emoji) {
    return {
      success: false,
      reason:
        "AI did not return an emoji.",
      statusId,
      statusData
    };
  }

  /*
   * Reaction layer.
   *
   * Currently throws a clear unsupported error
   * for Baileys 6.7.21 instead of pretending success.
   */

  try {
    await sendStatusReaction(
      sock,
      message,
      emoji
    );

    return {
      success: true,

      statusId,

      emoji,

      statusData,

      usedAI:
        analysis.usedAI === true
    };
  } catch (error) {
    return {
      success: false,

      statusId,

      emoji,

      statusData,

      usedAI:
        analysis.usedAI === true,

      reason:
        error?.message ||
        "Status reaction failed."
    };
  }
}

/*
|--------------------------------------------------------------------------
| HANDLE MESSAGES.UPDATE
|--------------------------------------------------------------------------
|
| This is kept separate because WhatsApp can update
| message/status state after the initial event.
|
|--------------------------------------------------------------------------
*/

async function handleStatusUpdate(
  sock,
  updates = []
) {
  if (
    !Array.isArray(updates)
  ) {
    return [];
  }

  const results = [];

  for (
    const update of updates
  ) {
    const message =
      update?.key
        ? update
        : update?.message;

    if (!message) {
      continue;
    }

    if (
      message.key
        ?.remoteJid !==
      STATUS_JID
    ) {
      continue;
    }

    const result =
      await processStatus(
        sock,
        message
      );

    results.push(
      result
    );
  }

  return results;
}

/*
|--------------------------------------------------------------------------
| ATTACH STATUS HANDLER
|--------------------------------------------------------------------------
|
| Call this ONCE after creating the socket.
|
|--------------------------------------------------------------------------
*/

function attachStatusHandler(
  sock,
  options = {}
) {
  if (!sock?.ev) {
    throw new Error(
      "A valid Baileys socket is required."
    );
  }

  /*
   * Auto Status React setting.
   */

  const enabled =
    options.enabled !== false;

  /*
   * New WhatsApp messages.
   */

  sock.ev.on(
    "messages.upsert",
    async (event) => {
      if (
        !event ||
        !Array.isArray(
          event.messages
        )
      ) {
        return;
      }

      /*
       * Process immediately.
       */

      for (
        const message of
          event.messages
      ) {
        if (
          message?.key
            ?.remoteJid !==
          STATUS_JID
        ) {
          continue;
        }

        try {
          const result =
            await processStatus(
              sock,
              message,
              {
                enabled
              }
            );

          /*
           * Log only useful information.
           */

          if (
            result.success
          ) {
            console.log(
              `[STATUS AI] Reaction sent: ${result.emoji}`
            );
          } else if (
            result.reason
          ) {
            console.warn(
              `[STATUS AI] ${result.reason}`
            );
          }
        } catch (error) {
          console.error(
            "[STATUS AI] Processing error:",
            error?.message ||
              error
          );
        }
      }
    }
  );

  /*
   * Status/message updates.
   */

  sock.ev.on(
    "messages.update",
    async (updates) => {
      if (
        !Array.isArray(updates)
      ) {
        return;
      }

      /*
       * We do not run every update through
       * the AI because messages.update can
       * contain unrelated changes.
       */

      for (
        const update of updates
      ) {
        if (
          update?.key
            ?.remoteJid !==
          STATUS_JID
        ) {
          continue;
        }

        /*
         * There may not be a complete message
         * attached to an update.
         *
         * Do not invent missing content.
         */

        if (!update.message) {
          continue;
        }

        try {
          await processStatus(
            sock,
            update.message,
            {
              enabled
            }
          );
        } catch (error) {
          console.error(
            "[STATUS AI] Update processing error:",
            error?.message ||
              error
          );
        }
      }
    }
  );

  console.log(
    "[STATUS AI] 🟢 Instant Status AI handler attached."
  );

  return {
    enabled,

    statusJid:
      STATUS_JID
  };
}

/*
|--------------------------------------------------------------------------
| CLEAR PROCESSED STATUS CACHE
|--------------------------------------------------------------------------
*/

function clearProcessedStatuses() {
  processedStatuses.clear();
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  STATUS_JID,

  attachStatusHandler,

  processStatus,

  handleStatusUpdate,

  sendStatusReaction,

  buildAIStatusData,

  extractStatusText,

  downloadStatusMedia,

  wasProcessed,

  rememberStatus,

  clearProcessedStatuses
};