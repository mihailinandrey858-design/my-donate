// Source: auth-session.js
(() => {
function getAvatarStorageKey(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    return normalizedEmail ? `sdonate-profile-avatar:${normalizedEmail}` : null;
}

function renderAccountAvatar(source) {
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
    document.querySelectorAll(".account-avatar").forEach(avatar => {
        if (source) {
            const image = document.createElement("img");
            image.src = source;
            image.alt = "РђРІР°С‚Р°СЂ РїСЂРѕС„РёР»СЏ";
            avatar.replaceChildren(image);
            return;
        }
        avatar.textContent = Array.from(nickname)[0].toUpperCase();
    });
}

window.sdonateGetAvatar = function () {
    const key = getAvatarStorageKey(sessionStorage.getItem("sdonate-demo-email"));
    return key ? localStorage.getItem(key) : null;
};

window.sdonateRenderAvatar = function (source) {
    renderAccountAvatar(source);
};

window.sdonateSetAvatar = function (source) {
    const key = getAvatarStorageKey(sessionStorage.getItem("sdonate-demo-email"));
    if (!key) {
        throw new Error("РЎРЅР°С‡Р°Р»Р° РІРѕР№РґРё РІ Р°РєРєР°СѓРЅС‚, С‡С‚РѕР±С‹ СЃРѕС…СЂР°РЅРёС‚СЊ Р°РІР°С‚Р°СЂ.");
    }
    if (source) {
        localStorage.setItem(key, source);
    } else {
        localStorage.removeItem(key);
    }
    renderAccountAvatar(source);
};

window.sdonateMoveAvatar = function (oldEmail, newEmail) {
    const oldKey = getAvatarStorageKey(oldEmail);
    const newKey = getAvatarStorageKey(newEmail);
    if (!oldKey || !newKey || oldKey === newKey) {
        return;
    }
    const source = localStorage.getItem(oldKey);
    if (source) {
        localStorage.setItem(newKey, source);
        localStorage.removeItem(oldKey);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const key = getAvatarStorageKey(sessionStorage.getItem("sdonate-demo-email"));
    renderAccountAvatar(key ? localStorage.getItem(key) : null);
}, { once: true });

window.sdonateEndSession = async function () {
    try {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: "{}"
        });
        if (!response.ok) {
            throw new Error(`РЎРµСЂРІРµСЂ РІРµСЂРЅСѓР» СЃС‚Р°С‚СѓСЃ ${response.status}.`);
        }
        sessionStorage.removeItem("sdonate-demo-authenticated");
        sessionStorage.removeItem("sdonate-demo-nickname");
        sessionStorage.removeItem("sdonate-demo-email");
        sessionStorage.removeItem("sdonate-demo-user-id");
        window.location.assign("./reg.html?mode=login");
    } catch (error) {
        console.error("РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РІРµСЂС€РёС‚СЊ СЃРµСЂРІРµСЂРЅСѓСЋ СЃРµСЃСЃРёСЋ:", error);
        document.querySelectorAll("#logout-button, #settings-logout").forEach(button => {
            button.disabled = false;
        });
        window.alert("РќРµ СѓРґР°Р»РѕСЃСЊ СЃРІСЏР·Р°С‚СЊСЃСЏ СЃ СЃРµСЂРІРµСЂРѕРј. РЎРµР°РЅСЃ РЅРµ Р·Р°РІРµСЂС€С‘РЅ вЂ” РїРѕРїСЂРѕР±СѓР№ РµС‰С‘ СЂР°Р·.");
    }
};

document.addEventListener("click", event => {
    const button = event.target.closest("#logout-button, #settings-logout");
    if (!button) {
        return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    button.disabled = true;
    window.sdonateEndSession();
}, true);

})();

// Source: demo-image-storage.js
(() => {
(function () {
    const databaseName = "sdonate-demo-image-assets";
    const storeName = "images";
    let databasePromise;

    function openDatabase() {
        if (databasePromise) {
            return databasePromise;
        }
        if (!window.indexedDB) {
            return Promise.reject(new Error("Р‘СЂР°СѓР·РµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ IndexedDB РґР»СЏ С…СЂР°РЅРµРЅРёСЏ РёР·РѕР±СЂР°Р¶РµРЅРёР№."));
        }
        databasePromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(databaseName, 1);
            request.addEventListener("upgradeneeded", () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(storeName)) {
                    database.createObjectStore(storeName, { keyPath: "key" });
                }
            });
            request.addEventListener("success", () => resolve(request.result), { once: true });
            request.addEventListener("error", () => {
                databasePromise = null;
                reject(request.error || new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ С…СЂР°РЅРёР»РёС‰Рµ РёР·РѕР±СЂР°Р¶РµРЅРёР№."));
            }, { once: true });
            request.addEventListener("blocked", () => {
                databasePromise = null;
                reject(new Error("РҐСЂР°РЅРёР»РёС‰Рµ РёР·РѕР±СЂР°Р¶РµРЅРёР№ Р·Р°РЅСЏС‚Рѕ РґСЂСѓРіРѕР№ РІРєР»Р°РґРєРѕР№. Р—Р°РєСЂРѕР№ СЃС‚Р°СЂС‹Рµ РІРєР»Р°РґРєРё СЃР°Р№С‚Р° Рё РїРѕРІС‚РѕСЂРё."));
            }, { once: true });
        });
        return databasePromise;
    }

    function runTransaction(mode, action) {
        return openDatabase().then(database => new Promise((resolve, reject) => {
            const transaction = database.transaction(storeName, mode);
            let result;
            transaction.objectStore(storeName);
            try {
                result = action(transaction.objectStore(storeName));
            } catch (error) {
                reject(error);
                return;
            }
            transaction.addEventListener("complete", () => resolve(result), { once: true });
            transaction.addEventListener("abort", () => {
                reject(transaction.error || new Error("РћРїРµСЂР°С†РёСЏ СЃ РёР·РѕР±СЂР°Р¶РµРЅРёРµРј РїСЂРµСЂРІР°РЅР°."));
            }, { once: true });
            transaction.addEventListener("error", () => {
                reject(transaction.error || new Error("РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ."));
            }, { once: true });
        }));
    }

    window.sdonateImageStorage = {
        reference(key) {
            return `idb:${key}`;
        },
        keyFromReference(value) {
            return typeof value === "string" && value.startsWith("idb:")
                ? value.slice(4)
                : null;
        },
        createKey(shopId, slot) {
            const id = window.crypto && typeof window.crypto.randomUUID === "function"
                ? window.crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            return `${shopId}:${slot}:${id}`;
        },
        async get(key) {
            return runTransaction("readonly", store => new Promise((resolve, reject) => {
                const request = store.get(key);
                request.addEventListener("success", () => resolve(request.result?.data || null), { once: true });
                request.addEventListener("error", () => reject(request.error || new Error("РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.")), { once: true });
            }));
        },
        async set(key, data) {
            try {
                await runTransaction("readwrite", store => store.put({ key, data }));
            } catch (error) {
                if (error.name === "QuotaExceededError") {
                    throw new Error("Р’ Р±СЂР°СѓР·РµСЂРµ Р·Р°РєРѕРЅС‡РёР»РѕСЃСЊ РјРµСЃС‚Рѕ РґР»СЏ РёР·РѕР±СЂР°Р¶РµРЅРёР№. РЈРґР°Р»Рё СЃС‚Р°СЂС‹Рµ С„РѕС‚Рѕ РёР»Рё РѕСЃРІРѕР±РѕРґРё РјРµСЃС‚Рѕ РІ РЅР°СЃС‚СЂРѕР№РєР°С… Р±СЂР°СѓР·РµСЂР°.");
                }
                throw error;
            }
        },
        async delete(keys) {
            const uniqueKeys = [...new Set(keys.filter(key => typeof key === "string" && key))];
            if (!uniqueKeys.length) {
                return;
            }
            await runTransaction("readwrite", store => {
                uniqueKeys.forEach(key => store.delete(key));
            });
        }
    };
}());

})();

// Source: demo-shop-storage.js
(() => {
(() => {
    const legacyKey = "sdonate-demo-shops";
    const emailKeyPrefix = `${legacyKey}:`;

    function getIdentity() {
        if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
            throw new Error("Р’РѕР№РґРё РІ Р°РєРєР°СѓРЅС‚, С‡С‚РѕР±С‹ РѕС‚РєСЂС‹С‚СЊ РјР°РіР°Р·РёРЅС‹.");
        }

        const id = sessionStorage.getItem("sdonate-demo-user-id");
        const email = String(sessionStorage.getItem("sdonate-demo-email") || "").trim().toLowerCase();
        const value = id || email;
        if (!value) {
            throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ Р°РєРєР°СѓРЅС‚. Р’С‹Р№РґРё Рё РІРѕР№РґРё СЃРЅРѕРІР°.");
        }
        return { value, email };
    }

    let hydrated = false;

    function hydrateFromServer(key) {
        if (hydrated) {
            return;
        }
        hydrated = true;
        try {
            const request = new XMLHttpRequest();
            request.open("GET", "/api/shops", false);
            request.withCredentials = true;
            request.send();
            if (request.status !== 200) {
                return;
            }
            const { shops } = JSON.parse(request.responseText);
            if (Array.isArray(shops)) {
                sessionStorage.setItem(key, JSON.stringify(shops));
            } else if (sessionStorage.getItem(key) !== null) {
                pushToServer(sessionStorage.getItem(key));
            }
        } catch (error) {
            console.error("РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РјР°РіР°Р·РёРЅС‹ СЃ СЃРµСЂРІРµСЂР°:", error);
        }
    }

    function pushToServer(body) {
        const payload = `{"shops":${body}}`;
        fetch("/api/shops", {
            method: "PUT",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: payload.length < 60000
        }).then(response => {
            if (!response.ok) {
                throw new Error(`РЎРµСЂРІРµСЂ РІРµСЂРЅСѓР» СЃС‚Р°С‚СѓСЃ ${response.status}.`);
            }
        }).catch(error => {
            console.error("РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РјР°РіР°Р·РёРЅС‹ РЅР° СЃРµСЂРІРµСЂРµ:", error);
        });
    }

    function storageKey() {
        const key = resolveStorageKey();
        hydrateFromServer(key);
        return key;
    }

    function resolveStorageKey() {
        const { value, email } = getIdentity();
        const key = `${legacyKey}:account:${encodeURIComponent(value)}`;
        if (sessionStorage.getItem(key) !== null) {
            return key;
        }

        const migrationKeys = [];
        if (email) {
            migrationKeys.push(`${emailKeyPrefix}${encodeURIComponent(email)}`);
        }
        migrationKeys.push(legacyKey);

        for (const sourceKey of migrationKeys) {
            const stored = sessionStorage.getItem(sourceKey);
            if (stored === null) {
                continue;
            }

            const shops = JSON.parse(stored);
            if (!Array.isArray(shops)) {
                throw new Error("РЎРѕС…СЂР°РЅС‘РЅРЅС‹Р№ СЃРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
            }
            const ownedShops = shops.filter(shop =>
                shop && (shop.ownerId
                    ? shop.ownerId === value
                    : (typeof shop.ownerEmail !== "string" || !email || shop.ownerEmail.toLowerCase() === email))
            ).map(shop => ({ ...shop, ownerId: value, ownerEmail: email }));
            const otherShops = shops.filter(shop =>
                shop && (shop.ownerId
                    ? shop.ownerId !== value
                    : (typeof shop.ownerEmail === "string" && email && shop.ownerEmail.toLowerCase() !== email))
            );

            if (ownedShops.length) {
                sessionStorage.setItem(key, JSON.stringify(ownedShops));
            }
            if (otherShops.length) {
                sessionStorage.setItem(sourceKey, JSON.stringify(otherShops));
            } else {
                sessionStorage.removeItem(sourceKey);
            }
            if (sessionStorage.getItem(key) !== null) {
                break;
            }
        }

        return key;
    }

    function save(shops) {
        if (!Array.isArray(shops)) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        const { value, email } = getIdentity();
        const ownedShops = shops.map(shop => {
            if (!shop || (shop.ownerId && shop.ownerId !== value) ||
                (!shop.ownerId && typeof shop.ownerEmail === "string" && email && shop.ownerEmail.toLowerCase() !== email)) {
                throw new Error("РќРµР»СЊР·СЏ СЃРѕС…СЂР°РЅРёС‚СЊ РјР°РіР°Р·РёРЅ РґСЂСѓРіРѕРіРѕ Р°РєРєР°СѓРЅС‚Р°.");
            }
            return { ...shop, ownerId: value, ownerEmail: email };
        });
        const serialized = JSON.stringify(ownedShops);
        sessionStorage.setItem(storageKey(), serialized);
        pushToServer(serialized);
    }

    window.sdonateShopStorage = { storageKey, save };
})();

})();

// Source: markdown-renderer.js
(() => {
(() => {
    function appendInline(parent, source) {
        const pattern = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|\[[^\]]+\]\([^)]+\))/g;
        let cursor = 0;
        for (const match of source.matchAll(pattern)) {
            parent.append(document.createTextNode(source.slice(cursor, match.index)));
            const token = match[0];
            let element;
            if (token.startsWith("**") || token.startsWith("__")) {
                element = document.createElement("strong");
                element.textContent = token.slice(2, -2);
            } else if (token.startsWith("~~")) {
                element = document.createElement("del");
                element.textContent = token.slice(2, -2);
            } else if (token.startsWith("*") || token.startsWith("_")) {
                element = document.createElement("em");
                element.textContent = token.slice(1, -1);
            } else if (token.startsWith("`")) {
                element = document.createElement("code");
                element.textContent = token.slice(1, -1);
            } else {
                const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                let url;
                try {
                    url = new URL(link[2], window.location.href);
                } catch {
                    url = null;
                }
                if (!url || !["http:", "https:", "mailto:"].includes(url.protocol)) {
                    parent.append(document.createTextNode(token));
                    cursor = match.index + token.length;
                    continue;
                }
                element = document.createElement("a");
                element.href = url.href;
                element.textContent = link[1];
                element.rel = "noopener noreferrer";
                if (url.origin !== window.location.origin) {
                    element.target = "_blank";
                }
            }
            parent.append(element);
            cursor = match.index + token.length;
        }
        parent.append(document.createTextNode(source.slice(cursor)));
    }

    function appendParagraph(parent, lines) {
        if (!lines.length) {
            return;
        }
        const paragraph = document.createElement("p");
        lines.forEach((line, index) => {
            if (index) {
                paragraph.append(document.createElement("br"));
            }
            appendInline(paragraph, line);
        });
        parent.append(paragraph);
        lines.length = 0;
    }

    function render(source, target) {
        target.replaceChildren();
        const lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
        let paragraphLines = [];
        let list = null;
        let codeLines = null;

        function closeList() {
            list = null;
        }

        lines.forEach(line => {
            if (codeLines) {
                if (/^\s*```/.test(line)) {
                    const pre = document.createElement("pre");
                    const code = document.createElement("code");
                    code.textContent = codeLines.join("\n");
                    pre.append(code);
                    target.append(pre);
                    codeLines = null;
                } else {
                    codeLines.push(line);
                }
                return;
            }
            if (/^\s*```/.test(line)) {
                appendParagraph(target, paragraphLines);
                closeList();
                codeLines = [];
                return;
            }
            if (!line.trim()) {
                appendParagraph(target, paragraphLines);
                closeList();
                return;
            }

            const heading = line.match(/^(#{1,4})\s+(.+)$/);
            if (heading) {
                appendParagraph(target, paragraphLines);
                closeList();
                const element = document.createElement(`h${heading[1].length + 1}`);
                appendInline(element, heading[2]);
                target.append(element);
                return;
            }
            if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
                appendParagraph(target, paragraphLines);
                closeList();
                target.append(document.createElement("hr"));
                return;
            }
            const quote = line.match(/^\s*>\s?(.*)$/);
            if (quote) {
                appendParagraph(target, paragraphLines);
                closeList();
                const blockquote = document.createElement("blockquote");
                appendInline(blockquote, quote[1]);
                target.append(blockquote);
                return;
            }
            const item = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.+)$/);
            if (item) {
                appendParagraph(target, paragraphLines);
                const ordered = /^\s*\d+\./.test(line);
                if (!list || list.tagName !== (ordered ? "OL" : "UL")) {
                    closeList();
                    list = document.createElement(ordered ? "OL" : "UL");
                    target.append(list);
                }
                const li = document.createElement("li");
                appendInline(li, item[1]);
                list.append(li);
                return;
            }
            closeList();
            paragraphLines.push(line);
        });

        appendParagraph(target, paragraphLines);
        if (codeLines) {
            const pre = document.createElement("pre");
            const code = document.createElement("code");
            code.textContent = codeLines.join("\n");
            pre.append(code);
            target.append(pre);
        }
        return target;
    }

    window.sdonateMarkdown = { render };
})();

})();

// Source: telegram-promo.js
(() => {
(() => {
    const main = document.querySelector("main");
    const promo = document.createElement("a");
    promo.className = "telegram-promo";
    promo.href = "https://t.me/Sdonat1";
    promo.target = "_blank";
    promo.rel = "noopener noreferrer";
    promo.setAttribute("aria-label", "РћС‚РєСЂС‹С‚СЊ Telegram SDonate");
    promo.innerHTML = `
        <span class="telegram-promo-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false"><path d="M21.5 3.6 18.3 20c-.2 1.2-.9 1.5-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L5.7 13.6.8 12.1c-1.1-.3-1.1-1.1.2-1.6L20.1 3c.9-.3 1.7.2 1.4.6Z"></path></svg>
        </span>
        <span class="telegram-promo-copy">
            <span class="telegram-promo-title">РќР°С€ Telegram <span>@Sdonat1</span></span>
            <span class="telegram-promo-description">РќРѕРІРѕСЃС‚Рё, РѕР±РЅРѕРІР»РµРЅРёСЏ Рё Р°РЅРѕРЅСЃС‹ вЂ” РїСЂРёСЃРѕРµРґРёРЅСЏР№СЃСЏ Рє СЃРѕРѕР±С‰РµСЃС‚РІСѓ SDonate.</span>
        </span>
        <span class="telegram-promo-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false"><path d="M7 17 17 7M8 7h9v9"></path></svg>
        </span>`;

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "./css/telegram-promo.css";
    document.head.append(stylesheet);

    if (main && main.classList.contains("auth-layout")) {
        promo.dataset.placement = "auth";
        document.body.insertBefore(promo, main);
    } else if (main) {
        if (main.id === "top") {
            promo.dataset.placement = "landing";
        }
        main.insertBefore(promo, main.firstChild);
    } else {
        const header = document.querySelector("header");
        if (header) {
            header.insertAdjacentElement("afterend", promo);
        } else {
            document.body.insertBefore(promo, document.body.firstChild);
        }
    }
})();

})();

// Source: admin.js
(() => {
async function loadAdminPanel() {
    const response = await fetch("/api/admin/summary", { credentials: "same-origin", cache: "no-store" });
    if (response.status === 401) {
        window.location.replace("./reg.html?mode=login");
        return;
    }
    if (response.status === 403) {
        window.location.replace("./dashboard.html");
        return;
    }
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РїР°РЅРµР»СЊ.");
    }

    const userResponse = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
    if (!userResponse.ok) {
        window.location.replace("./reg.html?mode=login");
        return;
    }
    const { user } = await userResponse.json();
    const accountName = document.querySelector("#account-name");
    const accountAvatar = document.querySelector("#account-avatar");
    const tableBody = document.querySelector("#accounts-table-body");
    const emptyMessage = document.querySelector("#accounts-empty");
    const searchInput = document.querySelector("#account-search");
    const accountTotal = document.querySelector("#account-total");
    const logoutButton = document.querySelector("#logout-button");
    const accountLabel = document.querySelector("#admin-account-label");
    const accountsCaption = document.querySelector("#accounts-caption");
    const shopsStat = document.querySelector("#shop-total");
    const statusMessage = document.querySelector("#admin-status-message");
    const deleteDialog = document.querySelector("#account-delete-dialog");
    const deleteDescription = document.querySelector("#account-delete-description");
    const incomeStat = document.querySelector("#income-caption");
    const verificationList = document.querySelector("#verification-admin-list");
    const verificationEmpty = document.querySelector("#verification-admin-empty");
    const verificationMessage = document.querySelector("#verification-admin-message");
    const verificationCaption = document.querySelector("#verification-admin-caption");
    const refreshVerifications = document.querySelector("#refresh-verifications");
    let deleteAccountId = null;

    accountName.textContent = user.nickname;
    accountAvatar.textContent = Array.from(user.nickname)[0].toUpperCase();
    accountLabel.textContent = user.email;
    accountTotal.textContent = String(result.accounts.length);
    shopsStat.textContent = "вЂ”";
    accountsCaption.textContent = "Р°РєРєР°СѓРЅС‚С‹ РёР· Р±Р°Р·С‹ СЃРµСЂРІРµСЂР°";
    document.querySelector("#turnover-value").textContent = `${result.turnover.toLocaleString("ru-RU")} в‚Ѕ`;
    document.querySelector("#revenue-value").textContent = `${result.revenue.toLocaleString("ru-RU")} в‚Ѕ`;
    incomeStat.textContent = result.paymentsConnected
        ? "РґР°РЅРЅС‹Рµ РёР· РїР»Р°С‚С‘Р¶РЅС‹С… РѕРїРµСЂР°С†РёР№"
        : "РїР»Р°С‚С‘Р¶РЅР°СЏ РёРЅС‚РµРіСЂР°С†РёСЏ РЅРµ РїРѕРґРєР»СЋС‡РµРЅР°";

    function showAdminError(message) {
        statusMessage.textContent = message;
        statusMessage.hidden = false;
    }

    async function accountAction(account, method, active) {
        statusMessage.hidden = true;
        const options = {
            method,
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" }
        };
        if (method === "PATCH") {
            options.body = JSON.stringify({ active });
        }
        try {
            const actionResponse = await fetch(`/api/admin/accounts/${encodeURIComponent(account.id)}`, options);
            const actionResult = await actionResponse.json();
            if (!actionResponse.ok) {
                throw new Error(actionResult.error || "РќРµ СѓРґР°Р»РѕСЃСЊ РёР·РјРµРЅРёС‚СЊ Р°РєРєР°СѓРЅС‚.");
            }
            window.location.reload();
        } catch (error) {
            showAdminError(`РќРµ СѓРґР°Р»РѕСЃСЊ РІС‹РїРѕР»РЅРёС‚СЊ РґРµР№СЃС‚РІРёРµ: ${error.message}`);
        }
    }

    function renderAccounts() {
        const query = searchInput.value.trim().toLocaleLowerCase("ru");
        const accounts = result.accounts.filter(account =>
            account.nickname.toLocaleLowerCase("ru").includes(query) ||
            account.email.toLocaleLowerCase("ru").includes(query)
        );
        tableBody.replaceChildren();

        accounts.forEach(account => {
            const row = document.createElement("tr");
            const identity = document.createElement("td");
            const avatar = document.createElement("span");
            const name = document.createElement("span");
            const email = document.createElement("td");
            const registered = document.createElement("td");
            const roleCell = document.createElement("td");
            const role = document.createElement("span");
            const statusCell = document.createElement("td");
            const status = document.createElement("span");
            const actions = document.createElement("td");
            const actionsWrap = document.createElement("div");
            const date = new Date(account.createdAt);

            identity.className = "admin-identity";
            avatar.className = "admin-table-avatar";
            avatar.textContent = Array.from(account.nickname)[0].toUpperCase();
            name.textContent = account.nickname;
            identity.append(avatar, name);
            email.textContent = account.email;
            registered.textContent = Number.isNaN(date.getTime())
                ? "РќРµ СѓРєР°Р·Р°РЅР°"
                : new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(date);
            role.className = "account-status";
            role.textContent = account.role === "admin" ? "РђРґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ" : "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ";
            roleCell.append(role);
            status.className = `account-status${account.active ? " account-status-active" : " account-status-blocked"}`;
            status.textContent = account.active ? "РђРєС‚РёРІРµРЅ" : "Р—Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ";
            statusCell.append(status);
            actionsWrap.className = "account-actions";
            if (account.role === "admin") {
                const protectedLabel = document.createElement("span");
                protectedLabel.className = "protected-account-label";
                protectedLabel.textContent = "Р—Р°С‰РёС‰С‘РЅ";
                actionsWrap.append(protectedLabel);
            } else {
                const toggleButton = document.createElement("button");
                toggleButton.type = "button";
                toggleButton.className = "account-action-button";
                toggleButton.textContent = account.active ? "Р—Р°Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ" : "Р Р°Р·Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ";
                toggleButton.addEventListener("click", () => accountAction(account, "PATCH", !account.active));

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "account-action-button danger-action";
                deleteButton.textContent = "РЈРґР°Р»РёС‚СЊ";
                deleteButton.addEventListener("click", () => {
                    deleteAccountId = account.id;
                    deleteDescription.textContent = `РђРєРєР°СѓРЅС‚ ${account.nickname} (${account.email}) Р±СѓРґРµС‚ СѓРґР°Р»С‘РЅ Р±РµР· РІРѕР·РјРѕР¶РЅРѕСЃС‚Рё РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ.`;
                    deleteDialog.showModal();
                });
                actionsWrap.append(toggleButton, deleteButton);
            }
            actions.append(actionsWrap);
            row.append(identity, email, registered, roleCell, statusCell, actions);
            tableBody.append(row);
        });

        emptyMessage.hidden = accounts.length > 0;
    }

    async function loadVerifications() {
        verificationMessage.hidden = true;
        const response = await fetch("/api/admin/verifications", {
            credentials: "same-origin",
            cache: "no-store"
        });
        const verificationResult = await response.json();
        if (!response.ok) {
            throw new Error(verificationResult.error || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р·Р°СЏРІРєРё.");
        }
        verificationCaption.textContent = verificationResult.telegramConfigured
            ? "Р РµС€РµРЅРёРµ РјРѕР¶РЅРѕ РїСЂРёРЅСЏС‚СЊ Р·РґРµСЃСЊ РёР»Рё РєРЅРѕРїРєРѕР№ РІ Р»РёС‡РЅРѕРј С‡Р°С‚Рµ Telegram. Р›РёС‡РЅС‹Рµ РґР°РЅРЅС‹Рµ РІ Telegram РЅРµ РѕС‚РїСЂР°РІР»СЏСЋС‚СЃСЏ."
            : "Telegram РЅРµ РЅР°СЃС‚СЂРѕРµРЅ. Р”Р°РЅРЅС‹Рµ РІРёРґРЅС‹ С‚РѕР»СЊРєРѕ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂСѓ; СЂРµС€РµРЅРёСЏ РјРѕР¶РЅРѕ РїСЂРёРЅСЏС‚СЊ Р·РґРµСЃСЊ.";
        verificationList.replaceChildren();
        verificationResult.requests.forEach(request => {
            const card = document.createElement("article");
            const heading = document.createElement("div");
            const title = document.createElement("b");
            const status = document.createElement("span");
            const details = document.createElement("dl");
            const identity = document.createElement("div");
            const phone = document.createElement("div");
            const email = document.createElement("div");
            const requestId = document.createElement("div");
            const actions = document.createElement("div");
            const labels = { pending: "РќР° РїСЂРѕРІРµСЂРєРµ", approved: "РћРґРѕР±СЂРµРЅРѕ", rejected: "РћС‚РєР»РѕРЅРµРЅРѕ" };
            const submitted = new Date(request.createdAt);

            card.className = "verification-admin-card";
            heading.className = "verification-admin-heading";
            title.textContent = `${request.surname} ${request.firstName} ${request.patronymic}`;
            status.className = `verification-admin-status verification-admin-status-${request.status}`;
            status.textContent = labels[request.status] || "РќРµРёР·РІРµСЃС‚РЅС‹Р№ СЃС‚Р°С‚СѓСЃ";
            heading.append(title, status);

            details.className = "verification-admin-details";
            identity.textContent = `РђРєРєР°СѓРЅС‚: ${request.nickname}`;
            phone.textContent = `РўРµР»РµС„РѕРЅ: ${request.phone}`;
            email.textContent = request.email ? `РџРѕС‡С‚Р°: ${request.email}` : "РџРѕС‡С‚Р° Р°РєРєР°СѓРЅС‚Р° РЅРµРґРѕСЃС‚СѓРїРЅР°";
            requestId.textContent = `Р—Р°СЏРІРєР° в„–${request.id}`;
            details.append(identity, phone, email, requestId);
            if (!Number.isNaN(submitted.getTime())) {
                const date = document.createElement("div");
                date.textContent = `РћС‚РїСЂР°РІР»РµРЅР°: ${new Intl.DateTimeFormat("ru-RU", {
                    dateStyle: "medium",
                    timeStyle: "short"
                }).format(submitted)}`;
                details.append(date);
            }

            card.append(heading, details);
            if (request.status === "pending") {
                actions.className = "verification-admin-actions";
                for (const [statusValue, label] of [["approved", "РћРґРѕР±СЂРёС‚СЊ"], ["rejected", "РћС‚РєР»РѕРЅРёС‚СЊ"]]) {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = `account-action-button${statusValue === "rejected" ? " danger-action" : ""}`;
                    button.textContent = label;
                    button.addEventListener("click", async () => {
                        button.disabled = true;
                        try {
                            const decisionResponse = await fetch(`/api/admin/verifications/${encodeURIComponent(request.id)}/decision`, {
                                method: "POST",
                                credentials: "same-origin",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: statusValue })
                            });
                            const decisionResult = await decisionResponse.json();
                            if (!decisionResponse.ok) {
                                throw new Error(decisionResult.error || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ СЂРµС€РµРЅРёРµ.");
                            }
                            await loadVerifications();
                        } catch (error) {
                            button.disabled = false;
                            verificationMessage.textContent = error.message;
                            verificationMessage.hidden = false;
                        }
                    });
                    actions.append(button);
                }
                card.append(actions);
            }
            verificationList.append(card);
        });
        verificationEmpty.hidden = verificationResult.requests.length > 0;
    }

    refreshVerifications.addEventListener("click", () => {
        loadVerifications().catch(error => {
            verificationMessage.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р·Р°СЏРІРєРё: ${error.message}`;
            verificationMessage.hidden = false;
        });
    });
    loadVerifications().catch(error => {
        verificationMessage.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р·Р°СЏРІРєРё: ${error.message}`;
        verificationMessage.hidden = false;
    });

    searchInput.addEventListener("input", renderAccounts);
    deleteDialog.addEventListener("close", () => {
        if (deleteDialog.returnValue !== "confirm" || !deleteAccountId) {
            return;
        }
        const account = result.accounts.find(item => item.id === deleteAccountId);
        deleteAccountId = null;
        if (account) {
            accountAction(account, "DELETE");
        }
    });
    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: "{}"
            });
        } finally {
            sessionStorage.removeItem("sdonate-demo-authenticated");
            sessionStorage.removeItem("sdonate-demo-nickname");
            sessionStorage.removeItem("sdonate-demo-email");
            window.location.assign("./reg.html?mode=login");
        }
    });

    statusMessage.hidden = true;
    renderAccounts();
}

loadAdminPanel().catch(error => {
    const statusMessage = document.querySelector("#admin-status-message");
    statusMessage.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р°РґРјРёРЅ-РїР°РЅРµР»СЊ: ${error.message}`;
    statusMessage.hidden = false;
});

})();

// Source: coupons.js
(() => {
(() => {
    if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
        window.location.replace("./reg.html?mode=login");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const shopId = params.get("id");
    const storageKey = window.sdonateShopStorage.storageKey();
    const accountName = document.querySelector("#account-name");
    const accountAvatar = document.querySelector("#account-avatar");
    const backToShop = document.querySelector("#back-to-shop");
    const couponGrid = document.querySelector("#coupon-grid");
    const couponEmpty = document.querySelector("#coupon-empty");
    const couponCount = document.querySelector("#coupon-count");
    const dialog = document.querySelector("#coupon-dialog");
    const form = document.querySelector("#coupon-form");
    const formFeedback = document.querySelector("#coupon-form-feedback");
    const productList = document.querySelector("#coupon-product-list");
    const partnerList = document.querySelector("#coupon-partner-list");
    const deleteDialog = document.querySelector("#coupon-delete-dialog");
    const toast = document.querySelector("#coupon-toast");
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
    let shops;
    let shop;
    let pendingDeleteId = null;
    let toastTimer;

    accountName.textContent = nickname;
    accountAvatar.textContent = Array.from(nickname)[0].toUpperCase();
    backToShop.href = `./shop-dashboard.html?id=${encodeURIComponent(shopId || "")}`;

    function readShops() {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.some(item =>
            !item || typeof item.id !== "string" || typeof item.name !== "string"
        )) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return parsed;
    }

    function saveShop() {
        const currentShops = readShops();
        const currentIndex = currentShops.findIndex(item => item.id === shopId);
        if (currentIndex < 0) {
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        currentShops[currentIndex] = shop;
        window.sdonateShopStorage.save(currentShops);
        shops = currentShops;
    }

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function showToast(message) {
        window.clearTimeout(toastTimer);
        toast.textContent = message;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 3200);
    }

    function allCoupons() {
        if (Array.isArray(shop.coupons)) {
            return shop.coupons;
        }
        const oldCoupons = shop.tools && Array.isArray(shop.tools.coupons) ? shop.tools.coupons : [];
        return oldCoupons.map(record => {
            const code = String(record.name || "").trim().toUpperCase();
            const discount = Number(record.detail);
            return {
                id: record.id || createId(),
                name: code ? `РљСѓРїРѕРЅ ${code}` : "РЎС‚Р°СЂС‹Р№ РєСѓРїРѕРЅ",
                code,
                discount: Number.isFinite(discount) && discount > 0 && discount <= 100 ? discount : 10,
                maxUses: null,
                uses: 0,
                startAt: "",
                endAt: "",
                productIds: [],
                partners: [],
                active: true
            };
        });
    }

    function getCouponStatus(coupon) {
        if (coupon.active === false) {
            return { label: "Р’С‹РєР»СЋС‡РµРЅ", className: "is-paused" };
        }
        const now = Date.now();
        const start = coupon.startAt ? new Date(coupon.startAt).getTime() : NaN;
        const end = coupon.endAt ? new Date(coupon.endAt).getTime() : NaN;
        if (Number.isFinite(start) && start > now) {
            return { label: "Р—Р°РїР»Р°РЅРёСЂРѕРІР°РЅ", className: "is-paused" };
        }
        if (Number.isFinite(end) && end < now) {
            return { label: "Р—Р°РІРµСЂС€С‘РЅ", className: "is-expired" };
        }
        if (Number.isFinite(Number(coupon.maxUses)) && Number(coupon.maxUses) > 0 &&
            Number(coupon.uses || 0) >= Number(coupon.maxUses)) {
            return { label: "Р›РёРјРёС‚ РёСЃС‡РµСЂРїР°РЅ", className: "is-exhausted" };
        }
        return { label: "РђРєС‚РёРІРµРЅ", className: "" };
    }

    function formatDate(value) {
        if (!value) {
            return "Р‘РµР· СЃСЂРѕРєР°";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "Р”Р°С‚Р° РЅРµ Р·Р°РґР°РЅР°";
        }
        return new Intl.DateTimeFormat("ru-RU", { dateStyle: "short" }).format(date);
    }

    function makeIconButton(label, symbol, action, couponId) {
        const button = document.createElement("button");
        button.className = "coupon-icon-button";
        button.type = "button";
        button.dataset.action = action;
        button.dataset.couponId = couponId;
        button.setAttribute("aria-label", `${label}: ${couponId}`);
        button.title = label;
        button.textContent = symbol;
        return button;
    }

    function renderCoupons() {
        const coupons = allCoupons();
        couponGrid.replaceChildren();
        coupons.forEach(coupon => {
            const card = document.createElement("article");
            card.className = "coupon-card";

            const top = document.createElement("div");
            top.className = "coupon-card-top";
            const status = document.createElement("span");
            const statusInfo = getCouponStatus(coupon);
            status.className = `coupon-status ${statusInfo.className}`;
            status.textContent = statusInfo.label;
            const actions = document.createElement("div");
            actions.className = "coupon-card-actions";
            actions.append(
                makeIconButton("РЎРєРѕРїРёСЂРѕРІР°С‚СЊ РєРѕРґ", "в§‰", "copy", coupon.id),
                makeIconButton("РР·РјРµРЅРёС‚СЊ РєСѓРїРѕРЅ", "вњЋ", "edit", coupon.id),
                makeIconButton(coupon.active === false ? "Р’РєР»СЋС‡РёС‚СЊ РєСѓРїРѕРЅ" : "Р’С‹РєР»СЋС‡РёС‚СЊ РєСѓРїРѕРЅ", coupon.active === false ? "в–¶" : "в…Ў", "toggle", coupon.id),
                makeIconButton("РЈРґР°Р»РёС‚СЊ РєСѓРїРѕРЅ", "Г—", "delete", coupon.id)
            );
            top.append(status, actions);

            const titleRow = document.createElement("div");
            titleRow.className = "coupon-card-title-row";
            const name = document.createElement("h3");
            name.textContent = coupon.name || "РљСѓРїРѕРЅ Р±РµР· РЅР°Р·РІР°РЅРёСЏ";
            const discount = document.createElement("span");
            discount.className = "coupon-discount";
            discount.textContent = `в€’${Number(coupon.discount) || 0}%`;
            titleRow.append(name, discount);

            const codeRow = document.createElement("div");
            codeRow.className = "coupon-card-code-row";
            const code = document.createElement("span");
            code.className = "coupon-code-chip";
            code.textContent = coupon.code || "Р‘Р•Р— РљРћР”Рђ";
            const scope = document.createElement("span");
            scope.className = "coupon-card-scope";
            const productIds = Array.isArray(coupon.productIds) ? coupon.productIds : [];
            const productNames = productIds
                .map(id => (shop.products || []).find(product => product.id === id))
                .filter(Boolean)
                .map(product => product.name);
            scope.textContent = productNames.length ? productNames.join(", ") : "Р’СЃРµ С‚РѕРІР°СЂС‹";
            codeRow.append(code, scope);

            const usage = document.createElement("div");
            usage.className = "coupon-usage";
            const usageTop = document.createElement("div");
            usageTop.className = "coupon-usage-top";
            const usageLabel = document.createElement("span");
            usageLabel.textContent = "РСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ";
            const usageValue = document.createElement("b");
            const uses = Math.max(0, Number(coupon.uses) || 0);
            const maxUses = Number(coupon.maxUses);
            const hasLimit = Number.isFinite(maxUses) && maxUses > 0;
            usageValue.textContent = hasLimit ? `${uses} / ${maxUses}` : `${uses} / в€ћ`;
            usageTop.append(usageLabel, usageValue);
            const track = document.createElement("div");
            track.className = "coupon-usage-track";
            track.setAttribute("role", "progressbar");
            track.setAttribute("aria-label", "РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РєСѓРїРѕРЅР°");
            track.setAttribute("aria-valuemin", "0");
            track.setAttribute("aria-valuemax", hasLimit ? String(maxUses) : "100");
            track.setAttribute("aria-valuenow", String(hasLimit ? Math.min(uses, maxUses) : Math.min(uses, 100)));
            const progress = document.createElement("span");
            progress.style.width = `${hasLimit ? Math.min(100, uses / maxUses * 100) : Math.min(100, uses)}%`;
            track.append(progress);
            usage.append(usageTop, track);

            const meta = document.createElement("div");
            meta.className = "coupon-card-meta";
            const dates = document.createElement("span");
            dates.textContent = `РЎСЂРѕРє: ${formatDate(coupon.startAt)} вЂ” ${formatDate(coupon.endAt)}`;
            const partnerCount = Array.isArray(coupon.partners) ? coupon.partners.length : 0;
            const partners = document.createElement("span");
            partners.textContent = partnerCount ? `РџР°СЂС‚РЅС‘СЂРѕРІ: ${partnerCount}` : "Р‘РµР· РїР°СЂС‚РЅС‘СЂРѕРІ";
            meta.append(dates, partners);
            card.append(top, titleRow, codeRow, usage, meta);
            couponGrid.append(card);
        });

        const totalUses = coupons.reduce((sum, coupon) => sum + Math.max(0, Number(coupon.uses) || 0), 0);
        document.querySelector("#stat-total").textContent = String(coupons.length);
        document.querySelector("#stat-active").textContent = String(coupons.filter(coupon => getCouponStatus(coupon).label === "РђРєС‚РёРІРµРЅ").length);
        document.querySelector("#stat-uses").textContent = String(totalUses);
        couponCount.textContent = `${coupons.length} ${coupons.length === 1 ? "РєСѓРїРѕРЅ" : coupons.length > 1 && coupons.length < 5 ? "РєСѓРїРѕРЅР°" : "РєСѓРїРѕРЅРѕРІ"}`;
        couponEmpty.hidden = coupons.length > 0;
        couponGrid.hidden = coupons.length === 0;
    }

    function renderProductOptions(selectedIds = []) {
        productList.replaceChildren();
        const products = Array.isArray(shop.products) ? shop.products : [];
        document.querySelector("#coupon-products-empty").hidden = products.length > 0;
        products.forEach(product => {
            const label = document.createElement("label");
            label.className = "coupon-product-option";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "productIds";
            checkbox.value = product.id;
            checkbox.checked = selectedIds.includes(product.id);
            const thumb = document.createElement("span");
            thumb.className = "coupon-product-thumb";
            const initials = Array.from(product.name || "?").slice(0, 1).join("").toUpperCase();
            thumb.textContent = initials;
            if (typeof product.image === "string" && product.image) {
                const image = document.createElement("img");
                image.alt = "";
                image.hidden = true;
                image.setAttribute("aria-hidden", "true");
                image.addEventListener("load", () => {
                    if (thumb.isConnected) {
                        image.hidden = false;
                        thumb.replaceChildren(image);
                    }
                }, { once: true });
                image.addEventListener("error", () => {
                    if (thumb.isConnected) {
                        image.title = "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С„РѕС‚Рѕ С‚РѕРІР°СЂР°";
                        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С„РѕС‚Рѕ С‚РѕРІР°СЂР° В«${product.name || "Р‘РµР· РЅР°Р·РІР°РЅРёСЏ"}В».`);
                    }
                }, { once: true });
                thumb.append(image);
                const assetKey = window.sdonateImageStorage.keyFromReference(product.image);
                if (assetKey) {
                    window.sdonateImageStorage.get(assetKey).then(source => {
                        if (!source) {
                            throw new Error("Р¤РѕС‚Рѕ РЅРµ РЅР°Р№РґРµРЅРѕ РІ С…СЂР°РЅРёР»РёС‰Рµ.");
                        }
                        if (thumb.isConnected) {
                            image.src = source;
                        }
                    }).catch(error => {
                        if (thumb.isConnected) {
                            image.title = error.message;
                            showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С„РѕС‚Рѕ С‚РѕРІР°СЂР° В«${product.name || "Р‘РµР· РЅР°Р·РІР°РЅРёСЏ"}В»: ${error.message}`);
                        }
                    });
                } else {
                    image.src = product.image;
                }
            }
            const copy = document.createElement("span");
            copy.className = "coupon-product-copy";
            const title = document.createElement("b");
            title.textContent = product.name || "РўРѕРІР°СЂ Р±РµР· РЅР°Р·РІР°РЅРёСЏ";
            const detail = document.createElement("small");
            detail.textContent = [product.category || "РўРѕРІР°СЂ", Number.isFinite(Number(product.price)) ? `${product.price} в‚Ѕ` : ""].filter(Boolean).join(" В· ");
            copy.append(title, detail);
            label.append(checkbox, thumb, copy);
            productList.append(label);
        });
    }

    function renderPartnerOptions(selectedPartners = []) {
        partnerList.replaceChildren();
        const partners = shop.tools && Array.isArray(shop.tools.partners) ? shop.tools.partners : [];
        document.querySelector("#coupon-partners-empty").hidden = partners.length > 0;
        partners.forEach((partner, index) => {
            const partnerId = partner.id || `legacy-partner-${index}`;
            const saved = selectedPartners.find(item => item.id === partnerId);
            const label = document.createElement("label");
            label.className = "coupon-partner-option";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "partnerIds";
            checkbox.value = partnerId;
            checkbox.checked = Boolean(saved);
            const copy = document.createElement("span");
            copy.className = "coupon-partner-copy";
            const name = document.createElement("b");
            name.textContent = partner.name || "РџР°СЂС‚РЅС‘СЂ";
            const detail = document.createElement("small");
            detail.textContent = partner.detail || "РџР°СЂС‚РЅС‘СЂ РјР°РіР°Р·РёРЅР°";
            copy.append(name, detail);
            const commission = document.createElement("input");
            commission.className = "coupon-partner-commission";
            commission.type = "number";
            commission.name = `commission-${partnerId}`;
            commission.min = "0";
            commission.max = "100";
            commission.step = "1";
            commission.value = saved ? String(saved.commissionPercent) : "10";
            commission.setAttribute("aria-label", `РџСЂРѕС†РµРЅС‚ РїР°СЂС‚РЅС‘СЂР° ${partner.name || ""}`);
            commission.disabled = !checkbox.checked;
            checkbox.addEventListener("change", () => {
                commission.disabled = !checkbox.checked;
            });
            label.append(checkbox, copy, commission);
            partnerList.append(label);
        });
    }

    function openCouponDialog(coupon = null) {
        form.reset();
        formFeedback.hidden = true;
        document.querySelector("#coupon-dialog-title").textContent = coupon ? "Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ РєСѓРїРѕРЅР°" : "Р”РѕР±Р°РІР»РµРЅРёРµ РєСѓРїРѕРЅР°";
        form.elements.id.value = coupon ? coupon.id : "";
        form.elements.name.value = coupon ? coupon.name || "" : "";
        form.elements.code.value = coupon ? coupon.code || "" : "";
        form.elements.discount.value = coupon ? String(coupon.discount || 10) : "10";
        form.elements.maxUses.value = coupon && coupon.maxUses ? String(coupon.maxUses) : "";
        form.elements.startAt.value = coupon ? coupon.startAt || "" : "";
        form.elements.endAt.value = coupon ? coupon.endAt || "" : "";
        form.elements.active.checked = coupon ? coupon.active !== false : true;
        renderProductOptions(coupon && Array.isArray(coupon.productIds) ? coupon.productIds : []);
        renderPartnerOptions(coupon && Array.isArray(coupon.partners) ? coupon.partners : []);
        dialog.showModal();
        form.elements.name.focus();
    }

    function getFormPartners() {
        const partners = shop.tools && Array.isArray(shop.tools.partners) ? shop.tools.partners : [];
        return Array.from(form.querySelectorAll('input[name="partnerIds"]:checked'), checkbox => {
            const index = partners.findIndex((partner, partnerIndex) =>
                (partner.id || `legacy-partner-${partnerIndex}`) === checkbox.value
            );
            const partner = partners[index];
            const commissionInput = form.elements[`commission-${checkbox.value}`];
            const commissionPercent = Number(commissionInput.value);
            if (!Number.isInteger(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
                throw new Error(`РЈРєР°Р¶Рё РїСЂРѕС†РµРЅС‚ РїР°СЂС‚РЅС‘СЂР° В«${partner.name || "РџР°СЂС‚РЅС‘СЂ"}В» РѕС‚ 0 РґРѕ 100.`);
            }
            if (!partner.id) {
                partner.id = checkbox.value;
            }
            return { id: checkbox.value, name: partner.name || "РџР°СЂС‚РЅС‘СЂ", commissionPercent };
        });
    }

    function saveCoupon(event) {
        event.preventDefault();
        formFeedback.hidden = true;
        if (!form.reportValidity()) {
            return;
        }
        const name = form.elements.name.value.trim();
        const code = form.elements.code.value.trim().toUpperCase();
        const discount = Number(form.elements.discount.value);
        const maxUses = form.elements.maxUses.value ? Number(form.elements.maxUses.value) : null;
        const startAt = form.elements.startAt.value;
        const endAt = form.elements.endAt.value;
        if (!/^[A-Z0-9_-]{2,32}$/.test(code)) {
            formFeedback.textContent = "РљРѕРґ: РѕС‚ 2 РґРѕ 32 СЃРёРјРІРѕР»РѕРІ вЂ” С‚РѕР»СЊРєРѕ Р»Р°С‚РёРЅСЃРєРёРµ Р±СѓРєРІС‹, С†РёС„СЂС‹, РґРµС„РёСЃ Рё РїРѕРґС‡С‘СЂРєРёРІР°РЅРёРµ.";
            formFeedback.hidden = false;
            form.elements.code.focus();
            return;
        }
        if (!Number.isInteger(discount) || discount < 1 || discount > 100) {
            formFeedback.textContent = "Р Р°Р·РјРµСЂ СЃРєРёРґРєРё РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ С†РµР»С‹Рј С‡РёСЃР»РѕРј РѕС‚ 1 РґРѕ 100.";
            formFeedback.hidden = false;
            form.elements.discount.focus();
            return;
        }
        if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
            formFeedback.textContent = "Р›РёРјРёС‚ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёР№ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РїРѕР»РѕР¶РёС‚РµР»СЊРЅС‹Рј С†РµР»С‹Рј С‡РёСЃР»РѕРј.";
            formFeedback.hidden = false;
            form.elements.maxUses.focus();
            return;
        }
        if (startAt && endAt && new Date(startAt).getTime() > new Date(endAt).getTime()) {
            formFeedback.textContent = "Р”Р°С‚Р° РѕРєРѕРЅС‡Р°РЅРёСЏ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ СЂР°РЅСЊС€Рµ РґР°С‚С‹ РЅР°С‡Р°Р»Р°.";
            formFeedback.hidden = false;
            form.elements.endAt.focus();
            return;
        }

        const coupons = allCoupons();
        const id = form.elements.id.value;
        if (coupons.some(item => item.id !== id && String(item.code).toUpperCase() === code)) {
            formFeedback.textContent = "РўР°РєРѕР№ РєРѕРґ СѓР¶Рµ РµСЃС‚СЊ РІ СЌС‚РѕРј РјР°РіР°Р·РёРЅРµ.";
            formFeedback.hidden = false;
            form.elements.code.focus();
            return;
        }

        let partners;
        try {
            partners = getFormPartners();
        } catch (error) {
            formFeedback.textContent = error.message;
            formFeedback.hidden = false;
            return;
        }

        const existing = coupons.find(item => item.id === id);
        const updated = {
            id: id || createId(),
            name,
            code,
            discount,
            maxUses,
            uses: existing ? Math.max(0, Number(existing.uses) || 0) : 0,
            startAt,
            endAt,
            productIds: Array.from(form.querySelectorAll('input[name="productIds"]:checked'), checkbox => checkbox.value),
            partners,
            active: form.elements.active.checked
        };
        try {
            shop.coupons = [...coupons.filter(item => item.id !== id), updated];
            saveShop();
            dialog.close();
            renderCoupons();
            showToast(existing ? "РР·РјРµРЅРµРЅРёСЏ РєСѓРїРѕРЅР° СЃРѕС…СЂР°РЅРµРЅС‹." : "РљСѓРїРѕРЅ РґРѕР±Р°РІР»РµРЅ РІ РґРµРјРѕ-РјР°РіР°Р·РёРЅ.");
        } catch (error) {
            formFeedback.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РєСѓРїРѕРЅ: ${error.message}`;
            formFeedback.hidden = false;
        }
    }

    document.querySelector("#add-coupon").addEventListener("click", () => openCouponDialog());
    document.querySelector("#empty-add-coupon").addEventListener("click", () => openCouponDialog());
    document.querySelector("#close-coupon-dialog").addEventListener("click", () => dialog.close());
    document.querySelector("#cancel-coupon").addEventListener("click", () => dialog.close());
    form.addEventListener("submit", saveCoupon);

    couponGrid.addEventListener("click", async event => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }
        const coupons = allCoupons();
        const coupon = coupons.find(item => item.id === button.dataset.couponId);
        if (!coupon) {
            showToast("РљСѓРїРѕРЅ РЅРµ РЅР°Р№РґРµРЅ. РћР±РЅРѕРІРёС‚Рµ СЃС‚СЂР°РЅРёС†Сѓ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ СЃРЅРѕРІР°.");
            return;
        }
        if (button.dataset.action === "edit") {
            openCouponDialog(coupon);
        } else if (button.dataset.action === "toggle") {
            try {
                shop.coupons = coupons.map(item => item.id === coupon.id ? { ...item, active: item.active === false } : item);
                saveShop();
                renderCoupons();
                showToast(coupon.active === false ? "РљСѓРїРѕРЅ РІРєР»СЋС‡С‘РЅ." : "РљСѓРїРѕРЅ РІС‹РєР»СЋС‡РµРЅ.");
            } catch (error) {
                showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ РёР·РјРµРЅРёС‚СЊ РєСѓРїРѕРЅ: ${error.message}`);
            }
        } else if (button.dataset.action === "delete") {
            pendingDeleteId = coupon.id;
            document.querySelector("#coupon-delete-name").textContent = coupon.name;
            deleteDialog.showModal();
        } else if (button.dataset.action === "copy") {
            try {
                if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
                    throw new Error("РљРѕРїРёСЂРѕРІР°РЅРёРµ РЅРµРґРѕСЃС‚СѓРїРЅРѕ РІ Р±СЂР°СѓР·РµСЂРµ.");
                }
                await navigator.clipboard.writeText(coupon.code);
                showToast("РљРѕРґ РєСѓРїРѕРЅР° СЃРєРѕРїРёСЂРѕРІР°РЅ.");
            } catch (error) {
                showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СЃРєРѕРїРёСЂРѕРІР°С‚СЊ РєРѕРґ: ${error.message}`);
            }
        }
    });

    document.querySelector("#cancel-coupon-delete").addEventListener("click", () => {
        pendingDeleteId = null;
        deleteDialog.close();
    });
    document.querySelector("#confirm-coupon-delete").addEventListener("click", () => {
        try {
            shop.coupons = allCoupons().filter(coupon => coupon.id !== pendingDeleteId);
            saveShop();
            renderCoupons();
            deleteDialog.close();
            showToast("РљСѓРїРѕРЅ СѓРґР°Р»С‘РЅ.");
        } catch (error) {
            showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РєСѓРїРѕРЅ: ${error.message}`);
        } finally {
            pendingDeleteId = null;
        }
    });

    document.querySelector("#logout-button").addEventListener("click", () => {
        sessionStorage.removeItem("sdonate-demo-authenticated");
        window.location.assign("./reg.html?mode=login");
    });

    try {
        shops = readShops();
        shop = shops.find(item => item.id === shopId);
        if (!shop) {
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ РёР»Рё СѓР¶Рµ СѓРґР°Р»С‘РЅ.");
        }
        shop.tools = shop.tools && typeof shop.tools === "object" ? shop.tools : {};
        shop.products = Array.isArray(shop.products) ? shop.products : [];
        shop.coupons = allCoupons();
        document.title = `РљСѓРїРѕРЅС‹ вЂ” ${shop.name} вЂ” SDonate`;
        document.querySelector("#coupons-shop-caption").textContent = `РЈРїСЂР°РІР»СЏР№С‚Рµ РєСѓРїРѕРЅР°РјРё РјР°РіР°Р·РёРЅР° В«${shop.name}В»`;
        renderCoupons();
    } catch (error) {
        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РєСѓРїРѕРЅС‹: ${error.message}`);
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    }
})();

})();

// Source: dashboard.js
(() => {
if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
    window.location.replace("./reg.html?mode=login");
} else {
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
    const greetingName = document.querySelector("#greeting-name");
    const accountName = document.querySelector("#account-name");
    const accountAvatar = document.querySelector("#account-avatar");
    const dateLabel = document.querySelector("#current-date");
    const logoutButton = document.querySelector("#logout-button");
    const currentDate = new Date();
    const chartStyle = sessionStorage.getItem("sdonate-demo-chart") || "area";

    fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
        .then(response => response.ok ? response.json() : null)
        .then(result => {
            if (result && result.user.isAdmin === true) {
                document.querySelector("#admin-preview-link").hidden = false;
            }
        })
        .catch(error => console.error("РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕРІРµСЂРёС‚СЊ СЂРѕР»СЊ Р°РєРєР°СѓРЅС‚Р°:", error));

    document.querySelectorAll(".chart").forEach(chart => {
        chart.classList.add(`chart-style-${chartStyle}`);
    });

    greetingName.textContent = nickname;
    accountName.textContent = nickname;
    accountAvatar.textContent = Array.from(nickname)[0].toUpperCase();
    dateLabel.dateTime = [
        currentDate.getFullYear(),
        String(currentDate.getMonth() + 1).padStart(2, "0"),
        String(currentDate.getDate()).padStart(2, "0")
    ].join("-");
    dateLabel.textContent = new Intl.DateTimeFormat("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long"
    }).format(currentDate);
    const hour = currentDate.getHours();
    document.querySelector(".welcome").firstChild.textContent = hour < 5
        ? "Р”РѕР±СЂРѕР№ РЅРѕС‡Рё, "
        : hour < 12
            ? "Р”РѕР±СЂРѕРµ СѓС‚СЂРѕ, "
            : hour < 18
                ? "Р”РѕР±СЂС‹Р№ РґРµРЅСЊ, "
                : "Р”РѕР±СЂС‹Р№ РІРµС‡РµСЂ, ";

    logoutButton.addEventListener("click", async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: "{}"
            });
        } finally {
            sessionStorage.removeItem("sdonate-demo-authenticated");
            sessionStorage.removeItem("sdonate-demo-nickname");
            sessionStorage.removeItem("sdonate-demo-email");
            window.location.assign("./reg.html?mode=login");
        }
    });

    const periods = {
        day: {
            caption: "Р·Р° 24 С‡Р°СЃР°",
            labels: ["00:00", "06:00", "12:00", "18:00", "23:59"]
        },
        week: {
            caption: "Р·Р° 7 РґРЅРµР№",
            labels: ["РџРЅ", "Р’С‚", "РЎСЂ", "Р§С‚", "РџС‚"]
        },
        month: {
            caption: "Р·Р° 30 РґРЅРµР№",
            labels: ["1", "8", "15", "22", "30"]
        },
        all: {
            caption: "Р·Р° РІСЃС‘ РІСЂРµРјСЏ",
            labels: ["2022", "2023", "2024", "2025", "2026"]
        }
    };

    document.querySelectorAll(".period-switch").forEach(switcher => {
        switcher.addEventListener("click", event => {
            const button = event.target.closest(".period-button");

            if (!button) {
                return;
            }

            const period = periods[button.dataset.period];

            if (!period) {
                return;
            }

            switcher.querySelectorAll(".period-button").forEach(option => {
                const active = option === button;
                option.classList.toggle("active", active);
                option.setAttribute("aria-pressed", String(active));
            });

            const chartType = switcher.dataset.chart;
            document.querySelector(`[data-caption="${chartType}"]`).textContent = period.caption;

            const labels = switcher.closest(".stat-card").querySelectorAll(".chart-labels span");
            labels.forEach((label, index) => {
                label.textContent = period.labels[index];
            });
            const chart = switcher.closest(".stat-card").querySelector(".chart");
            chart.classList.remove("chart-period-change");
            requestAnimationFrame(() => {
                chart.classList.add("chart-period-change");
                window.setTimeout(() => chart.classList.remove("chart-period-change"), 300);
            });
        });
    });
}

})();

// Source: finance.js
(() => {
if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
    window.location.replace("./reg.html?mode=login");
} else {
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
    const accountName = document.querySelector("#account-name");
    const accountAvatar = document.querySelector("#account-avatar");
    const financeAccountName = document.querySelector("#finance-account-name");
    const dateLabel = document.querySelector("#current-date");
    const logoutButton = document.querySelector("#logout-button");
    const dialog = document.querySelector("#finance-dialog");
    const actionForm = document.querySelector("#demo-action-form");
    const dialogTitle = document.querySelector("#dialog-title");
    const dialogDescription = document.querySelector("#dialog-description");
    const dialogIcon = document.querySelector("#dialog-icon");
    const fieldLabel = document.querySelector("#dialog-field-label");
    const amountInput = document.querySelector("#demo-amount");
    const methodField = document.querySelector("#dialog-method-field");
    const methodSelect = document.querySelector("#demo-method");
    const dialogSuffix = document.querySelector("#dialog-suffix");
    const dialogMessage = document.querySelector("#dialog-message");
    const dialogSubmit = document.querySelector("#dialog-submit");
    const toast = document.querySelector("#finance-toast");
    const currentDate = new Date();
    let dialogMode = "withdraw";
    let toastTimer;

    accountName.textContent = nickname;
    accountAvatar.textContent = Array.from(nickname)[0].toUpperCase();
    financeAccountName.textContent = nickname;
    dateLabel.dateTime = [
        currentDate.getFullYear(),
        String(currentDate.getMonth() + 1).padStart(2, "0"),
        String(currentDate.getDate()).padStart(2, "0")
    ].join("-");
    dateLabel.textContent = new Intl.DateTimeFormat("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long"
    }).format(currentDate);

    function showToast(text) {
        window.clearTimeout(toastTimer);
        toast.textContent = text;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 3500);
    }

    function openFinanceDialog(mode) {
        dialogMode = mode;
        dialogMessage.hidden = true;
        dialogMessage.textContent = "";
        amountInput.value = "";
        amountInput.required = mode !== "withdraw";
        dialogSubmit.type = "submit";
        methodSelect.value = methodSelect.options[0].value;
        methodField.hidden = mode !== "withdraw";

        if (mode === "card") {
            dialogIcon.textContent = "в–¤";
            dialogTitle.textContent = "РџСЂРёРІСЏР·Р°С‚СЊ РєР°СЂС‚Сѓ";
            dialogDescription.textContent = "Р‘Р°РЅРєРѕРІСЃРєРёРµ РєР°СЂС‚С‹ РїРѕРєР° РЅРµ РїРѕРґРєР»СЋС‡РµРЅС‹. РќРµ РІРІРѕРґРё РЅР°СЃС‚РѕСЏС‰РёРµ РїР»Р°С‚С‘Р¶РЅС‹Рµ РґР°РЅРЅС‹Рµ.";
            fieldLabel.textContent = "РќР°Р·РІР°РЅРёРµ РґРµРјРѕ-СЂРµРєРІРёР·РёС‚Р°";
            amountInput.type = "text";
            amountInput.placeholder = "РќР°РїСЂРёРјРµСЂ, РњРѕСЏ РєР°СЂС‚Р°";
            dialogSuffix.hidden = true;
            dialogSubmit.textContent = "РџРѕРЅСЏС‚РЅРѕ";
        } else if (mode === "wallet") {
            dialogIcon.textContent = "в‚®";
            dialogTitle.textContent = "USDT-РєРѕС€РµР»С‘Рє";
            dialogDescription.textContent = "РљСЂРёРїС‚РѕРІР°Р»СЋС‚РЅС‹Рµ РІС‹РїР»Р°С‚С‹ РїРѕРєР° РЅРµ РїРѕРґРєР»СЋС‡РµРЅС‹. РќРµ РІРІРѕРґРё РЅР°СЃС‚РѕСЏС‰РёР№ Р°РґСЂРµСЃ РєРѕС€РµР»СЊРєР°.";
            fieldLabel.textContent = "РњРµС‚РєР° РґРµРјРѕ-СЂРµРєРІРёР·РёС‚Р°";
            amountInput.type = "text";
            amountInput.placeholder = "РќР°РїСЂРёРјРµСЂ, РњРѕР№ РєРѕС€РµР»С‘Рє";
            dialogSuffix.hidden = true;
            dialogSubmit.textContent = "РџРѕРЅСЏС‚РЅРѕ";
        } else {
            dialogIcon.textContent = "в†—";
            dialogTitle.textContent = "Р’С‹РІРµСЃС‚Рё СЃСЂРµРґСЃС‚РІР°";
            dialogDescription.textContent = "Р—Р°СЏРІРєР° РЅРµ Р±СѓРґРµС‚ РѕС‚РїСЂР°РІР»РµРЅР°. Р РµР°Р»СЊРЅС‹Рµ С„РёРЅР°РЅСЃРѕРІС‹Рµ РѕРїРµСЂР°С†РёРё РїРѕРєР° РЅРµ РїРѕРґРєР»СЋС‡РµРЅС‹.";
            fieldLabel.textContent = "РЎСѓРјРјР° РІС‹РІРѕРґР°";
            amountInput.type = "number";
            amountInput.min = "1";
            amountInput.step = "1";
            amountInput.placeholder = "РќР°РїСЂРёРјРµСЂ, 100";
            dialogSuffix.hidden = false;
            dialogSubmit.textContent = "РџРѕРєР°Р·Р°С‚СЊ РґРµРјРѕ";
        }

        dialog.showModal();
    }

    document.querySelector("#withdraw-open").addEventListener("click", () => {
        openFinanceDialog("withdraw");
    });

    document.querySelectorAll("[data-method]").forEach(button => {
        button.addEventListener("click", () => {
            openFinanceDialog(button.dataset.method);
        });
    });

    dialogSubmit.addEventListener("click", () => {
        if (dialogSubmit.type === "button") {
            dialog.close();
        }
    });

    actionForm.addEventListener("submit", event => {
        event.preventDefault();

        if (dialogMode === "withdraw" && (!amountInput.value || Number(amountInput.value) <= 0)) {
            amountInput.reportValidity();
            return;
        }

        if (dialogMode === "withdraw") {
            dialogMessage.textContent = "Р”РµРјРѕ: Р·Р°СЏРІРєР° РЅР° РІС‹РІРѕРґ РЅРµ РѕС‚РїСЂР°РІР»РµРЅР°. Р”Р»СЏ РІС‹РїР»Р°С‚ РЅСѓР¶РµРЅ РїРѕРґРєР»СЋС‡С‘РЅРЅС‹Р№ СЃРµСЂРІРµСЂ Рё РїР»Р°С‚С‘Р¶РЅС‹Р№ РїСЂРѕРІР°Р№РґРµСЂ.";
        } else {
            dialogMessage.textContent = "Р”РµРјРѕ: СЂРµРєРІРёР·РёС‚ РЅРµ СЃРѕС…СЂР°РЅС‘РЅ. РџРѕРґРєР»СЋС‡РµРЅРёРµ РїР»Р°С‚С‘Р¶РЅС‹С… РјРµС‚РѕРґРѕРІ РїРѕРєР° РЅРµРґРѕСЃС‚СѓРїРЅРѕ.";
        }

        dialogMessage.hidden = false;
        dialogSubmit.textContent = "Р—Р°РєСЂС‹С‚СЊ";
        dialogSubmit.type = "button";
    });

    dialog.addEventListener("close", () => {
        dialogSubmit.type = "submit";
        dialogSubmit.textContent = dialogMode === "withdraw" ? "РџРѕРєР°Р·Р°С‚СЊ РґРµРјРѕ" : "РџРѕРЅСЏС‚РЅРѕ";
    });

    document.querySelector("#autopayout-toggle").addEventListener("change", event => {
        showToast(event.target.checked
            ? "Р”РµРјРѕ-РЅР°СЃС‚СЂРѕР№РєР° РІРєР»СЋС‡РµРЅР° С‚РѕР»СЊРєРѕ РІ СЌС‚РѕРј РѕРєРЅРµ. Р’С‹РїР»Р°С‚С‹ РЅРµ РІС‹РїРѕР»РЅСЏСЋС‚СЃСЏ."
            : "Р”РµРјРѕ-РЅР°СЃС‚СЂРѕР№РєР° РІС‹РєР»СЋС‡РµРЅР°.");
    });

    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("sdonate-demo-authenticated");
        window.location.assign("./reg.html?mode=login");
    });
}

})();

// Source: mine.js
(() => {
const translations = {
    ru: {
        navFeatures: "Р’РѕР·РјРѕР¶РЅРѕСЃС‚Рё",
        navHow: "РљР°Рє СЂР°Р±РѕС‚Р°РµС‚",
        navFaq: "Р’РѕРїСЂРѕСЃС‹",
        login: "Р’РѕР№С‚Рё",
        createShop: "РЎРѕР·РґР°С‚СЊ РјР°РіР°Р·РёРЅ",
        platform: "РџР»Р°С‚С„РѕСЂРјР° РґР»СЏ Minecraft-СЃРµСЂРІРµСЂРѕРІ",
        title: 'РўРІРѕР№ СЃРµСЂРІРµСЂ.<br><span>РўРІРѕР№ РјР°РіР°Р·РёРЅ.</span>',
        description: "Р—Р°РїСѓСЃС‚Рё РјР°РіР°Р·РёРЅ СЃРµСЂРІРµСЂР° Р±РµР· Р»РёС€РЅРµР№ РЅР°СЃС‚СЂРѕР№РєРё. РџСЂРёРІРёР»РµРіРёРё, РЅР°Р±РѕСЂС‹ Рё Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ РІС‹РґР°С‡Р° РїРѕРєСѓРїРѕРє вЂ” РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ.",
        seeHow: "РџРѕСЃРјРѕС‚СЂРµС‚СЊ, РєР°Рє СЌС‚Рѕ СЂР°Р±РѕС‚Р°РµС‚",
        featureSecure: "РРЅС‚РµРіСЂР°С†РёСЏ РїР»Р°С‚РµР¶РµР№",
        featureSupport: "РџРѕРґРґРµСЂР¶РєР° 24/7",
        featureAuto: "РђРІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ РІС‹РґР°С‡Р°",
        dashMenu: "РњР•РќР®",
        dashOverview: "РћР±Р·РѕСЂ",
        dashProducts: "РўРѕРІР°СЂС‹",
        dashOrders: "Р—Р°РєР°Р·С‹",
        dashSettings: "РќР°СЃС‚СЂРѕР№РєРё",
        dashOwner: "Р’Р»Р°РґРµР»РµС†",
        dashWelcome: "РЎ РІРѕР·РІСЂР°С‰РµРЅРёРµРј, BlockWorld",
        dashLive: "РњР°РіР°Р·РёРЅ Р°РєС‚РёРІРµРЅ",
        dashToday: "Р’РђРЁРђ РЎРўРђРўРРЎРўРРљРђ",
        dashTitle: "РћР±Р·РѕСЂ РјР°РіР°Р·РёРЅР°",
        dashPeriod: "РџРѕСЃР»РµРґРЅРёРµ 7 РґРЅРµР№вЊ„",
        dashRevenue: "Р’С‹СЂСѓС‡РєР°",
        dashOrdersCount: "Р—Р°РєР°Р·С‹",
        dashAverage: "РЎСЂРµРґРЅРёР№ С‡РµРє",
        dashCompare: "Рє РїСЂРѕС€Р»РѕР№ РЅРµРґРµР»Рµ",
        dashAverageHint: "Р·Р° СЌС‚РѕС‚ РїРµСЂРёРѕРґ",
        dashChartTitle: "Р”РёРЅР°РјРёРєР° РїСЂРѕРґР°Р¶",
        dashChartHint: "Р’С‹СЂСѓС‡РєР° Р·Р° РЅРµРґРµР»СЋ",
        dashRecent: "РџРѕСЃР»РµРґРЅРёРµ Р·Р°РєР°Р·С‹",
        dashAll: "Р’СЃРµ Р·Р°РєР°Р·С‹ в†—",
        dashPaid: "РћРїР»Р°С‡РµРЅРѕ",
        heroNote: "РРќРЎРўР РЈРњР•РќРўР« Р”Р›РЇ Р РћРЎРўРђ РўР’РћР•Р“Рћ РЎР•Р Р’Р•Р Рђ",
        trustTitle: "Р’РЎРЃ РќРЈР–РќРћР• Р”Р›РЇ РўР’РћР•Р“Рћ РњРђР“РђР—РРќРђ",
        trustOne: "Р’РёС‚СЂРёРЅР° С‚РѕРІР°СЂРѕРІ",
        trustTwo: "РЈРїСЂР°РІР»РµРЅРёРµ Р·Р°РєР°Р·Р°РјРё",
        trustThree: "РђРІС‚РѕРІС‹РґР°С‡Р° РїРѕРєСѓРїРѕРє",
        featuresLabel: "Р’РЎРЃ РџРћР” РљРћРќРўР РћР›Р•Рњ",
        featuresTitle: 'Р‘РѕР»СЊС€Рµ РІСЂРµРјРµРЅРё<br>РЅР° <span>СЃР°РјСѓ РёРіСЂСѓ</span>',
        featuresIntro: "SDonate РїРѕРјРѕРіР°РµС‚ РЅР°СЃС‚СЂРѕРёС‚СЊ РїСЂРѕРґР°Р¶Рё Рё РѕСЃРІРѕР±РѕРґРёС‚СЊ РІСЂРµРјСЏ РґР»СЏ СЂР°Р·РІРёС‚РёСЏ СЃРµСЂРІРµСЂР° Рё РёРіСЂРѕРІРѕРіРѕ СЃРѕРѕР±С‰РµСЃС‚РІР°.",
        artDelivered: "РљРѕРјР°РЅРґР° РІС‹РїРѕР»РЅРµРЅР°",
        cardAutoTitle: "РђРІС‚РѕРІС‹РґР°С‡Р° С‚РѕРІР°СЂРѕРІ",
        cardAutoText: "РџРѕСЃР»Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ Р·Р°РєР°Р·Р° РЅСѓР¶РЅС‹Рµ РєРѕРјР°РЅРґС‹ РѕС‚РїСЂР°РІР»СЏСЋС‚СЃСЏ РЅР° СЃРµСЂРІРµСЂ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.",
        cardStoreTitle: "Р’РёС‚СЂРёРЅР° РїРѕРґ С‚РІРѕР№ СЃРµСЂРІРµСЂ",
        cardStoreText: "РЎРѕР±РµСЂРё РєР°С‚Р°Р»РѕРі РїСЂРёРІРёР»РµРіРёР№ Рё РЅР°Р±РѕСЂРѕРІ, Р·Р°РґР°Р№ С†РµРЅС‹ Рё РѕС„РѕСЂРјРё СЃС‚СЂР°РЅРёС†Сѓ РІ СЃС‚РёР»Рµ СЃРµСЂРІРµСЂР°.",
        orderDone: "Р“РѕС‚РѕРІРѕ",
        orderWait: "Р’ РѕР±СЂР°Р±РѕС‚РєРµ",
        cardOrdersTitle: "Р—Р°РєР°Р·С‹ Р±РµР· С…Р°РѕСЃР°",
        cardOrdersText: "РСЃС‚РѕСЂРёСЏ РїРѕРєСѓРїРѕРє Рё СЃС‚Р°С‚СѓСЃС‹ РІ РѕРґРЅРѕР№ РїР°РЅРµР»Рё. Р‘С‹СЃС‚СЂРѕ РЅР°С…РѕРґРё РЅСѓР¶РЅС‹Р№ Р·Р°РєР°Р·.",
        howLabel: "РџР РћРЎРўРћ РќРђР§РђРўР¬",
        howTitle: "РћС‚ РёРґРµРё РґРѕ РјР°РіР°Р·РёРЅР° вЂ” С‚СЂРё С€Р°РіР°",
        howDescription: "РќРёРєР°РєРёС… СЃР»РѕР¶РЅС‹С… РЅР°СЃС‚СЂРѕРµРє. РќР°С‡РЅРё СЃ Р±Р°Р·РѕРІРѕРіРѕ РјР°РіР°Р·РёРЅР° Рё СЂР°Р·РІРёРІР°Р№ РµРіРѕ РІРјРµСЃС‚Рµ СЃ СЃРµСЂРІРµСЂРѕРј.",
        step1Title: "РЎРѕР·РґР°Р№ РјР°РіР°Р·РёРЅ",
        step1Text: "Р—Р°РґР°Р№ РЅР°Р·РІР°РЅРёРµ Рё Р°РґСЂРµСЃ СЃРІРѕРµРіРѕ СЃРµСЂРІРµСЂР° вЂ” РѕСЃРЅРѕРІР° РјР°РіР°Р·РёРЅР° РіРѕС‚РѕРІР°.",
        serverName: "РќР°Р·РІР°РЅРёРµ СЃРµСЂРІРµСЂР°",
        step2Title: "Р”РѕР±Р°РІСЊ С‚РѕРІР°СЂС‹",
        step2Text: "РЎРѕР·РґР°Р№ РїСЂРёРІРёР»РµРіРёРё, РЅР°Р±РѕСЂС‹ РёР»Рё РїСЂРµРґРјРµС‚С‹, СѓРєР°Р¶Рё С†РµРЅС‹ Рё РєРѕРјР°РЅРґС‹.",
        step3Title: "РџРѕРґРµР»РёСЃСЊ СЃСЃС‹Р»РєРѕР№",
        step3Text: "РРіСЂРѕРєРё РІС‹Р±РёСЂР°СЋС‚ С‚РѕРІР°СЂС‹ РІ РјР°РіР°Р·РёРЅРµ, Р° С‚С‹ СѓРїСЂР°РІР»СЏРµС€СЊ Р·Р°РєР°Р·Р°РјРё РёР· РїР°РЅРµР»Рё.",
        from1: "РѕС‚ Steve_Mine",
        from2: "РѕС‚ AlexCraft",
        startNow: "РќР°С‡Р°С‚СЊ СЃРµР№С‡Р°СЃ",
        faqLabel: "Р•РЎРўР¬ Р’РћРџР РћРЎР«?",
        faqTitle: 'Р Р°Р·Р±РµСЂС‘РјСЃСЏ<br><span>РІ РґРµС‚Р°Р»СЏС…</span>',
        faqIntro: "РљРѕСЂРѕС‚РєРѕ РѕС‚РІРµС‚РёР»Рё РЅР° С‚Рѕ, С‡С‚Рѕ С‡Р°С‰Рµ РІСЃРµРіРѕ СЃРїСЂР°С€РёРІР°СЋС‚ РїРµСЂРµРґ Р·Р°РїСѓСЃРєРѕРј.",
        faq1Question: "Р§С‚Рѕ С‚Р°РєРѕРµ SDonate?",
        faq1Answer: "Р­С‚Рѕ РїР»Р°С‚С„РѕСЂРјР° РґР»СЏ СЃРѕР·РґР°РЅРёСЏ Рё СѓРїСЂР°РІР»РµРЅРёСЏ РјР°РіР°Р·РёРЅРѕРј Minecraft-СЃРµСЂРІРµСЂР°. Р—РґРµСЃСЊ РјРѕР¶РЅРѕ РѕС„РѕСЂРјРёС‚СЊ С‚РѕРІР°СЂС‹ Рё СЃР»РµРґРёС‚СЊ Р·Р° Р·Р°РєР°Р·Р°РјРё.",
        faq2Question: "РќСѓР¶РµРЅ Р»Рё СЃРѕР±СЃС‚РІРµРЅРЅС‹Р№ СЃР°Р№С‚?",
        faq2Answer: "РќРµС‚. РњР°РіР°Р·РёРЅ РїРѕР»СѓС‡Р°РµС‚ РѕС‚РґРµР»СЊРЅСѓСЋ СЃС‚СЂР°РЅРёС†Сѓ, СЃСЃС‹Р»РєСѓ РЅР° РєРѕС‚РѕСЂСѓСЋ РјРѕР¶РЅРѕ СЂР°Р·РјРµСЃС‚РёС‚СЊ РІ РѕРїРёСЃР°РЅРёРё СЃРµСЂРІРµСЂР° Рё СЃРѕРѕР±С‰РµСЃС‚РІР°.",
        faq3Question: "РљР°Рє СЂР°Р±РѕС‚Р°РµС‚ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ РІС‹РґР°С‡Р°?",
        faq3Answer: "Р”Р»СЏ С‚РѕРІР°СЂР° Р·Р°РґР°СЋС‚СЃСЏ РєРѕРјР°РЅРґС‹, РєРѕС‚РѕСЂС‹Рµ РґРѕР»Р¶РЅС‹ РІС‹РїРѕР»РЅСЏС‚СЊСЃСЏ РЅР° СЃРµСЂРІРµСЂРµ. Р”Р»СЏ СЂРµР°Р»СЊРЅРѕРіРѕ Р·Р°РїСѓСЃРєР° РїРѕС‚СЂРµР±СѓРµС‚СЃСЏ РїРѕРґРєР»СЋС‡РёС‚СЊ СЃРµСЂРІРµСЂ Рё РЅР°СЃС‚СЂРѕРёС‚СЊ РёРЅС‚РµРіСЂР°С†РёСЋ.",
        faq4Question: "РњРѕР¶РЅРѕ Р»Рё РїСЂРёРЅРёРјР°С‚СЊ СЂРµР°Р»СЊРЅС‹Рµ РїР»Р°С‚РµР¶Рё?",
        faq4Answer: "Р­С‚Р° СЃС‚СЂР°РЅРёС†Р° вЂ” РёРЅС‚РµСЂС„РµР№СЃРЅР°СЏ РґРµРјРѕРЅСЃС‚СЂР°С†РёСЏ. РџСЂРёС‘Рј РґРµРЅРµРі, Р°РєРєР°СѓРЅС‚С‹ Рё РІС‹РґР°С‡Р° С‚РѕРІР°СЂРѕРІ РЅРµ РїРѕРґРєР»СЋС‡РµРЅС‹: РґР»СЏ Р·Р°РїСѓСЃРєР° РїРѕРЅР°РґРѕР±РёС‚СЃСЏ backend Рё РґРѕРіРѕРІРѕСЂ СЃ РїР»Р°С‚С‘Р¶РЅС‹Рј РїСЂРѕРІР°Р№РґРµСЂРѕРј.",
        startLabel: "РўР’РћР™ РЎР›Р•Р”РЈР®Р©РР™ РЁРђР“",
        startTitle: 'Р“РѕС‚РѕРІ Р·Р°РїСѓСЃС‚РёС‚СЊ<br><span>РјР°РіР°Р·РёРЅ СЃРµСЂРІРµСЂР°?</span>',
        startText: "РќР°С‡РЅРё СЃ РїСЂРѕСЃС‚РѕРіРѕ вЂ” РЅР°СЃС‚СЂРѕР№ РІРёС‚СЂРёРЅСѓ Рё РїРѕРґРіРѕС‚РѕРІСЊ РјР°РіР°Р·РёРЅ Рє Р·Р°РїСѓСЃРєСѓ.",
        contactUs: "РЎРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚",
        support: "РџРѕРґРґРµСЂР¶РєР°",
        footerText: "РРЅСЃС‚СЂСѓРјРµРЅС‚С‹ РґР»СЏ СЂР°Р·РІРёС‚РёСЏ Minecraft-СЃРѕРѕР±С‰РµСЃС‚РІ.",
        copyright: "В© 2026 SDonate. Р’СЃРµ РїСЂР°РІР° Р·Р°С‰РёС‰РµРЅС‹.",
        demoNote: "Р”РµРјРѕРЅСЃС‚СЂР°С†РёРѕРЅРЅС‹Р№ РёРЅС‚РµСЂС„РµР№СЃ В· РџР»Р°С‚РµР¶Рё РЅРµ РїРѕРґРєР»СЋС‡РµРЅС‹"
    },
    en: {
        navFeatures: "Features",
        navHow: "How it works",
        navFaq: "FAQ",
        login: "Log in",
        createShop: "Create a store",
        platform: "Platform for Minecraft servers",
        title: 'Your server.<br><span>Your store.</span>',
        description: "Launch a server store without the hassle. Ranks, bundles, and automatic delivery вЂ” all in one place.",
        seeHow: "See how it works",
        featureSecure: "Payment integrations",
        featureSupport: "24/7 support",
        featureAuto: "Automatic delivery",
        dashMenu: "MENU",
        dashOverview: "Overview",
        dashProducts: "Products",
        dashOrders: "Orders",
        dashSettings: "Settings",
        dashOwner: "Owner",
        dashWelcome: "Welcome back, BlockWorld",
        dashLive: "Store is live",
        dashToday: "YOUR STATISTICS",
        dashTitle: "Store overview",
        dashPeriod: "Last 7 daysвЊ„",
        dashRevenue: "Revenue",
        dashOrdersCount: "Orders",
        dashAverage: "Average order",
        dashCompare: "vs. last week",
        dashAverageHint: "for this period",
        dashChartTitle: "Sales activity",
        dashChartHint: "Revenue this week",
        dashRecent: "Recent orders",
        dashAll: "All orders в†—",
        dashPaid: "Paid",
        heroNote: "TOOLS TO GROW YOUR SERVER",
        trustTitle: "EVERYTHING YOUR STORE NEEDS",
        trustOne: "Product storefront",
        trustTwo: "Order management",
        trustThree: "Automatic delivery",
        featuresLabel: "IN YOUR CONTROL",
        featuresTitle: 'More time<br>to <span>play the game</span>',
        featuresIntro: "SDonate helps you set up sales and spend more time growing your server and community.",
        artDelivered: "Command executed",
        cardAutoTitle: "Automatic delivery",
        cardAutoText: "Once an order is confirmed, the required commands are sent to your server automatically.",
        cardStoreTitle: "A storefront for your server",
        cardStoreText: "Build a catalog of ranks and bundles, set prices, and style your page to match your server.",
        orderDone: "Complete",
        orderWait: "Processing",
        cardOrdersTitle: "Orders, organized",
        cardOrdersText: "Purchase history and order statuses in one dashboard. Find the order you need quickly.",
        howLabel: "EASY TO START",
        howTitle: "From idea to store in three steps",
        howDescription: "No complicated setup. Start with a simple store and grow it alongside your server.",
        step1Title: "Create your store",
        step1Text: "Add your store name and server address вЂ” your storefront is ready to set up.",
        serverName: "Server name",
        step2Title: "Add products",
        step2Text: "Create ranks, bundles, or items, then set prices and commands.",
        step3Title: "Share your link",
        step3Text: "Players choose products in your store while you manage orders from the dashboard.",
        from1: "from Steve_Mine",
        from2: "from AlexCraft",
        startNow: "Get started",
        faqLabel: "HAVE QUESTIONS?",
        faqTitle: 'LetвЂ™s get into<br><span>the details</span>',
        faqIntro: "Here are quick answers to common questions before getting started.",
        faq1Question: "What is SDonate?",
        faq1Answer: "A platform for creating and managing a Minecraft server store. Set up products and keep track of orders in one place.",
        faq2Question: "Do I need my own website?",
        faq2Answer: "No. Your store gets its own page and link that you can share in your server and community descriptions.",
        faq3Question: "How does automatic delivery work?",
        faq3Answer: "You configure the commands that should run on your server for each product. A live launch requires a server connection and integration setup.",
        faq4Question: "Can I accept real payments?",
        faq4Answer: "This page is a visual demo. Payments, accounts, and product delivery are not connected; a backend and a payment provider agreement are required to launch.",
        startLabel: "YOUR NEXT STEP",
        startTitle: 'Ready to launch<br><span>your server store?</span>',
        startText: "Start simple вЂ” set up your storefront and get your store ready to launch.",
        contactUs: "Create an account",
        support: "Support",
        footerText: "Tools to help Minecraft communities grow.",
        copyright: "В© 2026 SDonate. All rights reserved.",
        demoNote: "Demo interface В· Payments are not connected"
    }
};

function switchLang(lang) {
    const translation = translations[lang];

    if (!translation) {
        return;
    }

    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(element => {
        const value = translation[element.dataset.i18n];

        if (value !== undefined) {
            element.textContent = value;
        }
    });

    document.querySelectorAll("[data-i18n-html]").forEach(element => {
        const value = translation[element.dataset.i18nHtml];

        if (value !== undefined) {
            element.innerHTML = value;
        }
    });

    document.querySelectorAll(".lang-btn").forEach(button => {
        const active = button.dataset.lang === lang;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });

    localStorage.setItem("sdonate-language", lang);
}

document.querySelectorAll(".lang-btn").forEach(button => {
    button.addEventListener("click", () => switchLang(button.dataset.lang));
});

switchLang(localStorage.getItem("sdonate-language") || "ru");

})();

// Source: public-form.js
(() => {
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
            throw new Error("Р’ СЃСЃС‹Р»РєРµ РЅРµ СѓРєР°Р·Р°РЅ РјР°РіР°Р·РёРЅ РёР»Рё С„РѕСЂРјР°.");
        }
        const request = new XMLHttpRequest();
        request.open("GET", `/api/public-shop?owner=${encodeURIComponent(ownerId)}&id=${encodeURIComponent(shopId)}`, false);
        request.send();
        if (request.status !== 200) {
            throw new Error("Р¤РѕСЂРјР° РЅРµ РЅР°Р№РґРµРЅР° РёР»Рё РѕС‚РєР»СЋС‡РµРЅР°.");
        }
        const shop = JSON.parse(request.responseText).shop;
        const forms = shop && shop.tools && Array.isArray(shop.tools.forms) ? shop.tools.forms : [];
        const item = forms.find(entry => entry && entry.id === formId && entry.enabled !== false && Array.isArray(entry.questions));
        if (!item) {
            throw new Error("Р¤РѕСЂРјР° РЅРµ РЅР°Р№РґРµРЅР° РёР»Рё РѕС‚РєР»СЋС‡РµРЅР°.");
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
        document.title = `${item.title} вЂ” ${shop.name}`;
        title.textContent = item.title;
        description.textContent = item.description || "Р—РђРЇР’РљРђ";
        document.querySelector("#public-form-submit").textContent = item.buttonText || "РћС‚РїСЂР°РІРёС‚СЊ";

        item.questions.forEach((question, index) => {
            const label = document.createElement("label");
            label.textContent = question.label + (question.required === false ? "" : " *");
            const long = /РїРѕС‡РµРјСѓ|РѕРїС‹С‚|СЂР°СЃСЃРєР°Р¶|Рѕ СЃРµР±Рµ|РєРѕРјРјРµРЅС‚Р°СЂ/i.test(question.label);
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
                showMessage(`Р—Р°РїРѕР»РЅРёС‚Рµ РїРѕР»Рµ В«${item.questions[missing].label}В».`, true);
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
                    throw new Error(data.error || "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ.");
                }
                form.reset();
                showMessage("Р—Р°СЏРІРєР° РѕС‚РїСЂР°РІР»РµРЅР°. РЎРїР°СЃРёР±Рѕ!", false);
            } catch (error) {
                showMessage(error.message, true);
            }
        });
    } catch (error) {
        document.title = "Р¤РѕСЂРјР° РЅРµРґРѕСЃС‚СѓРїРЅР° вЂ” SDonate";
        title.textContent = "Р¤РѕСЂРјР° РЅРµРґРѕСЃС‚СѓРїРЅР°";
        description.textContent = "Р—РђРЇР’РљРђ";
        errorBox.textContent = error.message;
        errorBox.hidden = false;
    }
})();

})();

// Source: public-page.js
(() => {
(() => {
    const params = new URLSearchParams(window.location.search);
    const shopId = params.get("id");
    const ownerId = params.get("owner");
    const slug = params.get("slug");

    try {
        if (!shopId || !ownerId || !slug) {
            throw new Error("Р’ СЃСЃС‹Р»РєРµ РЅРµ СѓРєР°Р·Р°РЅ РјР°РіР°Р·РёРЅ РёР»Рё Р°РґСЂРµСЃ СЃС‚СЂР°РЅРёС†С‹.");
        }
        const request = new XMLHttpRequest();
        request.open("GET", `/api/public-shop?owner=${encodeURIComponent(ownerId)}&id=${encodeURIComponent(shopId)}`, false);
        request.send();
        if (request.status !== 200) {
            throw new Error("РЎС‚СЂР°РЅРёС†Р° РЅРµ РЅР°Р№РґРµРЅР° РёР»Рё СѓР¶Рµ СѓРґР°Р»РµРЅР°.");
        }
        const shop = JSON.parse(request.responseText).shop;
        const page = shop && shop.tools && Array.isArray(shop.tools.pages)
            ? shop.tools.pages.find(item => item && item.address === slug)
            : null;
        if (!shop || !page) {
            throw new Error("РЎС‚СЂР°РЅРёС†Р° РЅРµ РЅР°Р№РґРµРЅР° РёР»Рё СѓР¶Рµ СѓРґР°Р»РµРЅР°.");
        }

        const pageUrl = `./public-page.html?id=${encodeURIComponent(shop.id)}&owner=${encodeURIComponent(ownerId)}&slug=${encodeURIComponent(page.address)}`;
        document.title = `${page.title} вЂ” ${shop.name}`;
        document.querySelector("#page-store-brand").href = `./public-store.html?id=${encodeURIComponent(shop.id)}&owner=${encodeURIComponent(ownerId)}`;
        document.querySelector("#page-home-link").href = `./public-store.html?id=${encodeURIComponent(shop.id)}&owner=${encodeURIComponent(ownerId)}`;
        document.querySelector("#page-shop-link").href = `./public-store.html?id=${encodeURIComponent(shop.id)}&owner=${encodeURIComponent(ownerId)}`;
        document.querySelector("#standalone-back-link").href = `./public-store.html?id=${encodeURIComponent(shop.id)}&owner=${encodeURIComponent(ownerId)}`;
        document.querySelector("#page-store-name").textContent = shop.name;
        document.querySelector("#page-brand-mark").textContent = Array.from(shop.name.trim() || "S")[0].toUpperCase();
        document.querySelector("#standalone-page-title").textContent = page.title;
        document.querySelector("#standalone-page-description").textContent = page.description || "РРќР¤РћР РњРђР¦РРЇ";
        window.sdonateMarkdown.render(page.content || "", document.querySelector("#standalone-page-content"));
    } catch (error) {
        document.title = "РЎС‚СЂР°РЅРёС†Р° РЅРµРґРѕСЃС‚СѓРїРЅР° вЂ” SDonate";
        document.querySelector("#standalone-page-title").textContent = "РЎС‚СЂР°РЅРёС†Р° РЅРµРґРѕСЃС‚СѓРїРЅР°";
        document.querySelector("#standalone-page-description").textContent = "РџР Р•Р”РџР РћРЎРњРћРўР ";
        window.sdonateMarkdown.render(error.message, document.querySelector("#standalone-page-content"));
    }
})();

})();

// Source: public-store.js
(() => {
(() => {
    const params = new URLSearchParams(window.location.search);
    const shopId = params.get("id");
    const shopOwner = params.get("owner");
    const shopName = document.querySelector("#store-brand-name");
    const brandMark = document.querySelector("#store-brand-mark");
    const hero = document.querySelector("#store-hero");
    const heroImage = document.querySelector("#store-hero-image");
    const additionalImage = document.querySelector("#additional-store-image");
    const additionalImageContent = document.querySelector("#additional-store-image-content");
    const title = document.querySelector("#store-title");
    const description = document.querySelector("#store-description");
    const address = document.querySelector("#server-address");
    const onlineIndicator = document.querySelector("#online-indicator");
    const publicServers = document.querySelector("#public-servers");
    const publicServersGrid = document.querySelector("#public-servers-grid");
    const grid = document.querySelector("#public-products-grid");
    const categories = document.querySelector("#category-list");
    const emptyState = document.querySelector("#store-empty-state");
    const search = document.querySelector("#product-search");
    const cartItems = document.querySelector("#cart-items");
    const cartEmpty = document.querySelector("#cart-empty");
    const cartCount = document.querySelector("#cart-count");
    const cartHeadingCount = document.querySelector("#cart-heading-count");
    const cartTotal = document.querySelector("#cart-total");
    const checkoutButton = document.querySelector("#checkout-button");
    const checkoutDialog = document.querySelector("#checkout-dialog");
    const toast = document.querySelector("#public-store-toast");
    const communityLink = document.querySelector("#community-link");
    const cart = new Map();
    let shop;
    let selectedCategory = "Все";
    let sliderProductId = "";
    let sliderAmount = 0;
    let toastTimer;

    function loadShop() {
        if (!shopId || !shopOwner) {
            throw new Error("Для предпросмотра открой витрину из панели нужного магазина.");
        }
        const request = new XMLHttpRequest();
        request.open("GET", `/api/public-shop?owner=${encodeURIComponent(shopOwner)}&id=${encodeURIComponent(shopId)}`, false);
        request.send();
        if (request.status === 404) {
            throw new Error("Магазин не найден.");
        }
        if (request.status !== 200) {
            throw new Error("Не удалось загрузить магазин. Попробуй позже.");
        }
        const current = JSON.parse(request.responseText).shop;
        return applyMassDiscounts(current);
    }

    function applyMassDiscounts(source) {
        const discounts = source.tools && Array.isArray(source.tools.discounts) ? source.tools.discounts : [];
        if (!discounts.length || !Array.isArray(source.products)) {
            return source;
        }
        const today = new Date().toISOString().slice(0, 10);
        const active = discounts.filter(item => item && Number(item.percent) > 0 &&
            (!item.startAt || item.startAt <= today) && (!item.endAt || item.endAt >= today));
        if (!active.length) {
            return source;
        }
        const products = source.products.map(product => {
            if (!product) return product;
            const percent = active.reduce((best, item) => {
                const ids = Array.isArray(item.productIds) ? item.productIds : [];
                return !ids.length || ids.includes(product.id) ? Math.max(best, Number(item.percent)) : best;
            }, 0);
            if (!percent) return product;
            const base = Number(product.price) || 0;
            return { ...product, oldPrice: base, price: Math.round(base * (100 - percent)) / 100 };
        });
        return { ...source, products };
    }

    function showLoadError(error) {
        document.title = "Витрина недоступна — SDonate";
        shopName.textContent = "Витрина недоступна";
        title.textContent = "Не удалось открыть магазин";
        description.textContent = error.message;
        document.querySelector(".store-hero-kicker").textContent = "ПРЕДПРОСМОТР МАГАЗИНА";
        document.querySelector("#products").hidden = true;
        document.querySelector("#about").hidden = true;
        document.querySelector(".hero-shop-link").hidden = true;
    }

    function formatPrice(value) {
        const price = Number(value);
        if (!Number.isFinite(price) || price < 0) {
            return "—";
        }
        return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(price);
    }

    function getPublicServers() {
        if (!Array.isArray(shop.servers)) {
            return [];
        }
        return shop.servers.filter(server =>
            server &&
            typeof server.name === "string" &&
            typeof server.address === "string" &&
            server.address.trim() &&
            Number.isInteger(server.port) &&
            server.port >= 1 &&
            server.port <= 65535
        );
    }

    async function fetchServerStatus(server) {
        const endpoint = `https://api.mcsrvstat.us/3/${encodeURIComponent(`${server.address.trim()}:${server.port}`)}`;
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 7000);
        try {
            const response = await fetch(endpoint, {
                headers: { Accept: "application/json" },
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`Сервис статуса вернул HTTP ${response.status}.`);
            }
            const result = await response.json();
            if (!result || typeof result.online !== "boolean") {
                throw new Error("Сервис статуса прислал неожиданный ответ.");
            }
            return result;
        } finally {
            window.clearTimeout(timeout);
        }
    }

    function setServerStatusText(element, state, text) {
        element.className = `public-server-status ${state}`;
        element.textContent = text;
    }

    async function refreshPublicServers() {
        const servers = getPublicServers();
        if (!servers.length) {
            publicServers.hidden = true;
            return;
        }

        publicServers.hidden = false;
        publicServersGrid.replaceChildren();
        const onlineTotals = [];
        let offlineCount = 0;
        let unavailableCount = 0;
        let hiddenCount = 0;
        const statusTasks = servers.map(async server => {
            const card = document.createElement("article");
            card.className = "public-server-card";

            const heading = document.createElement("div");
            heading.className = "public-server-card-heading";
            const name = document.createElement("h3");
            name.textContent = server.name;
            const version = document.createElement("span");
            version.textContent = server.version || "Minecraft";
            heading.append(name, version);

            const addressRow = document.createElement("p");
            addressRow.className = "public-server-address";
            const addressLabel = document.createElement("span");
            addressLabel.textContent = "IP";
            const addressValue = document.createElement("b");
            addressValue.textContent = `${server.address}:${server.port}`;
            addressRow.append(addressLabel, addressValue);

            const status = document.createElement("p");
            status.setAttribute("aria-live", "polite");
            setServerStatusText(status, "checking", "Проверяем статус…");
            card.append(heading, addressRow, status);
            publicServersGrid.append(card);

            if (server.excludeOnline) {
                setServerStatusText(status, "hidden-status", "Онлайн скрыт владельцем");
                hiddenCount += 1;
                return;
            }

            try {
                const result = await fetchServerStatus(server);
                if (!result.online) {
                    setServerStatusText(status, "offline", "Сервер офлайн");
                    offlineCount += 1;
                    return;
                }

                const online = Number(result.players && result.players.online);
                const maximum = Number(result.players && result.players.max);
                const validOnline = Number.isFinite(online) && online >= 0;
                const validMaximum = Number.isFinite(maximum) && maximum >= 0;
                const onlineText = validOnline
                    ? `${online} онлайн${validMaximum ? ` из ${maximum}` : ""}`
                    : "Сервер онлайн";
                setServerStatusText(status, "online", onlineText);
                if (validOnline) {
                    onlineTotals.push({ online, maximum: validMaximum ? maximum : null });
                }
            } catch (error) {
                setServerStatusText(status, "unavailable", "Онлайн недоступен");
                unavailableCount += 1;
                console.warn(`Не удалось проверить Minecraft-сервер ${server.address}:${server.port}:`, error);
            }
        });

        await Promise.all(statusTasks);
        if (onlineTotals.length && !onlineIndicator.hidden) {
            const currentPlayers = onlineTotals.reduce((total, item) => total + item.online, 0);
            const maximumPlayers = onlineTotals.every(item => item.maximum !== null)
                ? onlineTotals.reduce((total, item) => total + item.maximum, 0)
                : null;
            onlineIndicator.replaceChildren(
                Object.assign(document.createElement("i"), { className: "online-dot" }),
                document.createTextNode(` ${currentPlayers} онлайн${maximumPlayers === null ? "" : ` из ${maximumPlayers}`}`)
            );
        } else if (!onlineTotals.length && !onlineIndicator.hidden) {
            onlineIndicator.textContent = offlineCount > 0 && unavailableCount === 0
                ? "Сервер офлайн"
                : hiddenCount === servers.length
                    ? "Онлайн скрыт владельцем"
                    : "Онлайн недоступен";
        }
    }

    function getProducts() {
        return Array.isArray(shop.products)
            ? shop.products.filter(product => product && typeof product.id === "string" && typeof product.name === "string")
            : [];
    }

    async function resolveImage(source) {
        const key = window.sdonateImageStorage.keyFromReference(source);
        if (key) {
            return window.sdonateImageStorage.get(key);
        }
        return typeof source === "string" ? source : null;
    }

    function productImage(source, target, alt) {
        if (typeof source !== "string" || !source) {
            return;
        }
        resolveImage(source).then(value => {
            if (!value || !target.isConnected) {
                return;
            }
            const image = document.createElement("img");
            image.src = value;
            image.alt = alt;
            target.querySelectorAll(":scope > :not(.public-product-category)").forEach(node => node.remove());
            target.insertBefore(image, target.firstChild);
        }).catch(error => {
            console.error(`Не удалось загрузить изображение товара «${alt}»: ${error.message}`);
        });
    }

    async function applyStoreImage(source, onLoaded, label) {
        if (typeof source !== "string" || !source) {
            return;
        }
        try {
            const image = await resolveImage(source);
            if (image) {
                onLoaded(image);
            } else {
                console.warn(`Изображение «${label}» не найдено в хранилище.`);
            }
        } catch (error) {
            console.error(`Не удалось загрузить изображение «${label}»: ${error.message}`);
        }
    }

    function renderCategories(products) {
        const names = ["Все", ...new Set(products.map(product => product.category || "Другое"))]
            .slice(1)
            .sort((left, right) => {
                const priorityDifference = getCategoryGroup(left).order - getCategoryGroup(right).order;
                return priorityDifference || left.localeCompare(right, "ru");
            });
        names.unshift("Все");
        if (!names.includes(selectedCategory)) {
            selectedCategory = "Все";
        }
        categories.replaceChildren(...names.map(name => {
            const button = document.createElement("button");
            button.className = `category-button${selectedCategory === name ? " active" : ""}`;
            button.type = "button";
            button.textContent = name;
            button.setAttribute("aria-pressed", String(selectedCategory === name));
            button.addEventListener("click", () => {
                selectedCategory = name;
                renderProducts();
            });
            return button;
        }));
    }

    function getCategoryGroup(category) {
        const normalized = String(category || "").trim().toLocaleLowerCase("ru");
        if (/кейс/.test(normalized)) {
            return { id: "cases", title: "Кейсы", order: 0 };
        }
        if (/привилег|донат|ранг|vip|premium/.test(normalized)) {
            return { id: "donate", title: "Привилегии и донат", order: 1 };
        }
        if (/валют|монет|кристалл|coin/.test(normalized)) {
            return { id: "currency", title: "Валюта", order: 2 };
        }
        if (/предмет|item/.test(normalized)) {
            return { id: "items", title: "Предметы", order: 3 };
        }
        return { id: `other-${normalized || "other"}`, title: category || "Другое", order: 4 };
    }

    function addToCart(product) {
        const existing = cart.get(product.id);
        const stock = Number(product.quantity);
        const quantity = existing ? existing.quantity : 0;
        if (!Number.isFinite(stock) || stock <= quantity) {
            showToast("Больше товара нет в демо-остатке.");
            return;
        }
        cart.set(product.id, { product, quantity: quantity + 1 });
        renderCart();
        showToast(`«${product.name}» добавлен в корзину.`);
    }

    function renderProducts() {
        const products = getProducts();
        renderCategories(products);
        const query = search.value.trim().toLocaleLowerCase("ru");
        const visibleProducts = products.filter(product =>
            (selectedCategory === "Все" || (product.category || "Другое") === selectedCategory) &&
            `${product.name} ${product.description || ""}`.toLocaleLowerCase("ru").includes(query)
        );
        grid.replaceChildren();

        function makeProductCard(product) {
            const card = document.createElement("article");
            card.className = "public-product-card";
            const image = document.createElement("div");
            image.className = "public-product-image";
            image.textContent = "◇";
            const category = document.createElement("span");
            category.className = "public-product-category";
            category.textContent = product.category || "Другое";
            image.append(category);
            productImage(product.image, image, product.name);

            const body = document.createElement("div");
            body.className = "public-product-body";
            const name = document.createElement("h3");
            name.textContent = product.name;
            const productDescription = document.createElement("p");
            productDescription.textContent = product.description || "Поддержи сервер и получи товар в игре.";
            const footer = document.createElement("div");
            footer.className = "public-product-footer";
            const price = document.createElement("span");
            price.className = "public-product-price";
            if (product.oldPrice) {
                const old = document.createElement("s");
                old.className = "public-product-old-price";
                old.textContent = `${formatPrice(product.oldPrice)} ₽ `;
                price.append(old);
            }
            price.append(document.createTextNode(`${formatPrice(product.price)} `));
            const currency = document.createElement("small");
            currency.textContent = "₽";
            price.append(currency);
            const button = document.createElement("button");
            button.className = "add-to-cart";
            button.type = "button";
            button.textContent = Number(product.quantity) > 0 ? "+ В корзину" : "Нет в наличии";
            button.disabled = !Number.isFinite(Number(product.quantity)) || Number(product.quantity) <= 0;
            button.addEventListener("click", () => addToCart(product));
            footer.append(price, button);
            body.append(name, productDescription, footer);
            card.append(image, body);
            return card;
        }

        const productGroups = new Map();
        visibleProducts.forEach(product => {
            const group = getCategoryGroup(product.category || "Другое");
            if (!productGroups.has(group.id)) {
                productGroups.set(group.id, { ...group, products: [] });
            }
            productGroups.get(group.id).products.push(product);
        });
        Array.from(productGroups.values())
            .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title, "ru"))
            .forEach(group => {
                const section = document.createElement("section");
                section.className = "public-product-group";
                const heading = document.createElement("h3");
                heading.className = "public-product-group-heading";
                heading.textContent = group.title;
                const groupGrid = document.createElement("div");
                groupGrid.className = "public-product-group-grid";
                group.products.forEach(product => groupGrid.append(makeProductCard(product)));
                section.append(heading, groupGrid);
                grid.append(section);
            });

        const noProducts = products.length === 0;
        const noMatches = products.length > 0 && visibleProducts.length === 0;
        emptyState.hidden = !noProducts && !noMatches;
        emptyState.querySelector("h3").textContent = noMatches ? "Ничего не найдено" : "Здесь пока тихо";
        emptyState.querySelector("p").textContent = noMatches
            ? "Попробуй изменить поиск или выбрать другую категорию."
            : "Владелец магазина ещё не добавил товары.";
        grid.hidden = noProducts || noMatches;
        categories.hidden = noProducts;
    }

    function renderCart() {
        const items = Array.from(cart.values());
        const count = items.reduce((total, item) => total + item.quantity, 0);
        const total = items.reduce((sum, item) => sum + (Number(item.product.price) || 0) * item.quantity, 0);
        cartCount.textContent = String(count);
        cartHeadingCount.textContent = String(count);
        cartTotal.textContent = `${formatPrice(total)} ₽`;
        cartEmpty.hidden = items.length > 0;
        checkoutButton.disabled = items.length === 0;
        cartItems.replaceChildren();

        items.forEach(({ product, quantity }) => {
            const row = document.createElement("article");
            row.className = "cart-item";
            const name = document.createElement("span");
            name.className = "cart-item-name";
            name.textContent = product.name;
            const price = document.createElement("span");
            price.className = "cart-item-price";
            price.textContent = `${formatPrice((Number(product.price) || 0) * quantity)} ₽`;
            const controls = document.createElement("div");
            controls.className = "cart-item-controls";
            const decrease = document.createElement("button");
            decrease.type = "button";
            decrease.textContent = "−";
            decrease.setAttribute("aria-label", `Уменьшить количество: ${product.name}`);
            decrease.addEventListener("click", () => {
                if (quantity <= 1) {
                    cart.delete(product.id);
                } else {
                    cart.set(product.id, { product, quantity: quantity - 1 });
                }
                renderCart();
            });
            const amount = document.createElement("span");
            amount.textContent = String(quantity);
            const increase = document.createElement("button");
            increase.type = "button";
            increase.textContent = "+";
            increase.setAttribute("aria-label", `Увеличить количество: ${product.name}`);
            increase.addEventListener("click", () => addToCart(product));
            const remove = document.createElement("button");
            remove.className = "cart-remove";
            remove.type = "button";
            remove.textContent = "×";
            remove.setAttribute("aria-label", `Удалить: ${product.name}`);
            remove.addEventListener("click", () => {
                cart.delete(product.id);
                renderCart();
            });
            controls.append(decrease, amount, increase, remove);
            row.append(name, price, controls);
            cartItems.append(row);
        });
    }

    function showToast(message) {
        window.clearTimeout(toastTimer);
        toast.textContent = message;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 2800);
    }

    function renderCurrencySlider() {
        const box = document.querySelector("#currency-slider");
        box.replaceChildren();
        const settings = shop.pluginSettings && typeof shop.pluginSettings === "object" ? shop.pluginSettings : {};
        const config = settings.currencySliderConfig && typeof settings.currencySliderConfig === "object"
            ? settings.currencySliderConfig
            : {};
        const servers = Array.isArray(config.servers) ? config.servers : [];
        const currencyIds = Array.isArray(config.currencyIds) ? config.currencyIds : [];
        const currencies = getProducts().filter(product =>
            product.category === "Валюта" &&
            Number(product.price) > 0 &&
            Number(product.quantity) >= 1 &&
            (currencyIds.length === 0 || currencyIds.includes(product.id)) &&
            (servers.length === 0 || (Array.isArray(product.servers) && product.servers.some(name => servers.includes(name))))
        );
        if (settings.currencySlider !== true || currencies.length === 0) {
            box.hidden = true;
            return;
        }

        let current = currencies.find(product => product.id === sliderProductId) || currencies[0];
        sliderProductId = current.id;
        const tabs = document.createElement("div");
        tabs.className = "currency-slider-tabs";
        currencies.forEach(product => {
            const tab = document.createElement("button");
            tab.type = "button";
            tab.textContent = product.name;
            tab.className = product.id === current.id ? "active" : "";
            tab.addEventListener("click", () => {
                sliderProductId = product.id;
                sliderAmount = 0;
                renderCurrencySlider();
            });
            tabs.append(tab);
        });

        const unitPrice = Number(current.price) / Number(current.quantity);
        const max = Number.isInteger(config.max) && config.max > 0
            ? config.max
            : Math.max(100, Math.round(Number(current.quantity)) * 10);
        sliderAmount = Math.min(Math.max(sliderAmount || Math.min(max, Math.round(Number(current.quantity))), 1), max);

        const heading = document.createElement("div");
        heading.className = "currency-slider-heading";
        heading.innerHTML = "<p class=\"section-kicker\">ИГРОВАЯ ВАЛЮТА</p>";
        const title = document.createElement("h3");
        title.textContent = `Купить: ${current.name}`;
        heading.append(title);

        const range = document.createElement("input");
        range.type = "range";
        range.min = "1";
        range.max = String(max);
        range.step = "1";
        range.value = String(sliderAmount);
        range.setAttribute("aria-label", `Количество валюты: ${current.name}`);
        const summary = document.createElement("div");
        summary.className = "currency-slider-summary";
        const amountText = document.createElement("b");
        const priceText = document.createElement("span");
        const update = () => {
            sliderAmount = Number(range.value);
            amountText.textContent = `${new Intl.NumberFormat("ru-RU").format(sliderAmount)} ${current.name}`;
            priceText.textContent = `${formatPrice(Math.round(unitPrice * sliderAmount * 100) / 100)} ₽`;
        };
        range.addEventListener("input", update);
        const buy = document.createElement("button");
        buy.type = "button";
        buy.className = "currency-slider-buy";
        buy.textContent = "В корзину";
        buy.addEventListener("click", () => {
            const total = Math.round(unitPrice * sliderAmount * 100) / 100;
            const lineId = `${current.id}:slider:${sliderAmount}`;
            cart.set(lineId, {
                product: { id: lineId, name: `${current.name} × ${new Intl.NumberFormat("ru-RU").format(sliderAmount)}`, price: total, quantity: 1 },
                quantity: 1
            });
            renderCart();
            showToast(`${current.name}: ${sliderAmount} — добавлено в корзину.`);
        });
        summary.append(amountText, priceText, buy);
        update();
        box.append(heading, tabs, range, summary);
        box.hidden = false;
    }

    function renderPublicForms() {
        const section = document.querySelector("#public-forms");
        const gridElement = document.querySelector("#public-forms-grid");
        gridElement.replaceChildren();
        const forms = shop.tools && Array.isArray(shop.tools.forms) ? shop.tools.forms : [];
        const visible = forms.filter(item => item && typeof item.id === "string" && typeof item.title === "string" && item.enabled !== false);
        visible.forEach(item => {
            const card = document.createElement("article");
            card.className = "public-form-card";
            const heading = document.createElement("h3");
            heading.textContent = item.title;
            const text = document.createElement("p");
            text.textContent = item.description || "";
            text.hidden = !item.description;
            const link = document.createElement("a");
            link.href = `./public-form.html?id=${encodeURIComponent(shop.id)}&owner=${encodeURIComponent(shop.ownerId || shopOwner)}&form=${encodeURIComponent(item.id)}`;
            link.textContent = item.buttonText || "Отправить";
            card.append(heading, text, link);
            gridElement.append(card);
        });
        section.hidden = visible.length === 0;
    }

    function renderPageLinks() {
        const navigation = document.querySelector(".store-nav");
        const pages = shop.tools && Array.isArray(shop.tools.pages) ? shop.tools.pages : [];
        pages.forEach(page => {
            if (!page || typeof page.title !== "string" || typeof page.address !== "string") {
                return;
            }
            let href;
            let external = false;
            if (/^https?:\/\//i.test(page.address)) {
                try {
                    const url = new URL(page.address);
                    if (!["http:", "https:"].includes(url.protocol)) {
                        return;
                    }
                    href = url.href;
                    external = true;
                } catch {
                    return;
                }
            } else {
                href = `./public-page.html?id=${encodeURIComponent(shop.id)}&owner=${encodeURIComponent(shop.ownerId || shopOwner)}&slug=${encodeURIComponent(page.address)}`;
            }
            const link = document.createElement("a");
            link.href = href;
            link.textContent = page.title;
            if (external) {
                link.target = "_blank";
                link.rel = "noopener noreferrer";
            }
            navigation.append(link);
        });
    }

    async function renderStore() {
        shopName.textContent = shop.name;
        brandMark.textContent = Array.from(shop.name.trim() || "S")[0].toUpperCase();
        document.title = `${shop.name} — Магазин сервера`;
        renderPageLinks();
        renderPublicForms();

        const customization = shop.customization && typeof shop.customization === "object"
            ? shop.customization
            : {};
        const storeImages = shop.images && typeof shop.images === "object" ? shop.images : {};
        const templateFamilies = {
            "nexium-light": "nexium",
            "nexium-dark": "nexium",
            "orvion-light": "orvion",
            "orvion-dark": "orvion",
            "lumix-light": "lumix",
            "lumix-dark": "lumix",
            "arcane-light": "arcane",
            "arcane-dark": "arcane",
            "ender-rift": "ender",
            "nether-forge": "nether",
            "deep-ocean": "ocean",
            "emerald-grove": "forest",
            "neon-sunset": "sunset",
            "lime-night": "lime",
            "amber-shop": "amber",
            "crimson-catalog": "crimson",
            "really-light": "really",
            "funtime-dark": "funtime",
            "minimal-light": "minimal"
        };
        const familyAccents = { sunset: "#ff5d8f", lime: "#1de864", amber: "#f39513", crimson: "#dc2626", really: "#f39513", funtime: "#dc2626", minimal: "#51a2ff" };
        const customTemplate = (Array.isArray(shop.customTemplates) ? shop.customTemplates : [])
            .find(item => item && item.id === shop.templateId && item.colors && typeof item.colors === "object");
        const isHex = value => /^#[0-9a-f]{6}$/i.test(value || "");
        document.body.dataset.template = customTemplate ? "custom" : (templateFamilies[shop.templateId] || "");
        if (customTemplate) {
            const vars = { bg: "--store-bg", panel: "--store-panel", border: "--store-border", text: "--store-text", muted: "--store-muted" };
            Object.entries(vars).forEach(([key, cssVar]) => {
                if (isHex(customTemplate.colors[key])) {
                    document.documentElement.style.setProperty(cssVar, customTemplate.colors[key]);
                }
            });
        }
        const accentColor = customTemplate && isHex(customTemplate.colors.accent)
            ? customTemplate.colors.accent
            : /^#[0-9a-f]{6}$/i.test(customization.accentColor || "")
                ? customization.accentColor
                : (familyAccents[templateFamilies[shop.templateId]] || "#7866ff");
        document.documentElement.style.setProperty("--store-accent", accentColor);
        document.documentElement.style.setProperty("--store-accent-soft", `${accentColor}24`);
        title.textContent = customization.title || shop.name;
        description.textContent = customization.description || "Выбирай привилегии и предметы для игры.";
        address.textContent = customization.address || shop.address || "Сервер скоро появится";

        if (customization.hideOverallOnline) {
            onlineIndicator.hidden = true;
        }
        if (!customization.address && Array.isArray(shop.servers)) {
            const firstServer = shop.servers.find(server =>
                server && typeof server.address === "string" && Number.isInteger(server.port)
            );
            if (firstServer) {
                address.textContent = `${firstServer.address}:${firstServer.port}`;
            }
        }
        await applyStoreImage(customization.backgroundImage || storeImages.background, image => {
            heroImage.src = image;
            heroImage.hidden = false;
        }, "фоновое изображение");

        await applyStoreImage(storeImages.logo, image => {
            const logo = document.createElement("img");
            logo.src = image;
            logo.alt = "";
            brandMark.replaceChildren(logo);
        }, "логотип магазина");

        await applyStoreImage(storeImages.icon, image => {
            let icon = document.querySelector('link[rel="icon"]');
            if (!icon) {
                icon = document.createElement("link");
                icon.rel = "icon";
                document.head.append(icon);
            }
            icon.href = image;
        }, "иконка магазина");

        await applyStoreImage(storeImages.additional, image => {
            additionalImageContent.src = image;
            additionalImageContent.alt = `Изображение магазина ${shop.name}`;
            additionalImage.hidden = false;
        }, "дополнительное изображение");

        const aboutText = customization.aboutDescription || customization.description ||
            `Присоединяйся к ${shop.name} и играй вместе с нами.`;
        document.querySelector("#about-title").textContent =
            customization.aboutTitle || `Добро пожаловать на ${shop.name}`;
        document.querySelector("#about-description").textContent = aboutText;
        if (shop.socialLinks && typeof shop.socialLinks === "object") {
            const names = { telegram: "Telegram", discord: "Discord", youtube: "YouTube", vk: "VK", twitch: "Twitch", tiktok: "TikTok" };
            const box = document.querySelector("#owner-socials");
            const chips = Object.entries(shop.socialLinks).filter(([, value]) => {
                try {
                    return ["http:", "https:"].includes(new URL(value).protocol);
                } catch {
                    return false;
                }
            }).map(([key, value]) => {
                const a = document.createElement("a");
                a.href = value;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = names[key] || key;
                return a;
            });
            if (box && chips.length) {
                box.replaceChildren(...chips);
                box.hidden = false;
            }
        }

        renderProducts();
        renderCurrencySlider();
        renderCart();
        await refreshPublicServers();
    }

    try {
        shop = loadShop();
        renderStore().catch(error => {
            console.error("Не удалось подготовить витрину:", error);
            showLoadError(new Error(`Не удалось загрузить оформление: ${error.message}`));
        });
    } catch (error) {
        showLoadError(error);
    }

    search.addEventListener("input", renderProducts);
    document.querySelector("#cart-open").addEventListener("click", () => {
        document.querySelector("#cart-panel").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const checkoutForm = document.querySelector("#checkout-form");
    const checkoutFeedback = document.querySelector("#checkout-feedback");
    const checkoutPayNote = document.querySelector("#checkout-pay-note");
    let appliedCoupon = null;

    function setCheckoutFeedback(message, ok) {
        checkoutFeedback.textContent = message;
        checkoutFeedback.dataset.state = ok ? "ok" : "error";
        checkoutFeedback.hidden = !message;
    }

    function findCoupon(code) {
        const request = new XMLHttpRequest();
        request.open("GET", `/api/public-shop/coupon?owner=${encodeURIComponent(shopOwner)}&id=${encodeURIComponent(shopId)}&code=${encodeURIComponent(code)}`, false);
        request.send();
        if (request.status !== 200) return { error: "Не удалось проверить купон. Попробуй позже." };
        const coupon = JSON.parse(request.responseText).coupon;
        if (!coupon) return { error: "Купон не найден." };
        const now = Date.now();
        const start = coupon.startAt ? new Date(coupon.startAt).getTime() : NaN;
        const end = coupon.endAt ? new Date(coupon.endAt).getTime() : NaN;
        if (coupon.active === false || (Number.isFinite(start) && start > now)) return { error: "Купон сейчас не действует." };
        if (Number.isFinite(end) && end < now) return { error: "Срок действия купона истёк." };
        if (Number(coupon.maxUses) > 0 && Number(coupon.uses || 0) >= Number(coupon.maxUses)) return { error: "Лимит использований купона исчерпан." };
        return { coupon };
    }

    function checkoutAmounts() {
        const ids = appliedCoupon && Array.isArray(appliedCoupon.productIds) ? appliedCoupon.productIds : [];
        const percent = appliedCoupon ? Math.min(100, Math.max(0, Number(appliedCoupon.discount) || 0)) : 0;
        let total = 0;
        let discount = 0;
        cart.forEach(({ product, quantity }) => {
            const line = (Number(product.price) || 0) * quantity;
            total += line;
            const baseId = String(product.id).split(":")[0];
            if (percent && (!ids.length || ids.includes(baseId))) {
                discount += line * percent / 100;
            }
        });
        return { total, discount };
    }

    function renderCheckout() {
        const lines = document.querySelector("#checkout-lines");
        lines.replaceChildren(...Array.from(cart.values()).map(({ product, quantity }) => {
            const row = document.createElement("div");
            row.className = "checkout-line";
            const name = document.createElement("b");
            name.textContent = product.name;
            const meta = document.createElement("span");
            meta.textContent = `${quantity} шт. · ${formatPrice((Number(product.price) || 0) * quantity)} ₽`;
            row.append(name, meta);
            return row;
        }));
        const { total, discount } = checkoutAmounts();
        document.querySelector("#checkout-total").textContent = discount > 0
            ? `${formatPrice(Math.max(0, total - discount))} ₽ (−${formatPrice(discount)} ₽)`
            : `${formatPrice(total)} ₽`;
    }

    document.querySelector("#checkout-button").addEventListener("click", () => {
        appliedCoupon = null;
        checkoutForm.elements.coupon.value = "";
        setCheckoutFeedback("", true);
        checkoutPayNote.hidden = true;
        renderCheckout();
        checkoutDialog.showModal();
    });
    document.querySelector("#checkout-close").addEventListener("click", () => checkoutDialog.close());
    document.querySelector("#coupon-apply").addEventListener("click", () => {
        const code = checkoutForm.elements.coupon.value.trim().toUpperCase();
        appliedCoupon = null;
        if (!code) {
            setCheckoutFeedback("", true);
        } else {
            const result = findCoupon(code);
            if (result.error) {
                setCheckoutFeedback(result.error, false);
            } else {
                appliedCoupon = result.coupon;
                const { discount } = checkoutAmounts();
                setCheckoutFeedback(discount > 0
                    ? `Купон применён: −${Number(result.coupon.discount) || 0}%`
                    : "Купон не подходит к товарам в корзине.", discount > 0);
                if (discount <= 0) appliedCoupon = null;
            }
        }
        renderCheckout();
    });
    checkoutForm.addEventListener("submit", event => {
        event.preventDefault();
        const nickname = checkoutForm.elements.nickname.value.trim();
        const email = checkoutForm.elements.email.value.trim();
        if (!/^[A-Za-z0-9_]{3,16}$/.test(nickname)) {
            setCheckoutFeedback("Никнейм: 3–16 символов, латиница, цифры и _.", false);
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setCheckoutFeedback("Введите корректную почту.", false);
            return;
        }
        if (checkoutForm.elements.coupon.value.trim() && !appliedCoupon) {
            setCheckoutFeedback("Нажмите «Применить», чтобы проверить купон.", false);
            return;
        }
        setCheckoutFeedback("", true);
        const method = checkoutForm.elements.method.value;
        const { total, discount } = checkoutAmounts();
        checkoutPayNote.textContent = `Подтверждение: ${nickname} · ${email} · ${method} · ${formatPrice(Math.max(0, total - discount))} ₽. Платёжный сервис ещё не подключён: заказ не создан и деньги не списаны.`;
        checkoutPayNote.hidden = false;
    });
    window.setInterval(() => {
        if (shop) {
            refreshPublicServers().catch(error => {
                console.error("Не удалось обновить статус Minecraft-серверов:", error);
            });
        }
    }, 60_000);
})();


})();

// Source: reg.js
(() => {
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
        ? "РЎ РІРѕР·РІСЂР°С‰РµРЅРёРµРј"
        : isForgot
            ? "Р’РѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ РїР°СЂРѕР»СЏ"
            : isReset
                ? "РЎРѕР·РґР°Р№ РЅРѕРІС‹Р№ РїР°СЂРѕР»СЊ"
                : "РЎРѕР·РґР°Р№ Р°РєРєР°СѓРЅС‚";
    subtitle.textContent = isLogin
        ? "Р’РѕР№РґРё, С‡С‚РѕР±С‹ СѓРїСЂР°РІР»СЏС‚СЊ РјР°РіР°Р·РёРЅРѕРј СЃРµСЂРІРµСЂР°"
        : isForgot
            ? "РЈРєР°Р¶Рё email, СЃРІСЏР·Р°РЅРЅС‹Р№ СЃ Р°РєРєР°СѓРЅС‚РѕРј"
            : isReset
                ? "РџСЂРёРґСѓРјР°Р№ РїР°СЂРѕР»СЊ РґР»СЏ СЃРІРѕРµРіРѕ Р°РєРєР°СѓРЅС‚Р°"
                : "РќР°С‡РЅРё СЃРѕР±РёСЂР°С‚СЊ СЃРІРѕР№ РјР°РіР°Р·РёРЅ РґР»СЏ СЃРµСЂРІРµСЂР°";
    submitButton.firstElementChild.textContent = isLogin
        ? "Р’РѕР№С‚Рё"
        : isForgot
            ? "РћС‚РїСЂР°РІРёС‚СЊ СЃСЃС‹Р»РєСѓ"
            : isReset
                ? "РЎРѕС…СЂР°РЅРёС‚СЊ РїР°СЂРѕР»СЊ"
                : "РЎРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚";
    switchLabel.textContent = isRegister
        ? "РЈР¶Рµ РµСЃС‚СЊ Р°РєРєР°СѓРЅС‚?"
        : isLogin
            ? "Р•С‰С‘ РЅРµС‚ Р°РєРєР°СѓРЅС‚Р°?"
            : "РЈР¶Рµ РІСЃРїРѕРјРЅРёР» РїР°СЂРѕР»СЊ?";
    modeToggle.textContent = isRegister ? "Р’РѕР№С‚Рё" : isLogin ? "РЎРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚" : "Р’РѕР№С‚Рё";
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
    showPasswordButton.textContent = "РџРѕРєР°Р·Р°С‚СЊ";
    showPasswordButton.setAttribute("aria-label", "РџРѕРєР°Р·Р°С‚СЊ РїР°СЂРѕР»СЊ");
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
        confirmInput.setCustomValidity("РџР°СЂРѕР»Рё РЅРµ СЃРѕРІРїР°РґР°СЋС‚.");
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
    showPasswordButton.textContent = visible ? "РЎРєСЂС‹С‚СЊ" : "РџРѕРєР°Р·Р°С‚СЊ";
    showPasswordButton.setAttribute("aria-label", visible ? "РЎРєСЂС‹С‚СЊ РїР°СЂРѕР»СЊ" : "РџРѕРєР°Р·Р°С‚СЊ РїР°СЂРѕР»СЊ");
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
        showMessage("РЎСЃС‹Р»РєР° РґР»СЏ СЃР±СЂРѕСЃР° РїР°СЂРѕР»СЏ РЅРµРґРµР№СЃС‚РІРёС‚РµР»СЊРЅР° РёР»Рё СѓСЃС‚Р°СЂРµР»Р°.", "error");
        return;
    }

    const submitLabel = submitButton.firstElementChild;
    const originalLabel = submitLabel.textContent;
    const submittedMode = currentMode;
    submitButton.disabled = true;
    submitLabel.textContent = currentMode === "login"
        ? "Р’С…РѕРґРёРј..."
        : currentMode === "forgot"
            ? "РћС‚РїСЂР°РІР»СЏРµРј..."
            : currentMode === "reset"
                ? "РЎРѕС…СЂР°РЅСЏРµРј..."
                : "РЎРѕР·РґР°С‘Рј Р°РєРєР°СѓРЅС‚...";

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
            showMessage(result.error || "РќРµ СѓРґР°Р»РѕСЃСЊ РІС‹РїРѕР»РЅРёС‚СЊ Р·Р°РїСЂРѕСЃ.", "error");
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
        console.error("РќРµ СѓРґР°Р»РѕСЃСЊ РІС‹РїРѕР»РЅРёС‚СЊ Р·Р°РїСЂРѕСЃ Р°РІС‚РѕСЂРёР·Р°С†РёРё:", error);
        showMessage("РќРµ СѓРґР°Р»РѕСЃСЊ СЃРІСЏР·Р°С‚СЊСЃСЏ СЃ СЃРµСЂРІРµСЂРѕРј. РџРѕРїСЂРѕР±СѓР№ РµС‰С‘ СЂР°Р·.", "error");
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
    showMessage("РЎСЃС‹Р»РєР° РґР»СЏ СЃР±СЂРѕСЃР° РїР°СЂРѕР»СЏ РЅРµРґРµР№СЃС‚РІРёС‚РµР»СЊРЅР° РёР»Рё СѓСЃС‚Р°СЂРµР»Р°.", "error");
}

})();

// Source: servers.js
(() => {
if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
    window.location.replace("./reg.html?mode=login");
} else {
    const params = new URLSearchParams(window.location.search);
    const shopId = params.get("id");
    const shopsKey = window.sdonateShopStorage.storageKey();
    const shopNameElement = document.querySelector("#servers-shop-name");
    const serverList = document.querySelector("#server-list");
    const serverCount = document.querySelector("#server-count");
    const emptyState = document.querySelector("#servers-empty");
    const form = document.querySelector("#server-form");
    const formTitle = document.querySelector("#form-title");
    const formMessage = document.querySelector("#server-form-message");
    const toast = document.querySelector("#servers-toast");
    const addButtons = [document.querySelector("#add-server"), document.querySelector("#empty-add-server")];
    const cancelButton = document.querySelector("#cancel-edit");
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
    let activeShop;
    let toastTimer;

    document.querySelector("#account-name").textContent = nickname;
    document.querySelector("#account-avatar").textContent = Array.from(nickname)[0].toUpperCase();
    document.querySelector("#logout-button").addEventListener("click", () => window.sdonateEndSession());

    function readShops() {
        const raw = sessionStorage.getItem(shopsKey);
        if (raw === null) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        const shops = JSON.parse(raw);
        if (!Array.isArray(shops) || shops.some(shop =>
            !shop || typeof shop.id !== "string" || typeof shop.name !== "string"
        )) {
            throw new Error("РЎРѕС…СЂР°РЅС‘РЅРЅС‹Р№ СЃРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return shops;
    }

    function showToast(text) {
        window.clearTimeout(toastTimer);
        toast.textContent = text;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 3500);
    }

    function readServers() {
        if (!Array.isArray(activeShop.servers)) {
            activeShop.servers = [];
        }
        if (activeShop.servers.some(server =>
            !server || typeof server.id !== "string" || typeof server.name !== "string" ||
            typeof server.address !== "string" || typeof server.port !== "number"
        )) {
            throw new Error("РЎРїРёСЃРѕРє СЃРµСЂРІРµСЂРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return activeShop.servers;
    }

    function saveShop(shops) {
        window.sdonateShopStorage.save(shops);
    }

    function makeServerCard(server) {
        const card = document.createElement("article");
        card.className = "server-card";

        const icon = document.createElement("span");
        icon.className = "server-card-icon";
        icon.textContent = Array.from(server.name.trim() || "S")[0].toUpperCase();

        const details = document.createElement("div");
        details.className = "server-card-details";
        const title = document.createElement("h3");
        title.textContent = server.name;
        const address = document.createElement("p");
        address.textContent = `${server.address}:${server.port}`;
        const version = document.createElement("small");
        version.textContent = server.version || "Р’РµСЂСЃРёСЏ РЅРµ СѓРєР°Р·Р°РЅР°";
        details.append(title, address, version);

        const status = document.createElement("span");
        status.className = "server-demo-status";
        status.textContent = "Р”Р•РњРћ";

        const actions = document.createElement("div");
        actions.className = "server-card-actions";
        const edit = document.createElement("button");
        edit.type = "button";
        edit.textContent = "РќР°СЃС‚СЂРѕРёС‚СЊ";
        edit.addEventListener("click", () => editServer(server));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "server-remove-button";
        remove.textContent = "РЈРґР°Р»РёС‚СЊ";
        remove.addEventListener("click", () => deleteServer(server));
        actions.append(edit, remove);
        card.append(icon, details, status, actions);
        return card;
    }

    function renderServers() {
        const servers = readServers();
        serverList.replaceChildren(...servers.map(makeServerCard));
        serverCount.textContent = String(servers.length);
        emptyState.hidden = servers.length > 0;
    }

    function resetForm() {
        form.reset();
        document.querySelector("#server-id").value = "";
        document.querySelector("#server-port").value = "25565";
        formTitle.textContent = "РќРѕРІС‹Р№ СЃРµСЂРІРµСЂ";
        formMessage.hidden = true;
        cancelButton.hidden = true;
    }

    function editServer(server) {
        form.elements.id.value = server.id;
        form.elements.name.value = server.name;
        form.elements.version.value = server.version || "";
        form.elements.address.value = server.address;
        form.elements.port.value = String(server.port);
        form.elements.rconAddress.value = server.rconAddress || "";
        form.elements.rconPort.value = server.rconPort ? String(server.rconPort) : "";
        form.elements.excludeOnline.checked = Boolean(server.excludeOnline);
        formTitle.textContent = "Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ СЃРµСЂРІРµСЂР°";
        cancelButton.hidden = false;
        formMessage.hidden = true;
        document.querySelector("#server-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
        form.elements.name.focus({ preventScroll: true });
    }

    function deleteServer(server) {
        if (!window.confirm(`РЈРґР°Р»РёС‚СЊ СЃРµСЂРІРµСЂ В«${server.name}В» РёР· РґРµРјРѕ-РјР°РіР°Р·РёРЅР°?`)) {
            return;
        }
        try {
            const shops = readShops();
            const currentShop = shops.find(shop => shop.id === shopId);
            if (!currentShop) {
                throw new Error("РњР°РіР°Р·РёРЅ Р±РѕР»СЊС€Рµ РЅРµ РЅР°Р№РґРµРЅ.");
            }
            currentShop.servers = (currentShop.servers || []).filter(item => item.id !== server.id);
            saveShop(shops);
            activeShop = currentShop;
            if (form.elements.id.value === server.id) {
                resetForm();
            }
            renderServers();
            showToast("РЎРµСЂРІРµСЂ СѓРґР°Р»С‘РЅ РёР· РґРµРјРѕ-СЃРїРёСЃРєР°.");
        } catch (error) {
            showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ СЃРµСЂРІРµСЂ: ${error.message}`);
        }
    }

    function makeId() {
        if (!window.crypto || typeof window.crypto.randomUUID !== "function") {
            throw new Error("Р‘СЂР°СѓР·РµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ Р±РµР·РѕРїР°СЃРЅРѕРµ СЃРѕР·РґР°РЅРёРµ ID.");
        }
        return window.crypto.randomUUID();
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        formMessage.hidden = true;
        if (!form.reportValidity()) {
            return;
        }

        const address = form.elements.address.value.trim().toLowerCase();
        const hostPattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/i;
        if (!hostPattern.test(address)) {
            formMessage.textContent = "РЈРєР°Р¶Рё IP-Р°РґСЂРµСЃ РёР»Рё РґРѕРјРµРЅРЅРѕРµ РёРјСЏ Р±РµР· РїСЂРѕС‚РѕРєРѕР»Р° Рё РїРѕСЂС‚Р°.";
            formMessage.hidden = false;
            form.elements.address.focus();
            return;
        }
        const rconAddress = form.elements.rconAddress.value.trim().toLowerCase();
        if (rconAddress && !hostPattern.test(rconAddress)) {
            formMessage.textContent = "РџСЂРѕРІРµСЂСЊ RCON-Р°РґСЂРµСЃ: СѓРєР°Р¶Рё IP РёР»Рё РґРѕРјРµРЅ Р±РµР· РїСЂРѕС‚РѕРєРѕР»Р° Рё РїРѕСЂС‚Р°.";
            formMessage.hidden = false;
            form.elements.rconAddress.focus();
            return;
        }

        try {
            const shops = readShops();
            const currentShop = shops.find(shop => shop.id === shopId);
            if (!currentShop) {
                throw new Error("РњР°РіР°Р·РёРЅ Р±РѕР»СЊС€Рµ РЅРµ РЅР°Р№РґРµРЅ.");
            }
            if (!Array.isArray(currentShop.servers)) {
                currentShop.servers = [];
            }
            const id = form.elements.id.value || makeId();
            const server = {
                id,
                name: form.elements.name.value.trim(),
                version: form.elements.version.value.trim(),
                address,
                port: Number(form.elements.port.value),
                rconAddress,
                rconPort: form.elements.rconPort.value ? Number(form.elements.rconPort.value) : null,
                excludeOnline: form.elements.excludeOnline.checked
            };
            if (!Number.isInteger(server.port) || server.port < 1 || server.port > 65535 ||
                (server.rconPort !== null && (!Number.isInteger(server.rconPort) || server.rconPort < 1 || server.rconPort > 65535))) {
                throw new Error("РџРѕСЂС‚ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ С†РµР»С‹Рј С‡РёСЃР»РѕРј РѕС‚ 1 РґРѕ 65535.");
            }
            const index = currentShop.servers.findIndex(item => item.id === id);
            if (index === -1) {
                currentShop.servers.unshift(server);
            } else {
                currentShop.servers[index] = server;
            }
            saveShop(shops);
            activeShop = currentShop;
            renderServers();
            resetForm();
            showToast(index === -1 ? "РЎРµСЂРІРµСЂ РґРѕР±Р°РІР»РµРЅ РІ РґРµРјРѕ-СЃРїРёСЃРѕРє." : "РќР°СЃС‚СЂРѕР№РєРё РґРµРјРѕ-СЃРµСЂРІРµСЂР° СЃРѕС…СЂР°РЅРµРЅС‹.");
        } catch (error) {
            formMessage.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ СЃРµСЂРІРµСЂ: ${error.message}`;
            formMessage.hidden = false;
        }
    });

    addButtons.forEach(button => button.addEventListener("click", () => {
        resetForm();
        document.querySelector("#server-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
        form.elements.name.focus({ preventScroll: true });
    }));
    cancelButton.addEventListener("click", resetForm);

    try {
        const shops = readShops();
        activeShop = shops.find(shop => shop.id === shopId);
        if (!activeShop) {
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ РёР»Рё СѓР¶Рµ СѓРґР°Р»С‘РЅ.");
        }
        shopNameElement.textContent = activeShop.name;
        document.title = `РЎРµСЂРІРµСЂС‹ вЂ” ${activeShop.name} вЂ” SDonate`;
        document.querySelector("#back-to-shop").href = `./store-tools.html?id=${encodeURIComponent(activeShop.id)}&tool=plugins`;
        renderServers();
    } catch (error) {
        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ СЃРµСЂРІРµСЂС‹: ${error.message}`);
        addButtons.forEach(button => { button.disabled = true; });
        form.querySelectorAll("input, button").forEach(control => { control.disabled = true; });
    }
}

})();

// Source: settings.js
(() => {
if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
    window.location.replace("./reg.html?mode=login");
} else {
    const storageKeys = {
        nickname: "sdonate-demo-nickname",
        email: "sdonate-demo-email",
        chart: "sdonate-demo-chart"
    };
    const nicknameInput = document.querySelector("#nickname");
    const emailInput = document.querySelector("#email");
    const profileForm = document.querySelector("#profile-form");
    const profileMessage = document.querySelector("#profile-message");
    const avatarFile = document.querySelector("#avatar-file");
    const avatarPreview = document.querySelector("#avatar-preview");
    const avatarInitial = document.querySelector("#avatar-initial");
    const avatarReset = document.querySelector("#avatar-reset");
    const avatarError = document.querySelector("#avatar-error");
    const twoFactorToggle = document.querySelector("#two-factor-toggle");
    const twoFactorState = document.querySelector("#two-factor-state");
    const accountName = document.querySelector("#account-name");
    const accountAvatar = document.querySelector("#account-avatar");
    const settingsAccountName = document.querySelector("#settings-account-name");
    const chartSelect = document.querySelector("#chart-style");
    const dialog = document.querySelector("#settings-dialog");
    const dialogForm = document.querySelector("#settings-dialog-form");
    const dialogFields = document.querySelector("#dialog-fields");
    const dialogMark = document.querySelector("#dialog-mark");
    const dialogTitle = document.querySelector("#dialog-title");
    const dialogDescription = document.querySelector("#dialog-description");
    const dialogFeedback = document.querySelector("#dialog-feedback");
    const dialogActions = document.querySelector("#dialog-actions");
    const dialogConfirm = document.querySelector("#dialog-confirm");
    const dialogCancel = document.querySelector("#dialog-cancel");
    const toast = document.querySelector("#settings-toast");
    const logoutButton = document.querySelector("#logout-button");
    const settingsLogoutButton = document.querySelector("#settings-logout");
    let dialogMode = "email";
    let toastTimer;

    function getStoredValue(key, fallback) {
        return sessionStorage.getItem(key) || fallback;
    }

    function showToast(text) {
        window.clearTimeout(toastTimer);
        toast.textContent = text;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 3500);
    }

    function updateProfileHeader(nickname) {
        accountName.textContent = nickname;
        settingsAccountName.textContent = nickname;
        accountAvatar.textContent = Array.from(nickname)[0].toUpperCase();
        window.sdonateRenderAvatar(window.sdonateGetAvatar());
    }

    function renderAvatar(source) {
        avatarPreview.replaceChildren();

        if (source) {
            const image = document.createElement("img");
            image.src = source;
            image.alt = "РџСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ Р°РІР°С‚Р°СЂР°";
            avatarPreview.append(image);
            avatarReset.hidden = false;
            return;
        }

        avatarInitial.textContent = Array.from(nicknameInput.value || "S")[0].toUpperCase();
        avatarPreview.append(avatarInitial);
        avatarReset.hidden = true;
    }

    nicknameInput.value = getStoredValue(storageKeys.nickname, "РРіСЂРѕРє");
    emailInput.value = getStoredValue(storageKeys.email, "");
    chartSelect.value = getStoredValue(storageKeys.chart, "area");
    updateProfileHeader(nicknameInput.value);
    renderAvatar(window.sdonateGetAvatar());

    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("sdonate-demo-authenticated");
        window.location.assign("./reg.html?mode=login");
    });

    settingsLogoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("sdonate-demo-authenticated");
        window.location.assign("./reg.html?mode=login");
    });

    nicknameInput.addEventListener("input", () => {
        if (!avatarPreview.querySelector("img")) {
            avatarInitial.textContent = Array.from(nicknameInput.value || "S")[0].toUpperCase();
        }
    });

    profileForm.addEventListener("submit", event => {
        event.preventDefault();

        if (!profileForm.reportValidity()) {
            return;
        }

        const nickname = nicknameInput.value.trim();
        const previousEmail = sessionStorage.getItem(storageKeys.email) || "";
        const email = emailInput.value.trim().toLowerCase();
        sessionStorage.setItem(storageKeys.nickname, nickname);
        sessionStorage.setItem(storageKeys.email, email);
        sessionStorage.setItem(storageKeys.chart, chartSelect.value);
        window.sdonateMoveAvatar(previousEmail, email);
        updateProfileHeader(nickname);

        profileMessage.textContent = "Р”РµРјРѕ: РЅР°СЃС‚СЂРѕР№РєРё РїСЂРѕС„РёР»СЏ СЃРѕС…СЂР°РЅСЏСЋС‚СЃСЏ РґРѕ Р·Р°РєСЂС‹С‚РёСЏ РІРєР»Р°РґРєРё. РђРІР°С‚Р°СЂ СЃРѕС…СЂР°РЅС‘РЅ РІ СЌС‚РѕРј Р±СЂР°СѓР·РµСЂРµ; СЃРµСЂРІРµСЂРЅС‹Р№ РїСЂРѕС„РёР»СЊ РЅРµ РёР·РјРµРЅС‘РЅ.";
        profileMessage.hidden = false;
    });

    async function compressAvatar(file) {
        const imageUrl = URL.createObjectURL(file);
        const image = new Image();
        try {
            await new Promise((resolve, reject) => {
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", () => reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.")), { once: true });
                image.src = imageUrl;
            });
        } finally {
            URL.revokeObjectURL(imageUrl);
        }

        if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 36000000) {
            throw new Error("РЈ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ СЃР»РёС€РєРѕРј Р±РѕР»СЊС€РѕРµ СЂР°Р·СЂРµС€РµРЅРёРµ.");
        }

        const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±СЂР°Р±РѕС‚Р°С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.");
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        for (const quality of [0.84, 0.72, 0.6, 0.48, 0.36]) {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", quality));
            if (!blob || blob.type !== "image/webp") {
                throw new Error("Р‘СЂР°СѓР·РµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ СЃР¶Р°С‚РёРµ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ.");
            }
            if (blob.size <= 400 * 1024) {
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.addEventListener("load", () => {
                        if (typeof reader.result === "string") {
                            resolve(reader.result);
                        } else {
                            reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РѕР±СЂР°Р±РѕС‚Р°РЅРЅРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ."));
                        }
                    }, { once: true });
                    reader.addEventListener("error", () => reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕС‡РёС‚Р°С‚СЊ РѕР±СЂР°Р±РѕС‚Р°РЅРЅРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.")), { once: true });
                    reader.readAsDataURL(blob);
                });
            }
        }

        throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ СЃР¶Р°С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ РґРѕ РґРѕРїСѓСЃС‚РёРјРѕРіРѕ СЂР°Р·РјРµСЂР°.");
    }

    avatarFile.addEventListener("change", async () => {
        avatarError.hidden = true;
        const [file] = avatarFile.files || [];

        if (!file) {
            return;
        }

        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            avatarError.textContent = "Р’С‹Р±РµСЂРё РёР·РѕР±СЂР°Р¶РµРЅРёРµ PNG, JPG РёР»Рё WEBP.";
            avatarError.hidden = false;
            avatarFile.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            avatarError.textContent = "Р Р°Р·РјРµСЂ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ РЅРµ РґРѕР»Р¶РµРЅ РїСЂРµРІС‹С€Р°С‚СЊ 10 РњР‘.";
            avatarError.hidden = false;
            avatarFile.value = "";
            return;
        }

        try {
            const source = await compressAvatar(file);
            window.sdonateSetAvatar(source);
            renderAvatar(source);
            showToast("РђРІР°С‚Р°СЂ СЃРѕС…СЂР°РЅС‘РЅ РІ СЌС‚РѕРј Р±СЂР°СѓР·РµСЂРµ Рё РѕСЃС‚Р°РЅРµС‚СЃСЏ РїРѕСЃР»Рµ РѕР±РЅРѕРІР»РµРЅРёСЏ СЃС‚СЂР°РЅРёС†С‹.");
        } catch (error) {
            avatarError.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ Р°РІР°С‚Р°СЂ: ${error.message}`;
            avatarError.hidden = false;
        }
    });

    avatarReset.addEventListener("click", () => {
        avatarFile.value = "";
        window.sdonateSetAvatar("");
        renderAvatar("");
        showToast("РђРІР°С‚Р°СЂ СѓРґР°Р»С‘РЅ РёР· СЌС‚РѕРіРѕ Р±СЂР°СѓР·РµСЂР°.");
    });

    twoFactorToggle.addEventListener("click", () => {
        const enabled = twoFactorToggle.getAttribute("aria-pressed") !== "true";
        twoFactorToggle.setAttribute("aria-pressed", String(enabled));
        twoFactorToggle.textContent = enabled ? "Р’С‹РєР»СЋС‡РёС‚СЊ 2FA" : "Р’РєР»СЋС‡РёС‚СЊ 2FA";
        twoFactorState.textContent = enabled ? "Р”РµРјРѕ В· РІРєР»СЋС‡РµРЅР°" : "Р’С‹РєР»СЋС‡РµРЅР°";
        twoFactorState.classList.toggle("enabled", enabled);
        showToast(enabled
            ? "Р”РµРјРѕ-РїРµСЂРµРєР»СЋС‡Р°С‚РµР»СЊ РІРєР»СЋС‡С‘РЅ. РљРѕРґС‹ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РЅРµ СЃРѕР·РґР°СЋС‚СЃСЏ."
            : "Р”РµРјРѕ-РїРµСЂРµРєР»СЋС‡Р°С‚РµР»СЊ РІС‹РєР»СЋС‡РµРЅ.");
    });

    function appendDialogInput(label, name, type, value, autocomplete) {
        const fieldLabel = document.createElement("label");
        fieldLabel.className = "dialog-field";
        fieldLabel.htmlFor = `dialog-${name}`;
        fieldLabel.textContent = label;

        const input = document.createElement("input");
        input.className = "dialog-input";
        input.id = `dialog-${name}`;
        input.name = name;
        input.type = type;
        input.value = value;
        input.autocomplete = autocomplete;
        input.required = true;
        if (type === "password") {
            input.minLength = 8;
        }

        dialogFields.append(fieldLabel, input);
        return input;
    }

    function openActionDialog(mode) {
        dialogMode = mode;
        dialogFields.replaceChildren();
        dialogFeedback.hidden = true;
        dialogFeedback.classList.remove("error");
        dialogActions.hidden = false;
        dialogConfirm.type = "submit";
        dialogConfirm.textContent = "РџСЂРѕРґРѕР»Р¶РёС‚СЊ";
        dialogCancel.hidden = false;

        if (mode === "email") {
            dialogMark.textContent = "вњ‰";
            dialogTitle.textContent = "РР·РјРµРЅРёС‚СЊ РїРѕС‡С‚Сѓ";
            dialogDescription.textContent = "Р”РµРјРѕ-РёР·РјРµРЅРµРЅРёРµ СЃРѕС…СЂР°РЅРёС‚СЃСЏ С‚РѕР»СЊРєРѕ РІ С‚РµРєСѓС‰РµР№ РІРєР»Р°РґРєРµ. РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ email РЅРµ РѕС‚РїСЂР°РІР»СЏРµС‚СЃСЏ.";
            appendDialogInput("РќРѕРІС‹Р№ email", "email", "email", emailInput.value, "email");
        } else if (mode === "password") {
            dialogMark.textContent = "вЊ‘";
            dialogTitle.textContent = "РР·РјРµРЅРёС‚СЊ РїР°СЂРѕР»СЊ";
            dialogDescription.textContent = "РџР°СЂРѕР»СЊ РґРµРјРѕРЅСЃС‚СЂР°С†РёРѕРЅРЅРѕРіРѕ Р°РєРєР°СѓРЅС‚Р° РЅРµ С…СЂР°РЅРёС‚СЃСЏ Рё РЅРµ РїСЂРѕРІРµСЂСЏРµС‚СЃСЏ.";
            appendDialogInput("РќРѕРІС‹Р№ РїР°СЂРѕР»СЊ", "password", "password", "", "new-password");
            appendDialogInput("РџРѕРІС‚РѕСЂРё РЅРѕРІС‹Р№ РїР°СЂРѕР»СЊ", "confirm-password", "password", "", "new-password");
        } else if (mode === "reset") {
            dialogMark.textContent = "в†»";
            dialogTitle.textContent = "РЎР±СЂРѕСЃРёС‚СЊ РїР°СЂРѕР»СЊ";
            dialogDescription.textContent = "РџРёСЃСЊРјРѕ РґР»СЏ СЃР±СЂРѕСЃР° РЅРµ РѕС‚РїСЂР°РІР»СЏРµС‚СЃСЏ, С‚Р°Рє РєР°Рє РїРѕС‡С‚РѕРІС‹Р№ СЃРµСЂРІРµСЂ РЅРµ РїРѕРґРєР»СЋС‡С‘РЅ.";
            appendDialogInput("Email Р°РєРєР°СѓРЅС‚Р°", "email", "email", emailInput.value, "email");
            dialogConfirm.textContent = "РџРѕРєР°Р·Р°С‚СЊ РґРµРјРѕ";
        } else {
            dialogMark.textContent = "вЊ«";
            dialogTitle.textContent = "РЈРґР°Р»РёС‚СЊ РґРµРјРѕ-Р°РєРєР°СѓРЅС‚?";
            dialogDescription.textContent = "Р”Р°РЅРЅС‹Рµ Р°РєРєР°СѓРЅС‚Р° РІ СЌС‚РѕР№ РІРєР»Р°РґРєРµ Р±СѓРґСѓС‚ СѓРґР°Р»РµРЅС‹. Р­С‚Рѕ РґРµР№СЃС‚РІРёРµ РЅРµР»СЊР·СЏ РѕС‚РјРµРЅРёС‚СЊ.";
            dialogConfirm.textContent = "РЈРґР°Р»РёС‚СЊ РґРµРјРѕ-Р°РєРєР°СѓРЅС‚";
        }

        dialog.showModal();
        dialogFields.querySelector("input")?.focus();
    }

    document.querySelectorAll("[data-account-action]").forEach(button => {
        button.addEventListener("click", () => openActionDialog(button.dataset.accountAction));
    });

    document.querySelector("#delete-account").addEventListener("click", () => {
        openActionDialog("delete");
    });

    const verificationForm = document.querySelector("#verification-form");
    const verificationState = document.querySelector("#verification-state");
    const verificationBadge = document.querySelector("#verification-badge");
    const verificationFeedback = document.querySelector("#verification-feedback");
    const verificationSubmit = document.querySelector("#verification-submit");
    const adminDashboardLink = document.querySelector("#admin-dashboard-link");

    function updateVerificationView(request) {
        if (!request) {
            verificationBadge.textContent = "РќРµ РїСЂРѕРІРµСЂРµРЅРѕ";
            verificationState.textContent = "Р—Р°СЏРІРєРё РїРѕРєР° РЅРµС‚.";
            verificationSubmit.disabled = false;
            verificationSubmit.textContent = "РћС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ";
            return;
        }
        const labels = {
            pending: "РќР° РїСЂРѕРІРµСЂРєРµ",
            approved: "РћРґРѕР±СЂРµРЅРѕ",
            rejected: "РћС‚РєР»РѕРЅРµРЅРѕ"
        };
        verificationBadge.textContent = labels[request.status] || "РќРµРёР·РІРµСЃС‚РЅС‹Р№ СЃС‚Р°С‚СѓСЃ";
        verificationState.textContent = `РЎС‚Р°С‚СѓСЃ: ${labels[request.status] || "РЅРµРёР·РІРµСЃС‚РµРЅ"} В· Р—Р°СЏРІРєР° в„–${request.id}`;
        verificationSubmit.disabled = request.status === "pending" || request.status === "approved";
        verificationSubmit.textContent = request.status === "pending"
            ? "Р—Р°СЏРІРєР° РЅР° СЂР°СЃСЃРјРѕС‚СЂРµРЅРёРё"
            : request.status === "approved"
                ? "Р’РµСЂРёС„РёРєР°С†РёСЏ РїСЂРѕР№РґРµРЅР°"
                : "РћС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ";
    }

    async function loadVerificationStatus() {
        const response = await fetch("/api/verification", {
            credentials: "same-origin",
            cache: "no-store"
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃС‚Р°С‚СѓСЃ РІРµСЂРёС„РёРєР°С†РёРё.");
        }
        updateVerificationView(result.request);
    }

    fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
        .then(async response => {
            if (response.status === 401) {
                window.location.replace("./reg.html?mode=login");
                return null;
            }
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕРІРµСЂРёС‚СЊ РїСЂР°РІР° Р°РєРєР°СѓРЅС‚Р°.");
            }
            return result;
        })
        .then(result => {
            if (result && result.user.isAdmin === true) {
                adminDashboardLink.hidden = false;
            }
        })
        .catch(error => {
            console.error("РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕРІРµСЂРёС‚СЊ РїСЂР°РІР° Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°:", error);
            if (window.location.protocol === "file:") {
                verificationState.textContent = "РћС‚РєСЂРѕР№ СЃР°Р№С‚ С‡РµСЂРµР· СЃРµСЂРІРµСЂ: Р·Р°РїСѓСЃС‚Рё .\\start-sdonate.ps1 Рё РїРµСЂРµР№РґРё РЅР° http://127.0.0.1:3000/settings.html.";
            }
        });

    loadVerificationStatus().catch(error => {
        verificationState.textContent = window.location.protocol === "file:"
            ? "API РЅРµРґРѕСЃС‚СѓРїРµРЅ РїСЂРё РѕС‚РєСЂС‹С‚РёРё HTML РЅР°РїСЂСЏРјСѓСЋ. Р—Р°РїСѓСЃС‚Рё .\\start-sdonate.ps1 Рё РѕС‚РєСЂРѕР№ http://127.0.0.1:3000/settings.html."
            : `РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃС‚Р°С‚СѓСЃ: ${error.message}`;
    });

    verificationForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!verificationForm.reportValidity()) {
            return;
        }
        verificationSubmit.disabled = true;
        verificationFeedback.hidden = true;
        try {
            const formData = new FormData(verificationForm);
            const response = await fetch("/api/verification", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    surname: formData.get("surname"),
                    firstName: formData.get("firstName"),
                    patronymic: formData.get("patronymic"),
                    phone: formData.get("phone"),
                    consent: formData.get("consent") === "on"
                })
            });
            const result = await response.json();
            if (!response.ok) {
                if (response.status === 409) {
                    await loadVerificationStatus();
                }
                throw new Error(result.error || "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ.");
            }
            updateVerificationView(result.request);
            verificationForm.reset();
            if (!result.telegramConfigured) {
                verificationFeedback.textContent = "Р—Р°СЏРІРєР° СЃРѕС…СЂР°РЅРµРЅР°. Telegram РЅРµ РЅР°СЃС‚СЂРѕРµРЅ; Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ СѓРІРёРґРёС‚ РµС‘ РІ РїР°РЅРµР»Рё.";
            } else if (!result.notificationSent) {
                verificationFeedback.textContent = result.notificationError || "Р—Р°СЏРІРєР° СЃРѕС…СЂР°РЅРµРЅР°, РЅРѕ СѓРІРµРґРѕРјР»РµРЅРёРµ Telegram РЅРµ РѕС‚РїСЂР°РІР»РµРЅРѕ.";
            } else {
                verificationFeedback.textContent = "Р—Р°СЏРІРєР° РѕС‚РїСЂР°РІР»РµРЅР°. Р РµС€РµРЅРёРµ РїСЂРёРґС‘С‚ РїРѕСЃР»Рµ РїСЂРѕРІРµСЂРєРё.";
            }
            verificationFeedback.hidden = false;
        } catch (error) {
            verificationSubmit.disabled = false;
            verificationFeedback.textContent = error.message;
            verificationFeedback.hidden = false;
        }
    });

    dialogCancel.addEventListener("click", () => dialog.close());

    dialogForm.addEventListener("submit", event => {
        event.preventDefault();

        if (dialogMode === "delete") {
            dialogFeedback.textContent = "РЈРґР°Р»РµРЅРёРµ СЃРµСЂРІРµСЂРЅРѕР№ СѓС‡С‘С‚РЅРѕР№ Р·Р°РїРёСЃРё РїРѕРєР° РЅРµ РїРѕРґРєР»СЋС‡РµРЅРѕ.";
            dialogFeedback.hidden = false;
            return;
        }

        if (!dialogForm.reportValidity()) {
            return;
        }

        if (dialogMode === "email") {
            const previousEmail = sessionStorage.getItem(storageKeys.email) || "";
            const newEmail = dialogForm.elements.email.value.trim().toLowerCase();
            emailInput.value = newEmail;
            sessionStorage.setItem(storageKeys.email, newEmail);
            window.sdonateMoveAvatar(previousEmail, newEmail);
            dialogFeedback.textContent = "Р”РµРјРѕ: email РёР·РјРµРЅС‘РЅ С‚РѕР»СЊРєРѕ РІ С‚РµРєСѓС‰РµР№ РІРєР»Р°РґРєРµ. РџРёСЃСЊРјРѕ СЃ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµРј РЅРµ РѕС‚РїСЂР°РІР»РµРЅРѕ.";
        } else if (dialogMode === "password") {
            const password = dialogForm.elements.password.value;
            const confirmation = dialogForm.elements["confirm-password"].value;

            if (password !== confirmation) {
                dialogFeedback.textContent = "РџР°СЂРѕР»Рё РЅРµ СЃРѕРІРїР°РґР°СЋС‚.";
                dialogFeedback.classList.add("error");
                dialogFeedback.hidden = false;
                return;
            }

            dialogFeedback.textContent = "Р”РµРјРѕ: РЅРѕРІС‹Р№ РїР°СЂРѕР»СЊ РЅРµ СЃРѕС…СЂР°РЅС‘РЅ, СЃРµСЂРІРµСЂРЅР°СЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ РЅРµ РїРѕРґРєР»СЋС‡РµРЅР°.";
        } else {
            dialogFeedback.textContent = "Р”РµРјРѕ: РїРёСЃСЊРјРѕ РґР»СЏ СЃР±СЂРѕСЃР° РїР°СЂРѕР»СЏ РЅРµ РѕС‚РїСЂР°РІР»РµРЅРѕ.";
        }

        dialogFeedback.classList.remove("error");
        dialogFeedback.hidden = false;
        dialogActions.hidden = true;
    });
}

})();

// Source: shop-create.js
(() => {
if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
    window.location.replace("./reg.html?mode=login");
} else {
    const form = document.querySelector("#create-shop-form");
    const nameInput = document.querySelector("#shop-name");
    const subdomainInput = document.querySelector("#shop-subdomain");
    const payoutMethod = document.querySelector("#payout-method");
    const message = document.querySelector("#form-message");
    const accountName = document.querySelector("#account-name");
    const accountAvatar = document.querySelector("#account-avatar");
    const logoutButton = document.querySelector("#logout-button");
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
    const storageKey = window.sdonateShopStorage.storageKey();

    accountName.textContent = nickname;
    accountAvatar.textContent = Array.from(nickname)[0].toUpperCase();

    subdomainInput.addEventListener("input", () => {
        subdomainInput.value = subdomainInput.value
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
        message.hidden = true;
    });

    nameInput.addEventListener("input", () => {
        message.hidden = true;
    });

    function readShops() {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
            return [];
        }

        const shops = JSON.parse(stored);
        if (!Array.isArray(shops) || shops.some(shop =>
            !shop ||
            typeof shop.id !== "string" ||
            typeof shop.name !== "string" ||
            typeof shop.address !== "string"
        )) {
            throw new Error("РЎРѕС…СЂР°РЅС‘РЅРЅС‹Р№ СЃРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return shops;
    }

    function makeId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function makePluginToken(shops) {
        if (!window.crypto || typeof window.crypto.getRandomValues !== "function") {
            throw new Error("Р‘СЂР°СѓР·РµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ Р±РµР·РѕРїР°СЃРЅРѕРµ СЃРѕР·РґР°РЅРёРµ С‚РѕРєРµРЅР°.");
        }

        for (let attempt = 0; attempt < 5; attempt += 1) {
            const bytes = new Uint8Array(32);
            window.crypto.getRandomValues(bytes);
            const token = `sd_demo_${Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("")}`;
            if (!shops.some(shop => shop.pluginToken === token)) {
                return token;
            }
        }

        throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ СѓРЅРёРєР°Р»СЊРЅС‹Р№ С‚РѕРєРµРЅ. РџРѕРїСЂРѕР±СѓР№ СЃРЅРѕРІР°.");
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        message.hidden = true;

        if (!form.reportValidity()) {
            return;
        }

        const name = nameInput.value.trim();
        const subdomain = subdomainInput.value.trim();
        const address = `${subdomain}.sdonate.store`;

        if (name.length < 2 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(subdomain)) {
            message.textContent = "РџСЂРѕРІРµСЂСЊ РЅР°Р·РІР°РЅРёРµ Рё РїРѕРґРґРѕРјРµРЅ. РџРѕРґРґРѕРјРµРЅ РґРѕР»Р¶РµРЅ СЃРѕРґРµСЂР¶Р°С‚СЊ 3вЂ“30 Р»Р°С‚РёРЅСЃРєРёС… СЃРёРјРІРѕР»РѕРІ, С†РёС„СЂ РёР»Рё РґРµС„РёСЃРѕРІ.";
            message.hidden = false;
            return;
        }

        let shops;
        try {
            shops = readShops();
        } catch (error) {
            message.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ: ${error.message}`;
            message.hidden = false;
            return;
        }

        const duplicate = shops.some(shop =>
            shop.address.toLocaleLowerCase() === address.toLocaleLowerCase()
        );
        if (duplicate) {
            message.textContent = "Р­С‚РѕС‚ РїРѕРґРґРѕРјРµРЅ СѓР¶Рµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ. Р’С‹Р±РµСЂРё РґСЂСѓРіРѕР№.";
            message.hidden = false;
            subdomainInput.focus();
            return;
        }

        try {
            shops.unshift({
                id: makeId(),
                name,
                address,
                payoutMethod: payoutMethod.value,
                pluginToken: makePluginToken(shops)
            });
            window.sdonateShopStorage.save(shops);
        } catch (error) {
            message.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РґРµРјРѕ-РјР°РіР°Р·РёРЅ: ${error.message}`;
            message.hidden = false;
            return;
        }

        window.location.assign(`./shop-dashboard.html?id=${encodeURIComponent(shops[0].id)}`);
    });

    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("sdonate-demo-authenticated");
        window.location.assign("./reg.html?mode=login");
    });
}

})();

// Source: shop-dashboard.js
(() => {
if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
    window.location.replace("./reg.html?mode=login");
} else {
    const storageKey = window.sdonateShopStorage.storageKey();
    const params = new URLSearchParams(window.location.search);
    const shopId = params.get("id");
    const shopName = document.querySelector("#shop-name");
    const shopAddress = document.querySelector("#shop-address");
    const accountName = document.querySelector("#account-name");
    const accountAvatar = document.querySelector("#account-avatar");
    const toast = document.querySelector("#store-toast");
    const tokenDisplay = document.querySelector("#plugin-token");
    const toggleTokenButton = document.querySelector("#toggle-token");
    const copyTokenButton = document.querySelector("#copy-token");
    const regenerateTokenButton = document.querySelector("#regenerate-token");
    const deleteDialog = document.querySelector("#store-delete-dialog");
    const confirmShopName = document.querySelector("#confirm-shop-name");
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
    let toastTimer;

    accountName.textContent = nickname;
    accountAvatar.textContent = Array.from(nickname)[0].toUpperCase();

    function readShops() {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РЅРµ РЅР°Р№РґРµРЅ.");
        }

        const shops = JSON.parse(stored);
        if (!Array.isArray(shops) || shops.some(shop =>
            !shop ||
            typeof shop.id !== "string" ||
            typeof shop.name !== "string" ||
            typeof shop.address !== "string"
        )) {
            throw new Error("РЎРѕС…СЂР°РЅС‘РЅРЅС‹Р№ СЃРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return shops;
    }

    function showToast(text) {
        window.clearTimeout(toastTimer);
        toast.textContent = text;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 3500);
    }

    function createPluginToken(shops, currentShopId) {
        if (!window.crypto || typeof window.crypto.getRandomValues !== "function") {
            throw new Error("Р‘СЂР°СѓР·РµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ Р±РµР·РѕРїР°СЃРЅРѕРµ СЃРѕР·РґР°РЅРёРµ С‚РѕРєРµРЅР°.");
        }

        for (let attempt = 0; attempt < 5; attempt += 1) {
            const bytes = new Uint8Array(32);
            window.crypto.getRandomValues(bytes);
            const token = `sd_demo_${Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("")}`;
            if (!shops.some(item => item.id !== currentShopId && item.pluginToken === token)) {
                return token;
            }
        }

        throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ СѓРЅРёРєР°Р»СЊРЅС‹Р№ С‚РѕРєРµРЅ. РџРѕРїСЂРѕР±СѓР№ СЃРЅРѕРІР°.");
    }

    let isTokenVisible = false;
    function renderToken() {
        tokenDisplay.textContent = isTokenVisible
            ? shop.pluginToken
            : `вЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂў${shop.pluginToken.slice(-6)}`;
        toggleTokenButton.setAttribute("aria-pressed", String(isTokenVisible));
        toggleTokenButton.setAttribute("aria-label", isTokenVisible ? "РЎРєСЂС‹С‚СЊ С‚РѕРєРµРЅ" : "РџРѕРєР°Р·Р°С‚СЊ С‚РѕРєРµРЅ");
    }

    let shop;
    let shops;
    try {
        shops = readShops();
        shop = shops.find(item => item.id === shopId);
    } catch (error) {
        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РјР°РіР°Р·РёРЅ: ${error.message}`);
    }

    if (!shop) {
        if (!toast.textContent) {
            showToast("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ РёР»Рё СѓР¶Рµ СѓРґР°Р»С‘РЅ.");
        }
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    } else {
        try {
            if (typeof shop.pluginToken !== "string" || !shop.pluginToken.startsWith("sd_demo_")) {
                shop.pluginToken = createPluginToken(shops, shop.id);
                window.sdonateShopStorage.save(shops);
            }
            renderToken();
        } catch (error) {
            tokenDisplay.textContent = "РўРѕРєРµРЅ РЅРµРґРѕСЃС‚СѓРїРµРЅ";
            toggleTokenButton.disabled = true;
            copyTokenButton.disabled = true;
            regenerateTokenButton.disabled = true;
            showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕРґРіРѕС‚РѕРІРёС‚СЊ С‚РѕРєРµРЅ: ${error.message}`);
        }

        shopName.textContent = shop.name;
        shopAddress.textContent = shop.address || "РџРѕРґРґРѕРјРµРЅ РЅРµ СѓРєР°Р·Р°РЅ";
        document.title = `${shop.name} вЂ” SDonate`;
        confirmShopName.textContent = shop.name;
        document.querySelector("#storefront-preview-button").href =
            `./public-store.html?id=${encodeURIComponent(shop.id)}&owner=${encodeURIComponent(sessionStorage.getItem("sdonate-demo-user-id") || "")}`;

        document.querySelector("#rename-store").addEventListener("click", () => {
            window.location.assign(`./store-settings.html?id=${encodeURIComponent(shop.id)}`);
        });

        document.querySelectorAll(".management-card[data-tool]").forEach(button => {
            button.addEventListener("click", () => {
                if (button.dataset.tool === "РќР°СЃС‚СЂРѕР№РєРё") {
                    window.location.assign(`./store-settings.html?id=${encodeURIComponent(shop.id)}`);
                    return;
                }
                if (button.dataset.tool === "РўРѕРІР°СЂС‹") {
                    window.location.assign(`./store-products.html?id=${encodeURIComponent(shop.id)}`);
                    return;
                }
                if (button.dataset.tool === "РљСѓРїРѕРЅС‹") {
                    window.location.assign(`./coupons.html?id=${encodeURIComponent(shop.id)}`);
                    return;
                }
                if (button.dataset.tool === "РЎС‚СЂР°РЅРёС†С‹") {
                    window.location.assign(`./store-pages.html?id=${encodeURIComponent(shop.id)}`);
                    return;
                }
                if (button.dataset.tool === "РџРѕРґР±РѕСЂРєРё") {
                    window.location.assign(`./store-collections.html?id=${encodeURIComponent(shop.id)}`);
                    return;
                }
                if (button.dataset.tool === "РњР°СЃСЃРѕРІС‹Рµ СЃРєРёРґРєРё") {
                    window.location.assign(`./store-discounts.html?id=${encodeURIComponent(shop.id)}`);
                    return;
                }
                if (button.dataset.tool === "Р¤РѕСЂРјС‹") {
                    window.location.assign(`./store-forms.html?id=${encodeURIComponent(shop.id)}`);
                    return;
                }
                if (button.dataset.tool === "РЎРµСЂРІРµСЂС‹") {
                    window.location.assign(`./servers.html?id=${encodeURIComponent(shop.id)}`);
                    return;
                }
                if (button.dataset.tool === "РџР°СЂС‚РЅС‘СЂС‹") {
                    window.location.assign(`./store-partners.html?id=${encodeURIComponent(shop.id)}`);
                    return;
                }
                const toolRoutes = {
                    "РЎРµСЂРІРµСЂС‹": "servers",
                    "РљСѓРїРѕРЅС‹": "coupons",
                    "РџР°СЂС‚РЅС‘СЂС‹": "partners",
                    "РњР°СЃСЃРѕРІС‹Рµ РѕР¶РёРґР°РЅРёСЏ": "waits",
                    "РџРѕРґР±РѕСЂРєРё": "collections",
                    "РЎС‚СЂР°РЅРёС†С‹": "pages",
                    "РђРЅР°Р»РёС‚РёРєР°": "analytics",
                    "РџР»Р°РіРёРЅС‹": "plugins"
                };
                const route = toolRoutes[button.dataset.tool];
                if (route) {
                    window.location.assign(`./store-tools.html?id=${encodeURIComponent(shop.id)}&tool=${encodeURIComponent(route)}`);
                } else {
                    showToast(`Р Р°Р·РґРµР» В«${button.dataset.tool}В» РЅРµРґРѕСЃС‚СѓРїРµРЅ.`);
                }
            });
        });

        document.querySelector(".view-orders").addEventListener("click", event => {
            event.preventDefault();
            showToast("РСЃС‚РѕСЂРёСЏ РїРѕРєСѓРїРѕРє РїРѕСЏРІРёС‚СЃСЏ РїРѕСЃР»Рµ РїРѕРґРєР»СЋС‡РµРЅРёСЏ РјР°РіР°Р·РёРЅР°.");
        });

        toggleTokenButton.addEventListener("click", () => {
            isTokenVisible = !isTokenVisible;
            renderToken();
        });

        copyTokenButton.addEventListener("click", async () => {
            try {
                if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
                    throw new Error("РљРѕРїРёСЂРѕРІР°РЅРёРµ РЅРµРґРѕСЃС‚СѓРїРЅРѕ РІ СЌС‚РѕРј Р±СЂР°СѓР·РµСЂРµ. РџРѕРєР°Р¶Рё С‚РѕРєРµРЅ Рё СЃРєРѕРїРёСЂСѓР№ РµРіРѕ РІСЂСѓС‡РЅСѓСЋ.");
                }
                await navigator.clipboard.writeText(shop.pluginToken);
                showToast("Р”РµРјРѕ-С‚РѕРєРµРЅ СЃРєРѕРїРёСЂРѕРІР°РЅ.");
            } catch (error) {
                showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СЃРєРѕРїРёСЂРѕРІР°С‚СЊ С‚РѕРєРµРЅ: ${error.message}`);
            }
        });

        regenerateTokenButton.addEventListener("click", () => {
            if (!window.confirm("РЎРѕР·РґР°С‚СЊ РЅРѕРІС‹Р№ С‚РѕРєРµРЅ? РЎС‚Р°СЂС‹Р№ С‚РѕРєРµРЅ СЃСЂР°Р·Сѓ РїРµСЂРµСЃС‚Р°РЅРµС‚ РѕС‚РѕР±СЂР°Р¶Р°С‚СЊСЃСЏ РІ СЌС‚РѕРј РґРµРјРѕ-РјР°РіР°Р·РёРЅРµ.")) {
                return;
            }
            try {
                shops = readShops();
                shop = shops.find(item => item.id === shopId);
                if (!shop) {
                    throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
                }
                shop.pluginToken = createPluginToken(shops, shop.id);
                window.sdonateShopStorage.save(shops);
                isTokenVisible = false;
                renderToken();
                showToast("РЎРѕР·РґР°РЅ РЅРѕРІС‹Р№ СѓРЅРёРєР°Р»СЊРЅС‹Р№ РґРµРјРѕ-С‚РѕРєРµРЅ.");
            } catch (error) {
                showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ С‚РѕРєРµРЅ: ${error.message}`);
            }
        });

        document.querySelector("#delete-shop").addEventListener("click", () => {
            deleteDialog.showModal();
        });

        document.querySelector("#cancel-delete").addEventListener("click", () => {
            deleteDialog.close();
        });

        document.querySelector("#confirm-delete").addEventListener("click", () => {
            try {
                const shops = readShops();
                const remainingShops = shops.filter(item => item.id !== shopId);
                if (remainingShops.length === shops.length) {
                    throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ РІ СЃРїРёСЃРєРµ.");
                }
                window.sdonateShopStorage.save(remainingShops);
                window.location.assign("./shops.html");
            } catch (error) {
                showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РјР°РіР°Р·РёРЅ: ${error.message}`);
                deleteDialog.close();
            }
        });

        document.querySelector("#logout-button").addEventListener("click", () => {
            sessionStorage.removeItem("sdonate-demo-authenticated");
            window.location.assign("./reg.html?mode=login");
        });
    }
}

})();

// Source: shops.js
(() => {
if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
    window.location.replace("./reg.html?mode=login");
} else {
    const storageKey = window.sdonateShopStorage.storageKey();
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
    const accountName = document.querySelector("#account-name");
    const accountAvatar = document.querySelector("#account-avatar");
    const shopsAccountName = document.querySelector("#shops-account-name");
    const shopList = document.querySelector("#shop-list");
    const shopCount = document.querySelector("#shop-count");
    const shopCountLabel = document.querySelector("#shop-count-label");
    const emptyState = document.querySelector("#shops-empty");
    const toast = document.querySelector("#shops-toast");
    const logoutButton = document.querySelector("#logout-button");
    const shopDialog = document.querySelector("#shop-dialog");
    const editForm = document.querySelector("#shop-edit-form");
    const editNameInput = document.querySelector("#edit-shop-name");
    const editAddressInput = document.querySelector("#edit-shop-address");
    const editFeedback = document.querySelector("#shop-edit-feedback");
    const deleteDialog = document.querySelector("#delete-dialog");
    const deleteShopName = document.querySelector("#delete-shop-name");
    let activeShopId = null;
    let toastTimer;

    accountName.textContent = nickname;
    accountAvatar.textContent = Array.from(nickname)[0].toUpperCase();
    shopsAccountName.textContent = nickname;

    function showToast(message) {
        window.clearTimeout(toastTimer);
        toast.textContent = message;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 3500);
    }

    function makeId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function readShops() {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
            const initialShop = [{
                id: makeId(),
                name: "РњРѕР№ РјР°РіР°Р·РёРЅ",
                address: "play.example.net",
                payoutMethod: "RCON"
            }];
            window.sdonateShopStorage.save(initialShop);
            return initialShop;
        }

        const shops = JSON.parse(stored);
        if (!Array.isArray(shops) || shops.some(shop =>
            !shop ||
            typeof shop.id !== "string" ||
            typeof shop.name !== "string" ||
            typeof shop.address !== "string"
        )) {
            throw new Error("РЎРѕС…СЂР°РЅС‘РЅРЅС‹Р№ СЃРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }

        const previousDefaultName = `${nickname} вЂ” РјРѕР№ РјР°РіР°Р·РёРЅ`;
        const migrated = shops.some(shop => shop.name === previousDefaultName);
        if (migrated) {
            shops.forEach(shop => {
                if (shop.name === previousDefaultName) {
                    shop.name = "РњРѕР№ РјР°РіР°Р·РёРЅ";
                }
            });
            window.sdonateShopStorage.save(shops);
        }
        return shops;
    }

    function makeShopCard(shop) {
        const card = document.createElement("article");
        card.className = "shop-card";

        const cover = document.createElement("div");
        cover.className = "shop-card-cover";

        const mark = document.createElement("span");
        mark.className = "shop-mark";
        mark.textContent = Array.from(shop.name.trim() || "Рњ")[0].toUpperCase();

        const copy = document.createElement("div");
        copy.className = "shop-cover-copy";
        const type = document.createElement("small");
        type.textContent = "РњР°РіР°Р·РёРЅ СЃРµСЂРІРµСЂР°";
        const title = document.createElement("b");
        title.textContent = shop.name;
        copy.append(type, title);

        const status = document.createElement("span");
        status.className = "shop-status";
        const statusDot = document.createElement("i");
        status.append(statusDot, document.createTextNode("Р”РµРјРѕ"));
        cover.append(mark, copy, status);

        const body = document.createElement("div");
        body.className = "shop-card-body";

        const nameRow = document.createElement("div");
        nameRow.className = "shop-name-row";
        const name = document.createElement("h3");
        name.textContent = shop.name;
        const demo = document.createElement("span");
        demo.className = "demo-label";
        demo.textContent = "РџР Р•Р”РџР РћРЎРњРћРўР ";
        nameRow.append(name, demo);

        const address = document.createElement("p");
        address.className = "shop-address";
        const addressIcon = document.createElement("span");
        addressIcon.textContent = "вЊЃ";
        const addressText = document.createElement("span");
        addressText.textContent = shop.address || "РџРѕРґРґРѕРјРµРЅ РЅРµ СѓРєР°Р·Р°РЅ";
        address.append(addressIcon, addressText);

        const actions = document.createElement("div");
        actions.className = "shop-actions";

        const openButton = document.createElement("button");
        openButton.className = "shop-open-button";
        openButton.type = "button";
        const openLabel = document.createElement("span");
        openLabel.textContent = "в†—";
        openButton.append(document.createTextNode("РћС‚РєСЂС‹С‚СЊ"), openLabel);
        openButton.addEventListener("click", () => {
            window.location.assign(`./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`);
        });

        const settingsButton = document.createElement("button");
        settingsButton.className = "shop-edit-button";
        settingsButton.type = "button";
        const settingsLabel = document.createElement("span");
        settingsLabel.textContent = "вљ™";
        settingsButton.append(document.createTextNode("РќР°СЃС‚СЂРѕРёС‚СЊ"), settingsLabel);
        settingsButton.addEventListener("click", () => {
            openShopSettings(shop);
        });

        actions.append(openButton, settingsButton);
        body.append(nameRow, address, actions);
        card.append(cover, body);
        return card;
    }

    function renderShops() {
        const shops = readShops();
        shopList.replaceChildren(...shops.map(makeShopCard));
        shopCount.textContent = String(shops.length);
        const lastTwoDigits = shops.length % 100;
        const lastDigit = shops.length % 10;
        shopCountLabel.textContent = lastTwoDigits >= 11 && lastTwoDigits <= 14
            ? "РњРђР“РђР—РРќРћР’"
            : lastDigit === 1
                ? "РњРђР“РђР—РРќ"
                : lastDigit >= 2 && lastDigit <= 4
                    ? "РњРђР“РђР—РРќРђ"
                    : "РњРђР“РђР—РРќРћР’";
        emptyState.hidden = shops.length !== 0;
        shopList.hidden = shops.length === 0;
    }

    function openShopSettings(shop) {
        activeShopId = shop.id;
        editNameInput.value = shop.name;
        editAddressInput.value = shop.address;
        editFeedback.hidden = true;
        shopDialog.showModal();
        editNameInput.focus();
    }

    function saveShopChanges(event) {
        event.preventDefault();
        editFeedback.hidden = true;

        if (!editForm.reportValidity()) {
            return;
        }

        try {
            const shops = readShops();
            const shop = shops.find(item => item.id === activeShopId);
            if (!shop) {
                editFeedback.textContent = "РќРµ СѓРґР°Р»РѕСЃСЊ РЅР°Р№С‚Рё СЌС‚РѕС‚ РјР°РіР°Р·РёРЅ. Р—Р°РєСЂРѕР№ РѕРєРЅРѕ Рё РѕР±РЅРѕРІРё СЃРїРёСЃРѕРє.";
                editFeedback.hidden = false;
                return;
            }

            const name = editNameInput.value.trim();
            if (name.length < 2) {
                editFeedback.textContent = "РќР°Р·РІР°РЅРёРµ РјР°РіР°Р·РёРЅР° РґРѕР»Р¶РЅРѕ СЃРѕРґРµСЂР¶Р°С‚СЊ РјРёРЅРёРјСѓРј РґРІР° СЃРёРјРІРѕР»Р°.";
                editFeedback.hidden = false;
                return;
            }

            shop.name = name;
            shop.address = editAddressInput.value.trim();
            window.sdonateShopStorage.save(shops);
            renderShops();
            shopDialog.close();
            showToast("Р”РµРјРѕ-РјР°РіР°Р·РёРЅ РѕР±РЅРѕРІР»С‘РЅ.");
        } catch (error) {
            editFeedback.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ: ${error.message}`;
            editFeedback.hidden = false;
        }
    }

    function openDeleteConfirmation() {
        try {
            const shop = readShops().find(item => item.id === activeShopId);
            if (!shop) {
                editFeedback.textContent = "РќРµ СѓРґР°Р»РѕСЃСЊ РЅР°Р№С‚Рё СЌС‚РѕС‚ РјР°РіР°Р·РёРЅ РІ СЃРїРёСЃРєРµ.";
                editFeedback.hidden = false;
                return;
            }
            deleteShopName.textContent = shop.name;
            shopDialog.close();
            deleteDialog.showModal();
        } catch (error) {
            editFeedback.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РјР°РіР°Р·РёРЅ: ${error.message}`;
            editFeedback.hidden = false;
        }
    }

    function deleteActiveShop() {
        try {
            const shops = readShops();
            const remainingShops = shops.filter(shop => shop.id !== activeShopId);
            if (remainingShops.length === shops.length) {
                deleteDialog.close();
                showToast("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ: СЃРїРёСЃРѕРє РјРѕРі РёР·РјРµРЅРёС‚СЊСЃСЏ.");
                return;
            }

            window.sdonateShopStorage.save(remainingShops);
            renderShops();
            deleteDialog.close();
            activeShopId = null;
            showToast("Р”РµРјРѕ-РјР°РіР°Р·РёРЅ СѓРґР°Р»С‘РЅ.");
        } catch (error) {
            showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РјР°РіР°Р·РёРЅ: ${error.message}`);
        }
    }

    editForm.addEventListener("submit", saveShopChanges);
    document.querySelector("#shop-dialog-close").addEventListener("click", () => shopDialog.close());
    document.querySelector("#shop-edit-cancel").addEventListener("click", () => shopDialog.close());
    document.querySelector("#delete-shop").addEventListener("click", openDeleteConfirmation);
    document.querySelector("#delete-cancel").addEventListener("click", () => {
        deleteDialog.close();
        shopDialog.showModal();
    });
    document.querySelector("#confirm-delete").addEventListener("click", deleteActiveShop);

    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("sdonate-demo-authenticated");
        window.location.assign("./reg.html?mode=login");
    });

    try {
        renderShops();
    } catch (error) {
        shopList.hidden = true;
        emptyState.hidden = true;
        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РјР°РіР°Р·РёРЅС‹: ${error.message}`);
    }
}

})();

// Source: store-collections.js
(() => {
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
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
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
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item.id !== "string" || typeof item.name !== "string")) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return parsed;
    }

    function saveShop() {
        const shops = readShops();
        const index = shops.findIndex(item => item.id === shopId);
        if (index < 0) {
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
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

    // Р—Р°РїРёСЃРё РёР· СЃС‚Р°СЂРѕРіРѕ РїСЂРѕСЃС‚РѕРіРѕ РёРЅСЃС‚СЂСѓРјРµРЅС‚Р° (name/detail) С‚РѕР¶Рµ С‡РёС‚Р°СЋС‚СЃСЏ.
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
        return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(price) || 0)} в‚Ѕ`;
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
        all.textContent = "Р’СЃРµ СЃРµСЂРІРµСЂС‹";
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
            note.textContent = "Р’ РјР°РіР°Р·РёРЅРµ РїРѕРєР° РЅРµС‚ С‚РѕРІР°СЂРѕРІ.";
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
                image.addEventListener("error", () => reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.")), { once: true });
                image.src = imageUrl;
            });
        } finally {
            URL.revokeObjectURL(imageUrl);
        }
        if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 36000000) {
            throw new Error("РЈ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ СЃР»РёС€РєРѕРј Р±РѕР»СЊС€РѕРµ СЂР°Р·СЂРµС€РµРЅРёРµ.");
        }
        const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±СЂР°Р±РѕС‚Р°С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.");
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        for (const quality of [0.82, 0.68, 0.54, 0.4]) {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", quality));
            if (!blob || blob.type !== "image/webp") {
                throw new Error("Р‘СЂР°СѓР·РµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ СЃР¶Р°С‚РёРµ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ.");
            }
            if (blob.size <= 400 * 1024) {
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.addEventListener("load", () => typeof reader.result === "string"
                        ? resolve(reader.result)
                        : reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕС‡РёС‚Р°С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.")), { once: true });
                    reader.addEventListener("error", () => reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕС‡РёС‚Р°С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.")), { once: true });
                    reader.readAsDataURL(blob);
                });
            }
        }
        throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ СѓРјРµРЅСЊС€РёС‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ РґРѕ 400 РљР‘.");
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
            description.textContent = `${count} ${pluralize(count, "С‚РѕРІР°СЂ", "С‚РѕРІР°СЂР°", "С‚РѕРІР°СЂРѕРІ")}`;
            const server = document.createElement("span");
            server.className = "pages-card-address";
            server.textContent = collection.server || "Р’СЃРµ СЃРµСЂРІРµСЂС‹";
            copy.append(title, description, server);
            const actions = document.createElement("div");
            actions.className = "pages-card-actions";
            const edit = document.createElement("button");
            edit.className = "pages-icon-button";
            edit.type = "button";
            edit.dataset.action = "edit";
            edit.dataset.id = collection.id;
            edit.setAttribute("aria-label", `РР·РјРµРЅРёС‚СЊ ${collection.name}`);
            edit.textContent = "вњЋ";
            const remove = document.createElement("button");
            remove.className = "pages-icon-button danger";
            remove.type = "button";
            remove.dataset.action = "delete";
            remove.dataset.id = collection.id;
            remove.setAttribute("aria-label", `РЈРґР°Р»РёС‚СЊ ${collection.name}`);
            remove.textContent = "Г—";
            actions.append(edit, remove);
            card.append(copy, actions);
            list.append(card);
        });
        empty.hidden = collections.length > 0;
        document.querySelector("#collections-count").textContent =
            `${collections.length} ${pluralize(collections.length, "РїРѕРґР±РѕСЂРєР°", "РїРѕРґР±РѕСЂРєРё", "РїРѕРґР±РѕСЂРѕРє")}`;
    }

    function resetForm() {
        form.reset();
        editingId = null;
        feedback.hidden = true;
        document.querySelector("#collection-form-title").textContent = "Р”РѕР±Р°РІР»РµРЅРёРµ РїРѕРґР±РѕСЂРєРё";
        document.querySelector("#collection-save-label").textContent = "Р”РѕР±Р°РІРёС‚СЊ";
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
        document.querySelector("#collection-form-title").textContent = "Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ РїРѕРґР±РѕСЂРєРё";
        document.querySelector("#collection-save-label").textContent = "РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ";
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
            showFeedback("Р’С‹Р±РµСЂРёС‚Рµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ PNG, JPG РёР»Рё WEBP.");
            imageInput.value = "";
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showFeedback("РСЃС…РѕРґРЅРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ РЅРµ РґРѕР»Р¶РЅРѕ РїСЂРµРІС‹С€Р°С‚СЊ 10 РњР‘.");
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
            showFeedback("РЈРєР°Р¶РёС‚Рµ РЅР°Р·РІР°РЅРёРµ РїРѕРґР±РѕСЂРєРё.");
            form.elements.name.focus();
            return;
        }
        const collections = getCollections();
        if (collections.some(item => item.id !== editingId && item.name.toLowerCase() === name.toLowerCase())) {
            showFeedback("РџРѕРґР±РѕСЂРєР° СЃ С‚Р°РєРёРј РЅР°Р·РІР°РЅРёРµРј СѓР¶Рµ РµСЃС‚СЊ.");
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
            showToast(wasEditing ? "РџРѕРґР±РѕСЂРєР° РѕР±РЅРѕРІР»РµРЅР°." : "РџРѕРґР±РѕСЂРєР° РґРѕР±Р°РІР»РµРЅР°.");
        } catch (error) {
            shop.tools.collections = previous;
            showFeedback(`РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РїРѕРґР±РѕСЂРєСѓ: ${error.message}`);
        }
    });

    list.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }
        const collection = getCollections().find(item => item.id === button.dataset.id);
        if (!collection) {
            showToast("РџРѕРґР±РѕСЂРєР° РЅРµ РЅР°Р№РґРµРЅР°. РћР±РЅРѕРІРёС‚Рµ СЃС‚СЂР°РЅРёС†Сѓ.");
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
            showToast("РџРѕРґР±РѕСЂРєР° СѓРґР°Р»РµРЅР°.");
        } catch (error) {
            shop.tools.collections = previous;
            showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РїРѕРґР±РѕСЂРєСѓ: ${error.message}`);
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
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        shop.tools = shop.tools && typeof shop.tools === "object" ? shop.tools : {};
        document.title = `РџРѕРґР±РѕСЂРєРё вЂ” ${shop.name} вЂ” SDonate`;
        document.querySelector("#collections-shop-caption").textContent = `Р“СЂСѓРїРїРёСЂСѓР№С‚Рµ С‚РѕРІР°СЂС‹ РјР°РіР°Р·РёРЅР° В«${shop.name}В» РІ РїРѕРґР±РѕСЂРєРё.`;
        document.querySelector("#back-to-shop").href = `./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`;
        resetForm();
        renderCollections();
    } catch (error) {
        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РїРѕРґР±РѕСЂРєРё: ${error.message}`);
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    }
})();

})();

// Source: store-discounts.js
(() => {
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
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
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
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return parsed;
    }

    function saveShop() {
        const shops = readShops();
        const index = shops.findIndex(item => item.id === shopId);
        if (index < 0) {
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
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
        return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(price) || 0)} в‚Ѕ`;
    }

    function renderProductPicker(selectedIds = []) {
        productsBox.replaceChildren();
        const products = getProducts();
        if (products.length === 0) {
            const note = document.createElement("p");
            note.className = "collection-products-empty";
            note.textContent = "Р’ РјР°РіР°Р·РёРЅРµ РїРѕРєР° РЅРµС‚ С‚РѕРІР°СЂРѕРІ.";
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
            const parts = [["percent", `РЎРєРёРґРєР°: ${discount.percent}%`]];
            if (discount.startAt) parts.push(["state", `РќР°С‡РёРЅР°РµС‚СЃСЏ ${formatDate(discount.startAt)}`]);
            if (discount.endAt) parts.push(["state", `Р—Р°РєР°РЅС‡РёРІР°РµС‚СЃСЏ ${formatDate(discount.endAt)}`]);
            parts.push(["state", discount.productIds.length ? `РўРѕРІР°СЂРѕРІ: ${discount.productIds.length}` : "Р’СЃРµ С‚РѕРІР°СЂС‹"]);
            parts.forEach(([className, text], index) => {
                if (index > 0) meta.append(document.createTextNode("вЂў"));
                const span = document.createElement("span");
                span.className = className;
                span.textContent = text;
                meta.append(span);
            });
            const actions = document.createElement("div");
            actions.className = "discount-card-actions";
            [["delete", "рџ—‘", "РЈРґР°Р»РёС‚СЊ"], ["edit", "вљ™", "РР·РјРµРЅРёС‚СЊ"]].forEach(([action, symbol, label]) => {
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
        document.querySelector("#discount-form-title").textContent = discount ? "Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ РјР°СЃСЃРѕРІРѕР№ СЃРєРёРґРєРё" : "Р”РѕР±Р°РІР»РµРЅРёРµ РјР°СЃСЃРѕРІРѕР№ СЃРєРёРґРєРё";
        document.querySelector("#discount-save-label").textContent = discount ? "РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ" : "Р”РѕР±Р°РІРёС‚СЊ";
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
            showFeedback("РЈРєР°Р¶РёС‚Рµ РЅР°Р·РІР°РЅРёРµ СЃРєРёРґРєРё.");
            return;
        }
        if (!Number.isFinite(percent) || percent < 1 || percent > 99) {
            showFeedback("РџСЂРѕС†РµРЅС‚ СЃРєРёРґРєРё вЂ” РѕС‚ 1 РґРѕ 99.");
            return;
        }
        if (startAt && endAt && endAt < startAt) {
            showFeedback("РћРєРѕРЅС‡Р°РЅРёРµ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ СЂР°РЅСЊС€Рµ РЅР°С‡Р°Р»Р°.");
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
            showToast(wasEditing ? "РЎРєРёРґРєР° РѕР±РЅРѕРІР»РµРЅР°." : "РЎРєРёРґРєР° РґРѕР±Р°РІР»РµРЅР°.");
        } catch (error) {
            shop.tools.discounts = previous;
            showFeedback(`РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ СЃРєРёРґРєСѓ: ${error.message}`);
        }
    });

    list.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }
        const discount = getDiscounts().find(item => item.id === button.dataset.id);
        if (!discount) {
            showToast("РЎРєРёРґРєР° РЅРµ РЅР°Р№РґРµРЅР°. РћР±РЅРѕРІРёС‚Рµ СЃС‚СЂР°РЅРёС†Сѓ.");
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
            showToast("РЎРєРёРґРєР° СѓРґР°Р»РµРЅР°.");
        } catch (error) {
            shop.tools.discounts = previous;
            showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ СЃРєРёРґРєСѓ: ${error.message}`);
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
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        shop.tools = shop.tools && typeof shop.tools === "object" ? shop.tools : {};
        document.title = `РњР°СЃСЃРѕРІС‹Рµ СЃРєРёРґРєРё вЂ” ${shop.name} вЂ” SDonate`;
        document.querySelector("#discounts-shop-name").textContent = shop.name;
        document.querySelector("#back-to-shop").href = `./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`;
        renderDiscounts();
    } catch (error) {
        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ СЃРєРёРґРєРё: ${error.message}`);
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    }
})();

})();

// Source: store-forms.js
(() => {
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
            label: "РҐРµР»РїРµСЂ",
            title: "Р—Р°СЏРІРєР° РЅР° С…РµР»РїРµСЂР°",
            description: "РџРѕРјРѕРіР°Р№С‚Рµ РёРіСЂРѕРєР°Рј Рё СЃР»РµРґРёС‚Рµ Р·Р° РїРѕСЂСЏРґРєРѕРј РЅР° СЃРµСЂРІРµСЂРµ.",
            buttonText: "РџРѕРґР°С‚СЊ Р·Р°СЏРІРєСѓ",
            questions: ["Р’Р°С€ РёРіСЂРѕРІРѕР№ РЅРёРє", "Р’РѕР·СЂР°СЃС‚", "Р’Р°С€ Discord / Telegram", "Р•СЃС‚СЊ Р»Рё РѕРїС‹С‚ СЂР°Р±РѕС‚С‹ С…РµР»РїРµСЂРѕРј?", "РџРѕС‡РµРјСѓ РІС‹ С…РѕС‚РёС‚Рµ СЃС‚Р°С‚СЊ С…РµР»РїРµСЂРѕРј?"]
        },
        moderator: {
            label: "РњРѕРґРµСЂР°С‚РѕСЂ",
            title: "Р—Р°СЏРІРєР° РЅР° РјРѕРґРµСЂР°С‚РѕСЂР°",
            description: "РЎР»РµРґРёС‚Рµ Р·Р° СЃРѕР±Р»СЋРґРµРЅРёРµРј РїСЂР°РІРёР» Рё СЂРµС€Р°Р№С‚Рµ СЃРїРѕСЂС‹ РёРіСЂРѕРєРѕРІ.",
            buttonText: "РџРѕРґР°С‚СЊ Р·Р°СЏРІРєСѓ",
            questions: ["Р’Р°С€ РёРіСЂРѕРІРѕР№ РЅРёРє", "Р’РѕР·СЂР°СЃС‚", "Р’Р°С€ Discord / Telegram", "РћРїС‹С‚ РјРѕРґРµСЂР°С†РёРё РЅР° РґСЂСѓРіРёС… РїСЂРѕРµРєС‚Р°С…", "РЎРєРѕР»СЊРєРѕ С‡Р°СЃРѕРІ РІ РґРµРЅСЊ РІС‹ РјРѕР¶РµС‚Рµ СѓРґРµР»СЏС‚СЊ СЃРµСЂРІРµСЂСѓ?"]
        },
        tiktok: {
            label: "TikTok РјРµРґРёР°",
            title: "Р—Р°СЏРІРєР° РґР»СЏ TikTok-Р±Р»РѕРіРµСЂРѕРІ",
            description: "РЎРЅРёРјР°РµС‚Рµ РІРёРґРµРѕ РїРѕ РЅР°С€РµРјСѓ СЃРµСЂРІРµСЂСѓ? РћСЃС‚Р°РІСЊС‚Рµ Р·Р°СЏРІРєСѓ РЅР° СЃРѕС‚СЂСѓРґРЅРёС‡РµСЃС‚РІРѕ.",
            buttonText: "РћС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ",
            questions: ["Р’Р°С€ РёРіСЂРѕРІРѕР№ РЅРёРє", "РЎСЃС‹Р»РєР° РЅР° TikTok-Р°РєРєР°СѓРЅС‚", "РљРѕР»РёС‡РµСЃС‚РІРѕ РїРѕРґРїРёСЃС‡РёРєРѕРІ", "РЎСЂРµРґРЅРёРµ РїСЂРѕСЃРјРѕС‚СЂС‹ РІРёРґРµРѕ", "РљРѕРЅС‚Р°РєС‚ РґР»СЏ СЃРІСЏР·Рё"]
        },
        youtube: {
            label: "YouTube РјРµРґРёР°",
            title: "Р—Р°СЏРІРєР° РґР»СЏ СЋС‚СѓР±РµСЂРѕРІ",
            description: "Р”РµР»Р°РµС‚Рµ СЂРѕР»РёРєРё РїРѕ Minecraft? Р Р°СЃСЃРєР°Р¶РёС‚Рµ Рѕ СЃРІРѕС‘Рј РєР°РЅР°Р»Рµ.",
            buttonText: "РћС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ",
            questions: ["Р’Р°С€ РёРіСЂРѕРІРѕР№ РЅРёРє", "РЎСЃС‹Р»РєР° РЅР° YouTube-РєР°РЅР°Р»", "РљРѕР»РёС‡РµСЃС‚РІРѕ РїРѕРґРїРёСЃС‡РёРєРѕРІ", "РЎСЂРµРґРЅРёРµ РїСЂРѕСЃРјРѕС‚СЂС‹ РІРёРґРµРѕ", "РљРѕРЅС‚Р°РєС‚ РґР»СЏ СЃРІСЏР·Рё"]
        },
        other: {
            label: "Р”СЂСѓРіРѕРµ",
            title: "РќРѕРІР°СЏ С„РѕСЂРјР°",
            description: "",
            buttonText: "РћС‚РїСЂР°РІРёС‚СЊ",
            questions: ["Р’Р°С€ РёРіСЂРѕРІРѕР№ РЅРёРє", "РљРѕРЅС‚Р°РєС‚ РґР»СЏ СЃРІСЏР·Рё"]
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
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
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
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item.id !== "string" || typeof item.name !== "string")) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return parsed;
    }

    function saveShop() {
        const shops = readShops();
        const index = shops.findIndex(item => item.id === shopId);
        if (index < 0) {
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
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
        input.placeholder = "РўРµРєСЃС‚ РІРѕРїСЂРѕСЃР°";
        input.value = label;
        input.setAttribute("aria-label", "РўРµРєСЃС‚ РІРѕРїСЂРѕСЃР°");
        const requiredLabel = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = required;
        requiredLabel.append(checkbox, "РћР±СЏР·Р°С‚РµР»СЊРЅС‹Р№");
        const remove = document.createElement("button");
        remove.className = "pages-icon-button danger";
        remove.type = "button";
        remove.textContent = "Г—";
        remove.setAttribute("aria-label", "РЈРґР°Р»РёС‚СЊ РІРѕРїСЂРѕСЃ");
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
        document.querySelector("#builder-title").textContent = "РЎРѕР·РґР°РЅРёРµ С„РѕСЂРјС‹";
        document.querySelector("#builder-save-label").textContent = "РЎРѕР·РґР°С‚СЊ С„РѕСЂРјСѓ";
        document.querySelector("#cancel-edit").hidden = true;
    }

    function editForm(item) {
        resetForm();
        editingId = item.id;
        typeSelect.value = presets[item.type] ? item.type : "other";
        form.elements.title.value = item.title;
        form.elements.description.value = item.description || "";
        form.elements.buttonText.value = item.buttonText || "РћС‚РїСЂР°РІРёС‚СЊ";
        form.elements.enabled.checked = item.enabled !== false;
        questionsBox.replaceChildren();
        (Array.isArray(item.questions) ? item.questions : []).forEach(question => addQuestion(question.label, question.required !== false));
        document.querySelector("#builder-title").textContent = "Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ С„РѕСЂРјС‹";
        document.querySelector("#builder-save-label").textContent = "РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ";
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
            description.textContent = `${(presets[item.type] || presets.other).label} В· ${questionCount} ${pluralize(questionCount, "РІРѕРїСЂРѕСЃ", "РІРѕРїСЂРѕСЃР°", "РІРѕРїСЂРѕСЃРѕРІ")}`;
            const state = document.createElement("span");
            state.className = "pages-card-address";
            state.textContent = item.enabled === false ? "РЎРєСЂС‹С‚Р° РЅР° РІРёС‚СЂРёРЅРµ" : `РљРЅРѕРїРєР°: ${item.buttonText || "РћС‚РїСЂР°РІРёС‚СЊ"}`;
            copy.append(title, description, state);
            const actions = document.createElement("div");
            actions.className = "pages-card-actions";
            const edit = document.createElement("button");
            edit.className = "pages-icon-button";
            edit.type = "button";
            edit.dataset.action = "edit";
            edit.dataset.id = item.id;
            edit.setAttribute("aria-label", `РР·РјРµРЅРёС‚СЊ ${item.title}`);
            edit.textContent = "вњЋ";
            const remove = document.createElement("button");
            remove.className = "pages-icon-button danger";
            remove.type = "button";
            remove.dataset.action = "delete";
            remove.dataset.id = item.id;
            remove.setAttribute("aria-label", `РЈРґР°Р»РёС‚СЊ ${item.title}`);
            remove.textContent = "Г—";
            actions.append(edit, remove);
            card.append(copy, actions);
            formsList.append(card);
        });
        formsEmpty.hidden = forms.length > 0;
        document.querySelector("#forms-count").textContent = `${forms.length} ${pluralize(forms.length, "С„РѕСЂРјР°", "С„РѕСЂРјС‹", "С„РѕСЂРј")}`;
    }

    function renderSubmissions() {
        const submissions = getSubmissions().slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        submissionsList.replaceChildren();
        submissions.forEach(item => {
            const card = document.createElement("article");
            card.className = "forms-submission";
            const head = document.createElement("header");
            const title = document.createElement("b");
            title.textContent = item.formTitle || "Р—Р°СЏРІРєР°";
            const date = document.createElement("small");
            const created = new Date(item.createdAt);
            date.textContent = Number.isNaN(created.getTime()) ? "" : created.toLocaleString("ru-RU");
            const remove = document.createElement("button");
            remove.className = "pages-icon-button danger";
            remove.type = "button";
            remove.dataset.action = "delete-submission";
            remove.dataset.id = item.id;
            remove.setAttribute("aria-label", "РЈРґР°Р»РёС‚СЊ Р·Р°СЏРІРєСѓ");
            remove.textContent = "Г—";
            head.append(title, date, remove);
            const list = document.createElement("dl");
            item.answers.forEach(answer => {
                const term = document.createElement("dt");
                term.textContent = String(answer.label || "");
                const value = document.createElement("dd");
                value.textContent = String(answer.value || "вЂ”");
                list.append(term, value);
            });
            card.append(head, list);
            submissionsList.append(card);
        });
        submissionsEmpty.hidden = submissions.length > 0;
        document.querySelector("#submissions-count").textContent = `${submissions.length} ${pluralize(submissions.length, "Р·Р°СЏРІРєР°", "Р·Р°СЏРІРєРё", "Р·Р°СЏРІРѕРє")}`;
    }

    typeSelect.addEventListener("change", () => {
        if (!editingId) {
            applyPreset(typeSelect.value);
        }
    });
    document.querySelector("#add-question").addEventListener("click", () => {
        if (questionsBox.children.length >= 20) {
            showFeedback("Р’ С„РѕСЂРјРµ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ Р±РѕР»СЊС€Рµ 20 РІРѕРїСЂРѕСЃРѕРІ.");
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
            showFeedback("РЈРєР°Р¶РёС‚Рµ РЅР°Р·РІР°РЅРёРµ С„РѕСЂРјС‹ Рё С‚РµРєСЃС‚ РєРЅРѕРїРєРё.");
            return;
        }
        const questions = Array.from(questionsBox.children, row => ({
            id: row.dataset.id || createId(),
            label: row.querySelector('input[type="text"]').value.trim(),
            required: row.querySelector('input[type="checkbox"]').checked
        })).filter(question => question.label);
        if (questions.length === 0) {
            showFeedback("Р”РѕР±Р°РІСЊС‚Рµ С…РѕС‚СЏ Р±С‹ РѕРґРёРЅ РІРѕРїСЂРѕСЃ.");
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
            showToast(wasEditing ? "Р¤РѕСЂРјР° РѕР±РЅРѕРІР»РµРЅР°." : "Р¤РѕСЂРјР° СЃРѕР·РґР°РЅР°.");
        } catch (error) {
            shop.tools.forms = previous;
            showFeedback(`РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ С„РѕСЂРјСѓ: ${error.message}`);
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
            document.querySelector("#form-delete-title").textContent = `Р¤РѕСЂРјР° В«${item.title}В»`;
            deleteDialog.showModal();
        }
    });
    submissionsList.addEventListener("click", event => {
        const button = event.target.closest('button[data-action="delete-submission"]');
        if (!button) {
            return;
        }
        pendingDelete = { kind: "submission", id: button.dataset.id };
        document.querySelector("#form-delete-title").textContent = "Р—Р°СЏРІРєР°";
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
            showToast("РЈРґР°Р»РµРЅРѕ.");
        } catch (error) {
            shop.tools.forms = previousForms;
            shop.tools.formSubmissions = previousSubmissions;
            showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ: ${error.message}`);
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
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        shop.tools = shop.tools && typeof shop.tools === "object" ? shop.tools : {};
        Object.entries(presets).forEach(([value, preset]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = preset.label;
            typeSelect.append(option);
        });
        document.title = `Р¤РѕСЂРјС‹ вЂ” ${shop.name} вЂ” SDonate`;
        document.querySelector("#forms-shop-caption").textContent = `Р¤РѕСЂРјС‹ Р·Р°СЏРІРѕРє РґР»СЏ РјР°РіР°Р·РёРЅР° В«${shop.name}В».`;
        document.querySelector("#back-to-shop").href = `./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`;
        resetForm();
        renderForms();
        renderSubmissions();
    } catch (error) {
        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ С„РѕСЂРјС‹: ${error.message}`);
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    }
})();

})();

// Source: store-images.js
(() => {
if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
    window.location.replace("./reg.html?mode=login");
} else {
    const storageKey = window.sdonateShopStorage.storageKey();
    const shopId = new URLSearchParams(window.location.search).get("id");
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
    const imagesForm = document.querySelector("#images-form");
    const imagesMessage = document.querySelector("#images-message");
    const toast = document.querySelector("#images-toast");
    const logoutButton = document.querySelector("#logout-button");
    const draftImages = {
        icon: null,
        logo: null,
        background: null,
        additional: null
    };
    const previewFallbacks = {
        icon: "в—‡",
        logo: "SD",
        background: "Р¤РћРќ",
        additional: "РР—РћР‘Р РђР–Р•РќРР•"
    };
    let shops;
    let shop;
    let toastTimer;

    document.querySelector("#account-name").textContent = nickname;
    document.querySelector("#account-avatar").textContent = Array.from(nickname)[0].toUpperCase();

    function readShops() {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РЅРµ РЅР°Р№РґРµРЅ.");
        }

        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.some(item =>
            !item ||
            typeof item.id !== "string" ||
            typeof item.name !== "string" ||
            typeof item.address !== "string"
        )) {
            throw new Error("РЎРѕС…СЂР°РЅС‘РЅРЅС‹Р№ СЃРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return parsed;
    }

    function showToast(text) {
        window.clearTimeout(toastTimer);
        toast.textContent = text;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 3500);
    }

    function showMessage(text, isError) {
        imagesMessage.textContent = text;
        imagesMessage.classList.toggle("error-message", isError);
        imagesMessage.hidden = false;
    }

    function renderPreview(key) {
        const preview = document.querySelector(`#preview-${key}`);
        const imageSource = draftImages[key];
        preview.replaceChildren();
        if (imageSource) {
            const image = document.createElement("img");
            image.src = imageSource;
            image.alt = `РџСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ: ${key}`;
            preview.append(image);
            return;
        }

        const fallback = document.createElement("span");
        fallback.textContent = previewFallbacks[key];
        preview.append(fallback);
    }

    async function resolveSavedImage(value) {
        const assetKey = window.sdonateImageStorage.keyFromReference(value);
        if (assetKey) {
            const image = await window.sdonateImageStorage.get(assetKey);
            if (!image) {
                throw new Error("РЎРѕС…СЂР°РЅС‘РЅРЅРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ РІ С…СЂР°РЅРёР»РёС‰Рµ.");
            }
            return image;
        }
        return typeof value === "string" ? value : null;
    }

    function getImageDimensions(dataUrl) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve({
                width: image.naturalWidth,
                height: image.naturalHeight
            }), { once: true });
            image.addEventListener("error", () => reject(new Error("Р¤Р°Р№Р» РЅРµ СЏРІР»СЏРµС‚СЃСЏ РєРѕСЂСЂРµРєС‚РЅС‹Рј РёР·РѕР±СЂР°Р¶РµРЅРёРµРј.")), { once: true });
            image.src = dataUrl;
        });
    }

    function handleFileChange(key, input) {
        input.addEventListener("change", async () => {
            imagesMessage.hidden = true;
            const [file] = input.files || [];
            if (!file) {
                return;
            }

            if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                showMessage("Р’С‹Р±РµСЂРё РёР·РѕР±СЂР°Р¶РµРЅРёРµ PNG, JPG РёР»Рё WEBP.", true);
                input.value = "";
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                showMessage("Р Р°Р·РјРµСЂ РѕРґРЅРѕРіРѕ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ РЅРµ РґРѕР»Р¶РµРЅ РїСЂРµРІС‹С€Р°С‚СЊ 2 РњР‘.", true);
                input.value = "";
                return;
            }

            const reader = new FileReader();
            reader.addEventListener("load", async () => {
                if (typeof reader.result !== "string") {
                    showMessage("РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕС‡РёС‚Р°С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.", true);
                    return;
                }

                try {
                    const dimensions = await getImageDimensions(reader.result);
                    if (dimensions.width < 1 || dimensions.height < 1) {
                        throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ СЂР°Р·РјРµСЂ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ.");
                    }
                    draftImages[key] = reader.result;
                    renderPreview(key);
                } catch (error) {
                    showMessage(`РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕРєР°Р·Р°С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ: ${error.message}`, true);
                }
            }, { once: true });
            reader.addEventListener("error", () => {
                showMessage("РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕС‡РёС‚Р°С‚СЊ С„Р°Р№Р» РёР·РѕР±СЂР°Р¶РµРЅРёСЏ.", true);
            }, { once: true });
            reader.readAsDataURL(file);
        });
    }

    try {
        shops = readShops();
        shop = shops.find(item => item.id === shopId);
    } catch (error) {
        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РјР°РіР°Р·РёРЅ: ${error.message}`);
    }

    if (!shop) {
        if (!toast.textContent) {
            showToast("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ РёР»Рё СѓР¶Рµ СѓРґР°Р»С‘РЅ.");
        }
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    } else {
        const backUrl = `./store-settings.html?id=${encodeURIComponent(shop.id)}`;
        document.querySelector("#back-to-settings").href = backUrl;
        document.querySelector("#images-back-button").href = backUrl;
        document.title = `РљР°СЂС‚РёРЅРєРё: ${shop.name} вЂ” SDonate`;

        const savedImages = shop.images && typeof shop.images === "object" ? shop.images : {};
        for (const key of Object.keys(draftImages)) {
            draftImages[key] = null;
            handleFileChange(key, document.querySelector(`#upload-${key}`));
        }

        Promise.all(Object.keys(draftImages).map(async key => {
            draftImages[key] = await resolveSavedImage(savedImages[key]);
            renderPreview(key);
        })).catch(error => {
            showMessage(`РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃРѕС…СЂР°РЅС‘РЅРЅС‹Рµ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ: ${error.message}`, true);
        });

        document.querySelectorAll("[data-reset-image]").forEach(button => {
            button.addEventListener("click", () => {
                const key = button.dataset.resetImage;
                draftImages[key] = null;
                document.querySelector(`#upload-${key}`).value = "";
                renderPreview(key);
                imagesMessage.hidden = true;
            });
        });

        imagesForm.addEventListener("submit", async event => {
            event.preventDefault();
            imagesMessage.hidden = true;
            const newAssetKeys = [];
            try {
                shops = readShops();
                const currentShop = shops.find(item => item.id === shopId);
                if (!currentShop) {
                    throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
                }

                const nextImages = {};
                for (const [key, image] of Object.entries(draftImages)) {
                    if (!image) {
                        nextImages[key] = null;
                        continue;
                    }
                    if (window.sdonateImageStorage.keyFromReference(image)) {
                        nextImages[key] = image;
                        continue;
                    }
                    const assetKey = window.sdonateImageStorage.createKey(shopId, key);
                    await window.sdonateImageStorage.set(assetKey, image);
                    newAssetKeys.push(assetKey);
                    nextImages[key] = window.sdonateImageStorage.reference(assetKey);
                }

                const previousAssetKeys = Object.values(currentShop.images || {})
                    .map(value => window.sdonateImageStorage.keyFromReference(value))
                    .filter(Boolean);
                currentShop.images = nextImages;
                window.sdonateShopStorage.save(shops);
                shop = currentShop;
                await window.sdonateImageStorage.delete(previousAssetKeys.filter(key =>
                    !Object.values(nextImages).some(value => window.sdonateImageStorage.keyFromReference(value) === key)
                ));
                showMessage("РР·РѕР±СЂР°Р¶РµРЅРёСЏ СЃРѕС…СЂР°РЅРµРЅС‹ РІ РґРµРјРѕ-РјР°РіР°Р·РёРЅРµ РґРѕ Р·Р°РєСЂС‹С‚РёСЏ РІРєР»Р°РґРєРё.", false);
            } catch (error) {
                let message = error.message;
                try {
                    await window.sdonateImageStorage.delete(newAssetKeys);
                } catch (cleanupError) {
                    message += ` РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‡РёСЃС‚РёС‚СЊ РІСЂРµРјРµРЅРЅС‹Рµ С„Р°Р№Р»С‹: ${cleanupError.message}`;
                }
                showMessage(`РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ: ${message}`, true);
            }
        });

        document.querySelector("#cancel-images").addEventListener("click", () => {
            window.location.assign(backUrl);
        });

        logoutButton.addEventListener("click", () => {
            sessionStorage.removeItem("sdonate-demo-authenticated");
            window.location.assign("./reg.html?mode=login");
        });
    }
}

})();

// Source: store-pages.js
(() => {
(() => {
    if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
        window.location.replace("./reg.html?mode=login");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const shopId = params.get("id");
    const storageKey = window.sdonateShopStorage.storageKey();
    const form = document.querySelector("#page-form");
    const content = document.querySelector("#page-content");
    const preview = document.querySelector("#page-live-preview");
    const pagesList = document.querySelector("#pages-list");
    const pagesEmpty = document.querySelector("#pages-empty");
    const feedback = document.querySelector("#pages-form-feedback");
    const toast = document.querySelector("#pages-toast");
    const deleteDialog = document.querySelector("#pages-delete-dialog");
    let shop;
    let editingId = null;
    let deletingId = null;
    let toastTimer;

    function createId() {
        return window.crypto && typeof window.crypto.randomUUID === "function"
            ? window.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function readShops() {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item.id !== "string" || typeof item.name !== "string")) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return parsed;
    }

    function saveShop() {
        const shops = readShops();
        const index = shops.findIndex(item => item.id === shopId);
        if (index < 0) {
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        shops[index] = shop;
        window.sdonateShopStorage.save(shops);
    }

    function getPages() {
        const pages = shop.tools && Array.isArray(shop.tools.pages) ? shop.tools.pages : [];
        return pages.map(page => {
            if (page.address) {
                return {
                    id: page.id || createId(),
                    title: page.title || page.name || "РЎС‚СЂР°РЅРёС†Р°",
                    description: page.description || page.detail || "",
                    address: page.address,
                    content: page.content || ""
                };
            }
            const legacyTitle = page.title || page.name || "РЎС‚СЂР°РЅРёС†Р°";
            return {
                id: page.id || createId(),
                title: legacyTitle,
                description: page.description || page.detail || "",
                address: legacyTitle.toLowerCase().replace(/[^a-zР°-СЏС‘0-9]+/gi, "-").replace(/^-|-$/g, "") || "page",
                content: page.content || ""
            };
        });
    }

    function showToast(message) {
        window.clearTimeout(toastTimer);
        toast.textContent = message;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 3200);
    }

    function isExternalAddress(address) {
        try {
            const url = new URL(address);
            return /^https?:\/\//i.test(address) && ["https:", "http:"].includes(url.protocol);
        } catch {
            return false;
        }
    }

    function getPageUrl(page) {
        if (isExternalAddress(page.address)) {
            return page.address;
        }
        return `./public-page.html?id=${encodeURIComponent(shop.id)}&owner=${encodeURIComponent(shop.ownerId || sessionStorage.getItem("sdonate-demo-user-id") || "")}&slug=${encodeURIComponent(page.address)}`;
    }

    function renderPages() {
        const pages = getPages();
        pagesList.replaceChildren();
        pages.forEach(page => {
            const card = document.createElement("article");
            card.className = "pages-card";
            const copy = document.createElement("div");
            copy.className = "pages-card-copy";
            const title = document.createElement("h3");
            title.textContent = page.title;
            const description = document.createElement("p");
            description.textContent = page.description;
            const address = document.createElement("span");
            address.className = "pages-card-address";
            address.textContent = isExternalAddress(page.address) ? page.address : `/${page.address}`;
            copy.append(title, description, address);
            const actions = document.createElement("div");
            actions.className = "pages-card-actions";
            const open = document.createElement("a");
            open.className = "pages-open-link";
            open.href = getPageUrl(page);
            open.target = "_blank";
            open.rel = "noopener noreferrer";
            open.textContent = "РћС‚РєСЂС‹С‚СЊ";
            const edit = document.createElement("button");
            edit.className = "pages-icon-button";
            edit.type = "button";
            edit.dataset.action = "edit";
            edit.dataset.id = page.id;
            edit.setAttribute("aria-label", `РР·РјРµРЅРёС‚СЊ ${page.title}`);
            edit.textContent = "вњЋ";
            const remove = document.createElement("button");
            remove.className = "pages-icon-button danger";
            remove.type = "button";
            remove.dataset.action = "delete";
            remove.dataset.id = page.id;
            remove.setAttribute("aria-label", `РЈРґР°Р»РёС‚СЊ ${page.title}`);
            remove.textContent = "Г—";
            actions.append(open, edit, remove);
            card.append(copy, actions);
            pagesList.append(card);
        });
        pagesEmpty.hidden = pages.length > 0;
        document.querySelector("#pages-count").textContent = `${pages.length} ${pages.length === 1 ? "СЃС‚СЂР°РЅРёС†Р°" : pages.length > 1 && pages.length < 5 ? "СЃС‚СЂР°РЅРёС†С‹" : "СЃС‚СЂР°РЅРёС†"}`;
    }

    function updatePreview() {
        document.querySelector("#page-character-count").textContent = `${content.value.length} / 20000 СЃРёРјРІРѕР»РѕРІ`;
        window.sdonateMarkdown.render(content.value, preview);
    }

    function resetForm() {
        form.reset();
        editingId = null;
        feedback.hidden = true;
        document.querySelector("#page-form-title").textContent = "Р”РѕР±Р°РІР»РµРЅРёРµ СЃС‚СЂР°РЅРёС†С‹";
        document.querySelector("#pages-save-label").textContent = "Р”РѕР±Р°РІРёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ";
        document.querySelector("#cancel-edit").hidden = true;
        document.querySelector("#page-auto-preview").checked = true;
        document.querySelectorAll(".pages-view-button").forEach(button => {
            button.classList.toggle("active", button.dataset.view === "split");
            button.setAttribute("aria-pressed", String(button.dataset.view === "split"));
        });
        document.querySelector("#pages-editor-workspace").dataset.view = "split";
        updatePreview();
    }

    function editPage(page) {
        editingId = page.id;
        form.elements.title.value = page.title;
        form.elements.description.value = page.description;
        form.elements.address.value = page.address;
        content.value = page.content;
        document.querySelector("#page-form-title").textContent = "Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ СЃС‚СЂР°РЅРёС†С‹";
        document.querySelector("#pages-save-label").textContent = "РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ";
        document.querySelector("#cancel-edit").hidden = false;
        updatePreview();
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        form.elements.title.focus({ preventScroll: true });
    }

    form.addEventListener("input", event => {
        if (event.target === content || event.target === document.querySelector("#page-auto-preview")) {
            if (document.querySelector("#page-auto-preview").checked) {
                updatePreview();
            } else {
                document.querySelector("#page-character-count").textContent = `${content.value.length} / 20000 СЃРёРјРІРѕР»РѕРІ`;
            }
        }
    });
    document.querySelector("#page-auto-preview").addEventListener("change", event => {
        if (event.target.checked) {
            updatePreview();
        }
    });

    document.querySelectorAll(".pages-view-button").forEach(button => {
        button.addEventListener("click", () => {
            const workspace = document.querySelector("#pages-editor-workspace");
            workspace.dataset.view = button.dataset.view;
            document.querySelectorAll(".pages-view-button").forEach(item => {
                const active = item === button;
                item.classList.toggle("active", active);
                item.setAttribute("aria-pressed", String(active));
            });
        });
    });

    document.querySelectorAll(".pages-editor-toolbar button[data-insert], .pages-editor-toolbar button[data-prefix]").forEach(button => {
        button.addEventListener("click", () => {
            const start = content.selectionStart;
            const end = content.selectionEnd;
            const selected = content.value.slice(start, end);
            const insertion = button.dataset.insert || "";
            const prefix = button.dataset.prefix || "";
            let replacement;
            let selectionStart;
            let selectionEnd;
            if (insertion) {
                const marker = insertion.match(/^(\*\*|\*|~~|`|\[)/);
                if (selected && marker) {
                    const suffix = insertion.endsWith("](https://example.com)") ? "](https://example.com)" : marker[1];
                    replacement = `${marker[1]}${selected}${suffix}`;
                    selectionStart = start + marker[1].length;
                    selectionEnd = selectionStart + selected.length;
                } else {
                    replacement = insertion;
                    selectionStart = start + insertion.indexOf("С‚РµРєСЃС‚");
                    selectionEnd = selectionStart + (insertion.includes("С‚РµРєСЃС‚") ? 5 : 0);
                }
            } else {
                replacement = `${prefix}${selected || "С‚РµРєСЃС‚"}`;
                selectionStart = start + prefix.length;
                selectionEnd = start + replacement.length;
            }
            content.setRangeText(replacement, start, end, "end");
            content.focus();
            content.setSelectionRange(selectionStart, selectionEnd);
            if (document.querySelector("#page-auto-preview").checked) {
                updatePreview();
            } else {
                document.querySelector("#page-character-count").textContent = `${content.value.length} / 20000 СЃРёРјРІРѕР»РѕРІ`;
            }
        });
    });

    form.addEventListener("submit", event => {
        event.preventDefault();
        feedback.hidden = true;
        if (!form.reportValidity()) {
            return;
        }
        const title = form.elements.title.value.trim();
        const description = form.elements.description.value.trim();
        const address = form.elements.address.value.trim();
        if (!isExternalAddress(address) && !/^[a-zР°-СЏС‘0-9][a-zР°-СЏС‘0-9_-]{0,59}$/i.test(address)) {
            feedback.textContent = "РђРґСЂРµСЃ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РєРѕСЂРѕС‚РєРёРј РёРјРµРЅРµРј Р±РµР· РїСЂРѕР±РµР»РѕРІ (РЅР°РїСЂРёРјРµСЂ, rules) РёР»Рё РїРѕР»РЅРѕР№ СЃСЃС‹Р»РєРѕР№ http(s).";
            feedback.hidden = false;
            form.elements.address.focus();
            return;
        }
        if (/^[a-z][a-z0-9+.-]*:/i.test(address) && !isExternalAddress(address)) {
            feedback.textContent = "РњРѕР¶РЅРѕ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ С‚РѕР»СЊРєРѕ РІРЅРµС€РЅРёРµ СЃСЃС‹Р»РєРё http:// РёР»Рё https://.";
            feedback.hidden = false;
            form.elements.address.focus();
            return;
        }

        const pages = getPages();
        if (pages.some(page => page.id !== editingId && page.address.toLowerCase() === address.toLowerCase())) {
            feedback.textContent = "РўР°РєРѕР№ Р°РґСЂРµСЃ СѓР¶Рµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґСЂСѓРіРѕР№ СЃС‚СЂР°РЅРёС†РµР№ СЌС‚РѕРіРѕ РјР°РіР°Р·РёРЅР°.";
            feedback.hidden = false;
            form.elements.address.focus();
            return;
        }
        const wasEditing = Boolean(editingId);
        const page = { id: editingId || createId(), title, description, address, content: content.value };
        try {
            shop.tools.pages = [...pages.filter(item => item.id !== editingId), page];
            saveShop();
            resetForm();
            renderPages();
            showToast(wasEditing ? "РЎС‚СЂР°РЅРёС†Р° РѕР±РЅРѕРІР»РµРЅР°." : "РЎС‚СЂР°РЅРёС†Р° РґРѕР±Р°РІР»РµРЅР°.");
        } catch (error) {
            feedback.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ: ${error.message}`;
            feedback.hidden = false;
        }
    });

    pagesList.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }
        const page = getPages().find(item => item.id === button.dataset.id);
        if (!page) {
            showToast("РЎС‚СЂР°РЅРёС†Р° РЅРµ РЅР°Р№РґРµРЅР°. РћР±РЅРѕРІРёС‚Рµ СЃРїРёСЃРѕРє.");
            return;
        }
        if (button.dataset.action === "edit") {
            editPage(page);
        } else if (button.dataset.action === "delete") {
            deletingId = page.id;
            document.querySelector("#pages-delete-title").textContent = page.title;
            deleteDialog.showModal();
        }
    });

    document.querySelector("#cancel-edit").addEventListener("click", resetForm);
    document.querySelector("#reset-page-form").addEventListener("click", resetForm);
    document.querySelector("#cancel-page-delete").addEventListener("click", () => {
        deletingId = null;
        deleteDialog.close();
    });
    document.querySelector("#confirm-page-delete").addEventListener("click", () => {
        try {
            shop.tools.pages = getPages().filter(page => page.id !== deletingId);
            saveShop();
            renderPages();
            deleteDialog.close();
            if (editingId === deletingId) {
                resetForm();
            }
            showToast("РЎС‚СЂР°РЅРёС†Р° СѓРґР°Р»РµРЅР°.");
        } catch (error) {
            showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ: ${error.message}`);
        } finally {
            deletingId = null;
        }
    });

    document.querySelector("#logout-button").addEventListener("click", () => {
        sessionStorage.removeItem("sdonate-demo-authenticated");
        window.location.assign("./reg.html?mode=login");
    });

    try {
        const shops = readShops();
        shop = shops.find(item => item.id === shopId);
        if (!shop) {
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        shop.tools = shop.tools && typeof shop.tools === "object" ? shop.tools : {};
        if (Array.isArray(shop.tools.pages) && shop.tools.pages.some(page =>
            !page || typeof page.id !== "string" || typeof page.title !== "string" || typeof page.address !== "string"
        )) {
            shop.tools.pages = getPages();
            saveShop();
        }
        document.title = `РЎС‚СЂР°РЅРёС†С‹ вЂ” ${shop.name} вЂ” SDonate`;
        document.querySelector("#pages-shop-caption").textContent = `РЎРѕР·РґР°РІР°Р№С‚Рµ СЃС‚СЂР°РЅРёС†С‹ РґР»СЏ РјР°РіР°Р·РёРЅР° В«${shop.name}В».`;
        document.querySelector("#back-to-shop").href = `./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`;
        document.querySelector("#open-store-preview").href = `./public-store.html?id=${encodeURIComponent(shop.id)}&owner=${encodeURIComponent(shop.ownerId || sessionStorage.getItem("sdonate-demo-user-id") || "")}`;
        renderPages();
        updatePreview();
    } catch (error) {
        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ СЃС‚СЂР°РЅРёС†С‹: ${error.message}`);
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    }
})();

})();

// Source: store-partners.js
(() => {
(() => {
    if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
        window.location.replace("./reg.html?mode=login");
        return;
    }

    const permissionSections = [
        { id: "shop", label: "РњР°РіР°Р·РёРЅ", title: "РњР°РіР°Р·РёРЅ", description: "РћСЃРЅРѕРІРЅС‹Рµ РїСЂР°РІР° РґРѕСЃС‚СѓРїР°", items: [
            ["viewProfit", "РџСЂРѕСЃРјРѕС‚СЂ СЃС‚Р°С‚РёСЃС‚РёРєРё РѕР±С‰РµР№ РїСЂРёР±С‹Р»Рё"],
            ["viewPurchases", "РџСЂРѕСЃРјРѕС‚СЂ СЃС‚Р°С‚РёСЃС‚РёРєРё РѕР±С‰РµР№ РїРѕРєСѓРїРѕРє"],
            ["viewAverage", "РџСЂРѕСЃРјРѕС‚СЂ СЃС‚Р°С‚РёСЃС‚РёРєРё СЃСЂРµРґРЅРµРіРѕ С‡РµРєР°"],
            ["viewHistory", "РџСЂРѕСЃРјРѕС‚СЂ РёСЃС‚РѕСЂРёРё РїРѕСЃР»РµРґРЅРёС… РїРѕРєСѓРїРѕРє"],
            ["editSettings", "Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ РЅР°СЃС‚СЂРѕРµРє"],
            ["viewSecret", "РџСЂРѕСЃРјРѕС‚СЂ СЃРµРєСЂРµС‚РЅРѕРіРѕ РєР»СЋС‡Р°"]
        ] },
        { id: "servers", label: "РЎРµСЂРІРµСЂС‹", title: "РЎРµСЂРІРµСЂС‹", description: "РџСЂР°РІР° РґРѕСЃС‚СѓРїР° СѓРїСЂР°РІР»РµРЅРёСЏ СЃРµСЂРІРµСЂР°РјРё РјР°РіР°Р·РёРЅР°", crud: true },
        { id: "products", label: "РўРѕРІР°СЂС‹", title: "РўРѕРІР°СЂС‹", description: "РџСЂР°РІР° РґРѕСЃС‚СѓРїР° СѓРїСЂР°РІР»РµРЅРёСЏ С‚РѕРІР°СЂР°РјРё РјР°РіР°Р·РёРЅР°", crud: true },
        { id: "coupons", label: "РљСѓРїРѕРЅС‹", title: "РљСѓРїРѕРЅС‹", description: "РџСЂР°РІР° РґРѕСЃС‚СѓРїР° СѓРїСЂР°РІР»РµРЅРёСЏ РєСѓРїРѕРЅР°РјРё РјР°РіР°Р·РёРЅР°", crud: true },
        { id: "partners", label: "РџР°СЂС‚РЅС‘СЂС‹", title: "РџР°СЂС‚РЅС‘СЂС‹", description: "РџСЂР°РІР° РґРѕСЃС‚СѓРїР° СѓРїСЂР°РІР»РµРЅРёСЏ РїР°СЂС‚РЅС‘СЂР°РјРё РјР°РіР°Р·РёРЅР°", crud: true },
        { id: "discounts", label: "РњР°СЃСЃРѕРІС‹Рµ СЃРєРёРґРєРё", title: "РњР°СЃСЃРѕРІС‹Рµ СЃРєРёРґРєРё", description: "РџСЂР°РІР° РґРѕСЃС‚СѓРїР° СѓРїСЂР°РІР»РµРЅРёСЏ РјР°СЃСЃРѕРІС‹РјРё СЃРєРёРґРєР°РјРё РјР°РіР°Р·РёРЅР°", crud: true },
        { id: "collections", label: "РџРѕРґР±РѕСЂРєРё", title: "РџРѕРґР±РѕСЂРєРё", description: "РџСЂР°РІР° РґРѕСЃС‚СѓРїР° СѓРїСЂР°РІР»РµРЅРёСЏ РїРѕРґР±РѕСЂРєР°РјРё РјР°РіР°Р·РёРЅР°", crud: true },
        { id: "pages", label: "РЎС‚СЂР°РЅРёС†С‹", title: "РЎС‚СЂР°РЅРёС†С‹", description: "РџСЂР°РІР° РґРѕСЃС‚СѓРїР° СѓРїСЂР°РІР»РµРЅРёСЏ СЃС‚СЂР°РЅРёС†Р°РјРё РјР°РіР°Р·РёРЅР°", crud: true },
        { id: "categories", label: "РљР°С‚РµРіРѕСЂРёРё", title: "РљР°С‚РµРіРѕСЂРёРё", description: "РџСЂР°РІР° РґРѕСЃС‚СѓРїР° СѓРїСЂР°РІР»РµРЅРёСЏ РєР°С‚РµРіРѕСЂРёСЏРјРё РјР°РіР°Р·РёРЅР°", crud: true },
        { id: "analytics", label: "РђРЅР°Р»РёС‚РёРєР°", title: "РђРЅР°Р»РёС‚РёРєР°", description: "РџСЂР°РІР° РґРѕСЃС‚СѓРїР° Рє Р°РЅР°Р»РёС‚РёРєРµ РјР°РіР°Р·РёРЅР°", items: [
            ["view", "РџСЂРѕСЃРјРѕС‚СЂ"]
        ] }
    ];
    const crudItems = [["view", "РџСЂРѕСЃРјРѕС‚СЂ"], ["add", "Р”РѕР±Р°РІР»РµРЅРёРµ"], ["edit", "Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ"], ["delete", "РЈРґР°Р»РµРЅРёРµ"]];
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
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item.id !== "string" || typeof item.name !== "string")) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return parsed;
    }

    function saveShop() {
        const shops = readShops();
        const index = shops.findIndex(item => item.id === shopId);
        if (index < 0) {
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
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
            const position = String(item.position || item.name || "РџР°СЂС‚РЅС‘СЂ");
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
            email.textContent = partner.email || partner.detail || "Р‘РµР· email";
            const meta = document.createElement("div");
            meta.className = "partner-card-meta";
            const parts = [`Р”РѕР»СЏ ${partner.sharePercent}%`, `РџСЂР°РІ: ${permissionCount(partner)}`];
            if (partner.splitServers) {
                parts.push(`РЎРµСЂРІРµСЂРѕРІ: ${partner.serverIds.length}`);
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
            edit.setAttribute("aria-label", `РР·РјРµРЅРёС‚СЊ ${partner.position}`);
            edit.textContent = "вњЋ";
            const remove = document.createElement("button");
            remove.className = "pages-icon-button danger";
            remove.type = "button";
            remove.dataset.action = "delete";
            remove.dataset.id = partner.id;
            remove.setAttribute("aria-label", `РЈРґР°Р»РёС‚СЊ ${partner.position}`);
            remove.textContent = "Г—";
            actions.append(edit, remove);
            card.append(copy, actions);
            return card;
        }));
        empty.hidden = partners.length > 0;
        count.textContent = `${partners.length} ${plural(partners.length, "РїР°СЂС‚РЅС‘СЂ", "РїР°СЂС‚РЅС‘СЂР°", "РїР°СЂС‚РЅС‘СЂРѕРІ")}`;
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
        document.querySelector("#partner-form-title").textContent = "Р”РѕР±Р°РІР»РµРЅРёРµ РїР°СЂС‚РЅС‘СЂР°";
        document.querySelector("#partner-save-label").textContent = "Р”РѕР±Р°РІРёС‚СЊ";
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
        document.querySelector("#partner-form-title").textContent = "Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ РїР°СЂС‚РЅС‘СЂР°";
        document.querySelector("#partner-save-label").textContent = "РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ";
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
            showFeedback("РЈРєР°Р¶РёС‚Рµ РґРѕР»Р¶РЅРѕСЃС‚СЊ РїР°СЂС‚РЅС‘СЂР°.", form.elements.position);
            return;
        }
        if (shareText === "" || !Number.isFinite(share) || share < 0 || share > 100) {
            showFeedback("Р”РѕР»СЏ РїР°СЂС‚РЅС‘СЂР° РґРѕР»Р¶РЅР° Р±С‹С‚СЊ РѕС‚ 0 РґРѕ 100%.", form.elements.share);
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFeedback("РЈРєР°Р¶РёС‚Рµ РєРѕСЂСЂРµРєС‚РЅС‹Р№ email РїР°СЂС‚РЅС‘СЂР°.", form.elements.email);
            return;
        }
        if (email === String(shop.ownerEmail || "").toLowerCase()) {
            showFeedback("РќРµР»СЊР·СЏ РґРѕР±Р°РІРёС‚СЊ РІР»Р°РґРµР»СЊС†Р° РјР°РіР°Р·РёРЅР° РєР°Рє РїР°СЂС‚РЅС‘СЂР°.", form.elements.email);
            return;
        }
        const partners = getPartners();
        const others = partners.filter(item => item.id !== editingId);
        if (others.some(item => item.email.toLowerCase() === email)) {
            showFeedback("РџР°СЂС‚РЅС‘СЂ СЃ С‚Р°РєРёРј email СѓР¶Рµ РґРѕР±Р°РІР»РµРЅ.", form.elements.email);
            return;
        }
        const totalShare = others.reduce((total, item) => total + item.sharePercent, 0) + share;
        if (totalShare > 100.0001) {
            showFeedback(`РЎСѓРјРјР° РґРѕР»РµР№ РїР°СЂС‚РЅС‘СЂРѕРІ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ Р±РѕР»СЊС€Рµ 100% (РїРѕР»СѓС‡РёС‚СЃСЏ ${Math.round(totalShare * 100) / 100}%).`, form.elements.share);
            return;
        }
        const serverIds = splitServers.checked
            ? [...serversList.querySelectorAll("input:checked")].map(input => input.value)
            : [];
        if (splitServers.checked && !serverIds.length) {
            showFeedback("Р’С‹Р±РµСЂРёС‚Рµ С…РѕС‚СЏ Р±С‹ РѕРґРёРЅ СЃРµСЂРІРµСЂ РёР»Рё РІС‹РєР»СЋС‡РёС‚Рµ СЂР°Р·РґРµР» РїСЂРёР±С‹Р»Рё РїРѕ СЃРµСЂРІРµСЂР°Рј.");
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
            showToast(wasEditing ? "РџР°СЂС‚РЅС‘СЂ РѕР±РЅРѕРІР»С‘РЅ." : "РџР°СЂС‚РЅС‘СЂ РґРѕР±Р°РІР»РµРЅ.");
        } catch (error) {
            showFeedback(`РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РїР°СЂС‚РЅС‘СЂР°: ${error.message}`);
        }
    });

    list.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }
        const partner = getPartners().find(item => item.id === button.dataset.id);
        if (!partner) {
            showToast("РџР°СЂС‚РЅС‘СЂ РЅРµ РЅР°Р№РґРµРЅ. РћР±РЅРѕРІРёС‚Рµ СЃС‚СЂР°РЅРёС†Сѓ.");
            return;
        }
        if (button.dataset.action === "edit") {
            editPartner(partner);
        } else {
            deletingId = partner.id;
            document.querySelector("#partner-delete-title").textContent = `${partner.position} (${partner.email || "Р±РµР· email"})`;
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
            showToast("РџР°СЂС‚РЅС‘СЂ СѓРґР°Р»С‘РЅ.");
        } catch (error) {
            showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РїР°СЂС‚РЅС‘СЂР°: ${error.message}`);
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
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        shop.tools = shop.tools && typeof shop.tools === "object" ? shop.tools : {};
        document.querySelector("#account-name").textContent = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
        document.title = `РџР°СЂС‚РЅС‘СЂС‹ вЂ” ${shop.name} вЂ” SDonate`;
        document.querySelector("#partners-shop-caption").textContent = `РџР°СЂС‚РЅС‘СЂС‹ РјР°РіР°Р·РёРЅР° В«${shop.name}В» Рё РёС… РїСЂР°РІР° РґРѕСЃС‚СѓРїР°.`;
        document.querySelector("#back-to-shop").href = `./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`;
        resetForm();
        renderPartners();
    } catch (error) {
        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ СЂР°Р·РґРµР»: ${error.message}`);
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    }
})();

})();

// Source: store-products.js
(() => {
(() => {
    const authenticated = sessionStorage.getItem("sdonate-demo-authenticated") === "true";
    if (!authenticated) {
        window.location.replace("./reg.html?mode=login");
        return;
    }

    const storageKey = window.sdonateShopStorage.storageKey();
    const defaultCategories = ["РџСЂРёРІРёР»РµРіРёРё", "Р’Р°Р»СЋС‚Р°", "РљРµР№СЃС‹", "РџСЂРµРґРјРµС‚С‹", "Р”СЂСѓРіРѕРµ"];
    const params = new URLSearchParams(window.location.search);
    const shopId = params.get("id");
    const accountName = document.querySelector("#account-name");
    const accountAvatar = document.querySelector("#account-avatar");
    const shopName = document.querySelector("#products-shop-name");
    const backToShop = document.querySelector("#back-to-shop");
    const editor = document.querySelector("#product-editor");
    const form = document.querySelector("#product-form");
    const categoryTabs = document.querySelector("#category-tabs");
    const categoryInput = document.querySelector("#product-category");
    const serverOptions = document.querySelector("#server-options");
    const commandList = document.querySelector("#command-list");
    const imageInput = document.querySelector("#product-image-input");
    const imagePreview = document.querySelector("#product-image-preview");
    const imagePlaceholder = document.querySelector("#image-upload-placeholder");
    const removeImageButton = document.querySelector("#remove-product-image");
    const formMessage = document.querySelector("#product-form-message");
    const productsGrid = document.querySelector("#products-grid");
    const productsEmpty = document.querySelector("#products-empty");
    const productsCount = document.querySelector("#products-count");
    const searchInput = document.querySelector("#search-products");
    const deleteDialog = document.querySelector("#delete-product-dialog");
    const toast = document.querySelector("#products-toast");
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";

    accountName.textContent = nickname;
    accountAvatar.textContent = Array.from(nickname)[0].toUpperCase();
    backToShop.href = `./shop-dashboard.html?id=${encodeURIComponent(shopId || "")}`;

    function readShops() {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        const shops = JSON.parse(stored);
        if (!Array.isArray(shops) || shops.some(item =>
            !item ||
            typeof item.id !== "string" ||
            typeof item.name !== "string" ||
            typeof item.address !== "string"
        )) {
            throw new Error("РЎРѕС…СЂР°РЅС‘РЅРЅС‹Р№ СЃРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return shops;
    }

    let shops;
    let shop;
    try {
        shops = readShops();
        shop = shops.find(item => item.id === shopId);
        if (!shop) {
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ РёР»Рё СѓР¶Рµ СѓРґР°Р»С‘РЅ.");
        }
        if (shop.products !== undefined && (!Array.isArray(shop.products) || shop.products.some(product =>
            !product || typeof product.id !== "string" || typeof product.name !== "string"
        ))) {
            throw new Error("РЎРїРёСЃРѕРє С‚РѕРІР°СЂРѕРІ РјР°РіР°Р·РёРЅР° РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
    } catch (error) {
        toast.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ С‚РѕРІР°СЂС‹: ${error.message}`;
        toast.hidden = false;
        window.setTimeout(() => window.location.replace("./shops.html"), 2200);
        return;
    }

    shop.products = shop.products || [];
    shop.productCategories = Array.isArray(shop.productCategories) && shop.productCategories.every(category => typeof category === "string")
        ? [...new Set([...defaultCategories, ...shop.productCategories])]
        : [...defaultCategories];
    shopName.textContent = shop.name;
    document.title = `РўРѕРІР°СЂС‹ вЂ” ${shop.name} вЂ” SDonate`;

    let selectedCategory = shop.productCategories[0];
    let editingProductId = null;
    let currentImage = "";
    let pendingDeleteId = null;
    let toastTimer;

    function showToast(message) {
        window.clearTimeout(toastTimer);
        toast.textContent = message;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 3200);
    }

    function saveShops() {
        try {
            window.sdonateShopStorage.save(shops);
        } catch (error) {
            throw new Error(`РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ: ${error.message}`);
        }
    }

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function renderCategories() {
        categoryTabs.replaceChildren();
        shop.productCategories.forEach(category => {
            const button = document.createElement("button");
            button.className = `category-tab${category === selectedCategory ? " active" : ""}`;
            button.type = "button";
            button.textContent = category;
            button.setAttribute("aria-pressed", String(category === selectedCategory));
            button.addEventListener("click", () => {
                selectedCategory = category;
                categoryInput.value = category;
                renderCategories();
            });
            categoryTabs.append(button);
        });
        categoryInput.value = selectedCategory;
    }

    function getServers() {
        if (Array.isArray(shop.servers)) {
            const servers = shop.servers.map(server => typeof server === "string" ? server : server && server.name)
                .filter(server => typeof server === "string" && server.trim());
            if (servers.length) {
                return [...new Set(servers)];
            }
        }
        return ["РћСЃРЅРѕРІРЅРѕР№ СЃРµСЂРІРµСЂ"];
    }

    function renderServers(selected = []) {
        serverOptions.replaceChildren();
        getServers().forEach((server, index) => {
            const label = document.createElement("label");
            label.className = "server-option";
            const input = document.createElement("input");
            input.type = "checkbox";
            input.name = "servers";
            input.value = server;
            input.checked = selected.length ? selected.includes(server) : index === 0;
            const text = document.createElement("span");
            text.textContent = server;
            label.append(input, text);
            serverOptions.append(label);
        });
    }

    function addCommand(value = "") {
        const row = document.createElement("div");
        row.className = "command-row";
        const number = document.createElement("span");
        number.className = "command-number";
        number.textContent = `${commandList.children.length + 1}.`;
        const input = document.createElement("input");
        input.className = "command-input";
        input.type = "text";
        input.maxLength = 240;
        input.name = "commands";
        input.value = value;
        input.placeholder = "РќР°РїСЂРёРјРµСЂ: give {user} diamond 1";
        input.setAttribute("aria-label", `РљРѕРјР°РЅРґР° РІС‹РґР°С‡Рё ${commandList.children.length + 1}`);
        const remove = document.createElement("button");
        remove.className = "remove-command-button";
        remove.type = "button";
        remove.textContent = "Г—";
        remove.setAttribute("aria-label", "РЈРґР°Р»РёС‚СЊ РєРѕРјР°РЅРґСѓ");
        remove.addEventListener("click", () => {
            if (commandList.children.length <= 1) {
                input.value = "";
                return;
            }
            row.remove();
            renumberCommands();
        });
        row.append(number, input, remove);
        commandList.append(row);
    }

    function renumberCommands() {
        Array.from(commandList.children).forEach((row, index) => {
            row.querySelector(".command-number").textContent = `${index + 1}.`;
            row.querySelector(".command-input").setAttribute("aria-label", `РљРѕРјР°РЅРґР° РІС‹РґР°С‡Рё ${index + 1}`);
        });
    }

    function setImage(dataUrl) {
        currentImage = dataUrl;
        imagePreview.hidden = !dataUrl;
        imagePlaceholder.hidden = Boolean(dataUrl);
        removeImageButton.hidden = !dataUrl;
        if (dataUrl) {
            imagePreview.src = dataUrl;
        } else {
            imagePreview.removeAttribute("src");
            imageInput.value = "";
        }
    }

    function resetForm() {
        form.reset();
        editingProductId = null;
        selectedCategory = shop.productCategories[0];
        document.querySelector("#editor-eyebrow").textContent = "РќРћР’Р«Р™ РўРћР’РђР ";
        document.querySelector("#editor-title").textContent = "РЎРѕР·РґР°РЅРёРµ С‚РѕРІР°СЂР°";
        document.querySelector("#save-product-button").textContent = "РЎРѕР·РґР°С‚СЊ С‚РѕРІР°СЂ";
        formMessage.hidden = true;
        formMessage.textContent = "";
        commandList.replaceChildren();
        addCommand("lp user {user} parent add vip");
        setImage("");
        renderCategories();
        renderServers();
    }

    function openEditor(product = null) {
        resetForm();
        editor.hidden = false;
        if (product) {
            editingProductId = product.id;
            selectedCategory = shop.productCategories.includes(product.category) ? product.category : shop.productCategories[0];
            document.querySelector("#editor-eyebrow").textContent = "Р Р•Р”РђРљРўРР РћР’РђРќРР•";
            document.querySelector("#editor-title").textContent = "РР·РјРµРЅРµРЅРёРµ С‚РѕРІР°СЂР°";
            document.querySelector("#save-product-button").textContent = "РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ";
            form.elements.name.value = product.name;
            form.elements.description.value = product.description || "";
            form.elements.extraDescription.value = product.extraDescription || "";
            form.elements.price.value = String(product.price);
            form.elements.quantity.value = String(product.quantity);
            const commands = Array.isArray(product.commands) ? product.commands : [];
            commandList.replaceChildren();
            (commands.length ? commands : [""]).forEach(addCommand);
            renderServers(Array.isArray(product.servers) ? product.servers : []);
            setImage(product.image || "");
            renderCategories();
        }
        editor.scrollIntoView({ behavior: "smooth", block: "start" });
        document.querySelector("#product-name").focus({ preventScroll: true });
    }

    function formatPrice(price) {
        return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(price)} в‚Ѕ`;
    }

    function formatProductCount(count) {
        const tens = count % 100;
        const units = count % 10;
        const label = tens >= 11 && tens <= 14
            ? "С‚РѕРІР°СЂРѕРІ"
            : units === 1
                ? "С‚РѕРІР°СЂ"
                : units >= 2 && units <= 4
                    ? "С‚РѕРІР°СЂР°"
                    : "С‚РѕРІР°СЂРѕРІ";
        return `${count} ${label}`;
    }

    function renderProducts() {
        const query = searchInput.value.trim().toLocaleLowerCase("ru");
        const filtered = shop.products.filter(product => {
            const text = `${product.name} ${product.description || ""} ${product.category || ""}`.toLocaleLowerCase("ru");
            return text.includes(query);
        });
        productsGrid.replaceChildren();
        productsCount.textContent = formatProductCount(shop.products.length);

        filtered.forEach(product => {
            const card = document.createElement("article");
            card.className = "product-card";
            const imageBox = document.createElement("div");
            imageBox.className = "product-card-image";
            imageBox.setAttribute("aria-label", product.image ? `РР·РѕР±СЂР°Р¶РµРЅРёРµ С‚РѕРІР°СЂР° ${product.name}` : "РР·РѕР±СЂР°Р¶РµРЅРёРµ РЅРµ РґРѕР±Р°РІР»РµРЅРѕ");
            imageBox.textContent = "в™њ";
            if (product.image) {
                const image = document.createElement("img");
                image.src = product.image;
                image.alt = product.name;
                imageBox.append(image);
            }
            const category = document.createElement("span");
            category.className = "product-card-category";
            category.textContent = product.category || "Р”СЂСѓРіРѕРµ";
            imageBox.append(category);

            const body = document.createElement("div");
            body.className = "product-card-body";
            const titleRow = document.createElement("div");
            titleRow.className = "product-card-title-row";
            const title = document.createElement("h3");
            title.textContent = product.name;
            title.title = product.name;
            const actions = document.createElement("div");
            actions.className = "product-card-actions";
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "вњЋ";
            editButton.setAttribute("aria-label", `РР·РјРµРЅРёС‚СЊ С‚РѕРІР°СЂ ${product.name}`);
            editButton.addEventListener("click", () => openEditor(product));
            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-product-card";
            deleteButton.type = "button";
            deleteButton.textContent = "вЊ«";
            deleteButton.setAttribute("aria-label", `РЈРґР°Р»РёС‚СЊ С‚РѕРІР°СЂ ${product.name}`);
            deleteButton.addEventListener("click", () => {
                pendingDeleteId = product.id;
                document.querySelector("#delete-product-name").textContent = product.name;
                deleteDialog.showModal();
            });
            actions.append(editButton, deleteButton);
            titleRow.append(title, actions);

            const description = document.createElement("p");
            description.className = "product-card-description";
            description.textContent = product.description || "РћРїРёСЃР°РЅРёРµ РЅРµ РґРѕР±Р°РІР»РµРЅРѕ";
            const footer = document.createElement("div");
            footer.className = "product-card-footer";
            const price = document.createElement("span");
            price.className = "product-card-price";
            price.textContent = formatPrice(Number(product.price) || 0);
            const stock = document.createElement("span");
            stock.className = "product-card-stock";
            stock.textContent = `${Number(product.quantity) || 0} С€С‚.`;
            footer.append(price, stock);
            body.append(titleRow, description, footer);
            card.append(imageBox, body);
            productsGrid.append(card);
        });

        const isEmpty = shop.products.length === 0;
        const noMatches = !isEmpty && filtered.length === 0;
        productsGrid.hidden = isEmpty || noMatches;
        productsEmpty.hidden = !isEmpty && !noMatches;
        productsEmpty.querySelector("h2").textContent = noMatches ? "РќРёС‡РµРіРѕ РЅРµ РЅР°Р№РґРµРЅРѕ" : "РўРѕРІР°СЂРѕРІ РїРѕРєР° РЅРµС‚";
        productsEmpty.querySelector("p").textContent = noMatches
            ? "РџРѕРїСЂРѕР±СѓР№ РёР·РјРµРЅРёС‚СЊ Р·Р°РїСЂРѕСЃ РїРѕРёСЃРєР°."
            : "РЎРѕР·РґР°Р№ РїРµСЂРІС‹Р№ С‚РѕРІР°СЂ вЂ” РѕРЅ РїРѕСЏРІРёС‚СЃСЏ РІ СЃРїРёСЃРєРµ РґРµРјРѕ-РјР°РіР°Р·РёРЅР°.";
        productsEmpty.querySelector("[data-open-editor]").hidden = noMatches;
    }

    renderCategories();
    renderServers();
    addCommand("lp user {user} parent add vip");
    renderProducts();
    editor.hidden = true;

    document.querySelector("#new-product-button").addEventListener("click", () => openEditor());
    document.querySelectorAll("[data-open-editor]").forEach(button => button.addEventListener("click", () => openEditor()));
    document.querySelector("#close-editor").addEventListener("click", () => {
        editor.hidden = true;
        resetForm();
    });
    document.querySelector("#cancel-product-button").addEventListener("click", () => {
        editor.hidden = true;
        resetForm();
    });
    document.querySelector("#add-command-button").addEventListener("click", () => addCommand());
    searchInput.addEventListener("input", renderProducts);
    async function compressImage(file) {
        const imageUrl = URL.createObjectURL(file);
        const image = new Image();
        try {
            await new Promise((resolve, reject) => {
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", () => reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.")), { once: true });
                image.src = imageUrl;
            });
        } finally {
            URL.revokeObjectURL(imageUrl);
        }

        if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 36000000) {
            throw new Error("РЈ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ СЃР»РёС€РєРѕРј Р±РѕР»СЊС€РѕРµ СЂР°Р·СЂРµС€РµРЅРёРµ.");
        }

        const maxDimension = 1400;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±СЂР°Р±РѕС‚Р°С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.");
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        for (const quality of [0.84, 0.72, 0.6, 0.48, 0.36]) {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", quality));
            if (!blob || blob.type !== "image/webp") {
                throw new Error("Р‘СЂР°СѓР·РµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ СЃР¶Р°С‚РёРµ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ.");
            }
            if (blob.size <= 700 * 1024) {
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.addEventListener("load", () => {
                        if (typeof reader.result === "string") {
                            resolve(reader.result);
                        } else {
                            reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕС‡РёС‚Р°С‚СЊ РѕР±СЂР°Р±РѕС‚Р°РЅРЅРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ."));
                        }
                    }, { once: true });
                    reader.addEventListener("error", () => reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕС‡РёС‚Р°С‚СЊ РѕР±СЂР°Р±РѕС‚Р°РЅРЅРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.")), { once: true });
                    reader.readAsDataURL(blob);
                });
            }
        }
        throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ СѓРјРµРЅСЊС€РёС‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ РґРѕ СЂР°Р·РјРµСЂР° 700 РљР‘.");
    }

    imageInput.addEventListener("change", async () => {
        const file = imageInput.files && imageInput.files[0];
        if (!file) {
            return;
        }
        formMessage.hidden = true;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            formMessage.textContent = "Р’С‹Р±РµСЂРё РёР·РѕР±СЂР°Р¶РµРЅРёРµ PNG, JPG РёР»Рё WEBP.";
            formMessage.hidden = false;
            imageInput.value = "";
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            formMessage.textContent = "РСЃС…РѕРґРЅРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ РЅРµ РґРѕР»Р¶РЅРѕ РїСЂРµРІС‹С€Р°С‚СЊ 10 РњР‘.";
            formMessage.hidden = false;
            imageInput.value = "";
            return;
        }
        try {
            setImage(await compressImage(file));
        } catch (error) {
            formMessage.textContent = error.message;
            formMessage.hidden = false;
            imageInput.value = "";
        }
    });
    removeImageButton.addEventListener("click", () => setImage(""));

    document.querySelector("#add-category-button").addEventListener("click", () => {
        document.querySelector("#category-message").hidden = true;
        document.querySelector("#new-category-name").value = "";
        document.querySelector("#category-dialog").showModal();
        document.querySelector("#new-category-name").focus();
    });
    document.querySelector("#cancel-category").addEventListener("click", () => document.querySelector("#category-dialog").close());
    document.querySelector("#category-form").addEventListener("submit", event => {
        event.preventDefault();
        const input = document.querySelector("#new-category-name");
        const name = input.value.trim();
        if (name.length < 2) {
            input.setCustomValidity("РќР°Р·РІР°РЅРёРµ РґРѕР»Р¶РЅРѕ СЃРѕРґРµСЂР¶Р°С‚СЊ РЅРµ РјРµРЅРµРµ 2 СЃРёРјРІРѕР»РѕРІ.");
            input.reportValidity();
            input.setCustomValidity("");
            return;
        }
        if (shop.productCategories.some(category => category.toLocaleLowerCase("ru") === name.toLocaleLowerCase("ru"))) {
            const message = document.querySelector("#category-message");
            message.textContent = "РўР°РєР°СЏ РєР°С‚РµРіРѕСЂРёСЏ СѓР¶Рµ РµСЃС‚СЊ.";
            message.hidden = false;
            return;
        }
        shop.productCategories.push(name);
        selectedCategory = name;
        try {
            saveShops();
        } catch (error) {
            shop.productCategories.pop();
            showToast(error.message);
            return;
        }
        renderCategories();
        document.querySelector("#category-dialog").close();
    });

    form.addEventListener("submit", event => {
        event.preventDefault();
        formMessage.hidden = true;
        if (!form.reportValidity()) {
            return;
        }

        const name = form.elements.name.value.trim();
        const price = Number(form.elements.price.value);
        const quantity = Number(form.elements.quantity.value);
        const servers = Array.from(form.querySelectorAll('input[name="servers"]:checked'), input => input.value);
        const commands = Array.from(form.querySelectorAll('input[name="commands"]'), input => input.value.trim()).filter(Boolean);
        if (name.length < 2 || !Number.isFinite(price) || price < 0 || price > 1000000 ||
            !Number.isInteger(quantity) || quantity < 1 || quantity > 1000000) {
            formMessage.textContent = "РџСЂРѕРІРµСЂСЊ РЅР°Р·РІР°РЅРёРµ, СЃС‚РѕРёРјРѕСЃС‚СЊ Рё РєРѕР»РёС‡РµСЃС‚РІРѕ С‚РѕРІР°СЂР°.";
            formMessage.hidden = false;
            return;
        }
        if (servers.length === 0) {
            formMessage.textContent = "Р’С‹Р±РµСЂРё С…РѕС‚СЏ Р±С‹ РѕРґРёРЅ СЃРµСЂРІРµСЂ.";
            formMessage.hidden = false;
            return;
        }

        const wasEditing = Boolean(editingProductId);
        const product = {
            id: editingProductId || createId(),
            category: selectedCategory,
            name,
            description: form.elements.description.value.trim(),
            extraDescription: form.elements.extraDescription.value.trim(),
            price,
            quantity,
            servers,
            commands,
            image: currentImage
        };
        const previousProducts = [...shop.products];
        if (editingProductId) {
            const index = shop.products.findIndex(item => item.id === editingProductId);
            if (index === -1) {
                formMessage.textContent = "РўРѕРІР°СЂ Р±РѕР»СЊС€Рµ РЅРµ РЅР°Р№РґРµРЅ. РћР±РЅРѕРІРё СЃС‚СЂР°РЅРёС†Сѓ Рё РїРѕРїСЂРѕР±СѓР№ СЃРЅРѕРІР°.";
                formMessage.hidden = false;
                return;
            }
            shop.products[index] = product;
        } else {
            shop.products.unshift(product);
        }
        try {
            saveShops();
        } catch (error) {
            shop.products = previousProducts;
            formMessage.textContent = error.message;
            formMessage.hidden = false;
            return;
        }
        editor.hidden = true;
        resetForm();
        renderProducts();
        showToast(wasEditing ? "РР·РјРµРЅРµРЅРёСЏ СЃРѕС…СЂР°РЅРµРЅС‹." : "РўРѕРІР°СЂ СЃРѕР·РґР°РЅ.");
    });

    document.querySelector("#cancel-delete-product").addEventListener("click", () => {
        pendingDeleteId = null;
        deleteDialog.close();
    });
    document.querySelector("#confirm-delete-product").addEventListener("click", () => {
        const index = shop.products.findIndex(product => product.id === pendingDeleteId);
        if (index === -1) {
            deleteDialog.close();
            pendingDeleteId = null;
            showToast("РўРѕРІР°СЂ СѓР¶Рµ СѓРґР°Р»С‘РЅ.");
            return;
        }
        const [removed] = shop.products.splice(index, 1);
        try {
            saveShops();
        } catch (error) {
            shop.products.splice(index, 0, removed);
            showToast(error.message);
            return;
        }
        deleteDialog.close();
        pendingDeleteId = null;
        renderProducts();
        showToast("РўРѕРІР°СЂ СѓРґР°Р»С‘РЅ.");
    });

    document.querySelector("#logout-button").addEventListener("click", () => {
        sessionStorage.removeItem("sdonate-demo-authenticated");
        window.location.assign("./reg.html?mode=login");
    });
})();

})();

// Source: store-settings.js
(() => {
if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
    window.location.replace("./reg.html?mode=login");
} else {
    const storageKey = window.sdonateShopStorage.storageKey();
    const shopId = new URLSearchParams(window.location.search).get("id");
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
    const accountName = document.querySelector("#account-name");
    const accountAvatar = document.querySelector("#account-avatar");
    const headingName = document.querySelector("#settings-shop-name-heading");
    const nameInput = document.querySelector("#store-name-input");
    const payoutSelect = document.querySelector("#payout-method");
    const domainsList = document.querySelector("#domains-list");
    const commissionSlider = document.querySelector("#commission-slider");
    const userCommission = document.querySelector("#user-commission");
    const storeCommission = document.querySelector("#store-commission");
    const form = document.querySelector("#store-settings-form");
    const message = document.querySelector("#settings-message");
    const toast = document.querySelector("#settings-toast");
    const addDomainDialog = document.querySelector("#add-domain-dialog");
    const addDomainForm = document.querySelector("#add-domain-form");
    const newDomainInput = document.querySelector("#new-domain");
    const domainConnectionType = document.querySelector("#domain-connection-type");
    const domainDnsTable = document.querySelector("#domain-dns-table");
    const domainDnsNote = document.querySelector("#domain-dns-note");
    const domainInputLabel = document.querySelector("#domain-input-label");
    const domainFeedback = document.querySelector("#domain-dialog-feedback");
    const domainDialogTitle = document.querySelector("#domain-dialog-title");
    const domainDialogDescription = document.querySelector("#domain-dialog-description");
    const domainDialogSubmit = document.querySelector("#domain-dialog-submit");
    const deleteDialog = document.querySelector("#delete-store-dialog");
    const confirmStoreName = document.querySelector("#confirm-store-name");
    const logoutButton = document.querySelector("#logout-button");
    let domains = [];
    let editingDomainIndex = null;
    let toastTimer;

    accountName.textContent = nickname;
    accountAvatar.textContent = Array.from(nickname)[0].toUpperCase();

    function readShops() {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РЅРµ РЅР°Р№РґРµРЅ.");
        }

        const shops = JSON.parse(stored);
        if (!Array.isArray(shops) || shops.some(shop =>
            !shop ||
            typeof shop.id !== "string" ||
            typeof shop.name !== "string" ||
            typeof shop.address !== "string"
        )) {
            throw new Error("РЎРѕС…СЂР°РЅС‘РЅРЅС‹Р№ СЃРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return shops;
    }

    function showToast(text) {
        window.clearTimeout(toastTimer);
        toast.textContent = text;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 3500);
    }

    function showMessage(text, isError) {
        message.textContent = text;
        message.classList.toggle("error-message", isError);
        message.hidden = false;
    }

    function normalizeDomain(value) {
        return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    }

    function isValidDomain(value) {
        if (value.length > 253 || value.includes("..")) {
            return false;
        }
        const labels = value.split(".");
        return labels.length >= 2 && labels.every(label =>
            label.length >= 1 &&
            label.length <= 63 &&
            /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
        );
    }

    function renderDomains() {
        domainsList.replaceChildren();
        domains.forEach((domain, index) => {
            const row = document.createElement("div");
            row.className = "domain-row";
            const value = document.createElement("span");
            value.className = "domain-value";
            value.textContent = domain;
            row.append(value);

            const editButton = document.createElement("button");
            editButton.className = "domain-edit-button";
            editButton.type = "button";
            editButton.setAttribute("aria-label", `РР·РјРµРЅРёС‚СЊ РґРѕРјРµРЅ ${domain}`);
            editButton.textContent = "вњЋ";
            editButton.addEventListener("click", () => openDomainDialog(index));
            row.append(editButton);

            if (index === 0) {
                const primaryBadge = document.createElement("span");
                primaryBadge.className = "domain-primary-badge";
                primaryBadge.textContent = "РћРЎРќРћР’РќРћР™";
                row.append(primaryBadge);
            } else {
                const removeButton = document.createElement("button");
                removeButton.className = "domain-remove-button";
                removeButton.type = "button";
                removeButton.setAttribute("aria-label", `РЈРґР°Р»РёС‚СЊ РґРѕРјРµРЅ ${domain}`);
                removeButton.textContent = "Г—";
                removeButton.addEventListener("click", () => {
                    domains = domains.filter((_, domainIndex) => domainIndex !== index);
                    renderDomains();
                    showToast("Р”РѕРјРµРЅ СѓРґР°Р»С‘РЅ РёР· С‡РµСЂРЅРѕРІРёРєР°. РќР°Р¶РјРё В«РЎРѕС…СЂР°РЅРёС‚СЊВ», С‡С‚РѕР±С‹ РїСЂРёРјРµРЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ.");
                });
                row.append(removeButton);
            }

            domainsList.append(row);
        });
    }

    function updateCommissionLabels() {
        const share = Number(commissionSlider.value);
        storeCommission.textContent = String(share);
        userCommission.textContent = String(100 - share);
    }

    function openDomainDialog(index) {
        editingDomainIndex = Number.isInteger(index) ? index : null;
        domainDialogTitle.textContent = editingDomainIndex === null ? "Р”РѕР±Р°РІРёС‚СЊ РґРѕРјРµРЅ" : "РР·РјРµРЅРёС‚СЊ РґРѕРјРµРЅ";
        domainDialogDescription.textContent = editingDomainIndex === null
            ? "РџРѕРґРєР»СЋС‡Рё СЃРѕР±СЃС‚РІРµРЅРЅС‹Р№ Р°РґСЂРµСЃ Рє РјР°РіР°Р·РёРЅСѓ. РќР°СЃС‚СЂРѕР№ DNS Сѓ СЂРµРіРёСЃС‚СЂР°С‚РѕСЂР° РґРѕРјРµРЅР°."
            : "РР·РјРµРЅРё Р°РґСЂРµСЃ РјР°РіР°Р·РёРЅР°. РќР°СЃС‚СЂРѕР№РєР° DNS Рё РїСЂРѕРІРµСЂРєР° РїРѕРґРєР»СЋС‡РµРЅРёСЏ РґРѕСЃС‚СѓРїРЅС‹ С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ Р·Р°РїСѓСЃРєР° СЃРµСЂРІРёСЃР°.";
        domainDialogSubmit.textContent = editingDomainIndex === null ? "Р”РѕР±Р°РІРёС‚СЊ РґРѕРјРµРЅ" : "РЎРѕС…СЂР°РЅРёС‚СЊ РґРѕРјРµРЅ";
        newDomainInput.value = editingDomainIndex === null ? "" : domains[editingDomainIndex];
        domainConnectionType.value = "domain";
        updateDomainDnsGuide();
        domainFeedback.hidden = true;
        addDomainDialog.showModal();
        newDomainInput.focus();
    }

    function updateDomainDnsGuide() {
        const isSubdomain = domainConnectionType.value === "subdomain";
        const records = isSubdomain
            ? [
                { type: "CNAME", name: "shop", value: "your-store.sdonate.store" }
            ]
            : [
                { type: "CNAME", name: "www", value: "your-store.sdonate.store" },
                { type: "A", name: "@", value: "203.0.113.10" }
            ];
        domainInputLabel.textContent = isSubdomain ? "РџРѕРґРґРѕРјРµРЅ" : "Р”РѕРјРµРЅ";
        newDomainInput.placeholder = isSubdomain ? "shop.domain.com" : "domain.com";
        domainDnsTable.replaceChildren();
        records.forEach(record => {
            const row = document.createElement("div");
            row.className = "domain-dns-row";
            [record.type, record.name, record.value, "DNS only"].forEach((text, index) => {
                const cell = document.createElement("span");
                cell.className = index === 0 ? "domain-dns-type" : "";
                cell.textContent = text;
                row.append(cell);
            });
            domainDnsTable.append(row);
        });
        domainDnsNote.textContent = isSubdomain
            ? "Р•СЃР»Рё РїСЂРѕРІР°Р№РґРµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ CNAME РґР»СЏ РІС‹Р±СЂР°РЅРЅРѕРіРѕ РёРјРµРЅРё, РїСЂРѕРІРµСЂСЊС‚Рµ РµРіРѕ РёРЅСЃС‚СЂСѓРєС†РёСЋ."
            : "Р•СЃР»Рё РґРѕРјРµРЅ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ CNAME РґР»СЏ РєРѕСЂРЅСЏ, РёСЃРїРѕР»СЊР·СѓР№С‚Рµ A-Р·Р°РїРёСЃСЊ.";
    }

    let shops;
    let shop;
    try {
        shops = readShops();
        shop = shops.find(item => item.id === shopId);
    } catch (error) {
        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РјР°РіР°Р·РёРЅ: ${error.message}`);
    }

    if (!shop) {
        if (!toast.textContent) {
            showToast("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ РёР»Рё СѓР¶Рµ СѓРґР°Р»С‘РЅ.");
        }
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    } else {
        domains = Array.isArray(shop.domains) && shop.domains.length
            ? shop.domains.filter(domain => typeof domain === "string")
            : shop.address
                ? [shop.address]
                : [];

        nameInput.value = shop.name;
        const payoutMethod = shop.payoutMethod === "РџР»Р°РіРёРЅ MyPayments"
            ? "РџР»Р°РіРёРЅ SdPlayments"
            : shop.payoutMethod;
        payoutSelect.value = ["RCON", "Webhook", "Р’СЂСѓС‡РЅСѓСЋ", "РџР»Р°РіРёРЅ SdPlayments"].includes(payoutMethod)
            ? payoutMethod
            : "RCON";
        commissionSlider.value = String(Number.isInteger(shop.commissionShare)
            ? Math.max(0, Math.min(100, shop.commissionShare))
            : 5);
        headingName.textContent = shop.name;
        confirmStoreName.textContent = shop.name;
        renderDomains();
        updateCommissionLabels();
        document.title = `РќР°СЃС‚СЂРѕР№РєРё: ${shop.name} вЂ” SDonate`;

        document.querySelector("#back-to-store").href = `./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`;
        document.querySelector("#settings-back-button").href = `./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`;

        commissionSlider.addEventListener("input", updateCommissionLabels);

        document.querySelector("#add-domain").addEventListener("click", () => {
            openDomainDialog(null);
        });

        document.querySelector("#cancel-add-domain").addEventListener("click", () => addDomainDialog.close());
        domainConnectionType.addEventListener("change", updateDomainDnsGuide);

        addDomainForm.addEventListener("submit", event => {
            event.preventDefault();
            const domain = normalizeDomain(newDomainInput.value);
            if (!isValidDomain(domain)) {
                domainFeedback.textContent = "Р’РІРµРґРё РєРѕСЂСЂРµРєС‚РЅС‹Р№ РґРѕРјРµРЅ, РЅР°РїСЂРёРјРµСЂ shop.example.com.";
                domainFeedback.hidden = false;
                newDomainInput.focus();
                return;
            }
            if (domains.some((item, index) =>
                index !== editingDomainIndex && item.toLowerCase() === domain
            )) {
                domainFeedback.textContent = "Р­С‚РѕС‚ РґРѕРјРµРЅ СѓР¶Рµ РµСЃС‚СЊ РІ СЃРїРёСЃРєРµ.";
                domainFeedback.hidden = false;
                newDomainInput.focus();
                return;
            }

            if (editingDomainIndex === null) {
                domains.push(domain);
            } else {
                domains[editingDomainIndex] = domain;
            }
            editingDomainIndex = null;
            renderDomains();
            addDomainDialog.close();
            showToast("Р”РѕРјРµРЅ РѕР±РЅРѕРІР»С‘РЅ РІ С‡РµСЂРЅРѕРІРёРєРµ. РќР°Р¶РјРё В«РЎРѕС…СЂР°РЅРёС‚СЊВ», С‡С‚РѕР±С‹ РїСЂРёРјРµРЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ.");
        });

        form.addEventListener("submit", event => {
            event.preventDefault();
            message.hidden = true;
            if (!form.reportValidity()) {
                return;
            }

            const name = nameInput.value.trim();
            if (name.length < 2) {
                showMessage("РќР°Р·РІР°РЅРёРµ РјР°РіР°Р·РёРЅР° РґРѕР»Р¶РЅРѕ СЃРѕРґРµСЂР¶Р°С‚СЊ РјРёРЅРёРјСѓРј РґРІР° СЃРёРјРІРѕР»Р°.", true);
                nameInput.focus();
                return;
            }

            try {
                shops = readShops();
                const currentShop = shops.find(item => item.id === shopId);
                if (!currentShop) {
                    throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
                }
                currentShop.name = name;
                currentShop.address = domains[0] || "";
                currentShop.domains = [...domains];
                currentShop.payoutMethod = payoutSelect.value;
                currentShop.commissionShare = Number(commissionSlider.value);
                window.sdonateShopStorage.save(shops);

                shop = currentShop;
                headingName.textContent = name;
                confirmStoreName.textContent = name;
                document.title = `РќР°СЃС‚СЂРѕР№РєРё: ${name} вЂ” SDonate`;
                showMessage("РќР°СЃС‚СЂРѕР№РєРё РґРµРјРѕ-РјР°РіР°Р·РёРЅР° СЃРѕС…СЂР°РЅРµРЅС‹ РІ СЌС‚РѕР№ РІРєР»Р°РґРєРµ.", false);
            } catch (error) {
                showMessage(`РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РЅР°СЃС‚СЂРѕР№РєРё: ${error.message}`, true);
            }
        });

        document.querySelectorAll("[data-demo-tool]").forEach(button => {
            button.addEventListener("click", () => {
                if (button.dataset.demoTool === "РљР°СЂС‚РёРЅРєРё") {
                    window.location.assign(`./store-images.html?id=${encodeURIComponent(shop.id)}`);
                    return;
                }
                if (button.dataset.demoTool === "РЁР°Р±Р»РѕРЅ") {
                    window.location.assign(`./store-templates.html?id=${encodeURIComponent(shop.id)}`);
                    return;
                }
                if (button.dataset.demoTool === "РЎСЃС‹Р»РєРё" || button.dataset.demoTool === "РљР°СЃС‚РѕРјРёР·Р°С†РёСЏ") {
                    const tool = button.dataset.demoTool === "РЎСЃС‹Р»РєРё" ? "links" : "customization";
                    window.location.assign(`./store-tools.html?id=${encodeURIComponent(shop.id)}&tool=${tool}`);
                    return;
                }
                showToast(`В«${button.dataset.demoTool}В» РїРѕРєР° РґРѕСЃС‚СѓРїРЅРѕ С‚РѕР»СЊРєРѕ РєР°Рє РґРµРјРѕРЅСЃС‚СЂР°С†РёСЏ.`);
            });
        });

        document.querySelector("#delete-store").addEventListener("click", () => {
            confirmStoreName.textContent = shop.name;
            deleteDialog.showModal();
        });

        document.querySelector("#cancel-delete").addEventListener("click", () => deleteDialog.close());

        document.querySelector("#confirm-delete").addEventListener("click", () => {
            try {
                shops = readShops();
                const remainingShops = shops.filter(item => item.id !== shopId);
                if (remainingShops.length === shops.length) {
                    throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ РІ СЃРїРёСЃРєРµ.");
                }
                window.sdonateShopStorage.save(remainingShops);
                window.location.assign("./shops.html");
            } catch (error) {
                showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РјР°РіР°Р·РёРЅ: ${error.message}`);
                deleteDialog.close();
            }
        });

        logoutButton.addEventListener("click", () => {
            sessionStorage.removeItem("sdonate-demo-authenticated");
            window.location.assign("./reg.html?mode=login");
        });
    }
}

})();

// Source: store-templates.js
(() => {
if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
    window.location.replace("./reg.html?mode=login");
} else {
    const storageKey = window.sdonateShopStorage.storageKey();
    const shopId = new URLSearchParams(window.location.search).get("id");
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "Игрок";
    const templateGrid = document.querySelector("#templates-grid");
    const toast = document.querySelector("#templates-toast");
    const message = document.querySelector("#templates-message");
    const previewDialog = document.querySelector("#template-preview-dialog");
    const purchaseDialog = document.querySelector("#template-purchase-dialog");
    const previewLarge = document.querySelector("#preview-large");
    const previewTitle = document.querySelector("#preview-title");
    const previewDescription = document.querySelector("#preview-description");
    const previewApply = document.querySelector("#preview-apply");
    const purchaseTitle = document.querySelector("#purchase-title");
    const purchaseDescription = document.querySelector("#purchase-description");
    const logoutButton = document.querySelector("#logout-button");
    const templates = [
        { id: "nexium-light", title: "Nexium Light", family: "nexium", theme: "light", paid: false, description: "Минималистичный и светлый дизайн с акцентом на простоту и удобство." },
        { id: "nexium-dark", title: "Nexium Dark", family: "nexium", theme: "dark", paid: false, description: "Стильный тёмный вариант для современных и технологичных проектов." },
        { id: "orvion-light", title: "Orvion Light", family: "orvion", theme: "light", paid: true, price: "399 ₽", description: "Яркий и чистый макет с просторной компоновкой и лёгкой атмосферой." },
        { id: "orvion-dark", title: "Orvion Dark", family: "orvion", theme: "dark", paid: true, price: "399 ₽", description: "Элегантный тёмный стиль с акцентом на визуальный контент." },
        { id: "lumix-light", title: "Lumix Light", family: "lumix", theme: "light", paid: false, description: "Воздушный и лёгкий дизайн с мягкими переходами и нежными акцентами." },
        { id: "lumix-dark", title: "Lumix Dark", family: "lumix", theme: "dark", paid: false, description: "Уютный тёмный стиль с плавными градиентами и мягким освещением." },
        { id: "arcane-light", title: "Arcane Light", family: "arcane", theme: "light", paid: false, description: "Светлый премиальный дизайн с магической атмосферой и аккуратной компоновкой." },
        { id: "arcane-dark", title: "Arcane Dark", family: "arcane", theme: "dark", paid: false, description: "Тёмный выразительный дизайн с глубокими оттенками и атмосферными деталями." },
        { id: "ender-rift", title: "Разлом Эндера", family: "ender", theme: "dark", paid: false, description: "Космический фиолетовый стиль с порталом и свечением Энда." },
        { id: "nether-forge", title: "Кузня Незера", family: "nether", theme: "dark", paid: false, description: "Тёплые оттенки лавы и золота для сурового игрового мира." },
        { id: "deep-ocean", title: "Глубины океана", family: "ocean", theme: "dark", paid: false, description: "Холодная морская палитра, мягкое сияние и волны." },
        { id: "emerald-grove", title: "Изумрудный лес", family: "forest", theme: "dark", paid: false, description: "Спокойный природный дизайн с зелёным свечением и текстурой листвы." },
        { id: "neon-sunset", title: "Неоновый закат", family: "sunset", theme: "dark", paid: false, description: "Стеклянные карточки, розово-оранжевый закат и неоновое свечение." },
        { id: "lime-night", title: "Зелёный неон", family: "lime", theme: "dark", paid: false, description: "Почти чёрный фон, неоново-зелёные кнопки-капсулы и чёткая сетка в стиле игровых серверов." },
        { id: "amber-shop", title: "Янтарный магазин", family: "amber", theme: "dark", paid: false, description: "Строгий тёмный интерфейс с оранжевым акцентом и аккуратными карточками привилегий." },
        { id: "funtime-dark", title: "Красная привилегия", family: "funtime", theme: "dark", paid: false, description: "Плавающая шапка, центральный экран с красным градиентом и карточки привилегий в три колонки." },
        { id: "minimal-light", title: "Светлый минимал", family: "minimal", theme: "light", paid: false, description: "Светло-серый фон, тёмный баннер со скруглением 32px, белые карточки и чёрные кнопки." },
        { id: "crimson-catalog", title: "Красный каталог", family: "crimson", theme: "dark", paid: false, description: "Чёрный фон, крупные заголовки, зелёный блок валюты и сетка карточек с красными кнопками." },
        { id: "really-light", title: "Светлый донат-магазин", family: "really", theme: "light", paid: false, description: "Светлый фон, синий баннер, крупные цветные карточки донатов и оранжевые кнопки «Купить»." }
    ];
    let shop;
    let toastTimer;
    let selectedTemplate;

    document.querySelector("#account-name").textContent = nickname;
    document.querySelector("#account-avatar").textContent = Array.from(nickname)[0].toUpperCase();

    function readShops() {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
            throw new Error("Список магазинов не найден.");
        }
        const shops = JSON.parse(stored);
        if (!Array.isArray(shops) || shops.some(item =>
            !item ||
            typeof item.id !== "string" ||
            typeof item.name !== "string" ||
            typeof item.address !== "string"
        )) {
            throw new Error("Сохранённый список магазинов имеет неверный формат.");
        }
        return shops;
    }

    function showToast(text) {
        window.clearTimeout(toastTimer);
        toast.textContent = text;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 3500);
    }

    function customTemplates() {
        const records = Array.isArray(shop.customTemplates) ? shop.customTemplates : [];
        return records.filter(item => item && typeof item.id === "string" && item.colors && typeof item.colors === "object").map(item => ({
            id: item.id,
            title: String(item.title || "Свой шаблон"),
            family: "custom",
            theme: luminance(item.colors.bg) > 0.5 ? "light" : "dark",
            paid: false,
            custom: true,
            colors: item.colors,
            description: String(item.description || "Ваш собственный шаблон.")
        }));
    }

    function luminance(hex) {
        const match = /^#([0-9a-f]{6})$/i.exec(hex || "");
        if (!match) return 0;
        const value = parseInt(match[1], 16);
        return (0.299 * (value >> 16) + 0.587 * ((value >> 8) & 255) + 0.114 * (value & 255)) / 255;
    }

    function previewStyle(colors) {
        return `background: radial-gradient(ellipse at 70% 30%, ${colors.accent}66, transparent 55%), ${colors.bg};`;
    }

    function createPreviewArt(template) {
        const art = document.createElement("div");
        art.className = `template-art ${template.family}`;
        if (template.custom) {
            art.setAttribute("style", previewStyle(template.colors));
        }
        const overlay = document.createElement("div");
        overlay.className = "template-overlay";
        art.append(overlay);
        return art;
    }

    const customDialog = document.querySelector("#custom-template-dialog");
    const customForm = document.querySelector("#custom-form");
    const customError = document.querySelector("#custom-error");
    const colorFields = ["bg", "panel", "border", "text", "muted", "accent"];
    let editingCustomId = null;

    function updateLive() {
        const live = document.querySelector("#custom-live");
        const value = name => customForm.elements[name].value;
        live.setAttribute("style", `${previewStyle({ bg: value("bg"), accent: value("accent") })} color: ${value("text")}; border: 1px solid ${value("border")};`);
        live.querySelector("small").setAttribute("style", `color: ${value("muted")};`);
        live.querySelector("span").setAttribute("style", `background: ${value("accent")};`);
    }

    function openCustomForm(template) {
        customForm.reset();
        customError.hidden = true;
        editingCustomId = template ? template.id : null;
        document.querySelector("#custom-title").textContent = template ? "Редактирование шаблона" : "Свой шаблон";
        if (template) {
            customForm.elements.title.value = template.title;
            customForm.elements.description.value = template.description;
            colorFields.forEach(name => {
                customForm.elements[name].value = template.colors[name];
            });
        }
        updateLive();
        customDialog.showModal();
    }

    function saveCustomTemplate(event) {
        event.preventDefault();
        const title = customForm.elements.title.value.trim();
        if (!title) {
            customError.textContent = "Укажите название шаблона.";
            customError.hidden = false;
            return;
        }
        const colors = {};
        colorFields.forEach(name => {
            colors[name] = customForm.elements[name].value;
        });
        try {
            const shops = readShops();
            const currentShop = shops.find(item => item.id === shopId);
            if (!currentShop) throw new Error("Магазин не найден.");
            const list = Array.isArray(currentShop.customTemplates) ? currentShop.customTemplates : [];
            if (!editingCustomId && list.length >= 12) throw new Error("Можно создать не больше 12 своих шаблонов.");
            const record = {
                id: editingCustomId || `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
                title,
                description: customForm.elements.description.value.trim(),
                colors
            };
            currentShop.customTemplates = editingCustomId
                ? list.map(item => item.id === editingCustomId ? record : item)
                : [...list, record];
            if (currentShop.templateId === record.id) {
                currentShop.templateName = record.title;
            }
            window.sdonateShopStorage.save(shops);
            shop = currentShop;
            customDialog.close();
            renderTemplates();
            showToast(editingCustomId ? "Шаблон обновлён." : "Шаблон создан. Нажмите «Применить».");
        } catch (error) {
            customError.textContent = `Не удалось сохранить: ${error.message}`;
            customError.hidden = false;
        }
    }

    function deleteCustomTemplate(template) {
        try {
            const shops = readShops();
            const currentShop = shops.find(item => item.id === shopId);
            if (!currentShop) throw new Error("Магазин не найден.");
            currentShop.customTemplates = (currentShop.customTemplates || []).filter(item => item.id !== template.id);
            if (currentShop.templateId === template.id) {
                currentShop.templateId = "nexium-dark";
                currentShop.templateName = "Nexium Dark";
            }
            window.sdonateShopStorage.save(shops);
            shop = currentShop;
            renderTemplates();
            showToast("Шаблон удалён.");
        } catch (error) {
            showToast(`Не удалось удалить шаблон: ${error.message}`);
        }
    }

    function applyTemplate(template) {
        if (template.paid) {
            purchaseTitle.textContent = `Шаблон ${template.title} · ${template.price}`;
            purchaseDescription.textContent = "Этот шаблон платный. В демо-режиме оплата не подключена, поэтому купить и применить его нельзя.";
            purchaseDialog.showModal();
            return;
        }

        try {
            const shops = readShops();
            const currentShop = shops.find(item => item.id === shopId);
            if (!currentShop) {
                throw new Error("Магазин не найден.");
            }
            currentShop.templateId = template.id;
            currentShop.templateName = template.title;
            window.sdonateShopStorage.save(shops);
            shop = currentShop;
            renderTemplates();
            message.textContent = `Шаблон «${template.title}» выбран для демо-магазина. Опубликованный сайт не изменён.`;
            message.hidden = false;
        } catch (error) {
            showToast(`Не удалось применить шаблон: ${error.message}`);
        }
    }

    function openPreview(template) {
        selectedTemplate = template;
        previewLarge.replaceChildren(createPreviewArt(template));
        previewLarge.className = `preview-large theme-${template.theme}`;
        previewTitle.textContent = template.title;
        previewDescription.textContent = template.description;
        previewApply.textContent = template.paid ? `Купить · ${template.price}` : "Применить шаблон";
        previewDialog.showModal();
    }

    function makeTemplateCard(template) {
        const card = document.createElement("article");
        card.className = `template-card theme-${template.theme}${shop.templateId === template.id ? " is-active" : ""}`;
        card.append(createPreviewArt(template));

        const content = document.createElement("div");
        content.className = "template-content";
        const titleRow = document.createElement("div");
        titleRow.className = "template-title-row";
        const title = document.createElement("h2");
        title.textContent = template.title;
        titleRow.append(title);

        if (template.paid) {
            const price = document.createElement("span");
            price.className = "template-price";
            price.textContent = template.price;
            titleRow.append(price);
        } else if (shop.templateId === template.id) {
            const active = document.createElement("span");
            active.className = "template-free-badge";
            active.textContent = "ВЫБРАН";
            titleRow.append(active);
        }

        const description = document.createElement("p");
        description.textContent = template.description;
        const actions = document.createElement("div");
        actions.className = "template-actions";

        const applyButton = document.createElement("button");
        applyButton.className = "template-action-button";
        applyButton.type = "button";
        applyButton.disabled = !template.paid && shop.templateId === template.id;
        applyButton.textContent = template.paid
            ? `₽ ${template.price}`
            : shop.templateId === template.id
                ? "✓ Применено"
                : "→ Применить";
        applyButton.addEventListener("click", () => applyTemplate(template));

        const previewButton = document.createElement("button");
        previewButton.className = "template-secondary-button";
        previewButton.type = "button";
        previewButton.textContent = "◉ Превью";
        previewButton.addEventListener("click", () => openPreview(template));

        actions.append(applyButton, previewButton);
        if (template.custom) {
            const editButton = document.createElement("button");
            editButton.className = "template-secondary-button";
            editButton.type = "button";
            editButton.textContent = "✎";
            editButton.setAttribute("aria-label", `Изменить ${template.title}`);
            editButton.addEventListener("click", () => openCustomForm(template));
            const removeButton = document.createElement("button");
            removeButton.className = "template-secondary-button";
            removeButton.type = "button";
            removeButton.textContent = "×";
            removeButton.setAttribute("aria-label", `Удалить ${template.title}`);
            removeButton.addEventListener("click", () => deleteCustomTemplate(template));
            actions.append(editButton, removeButton);
        }
        content.append(titleRow, description, actions);
        card.append(content);
        return card;
    }

    function renderTemplates() {
        templateGrid.replaceChildren(...[...templates, ...customTemplates()].map(makeTemplateCard));
    }

    let shops;
    try {
        shops = readShops();
        shop = shops.find(item => item.id === shopId);
    } catch (error) {
        showToast(`Не удалось загрузить магазин: ${error.message}`);
    }

    if (!shop) {
        if (!toast.textContent) {
            showToast("Магазин не найден или уже удалён.");
        }
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    } else {
        const settingsUrl = `./store-settings.html?id=${encodeURIComponent(shop.id)}`;
        document.querySelector("#back-to-settings").href = settingsUrl;
        document.querySelector("#templates-back-button").href = settingsUrl;
        document.title = `Шаблоны: ${shop.name} — SDonate`;
        renderTemplates();

        previewApply.addEventListener("click", () => {
            if (selectedTemplate) {
                previewDialog.close();
                applyTemplate(selectedTemplate);
            }
        });

        document.querySelector("#preview-close").addEventListener("click", () => previewDialog.close());
        document.querySelector("#add-custom-template").addEventListener("click", () => openCustomForm(null));
        document.querySelector("#custom-close").addEventListener("click", () => customDialog.close());
        document.querySelector("#custom-cancel").addEventListener("click", () => customDialog.close());
        customForm.addEventListener("input", updateLive);
        customForm.addEventListener("submit", saveCustomTemplate);
        document.querySelector("#purchase-cancel").addEventListener("click", () => purchaseDialog.close());
        document.querySelector("#purchase-confirm").addEventListener("click", () => {
            purchaseDialog.close();
            showToast("Оплата недоступна в демо-режиме.");
        });

        logoutButton.addEventListener("click", () => {
            sessionStorage.removeItem("sdonate-demo-authenticated");
            window.location.assign("./reg.html?mode=login");
        });
    }
}


})();

// Source: store-tools.js
(() => {
if (sessionStorage.getItem("sdonate-demo-authenticated") !== "true") {
    window.location.replace("./reg.html?mode=login");
} else {
    const storageKey = window.sdonateShopStorage.storageKey();
    const parameters = new URLSearchParams(window.location.search);
    const shopId = parameters.get("id");
    const tool = parameters.get("tool");
    if (tool === "coupons") {
        window.location.replace(`./coupons.html?id=${encodeURIComponent(shopId || "")}`);
    }
    if (tool === "pages") {
        window.location.replace(`./store-pages.html?id=${encodeURIComponent(shopId || "")}`);
    }
    if (tool === "collections") {
        window.location.replace(`./store-collections.html?id=${encodeURIComponent(shopId || "")}`);
    }
    if (tool === "waits") {
        window.location.replace(`./store-discounts.html?id=${encodeURIComponent(shopId || "")}`);
    }
    if (tool === "partners") {
        window.location.replace(`./store-partners.html?id=${encodeURIComponent(shopId || "")}`);
    }
    const configurations = {
        servers: {
            title: "РЎРµСЂРІРµСЂС‹",
            description: "Р”РѕР±Р°РІР»СЏР№ РёРіСЂРѕРІС‹Рµ СЃРµСЂРІРµСЂС‹ РІ СЃРїРёСЃРѕРє СЃРІРѕРµРіРѕ РјР°РіР°Р·РёРЅР°.",
            first: { label: "РќР°Р·РІР°РЅРёРµ СЃРµСЂРІРµСЂР°", placeholder: "РќР°РїСЂРёРјРµСЂ, Survival" },
            second: { label: "РђРґСЂРµСЃ СЃРµСЂРІРµСЂР°", placeholder: "play.example.com" }
        },
        coupons: {
            title: "РљСѓРїРѕРЅС‹",
            description: "РЎРѕР·РґР°РІР°Р№ РґРµРјРѕРЅСЃС‚СЂР°С†РёРѕРЅРЅС‹Рµ РїСЂРѕРјРѕРєРѕРґС‹ Рё СЃРєРёРґРєРё.",
            first: { label: "РџСЂРѕРјРѕРєРѕРґ", placeholder: "WELCOME" },
            second: { label: "РЎРєРёРґРєР° (%)", placeholder: "10", type: "number", min: "1", max: "100" }
        },
        partners: {
            title: "РџР°СЂС‚РЅС‘СЂС‹",
            description: "РЎРѕС…СЂР°РЅСЏР№ РєРѕРЅС‚Р°РєС‚С‹ Рё СЃСЃС‹Р»РєРё РїР°СЂС‚РЅС‘СЂРѕРІ РјР°РіР°Р·РёРЅР°.",
            first: { label: "РРјСЏ РїР°СЂС‚РЅС‘СЂР°", placeholder: "РќР°РїСЂРёРјРµСЂ, Minecraft Р±Р»РѕРіРµСЂ" },
            second: { label: "РЎСЃС‹Р»РєР° РёР»Рё РєРѕРЅС‚Р°РєС‚", placeholder: "https://example.com" }
        },
        waits: {
            title: "РњР°СЃСЃРѕРІС‹Рµ РѕР¶РёРґР°РЅРёСЏ",
            description: "Р’РµРґРё Р»РѕРєР°Р»СЊРЅС‹Рµ С‡РµСЂРЅРѕРІС‹Рµ Р·Р°РјРµС‚РєРё Рѕ РІС‹РґР°С‡Рµ Р·Р°РєР°Р·РѕРІ.",
            first: { label: "РќРёРє РёРіСЂРѕРєР°", placeholder: "Player123" },
            second: { label: "Р—Р°РјРµС‚РєР° Рѕ Р·Р°РєР°Р·Рµ", placeholder: "VIP РЅР° 30 РґРЅРµР№" }
        },
        collections: {
            title: "РџРѕРґР±РѕСЂРєРё",
            description: "Р“СЂСѓРїРїРёСЂСѓР№ С‚РѕРІР°СЂС‹ РІ РґРµРјРѕРЅСЃС‚СЂР°С†РёРѕРЅРЅС‹Рµ РїРѕРґР±РѕСЂРєРё.",
            first: { label: "РќР°Р·РІР°РЅРёРµ РїРѕРґР±РѕСЂРєРё", placeholder: "РџРѕРїСѓР»СЏСЂРЅРѕРµ" },
            second: { label: "РћРїРёСЃР°РЅРёРµ", placeholder: "РљСЂР°С‚РєРѕРµ РѕРїРёСЃР°РЅРёРµ РїРѕРґР±РѕСЂРєРё" }
        },
        pages: {
            title: "РЎС‚СЂР°РЅРёС†С‹",
            description: "РЎРѕР·РґР°РІР°Р№ С‡РµСЂРЅРѕРІС‹Рµ РёРЅС„РѕСЂРјР°С†РёРѕРЅРЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ РјР°РіР°Р·РёРЅР°.",
            first: { label: "Р—Р°РіРѕР»РѕРІРѕРє СЃС‚СЂР°РЅРёС†С‹", placeholder: "Рћ СЃРµСЂРІРµСЂРµ" },
            second: { label: "РўРµРєСЃС‚ СЃС‚СЂР°РЅРёС†С‹", placeholder: "Р”РѕР±Р°РІСЊ РѕРїРёСЃР°РЅРёРµ СЃРµСЂРІРµСЂР°", multiline: true }
        },
        links: {
            title: "РЎСЃС‹Р»РєРё",
            description: "РЈРїСЂР°РІР»СЏР№ СЃСЃС‹Р»РєР°РјРё РЅР° СЃРѕС†РёР°Р»СЊРЅС‹Рµ СЃРµС‚Рё РІ СЃРІРѕС‘Рј РјР°РіР°Р·РёРЅРµ.",
            links: true
        },
        plugins: {
            title: "РџР»Р°РіРёРЅС‹",
            description: "РЈРїСЂР°РІР»СЏР№ РЅР°СЃС‚СЂРѕР№РєР°РјРё Рё РґРµРјРѕ-РїР»Р°РіРёРЅР°РјРё СЃРІРѕРµРіРѕ РјР°РіР°Р·РёРЅР°.",
            plugins: true
        },
        customization: {
            title: "РљР°СЃС‚РѕРјРёР·Р°С†РёСЏ",
            description: "РќР°СЃС‚СЂРѕР№ Р·Р°РіРѕР»РѕРІРѕРє, С†РІРµС‚РѕРІСѓСЋ РїР°Р»РёС‚СЂСѓ Рё СЌР»РµРјРµРЅС‚С‹ Р±СѓРґСѓС‰РµР№ РІРёС‚СЂРёРЅС‹ РјР°РіР°Р·РёРЅР°.",
            customization: true
        },
        analytics: {
            title: "РђРЅР°Р»РёС‚РёРєР°",
            description: "РџСЂРѕСЃРјР°С‚СЂРёРІР°Р№ РґРµРјРѕРЅСЃС‚СЂР°С†РёРѕРЅРЅС‹Рµ РїРѕРєР°Р·Р°С‚РµР»Рё РјР°РіР°Р·РёРЅР°. Р РµР°Р»СЊРЅС‹Рµ РїРѕСЃРµС‰РµРЅРёСЏ РїРѕРєР° РЅРµ СЃРѕР±РёСЂР°СЋС‚СЃСЏ.",
            analytics: true
        }
    };
    const config = configurations[tool];
    const title = document.querySelector("#tool-title");
    const description = document.querySelector("#tool-description");
    const form = document.querySelector("#tool-form");
    const fields = document.querySelector("#tool-fields");
    const feedback = document.querySelector("#tool-feedback");
    const list = document.querySelector("#tool-record-list");
    const empty = document.querySelector("#tool-empty");
    const count = document.querySelector("#tool-record-count");
    const toast = document.querySelector("#tool-toast");
    const accountName = document.querySelector("#account-name");
    const logoutButton = document.querySelector("#logout-button");
    const nickname = sessionStorage.getItem("sdonate-demo-nickname") || "РРіСЂРѕРє";
    let shops;
    let shop;
    let toastTimer;

    function readShops() {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.some(item =>
            !item || typeof item.id !== "string" || typeof item.name !== "string"
        )) {
            throw new Error("РЎРїРёСЃРѕРє РјР°РіР°Р·РёРЅРѕРІ РёРјРµРµС‚ РЅРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚.");
        }
        return parsed;
    }

    function persistShop() {
        shops = readShops();
        const currentShop = shops.find(item => item.id === shopId);
        if (!currentShop) {
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        currentShop.tools = shop.tools || {};
        currentShop.customization = shop.customization || {};
        currentShop.socialLinks = shop.socialLinks || {};
        currentShop.pluginSettings = shop.pluginSettings || {};
        shops[shops.findIndex(item => item.id === shopId)] = currentShop;
        shop = currentShop;
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

    function makeField(field, index) {
        const label = document.createElement("label");
        label.className = "tool-field";
        label.textContent = field.label;
        const input = document.createElement(field.multiline ? "textarea" : "input");
        input.name = index === 0 ? "name" : "detail";
        input.placeholder = field.placeholder;
        input.required = true;
        if (field.type) {
            input.type = field.type;
        }
        if (field.min) {
            input.min = field.min;
        }
        if (field.max) {
            input.max = field.max;
        }
        label.append(input);
        fields.append(label);
    }

    function renderRecords() {
        list.replaceChildren();
        const records = Array.isArray(shop.tools && shop.tools[tool]) ? shop.tools[tool] : [];
        records.forEach(record => {
            const row = document.createElement("article");
            row.className = "tool-record";
            const copy = document.createElement("div");
            copy.className = "tool-record-copy";
            const name = document.createElement("b");
            name.textContent = record.name;
            const detail = document.createElement("span");
            detail.textContent = record.detail;
            copy.append(name, detail);

            const remove = document.createElement("button");
            remove.className = "tool-remove-button";
            remove.type = "button";
            remove.textContent = "РЈРґР°Р»РёС‚СЊ";
            remove.setAttribute("aria-label", `РЈРґР°Р»РёС‚СЊ: ${record.name}`);
            remove.addEventListener("click", () => {
                try {
                    shop.tools[tool] = shop.tools[tool].filter(item => item.id !== record.id);
                    persistShop();
                    renderRecords();
                } catch (error) {
                    showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ Р·Р°РїРёСЃСЊ: ${error.message}`);
                }
            });
            row.append(copy, remove);
            list.append(row);
        });
        count.textContent = String(records.length);
        empty.hidden = records.length !== 0;
    }

    accountName.textContent = nickname;
    document.querySelector("#account-avatar").textContent = Array.from(nickname)[0].toUpperCase();

    try {
        shops = readShops();
        shop = shops.find(item => item.id === shopId);
        if (!shop) {
            throw new Error("РњР°РіР°Р·РёРЅ РЅРµ РЅР°Р№РґРµРЅ.");
        }
        if (!config) {
            throw new Error("РќРµРёР·РІРµСЃС‚РЅС‹Р№ СЂР°Р·РґРµР» СѓРїСЂР°РІР»РµРЅРёСЏ.");
        }
        shop.tools = shop.tools && typeof shop.tools === "object" ? shop.tools : {};
        title.textContent = config.title;
        description.textContent = config.description;
        document.title = `${config.title}: ${shop.name} вЂ” SDonate`;
        document.querySelector("#back-to-shop").href = `./shop-dashboard.html?id=${encodeURIComponent(shop.id)}`;
        document.querySelector("#back-to-settings").href = `./store-settings.html?id=${encodeURIComponent(shop.id)}`;
        if (tool === "plugins") {
            const serverEntry = document.querySelector("#plugin-server-entry");
            serverEntry.hidden = false;
            document.querySelector("#open-servers").href = `./servers.html?id=${encodeURIComponent(shop.id)}`;
            document.querySelector("#plugin-payout-link").href = `./store-settings.html?id=${encodeURIComponent(shop.id)}`;
            document.querySelector("#tool-editor-panel").hidden = true;
            document.querySelector("#tool-records-panel").hidden = true;
            const pluginDashboard = document.querySelector("#plugin-dashboard");
            pluginDashboard.hidden = false;
            description.textContent = "РЈРїСЂР°РІР»СЏР№ РЅР°СЃС‚СЂРѕР№РєР°РјРё Рё РґРµРјРѕ-РїР»Р°РіРёРЅР°РјРё СЃРІРѕРµРіРѕ РјР°РіР°Р·РёРЅР°.";

            const defaultPluginSettings = {
                weather: "autumn",
                recentPurchases: true,
                translations: true,
                pageEditor: false,
                cart: true,
                gifts: true,
                currencySlider: false
            };
            shop.pluginSettings = shop.pluginSettings && typeof shop.pluginSettings === "object"
                ? { ...defaultPluginSettings, ...shop.pluginSettings }
                : { ...defaultPluginSettings };

            const updatePluginStatus = (setting, value) => {
                const status = pluginDashboard.querySelector(`[data-plugin-status="${setting}"]`);
                if (status) {
                    status.textContent = value ? "Р’РєР»СЋС‡РµРЅРѕ РІ РґРµРјРѕ-СЂРµР¶РёРјРµ" : "Р’С‹РєР»СЋС‡РµРЅРѕ";
                }
            };

            pluginDashboard.querySelectorAll("[data-plugin-setting]").forEach(control => {
                const setting = control.dataset.pluginSetting;
                if (control instanceof HTMLSelectElement) {
                    const weatherOptions = ["none", "spring", "summer", "autumn", "winter"];
                    const selectedWeather = shop.pluginSettings[setting];
                    control.value = weatherOptions.includes(selectedWeather)
                        ? selectedWeather
                        : defaultPluginSettings[setting];
                    shop.pluginSettings[setting] = control.value;
                } else if (control instanceof HTMLInputElement) {
                    control.checked = shop.pluginSettings[setting] === true;
                    updatePluginStatus(setting, control.checked);
                }

                control.addEventListener("change", () => {
                    const previousValue = shop.pluginSettings[setting];
                    const value = control instanceof HTMLSelectElement ? control.value : control.checked;
                    shop.pluginSettings[setting] = value;
                    try {
                        persistShop();
                        updatePluginStatus(setting, Boolean(value));
                        showToast("Р”РµРјРѕ-РЅР°СЃС‚СЂРѕР№РєР° СЃРѕС…СЂР°РЅРµРЅР° РґР»СЏ СЌС‚РѕРіРѕ РјР°РіР°Р·РёРЅР°.");
                    } catch (error) {
                        shop.pluginSettings[setting] = previousValue;
                        if (control instanceof HTMLSelectElement) {
                            control.value = previousValue;
                        } else {
                            control.checked = previousValue === true;
                            updatePluginStatus(setting, control.checked);
                        }
                        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РЅР°СЃС‚СЂРѕР№РєСѓ: ${error.message}`);
                    }
                });
            });

            const sliderServers = document.querySelector("#slider-servers");
            const sliderCurrencies = document.querySelector("#slider-currencies");
            const sliderMax = document.querySelector("#slider-max");
            const sliderFeedback = document.querySelector("#slider-feedback");
            const savedSlider = shop.pluginSettings.currencySliderConfig && typeof shop.pluginSettings.currencySliderConfig === "object"
                ? shop.pluginSettings.currencySliderConfig
                : {};
            const savedServers = Array.isArray(savedSlider.servers) ? savedSlider.servers : [];
            const savedCurrencies = Array.isArray(savedSlider.currencyIds) ? savedSlider.currencyIds : [];
            const serverNames = [...new Set((Array.isArray(shop.servers) ? shop.servers : [])
                .map(server => typeof server === "string" ? server : server && server.name)
                .filter(name => typeof name === "string" && name.trim()))];
            const currencyProducts = (Array.isArray(shop.products) ? shop.products : [])
                .filter(product => product && typeof product.id === "string" && product.category === "Р’Р°Р»СЋС‚Р°");

            const makeChip = (container, value, label, checked, counter) => {
                const chip = document.createElement("label");
                chip.className = "slider-chip";
                const input = document.createElement("input");
                input.type = "checkbox";
                input.value = value;
                input.checked = checked;
                input.addEventListener("change", counter);
                chip.append(input, label);
                container.append(chip);
            };
            const updateSliderCounts = () => {
                document.querySelector("#slider-servers-count").textContent =
                    `Р’С‹Р±СЂР°РЅРѕ: ${sliderServers.querySelectorAll("input:checked").length}`;
                document.querySelector("#slider-currencies-count").textContent =
                    `Р’С‹Р±СЂР°РЅРѕ: ${sliderCurrencies.querySelectorAll("input:checked").length}`;
            };
            const emptyNote = (container, text) => {
                const note = document.createElement("p");
                note.className = "plugin-setting-note";
                note.textContent = text;
                container.append(note);
            };
            if (serverNames.length === 0) {
                emptyNote(sliderServers, "РЎРµСЂРІРµСЂРѕРІ РїРѕРєР° РЅРµС‚ вЂ” РґРѕР±Р°РІСЊС‚Рµ РёС… РІ СЂР°Р·РґРµР»Рµ В«РЎРµСЂРІРµСЂС‹В».");
            }
            serverNames.forEach(name => makeChip(sliderServers, name, name, savedServers.includes(name), updateSliderCounts));
            if (currencyProducts.length === 0) {
                emptyNote(sliderCurrencies, "Р’ РјР°РіР°Р·РёРЅРµ РїРѕРєР° РЅРµС‚ С‚РѕРІР°СЂРѕРІ С‚РёРїР° В«Р’Р°Р»СЋС‚Р°В» вЂ” СЃРѕР·РґР°Р№С‚Рµ РёС… РІ СЂР°Р·РґРµР»Рµ В«РўРѕРІР°СЂС‹В».");
            }
            currencyProducts.forEach(product => makeChip(sliderCurrencies, product.id, product.name, savedCurrencies.includes(product.id), updateSliderCounts));
            sliderMax.value = Number.isInteger(savedSlider.max) && savedSlider.max > 0 ? String(savedSlider.max) : "";
            updateSliderCounts();

            document.querySelector("#slider-save").addEventListener("click", () => {
                sliderFeedback.hidden = true;
                const rawMax = sliderMax.value.trim();
                const max = rawMax === "" ? null : Number(rawMax);
                if (max !== null && (!Number.isInteger(max) || max < 1 || max > 1000000)) {
                    sliderFeedback.textContent = "РњР°РєСЃРёРјСѓРј РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ С†РµР»С‹Рј С‡РёСЃР»РѕРј РѕС‚ 1 РґРѕ 1 000 000.";
                    sliderFeedback.hidden = false;
                    return;
                }
                const previous = shop.pluginSettings.currencySliderConfig;
                shop.pluginSettings.currencySliderConfig = {
                    servers: Array.from(sliderServers.querySelectorAll("input:checked"), input => input.value),
                    currencyIds: Array.from(sliderCurrencies.querySelectorAll("input:checked"), input => input.value),
                    max
                };
                try {
                    persistShop();
                    showToast("РќР°СЃС‚СЂРѕР№РєРё РїРѕР»Р·СѓРЅРєР° СЃРѕС…СЂР°РЅРµРЅС‹.");
                } catch (error) {
                    shop.pluginSettings.currencySliderConfig = previous;
                    showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РЅР°СЃС‚СЂРѕР№РєРё: ${error.message}`);
                }
            });

            const pluginActionMessages = {
                weather: "Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рµ РЅР°СЃС‚СЂРѕР№РєРё РїРѕРіРѕРґС‹ РїРѕРєР° РЅРµРґРѕСЃС‚СѓРїРЅС‹ РІ РґРµРјРѕ-СЂРµР¶РёРјРµ.",
                notification: "РЎРѕР·РґР°РЅРёРµ СѓРІРµРґРѕРјР»РµРЅРёР№ РїРѕРєР° РЅРµРґРѕСЃС‚СѓРїРЅРѕ РІ РґРµРјРѕ-СЂРµР¶РёРјРµ.",
                "gift-rewards": "РќР°СЃС‚СЂРѕР№РєР° РЅР°РіСЂР°Рґ РїРѕРєР° РЅРµ РїРѕРґРєР»СЋС‡РµРЅР°.",
                "gift-log": "Р–СѓСЂРЅР°Р» РїРѕРґР°СЂРєРѕРІ РїРѕРєР° РЅРµ РїРѕРґРєР»СЋС‡С‘РЅ."
            };
            pluginDashboard.querySelectorAll("[data-plugin-action]").forEach(button => {
                button.addEventListener("click", () => {
                    showToast(pluginActionMessages[button.dataset.pluginAction]);
                });
            });
        }
        document.querySelector("#tool-form-title").textContent = config.analytics ? "Р”РµРјРѕ-РїРѕРєР°Р·Р°С‚РµР»Рё" : "Р”РѕР±Р°РІРёС‚СЊ Р·Р°РїРёСЃСЊ";
        document.querySelector("#tool-list-title").textContent = config.analytics ? "РџСЂРёРјРµСЂ СЃС‚Р°С‚РёСЃС‚РёРєРё" : "РЎРѕС…СЂР°РЅС‘РЅРЅС‹Рµ Р·Р°РїРёСЃРё";
        document.querySelector("#tool-list-description").textContent = config.analytics
            ? "Р­С‚Рё Р·РЅР°С‡РµРЅРёСЏ РїСЂРёРІРµРґРµРЅС‹ С‚РѕР»СЊРєРѕ РґР»СЏ РґРµРјРѕРЅСЃС‚СЂР°С†РёРё РёРЅС‚РµСЂС„РµР№СЃР°."
            : `Р—Р°РїРёСЃРё РґР»СЏ РјР°РіР°Р·РёРЅР° В«${shop.name}В».`;

        if (config.links) {
            document.querySelector("#tool-editor-panel").hidden = true;
            document.querySelector("#tool-records-panel").hidden = true;
            const linksPanel = document.querySelector("#social-links-panel");
            const linksForm = document.querySelector("#social-links-form");
            const linksFeedback = document.querySelector("#social-links-feedback");
            const fieldsByName = new Map(Array.from(linksForm.querySelectorAll("input[name]"), input => [input.name, input]));
            const storedLinks = shop.socialLinks && typeof shop.socialLinks === "object"
                ? shop.socialLinks
                : {};

            if (!Object.keys(storedLinks).length && Array.isArray(shop.tools.links)) {
                const aliases = new Map([
                    ["telegram", "telegram"], ["С‚РµР»РµРіСЂР°Рј", "telegram"],
                    ["youtube", "youtube"], ["СЋС‚СѓР±", "youtube"],
                    ["vk", "vk"], ["РІРє", "vk"],
                    ["twitch", "twitch"], ["discord", "discord"],
                    ["tiktok", "tiktok"], ["С‚РёРєС‚РѕРє", "tiktok"]
                ]);
                shop.tools.links.forEach(record => {
                    const name = typeof record.name === "string" ? aliases.get(record.name.trim().toLowerCase()) : null;
                    if (name && typeof record.detail === "string" && !storedLinks[name]) {
                        storedLinks[name] = record.detail;
                    }
                });
            }

            Object.entries(storedLinks).forEach(([name, value]) => {
                const field = fieldsByName.get(name);
                if (field && typeof value === "string") {
                    field.value = value;
                }
            });
            linksPanel.hidden = false;
            linksForm.addEventListener("submit", event => {
                event.preventDefault();
                linksFeedback.hidden = true;
                if (!linksForm.reportValidity()) {
                    return;
                }

                const links = {};
                for (const [name, field] of fieldsByName) {
                    const value = field.value.trim();
                    if (!value) {
                        continue;
                    }
                    try {
                        const url = new URL(value);
                        if (!["http:", "https:"].includes(url.protocol)) {
                            throw new Error();
                        }
                        links[name] = url.href;
                    } catch {
                        linksFeedback.textContent = `РџСЂРѕРІРµСЂСЊ СЃСЃС‹Р»РєСѓ РґР»СЏ РїРѕР»СЏ В«${field.closest(".social-link-field").firstElementChild.textContent}В».`;
                        linksFeedback.hidden = false;
                        field.focus();
                        return;
                    }
                }

                try {
                    shop.socialLinks = links;
                    persistShop();
                    showToast("РЎСЃС‹Р»РєРё СЃРѕС…СЂР°РЅРµРЅС‹ РІ РЅР°СЃС‚СЂРѕР№РєР°С… РґРµРјРѕ-РјР°РіР°Р·РёРЅР°.");
                } catch (error) {
                    linksFeedback.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ СЃСЃС‹Р»РєРё: ${error.message}`;
                    linksFeedback.hidden = false;
                }
            });
        } else if (config.customization) {
            const editorPanel = document.querySelector("#tool-editor-panel");
            const recordsPanel = document.querySelector("#tool-records-panel");
            const customizationPanel = document.querySelector("#customization-panel");
            const customizationForm = document.querySelector("#customization-form");
            const customizationFeedback = document.querySelector("#customization-feedback");
            const colorSwatches = document.querySelector("#color-swatches");
            const preview = document.querySelector("#customization-preview");
            const previewTitle = document.querySelector("#preview-title");
            const previewDescription = document.querySelector("#preview-description");
            const previewAboutTitle = document.querySelector("#preview-about-title");
            const previewAboutDescription = document.querySelector("#preview-about-description");
            const previewAddress = document.querySelector("#preview-address");
            const previewOnline = document.querySelector("#preview-online");
            const imageInput = document.querySelector("#customization-image-input");
            const imageRemoveButton = document.querySelector("#customization-image-remove");
            const imageFilename = document.querySelector("#customization-image-filename");
            const imageFeedback = document.querySelector("#customization-image-feedback");
            const previewBackgroundImage = document.querySelector("#preview-background-image");
            const presetColors = [
                "#ff3b4e", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
                "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
                "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b",
                "#475569", "#71717a", "#52525b", "#78716c"
            ];
            const stored = shop.customization && typeof shop.customization === "object"
                ? shop.customization
                : {};
            const initialColor = /^#[0-9a-f]{6}$/i.test(stored.accentColor || "")
                ? stored.accentColor
                : "#625be2";
            const controls = customizationForm.elements;
            let backgroundImage = typeof stored.backgroundImage === "string" &&
                stored.backgroundImage.startsWith("data:image/webp;base64,")
                ? stored.backgroundImage
                : "";
            const savedBackgroundKey = window.sdonateImageStorage.keyFromReference(stored.backgroundImage);

            async function compressBackgroundImage(file) {
                const imageUrl = URL.createObjectURL(file);
                const image = new Image();
                try {
                    await new Promise((resolve, reject) => {
                        image.addEventListener("load", resolve, { once: true });
                        image.addEventListener("error", () => reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.")), { once: true });
                        image.src = imageUrl;
                    });
                } finally {
                    URL.revokeObjectURL(imageUrl);
                }
                if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40_000_000) {
                    throw new Error("РЈ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ СЃР»РёС€РєРѕРј Р±РѕР»СЊС€РѕРµ СЂР°Р·СЂРµС€РµРЅРёРµ.");
                }

                const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
                canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
                const context = canvas.getContext("2d");
                if (!context) {
                    throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±СЂР°Р±РѕС‚Р°С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.");
                }
                context.drawImage(image, 0, 0, canvas.width, canvas.height);

                for (const quality of [0.84, 0.72, 0.6, 0.48, 0.36]) {
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", quality));
                    if (!blob || blob.type !== "image/webp") {
                        throw new Error("Р‘СЂР°СѓР·РµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ СЃР¶Р°С‚РёРµ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ РІ WEBP.");
                    }
                    if (blob.size <= 900 * 1024) {
                        return await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.addEventListener("load", () => {
                                if (typeof reader.result === "string") {
                                    resolve(reader.result);
                                } else {
                                    reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РѕР±СЂР°Р±РѕС‚Р°РЅРЅРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ."));
                                }
                            }, { once: true });
                            reader.addEventListener("error", () => reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕС‡РёС‚Р°С‚СЊ РѕР±СЂР°Р±РѕС‚Р°РЅРЅРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.")), { once: true });
                            reader.readAsDataURL(blob);
                        });
                    }
                }
                throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ СЃР¶Р°С‚СЊ С„РѕС‚Рѕ РґРѕ РґРѕРїСѓСЃС‚РёРјРѕРіРѕ СЂР°Р·РјРµСЂР°.");
            }

            editorPanel.hidden = true;
            recordsPanel.hidden = true;
            customizationPanel.hidden = false;
            const bannerCopy = document.querySelector(".demo-banner span:nth-child(2)");
            const bannerLabel = document.createElement("b");
            bannerLabel.textContent = "Р”РµРјРѕ-РѕС„РѕСЂРјР»РµРЅРёРµ";
            bannerCopy.replaceChildren(
                bannerLabel,
                document.createTextNode(" вЂ” РЅР°СЃС‚СЂРѕР№РєРё СЃРѕС…СЂР°РЅСЏСЋС‚СЃСЏ РІ СЌС‚РѕРј Р±СЂР°СѓР·РµСЂРµ Рё РїРѕРєР° РЅРµ РїСѓР±Р»РёРєСѓСЋС‚СЃСЏ РЅР° СЃР°Р№С‚Рµ РјР°РіР°Р·РёРЅР°.")
            );
            document.querySelector("#tool-form-title").textContent = "РћС„РѕСЂРјР»РµРЅРёРµ РІРёС‚СЂРёРЅС‹";

            controls.title.value = typeof stored.title === "string" ? stored.title : "РњС‹ РїРѕР±РµРґРёС‚РµР»Рё!";
            controls.description.value = typeof stored.description === "string" ? stored.description : "";
            controls.aboutTitle.value = typeof stored.aboutTitle === "string" ? stored.aboutTitle : "";
            controls.aboutDescription.value = typeof stored.aboutDescription === "string" ? stored.aboutDescription : "";
            controls.address.value = typeof stored.address === "string" ? stored.address : shop.address || "";
            controls.accentColor.value = initialColor;
            controls.accentHex.value = initialColor;
            controls.hideServers.checked = stored.hideServers === true;
            controls.hideOverallOnline.checked = stored.hideOverallOnline === true;
            controls.tintBackgrounds.checked = stored.tintBackgrounds === true;

            if (savedBackgroundKey) {
                window.sdonateImageStorage.get(savedBackgroundKey).then(image => {
                    if (!image) {
                        throw new Error("Р¤РѕРЅРѕРІРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ РІ С…СЂР°РЅРёР»РёС‰Рµ.");
                    }
                    backgroundImage = image;
                    updatePreview();
                }).catch(error => {
                    imageFeedback.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С„РѕРЅРѕРІРѕРµ С„РѕС‚Рѕ: ${error.message}`;
                    imageFeedback.hidden = false;
                });
            }

            presetColors.forEach(color => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "color-swatch";
                button.style.setProperty("--swatch-color", color);
                button.setAttribute("aria-label", `Р’С‹Р±СЂР°С‚СЊ С†РІРµС‚ ${color}`);
                button.setAttribute("aria-pressed", String(color.toLowerCase() === initialColor.toLowerCase()));
                button.addEventListener("click", () => {
                    controls.accentColor.value = color;
                    controls.accentHex.value = color;
                    updatePreview();
                });
                colorSwatches.append(button);
            });

            function updatePreview() {
                const color = controls.accentColor.value;
                const titleText = controls.title.value.trim();
                const descriptionText = controls.description.value.trim();
                const aboutTitleText = controls.aboutTitle.value.trim();
                const aboutDescriptionText = controls.aboutDescription.value.trim();
                const addressText = controls.address.value.trim();
                const isHidden = controls.hideServers.checked;
                const tintBackgrounds = controls.tintBackgrounds.checked;

                controls.accentHex.value = color;
                preview.style.setProperty("--preview-accent", color);
                preview.classList.toggle("preview-tinted", tintBackgrounds);
                previewBackgroundImage.src = backgroundImage;
                previewBackgroundImage.hidden = !backgroundImage;
                imageRemoveButton.hidden = !backgroundImage;
                if (!backgroundImage) {
                    imageFilename.textContent = "Р¤Р°Р№Р» РЅРµ РІС‹Р±СЂР°РЅ";
                } else if (!imageFilename.dataset.filename) {
                    imageFilename.textContent = "Р¤РѕС‚РѕРіСЂР°С„РёСЏ Р·Р°РіСЂСѓР¶РµРЅР°";
                }
                previewTitle.textContent = titleText;
                previewTitle.hidden = !titleText;
                previewDescription.textContent = descriptionText;
                previewDescription.hidden = !descriptionText;
                previewAboutTitle.textContent = aboutTitleText || `Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ РЅР° ${shop.name}`;
                previewAboutDescription.textContent = aboutDescriptionText || descriptionText || "Р Р°СЃСЃРєР°Р¶Рё РёРіСЂРѕРєР°Рј Рѕ СЃРІРѕС‘Рј СЃРµСЂРІРµСЂРµ.";
                previewAddress.textContent = isHidden ? "" : addressText;
                previewAddress.hidden = isHidden || !addressText;
                previewOnline.hidden = controls.hideOverallOnline.checked;
                colorSwatches.querySelectorAll(".color-swatch").forEach(button => {
                    button.setAttribute(
                        "aria-pressed",
                        String(button.style.getPropertyValue("--swatch-color").toLowerCase() === color.toLowerCase())
                    );
                });
            }

            controls.accentColor.addEventListener("input", updatePreview);
            controls.accentHex.addEventListener("input", () => {
                const color = controls.accentHex.value.trim();
                if (/^#[0-9a-f]{6}$/i.test(color)) {
                    controls.accentColor.value = color;
                    updatePreview();
                }
            });
            customizationForm.addEventListener("input", updatePreview);
            customizationForm.addEventListener("change", updatePreview);
            imageInput.addEventListener("change", async () => {
                imageFeedback.hidden = true;
                const [file] = imageInput.files || [];
                if (!file) {
                    return;
                }
                if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                    imageFeedback.textContent = "Р’С‹Р±РµСЂРё РёР·РѕР±СЂР°Р¶РµРЅРёРµ PNG, JPG РёР»Рё WEBP.";
                    imageFeedback.hidden = false;
                    imageInput.value = "";
                    return;
                }
                if (file.size > 10 * 1024 * 1024) {
                    imageFeedback.textContent = "Р Р°Р·РјРµСЂ РёСЃС…РѕРґРЅРѕРіРѕ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ РЅРµ РґРѕР»Р¶РµРЅ РїСЂРµРІС‹С€Р°С‚СЊ 10 РњР‘.";
                    imageFeedback.hidden = false;
                    imageInput.value = "";
                    return;
                }
                try {
                    backgroundImage = await compressBackgroundImage(file);
                    imageFilename.textContent = file.name;
                    imageFilename.dataset.filename = file.name;
                    imageInput.value = "";
                    updatePreview();
                } catch (error) {
                    imageFeedback.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ РґРѕР±Р°РІРёС‚СЊ С„РѕС‚Рѕ: ${error.message}`;
                    imageFeedback.hidden = false;
                    imageInput.value = "";
                }
            });
            imageRemoveButton.addEventListener("click", () => {
                backgroundImage = "";
                imageInput.value = "";
                delete imageFilename.dataset.filename;
                imageFilename.textContent = "Р¤Р°Р№Р» РЅРµ РІС‹Р±СЂР°РЅ";
                imageFeedback.hidden = true;
                updatePreview();
            });
            updatePreview();

            customizationForm.addEventListener("submit", async event => {
                event.preventDefault();
                customizationFeedback.hidden = true;
                if (!customizationForm.reportValidity()) {
                    return;
                }
                const color = controls.accentHex.value.trim();
                if (!/^#[0-9a-f]{6}$/i.test(color)) {
                    customizationFeedback.textContent = "РЈРєР°Р¶Рё С†РІРµС‚ РІ С„РѕСЂРјР°С‚Рµ HEX, РЅР°РїСЂРёРјРµСЂ #625be2.";
                    customizationFeedback.hidden = false;
                    controls.accentHex.focus();
                    return;
                }
                let backgroundReference = "";
                let newBackgroundKey = null;
                try {
                    if (backgroundImage) {
                        if (window.sdonateImageStorage.keyFromReference(stored.backgroundImage) &&
                            backgroundImage === "") {
                            backgroundReference = stored.backgroundImage;
                        } else {
                            newBackgroundKey = window.sdonateImageStorage.createKey(shopId, "customization-background");
                            await window.sdonateImageStorage.set(newBackgroundKey, backgroundImage);
                            backgroundReference = window.sdonateImageStorage.reference(newBackgroundKey);
                        }
                    }
                    shop.customization = {
                        title: controls.title.value.trim(),
                        description: controls.description.value.trim(),
                        aboutTitle: controls.aboutTitle.value.trim(),
                        aboutDescription: controls.aboutDescription.value.trim(),
                        address: controls.address.value.trim(),
                        backgroundImage: backgroundReference,
                        accentColor: color,
                        hideServers: controls.hideServers.checked,
                        hideOverallOnline: controls.hideOverallOnline.checked,
                        tintBackgrounds: controls.tintBackgrounds.checked
                    };
                    persistShop();
                    const oldBackgroundKey = window.sdonateImageStorage.keyFromReference(stored.backgroundImage);
                    if (oldBackgroundKey && oldBackgroundKey !== newBackgroundKey) {
                        await window.sdonateImageStorage.delete([oldBackgroundKey]);
                    }
                    showToast("РћС„РѕСЂРјР»РµРЅРёРµ РјР°РіР°Р·РёРЅР° СЃРѕС…СЂР°РЅРµРЅРѕ РІ СЌС‚РѕРј Р±СЂР°СѓР·РµСЂРµ.");
                } catch (error) {
                    let message = error.message;
                    if (newBackgroundKey) {
                        try {
                            await window.sdonateImageStorage.delete([newBackgroundKey]);
                        } catch (cleanupError) {
                            message += ` РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‡РёСЃС‚РёС‚СЊ РІСЂРµРјРµРЅРЅРѕРµ С„РѕС‚Рѕ: ${cleanupError.message}`;
                        }
                    }
                    customizationFeedback.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РѕС„РѕСЂРјР»РµРЅРёРµ: ${message}`;
                    customizationFeedback.hidden = false;
                }
            });
        } else if (config.analytics) {
            form.hidden = true;
            document.querySelector("#tool-editor-panel").hidden = true;
            document.querySelector("#tool-records-panel").hidden = true;
            document.querySelector("#analytics-dashboard").hidden = false;
            document.querySelector("#tool-description").textContent =
                "РџСЂРёРјРµСЂ РЅРµРґРµР»СЊРЅРѕР№ СЃС‚Р°С‚РёСЃС‚РёРєРё РјР°РіР°Р·РёРЅР° РІ РІРёРґРµ СЃС‚РѕР»Р±С‡Р°С‚С‹С… РіСЂР°С„РёРєРѕРІ.";
        } else if (!config.plugins) {
            makeField(config.first, 0);
            makeField(config.second, 1);
            renderRecords();
            form.addEventListener("submit", event => {
                event.preventDefault();
                feedback.hidden = true;
                if (!form.reportValidity()) {
                    return;
                }

                const name = form.elements.name.value.trim();
                const detail = form.elements.detail.value.trim();
                if (tool === "links") {
                    try {
                        const url = new URL(detail);
                        if (!["http:", "https:"].includes(url.protocol)) {
                            throw new Error("РСЃРїРѕР»СЊР·СѓР№ СЃСЃС‹Р»РєСѓ, РЅР°С‡РёРЅР°СЋС‰СѓСЋСЃСЏ СЃ http:// РёР»Рё https://.");
                        }
                    } catch (error) {
                        feedback.textContent = error.message || "Р’РІРµРґРё РєРѕСЂСЂРµРєС‚РЅС‹Р№ Р°РґСЂРµСЃ СЃСЃС‹Р»РєРё.";
                        feedback.hidden = false;
                        return;
                    }
                }

                try {
                    const records = Array.isArray(shop.tools[tool]) ? shop.tools[tool] : [];
                    shop.tools[tool] = [...records, {
                        id: globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
                            ? globalThis.crypto.randomUUID()
                            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        name,
                        detail
                    }];
                    persistShop();
                    form.reset();
                    renderRecords();
                    showToast("Р”РµРјРѕ-Р·Р°РїРёСЃСЊ СЃРѕС…СЂР°РЅРµРЅР° РІ СЌС‚РѕРј РјР°РіР°Р·РёРЅРµ.");
                } catch (error) {
                    feedback.textContent = `РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ Р·Р°РїРёСЃСЊ: ${error.message}`;
                    feedback.hidden = false;
                }
            });
        }
    } catch (error) {
        showToast(`РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ СЂР°Р·РґРµР»: ${error.message}`);
        window.setTimeout(() => window.location.replace("./shops.html"), 1800);
    }

    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("sdonate-demo-authenticated");
        window.location.assign("./reg.html?mode=login");
    });
}

})();

