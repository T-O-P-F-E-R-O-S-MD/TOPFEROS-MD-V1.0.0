"use strict";

const {
  downloadContentFromMessage
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
| Responsibilities:
| - Detect new WhatsApp Status messages instantly
| - Read status text/caption
| - Detect image/video/audio/document status
| - Download media when needed
| - Send status information to AI
| - Let AI choose one natural emoji
| - React to the Status immediately
| - Prevent duplicate processing
|
|--------------------------------------------------------------------------
*/

const STATUS_JID =
  "status@broadcast";

/*
|--------------------------------------------------------------------------
| PROCESSED STATUS CACHE
|--------------------------------------------------------------------------
*/

const processedStatuses =
  new Map();

const PROCESS_CACHE_TIME =
  10 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| CLEAN OLD CACHE
|--------------------------------------------------------------------------
*/

function cleanProcessedCache() {
  const now =
    Date.now();

  for (
    const [
      id,
      timestamp
    ] of processedStatuses
  ) {
    if (
      now - timestamp >
      PROCESS_CACHE_TIME
    ) {
      processedStatuses.delete(
        id
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| GET MESSAGE ID
|--------------------------------------------------------------------------
*/

function getMessageId(
  message
) {
  return (
    message?.key?.id ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| CHECK IF PROCESSED
|--------------------------------------------------------------------------
*/

function hasBeenProcessed(
  messageId
) {
  if (!messageId) {
    return false;
  }

  const timestamp =
    processedStatuses.get(
      messageId
    );

  if (!timestamp) {
    return false;
  }

  if (
    Date.now() -
      timestamp >
    PROCESS_CACHE_TIME
  ) {
    processedStatuses.delete(
      messageId
    );

    return false;
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| MARK AS PROCESSED
|--------------------------------------------------------------------------
*/

function markAsProcessed(
  messageId
) {
  if (!messageId) {
    return;
  }

  processedStatuses.set(
    messageId,
    Date.now()
  );

  cleanProcessedCache();
}

/*
|--------------------------------------------------------------------------
| GET STATUS CONTENT
|--------------------------------------------------------------------------
*/

function getStatusContent(
  message
) {
  if (
    !message?.message
  ) {
    return {
      type: "unknown",
      content: null
    };
  }

  const msg =
    message.message;

  /*
   * Direct text status.
   */

  if (
    msg.conversation
  ) {
    return {
      type: "text",
      content:
        msg.conversation
    };
  }

  /*
   * Extended text status.
   */

  if (
    msg.extendedTextMessage
  ) {
    return {
      type: "text",
      content:
        msg.extendedTextMessage
          .text || ""
    };
  }

  /*
   * Image status.
   */

  if (
    msg.imageMessage
  ) {
    return {
      type: "image",
      content:
        msg.imageMessage
    };
  }

  /*
   * Video status.
   */

  if (
    msg.videoMessage
  ) {
    return {
      type: "video",
      content:
        msg.videoMessage
    };
  }

  /*
   * Audio status.
   */

  if (
    msg.audioMessage
  ) {
    return {
      type: "audio",
      content:
        msg.audioMessage
    };
  }

  /*
   * Document status.
   */

  if (
    msg.documentMessage
  ) {
    return {
      type: "document",
      content:
        msg.documentMessage
    };
  }

  return {
    type: "unknown",
    content: null
  };
}

/*
|--------------------------------------------------------------------------
| EXTRACT STATUS TEXT
|--------------------------------------------------------------------------
*/

function extractStatusText(
  message
) {
  const content =
    getStatusContent(
      message
    );

  if (
    content.type ===
    "text"
  ) {
    return String(
      content.content ||
        ""
    ).trim();
  }

  /*
   * Image caption.
   */

  if (
    content.type ===
    "image"
  ) {
    return String(
      content.content
        ?.caption ||
        ""
    ).trim();
  }

  /*
   * Video caption.
   */

  if (
    content.type ===
    "video"
  ) {
    return String(
      content.content
        ?.caption ||
        ""
    ).trim();
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| DOWNLOAD STATUS MEDIA
|--------------------------------------------------------------------------
*/

async function downloadStatusMedia(
  message,
  type
) {
  try {
    let mediaMessage =
      null;

    if (
      type ===
      "image"
    ) {
      mediaMessage =
        message?.message
          ?.imageMessage;
    }

    if (
      type ===
      "video"
    ) {
      mediaMessage =
        message?.message
          ?.videoMessage;
    }

    if (
      type ===
      "audio"
    ) {
      mediaMessage =
        message?.message
          ?.audioMessage;
    }

    if (
      !mediaMessage
    ) {
      return null;
    }

    const stream =
      await downloadContentFromMessage(
        mediaMessage,
        type
      );

    const chunks = [];

    for await (
      const chunk of stream
    ) {
      chunks.push(
        Buffer.from(chunk)
      );
    }

    return Buffer.concat(
      chunks
    );
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
  const content =
    getStatusContent(
      message
    );

  const text =
    extractStatusText(
      message
    );

  let media =
    null;

  if (
    content.type ===
      "image" ||
    content.type ===
      "video" ||
    content.type ===
      "audio"
  ) {
    media =
      await downloadStatusMedia(
        message,
        content.type
      );
  }

  return {
    text,

    caption:
      text,

    mediaType:
      content.type,

    media,

    messageId:
      getMessageId(
        message
      ),

    participant:
      message?.key
        ?.participant ||
      null,

    timestamp:
      message?.messageTimestamp ||
      null
  };
}

/*
|--------------------------------------------------------------------------
| NORMALIZE AI RESULT
|--------------------------------------------------------------------------
*/

function getAIEmoji(
  aiResult
) {
  /*
   * Expected format:
   *
   * {
   *   emoji: "❤️",
   *   source: "ai"
   * }
   */

  if (
    typeof aiResult ===
    "string"
  ) {
    return aiResult
      .trim();
  }

  if (
    aiResult &&
    typeof aiResult.emoji ===
      "string"
  ) {
    return aiResult.emoji
      .trim();
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| SEND STATUS REACTION
|--------------------------------------------------------------------------
|
| Personal WhatsApp Status reaction.
|
| The Status itself is addressed through:
|
|     status@broadcast
|
| The original Status key identifies the
| exact Status being reacted to.
|
|--------------------------------------------------------------------------
*/

async function sendStatusReaction(
  sock,
  message,
  emoji
) {
  if (!sock) {
    throw new Error(
      "WhatsApp socket is required."
    );
  }

  if (
    !message?.key
  ) {
    throw new Error(
      "Status message key is missing."
    );
  }

  if (!emoji) {
    throw new Error(
      "Reaction emoji is missing."
    );
  }

  const participant =
    message.key
      ?.participant;

  if (!participant) {
    throw new Error(
      "Status participant is missing."
    );
  }

  /*
   * React immediately to the exact
   * personal Status.
   */

  await sock.sendMessage(
    STATUS_JID,
    {
      react: {
        text: emoji,
        key:
          message.key
      }
    },
    {
      statusJidList: [
        participant
      ]
    }
  );

  return true;
}

/*
|--------------------------------------------------------------------------
| PROCESS STATUS
|--------------------------------------------------------------------------
*/

async function processStatus(
  sock,
  message,
  options = {}
) {
  if (!sock) {
    return {
      success: false,
      reason:
        "Socket unavailable."
    };
  }

  if (!message) {
    return {
      success: false,
      reason:
        "Status message unavailable."
    };
  }

  const jid =
    message?.key
      ?.remoteJid || "";

  /*
   * Only process WhatsApp Status.
   */

  if (
    jid !==
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
   * Never react to our own Status.
   */

  if (
    message?.key?.fromMe
  ) {
    return {
      success: false,
      ignored: true,
      reason:
        "Own status ignored."
    };
  }

  /*
   * Get Status ID.
   */

  const messageId =
    getMessageId(
      message
    );

  /*
   * Prevent duplicate AI requests
   * and duplicate reactions.
   */

  if (
    hasBeenProcessed(
      messageId
    )
  ) {
    return {
      success: false,
      ignored: true,
      reason:
        "Status already processed."
    };
  }

  /*
   * Mark it immediately.
   *
   * This prevents two listeners/events
   * from reacting twice.
   */

  markAsProcessed(
    messageId
  );

  /*
   * Build Status data.
   */

  const statusData =
    await buildAIStatusData(
      message
    );

  /*
   * Ignore unsupported empty Status.
   */

  if (
    !statusData.text &&
    !statusData.media
  ) {
    return {
      success: false,
      ignored: true,
      reason:
        "No readable status content."
    };
  }

  /*
   * AI chooses the reaction.
   */

  const aiResult =
    await analyzeStatus(
      statusData,
      {
        model:
          options.aiModel
      }
    );

  const emoji =
    getAIEmoji(
      aiResult
    );

  if (!emoji) {
    return {
      success: false,
      reason:
        "AI did not return an emoji."
    };
  }

  /*
   * Auto Status React is ON by default.
   *
   * It can only be disabled explicitly:
   *
   * autoStatusReact: false
   */

  const autoStatusReact =
    options.autoStatusReact !==
    false;

  let reactionSent =
    false;

  let reactionError =
    null;

  if (
    autoStatusReact
  ) {
    try {
      /*
       * No timer.
       *
       * React immediately after the AI
       * returns the emoji.
       */

      reactionSent =
        await sendStatusReaction(
          sock,
          message,
          emoji
        );
    } catch (error) {
      reactionError =
        error?.message ||
        String(error);

      console.error(
        "[STATUS] Reaction failed:",
        reactionError
      );
    }
  }

  return {
    success: true,

    messageId,

    participant:
      statusData.participant,

    text:
      statusData.text,

    mediaType:
      statusData.mediaType,

    emoji,

    aiSource:
      aiResult?.source ||
      "ai",

    reactionSent,

    reactionError
  };
}

/*
|--------------------------------------------------------------------------
| HANDLE STATUS UPSERT
|--------------------------------------------------------------------------
*/

async function handleStatusUpsert(
  sock,
  event,
  options = {}
) {
  const messages =
    event?.messages || [];

  if (
    !Array.isArray(
      messages
    )
  ) {
    return;
  }

  /*
   * Process each new Status immediately.
   */

  for (
    const message of messages
  ) {
    if (
      message?.key
        ?.remoteJid !==
      STATUS_JID
    ) {
      continue;
    }

    try {
      await processStatus(
        sock,
        message,
        options
      );
    } catch (error) {
      console.error(
        "[STATUS] Processing error:",
        error?.stack ||
          error
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| HANDLE STATUS UPDATE
|--------------------------------------------------------------------------
*/

async function handleStatusUpdate(
  sock,
  updates,
  options = {}
) {
  if (
    !Array.isArray(
      updates
    )
  ) {
    return;
  }

  for (
    const update of updates
  ) {
    const message =
      update?.update
        ?.message ||
      update?.message ||
      null;

    if (!message) {
      continue;
    }

    if (
      message?.key
        ?.remoteJid !==
      STATUS_JID
    ) {
      continue;
    }

    try {
      await processStatus(
        sock,
        message,
        options
      );
    } catch (error) {
      console.error(
        "[STATUS] Update processing error:",
        error?.stack ||
          error
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| ATTACH STATUS HANDLER
|--------------------------------------------------------------------------
*/

function attachStatusHandler(
  sock,
  options = {}
) {
  if (!sock) {
    throw new Error(
      "WhatsApp socket is required."
    );
  }

  /*
   * Prevent duplicate listeners.
   */

  if (
    sock.__topferosStatusHandlerAttached
  ) {
    return false;
  }

  sock.__topferosStatusHandlerAttached =
    true;

  /*
   * New messages/statuses.
   *
   * This is the primary instant
   * Status detection event.
   */

  sock.ev.on(
    "messages.upsert",
    async (
      event
    ) => {
      await handleStatusUpsert(
        sock,
        event,
        options
      );
    }
  );

  /*
   * Message updates.
   */

  sock.ev.on(
    "messages.update",
    async (
      updates
    ) => {
      await handleStatusUpdate(
        sock,
        updates,
        options
      );
    }
  );

  console.log(
    "[STATUS] 🟢 Auto Status React handler attached."
  );

  return true;
}

/*
|--------------------------------------------------------------------------
| CLEAR CACHE
|--------------------------------------------------------------------------
*/

function clearProcessedStatusCache() {
  processedStatuses.clear();
}

/*
|--------------------------------------------------------------------------
| GET CACHE SIZE
|--------------------------------------------------------------------------
*/

function getProcessedStatusCount() {
  cleanProcessedCache();

  return processedStatuses.size;
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  STATUS_JID,

  processStatus,

  attachStatusHandler,

  handleStatusUpsert,

  handleStatusUpdate,

  sendStatusReaction,

  extractStatusText,

  getStatusContent,

  downloadStatusMedia,

  buildAIStatusData,

  clearProcessedStatusCache,

  getProcessedStatusCount
};