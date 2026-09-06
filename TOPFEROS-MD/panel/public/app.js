"use strict";

/* =========================================================
   TOPFEROS MD V1.0.0
   PANEL - LANGUAGE / PANEL CODE / PARRAIN CODE
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

/* =========================
   SCREENS
   ========================= */

const languageScreen = $("#languageScreen");
const panelCodeScreen = $("#panelCodeScreen");
const parrainCodeScreen = $("#parrainCodeScreen");

/* =========================
   LANGUAGE BUTTONS
   ========================= */

const languageButtons =
    document.querySelectorAll(".language-button");

/* =========================
   SESSION
   ========================= */

let currentLanguage = "fr";
let currentSessionId = null;
let currentNumber = null;

/* =========================
   TRANSLATIONS
   ========================= */

const translations = {
    fr: {
        panelCode: "CODE PANEL",
        parrainCode: "CODE PARRAIN",
        number: "Numéro",
        code: "Code",
        login: "CONNEXION",
        generate: "GÉNÉRER CODE PARRAIN",
        copy: "COPIER",
        copied: "COPIÉ",
        error: "Une erreur est survenue.",
        numberRequired: "Veuillez entrer votre numéro.",
        codeRequired: "Veuillez entrer le code panel.",
        numberNotFound: "Numéro introuvable.",
        sessionNotFound: "Session introuvable.",
        codeNotFound: "Code Parrain introuvable."
    },

    en: {
        panelCode: "PANEL CODE",
        parrainCode: "PARRAIN CODE",
        number: "Number",
        code: "Code",
        login: "LOGIN",
        generate: "GENERATE PARRAIN CODE",
        copy: "COPY",
        copied: "COPIED",
        error: "An error occurred.",
        numberRequired: "Please enter your number.",
        codeRequired: "Please enter the panel code.",
        numberNotFound: "Number not found.",
        sessionNotFound: "Session not found.",
        codeNotFound: "Parrain Code not found."
    },

    es: {
        panelCode: "CÓDIGO DEL PANEL",
        parrainCode: "CÓDIGO PARRAIN",
        number: "Número",
        code: "Código",
        login: "INICIAR SESIÓN",
        generate: "GENERAR CÓDIGO PARRAIN",
        copy: "COPIAR",
        copied: "COPIADO",
        error: "Ocurrió un error.",
        numberRequired: "Ingrese su número.",
        codeRequired: "Ingrese el código del panel.",
        numberNotFound: "Número no encontrado.",
        sessionNotFound: "Sesión no encontrada.",
        codeNotFound: "Código Parrain no encontrado."
    }
};

/* =========================
   TRANSLATION HELPER
   ========================= */

function t(key) {
    return (
        translations[currentLanguage]?.[key] ||
        translations.fr[key] ||
        key
    );
}

/* =========================
   CLEAN NUMBER
   ========================= */

function cleanNumber(number) {
    return String(number || "")
        .replace(/[^\d]/g, "")
        .trim();
}

/* =========================
   SCREEN MANAGEMENT
   ========================= */

function showScreen(screen) {
    [
        languageScreen,
        panelCodeScreen,
        parrainCodeScreen
    ].forEach((element) => {
        if (element) {
            element.style.display = "none";
        }
    });

    if (screen) {
        screen.style.display = "block";
    }
}

/* =========================
   MESSAGE
   ========================= */

function setMessage(
    element,
    message,
    type = "error"
) {
    if (!element) return;

    element.textContent = message;
    element.className = `message ${type}`;
}

/* =========================
   SESSION STORAGE
   ========================= */

function saveSession(sessionId, number) {
    currentSessionId = sessionId || null;
    currentNumber = cleanNumber(number);

    if (currentSessionId) {
        localStorage.setItem(
            "topferos_session_id",
            currentSessionId
        );
    }

    if (currentNumber) {
        localStorage.setItem(
            "topferos_number",
            currentNumber
        );
    }
}

function getSavedSession() {
    return {
        sessionId:
            localStorage.getItem(
                "topferos_session_id"
            ),

        number:
            localStorage.getItem(
                "topferos_number"
            )
    };
}

/* =========================
   APPLY LANGUAGE
   ========================= */

function applyLanguage() {
    const lang =
        translations[currentLanguage];

    if (!lang) return;

    const panelTitle =
        $("#panelCodeTitle");

    const parrainTitle =
        $("#parrainCodeTitle");

    const loginButton =
        $("#panelLoginButton");

    const generateButton =
        $("#generateParrainButton");

    const copyButton =
        $("#copyParrainButton");

    if (panelTitle) {
        panelTitle.textContent =
            lang.panelCode;
    }

    if (parrainTitle) {
        parrainTitle.textContent =
            lang.parrainCode;
    }

    if (loginButton) {
        loginButton.textContent =
            lang.login;
    }

    if (generateButton) {
        generateButton.textContent =
            lang.generate;
    }

    if (copyButton) {
        copyButton.textContent =
            lang.copy;
    }
}

/* =========================
   SELECT LANGUAGE
   ========================= */

function selectLanguage(language) {
    if (!translations[language]) {
        language = "fr";
    }

    currentLanguage = language;

    localStorage.setItem(
        "topferos_language",
        currentLanguage
    );

    applyLanguage();

    showScreen(panelCodeScreen);
}

/* =========================
   INITIALIZE LANGUAGE
   ========================= */

function initializeLanguage() {
    const savedLanguage =
        localStorage.getItem(
            "topferos_language"
        );

    if (
        savedLanguage &&
        translations[savedLanguage]
    ) {
        currentLanguage =
            savedLanguage;
    }

    languageButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                const language =
                    button.dataset.language ||
                    button.getAttribute(
                        "data-lang"
                    );

                selectLanguage(language);
            }
        );
    });

    applyLanguage();
}

/* =========================
   PANEL LOGIN
   ========================= */

async function panelLogin(event) {
    if (event) {
        event.preventDefault();
    }

    const numberInput =
        $("#number");

    const codeInput =
        $("#panelCode");

    const loginButton =
        $("#panelLoginButton");

    const message =
        $("#panelMessage");

    if (
        !numberInput ||
        !codeInput
    ) {
        return;
    }

    const number =
        cleanNumber(
            numberInput.value
        );

    const code =
        String(
            codeInput.value || ""
        ).trim();

    /* NUMBER VALIDATION */

    if (!number) {
        setMessage(
            message,
            t("numberRequired"),
            "error"
        );

        return;
    }

    /* CODE VALIDATION */

    if (!code) {
        setMessage(
            message,
            t("codeRequired"),
            "error"
        );

        return;
    }

    /* LOADING */

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "•••";
    }

    try {
        const response =
            await fetch(
                "/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        number,
                        code
                    })
                }
            );

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                t("error")
            );
        }

        /* SESSION */

        currentSessionId =
            data.sessionId ||
            data.session ||
            null;

        /* NUMBER */

        currentNumber =
            cleanNumber(
                data.number ||
                number
            );

        saveSession(
            currentSessionId,
            currentNumber
        );

        /* CLEAR ERROR */

        setMessage(
            message,
            "",
            "success"
        );

        /* DISPLAY PARRAIN SCREEN */

        const parrainNumber =
            $("#parrainNumber");

        if (parrainNumber) {
            /*
             * IMPORTANT:
             * #parrainNumber is <strong>
             * not an input.
             */
            parrainNumber.textContent =
                currentNumber;
        }

        /* HIDE OLD PARRAIN CODE */

        const codeSection =
            $("#parrainCodeSection");

        if (codeSection) {
            codeSection.style.display =
                "none";
        }

        const codeElement =
            $("#parrainCode");

        if (codeElement) {
            codeElement.textContent = "";
        }

        showScreen(
            parrainCodeScreen
        );

        applyLanguage();

    } catch (error) {
        console.error(
            "Panel login error:",
            error
        );

        setMessage(
            message,
            error.message ||
                t("error"),
            "error"
        );

    } finally {
        if (loginButton) {
            loginButton.disabled =
                false;

            loginButton.textContent =
                t("login");
        }
    }
}

/* =========================
   GENERATE PARRAIN CODE
   ========================= */

async function generateParrainCode() {
    const generateButton =
        $("#generateParrainButton");

    const codeSection =
        $("#parrainCodeSection");

    const codeElement =
        $("#parrainCode");

    const message =
        $("#parrainMessage");

    /*
     * #parrainNumber is a <strong>,
     * therefore we use currentNumber
     * instead of .value.
     */

    let number =
        cleanNumber(
            currentNumber ||
            localStorage.getItem(
                "topferos_number"
            )
        );

    /* NUMBER CHECK */

    if (!number) {
        setMessage(
            message,
            t("numberNotFound"),
            "error"
        );

        return;
    }

    /* SESSION RECOVERY */

    if (!currentSessionId) {
        currentSessionId =
            localStorage.getItem(
                "topferos_session_id"
            );
    }

    /* SESSION CHECK */

    if (!currentSessionId) {
        setMessage(
            message,
            t("sessionNotFound"),
            "error"
        );

        return;
    }

    /* LOADING */

    if (generateButton) {
        generateButton.disabled =
            true;

        generateButton.textContent =
            "•••";
    }

    try {
        const response =
            await fetch(
                "/api/auth",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        sessionId:
                            currentSessionId,

                        number
                    })
                }
            );

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                t("error")
            );
        }

        /* GET PARRAIN CODE */

        const parrainCode =
            data.code ||
            data.parrainCode ||
            data.parrain ||
            "";

        if (!parrainCode) {
            throw new Error(
                t("codeNotFound")
            );
        }

        /* DISPLAY CODE */

        if (codeElement) {
            codeElement.textContent =
                parrainCode;
        }

        if (codeSection) {
            codeSection.style.display =
                "block";
        }

        setMessage(
            message,
            "",
            "success"
        );

    } catch (error) {
        console.error(
            "Parrain code error:",
            error
        );

        setMessage(
            message,
            error.message ||
                t("error"),
            "error"
        );

    } finally {
        if (generateButton) {
            generateButton.disabled =
                false;

            generateButton.textContent =
                t("generate");
        }
    }
}

/* =========================
   COPY PARRAIN CODE
   ========================= */

async function copyParrainCode() {
    const codeElement =
        $("#parrainCode");

    const copyButton =
        $("#copyParrainButton");

    if (!codeElement) {
        return;
    }

    const code =
        codeElement.textContent.trim();

    if (!code) {
        return;
    }

    try {
        await navigator.clipboard.writeText(
            code
        );

    } catch (error) {
        console.warn(
            "Clipboard API unavailable:",
            error
        );

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value = code;

        textarea.style.position =
            "fixed";

        textarea.style.opacity = "0";

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand(
            "copy"
        );

        textarea.remove();
    }

    if (copyButton) {
        copyButton.textContent =
            t("copied");

        setTimeout(() => {
            copyButton.textContent =
                t("copy");
        }, 1500);
    }
}

/* =========================
   RESTORE SESSION
   ========================= */

function restoreSession() {
    const saved =
        getSavedSession();

    if (
        saved.sessionId &&
        saved.number
    ) {
        currentSessionId =
            saved.sessionId;

        currentNumber =
            cleanNumber(
                saved.number
            );

        const parrainNumber =
            $("#parrainNumber");

        if (parrainNumber) {
            parrainNumber.textContent =
                currentNumber;
        }
    }
}

/* =========================
   EVENTS
   ========================= */

function setupEvents() {
    const loginButton =
        $("#panelLoginButton");

    const loginForm =
        $("#panelCodeForm");

    const generateButton =
        $("#generateParrainButton");

    const copyButton =
        $("#copyParrainButton");

    /* LOGIN FORM */

    if (loginForm) {
        loginForm.addEventListener(
            "submit",
            panelLogin
        );
    } else if (loginButton) {
        /*
         * Fallback if the form
         * does not exist.
         */
        loginButton.addEventListener(
            "click",
            panelLogin
        );
    }

    /* GENERATE */

    if (generateButton) {
        generateButton.addEventListener(
            "click",
            generateParrainCode
        );
    }

    /* COPY */

    if (copyButton) {
        copyButton.addEventListener(
            "click",
            copyParrainCode
        );
    }
}

/* =========================
   START APP
   ========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        restoreSession();

        initializeLanguage();

        setupEvents();

        /*
         * If a previous session exists,
         * keep the number displayed.
         */
        const parrainNumber =
            $("#parrainNumber");

        if (
            parrainNumber &&
            currentNumber
        ) {
            parrainNumber.textContent =
                currentNumber;
        }
    }
);