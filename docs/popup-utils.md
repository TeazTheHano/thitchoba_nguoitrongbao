# Popup utilities

<!-- KHU VỰC THAY ĐỔI: Ranh giới mã popup dùng chung và mã riêng của trang. -->
`index.html` nạp `scripts/popup-utils.js` trước `scripts/mainv2.js`. File tiện ích cung cấp `PopupUtils` trong trình duyệt và `module.exports` cho Node.js. Khi dùng ở project khác, mang file tiện ích sang và nạp trước script sử dụng.

Các hàm công khai: `observeAndTrigger`, `handleUnusedPopups`, `validatePopupForms`, `copyMatchingFormFields`, `createCheckboxPopupController`, `mapApiResponseToPopupAction`, `createTemporaryAlertWatch`, `installApiResponseObservers`.

Selector, ID popup, ánh xạ field của `formGetEvoucher` và bản dịch thông báo nằm trong `mainv2.js` vì thuộc riêng trang này. Ví dụ cấu hình container popup ở project khác:

```js
PopupUtils.handleUnusedPopups({
    root: document,
    triggerSelector: '.cta label',
    prefixes: ['popup-b', 'popup-a'] // Đặt tiền tố dài hơn trước khi tên có thể trùng.
});
```

`installApiResponseObservers` thay `fetch` và `XMLHttpRequest.prototype.send` ngay khi gọi. `isActive` chỉ quyết định có xử lý phản hồi hay không. Nạp một lần trên mỗi trang để tránh bọc API nhiều lần.

Chạy test: `node --test tests/api-listener.test.cjs`.
<!-- KẾT THÚC THAY ĐỔI -->
