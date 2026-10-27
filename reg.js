const form = document.querySelector("#auth-form");
const nicknameInput = document.querySelector("#nickname");
const nicknameField = document.querySelector("#nickname-field");
const emailInput = document.querySelector("#email");
const emailLabel = document.querySelector("#email-label");
const emailInputWrap = document.querySelector("#email-input-wrap");
const passwordInput = document.querySelector("#password");
const passwordLabelRow = document.querySelector("#password-label-row");
const passwordInputWrap = document.querySelector("#password-input-wrap");
const confirmInput = document.querySelector("#confirm-password");
const confirmField = document.querySelector("#confirm-field");
const termsRow = document.querySelector("#terms-row");
const termsInput = document.querySelector("#terms");
const title = document.querySelector("#auth-title");
const subtitle = document.querySelector("#auth-subtitle");
const submitButton = document.querySelector("#submit-button");
const modeToggle = document.querySelector("#mode-toggle");
const switchLabel = document.querySelector("#switch-label");
const passwordHint = document.querySelector("#password-hint");
const forgotLink = document.querySelector("#forgot-link");
const message = document.querySelector("#form-message");
const showPasswordButton = document.querySelector(".show-password");
const resetToken = new URLSearchParams(window.location.search).get("token") || "";

let currentMode = "register";

function showMessage(text, type = "info") {
    message.textContent = text;
    message.classList.toggle("error", type === "error");
    message.hidden = false;
}

function clearMessage() {
    message.textContent = "";
    message.classList.remove("error");
    message.hidden = true;
}

function setMode(mode, updateUrl = true, preserveEmail = false) {
    currentMode = ["login", "forgot", "reset"].includes(mode) ? mode : "register";
    const isRegister = currentMode === "register";
    const isLogin = currentMode === "login";
    const isForgot = currentMode === "forgot";
    const isReset = currentMode === "reset";
    const savedEmail = preserveEmail ? emailInput.value : "";

    title.textContent = isLogin
        ? "С возвращением"
        : isForgot
            ? "Восстановление пароля"
            : isReset
                ? "Создай новый пароль"
                : "Создай аккаунт";
    subtitle.textContent = isLogin
        ? "Войди, чтобы управлять магазином сервера"
        : isForgot
            ? "Укажи email, связанный с аккаунтом"
            : isReset
                ? "Придумай пароль для своего аккаунта"
                : "Начни собирать свой магазин для сервера";
    submitButton.firstElementChild.textContent = isLogin
        ? "Войти"
        : isForgot
            ? "Отправить ссылку"
            : isReset
                ? "Сохранить пароль"
                : "Создать аккаунт";
    switchLabel.textContent = isRegister
        ? "Уже есть аккаунт?"
        : isLogin
            ? "Ещё нет аккаунта?"
            : "Уже вспомнил пароль?";
    modeToggle.textContent = isRegister ? "Войти" : isLogin ? "Создать аккаунт" : "Войти";
    modeToggle.href = isRegister
        ? "?mode=login"
        : isLogin
            ? "?mode=register"
            : "?mode=login";

    nicknameField.hidden = !isRegister;
    nicknameInput.required = isRegister;
    emailLabel.hidden = isReset;
    emailInputWrap.hidden = isReset;
    emailInput.required = !isReset;
    passwordLabelRow.hidden = isForgot;
    passwordInputWrap.hidden = isForgot;
    passwordInput.required = !isForgot;
    passwordInput.minLength = isLogin ? 1 : 8;
    passwordInput.autocomplete = isLogin ? "current-password" : "new-password";
    confirmField.hidden = !(isRegister || isReset);
    confirmInput.required = isRegister || isReset;
    termsRow.hidden = !isRegister;
    termsInput.required = isRegister;
    passwordHint.hidden = isLogin || isForgot;
    forgotLink.hidden = !isLogin;
    passwordInput.type = "password";
    showPasswordButton.textContent = "Показать";
    showPasswordButton.setAttribute("aria-label", "Показать пароль");
    showPasswordButton.setAttribute("aria-pressed", "false");
    clearMessage();
    confirmInput.setCustomValidity("");
    form.reset();
    if (preserveEmail) {
        emailInput.value = savedEmail;
    }

    if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set("mode", currentMode);
        if (!isReset) {
            url.searchParams.delete("token");
        }
        window.history.replaceState(null, "", url);
    }
}

function updatePasswordMatch() {
    if (["register", "reset"].includes(currentMode) &&
        confirmInput.value && confirmInput.value !== passwordInput.value) {
        confirmInput.setCustomValidity("Пароли не совпадают.");
    } else {
        confirmInput.setCustomValidity("");
    }
}

modeToggle.addEventListener("click", event => {
    event.preventDefault();
    setMode(currentMode === "register" ? "login" : currentMode === "login" ? "register" : "login");
});

showPasswordButton.addEventListener("click", () => {
    const visible = passwordInput.type === "password";
    passwordInput.type = visible ? "text" : "password";
    showPasswordButton.textContent = visible ? "Скрыть" : "Показать";
    showPasswordButton.setAttribute("aria-label", visible ? "Скрыть пароль" : "Показать пароль");
    showPasswordButton.setAttribute("aria-pressed", String(visible));
});

passwordInput.addEventListener("input", updatePasswordMatch);
confirmInput.addEventListener("input", updatePasswordMatch);

forgotLink.addEventListener("click", event => {
    event.preventDefault();
    setMode("forgot", true, true);
    emailInput.focus();
});

form.addEventListener("submit", async event => {
    event.preventDefault();
    updatePasswordMatch();

    if (!form.reportValidity()) {
        return;
    }
    if (currentMode === "reset" && !/^[A-Za-z0-9_-]{43}$/.test(resetToken)) {
        showMessage("Ссылка для сброса пароля недействительна или устарела.", "error");
        return;
    }

    const submitLabel = submitButton.firstElementChild;
    const originalLabel = submitLabel.textContent;
    const submittedMode = currentMode;
    submitButton.disabled = true;
    submitLabel.textContent = currentMode === "login"
        ? "Входим..."
        : currentMode === "forgot"
            ? "Отправляем..."
            : currentMode === "reset"
                ? "Сохраняем..."
                : "Создаём аккаунт...";

    try {
        const endpoint = currentMode === "login"
            ? "/api/auth/login"
            : currentMode === "forgot"
                ? "/api/auth/password-reset/request"
                : currentMode === "reset"
                    ? "/api/auth/password-reset/confirm"
                    : "/api/auth/register";
        const body = currentMode === "login" || currentMode === "forgot"
            ? { email: emailInput.value.trim(), ...(currentMode === "login" ? { password: passwordInput.value } : {}) }
            : currentMode === "reset"
                ? { token: resetToken, password: passwordInput.value }
                : {
                    nickname: nicknameInput.value.trim(),
                    email: emailInput.value.trim(),
                    password: passwordInput.value
                };
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(body)
        });
        const result = await response.json();
        if (!response.ok) {
            showMessage(result.error || "Не удалось выполнить запрос.", "error");
            return;
        }

        if (currentMode === "forgot") {
            showMessage(result.message);
            return;
        }
        if (currentMode === "reset") {
            setMode("login");
            showMessage(result.message);
            return;
        }

        sessionStorage.setItem("sdonate-demo-nickname", result.user.nickname);
        sessionStorage.setItem("sdonate-demo-email", result.user.email);
        sessionStorage.setItem("sdonate-demo-user-id", result.user.id);
        sessionStorage.setItem("sdonate-demo-authenticated", "true");
        window.location.assign("./dashboard.html");
    } catch (error) {
        console.error("Не удалось выполнить запрос авторизации:", error);
        showMessage("Не удалось связаться с сервером. Попробуй ещё раз.", "error");
    } finally {
        submitButton.disabled = false;
        if (currentMode === submittedMode) {
            submitLabel.textContent = originalLabel;
        }
    }
});

const initialMode = new URLSearchParams(window.location.search).get("mode");
setMode(initialMode, false);
if (currentMode === "reset" && !/^[A-Za-z0-9_-]{43}$/.test(resetToken)) {
    showMessage("Ссылка для сброса пароля недействительна или устарела.", "error");
}
