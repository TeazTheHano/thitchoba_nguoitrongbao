const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// KHU VỰC THAY ĐỔI: Chạy hai script theo thứ tự HTML mà không khởi tạo cả SPA.
const source = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'mainv2.js'), 'utf8');
const popupSource = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'popup-utils.js'), 'utf8');
const listenerStart = source.indexOf('const ApiListener = (function () {');
const listenerEnd = source.indexOf('})();', listenerStart) + '})();'.length;
assert.ok(listenerStart >= 0 && listenerEnd > listenerStart);
const listenerCode = `${popupSource}
const {
    createCheckboxPopupController, mapApiResponseToPopupAction,
    createTemporaryAlertWatch, installApiResponseObservers
} = PopupUtils;
${source.slice(listenerStart, listenerEnd)}
ApiListener`;

function createFixture() {
    const alerts = [];
    const timers = new Map();
    // DOM giả chỉ gồm các checkbox và vùng thông báo mà listener truy cập.
    const elements = new Map([
        ['popup-error-open', { checked: false }],
        ['popup-confirm-open', { checked: false }],
        ['popup-dinning-close', { checked: false }],
        ['popup-privilege-close', { checked: false }],
        ['popup-privilege2-close', { checked: false }]
    ]);
    const messages = new Map([
        ['#popuperror .ui-font-label', { innerText: '' }],
        ['#popupConfirm .ui-font-label', { innerText: '' }]
    ]);
    const document = {
        documentElement: { lang: '' },
        getElementById: (id) => elements.get(id),
        querySelector: (selector) => messages.get(selector)
    };
    let apiData;
    let timerId = 0;
    let cloneCount = 0;
    // Giữ API fetch/XHR gốc để kiểm tra wrapper có chuyển tiếp đúng.
    const originalAlert = (message) => alerts.push(message);
    const window = {
        alert: originalAlert,
        location: { pathname: '/vi/' },
        fetch: async () => ({
            clone: () => {
                cloneCount++;
                return { json: async () => apiData };
            }
        })
    };
    class XMLHttpRequest {
        addEventListener(type, callback) { this[type] = callback; }
        send(...args) { this.sent = args; return 'sent'; }
    }
    const context = {
        window, document, XMLHttpRequest, JSON,
        console: { log() {}, warn() {} },
        setTimeout(callback, delay) {
            const id = ++timerId;
            timers.set(id, { callback, delay });
            return id;
        },
        clearTimeout(id) { timers.delete(id); }
    };
    const listener = vm.runInNewContext(listenerCode, context);
    // Timer chạy bằng tay để không phải đợi 35 giây trong test.
    const fireTimer = (delay) => {
        const entry = [...timers].find(([, timer]) => timer.delay === delay);
        assert.ok(entry, `Missing ${delay}ms timer`);
        timers.delete(entry[0]);
        entry[1].callback();
    };
    return {
        listener, window, elements, messages, alerts, originalAlert, XMLHttpRequest,
        setApiData(value) { apiData = value; },
        fireTimer,
        get cloneCount() { return cloneCount; }
    };
}
// KẾT THÚC THAY ĐỔI

test('fetch chỉ mở popup khi watch đang bật và khôi phục alert sau 100ms', async () => {
    const fx = createFixture();
    fx.setApiData({ Success: true, Message: 'ok' });
    await fx.window.fetch('/api');
    assert.equal(fx.cloneCount, 0);

    fx.listener.watch();
    assert.notEqual(fx.window.alert, fx.originalAlert);
    await fx.window.fetch('/api');
    assert.equal(fx.elements.get('popup-confirm-open').checked, true);
    assert.equal(fx.elements.get('popup-dinning-close').checked, true);
    assert.equal(fx.messages.get('#popupConfirm .ui-font-label').innerText, 'ok');
    fx.fireTimer(100);
    assert.equal(fx.window.alert, fx.originalAlert);
});

test('thiếu popup lỗi thì dùng alert gốc ngay', async () => {
    const fx = createFixture();
    fx.elements.delete('popup-error-open');
    fx.setApiData({ Success: false, Message: 'bad' });
    fx.listener.watch();
    await fx.window.fetch('/api');
    assert.deepEqual(fx.alerts, ['bad']);
    assert.equal(fx.window.alert, fx.originalAlert);
});

test('XHR vẫn đọc phản hồi và timeout vẫn kết thúc watch', () => {
    const fx = createFixture();
    fx.listener.watch();
    const xhr = new fx.XMLHttpRequest();
    xhr.responseText = JSON.stringify({ Success: false, Message: 'bad' });
    assert.equal(xhr.send('payload'), 'sent');
    xhr.load();
    assert.equal(fx.elements.get('popup-error-open').checked, true);
    assert.equal(fx.messages.get('#popuperror .ui-font-label').innerText, 'bad');
    fx.fireTimer(35000);
    assert.equal(fx.window.alert, fx.originalAlert);
});

test('watch lần hai gia hạn timeout và tiếp tục chặn alert', () => {
    const fx = createFixture();
    fx.listener.watch();
    fx.window.alert('ignored');
    fx.listener.watch();
    assert.deepEqual(fx.alerts, []);
    fx.fireTimer(35000);
    assert.equal(fx.window.alert, fx.originalAlert);
});

test('XHR không phải JSON không mở popup và giữ watch đến timeout', () => {
    const fx = createFixture();
    fx.listener.watch();
    const xhr = new fx.XMLHttpRequest();
    xhr.responseText = 'not json';
    xhr.send();
    xhr.load();
    assert.equal(fx.elements.get('popup-error-open').checked, false);
    assert.notEqual(fx.window.alert, fx.originalAlert);
    fx.fireTimer(35000);
    assert.equal(fx.window.alert, fx.originalAlert);
});
