(() => {
    if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
        window.location.replace("./reg.html?mode=login");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const shopId = params.get("id");
    const storageKey = window.sdonateShopStorage.storageKey();
    const presets = {
        helper: {
            label: "Хелпер",
            title: "Заявка на хелпера",
            description: "Помогайте игрокам и следите за порядком на сервере.",
            buttonText: "Подать заявку",
            questions: ["Ваш игровой ник", "Возраст", "Ваш Discord / Telegram", "Есть ли опыт работы хелпером?", "Почему вы хотите стать хелпером?"]
        },
        moderator: {
            label: "Модератор",
            title: "Заявка на модератора",
            description: "Следите за соблюдением правил и решайте споры игроков.",
            buttonText: "Подать заявку",
            questions: ["Ваш игровой ник", "Возраст", "Ваш Discord / Telegram", "Опыт модерации на других проектах", "Сколько часов в день вы можете уделять серверу?"]
        },
        tiktok: {
            label: "TikTok медиа",
            title: "Заявка для TikTok-блогеров",
            description: "Снимаете видео по нашему серверу? Оставьте заявку на сотрудничество.",
            buttonText: "Отправить заявку",
            questions: ["Ваш игровой ник", "Ссылка на TikTok-аккаунт", "Количество подписчиков", "Средние просмотры видео", "Контакт для связи"]
        },
        youtube: {
            label: "YouTube медиа",
            title: "Заявка для ютуберов",
            description: "Делаете ролики по Minecraft? Расскажите о своём канале.",
            buttonText: "Отправить заявку",
            questions: ["Ваш игровой ник", "Ссылка на YouTube-канал", "Количество подписчиков", "Средние просмотры видео", "Контакт для связи"]
        },
        other: {
            label: "Другое",
            title: "Новая форма",
            description: "",
            buttonText: "Отправить",
            questions: ["Ваш игровой ник", "Контакт для связи"]
        }
    };
    const form = document.querySelector("#form-builder");
    const typeSelect = document.querySelector("#form-type");
    const questionsBox = document.querySelector("#forms-questions");
    const feedback = document.querySelector("#builder-feedback");
    const formsList = document.querySelector("#forms-list");
    const formsEmpty = document.querySelector("#forms-empty");
    const submissionsList = document.querySelector("#submissions-list");
    const submissionsEmpty = document.querySelector("#submissions-empty");
    const toast = document.querySelector("#forms-toast");
    const deleteDialog = document.querySelector("#form-delete-dialog");
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "Игрок";
    let shop;
    let editingId = null;
    let pendingDelete = null;
    let toastTimer;

    document.querySelector("#account-name").textContent = nickname;
    document.querySelector("#account-avatar").textContent = Array.from(nickname)[0].toUpperCase();

    function createId() {
        return window.crypto && typeof window.crypto.randomUUID === "function"
            ? window.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function readShops() {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
            throw new Error("Список магазинов не найден.");
        }
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item.id !== "string" || typeof item.name !== "string")) {
            throw new Error("Список магазинов имеет неверный формат.");
        }
        return parsed;
    }

    function saveShop() {
        const shops = readShops();
        const index = shops.findIndex(item => item.id === shopId);
        if (index < 0) {
            throw new Error("Магазин не найден.");
        }
        shops[index] = shop;
        window.sdonateShopStorage.save(shops);
    }

    function showToast(message) {
        window.clearTimeout(toastTimer);
        toast.textContent = message;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 3200);
    }

    function showFeedback(message) {
        feedback.textContent = message;
        feedback.hidden = false;
    }

    function pluralize(count, one, few, many) {
        const tens = count % 100;
        const units = count % 10;
        if (tens >= 11 && tens <= 14) {
            return many;
        }
        return units === 1 ? one : units >= 2 && units <= 4 ? few : many;
    }

    function getForms() {
        const records = Array.isArray(shop.tools.forms) ? shop.tools.forms : [];
        return records.filter(item => item && typeof item.id === "string" && typeof item.title === "string");
    }

    function getSubmissions() {
        const records = Array.isArray(shop.tools.formSubmissions) ? shop.tools.formSubmissions : [];
        return records.filter(item => item && typeof item.id === "string" && Array.isArray(item.answers));
    }

    function addQuestion(label = "", required = true) {
        const row = document.createElement("div");
        row.className = "forms-question";
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 120;
        input.placeholder = "Текст вопроса";
        input.value = label;
        input.setAttribute("aria-label", "Текст вопроса");
        const requiredLabel = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = required;
        requiredLabel.append(checkbox, "Обязательный");
        const remove = document.createElement("button");
        remove.className = "pages-icon-button danger";
        remove.type = "button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Удалить вопрос");
        remove.addEventListener("click", () => row.remove());
        row.append(input, requiredLabel, remove);
        questionsBox.append(row);
    }

    function applyPreset(type) {
        const preset = presets[type] || presets.other;
        form.elements.title.value = preset.title;
        form.elements.description.value = preset.description;
        form.elements.buttonText.value = preset.buttonText;
        questionsBox.replaceChildren();
        preset.questions.forEach(question => addQuestion(question));
    }

    function resetForm() {
        form.reset();
        editingId = null;
        feedback.hidden = true;
        typeSelect.value = "helper";
        form.elements.enabled.checked = true;
        applyPreset("helper");
        document.querySelector("#builder-title").textContent = "Создание формы";
        document.querySelector("#builder-save-label").textContent = "Создать форму";
        document.querySelector("#cancel-edit").hidden = true;
    }

    function editForm(item) {
        resetForm();
        editingId = item.id;
        typeSelect.value = presets[item.type] ? item.type : "other";
        form.elements.title.value = item.title;
        form.elements.description.value = item.description || "";
        form.elements.buttonText.value = item.buttonText || "Отправить";
        form.elements.enabled.checked = item.enabled !== false;
        questionsBox.replaceChildren();
        (Array.isArray(item.questions) ? item.questions : []).forEach(question => addQuestion(question.label, question.required !== false));
        document.querySelector("#builder-title").textContent = "Редактирование формы";
        document.querySelector("#builder-save-label").textContent = "Сохранить изменения";
        document.querySelector("#cancel-edit").hidden = false;
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        form.elements.title.focus({ preventScroll: true });
    }

    function renderForms() {
        const forms = getForms();
        formsList.replaceChildren();
        forms.forEach(item => {
            const card = document.createElement("article");
            card.className = "pages-card";
            const copy = document.createElement("div");
            copy.className = "pages-card-copy";
            const title = document.createElement("h3");
            title.textContent = item.title;
            const description = document.createElement("p");
            const questionCount = Array.isArray(item.questions) ? item.questions.length : 0;
            description.textContent = `${(presets[item.type] || presets.other).label} · ${questionCount} ${pluralize(questionCount, "вопрос", "вопроса", "вопросов")}`;
            const state = document.createElement("span");
            state.className = "pages-card-address";
            state.textContent = item.enabled === false ? "Скрыта на витрине" : `Кнопка: ${item.buttonText || "Отправить"}`;
            copy.append(title, description, state);
            const actions = document.createElement("div");
            actions.className = "pages-card-actions";
            const edit = document.createElement("button");
            edit.className = "pages-icon-button";
            edit.type = "button";
            edit.dataset.action = "edit";
            edit.dataset.id = item.id;
            edit.setAttribute("aria-label", `Изменить ${item.title}`);
            edit.textContent = "✎";
            const remove = document.createElement("button");
            remove.className = "pages-icon-button danger";
            remove.type = "button";
            remove.dataset.action = "delete";
            remove.dataset.id = item.id;
            remove.setAttribute("aria-label", `Удалить ${item.title}`);
            remove.textContent = "×";
            actions.append(edit, remove);
            card.append(copy, actions);
            formsList.append(card);
        });
        formsEmpty.hidden = forms.length > 0;
        document.querySelector("#forms-count").textContent = `${forms.length} ${pluralize(forms.length, "форма", "формы", "форм")}`;
    }

    function renderSubmissions() {
        const submissions = getSubmissions().slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        submissionsList.replaceChildren();
        submissions.forEach(item => {
            const card = document.createElement("article");
            card.className = "forms-submission";
            const head = document.createElement("header");
            const title = document.createElement("b");
            title.textContent = item.formTitle || "Заявка";
            const date = document.createElement("small");
            const created = new Date(item.createdAt);
            date.textContent = Number.isNaN(created.getTime()) ? "" : created.toLocaleString("ru-RU");
            const remove = document.createElement("button");
            remove.className = "pages-icon-button danger";
            remove.type = "button";
            remove.dataset.action = "delete-submission";
            remove.dataset.id = item.id;
            remove.setAttribute("aria-label", "Удалить заявку");
            remove.textContent = "×";
            head.append(title, date, remove);
            const list = document.createElement("dl");
            item.answers.forEach(answer => {
                const term = document.createElement("dt");
                term.textContent = String(answer.label || "");
                const value = document.createElement("dd");
                value.textContent = String(answer.value || "—");
                list.append(term, value);
            });
            card.append(head, list);
            submissionsList.append(card);
        });
        submissionsEmpty.hidden = submissions.length > 0;
        document.querySelector("#submissions-count").textContent = `${submissions.length} ${pluralize(submissions.length, "заявка", "заявки", "заявок")}`;
    }

    typeSelect.addEventListener("change", () => {
        if (!editingId) {
            applyPreset(typeSelect.value);
        }
    });
    document.querySelector("#add-question").addEventListener("click", () => {
        if (questionsBox.children.length >= 20) {
            showFeedback("В форме не может быть больше 20 вопросов.");
            return;
        }
        addQuestion();
        questionsBox.lastElementChild.querySelector("input").focus();
    });

    form.addEventListener("submit", event => {
        event.preventDefault();
        feedback.hidden = true;
        const title = form.elements.title.value.trim();
        const buttonText = form.elements.buttonText.value.trim();
        if (!title || !buttonText) {
            showFeedback("Укажите название формы и текст кнопки.");
            return;
        }
        const questions = Array.from(questionsBox.children, row => ({
            id: row.dataset.id || createId(),
            label: row.querySelector('input[type="text"]').value.trim(),
            required: row.querySelector('input[type="checkbox"]').checked
        })).filter(question => question.label);
        if (questions.length === 0) {
            showFeedback("Добавьте хотя бы один вопрос.");
            return;
        }
        const forms = getForms();
        const item = {
            id: editingId || createId(),
            type: typeSelect.value,
            title,
            description: form.elements.description.value.trim(),
            buttonText,
            enabled: form.elements.enabled.checked,
            questions
        };
        const wasEditing = Boolean(editingId);
        const previous = shop.tools.forms;
        try {
            shop.tools.forms = wasEditing ? forms.map(entry => entry.id === editingId ? item : entry) : [...forms, item];
            saveShop();
            resetForm();
            renderForms();
            showToast(wasEditing ? "Форма обновлена." : "Форма создана.");
        } catch (error) {
            shop.tools.forms = previous;
            showFeedback(`Не удалось сохранить форму: ${error.message}`);
        }
    });

    formsList.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        const item = button && getForms().find(entry => entry.id === button.dataset.id);
        if (!item) {
            return;
        }
        if (button.dataset.action === "edit") {
            editForm(item);
        } else {
            pendingDelete = { kind: "form", id: item.id };
            document.querySelector("#form-delete-title").textContent = `Форма «${item.title}»`;
            deleteDialog.showModal();
        }
    });
    submissionsList.addEventListener("click", event => {
        const button = event.target.closest('button[data-action="delete-submission"]');
        if (!button) {
            return;
        }
        pendingDelete = { kind: "submission", id: button.dataset.id };
        document.querySelector("#form-delete-title").textContent = "Заявка";
        deleteDialog.showModal();
    });

    document.querySelector("#cancel-edit").addEventListener("click", resetForm);
    document.querySelector("#reset-builder").addEventListener("click", resetForm);
    document.querySelector("#cancel-form-delete").addEventListener("click", () => {
        pendingDelete = null;
        deleteDialog.close();
    });
    document.querySelector("#confirm-form-delete").addEventListener("click", () => {
        if (!pendingDelete) {
            return;
        }
        const { kind, id } = pendingDelete;
        const previousForms = shop.tools.forms;
        const previousSubmissions = shop.tools.formSubmissions;
        try {
            if (kind === "form") {
                shop.tools.forms = getForms().filter(item => item.id !== id);
                if (editingId === id) {
                    resetForm();
                }
            } else {
                shop.tools.formSubmissions = getSubmissions().filter(item => item.id !== id);
            }
            saveShop();
            renderForms();
            renderSubmissions();
            deleteDialog.close();
            showToast("Удалено.");
        } catch (error) {
            shop.tools.forms = previousForms;
            shop.tools.formSubmissions = previousSubmissions;
            showToast(`Не удалось удалить: ${error.message}`);
        } finally {
            pendingDelete = null;
        }
    });

    document.querySelector("#logout-button").addEventListener("click", () => {
        sessionStorage.removeItem("sdonate-demo-authenticated");
        window.location.assign("./reg.html?mode=login");
    });

    try {
        shop = readShops().find(item => item.id === shopId);
        if (!shop) {
            throw new Error("Магазин не найден.");
        }
        shop.tools = shop.tools && typeof shop.tools === "object" ? shop.tools : {};
        Object.entries(presets).forEach(([value, preset]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = preset.label;
            typeSelect.append(option);
        });
        document.title = `Формы — ${shop.name} — SDonate`;
        document.querySelector("#forms-shop-caption").textContent = `Формы заявок для магазина «${shop.name}».`;
        document.querySelector("#back-to-shop").href = `./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`;
        resetForm();
        renderForms();
        renderSubmissions();
    } catch (error) {
        showToast(`Не удалось открыть формы: ${error.message}`);
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    }
})();
