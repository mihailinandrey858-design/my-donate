(() => {
    const params = new URLSearchParams(window.location.search);
    const shopId = params.get("id");
    const ownerId = params.get("owner");
    const formId = params.get("form");
    const title = document.querySelector("#public-form-title");
    const description = document.querySelector("#public-form-description");
    const form = document.querySelector("#public-form");
    const fields = document.querySelector("#public-form-fields");
    const message = document.querySelector("#public-form-message");
    const errorBox = document.querySelector("#public-form-error");

    function load() {
        if (!shopId || !ownerId || !formId) {
            throw new Error("В ссылке не указан магазин или форма.");
        }
        const request = new XMLHttpRequest();
        request.open("GET", `/api/public-shop?owner=${encodeURIComponent(ownerId)}&id=${encodeURIComponent(shopId)}`, false);
        request.send();
        if (request.status !== 200) {
            throw new Error("Форма не найдена или отключена.");
        }
        const shop = JSON.parse(request.responseText).shop;
        const forms = shop && shop.tools && Array.isArray(shop.tools.forms) ? shop.tools.forms : [];
        const item = forms.find(entry => entry && entry.id === formId && entry.enabled !== false && Array.isArray(entry.questions));
        if (!item) {
            throw new Error("Форма не найдена или отключена.");
        }
        return { shop, item };
    }

    function showMessage(text, isError) {
        message.textContent = text;
        message.style.color = isError ? "#ff7a8a" : "#5be08a";
        message.hidden = false;
    }

    try {
        const { shop, item } = load();
        const storeUrl = `./public-store.html?id=${encodeURIComponent(shop.id)}&owner=${encodeURIComponent(ownerId)}`;
        ["#form-store-brand", "#form-home-link", "#form-shop-link", "#form-back-link"].forEach(selector => {
            document.querySelector(selector).href = storeUrl;
        });
        document.querySelector("#form-store-name").textContent = shop.name;
        document.querySelector("#form-brand-mark").textContent = Array.from(shop.name.trim() || "S")[0].toUpperCase();
        document.title = `${item.title} — ${shop.name}`;
        title.textContent = item.title;
        description.textContent = item.description || "ЗАЯВКА";
        document.querySelector("#public-form-submit").textContent = item.buttonText || "Отправить";

        item.questions.forEach((question, index) => {
            const label = document.createElement("label");
            label.textContent = question.label + (question.required === false ? "" : " *");
            const long = /почему|опыт|расскаж|о себе|комментар/i.test(question.label);
            const input = document.createElement(long ? "textarea" : "input");
            input.name = `q${index}`;
            input.maxLength = long ? 1500 : 300;
            if (!long) {
                input.type = "text";
            }
            label.append(input);
            fields.append(label);
        });
        form.hidden = false;

        form.addEventListener("submit", async event => {
            event.preventDefault();
            message.hidden = true;
            const answers = item.questions.map((question, index) => ({
                label: question.label,
                value: form.elements[`q${index}`].value.trim()
            }));
            const missing = item.questions.findIndex((question, index) => question.required !== false && !answers[index].value);
            if (missing >= 0) {
                showMessage(`Заполните поле «${item.questions[missing].label}».`, true);
                form.elements[`q${missing}`].focus();
                return;
            }
            try {
                const result = await fetch("/api/public-shop/form", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ owner: ownerId, id: shopId, formId: item.id, answers })
                });
                if (!result.ok) {
                    const data = await result.json().catch(() => ({}));
                    throw new Error(data.error || "Не удалось отправить заявку.");
                }
                form.reset();
                showMessage("Заявка отправлена. Спасибо!", false);
            } catch (error) {
                showMessage(error.message, true);
            }
        });
    } catch (error) {
        document.title = "Форма недоступна — SDonate";
        title.textContent = "Форма недоступна";
        description.textContent = "ЗАЯВКА";
        errorBox.textContent = error.message;
        errorBox.hidden = false;
    }
})();
