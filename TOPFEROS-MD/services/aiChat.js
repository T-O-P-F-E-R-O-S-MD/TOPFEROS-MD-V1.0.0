"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                  AI CHAT SERVICE                 ║
// ╚════════════════════════════════════════════════════╝

const {
  askAI
} = require("./ai");

/*
|--------------------------------------------------------------------------
| AI CHAT SESSIONS
|--------------------------------------------------------------------------
|
| Every chat gets its own independent AI session.
|
| A session is created when:
|
|   .ai chat <message>
|
| The session does NOT have an OFF command.
|
| After the AI answers, the user must forward/reply
| to the latest AI response before the next message
| can be processed by AI Chat.
|
|--------------------------------------------------------------------------
*/

const sessions =
  new Map();

/*
|--------------------------------------------------------------------------
| SESSION LIMITS
|--------------------------------------------------------------------------
*/

const MAX_HISTORY =
  20;

/*
|--------------------------------------------------------------------------
| CREATE SESSION KEY
|--------------------------------------------------------------------------
*/

function getSessionKey(
  jid
) {
  return String(
    jid || ""
  ).trim();
}

/*
|--------------------------------------------------------------------------
| GET SESSION
|--------------------------------------------------------------------------
*/

function getSession(
  jid
) {
  const key =
    getSessionKey(jid);

  if (!key) {
    return null;
  }

  return (
    sessions.get(key) ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| CREATE SESSION
|--------------------------------------------------------------------------
*/

function createSession(
  jid
) {
  const key =
    getSessionKey(jid);

  if (!key) {
    throw new Error(
      "Invalid chat JID."
    );
  }

  const session = {
    jid: key,

    active:
      true,

    history: [],

    lastAIMessageId:
      null,

    lastAIText:
      null,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()
  };

  sessions.set(
    key,
    session
  );

  return session;
}

/*
|--------------------------------------------------------------------------
| GET OR CREATE SESSION
|--------------------------------------------------------------------------
*/

function getOrCreateSession(
  jid
) {
  return (
    getSession(jid) ||
    createSession(jid)
  );
}

/*
|--------------------------------------------------------------------------
| CHECK IF SESSION EXISTS
|--------------------------------------------------------------------------
*/

function hasSession(
  jid
) {
  const session =
    getSession(jid);

  return Boolean(
    session &&
    session.active
  );
}

/*
|--------------------------------------------------------------------------
| ADD HISTORY MESSAGE
|--------------------------------------------------------------------------
*/

function addHistory(
  session,
  role,
  content
) {
  if (!session) {
    return;
  }

  const text =
    String(
      content || ""
    ).trim();

  if (!text) {
    return;
  }

  session.history.push({
    role:
      role === "assistant"
        ? "assistant"
        : "user",

    content:
      text,

    timestamp:
      new Date().toISOString()
  });

  /*
  |--------------------------------------------------------------------------
  | KEEP ONLY RECENT MESSAGES
  |--------------------------------------------------------------------------
  */

  if (
    session.history.length >
    MAX_HISTORY
  ) {
    session.history =
      session.history.slice(
        -MAX_HISTORY
      );
  }

  session.updatedAt =
    new Date().toISOString();
}

/*
|--------------------------------------------------------------------------
| START AI CHAT
|--------------------------------------------------------------------------
*/

async function startAIChat(
  jid,
  message
) {
  const text =
    String(
      message || ""
    ).trim();

  if (!text) {
    throw new Error(
      "AI Chat message is empty."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ALWAYS CREATE A NEW SESSION
  |--------------------------------------------------------------------------
  |
  | Every .ai chat command starts a new AI Chat session.
  |
  */

  const session =
    createSession(jid);

  addHistory(
    session,
    "user",
    text
  );

  /*
  |--------------------------------------------------------------------------
  | GET AI RESPONSE
  |--------------------------------------------------------------------------
  */

  const answer =
    await askAI(
      text,
      {
        systemPrompt:
          [
            "You are TOPFEROS MD V2.0.0 AI Chat.",
            "You are a professional conversational AI assistant.",
            "You must maintain the context of the current conversation.",
            "Understand follow-up messages based on previous messages.",
            "Answer naturally and professionally.",
            "If the user writes in Haitian Creole, answer in Haitian Creole.",
            "If the user writes in French, answer in French.",
            "If the user writes in English, answer in English.",
            "When the user asks for a prompt, create a professional prompt.",
            "When the user asks for help creating an image prompt, include useful visual details.",
            "Do not pretend that you generated an image unless an image-generation tool was actually used.",
            "You are TOPFEROS MD V2.0.0."
          ].join(" "),

        temperature:
          0.7,

        maxTokens:
          1500
      }
    );

  addHistory(
    session,
    "assistant",
    answer
  );

  return {
    session,
    answer
  };
}

/*
|--------------------------------------------------------------------------
| CONTINUE AI CHAT
|--------------------------------------------------------------------------
|
| This function is ONLY called after the user replies to
| or forwards the latest AI response.
|
|--------------------------------------------------------------------------
*/

async function continueAIChat(
  jid,
  userMessage
) {
  const session =
    getSession(jid);

  if (
    !session ||
    !session.active
  ) {
    return null;
  }

  const text =
    String(
      userMessage || ""
    ).trim();

  if (!text) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | ADD USER MESSAGE
  |--------------------------------------------------------------------------
  */

  addHistory(
    session,
    "user",
    text
  );

  /*
  |--------------------------------------------------------------------------
  | ASK AI WITH CONVERSATION HISTORY
  |--------------------------------------------------------------------------
  */

  const answer =
    await askAI(
      text,
      {
        systemPrompt:
          [
            "You are TOPFEROS MD V2.0.0 AI Chat.",
            "Continue the existing conversation naturally.",
            "Use the previous conversation history to understand references and follow-up requests.",
            "Do not restart the conversation unnecessarily.",
            "Answer professionally and naturally.",
            "If the user writes in Haitian Creole, answer in Haitian Creole.",
            "If the user writes in French, answer in French.",
            "If the user writes in English, answer in English.",
            "If the user asks for a prompt, make it professional and detailed.",
            "If the user asks to improve something from the previous message, preserve the relevant context.",
            "You are TOPFEROS MD V2.0.0."
          ].join(" "),

        history:
          session.history,

        temperature:
          0.7,

        maxTokens:
          1500
      }
    );

  addHistory(
    session,
    "assistant",
    answer
  );

  return {
    session,
    answer
  };
}

/*
|--------------------------------------------------------------------------
| STORE LAST AI MESSAGE
|--------------------------------------------------------------------------
|
| messageId is the WhatsApp message ID returned when the bot
| sends the AI response.
|
|--------------------------------------------------------------------------
*/

function setLastAIMessage(
  jid,
  messageId,
  text
) {
  const session =
    getSession(jid);

  if (
    !session ||
    !session.active
  ) {
    return false;
  }

  session.lastAIMessageId =
    messageId ||
    null;

  session.lastAIText =
    String(
      text || ""
    ).trim();

  session.updatedAt =
    new Date().toISOString();

  return true;
}

/*
|--------------------------------------------------------------------------
| VERIFY REPLY / FORWARD TARGET
|--------------------------------------------------------------------------
|
| The incoming message must reference the latest AI response.
|
|--------------------------------------------------------------------------
*/

function isReplyToLastAIMessage(
  jid,
  quotedMessageId
) {
  const session =
    getSession(jid);

  if (
    !session ||
    !session.active
  ) {
    return false;
  }

  if (
    !session.lastAIMessageId
  ) {
    return false;
  }

  if (!quotedMessageId) {
    return false;
  }

  return (
    String(
      quotedMessageId
    ) ===
    String(
      session.lastAIMessageId
    )
  );
}

/*
|--------------------------------------------------------------------------
| GET CHAT HISTORY
|--------------------------------------------------------------------------
*/

function getChatHistory(
  jid
) {
  const session =
    getSession(jid);

  if (!session) {
    return [];
  }

  return [
    ...session.history
  ];
}

/*
|--------------------------------------------------------------------------
| GET SESSION INFO
|--------------------------------------------------------------------------
*/

function getSessionInfo(
  jid
) {
  const session =
    getSession(jid);

  if (!session) {
    return null;
  }

  return {
    jid:
      session.jid,

    active:
      session.active,

    createdAt:
      session.createdAt,

    updatedAt:
      session.updatedAt,

    lastAIMessageId:
      session.lastAIMessageId,

    historyLength:
      session.history.length
  };
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  createSession,
  getSession,
  getOrCreateSession,
  hasSession,
  startAIChat,
  continueAIChat,
  setLastAIMessage,
  isReplyToLastAIMessage,
  getChatHistory,
  getSessionInfo
};