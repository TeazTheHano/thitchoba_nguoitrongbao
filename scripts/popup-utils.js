// KHU VỰC THAY ĐỔI: API popup độc lập với cấu hình riêng của trang.
const PopupUtils = (() => {
    function debounceCallback(callback, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => callback(...args), delay);
        };
    }

    function applyTriggerState(element, shouldOpen, eventName) {
        if (element.tagName === 'DIALOG') {
            if (shouldOpen && !element.open) element.showModal();
            if (!shouldOpen && element.open) element.close();
        }
        element.dispatchEvent(new Event(eventName, { bubbles: true }));
    }

    function observeAndTrigger({
        observeTargetQuery, triggerCondition, triggerSelector,
        triggerEventOn, triggerEventOff, bounceDelay = 200,
        onDelay = 0, offDelay = 0,
        fallbackCondition = 'h4.check:not(:empty)', root = document
    }) {
        const observeTarget = root.querySelector(observeTargetQuery);
        const triggerElement = root.querySelector(triggerSelector);
        if (!observeTarget || !triggerElement) {
            console.error('❌ Missing target or trigger element');
            return;
        }

        const onEvent = triggerEventOn || 'open-dialog';
        const offEvent = triggerEventOff || onEvent;
        let lastState = null; // Chỉ phát event khi điều kiện đổi trạng thái.
        const handleMutation = () => {
            const conditionMet = observeTarget.matches(triggerCondition)
                || !!observeTarget.querySelector(fallbackCondition);
            if (conditionMet === lastState) return;
            lastState = conditionMet;
            const eventName = conditionMet ? onEvent : offEvent;
            const delay = conditionMet ? onDelay : offDelay;
            setTimeout(() => applyTriggerState(triggerElement, conditionMet, eventName), delay);
        };

        const observer = new MutationObserver(debounceCallback(handleMutation, bounceDelay));
        observer.observe(observeTarget, {
            childList: true, subtree: true, characterData: true,
        });
        return observer;
    }

    function removeInactivePopupContainers(root, prefixes, activePrefix, selectorForPrefix) {
        prefixes.forEach((prefix) => {
            if (prefix === activePrefix) return;
            root.querySelectorAll(selectorForPrefix(prefix)).forEach((container) => container.remove());
        });
    }

    function handleUnusedPopups({
        root = document, triggerSelector, prefixes,
        selectorForPrefix = (prefix) => `.${prefix}-container`
    }) {
        root.addEventListener('click', function (event) {
            const label = event.target.closest(triggerSelector);
            if (!label) return;
            const forAttr = label.getAttribute('for');
            if (!forAttr || forAttr.includes('{{')) return;
            // Thứ tự prefixes quyết định ưu tiên khi tên có cùng tiền tố.
            const activePrefix = prefixes.find((prefix) => forAttr.startsWith(prefix));
            if (!activePrefix) return;
            removeInactivePopupContainers(root, prefixes, activePrefix, selectorForPrefix);
        });
    }

    function validatePopupForms(wrapper, onInvalid) {
        for (const form of wrapper.querySelectorAll('form')) {
            if (!form.checkValidity()) {
                onInvalid(form);
                return false;
            }
        }
        return true;
    }

    function copyMatchingFormFields(wrapper, targetForm, targetIdPrefix) {
        targetForm.querySelectorAll('input, select, textarea').forEach((targetInput) => {
            const sourceId = targetInput.id ? targetInput.id.replace(targetIdPrefix, '') : null;
            let sourceInput = sourceId ? wrapper.querySelector(`#${sourceId}`) : null;
            if (!sourceInput && targetInput.name) {
                sourceInput = wrapper.querySelector(`[name="${targetInput.name}"]`);
            }
            if (!sourceInput) return;

            // Select động cần options trước khi nhận value từ popup.
            if (targetInput.tagName === 'SELECT' && sourceInput.tagName === 'SELECT'
                && targetInput.options.length <= 1 && sourceInput.options.length > 1) {
                targetInput.innerHTML = sourceInput.innerHTML;
            }
            targetInput.value = sourceInput.value;
        });
    }

    function createCheckboxPopupController({ root, targets, closeInputIds, translate }) {
        return {
            open(type, message) {
                const target = targets[type];
                if (!target) return false;
                const input = root.getElementById(target.inputOpenId);
                const text = root.querySelector(target.textSelector);
                if (!input || !text) return false;
                const translatedMessage = translate(message);
                if (translatedMessage) text.innerText = translatedMessage;
                input.checked = true;
                return true;
            },
            closeAll() {
                closeInputIds.forEach((id) => {
                    const input = root.getElementById(id);
                    if (input) input.checked = true;
                });
            }
        };
    }

    function mapApiResponseToPopupAction(resData) {
        const rawMessage = resData ? resData.Message : "";
        let type = null;
        if (resData && resData.Success === false) type = 'error';
        else if (resData && resData.Success === true) type = 'success';
        return { type, rawMessage, popupMessage: type === 'error' ? rawMessage || "Err!" : rawMessage };
    }

    function createTemporaryAlertWatch({ win, timeoutMs, onSuppressedAlert, onTimeout }) {
        const originalAlert = win.alert;
        let active = false;
        let timeoutId = null;
        function stop() {
            active = false;
            if (timeoutId) clearTimeout(timeoutId);
            win.alert = originalAlert;
        }
        return {
            start() {
                active = true;
                win.alert = function (message) { onSuppressedAlert(message); };
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => { stop(); onTimeout(); }, timeoutMs);
            },
            stop,
            isActive: () => active,
            showOriginal(message) { originalAlert(message); }
        };
    }

    function installApiResponseObservers({ win, xhrPrototype, isActive, onResponse }) {
        const originalFetch = win.fetch;
        win.fetch = async function (...args) {
            const response = await originalFetch(...args);
            if (isActive()) {
                const clonedResponse = response.clone();
                try { const data = await clonedResponse.json(); onResponse(data); } catch (e) { }
            }
            return response;
        };
        const originalSend = xhrPrototype.send;
        xhrPrototype.send = function (...args) {
            this.addEventListener('load', function () {
                if (isActive()) {
                    try { const data = JSON.parse(this.responseText); onResponse(data); } catch (e) { }
                }
            });
            return originalSend.apply(this, args);
        };
    }

    return {
        observeAndTrigger, handleUnusedPopups, validatePopupForms,
        copyMatchingFormFields, createCheckboxPopupController,
        mapApiResponseToPopupAction, createTemporaryAlertWatch,
        installApiResponseObservers
    };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = PopupUtils;
else globalThis.PopupUtils = PopupUtils;
// KẾT THÚC THAY ĐỔI
