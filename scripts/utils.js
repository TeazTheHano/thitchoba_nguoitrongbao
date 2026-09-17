const analyzeCSSVariables = () => {
    const definitions = {};
    const usage = {};

    function processRules(rules) {
        Array.from(rules).forEach(rule => {

            // Nếu là rule có style (CSSStyleRule)
            if (rule.style) {
                Array.from(rule.style).forEach(prop => {
                    if (prop.startsWith('--')) {
                        definitions[prop] =
                            rule.style.getPropertyValue(prop).trim();
                    }
                });

                const cssText = rule.cssText;
                const varMatches = cssText.match(/var\((--[^,)]+)/g);

                if (varMatches) {
                    varMatches.forEach(match => {
                        const varName = match.replace('var(', '').trim();
                        if (!usage[varName]) usage[varName] = new Set();
                        usage[varName].add(rule.selectorText || "Inline/Unknown");
                    });
                }
            }

            // Nếu là grouping rule (@media, @supports, @layer...)
            if (rule.cssRules) {
                processRules(rule.cssRules);
            }

            // Nếu là @import
            if (rule.styleSheet && rule.styleSheet.cssRules) {
                processRules(rule.styleSheet.cssRules);
            }
        });
    }

    Array.from(document.styleSheets).forEach(sheet => {
        try {
            if (sheet.href && !sheet.href.startsWith(location.origin)) return;
            processRules(sheet.cssRules);
        } catch (e) {
            console.warn("Không thể đọc file CSS:", sheet.href);
        }
    });

    console.group("Báo cáo Biến CSS");
    Object.keys({ ...definitions, ...usage }).forEach(varName => {
        const isDefined = !!definitions[varName];
        const selectors = usage[varName] ? Array.from(usage[varName]) : [];

        console.log(
            `%c${varName}`,
            `color:${isDefined ? '#2ecc71' : '#e74c3c'};font-weight:bold`,
            isDefined ? `(Giá trị: ${definitions[varName]})` : "(CHƯA ĐỊNH NGHĨA!)",
            "\n- Sử dụng tại:", selectors
        );
    });
    console.groupEnd();
};
const analyzeCSSClasses = () => {
    const htmlClasses = new Map();      // className -> Set(elements)
    const cssClasses = new Map();       // className -> Set(selectors)

    /* ===============================
       1. Collect classes from HTML
    =============================== */

    document.querySelectorAll('[class]').forEach(el => {
        el.classList.forEach(cls => {
            if (!htmlClasses.has(cls)) htmlClasses.set(cls, new Set());
            htmlClasses.get(cls).add(el);
        });
    });

    /* ===============================
       2. Collect classes from CSS
    =============================== */

    function extractClassesFromSelector(selector) {
        // bắt các class dạng .abc-123
        const matches = selector.match(/\.([a-zA-Z0-9_-]+)/g);
        if (!matches) return [];

        return matches.map(m => m.slice(1));
    }

    function processRules(rules) {
        Array.from(rules).forEach(rule => {

            if (rule.selectorText) {
                const classes = extractClassesFromSelector(rule.selectorText);

                classes.forEach(cls => {
                    if (!cssClasses.has(cls)) cssClasses.set(cls, new Set());
                    cssClasses.get(cls).add(rule.selectorText);
                });
            }

            if (rule.cssRules) {
                processRules(rule.cssRules);
            }

            if (rule.styleSheet && rule.styleSheet.cssRules) {
                processRules(rule.styleSheet.cssRules);
            }
        });
    }

    Array.from(document.styleSheets).forEach(sheet => {
        try {
            if (sheet.href && !sheet.href.startsWith(location.origin)) return;
            processRules(sheet.cssRules);
        } catch (e) {
            console.warn("Không thể đọc CSS:", sheet.href);
        }
    });

    /* ===============================
       3. Report
    =============================== */

    const allClasses = new Set([
        ...htmlClasses.keys(),
        ...cssClasses.keys()
    ]);

    console.group(`
        Báo cáo Class HTML ↔ CSS \n 
        🟢 Xanh: Class OK (có HTML + có CSS) \n
        🔴 Đỏ: Có trong HTML nhưng không có CSS \n
        🟡 Cam: Có CSS nhưng không dùng (dead CSS) \n
        ⚪ Xám: Edge case \n
        `);

    allClasses.forEach(cls => {
        const inHTML = htmlClasses.has(cls);
        const inCSS = cssClasses.has(cls);

        let color = "#95a5a6";
        if (inHTML && inCSS) color = "#2ecc71";   // OK
        else if (inHTML && !inCSS) color = "#e74c3c"; // HTML không có CSS
        else if (!inHTML && inCSS) color = "#f39c12"; // CSS không được dùng

        console.groupCollapsed(
            `%c.${cls}`,
            `color:${color};font-weight:bold`
        );

        console.log("Có trong HTML:", inHTML);
        console.log("Có trong CSS:", inCSS);

        if (inHTML) {
            console.log("Số element dùng:", htmlClasses.get(cls).size);
        }

        if (inCSS) {
            console.log("Được define tại selectors:");
            console.log(Array.from(cssClasses.get(cls)));
        }

        console.groupEnd();
    });

    console.groupEnd();
};