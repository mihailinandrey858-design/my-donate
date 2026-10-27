(() => {
    if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
        window.location.replace("./reg.html?mode=login");
        return;
    }

    const shopId = new URLSearchParams(window.location.search).get("id");
    const storageKey = window.sdonateShopStorage.storageKey();
    const form = document.querySelector("#discount-form");
    const panel = document.querySelector("#discount-panel");
    const productsBox = document.querySelector("#discount-products");
    const list = document.querySelector("#discounts-list");
    const empty = document.querySelector("#discounts-empty");
    const feedback = document.querySelector("#discount-feedback");
    const toast = document.querySelector("#discounts-toast");
    const deleteDialog = document.querySelector("#discount-delete-dialog");
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "Игрок";
    let shop;
    let editingId = null;
    let deletingId = null;
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
        if (!Array.isArray(parsed)) {
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

    function getProducts() {
        return Array.isArray(shop.products) ? shop.products.filter(product => product && typeof product.id === "string") : [];
    }

    function getDiscounts() {
        const records = shop.tools && Array.isArray(shop.tools.discounts) ? shop.tools.discounts : [];
        return records.filter(record => record && typeof record.name === "string").map(record => ({
            id: typeof record.id === "string" ? record.id : createId(),
            name: record.name,
            percent: Number(record.percent) || 0,
            startAt: typeof record.startAt === "string" ? record.startAt : "",
            endAt: typeof record.endAt === "string" ? record.endAt : "",
            productIds: Array.isArray(record.productIds) ? record.productIds.filter(id => typeof id === "string") : []
        }));
    }

    function formatDate(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        return match ? `${match[3]}.${match[2]}.${match[1].slice(2)}` : "";
    }

    function formatPrice(price) {
        return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(price) || 0)} ₽`;
    }

    function renderProductPicker(selectedIds = []) {
        productsBox.replaceChildren();
        const products = getProducts();
        if (products.length === 0) {
            const note = document.createElement("p");
            note.className = "collection-products-empty";
            note.textContent = "В магазине пока нет товаров.";
            productsBox.append(note);
            return;
        }
        products.forEach(product => {
            const label = document.createElement("label");
            label.className = "collection-product";
            const input = document.createElement("input");
            input.type = "checkbox";
            input.name = "products";
            input.value = product.id;
            input.checked = selectedIds.includes(product.id);
            let icon;
            if (typeof product.image === "string" && product.image.startsWith("data:image/")) {
                icon = document.createElement("img");
                icon.src = product.image;
                icon.alt = "";
            } else {
                icon = document.createElement("span");
                icon.className = "collection-product-icon";
            }
            const copy = document.createElement("span");
            copy.className = "collection-product-copy";
            const name = document.createElement("b");
            name.textContent = product.name;
            const price = document.createElement("small");
            price.textContent = formatPrice(product.price);
            copy.append(name, price);
            label.append(input, icon, copy);
            productsBox.append(label);
        });
    }

    function renderDiscounts() {
        const discounts = getDiscounts();
        list.replaceChildren();
        discounts.forEach(discount => {
            const card = document.createElement("article");
            card.className = "discount-card";
            const title = document.createElement("h3");
            title.textContent = discount.name;
            const meta = document.createElement("div");
            meta.className = "discount-card-meta";
            const parts = [["percent", `Скидка: ${discount.percent}%`]];
            if (discount.startAt) parts.push(["state", `Начинается ${formatDate(discount.startAt)}`]);
            if (discount.endAt) parts.push(["state", `Заканчивается ${formatDate(discount.endAt)}`]);
            parts.push(["state", discount.productIds.length ? `Товаров: ${discount.productIds.length}` : "Все товары"]);
            parts.forEach(([className, text], index) => {
                if (index > 0) meta.append(document.createTextNode("•"));
                const span = document.createElement("span");
                span.className = className;
                span.textContent = text;
                meta.append(span);
            });
            const actions = document.createElement("div");
            actions.className = "discount-card-actions";
            [["delete", "🗑", "Удалить"], ["edit", "⚙", "Изменить"]].forEach(([action, symbol, label]) => {
                const button = document.createElement("button");
                button.type = "button";
                button.dataset.action = action;
                button.dataset.id = discount.id;
                button.setAttribute("aria-label", `${label} ${discount.name}`);
                button.textContent = symbol;
                actions.append(button);
            });
            card.append(title, meta, actions);
            list.append(card);
        });
        empty.hidden = discounts.length > 0;
    }

    function openForm(discount) {
        form.reset();
        feedback.hidden = true;
        editingId = discount ? discount.id : null;
        form.elements.name.value = discount ? discount.name : "";
        form.elements.percent.value = discount ? String(discount.percent) : "10";
        form.elements.startAt.value = discount ? discount.startAt : "";
        form.elements.endAt.value = discount ? discount.endAt : "";
        renderProductPicker(discount ? discount.productIds : []);
        document.querySelector("#discount-form-title").textContent = discount ? "Редактирование массовой скидки" : "Добавление массовой скидки";
        document.querySelector("#discount-save-label").textContent = discount ? "Сохранить изменения" : "Добавить";
        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
        form.elements.name.focus({ preventScroll: true });
    }

    function closeForm() {
        editingId = null;
        panel.hidden = true;
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        feedback.hidden = true;
        const name = form.elements.name.value.trim();
        const percent = Number(form.elements.percent.value);
        const startAt = form.elements.startAt.value;
        const endAt = form.elements.endAt.value;
        if (!name) {
            showFeedback("Укажите название скидки.");
            return;
        }
        if (!Number.isFinite(percent) || percent < 1 || percent > 99) {
            showFeedback("Процент скидки — от 1 до 99.");
            return;
        }
        if (startAt && endAt && endAt < startAt) {
            showFeedback("Окончание не может быть раньше начала.");
            return;
        }
        const productIds = Array.from(form.querySelectorAll('input[name="products"]:checked'), input => input.value);
        const discount = { id: editingId || createId(), name, percent: Math.round(percent), startAt, endAt, productIds };
        const discounts = getDiscounts();
        const wasEditing = Boolean(editingId);
        const previous = shop.tools.discounts;
        try {
            shop.tools.discounts = wasEditing
                ? discounts.map(item => item.id === editingId ? discount : item)
                : [...discounts, discount];
            saveShop();
            closeForm();
            renderDiscounts();
            showToast(wasEditing ? "Скидка обновлена." : "Скидка добавлена.");
        } catch (error) {
            shop.tools.discounts = previous;
            showFeedback(`Не удалось сохранить скидку: ${error.message}`);
        }
    });

    list.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }
        const discount = getDiscounts().find(item => item.id === button.dataset.id);
        if (!discount) {
            showToast("Скидка не найдена. Обновите страницу.");
            return;
        }
        if (button.dataset.action === "edit") {
            openForm(discount);
        } else {
            deletingId = discount.id;
            document.querySelector("#discount-delete-title").textContent = discount.name;
            deleteDialog.showModal();
        }
    });

    document.querySelector("#open-discount-form").addEventListener("click", () => openForm(null));
    document.querySelector("#close-discount-form").addEventListener("click", closeForm);
    document.querySelector("#cancel-discount-delete").addEventListener("click", () => {
        deletingId = null;
        deleteDialog.close();
    });
    document.querySelector("#confirm-discount-delete").addEventListener("click", () => {
        const previous = shop.tools.discounts;
        try {
            shop.tools.discounts = getDiscounts().filter(item => item.id !== deletingId);
            saveShop();
            if (editingId === deletingId) {
                closeForm();
            }
            renderDiscounts();
            deleteDialog.close();
            showToast("Скидка удалена.");
        } catch (error) {
            shop.tools.discounts = previous;
            showToast(`Не удалось удалить скидку: ${error.message}`);
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
        document.title = `Массовые скидки — ${shop.name} — SDonate`;
        document.querySelector("#discounts-shop-name").textContent = shop.name;
        document.querySelector("#back-to-shop").href = `./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`;
        renderDiscounts();
    } catch (error) {
        showToast(`Не удалось открыть скидки: ${error.message}`);
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    }
})();
