(() => {
    if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
        window.location.replace("./reg.html?mode=login");
        return;
    }

    const permissionSections = [
        { id: "shop", label: "Магазин", title: "Магазин", description: "Основные права доступа", items: [
            ["viewProfit", "Просмотр статистики общей прибыли"],
            ["viewPurchases", "Просмотр статистики общей покупок"],
            ["viewAverage", "Просмотр статистики среднего чека"],
            ["viewHistory", "Просмотр истории последних покупок"],
            ["editSettings", "Редактирование настроек"],
            ["viewSecret", "Просмотр секретного ключа"]
        ] },
        { id: "servers", label: "Серверы", title: "Серверы", description: "Права доступа управления серверами магазина", crud: true },
        { id: "products", label: "Товары", title: "Товары", description: "Права доступа управления товарами магазина", crud: true },
        { id: "coupons", label: "Купоны", title: "Купоны", description: "Права доступа управления купонами магазина", crud: true },
        { id: "partners", label: "Партнёры", title: "Партнёры", description: "Права доступа управления партнёрами магазина", crud: true },
        { id: "discounts", label: "Массовые скидки", title: "Массовые скидки", description: "Права доступа управления массовыми скидками магазина", crud: true },
        { id: "collections", label: "Подборки", title: "Подборки", description: "Права доступа управления подборками магазина", crud: true },
        { id: "pages", label: "Страницы", title: "Страницы", description: "Права доступа управления страницами магазина", crud: true },
        { id: "categories", label: "Категории", title: "Категории", description: "Права доступа управления категориями магазина", crud: true },
        { id: "analytics", label: "Аналитика", title: "Аналитика", description: "Права доступа к аналитике магазина", items: [
            ["view", "Просмотр"]
        ] }
    ];
    const crudItems = [["view", "Просмотр"], ["add", "Добавление"], ["edit", "Редактирование"], ["delete", "Удаление"]];
    permissionSections.forEach(section => {
        if (section.crud) {
            section.items = crudItems;
        }
    });

    const params = new URLSearchParams(window.location.search);
    const shopId = params.get("id");
    const storageKey = window.sdonateShopStorage.storageKey();
    const form = document.querySelector("#partner-form");
    const feedback = document.querySelector("#partner-feedback");
    const list = document.querySelector("#partners-list");
    const empty = document.querySelector("#partners-empty");
    const count = document.querySelector("#partners-count");
    const toast = document.querySelector("#partners-toast");
    const deleteDialog = document.querySelector("#partner-delete-dialog");
    const tabs = document.querySelector("#permission-tabs");
    const panel = document.querySelector("#permission-panel");
    const splitServers = document.querySelector("#split-servers");
    const serversBox = document.querySelector("#partner-servers");
    const serversList = document.querySelector("#partner-servers-list");
    const serversEmpty = document.querySelector("#partner-servers-empty");
    let shop;
    let editingId = null;
    let deletingId = null;
    let activeSection = permissionSections[0].id;
    let permissions = {};
    let toastTimer;

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

    function getServers() {
        return Array.isArray(shop.servers)
            ? shop.servers.filter(server => server && typeof server.id === "string" && typeof server.name === "string")
            : [];
    }

    function getPartners() {
        const records = shop.tools && Array.isArray(shop.tools.partners) ? shop.tools.partners : [];
        return records.filter(item => item && typeof item === "object").map(item => {
            const position = String(item.position || item.name || "Партнёр");
            const share = Number(item.sharePercent);
            return {
                ...item,
                id: typeof item.id === "string" && item.id ? item.id : createId(),
                name: position,
                position,
                email: String(item.email || ""),
                detail: String(item.email || item.detail || ""),
                sharePercent: Number.isFinite(share) ? share : 0,
                splitServers: item.splitServers === true,
                serverIds: Array.isArray(item.serverIds) ? item.serverIds.filter(id => typeof id === "string") : [],
                permissions: item.permissions && typeof item.permissions === "object" ? item.permissions : {}
            };
        });
    }

    function renderTabs() {
        tabs.replaceChildren(...permissionSections.map(section => {
            const tab = document.createElement("button");
            tab.type = "button";
            tab.className = "partner-tab";
            tab.role = "tab";
            tab.dataset.section = section.id;
            tab.textContent = section.label;
            tab.setAttribute("aria-selected", String(section.id === activeSection));
            return tab;
        }));
    }

    function renderPanel() {
        const section = permissionSections.find(item => item.id === activeSection);
        const title = document.createElement("h3");
        title.textContent = section.title;
        const description = document.createElement("p");
        description.textContent = section.description;
        const rows = section.items.map(([key, label]) => {
            const row = document.createElement("label");
            row.className = "partner-switch-row";
            const input = document.createElement("input");
            input.type = "checkbox";
            input.className = "partner-switch";
            input.dataset.section = section.id;
            input.dataset.key = key;
            input.checked = Boolean(permissions[section.id] && permissions[section.id][key]);
            const text = document.createElement("span");
            text.textContent = label;
            row.append(input, text);
            return row;
        });
        panel.replaceChildren(title, description, ...rows);
    }

    function renderServerChoices(selected = []) {
        const servers = getServers();
        serversList.replaceChildren(...servers.map(server => {
            const label = document.createElement("label");
            const input = document.createElement("input");
            input.type = "checkbox";
            input.value = server.id;
            input.checked = selected.includes(server.id);
            const text = document.createElement("span");
            text.textContent = server.name;
            label.append(input, text);
            return label;
        }));
        serversEmpty.hidden = servers.length > 0;
    }

    function permissionCount(partner) {
        return Object.values(partner.permissions).reduce((total, group) =>
            total + (group && typeof group === "object" ? Object.values(group).filter(Boolean).length : 0), 0);
    }

    function plural(number, one, few, many) {
        const mod10 = number % 10;
        const mod100 = number % 100;
        if (mod10 === 1 && mod100 !== 11) {
            return one;
        }
        return mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many;
    }

    function renderPartners() {
        const partners = getPartners();
        list.replaceChildren(...partners.map(partner => {
            const card = document.createElement("article");
            card.className = "pages-card";
            const copy = document.createElement("div");
            copy.className = "pages-card-copy";
            const title = document.createElement("h3");
            title.textContent = partner.position;
            const email = document.createElement("p");
            email.textContent = partner.email || partner.detail || "Без email";
            const meta = document.createElement("div");
            meta.className = "partner-card-meta";
            const parts = [`Доля ${partner.sharePercent}%`, `Прав: ${permissionCount(partner)}`];
            if (partner.splitServers) {
                parts.push(`Серверов: ${partner.serverIds.length}`);
            }
            meta.append(...parts.map(text => {
                const chip = document.createElement("span");
                chip.textContent = text;
                return chip;
            }));
            copy.append(title, email, meta);
            const actions = document.createElement("div");
            actions.className = "pages-card-actions";
            const edit = document.createElement("button");
            edit.className = "pages-icon-button";
            edit.type = "button";
            edit.dataset.action = "edit";
            edit.dataset.id = partner.id;
            edit.setAttribute("aria-label", `Изменить ${partner.position}`);
            edit.textContent = "✎";
            const remove = document.createElement("button");
            remove.className = "pages-icon-button danger";
            remove.type = "button";
            remove.dataset.action = "delete";
            remove.dataset.id = partner.id;
            remove.setAttribute("aria-label", `Удалить ${partner.position}`);
            remove.textContent = "×";
            actions.append(edit, remove);
            card.append(copy, actions);
            return card;
        }));
        empty.hidden = partners.length > 0;
        count.textContent = `${partners.length} ${plural(partners.length, "партнёр", "партнёра", "партнёров")}`;
    }

    function showFeedback(message, field) {
        feedback.textContent = message;
        feedback.hidden = false;
        if (field) {
            field.focus();
        }
    }

    function resetForm() {
        form.reset();
        editingId = null;
        permissions = {};
        activeSection = permissionSections[0].id;
        feedback.hidden = true;
        serversBox.hidden = true;
        document.querySelector("#partner-form-title").textContent = "Добавление партнёра";
        document.querySelector("#partner-save-label").textContent = "Добавить";
        document.querySelector("#cancel-edit").hidden = true;
        renderServerChoices();
        renderTabs();
        renderPanel();
    }

    function editPartner(partner) {
        editingId = partner.id;
        form.elements.position.value = partner.position;
        form.elements.share.value = partner.sharePercent;
        form.elements.email.value = partner.email;
        splitServers.checked = partner.splitServers;
        serversBox.hidden = !partner.splitServers;
        renderServerChoices(partner.serverIds);
        permissions = JSON.parse(JSON.stringify(partner.permissions));
        activeSection = permissionSections[0].id;
        feedback.hidden = true;
        document.querySelector("#partner-form-title").textContent = "Редактирование партнёра";
        document.querySelector("#partner-save-label").textContent = "Сохранить изменения";
        document.querySelector("#cancel-edit").hidden = false;
        renderTabs();
        renderPanel();
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        form.elements.position.focus({ preventScroll: true });
    }

    tabs.addEventListener("click", event => {
        const tab = event.target.closest("button[data-section]");
        if (!tab) {
            return;
        }
        activeSection = tab.dataset.section;
        renderTabs();
        renderPanel();
    });

    panel.addEventListener("change", event => {
        const input = event.target.closest("input[data-section]");
        if (!input) {
            return;
        }
        permissions[input.dataset.section] = permissions[input.dataset.section] || {};
        permissions[input.dataset.section][input.dataset.key] = input.checked;
    });

    splitServers.addEventListener("change", () => {
        serversBox.hidden = !splitServers.checked;
    });

    form.addEventListener("submit", event => {
        event.preventDefault();
        feedback.hidden = true;
        const position = form.elements.position.value.trim();
        const email = form.elements.email.value.trim().toLowerCase();
        const shareText = form.elements.share.value.trim();
        const share = Number(shareText);
        if (!position) {
            showFeedback("Укажите должность партнёра.", form.elements.position);
            return;
        }
        if (shareText === "" || !Number.isFinite(share) || share < 0 || share > 100) {
            showFeedback("Доля партнёра должна быть от 0 до 100%.", form.elements.share);
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFeedback("Укажите корректный email партнёра.", form.elements.email);
            return;
        }
        if (email === String(shop.ownerEmail || "").toLowerCase()) {
            showFeedback("Нельзя добавить владельца магазина как партнёра.", form.elements.email);
            return;
        }
        const partners = getPartners();
        const others = partners.filter(item => item.id !== editingId);
        if (others.some(item => item.email.toLowerCase() === email)) {
            showFeedback("Партнёр с таким email уже добавлен.", form.elements.email);
            return;
        }
        const totalShare = others.reduce((total, item) => total + item.sharePercent, 0) + share;
        if (totalShare > 100.0001) {
            showFeedback(`Сумма долей партнёров не может быть больше 100% (получится ${Math.round(totalShare * 100) / 100}%).`, form.elements.share);
            return;
        }
        const serverIds = splitServers.checked
            ? [...serversList.querySelectorAll("input:checked")].map(input => input.value)
            : [];
        if (splitServers.checked && !serverIds.length) {
            showFeedback("Выберите хотя бы один сервер или выключите раздел прибыли по серверам.");
            return;
        }

        const existing = partners.find(item => item.id === editingId);
        const partner = {
            ...(existing || {}),
            id: editingId || createId(),
            name: position,
            detail: email,
            position,
            email,
            sharePercent: share,
            splitServers: splitServers.checked,
            serverIds,
            permissions: JSON.parse(JSON.stringify(permissions)),
            createdAt: existing && existing.createdAt ? existing.createdAt : new Date().toISOString()
        };
        const wasEditing = Boolean(editingId);
        try {
            shop.tools.partners = wasEditing
                ? partners.map(item => item.id === editingId ? partner : item)
                : [...partners, partner];
            saveShop();
            resetForm();
            renderPartners();
            showToast(wasEditing ? "Партнёр обновлён." : "Партнёр добавлен.");
        } catch (error) {
            showFeedback(`Не удалось сохранить партнёра: ${error.message}`);
        }
    });

    list.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }
        const partner = getPartners().find(item => item.id === button.dataset.id);
        if (!partner) {
            showToast("Партнёр не найден. Обновите страницу.");
            return;
        }
        if (button.dataset.action === "edit") {
            editPartner(partner);
        } else {
            deletingId = partner.id;
            document.querySelector("#partner-delete-title").textContent = `${partner.position} (${partner.email || "без email"})`;
            deleteDialog.showModal();
        }
    });

    document.querySelector("#cancel-edit").addEventListener("click", resetForm);
    document.querySelector("#reset-partner-form").addEventListener("click", resetForm);
    document.querySelector("#cancel-partner-delete").addEventListener("click", () => {
        deletingId = null;
        deleteDialog.close();
    });
    document.querySelector("#confirm-partner-delete").addEventListener("click", () => {
        try {
            shop.tools.partners = getPartners().filter(item => item.id !== deletingId);
            saveShop();
            if (editingId === deletingId) {
                resetForm();
            }
            renderPartners();
            deleteDialog.close();
            showToast("Партнёр удалён.");
        } catch (error) {
            showToast(`Не удалось удалить партнёра: ${error.message}`);
        } finally {
            deletingId = null;
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
        document.querySelector("#account-name").textContent = sessionStorage.getItem("sdonate-demo-nickname") || "Игрок";
        document.title = `Партнёры — ${shop.name} — SDonate`;
        document.querySelector("#partners-shop-caption").textContent = `Партнёры магазина «${shop.name}» и их права доступа.`;
        document.querySelector("#back-to-shop").href = `./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`;
        resetForm();
        renderPartners();
    } catch (error) {
        showToast(`Не удалось открыть раздел: ${error.message}`);
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    }
})();
