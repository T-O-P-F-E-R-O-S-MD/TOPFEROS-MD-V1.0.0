"use strict";

const $ = (selector) => document.querySelector(selector);

const languageScreen = $("#languageScreen");
const panelCodeScreen = $("#panelCodeScreen");
const parrainCodeScreen = $("#parrainCodeScreen");

const languageButtons = document.querySelectorAll(".language-btn");

let currentLanguage = "fr";
let currentSessionId = null;
let currentNumber = null;

const translations = {
    fr: {
        panelCode: "CODE PANEL",
        parrainCode: "CODE PARRAIN",
        number: "Numéro",
        code: "Code",
        login: "CONNEXION",
        generate: "GÉNÉRER CODE PARRAIN",
        next: "SUIVANT",
        copy: "COPIER",
        copied: "COPIÉ",
        error: "Une erreur est survenue."
    },

    en: {
        panelCode: "PANEL CODE",
        parrainCode: "PARRAIN CODE",
        number: "Number",
        code: "Code",
        login: "LOGIN",
        generate: "GENERATE PARRAIN CODE",
        next: "NEXT",
        copy: "COPY",
        copied: "COPIED",
        error: "An error occurred."
    },

    ht: {
        panelCode: "KÒD PANEL",
        parrainCode: "KÒD PARRAIN",
        number: "Nimewo",
        code: "Kòd",
        login: "KONEKSYON",
        generate: "JENERE KÒD PARRAIN",
        next: "PI LÈ",
        copy: "KOPYE",
        copied: "KOPYE",
        error: "Gen yon erè ki rive."
    }
};

function t(key) {
    return translations[currentLanguage]?.[key] || translations.fr[key] || key;
}

function cleanNumber(number) {
    return String(number || "")
        .replace(/[^\d]/g, "")
        .trim();
}

function showScreen(screen) {
    [languageScreen, panelCodeScreen, parrainCodeScreen].forEach((element) => {
        if (element) {
            element.style.display = "none";
        }
    });

    if (screen) {
        screen.style.display = "block";
    }
}

function setMessage(element, message, type = "error") {
    if (!element) return;

    element.textContent = message;
    element.className = `message ${type}`;
}

function saveSession(sessionId, number) {
    currentSessionId = sessionId || null;
    currentNumber = number || null;

    if (currentSessionId) {
        localStorage.setItem("topferos_session_id", currentSessionId);
    }

    if (currentNumber) {
        localStorage.setItem("topferos_number", currentNumber);
    }
}

function getSavedSession() {
    return {
        sessionId: localStorage.getItem("topferos_session_id"),
        number: localStorage.getItem("topferos_number")
    };
}

function applyLanguage() {
    const lang = translations[currentLanguage];

    if (!lang) return;

    const panelTitle = $("#panelCodeTitle");
    const parrainTitle = $("#parrainCodeTitle");
    const loginButton = $("#panelLoginButton");
    const generateButton = $("#generateParrainButton");
    const nextButton = $("#nextButton");
    const copyButton = $("#copyParrainButton");

    if (panelTitle) {
        panelTitle.textContent = lang.panelCode;
    }

    if (parrainTitle) {
        parrainTitle.textContent = lang.parrainCode;
    }

    if (loginButton) {
        loginButton.textContent = lang.login;
    }

    if (generateButton) {
        generateButton.textContent = lang.generate;
    }

    if (nextButton) {
        nextButton.textContent = lang.next;
    }

    if (copyButton) {
        copyButton.textContent = lang.copy;
    }
}

function selectLanguage(language) {
    if (!translations[language]) {
        language = "fr";
    }

    currentLanguage = language;

    localStorage.setItem("topferos_language", currentLanguage);

    applyLanguage();
    showScreen(panelCodeScreen);
}

function initializeLanguage() {
    const savedLanguage =
        localStorage.getItem("topferos_language");

    if (savedLanguage && translations[savedLanguage]) {
        currentLanguage = savedLanguage;
    }

    languageButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const language =
                button.dataset.language ||
                button.getAttribute("data-lang");

            selectLanguage(language);
        });
    });

    applyLanguage();
}
async function panelLogin() {
    const numberInput = $("#number");
    const codeInput = $("#panelCode");
    const loginButton = $("#panelLoginButton");
    const message = $("#panelMessage");

    if (!numberInput || !codeInput) {
        return;
    }

    const number = cleanNumber(numberInput.value);
    const code = String(codeInput.value || "").trim();

    if (!number) {
        setMessage(
            message,
            "Veuillez entrer votre numéro.",
            "error"
        );
        return;
    }

    if (!code) {
        setMessage(
            message,
            "Veuillez entrer le code panel.",
            "error"
        );
        return;
    }

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "•••";
    }

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                number,
                code
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || t("error")
            );
        }

        currentSessionId =
            data.sessionId ||
            data.session ||
            null;

        currentNumber =
            data.number ||
            number;

        saveSession(
            currentSessionId,
            currentNumber
        );

        const parrainNumber = $("#parrainNumber");

        if (parrainNumber) {
            parrainNumber.value =
                currentNumber;
        }

        setMessage(
            message,
            "",
            "success"
        );

        showScreen(parrainCodeScreen);
        applyLanguage();

    } catch (error) {
        console.error(
            "Panel login error:",
            error
        );

        setMessage(
            message,
            error.message || t("error"),
            "error"
        );
    } finally {
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = t("login");
        }
    }
}

async function generateParrainCode() {
    const numberInput = $("#parrainNumber");
    const generateButton =
        $("#generateParrainButton");
    const codeSection =
        $("#parrainCodeSection");
    const codeElement =
        $("#parrainCode");
    const message =
        $("#parrainMessage");

    let number =
        numberInput
            ? cleanNumber(numberInput.value)
            : "";

    if (!number) {
        number =
            cleanNumber(
                currentNumber ||
                localStorage.getItem(
                    "topferos_number"
                )
            );
    }

    if (!number) {
        setMessage(
            message,
            "Numéro introuvable.",
            "error"
        );
        return;
    }

    if (!currentSessionId) {
        currentSessionId =
            localStorage.getItem(
                "topferos_session_id"
            );
    }

    if (!currentSessionId) {
        setMessage(
            message,
            "Session introuvable. Veuillez vous reconnecter.",
            "error"
        );
        return;
    }

    if (generateButton) {
        generateButton.disabled = true;
        generateButton.textContent = "•••";
    }

    try {
        const response = await fetch(
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

        const parrainCode =
            data.code ||
            data.parrainCode ||
            "";

        if (!parrainCode) {
            throw new Error(
                "Code Parrain introuvable."
            );
        }

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
            error.message || t("error"),
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

function copyParrainCode() {
    const codeElement = $("#parrainCode");
    const copyButton = $("#copyParrainButton");

    if (!codeElement) return;

    const code =
        codeElement.textContent.trim();

    if (!code) return;

    navigator.clipboard
        .writeText(code)
        .then(() => {
            if (copyButton) {
                copyButton.textContent =
                    t("copied");

                setTimeout(() => {
                    copyButton.textContent =
                        t("copy");
                }, 1500);
            }
        })
        .catch((error) => {
            console.error(
                "Copy error:",
                error
            );

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value = code;
            document.body.appendChild(
                textarea
            );

            textarea.select();
            document.execCommand("copy");
            textarea.remove();

            if (copyButton) {
                copyButton.textContent =
                    t("copied");

                setTimeout(() => {
                    copyButton.textContent =
                        t("copy");
                }, 1500);
            }
        });
}

function goToSettings() {
    if (!currentSessionId) {
        currentSessionId =
            localStorage.getItem(
                "topferos_session_id"
            );
    }

    if (!currentSessionId) {
        setMessage(
            $("#parrainMessage"),
            "Session introuvable.",
            "error"
        );
        return;
    }

    const params =
        new URLSearchParams({
            session: currentSessionId,
            language: currentLanguage
        });

    window.location.href =
        `/settings.html?${params.toString()}`;
}

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
            saved.number;

        const parrainNumber =
            $("#parrainNumber");

        if (parrainNumber) {
            parrainNumber.value =
                currentNumber;
        }
    }
}function setupEvents() {
    const loginButton =
        $("#panelLoginButton");

    const generateButton =
        $("#generateParrainButton");

    const copyButton =
        $("#copyParrainButton");

    const nextButton =
        $("#nextButton");

    if (loginButton) {
        loginButton.addEventListener(
            "click",
            panelLogin
        );
    }

    if (generateButton) {
        generateButton.addEventListener(
            "click",
            generateParrainCode
        );
    }

    if (copyButton) {
        copyButton.addEventListener(
            "click",
            copyParrainCode
        );
    }

    if (nextButton) {
        nextButton.addEventListener(
            "click",
            goToSettings
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        restoreSession();
        initializeLanguage();
        setupEvents();

        const parrainNumber =
            $("#parrainNumber");

        if (
            parrainNumber &&
            currentNumber
        ) {
            parrainNumber.value =
                currentNumber;
        }
    }
);