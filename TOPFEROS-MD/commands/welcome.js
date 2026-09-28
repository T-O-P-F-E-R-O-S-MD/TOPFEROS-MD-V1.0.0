"use strict";

const config = require("../config");

/* =====================================================
   🤖 GENERATE AI WELCOME
===================================================== */

async function generateAIWelcome({
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

  const languageInstruction =
    groupDescription
      ? `
The group description is:

"""
${groupDescription}
"""

Detect the PRIMARY language used in this group description.

Write the welcome message in that same language.
`
      : `
There is no usable group description.

Write the welcome message in English.
`;

  const systemPrompt = `
You are 🦁 TOPFEROS MD AI.

Your task is to create a professional,
friendly and welcoming WhatsApp group
welcome message.

${languageInstruction}

IMPORTANT RULES:

1. Write ONLY the final welcome message.
2. Do not explain what language you detected.
3. Do not mention that AI generated the message.
4. Keep the message professional and friendly.
5. Use attractive emojis.
6. Do not use excessive emojis.
7. Keep the message reasonably short.
8. Mention the new member using exactly:
   {{MEMBER}}
9. Use the group name using exactly:
   {{GROUP}}
10. Whenever you mention the bot brand, write exactly:
    🦁 TOPFEROS MD
11. Do NOT write "TOPFEROS MD TECH" anywhere
    except in the final signature.
12. Do not replace {{MEMBER}}.
13. Do not replace {{GROUP}}.
14. Do not add another bot/developer signature.
15. Do not use markdown code blocks.
16. The final signature MUST be exactly:

🦁 TOPFEROS MD TECH 🐑

Use this structure as inspiration,
but translate/adapt it naturally to the
detected language:

╭━━━〔 🎉 WELCOME 〕━━━╮

👋 Welcome, {{MEMBER}}!

✨ We’re delighted to have you join
*{{GROUP}}*.

🤝 We hope you’ll enjoy the community,
connect with others, and contribute
positively.

📜 Please respect the group rules
and treat every member with respect.

🌟 Welcome aboard, and enjoy your stay! 🚀

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
                `Create the welcome message for the group "${groupName}".`
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
        "[WELCOME AI] Groq API error:",
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
        "[WELCOME AI] Groq pa retounen mesaj."
      );

      return null;
    }

    return answer.trim();

  } catch (error) {
    console.error(
      "[WELCOME AI] Erè:",
      error?.stack ||
      error?.message ||
      error
    );

    return null;
  }
}


/* =====================================================
   🛟 FALLBACK WELCOME
===================================================== */

function createFallbackWelcome(
  groupName
) {
  return `╭━━━〔 🎉 WELCOME 〕━━━╮

👋 Welcome, {{MEMBER}}!

✨ We’re delighted to have you join
*${groupName}*.

🤝 We hope you’ll enjoy the community,
connect with others, and contribute
positively.

📜 Please respect the group rules
and treat every member with respect.

🌟 Welcome aboard, and enjoy your stay! 🚀

╰━━━〔 🦁 TOPFEROS MD TECH 🐑 〕━━━╯`;
}


/* =====================================================
   👋 SEND WELCOME
===================================================== */

async function sendWelcome(
  sock,
  update
) {
  const groupJid =
    update?.id;

  const participants =
    update?.participants || [];

  if (
    !groupJid ||
    !participants.length
  ) {
    return;
  }

  let metadata;

  try {
    metadata =
      await sock.groupMetadata(
        groupJid
      );

  } catch (error) {
    console.error(
      "[WELCOME] groupMetadata error:",
      error?.message ||
      error
    );

    return;
  }

  const groupName =
    metadata?.subject ||
    "TOPFEROS GROUP";

  /*
   * announce === true
   * = only admins can send messages.
   *
   * Welcome pa voye pandan group la
   * nan announcement/mute mode.
   */

  if (
    metadata?.announce === true
  ) {
    console.log(
      `[WELCOME] Group mute/announcement mode: ${groupJid}`
    );

    return;
  }

  const description =
    metadata?.desc ||
    metadata?.description ||
    "";

  /*
   * Nou fè yon sèl request AI pou event la,
   * menm si gen plizyè participants.
   */

  let welcomeMessage =
    await generateAIWelcome({
      groupName,
      description
    });

  /*
   * Si Groq pa disponib,
   * itilize fallback.
   */

  if (!welcomeMessage) {
    welcomeMessage =
      createFallbackWelcome(
        groupName
      );
  }

  /*
   * Voye mesaj la pou chak nouvo participant.
   */

  for (
    const participant of participants
  ) {
    if (!participant) {
      continue;
    }

    const mention =
      participant;

    const memberNumber =
      participant.split("@")[0];

    /*
     * Ranplase placeholders AI yo.
     */

    let finalMessage =
      welcomeMessage
        .replace(
          /{{MEMBER}}/g,
          `@${memberNumber}`
        )
        .replace(
          /{{GROUP}}/g,
          groupName
        );

    /*
     * Si AI a pa mete placeholder la,
     * garanti mention lan toujou prezan.
     */

    if (
      !finalMessage.includes(
        `@${memberNumber}`
      )
    ) {
      finalMessage =
        `👋 Welcome @${memberNumber}!\n\n` +
        finalMessage;
    }

    /*
     * Garanti branding final la toujou
     * prezan menm si AI modifye li.
     */

    const finalSignature =
      "🦁 TOPFEROS MD TECH 🐑";

    if (
      !finalMessage.includes(
        finalSignature
      )
    ) {
      finalMessage =
        finalMessage.trim() +
        `\n\n╰━━━〔 ${finalSignature} 〕━━━╯`;
    }

    try {
      await sock.sendMessage(
        groupJid,
        {
          text: finalMessage,

          mentions: [
            mention
          ]
        }
      );

      console.log(
        `[WELCOME] Sent to ${participant} in ${groupJid}`
      );

    } catch (error) {
      console.error(
        `[WELCOME] Send error for ${participant}:`,
        error?.stack ||
        error?.message ||
        error
      );
    }
  }
}


/* =====================================================
   📦 EXPORT
===================================================== */

module.exports = {
  sendWelcome
};