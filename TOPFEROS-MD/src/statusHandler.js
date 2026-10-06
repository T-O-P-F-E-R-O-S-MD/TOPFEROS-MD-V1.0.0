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
| - Detect new WhatsApp Status messages
| - Read status text/caption
| - Detect image/video/audio status
| - Send status information to AI
| - Let AI choose one natural emoji
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
      "video"
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
| SEND STATUS REACTION
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Baileys 6.7.21 does not expose a verified,
| documented high-level API that we can safely
| use here to claim Status reactions work.
|
| Therefore this function intentionally refuses
| to fake a reaction request.
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

  if (
    !emoji
  ) {
    throw new Error(
      "Reaction emoji is missing."
    );
  }

  /*
   * Do NOT send a normal chat reaction here.
   *
   * A normal:
   *
   * sock.sendMessage(jid, {
   *   react: {
   *     text: emoji,
   *     key: message.key
   *   }
   * })
   *
   * is not a verified implementation for
   * WhatsApp Status reactions.
   */

  throw new Error(
    "Status reactions are not enabled because the current Baileys API does not provide a verified Status-reaction method."
  );
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
   * Ignore our own status messages.
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
   * Prevent duplicate AI requests.
   */

  const messageId =
    getMessageId(
      message
    );

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

  markAsProcessed(
    messageId
  );

  /*
   * Build status data.
   */

  const statusData =
    await buildAIStatusData(
      message
    );

  /*
   * Ignore completely empty/
   * unsupported status content.
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
   * AI chooses ONE emoji.
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
    aiResult?.emoji ||
    null;

  if (!emoji) {
    return {
      success: false,
      reason:
        "AI did not return an emoji."
    };
  }

  /*
   * Reaction is deliberately isolated.
   *
   * We do not pretend that the current
   * Baileys API supports this.
   */

  let reactionSent =
    false;

  let reactionError =
    null;

  if (
    options.sendReaction === true
  ) {
    try {
      await sendStatusReaction(
        sock,
        message,
        emoji
      );

      reactionSent =
        true;
    } catch (error) {
      reactionError =
        error?.message ||
        String(error);

      console.warn(
        "[STATUS] Reaction not sent:",
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
      aiResult.source,

    reactionSent,

    reactionError
  };
}

/*
|--------------------------------------------------------------------------
| HANDLE UPSERT
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

  for (
    const message of messages
  ) {
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
| HANDLE MESSAGE UPDATE
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
   * New incoming messages.
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