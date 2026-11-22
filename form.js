/*jslint browser */

(function () {
    "use strict";

    const endpoint = "https://formcarry.com/s/DDjmtOP_Ibv";
    const storageKey = "feedback-form";
    const formHash = "#feedback";
    const fields = ["name", "email", "phone", "organization", "message"];
    const dialog = document.getElementById("feedback-dialog");
    const form = document.getElementById("feedback-form");
    const openButton = document.getElementById("feedback-button");
    const closeButton = document.getElementById("close-button");
    const submitButton = document.getElementById("submit-button");
    const errorBox = document.getElementById("error");
    const resultBox = document.getElementById("result");

    function hideMessages() {
        errorBox.hidden = true;
        resultBox.hidden = true;
    }

    function showMessage(box, text) {
        hideMessages();
        box.textContent = text;
        box.hidden = false;
    }

    function readStorage() {
        try {
            return JSON.parse(window.localStorage.getItem(storageKey)) || {};
        } catch (ignore) {
            return {};
        }
    }

    function saveValues() {
        const values = {};
        fields.forEach(function (name) {
            values[name] = form.elements[name].value;
        });
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(values));
        } catch (ignore) {
            return false;
        }
        return true;
    }

    function clearStorage() {
        try {
            window.localStorage.removeItem(storageKey);
        } catch (ignore) {
            return false;
        }
        return true;
    }

    function restoreValues() {
        const values = readStorage();
        fields.forEach(function (name) {
            if (typeof values[name] === "string") {
                form.elements[name].value = values[name];
            }
        });
    }

    function openDialog() {
        if (!dialog.open) {
            hideMessages();
            dialog.showModal();
        }
    }

    function sendForm() {
        return window.fetch(endpoint, {
            method: "POST",
            headers: {Accept: "application/json"},
            body: new window.FormData(form)
        }).then(function (response) {
            return response.json().then(function (data) {
                return response.ok && data.status !== "error";
            }, function () {
                return response.ok;
            });
        });
    }

    openButton.addEventListener("click", function () {
        openDialog();
        if (window.location.hash !== formHash) {
            window.history.pushState({feedback: true}, "", formHash);
        }
    });

    closeButton.addEventListener("click", function () {
        dialog.close();
    });

    dialog.addEventListener("click", function (event) {
        const rect = dialog.getBoundingClientRect();
        const outside = event.clientX < rect.left
                || event.clientX > rect.right
                || event.clientY < rect.top
                || event.clientY > rect.bottom;
        if (event.target === dialog && outside) {
            dialog.close();
        }
    });

    // Закрытие любым способом (✕, Escape, фон) возвращает URL назад.
    dialog.addEventListener("close", function () {
        if (window.location.hash === formHash) {
            window.history.back();
        }
    });

    // Кнопки «Назад» и «Вперёд» в браузере.
    window.addEventListener("popstate", function () {
        if (window.location.hash === formHash) {
            openDialog();
        } else if (dialog.open) {
            dialog.close();
        }
    });

    form.addEventListener("input", function () {
        hideMessages();
        saveValues();
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        hideMessages();
        submitButton.disabled = true;
        sendForm().then(function (success) {
            submitButton.disabled = false;
            if (success) {
                form.reset();
                clearStorage();
                showMessage(resultBox, "Сообщение отправлено. Спасибо!");
            } else {
                showMessage(errorBox, "Не удалось отправить сообщение. Попробуйте позже.");
            }
        }).catch(function () {
            submitButton.disabled = false;
            showMessage(errorBox, "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.");
        });
    });

    restoreValues();

    // Страница открыта по ссылке с #feedback: создаём запись истории,
    // чтобы закрытие формы не уводило пользователя с сайта.
    if (window.location.hash === formHash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        window.history.pushState({feedback: true}, "", formHash);
        openDialog();
    }
}());
