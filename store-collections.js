(() => {
    if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
        window.location.replace("./reg.html?mode=login");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const shopId = params.get("id");
    const storageKey = window.sdonateShopStorage.storageKey();
    const form = document.querySelector("#collection-form");
    const serverSelect = document.querySelector("#collection-server");
    const productsBox = document.querySelector("#collection-products");
    const list = document.querySelector("#collections-list");
    const empty = document.querySelector("#collections-empty");
    const feedback = document.querySelector("#collection-feedback");
    const toast = document.querySelector("#collections-toast");
    const deleteDialog = document.querySelector("#collection-delete-dialog");
    const imageInput = document.querySelector("#collection-image-input");
    const imagePreview = document.querySelector("#collection-image-preview");
    const imagePlaceholder = document.querySelector("#collection-image-placeholder");
    const imageRemove = document.querySelector("#collection-image-remove");
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "Игрок";
    let shop;
    let editingId = null;
    let deletingId = null;
    let currentImage = "";
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

    function getProducts() {
        return Array.isArray(shop.products) ? shop.products.filter(product => product && typeof product.id === "string") : [];
    }

    function getServers() {
        if (!Array.isArray(shop.servers)) {
            return [];
        }
        const names = shop.servers
            .map(server => typeof server === "string" ? server : server && server.name)
            .filter(name => typeof name === "string" && name.trim());
        return [...new Set(names)];
    }

    // Записи из старого простого инструмента (name/detail) тоже читаются.
    function getCollections() {
        const records = shop.tools && Array.isArray(shop.tools.collections) ? shop.tools.collections : [];
        return records.filter(record => record && typeof record.name === "string").map(record => ({
            id: typeof record.id === "string" ? record.id : createId(),
            name: record.name,
            server: typeof record.server === "string" ? record.server : "",
            image: typeof record.image === "string" ? record.image : "",
            productIds: Array.isArray(record.productIds) ? record.productIds.filter(id => typeof id === "string") : []
        }));
    }

    function formatPrice(price) {
        return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(price) || 0)} ₽`;
    }

    function pluralize(count, one, few, many) {
        const tens = count % 100;
        const units = count % 10;
        if (tens >= 11 && tens <= 14) {
            return many;
        }
        return units === 1 ? one : units >= 2 && units <= 4 ? few : many;
    }

    function renderServers(selected = "") {
        serverSelect.replaceChildren();
        const all = document.createElement("option");
        all.value = "";
        all.textContent = "Все серверы";
        serverSelect.append(all);
        getServers().forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            serverSelect.append(option);
        });
        serverSelect.value = Array.from(serverSelect.options).some(option => option.value === selected) ? selected : "";
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

    function setImage(dataUrl) {
        currentImage = dataUrl;
        imagePreview.hidden = !dataUrl;
        imagePlaceholder.hidden = Boolean(dataUrl);
        imageRemove.hidden = !dataUrl;
        if (dataUrl) {
            imagePreview.src = dataUrl;
        } else {
            imagePreview.removeAttribute("src");
            imageInput.value = "";
        }
    }

    async function compressImage(file) {
        const imageUrl = URL.createObjectURL(file);
        const image = new Image();
        try {
            await new Promise((resolve, reject) => {
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", () => reject(new Error("Не удалось открыть изображение.")), { once: true });
                image.src = imageUrl;
            });
        } finally {
            URL.revokeObjectURL(imageUrl);
        }
        if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 36000000) {
            throw new Error("У изображения слишком большое разрешение.");
        }
        const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Не удалось обработать изображение.");
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        for (const quality of [0.82, 0.68, 0.54, 0.4]) {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", quality));
            if (!blob || blob.type !== "image/webp") {
                throw new Error("Браузер не поддерживает сжатие изображения.");
            }
            if (blob.size <= 400 * 1024) {
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.addEventListener("load", () => typeof reader.result === "string"
                        ? resolve(reader.result)
                        : reject(new Error("Не удалось прочитать изображение.")), { once: true });
                    reader.addEventListener("error", () => reject(new Error("Не удалось прочитать изображение.")), { once: true });
                    reader.readAsDataURL(blob);
                });
            }
        }
        throw new Error("Не удалось уменьшить изображение до 400 КБ.");
    }

    function renderCollections() {
        const collections = getCollections();
        const products = getProducts();
        list.replaceChildren();
        collections.forEach(collection => {
            const card = document.createElement("article");
            card.className = "pages-card";
            const copy = document.createElement("div");
            copy.className = "pages-card-copy";
            const title = document.createElement("h3");
            title.textContent = collection.name;
            const count = collection.productIds.filter(id => products.some(product => product.id === id)).length;
            const description = document.createElement("p");
            description.textContent = `${count} ${pluralize(count, "товар", "товара", "товаров")}`;
            const server = document.createElement("span");
            server.className = "pages-card-address";
            server.textContent = collection.server || "Все серверы";
            copy.append(title, description, server);
            const actions = document.createElement("div");
            actions.className = "pages-card-actions";
            const edit = document.createElement("button");
            edit.className = "pages-icon-button";
            edit.type = "button";
            edit.dataset.action = "edit";
            edit.dataset.id = collection.id;
            edit.setAttribute("aria-label", `Изменить ${collection.name}`);
            edit.textContent = "✎";
            const remove = document.createElement("button");
            remove.className = "pages-icon-button danger";
            remove.type = "button";
            remove.dataset.action = "delete";
            remove.dataset.id = collection.id;
            remove.setAttribute("aria-label", `Удалить ${collection.name}`);
            remove.textContent = "×";
            actions.append(edit, remove);
            card.append(copy, actions);
            list.append(card);
        });
        empty.hidden = collections.length > 0;
        document.querySelector("#collections-count").textContent =
            `${collections.length} ${pluralize(collections.length, "подборка", "подборки", "подборок")}`;
    }

    function resetForm() {
        form.reset();
        editingId = null;
        feedback.hidden = true;
        document.querySelector("#collection-form-title").textContent = "Добавление подборки";
        document.querySelector("#collection-save-label").textContent = "Добавить";
        document.querySelector("#cancel-edit").hidden = true;
        setImage("");
        renderServers();
        renderProductPicker();
    }

    function editCollection(collection) {
        resetForm();
        editingId = collection.id;
        form.elements.name.value = collection.name;
        renderServers(collection.server);
        renderProductPicker(collection.productIds);
        setImage(collection.image);
        document.querySelector("#collection-form-title").textContent = "Редактирование подборки";
        document.querySelector("#collection-save-label").textContent = "Сохранить изменения";
        document.querySelector("#cancel-edit").hidden = false;
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        form.elements.name.focus({ preventScroll: true });
    }

    imageInput.addEventListener("change", async () => {
        const file = imageInput.files && imageInput.files[0];
        if (!file) {
            return;
        }
        feedback.hidden = true;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            showFeedback("Выберите изображение PNG, JPG или WEBP.");
            imageInput.value = "";
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showFeedback("Исходное изображение не должно превышать 10 МБ.");
            imageInput.value = "";
            return;
        }
        try {
            setImage(await compressImage(file));
        } catch (error) {
            showFeedback(error.message);
            imageInput.value = "";
        }
    });
    imageRemove.addEventListener("click", () => setImage(""));

    form.addEventListener("submit", event => {
        event.preventDefault();
        feedback.hidden = true;
        const name = form.elements.name.value.trim();
        if (!name) {
            showFeedback("Укажите название подборки.");
            form.elements.name.focus();
            return;
        }
        const collections = getCollections();
        if (collections.some(item => item.id !== editingId && item.name.toLowerCase() === name.toLowerCase())) {
            showFeedback("Подборка с таким названием уже есть.");
            return;
        }
        const productIds = Array.from(form.querySelectorAll('input[name="products"]:checked'), input => input.value);
        const collection = { id: editingId || createId(), name, server: serverSelect.value, image: currentImage, productIds };
        const wasEditing = Boolean(editingId);
        const previous = shop.tools.collections;
        try {
            shop.tools.collections = wasEditing
                ? collections.map(item => item.id === editingId ? collection : item)
                : [...collections, collection];
            saveShop();
            resetForm();
            renderCollections();
            showToast(wasEditing ? "Подборка обновлена." : "Подборка добавлена.");
        } catch (error) {
            shop.tools.collections = previous;
            showFeedback(`Не удалось сохранить подборку: ${error.message}`);
        }
    });

    list.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }
        const collection = getCollections().find(item => item.id === button.dataset.id);
        if (!collection) {
            showToast("Подборка не найдена. Обновите страницу.");
            return;
        }
        if (button.dataset.action === "edit") {
            editCollection(collection);
        } else {
            deletingId = collection.id;
            document.querySelector("#collection-delete-title").textContent = collection.name;
            deleteDialog.showModal();
        }
    });

    document.querySelector("#cancel-edit").addEventListener("click", resetForm);
    document.querySelector("#reset-collection-form").addEventListener("click", resetForm);
    document.querySelector("#cancel-collection-delete").addEventListener("click", () => {
        deletingId = null;
        deleteDialog.close();
    });
    document.querySelector("#confirm-collection-delete").addEventListener("click", () => {
        const previous = shop.tools.collections;
        try {
            shop.tools.collections = getCollections().filter(item => item.id !== deletingId);
            saveShop();
            if (editingId === deletingId) {
                resetForm();
            }
            renderCollections();
            deleteDialog.close();
            showToast("Подборка удалена.");
        } catch (error) {
            shop.tools.collections = previous;
            showToast(`Не удалось удалить подборку: ${error.message}`);
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
        document.title = `Подборки — ${shop.name} — SDonate`;
        document.querySelector("#collections-shop-caption").textContent = `Группируйте товары магазина «${shop.name}» в подборки.`;
        document.querySelector("#back-to-shop").href = `./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`;
        resetForm();
        renderCollections();
    } catch (error) {
        showToast(`Не удалось открыть подборки: ${error.message}`);
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    }
})();
