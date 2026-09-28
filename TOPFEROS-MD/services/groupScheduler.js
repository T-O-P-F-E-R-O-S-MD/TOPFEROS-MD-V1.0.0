"use strict";

const settingPanel =
  require("../src/settingPanel");

const TIMEZONE =
  "America/Port-au-Prince";

const CHECK_INTERVAL =
  20 * 1000;

let timer = null;

const lastRuns =
  new Map();


function normalizeNumber(value) {

  return String(value || "")
    .replace(/\D/g, "");

}


function getTimeParts() {

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          TIMEZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false
      }
    ).formatToParts(
      new Date()
    );


  const result = {};


  for (
    const part of parts
  ) {

    if (
      part.type !==
      "literal"
    ) {

      result[part.type] =
        part.value;

    }

  }


  return {

    date:
      `${result.year}-${result.month}-${result.day}`,

    time:
      `${result.hour}:${result.minute}`

  };

}


function extractInviteCode(
  link
) {

  const match =
    String(link || "")
      .match(
        /chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/i
      );


  return match
    ? match[1]
    : "";

}


async function getTargetGroup(
  sock,
  settings
) {

  if (!sock) {
    return null;
  }


  const groupLink =
    String(
      settings.adminGroupLink ||
      ""
    ).trim();


  const adminNumber =
    normalizeNumber(
      settings.adminGroupNumber
    );


  /*
   * Si user bay Group Link,
   * sèvi avè l an premye.
   */

  if (groupLink) {

    const inviteCode =
      extractInviteCode(
        groupLink
      );


    if (!inviteCode) {

      throw new Error(
        "Admin Group Link pa valid."
      );

    }


    const inviteInfo =
      await sock.groupGetInviteInfo(
        inviteCode
      );


    const groupId =
      inviteInfo?.id ||
      inviteInfo?.gid ||
      inviteInfo?.jid;


    if (!groupId) {

      throw new Error(
        "Mwen pa jwenn ID group la nan link la."
      );

    }


    return groupId;

  }


  /*
   * Si pa gen Link,
   * chèche group kote
   * Admin Number la admin.
   */

  if (adminNumber) {

    const groups =
      await sock.groupFetchAllParticipating();


    for (
      const [
        groupId,
        metadata
      ] of Object.entries(
        groups || {}
      )
    ) {

      const participant =
        (
          metadata?.participants ||
          []
        ).find(
          item => {

            const participantNumber =
              normalizeNumber(
                item?.id
                  ?.split("@")[0]
                  ?.split(":")[0]
              );


            return (
              participantNumber ===
              adminNumber
              &&
              (
                item?.admin ===
                  "admin"
                ||
                item?.admin ===
                  "superadmin"
              )
            );

          }
        );


      if (participant) {

        return groupId;

      }

    }

  }


  throw new Error(
    "Mete yon Admin Group Link oswa yon Admin Group Number ki admin nan group la."
  );

}


async function changeGroup(
  sock,
  groupId,
  action
) {

  const metadata =
    await sock.groupMetadata(
      groupId
    );


  const botNumber =
    normalizeNumber(
      sock.user?.id
        ?.split(":")[0]
    );


  const botParticipant =
    (
      metadata?.participants ||
      []
    ).find(
      item => {

        const number =
          normalizeNumber(
            item?.id
              ?.split("@")[0]
              ?.split(":")[0]
          );


        return (
          number ===
          botNumber
        );

      }
    );


  if (
    !botParticipant
    ||
    (
      botParticipant.admin !==
        "admin"
      &&
      botParticipant.admin !==
        "superadmin"
    )
  ) {

    throw new Error(
      "Bot la dwe admin nan group la."
    );

  }


  const setting =
    action === "close"
      ? "announcement"
      : "not_announcement";


  await sock.groupSettingUpdate(
    groupId,
    setting
  );


  console.log(
    `${
      action === "close"
        ? "🔒"
        : "🔓"
    } GROUP ${
      action.toUpperCase()
    } → ${groupId}`
  );

}


async function runSession(
  session
) {

  if (!session?.socket) {
    return;
  }


  const settings =
    session.settings ||
    {};


  if (
    !settings.groupClose
    &&
    !settings.groupOpen
  ) {

    return;

  }


  const now =
    getTimeParts();


  const actions = [];


  if (
    settings.groupClose
    &&
    String(
      settings.groupCloseTime ||
      ""
    ) === now.time
  ) {

    actions.push(
      "close"
    );

  }


  if (
    settings.groupOpen
    &&
    String(
      settings.groupOpenTime ||
      ""
    ) === now.time
  ) {

    actions.push(
      "open"
    );

  }


  for (
    const action of actions
  ) {

    const runKey =
      `${session.sessionId}:${now.date}:${action}:${now.time}`;


    if (
      lastRuns.has(
        runKey
      )
    ) {

      continue;

    }


    try {

      const groupId =
        await getTargetGroup(
          session.socket,
          settings
        );


      await changeGroup(
        session.socket,
        groupId,
        action
      );


      lastRuns.set(
        runKey,
        Date.now()
      );


    } catch (error) {

      console.error(
        `❌ GROUP SCHEDULER ${
          action.toUpperCase()
        }:`,
        error?.message ||
        error
      );

    }

  }

}


async function tick() {

  for (
    const session of
    settingPanel.sessions.values()
  ) {

    await runSession(
      session
    );

  }

}


function start() {

  if (timer) {
    return;
  }


  timer =
    setInterval(
      () => {

        tick().catch(
          error => {

            console.error(
              "❌ GROUP SCHEDULER ERROR:",
              error?.message ||
              error
            );

          }
        );

      },
      CHECK_INTERVAL
    );


  tick().catch(
    error => {

      console.error(
        "❌ GROUP SCHEDULER START ERROR:",
        error?.message ||
        error
      );

    }
  );


  console.log(
    `⏰ Group scheduler started (${TIMEZONE}).`
  );

}


function stop() {

  if (timer) {

    clearInterval(
      timer
    );

    timer = null;

  }


  lastRuns.clear();

}


module.exports = {

  start,

  stop,

  tick

};
