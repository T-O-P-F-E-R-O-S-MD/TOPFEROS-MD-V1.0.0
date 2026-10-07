"use strict";

/*

* 🦁 TOPFEROS MD V2.0.0 🐑
* panel/public/settings.js
* 
* V2 settings compatibility helper.
* 
* The active settings interface uses:
* panel/public/app.js
* 
* This file contains no V1 settings logic.
  */

(() => {
const STORAGE_KEY =
"topferos_session_id";

function getSessionId() {
const params =
new URLSearchParams(
window.location.search
);

return (
  params.get("sessionId") ||
  params.get("session") ||
  localStorage.getItem(
    STORAGE_KEY
  ) ||
  ""
).trim();

}

function setSessionId(value) {
const sessionId =
String(value || "").trim();

if (sessionId) {
  localStorage.setItem(
    STORAGE_KEY,
    sessionId
  );
} else {
  localStorage.removeItem(
    STORAGE_KEY
  );
}

return sessionId;

}

function getApiUrl(path) {
const value =
String(path || "");

if (value.startsWith("/")) {
  return value;
}

return `/${value}`;

}

async function apiRequest(
path,
options = {}
) {
const response =
await fetch(
getApiUrl(path),
{
...options,

      headers: {
        Accept:
          "application/json",

        ...(options.body
          ? {
              "Content-Type":
                "application/json"
            }
          : {}),

        ...(options.headers || {})
      }
    }
  );

let data = null;

try {
  data =
    await response.json();
} catch {
  data = null;
}

if (!response.ok) {
  throw new Error(
    data?.message ||
    data?.error ||
    `Request failed with status ${response.status}`
  );
}

return data;

}

async function getPanelInfo() {
return apiRequest(
"/api/panel"
);
}

async function getLanguages() {
return apiRequest(
"/api/languages"
);
}

async function setPanelLanguage(
language
) {
return apiRequest(
"/api/language",
{
method: "POST",

    body: JSON.stringify({
      sessionId:
        getSessionId(),

      language
    })
  }
);

}

async function verifySession(
number,
code
) {
const phoneNumber =
String(number || "")
.replace(/\D/g, "");

const verificationCode =
  String(code || "")
    .trim()
    .toUpperCase();

if (!phoneNumber) {
  throw new Error(
    "Phone number is required."
  );
}

if (!verificationCode) {
  throw new Error(
    "Verification code is required."
  );
}

const result =
  await apiRequest(
    "/api/verify",
    {
      method: "POST",

      body: JSON.stringify({
        number:
          phoneNumber,

        code:
          verificationCode,

        sessionId:
          getSessionId()
      })
    }
  );

if (result?.sessionId) {
  setSessionId(
    result.sessionId
  );
}

return result;

}

async function getSettings(
sessionId =
getSessionId()
) {
if (!sessionId) {
throw new Error(
"Session ID is required."
);
}

return apiRequest(
  `/api/settings?sessionId=${encodeURIComponent(
    sessionId
  )}`
);

}

async function saveSettings(
data = {},
sessionId =
getSessionId()
) {
if (!sessionId) {
throw new Error(
"Session ID is required."
);
}

return apiRequest(
  "/api/settings",
  {
    method: "POST",

    body: JSON.stringify({
      sessionId,

      bot:
        data.bot || {},

      settings:
        data.settings || {}
    })
  }
);

}

async function getSessionStatus(
sessionId =
getSessionId()
) {
if (!sessionId) {
throw new Error(
"Session ID is required."
);
}

return apiRequest(
  `/api/session/${encodeURIComponent(
    sessionId
  )}`
);

}

async function disconnect(
sessionId =
getSessionId()
) {
if (!sessionId) {
throw new Error(
"Session ID is required."
);
}

return apiRequest(
  `/api/session/${encodeURIComponent(
    sessionId
  )}/disconnect`,
  {
    method: "POST"
  }
);

}

async function reconnect(
sessionId =
getSessionId()
) {
if (!sessionId) {
throw new Error(
"Session ID is required."
);
}

return apiRequest(
  `/api/session/${encodeURIComponent(
    sessionId
  )}/reconnect`,
  {
    method: "POST"
  }
);

}

window.TOPFEROS_SETTINGS = {
version: "2.0.0",

getSessionId,
setSessionId,

getPanelInfo,
getLanguages,
setPanelLanguage,

verifySession,

getSettings,
saveSettings,

getSessionStatus,

disconnect,
reconnect

};
})();