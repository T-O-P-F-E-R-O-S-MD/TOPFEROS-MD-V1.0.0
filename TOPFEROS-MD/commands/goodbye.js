"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 GENERATE AI GOODBYE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function generateAIGoodbye({
  groupName,
  description
}) {
  const apiUrl =
    config.ai?.apiUrl ||
    "https://api.groq.com/openai/v1/chat/completions";

  const apiKey =
    config.ai?.apiKey;

  const model =
    config.ai?.model ||
    "openai/gpt-oss-20b";

  if (!apiKey) {
    return null;
  }

  const groupDescription =
    String(description || "").trim();

  // 🕐 CURRENT TIME
  const now = new Date();

  const currentTime =
    now.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }
    );

  const currentHour =
    now.getHours();

  let timePeriod;

  if (currentHour >= 5 && currentHour < 12) {
    timePeriod = "morning";
  } else if (
    currentHour >= 12 &&
    currentHour < 17
  ) {
    timePeriod = "afternoon";
  } else if (
    currentHour >= 17 &&
    currentHour < 21
  ) {
    timePeriod = "evening";
  } else {
    timePeriod = "night";
  }

  const languageInstruction =
    groupDescription
      ? `
GROUP DESCRIPTION:

"""
${groupDescription}
"""

Detect the PRIMARY language used in this
group description.

Write the goodbye message in that same language.
`
      : `
There is no usable group description.

Write the goodbye message in English.
`;

  const systemPrompt = `
You are 🦁 TOPFEROS MD AI.

Your task is to create a professional,
friendly and elegant goodbye/good-day
message for a WhatsApp group.

${languageInstruction}

CURRENT TIME:
${currentTime}

CURRENT TIME PERIOD:
${timePeriod}

GROUP NAME:
{{GROUP}}

IMPORTANT RULES:

1. Write ONLY the final message.
2. Do not explain your language detection.
3. Do not mention that AI generated the message.
4. Use the detected language from the group description.
5. Use the current time period naturally.
6. The message should feel appropriate for the
   current time of day.
7. Keep it professional, warm and friendly.
8. Use attractive emojis, but do not overuse them.
9. Always mention the user using exactly:
   {{MEMBER}}
10. Always use the real group name using:
    {{GROUP}}
11. Never invent a group name.
12. Whenever you mention the bot brand in the
    message body, write exactly:
    🦁 TOPFEROS MD
13. Never write "TOPFEROS MD TECH" inside the
    body of the message.
14. "TECH 🐑" may appear ONLY in the final signature.
15. Do not add another signature.
16. Do not use markdown code blocks.
17. The final signature MUST be exactly:

╰━━━〔 🦁 TOPFEROS MD TECH 🐑 〕━━━╯

18. Do not replace {{MEMBER}}.
19. Do not replace {{GROUP}}.

The message should follow this general style:

╭━━━〔 🌟 SEE YOU SOON 〕━━━╮

👋 {{MEMBER}}

☀️ We wish you a wonderful day
filled with success! ✨

🤝 Thank you for being part of
*{{GROUP}}*.

🌟 Take care and see you soon!

╰━━━〔 🦁 TOPFEROS MD TECH 🐑 〕━━━╯
`;

  try {
    const response = await fetch(
      apiUrl,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model,

          messages: [
            {
              role: "system",
              content: systemPrompt
            },

            {
              role: "user",
              content:
                `Create the goodbye message for the group "${groupName}".`
            }
          ],

          temperature: 0.7,

          max_completion_tokens: 600
        })
      }
    );

    if (!response.ok) {
      let errorText = "";

      try {
        errorText =
          await response.text();
      } catch (_) {}

      console.error(
        "[GOODBYE AI] Groq API error:",
        response.status,
        errorText
      );

      return null;
    }

    const data =
      await response.json();

    const answer =
      data?.choices?.[0]?.message?.content;

    if (!answer) {
      console.error(
        "[GOODBYE AI] Groq pa retounen mesaj."
      );

      return null;
    }

    return answer.trim();

  } catch (error) {
    console.error(
      "[GOODBYE AI] ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    return null;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛟 FALLBACK MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createFallbackGoodbye(
  groupName
) {
  const hour =
    new Date().getHours();

  let greeting;

  if (hour >= 5 && hour < 12) {
    greeting =
      "🌅 Good morning!";
  } else if (
    hour >= 12 &&
    hour < 17
  ) {
    greeting =
      "☀️ Have a wonderful afternoon!";
  } else if (
    hour >= 17 &&
    hour < 21
  ) {
    greeting =
      "🌆 Have a beautiful evening!";
  } else {
    greeting =
      "🌙 Have a peaceful night!";
  }

  return `╭━━━〔 🌟 SEE YOU SOON 〕━━━╮

👋 {{MEMBER}}

${greeting} ✨

🤝 Thank you for being part of
*${groupName}*.

🌟 Take care and see you soon!

╰━━━〔 🦁 TOPFEROS MD TECH 🐑 〕━━━╯`;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👋 GOODBYE COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context;

  const chatId =
    message?.key?.remoteJid;

  if (
    !sock ||
    !chatId
  ) {
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👥 GROUP ONLY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (
    !chatId.endsWith("@g.us")
  ) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ *🦁 TOPFEROS MD*\n\n" +
          "Goodbye disponib sèlman nan group."
      },
      {
        quoted: message
      }
    );

    return;
  }

  try {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📋 GROUP METADATA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const metadata =
      await sock.groupMetadata(
        chatId
      );

    /*
     * 🔇 GROUP MUTE / ANNOUNCEMENT
     *
     * Lè sèlman admins ka voye mesaj,
     * bot la pa voye Goodbye.
     */

    if (
      metadata?.announce === true
    ) {
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🏠 REAL GROUP NAME
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const groupName =
      metadata?.subject ||
      "Group";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 GROUP DESCRIPTION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const description =
      metadata?.desc ||
      metadata?.description ||
      "";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 👤 USER WHO USED .GOODBYE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const userJid =
      message?.key?.participant ||
      message?.participant;

    if (!userJid) {
      return;
    }

    const userNumber =
      String(userJid)
        .split("@")[0]
        .split(":")[0];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🤖 AI MESSAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let goodbyeMessage =
      await generateAIGoodbye({
        groupName,
        description
      });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🛟 FALLBACK
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!goodbyeMessage) {
      goodbyeMessage =
        createFallbackGoodbye(
          groupName
        );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔄 REPLACE VARIABLES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let finalMessage =
      goodbyeMessage
        .replace(
          /{{MEMBER}}/g,
          `@${userNumber}`
        )
        .replace(
          /{{GROUP}}/g,
          groupName
        );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🦁 GUARANTEE BRAND NAME
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    finalMessage =
      finalMessage.replace(
        /TOPFEROS MD TECH/g,
        "TOPFEROS MD"
      );

    /*
     * Re-ajoute TECH sèlman nan signature final la.
     */

    const finalSignature =
      "╰━━━〔 🦁 TOPFEROS MD TECH 🐑 〕━━━╯";

    /*
     * Retire nenpòt ancienne signature
     * pou éviter doublons.
     */

    finalMessage =
      finalMessage.replace(
        /╰━━━〔\s*🦁\s*TOPFEROS MD(?: TECH)? 🐑?\s*〕━━━╯/gi,
        ""
      ).trim();

    finalMessage +=
      `\n\n${finalSignature}`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendMessage(
      chatId,
      {
        text: finalMessage,

        mentions: [
          userJid
        ]
      },
      {
        quoted: message
      }
    );

    console.log(
      `[GOODBYE] .goodbye sent | group=${chatId}`
    );

  } catch (error) {

    console.error(
      "[GOODBYE] ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    try {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *🦁 TOPFEROS MD*\n\n" +
            "Gen yon erè pandan Goodbye AI t ap prepare mesaj la."
        },
        {
          quoted: message
        }
      );
    } catch (_) {}
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 COMMAND EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "goodbye",

  aliases: [
    "bye"
  ],

  description:
    "Generate an AI goodbye message based on the group language and current time.",

  usage:
    ".goodbye",

  execute
};