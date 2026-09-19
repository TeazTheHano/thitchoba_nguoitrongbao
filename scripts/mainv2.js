function trackMousePosition(elementQuery) {
    const trackElement = document.querySelector(elementQuery);
    if (!trackElement) return;

    const reset = () => {
        trackElement.style.setProperty('--mouse-x', '50%');
        trackElement.style.setProperty('--mouse-y', '50%');

        const bg = trackElement.querySelector('.bg-slides');
        if (bg) {
            bg.style.transform = 'translate(0, 0) scale(1.05)';
        }
    };

    trackElement.addEventListener('mousemove', (event) => {
        const rect = trackElement.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const normalizedX = (x / rect.width) * 100;
        const normalizedY = (y / rect.height) * 100;

        trackElement.style.setProperty('--mouse-x', `${normalizedX}%`);
        trackElement.style.setProperty('--mouse-y', `${normalizedY}%`);

        // Parallax (viewport-based cho cảm giác tự nhiên)
        const parallaxOffsetX = (event.clientX - window.innerWidth / 2) / 50;
        const parallaxOffsetY = (event.clientY - window.innerHeight / 2) / 50;

        const bg = trackElement.querySelector('.bg-slides');
        if (bg) {
            bg.style.transform =
                `translate(${parallaxOffsetX}px, ${parallaxOffsetY}px) scale(1.05)`;
        }

        // Debug text (optional)
        const text = trackElement.querySelector('.tech-coords-value');
        if (text) {
            text.innerHTML =
                `X: ${normalizedX.toFixed(2)}% | Y: ${normalizedY.toFixed(2)}%`;
        }
    });

    // 👇 RESET KHI RỜI CHUỘT
    trackElement.addEventListener('mouseleave', reset);

    // optional: reset khi vừa load
    reset();
}

function autoNextSelection({
    container,
    itemSelector,
    interval = 5000,
    type = 'radio' // 'radio' | 'select'
}) {
    const root = document.querySelector(container);
    if (!root) return;

    let currentIndex = 0;
    let timerId;

    function getItems() {
        return document.querySelectorAll(itemSelector);
    }

    function autoSelect() {
        const items = getItems();
        if (!items.length) return;

        const nextIndex = (currentIndex + 1) % items.length;

        if (type === 'radio') {
            items[nextIndex].checked = true;
        } else if (type === 'select') {
            root.selectedIndex = nextIndex;
        }

        currentIndex = nextIndex;
    }

    function restartTimer() {
        clearInterval(timerId);
        timerId = setInterval(autoSelect, interval);
    }

    restartTimer();

    document.addEventListener('change', (e) => {
        if (e.target.matches(itemSelector)) {
            restartTimer();
        }
    });
}


function headerScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        header.classList.toggle('scrolled', currentScrollY > 100);

        if (currentScrollY > 100) {
            if (currentScrollY > lastScrollY) {
                // Scrolling down -> hide top bar
                header.classList.add('hide-top-bar');
            } else {
                // Scrolling up -> show top bar
                header.classList.remove('hide-top-bar');
            }
        } else {
            // At top -> show top bar
            header.classList.remove('hide-top-bar');
        }

        lastScrollY = currentScrollY;
    });

    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        const mediaQuery = window.matchMedia('(min-width: 769px)');
        const handleScreenChange = (e) => {
            if (e.matches && menuToggle.checked) {
                menuToggle.checked = false;
            }
        };
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleScreenChange);
        } else {
            mediaQuery.addListener(handleScreenChange);
        }
        // Run check once immediately on load to handle pre-checked HTML on desktop
        handleScreenChange(mediaQuery);
    }
}


function eventQuarterText(cardsSelector) {
    const eventlist = document.querySelectorAll(cardsSelector);

    function quarterText(event, startDateTime) {
        if (!startDateTime) return;

        const data = startDateTime;
        const quater = data.split(' ')[1];

        const target = event.querySelector('.event_content_cards_mark')
        if (target) target.innerHTML = quater
    }

    eventlist.forEach(event => {
        const startDateTimeUtc = event.querySelector('.startDateTimeUtc');
        const endDateTimeUtc = event.querySelector('.endDateTimeUtc');
        const dateP = event.querySelector('.card-date');
        const timeP = event.querySelector('.card-time');
        const eventSchedules = event.querySelector('.event-schedule');

        if (!startDateTimeUtc || !endDateTimeUtc || !dateP || !timeP) return;

        try {
            const startDateTime = new Date(startDateTimeUtc.innerText);
            const endDateTime = new Date(endDateTimeUtc.innerText);

            const optionsDate = { year: 'numeric', month: 'short', day: 'numeric' };
            const optionsTime = { hour: '2-digit', minute: '2-digit' };


            let startdateText = startDateTime.toLocaleDateString('en-GB', optionsDate).toUpperCase();
            let enddateText = endDateTime.toLocaleDateString('en-GB', optionsDate).toUpperCase();
            let timeText = `${startDateTime.toLocaleTimeString('en-GB', optionsTime)} - ${endDateTime.toLocaleTimeString('en-GB', optionsTime)}`;

            dateP.innerText = startdateText === enddateText ? startdateText : `${startdateText} - ${enddateText}`;
            timeP.innerText = timeText;

            quarterText(event, startdateText);

        } catch (error) {
            console.error(`Error in eventQuarterText: ${error}`);
        }
    });
}

function sliderControl({
    listElementQuery,
    childElement,
    nextBtnQuery,
    prevBtnQuery,
    filtersQuery = null
}) {
    const slider = document.querySelector(listElementQuery)
    if (!slider) return

    const nextBtn = document.querySelector(nextBtnQuery)
    const prevBtn = document.querySelector(prevBtnQuery)

    if (!nextBtn || !prevBtn) return

    function getVisibleItems() {
        return [...slider.querySelectorAll(childElement)]
            .filter(el => getComputedStyle(el).display !== 'none')
    }

    function getStep() {
        const visible = getVisibleItems()
        if (visible.length < 2) return 0

        return visible[1].offsetLeft - visible[0].offsetLeft
    }

    function scrollNext(direction = 1) {
        const step = getStep()
        if (!step) return

        slider.scrollBy({
            left: step * direction,
            behavior: 'smooth'
        })
    }

    nextBtn.addEventListener('click', () => scrollNext(1))
    prevBtn.addEventListener('click', () => scrollNext(-1))

    slider.addEventListener('wheel', event => {
        const step = getStep()
        if (!step) return

        const isDown = event.deltaY > 0
        const isUp = event.deltaY < 0

        const isAtStart = slider.scrollLeft <= 0
        const isAtEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 1

        if ((isUp && isAtStart) || (isDown && isAtEnd)) {
            return
        }

        event.preventDefault()
        scrollNext(isDown ? 1 : -1)

    }, { passive: false })

    // ✅ Reset scroll khi filter thay đổi
    if (filtersQuery) {
        const filters = document.querySelectorAll(filtersQuery)

        filters.forEach(filter => {
            filter.addEventListener('change', () => {
                requestAnimationFrame(() => {
                    slider.scrollTo({ left: 0, behavior: 'smooth' })
                })
            })
        })
    }
}

function autoSlide({
    listElementQuery,
    itemQuery,
    delayTime = 3000
}) {
    const slider = document.querySelector(listElementQuery)
    if (!slider) return

    const items = slider.querySelectorAll(itemQuery)
    if (!items.length) return

    const item = items[0]
    const gap = parseFloat(getComputedStyle(slider).columnGap || 0)
    const step = item.offsetWidth + gap

    let currentIndex = 0
    let timerId

    function getVisibleCount() {
        return Math.round(slider.clientWidth / step)
    }

    function getMaxIndex() {
        return items.length - getVisibleCount()
    }

    function slideNext() {
        const maxIndex = getMaxIndex()

        if (currentIndex >= maxIndex) {
            currentIndex = 0
        } else {
            currentIndex++
        }

        slider.scrollTo({
            left: currentIndex * step,
            behavior: 'smooth'
        })
    }

    function start() {
        timerId = setInterval(slideNext, delayTime)
    }

    function stop() {
        clearInterval(timerId)
    }

    start()

    slider.addEventListener('mouseenter', stop)
    slider.addEventListener('mouseleave', start)

    window.addEventListener('resize', () => {
        slider.scrollTo({ left: currentIndex * step })
    })
}

function PagingContent({
    containerQuery,
    itemsQuery,
    paginationContainerQuery,
    itemsPerPage = 6,
    filtersQuery = null,
    autoNextTime = 0,
}) {

    const container = document.querySelector(containerQuery)
    const paginationContainer = document.querySelector(paginationContainerQuery)

    if (!container || !paginationContainer) return

    const allItems = Array.from(container.querySelectorAll(itemsQuery))
    if (!allItems.length) return

    let filteredItems = [...allItems]
    let currentPage = 1

    function renderPage() {

        const totalPages = Math.ceil(filteredItems.length / itemsPerPage)

        const start = (currentPage - 1) * itemsPerPage
        const end = start + itemsPerPage

        // Ẩn toàn bộ
        allItems.forEach(item => item.classList.add('d-none'))

        // Hiển thị items của page hiện tại
        filteredItems.slice(start, end).forEach(item => {
            item.classList.remove('d-none')
        })

        // Render pagination
        paginationContainer.innerHTML = ''

        if (totalPages === 0) return
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button')
            btn.innerText = i

            btn.classList.add('button-chip', 'button-rounded')
            if (i === currentPage) {
                btn.classList.add('active')
            }
            btn.style.lineHeight = '1'
            btn.addEventListener('click', () => {
                currentPage = i
                renderPage()
            })
            paginationContainer.appendChild(btn)
        }
    }

    // AUTO NEXT
    function autoNext() {
        setTimeout(() => {
            const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
            if (totalPages === 0) return
            if (currentPage < totalPages) {
                currentPage++
            } else {
                currentPage = 1
            }

            renderPage()
            autoNext()
        }, autoNextTime)
    }

    // FILTER
    if (filtersQuery) {
        const filters = document.querySelectorAll(filtersQuery)

        filters.forEach(filter => {
            filter.addEventListener('change', (e) => {
                const value = e.target.value?.trim().toLowerCase()
                if (!value || value === 'all') {
                    filteredItems = [...allItems]
                } else {
                    filteredItems = allItems.filter(item => {
                        const cate = (item.getAttribute('course-cate') || '')
                            .trim()
                            .toLowerCase()
                        return cate.includes(value)
                    })
                }
                currentPage = 1
                renderPage()
            })

        })
    }

    renderPage()

    if (autoNextTime > 0) {
        autoNext()
    }

}

function formFillFromHtmlContent({
    formQuery,
    formTargetQueryIds = [],
    contentQueryIds = [],
}) {
    // 1. Validate input
    if (formTargetQueryIds.length !== contentQueryIds.length) {
        throw new Error(
            `Target (${formTargetQueryIds.length}) and content (${contentQueryIds.length}) must have the same length`
        )
    }

    // 2. Get form
    const form = document.querySelector(formQuery)

    if (!form) {
        throw new Error(`Cannot find form with query: ${formQuery}`)
    }

    // 3. Map elements
    const targets = formTargetQueryIds.map(q => form.querySelector(q))
    const contents = contentQueryIds.map(q => document.querySelector(q))

    // 4. Fill
    targets.forEach((target, index) => {
        const content = contents[index]
        const targetQuery = formTargetQueryIds[index]
        const contentQuery = contentQueryIds[index]

        // Debug rõ ràng từng cái
        if (!target) {
            console.error('❌ Missing target:', targetQuery)
            throw new Error(`Cannot find target with query: ${targetQuery}`)
        }

        if (!content) {
            console.error('❌ Missing content:', contentQuery)
            throw new Error(`Cannot find content with query: ${contentQuery}`)
        }

        // Lấy text an toàn
        const value = content.textContent?.trim() || ''

        // Set value
        target.value = value
    })
}

function observeAndTrigger({
    observeTargetQuery,
    triggerCondition,
    triggerSelector,
    triggerEventOn,
    triggerEventOff,
    bounceDelay = 200,
    onDelay = 0,
    offDelay = 0
}) {
    const observeTarget = document.querySelector(observeTargetQuery);
    const triggerElement = document.querySelector(triggerSelector);

    if (!observeTarget || !triggerElement) {
        console.error('❌ Missing target or trigger element');
        return;
    }

    const onEvent = triggerEventOn || 'open-dialog';
    const offEvent = triggerEventOff || onEvent;

    function debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    }

    let lastState = null; // 🔥 chống spam event

    const handleMutation = () => {
        // 🔥 FIX: dùng querySelector thay vì matches
        const conditionMet = observeTarget.matches(triggerCondition)
            || !!observeTarget.querySelector('h4.check:not(:empty)');

        // tránh spam event
        if (conditionMet === lastState) return;
        lastState = conditionMet;

        if (conditionMet) {
            setTimeout(() => {
                if (triggerElement.tagName === 'DIALOG' && !triggerElement.open) {
                    triggerElement.showModal();
                }
                triggerElement.dispatchEvent(new Event(onEvent, { bubbles: true }));
            }, onDelay);
        } else {
            setTimeout(() => {
                if (triggerElement.tagName === 'DIALOG' && triggerElement.open) {
                    triggerElement.close();
                }
                triggerElement.dispatchEvent(new Event(offEvent, { bubbles: true }));
            }, offDelay);
        }
    };

    const debouncedHandler = debounce(handleMutation, bounceDelay);

    const observer = new MutationObserver(debouncedHandler);

    observer.observe(observeTarget, {
        childList: true,
        subtree: true,
        characterData: true,
    });

    return observer;
}


function initLogoMarquees() {
    const slider = document.getElementById('section-intro2-logoSlider');
    if (!slider) return;
    const rows = slider.querySelectorAll('.logo-row');
    rows.forEach(row => {
        if (row.querySelector('.logo-track')) return;
        const originalSvg = row.querySelector('svg');
        if (!originalSvg) return;
        const track = document.createElement('div');
        track.className = 'logo-track';
        const clonesCount = 20; // 10 per set * 2 sets
        for (let i = 0; i < clonesCount; i++) {
            track.appendChild(originalSvg.cloneNode(true));
        }
        originalSvg.remove();
        row.appendChild(track);
    });
}

// KHU VỰC THAY ĐỔI: Khởi tạo marquee độc lập sau khi component logo được inject.
async function initLogoLoop(section) {
    if (!section || section.dataset.logoLoopReady === 'true') return;

    const sourceImages = Array.from(section.querySelectorAll(':scope > img'));
    if (!sourceImages.length) return;

    await Promise.all(sourceImages.map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
        });
    }));

    const group = document.createElement('div');
    group.className = 'logo-loop__group';
    sourceImages.forEach((image) => group.appendChild(image));
    section.appendChild(group);

    // Clone đến khi một dải đủ phủ viewport, rồi nhân đôi dải để loop khít.
    const minimumWidth = Math.max(section.clientWidth, window.innerWidth);
    let copySets = 0;
    while (group.scrollWidth < minimumWidth && copySets < 30) {
        sourceImages.forEach((image) => group.appendChild(image.cloneNode(true)));
        copySets += 1;
    }

    const track = document.createElement('div');
    track.className = 'logo-loop__track';
    track.append(group, group.cloneNode(true));
    track.lastElementChild.setAttribute('aria-hidden', 'true');
    section.appendChild(track);
    section.dataset.logoLoopReady = 'true';
}

function initLogoLoops() {
    document.querySelectorAll('.logo-loop').forEach(initLogoLoop);
}

function observeLogoLoops() {
    initLogoLoops();

    new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;

                // Component có thể được inject sau lần render đầu hoặc khi đổi route SPA.
                if (node.matches('.logo-loop')) initLogoLoop(node);
                node.querySelectorAll?.('.logo-loop').forEach(initLogoLoop);
            });
        });
    }).observe(document.body, {
        childList: true,
        subtree: true,
    });
}
// KẾT THÚC THAY ĐỔI

// CALLING FUNCTIONs
headerScroll();

// function landingPageCall() {
//     sliderControl({
//         listElementQuery: '#Course_content_cards',
//         childElement: '.card',
//         nextBtnQuery: '#Course .cards-slider-controller-next',
//         prevBtnQuery: '#Course .cards-slider-controller-prev',
//         filtersQuery: 'input[name="Course_content_cate"]'
//     });
//     sliderControl({
//         listElementQuery: '#News_content_cards',
//         childElement: '.card',
//         nextBtnQuery: '#News .cards-slider-controller-next',
//         prevBtnQuery: '#News .cards-slider-controller-prev',
//         filtersQuery: 'input[name="News_content_cate"]'
//     });

//     trackMousePosition('#Programme')
//     trackMousePosition('#Contact')
//     trackMousePosition('#hero')
//     eventQuarterText('#Event_content_cards .card');
//     autoNextSelection({
//         container: '#hero',
//         itemSelector: 'input[name="hero"]',
//         interval: 5000,
//         type: 'radio'
//     });

//     autoSlide({
//         listElementQuery: '#Feedback_content_cards',
//         itemQuery: '.card',
//         delayTime: 3000
//     });
//     PagingContent({
//         containerQuery: '#Partner_content_cards',
//         itemsQuery: '.card',
//         paginationContainerQuery: '#Partner_pagination',
//         itemsPerPage: 10,
//         autoNextTime: 5000,
//     });
//     initIntro2Slider();
//     initIntro2Slider('section-privile-intro2', [
//         'section-privile-intro2-privilege-selected-1',
//         'section-privile-intro2-privilege-selected-2'
//     ]);
//     initLogoMarquees();
// }

// function courseListPageCall() {
//     PagingContent({
//         containerQuery: '#Course_content_cards',
//         itemsQuery: '.card',
//         paginationContainerQuery: '#Course_pagination',
//         itemsPerPage: 9,
//         filtersQuery: 'input[name="Course_content_cate"]'
//     })
//     sliderControl({
//         listElementQuery: '#Related_content_cards',
//         childElement: '.card',
//         nextBtnQuery: '#Related .cards-slider-controller-next',
//         prevBtnQuery: '#Related .cards-slider-controller-prev'
//     });
// }

// function eventListPageCall() {
//     PagingContent({
//         containerQuery: '#Course_content_cards',
//         itemsQuery: '.card',
//         paginationContainerQuery: '#Course_pagination',
//         itemsPerPage: 12,
//         filtersQuery: 'input[name="Course_content_cate"]'
//     })
//     eventQuarterText('#Course_content_cards .card');
//     formFillFromHtmlContent({
//         formQuery: '[id="65218bb1-57eb-dc54-4d0d-00cf5ac21e86"].after-login-show',

//         formTargetQueryIds: [
//             'input#fullName',
//             'input#mobile',
//             'input#email',
//         ],

//         contentQueryIds: [
//             '#CourseDetailDescription #AfterLogin span.displayName',
//             '#CourseDetailDescription #AfterLogin span.displayMobile',
//             '#CourseDetailDescription #AfterLogin span.displayEmail',
//         ]
//     })
//     sliderControl({
//         listElementQuery: '#Course_content_cards',
//         childElement: '.card',
//         nextBtnQuery: '#Related .cards-slider-controller-next',
//         prevBtnQuery: '#Related .cards-slider-controller-prev'
//     });
//     observeAndTrigger({
//         observeTargetQuery: '#EventSignUp',
//         triggerCondition: 'h4.check:not(:empty)',
//         triggerSelector: '#EventSignUp',
//         triggerEventOn: 'notification-show',
//         triggerEventOff: 'notification-hide',
//         offDelay: 3000
//     });

//     if (window.location.pathname.includes('vc-101-hieu-ve-venture-capital-tong-quan-cho-founder')) {
//         disableEventFormWhenReady();
//         console.log('disableEventForm');

//     }
// }

// function disableEventFormWhenReady() {
//     const observer = new MutationObserver(() => {
//         let form = document.querySelector('[id="65218bb1-57eb-dc54-4d0d-00cf5ac21e86"].after-login-show');

//         if (form) {
//             let button = form.querySelector('button[type="submit"]');

//             if (button) {
//                 button.disabled = true;
//                 button.style.cursor = 'not-allowed';
//                 button.title = 'Form đã đóng đăng ký';
//                 console.log('✅ Form disabled via observer');
//                 observer.disconnect(); // stop luôn
//             }
//         }
//     });

//     observer.observe(document.body, {
//         childList: true,
//         subtree: true,
//     });
// }

// switch (true) {
//     case window.location.pathname.includes('/pages/danh-sach-khoa-hoc') ||
//         window.location.pathname.includes('/danh-sach-khoa-hoc') ||
//         window.location.pathname.includes('/pages/danh-sach-bai-viet/') ||
//         window.location.pathname.includes('/danh-sach-bai-viet/') ||
//         window.location.pathname.includes('/pages/bai-viet/') ||
//         window.location.pathname.includes('/bai-viet/') ||
//         window.location.pathname.includes('/pages/san-pham/') ||
//         window.location.pathname.includes('/san-pham/')
//         :
//         courseListPageCall();
//         break;

//     case window.location.pathname.includes('/pages/danh-sach-su-kien/') ||
//         window.location.pathname.includes('/danh-sach-su-kien') ||
//         window.location.pathname.includes('/pages/su-kien') ||
//         window.location.pathname.includes('/su-kien')
//         :
//         eventListPageCall();
//         break;
//     default:
//         landingPageCall();
//         break;
// }

function runWhenExists(elementId, callback) {
    const check = () => {
        const el = document.getElementById(elementId);
        if (el) {
            callback(el);
            return true;
        }
        return false;
    };

    if (check()) return;

    const startObserver = () => {
        if (check()) return;
        const observer = new MutationObserver((mutations, obs) => {
            if (check()) {
                obs.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    if (document.body) {
        startObserver();
    } else {
        window.addEventListener('DOMContentLoaded', startObserver);
    }
}

function fixStyle(style) {
    if (!style) return;
    const fixed = style.textContent
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');

    if (fixed !== style.textContent) {
        style.textContent = fixed;
    }
}

function initFixStyle() {
    document.querySelectorAll('style').forEach(fixStyle);

    new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.target.tagName === 'STYLE') {
                fixStyle(mutation.target);
            }
            if (mutation.type === 'characterData') {
                const parent = mutation.target.parentNode;
                if (parent && parent.tagName === 'STYLE') {
                    fixStyle(parent);
                }
            }
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element
                    if (node.tagName === 'STYLE') {
                        fixStyle(node);
                    }
                    node.querySelectorAll?.('style').forEach(fixStyle);
                } else if (node.nodeType === 3) { // Text Node
                    if (node.parentNode && node.parentNode.tagName === 'STYLE') {
                        fixStyle(node.parentNode);
                    }
                }
            });
        });
    }).observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

// KHU VỰC THAY ĐỔI: Đọc marker <strong> đang bị WYSIWYG escape thành text trong thẻ p.
function findNearestGotoLink(markerParagraph) {
    return Array.from(document.querySelectorAll('a[goto]')).find((link) => (
        markerParagraph.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING
    ));
}

function findAndInsert(root = document) {
    if (!root) return;

    const paragraphs = [];

    if (root instanceof Element && root.matches('p')) {
        paragraphs.push(root);
    }
    paragraphs.push(...root.querySelectorAll('p'));

    paragraphs.forEach((paragraph) => {
        const rawHtml = paragraph.textContent.trim();
        if (!rawHtml.includes('<strong')) return;

        // DOMParser chuyển chuỗi escaped thành DOM tạm để đọc attr hidegoto an toàn.
        const parsed = new DOMParser().parseFromString(rawHtml, 'text/html');
        const marker = parsed.querySelector('strong[hidegoto]');
        if (!marker) return;

        paragraph.classList.add('ui-d-none');

        const hidegotoValue = marker.getAttribute('hidegoto');
        const gotoLink = findNearestGotoLink(paragraph);
        if (gotoLink && hidegotoValue) {
            // Gán nguyên văn giá trị marker, không encode hoặc tự thêm prefix.
            gotoLink.setAttribute('href', hidegotoValue);
        }

        // Tránh log lặp khi MutationObserver quét lại cùng một element.
        if (paragraph.dataset.hidegotoLogged === 'true') return;
        console.log('hidegoto:', hidegotoValue);
        paragraph.dataset.hidegotoLogged = 'true';
    });
}

function observeHideGotoMarkers() {
    const startObserver = () => {
        findAndInsert();
        if (document.documentElement.dataset.hidegotoObserverReady === 'true') return;

        new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    findAndInsert();
                    return;
                }

                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        findAndInsert(node);
                        if (node.matches('a[goto]')) findAndInsert();
                    } else if (node.nodeType === Node.TEXT_NODE) {
                        findAndInsert(node.parentElement);
                    }
                });
            });
        }).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['goto'],
            childList: true,
            subtree: true,
        });

        document.documentElement.dataset.hidegotoObserverReady = 'true';
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver, { once: true });
    } else {
        startObserver();
    }
}
// KẾT THÚC THAY ĐỔI

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFixStyle);
} else {
    initFixStyle();
}

const afterLoad = () => {

    if (typeof observeHideGotoMarkers === 'function') {
        observeHideGotoMarkers();
    }

    if (typeof observeLogoLoops === 'function') {
        observeLogoLoops();
    }

    if (typeof initLogoMarquees === 'function') {
        runWhenExists('section-intro2-logoSlider', () => {
            initLogoMarquees();
        });
    }

    if (typeof handleUnusedPopups === 'function') {
        handleUnusedPopups();
    }

    if (typeof initPopupFormSync === 'function') {
        initPopupFormSync();
    }

    if (typeof initLiveFormSync === 'function') {
        initLiveFormSync();
    }
}

afterLoad();

function handleUnusedPopups() {
    document.addEventListener('click', function (e) {
        const label = e.target.closest('#section-dinning-detail1-content .cta label');
        if (!label) return;

        const forAttr = label.getAttribute('for');
        if (!forAttr || forAttr.includes('{{')) return;

        const prefixes = ['popup-dinning', 'popup-privilege2', 'popup-privilege'];
        let activePrefix = null;

        for (const prefix of prefixes) {
            if (forAttr.startsWith(prefix)) {
                activePrefix = prefix;
                break;
            }
        }

        if (activePrefix) {
            prefixes.forEach(prefix => {
                if (prefix !== activePrefix) {
                    const containers = document.querySelectorAll(`.${prefix}-container`);
                    containers.forEach(container => {
                        container.remove();
                    });
                }
            });
        }
    });
}

function initPopupFormSync() {
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('#popupDinning form button, #popupPrivilege form button, #popupPrivilege2 form button, #popupPrivilegeOpenPlus form button');
        if (!btn) return;

        const wrapper = btn.closest('#popupDinning, #popupPrivilege, #popupPrivilege2, #popupPrivilegeOpenPlus');
        if (!wrapper) return;

        const forms = wrapper.querySelectorAll('form');
        let isValid = true;

        for (const form of forms) {
            if (!form.checkValidity()) {
                isValid = false;

                // Nếu là form nhiều bước, chuyển về bước bị lỗi trước khi hiển thị popup lỗi
                const type = form.getAttribute('type');
                if (type) {
                    const stepRadio = document.getElementById(`privilege2-step-${type}`);
                    if (stepRadio) stepRadio.checked = true;

                    setTimeout(() => form.reportValidity(), 50);
                } else {
                    form.reportValidity();
                }
                break;
            }
        }

        if (isValid) {
            e.preventDefault();
            // Sync lần cuối rồi log + submit
            syncPopupFieldsToTarget(wrapper);
            logFormGetEvoucher();
            submitFormGetEvoucher();
        }
    });
}

// Live sync: mỗi khi user nhập/chọn trong popup → cập nhật ngay vào formGetEvoucher
function initLiveFormSync() {
    const popupSelectors = '#popupDinning, #popupPrivilege, #popupPrivilege2, #popupPrivilegeOpenPlus';

    document.addEventListener('input', function (e) {
        const wrapper = e.target.closest(popupSelectors);
        if (!wrapper) return;
        syncPopupFieldsToTarget(wrapper);
    });

    document.addEventListener('change', function (e) {
        const wrapper = e.target.closest(popupSelectors);
        if (!wrapper) return;
        syncPopupFieldsToTarget(wrapper);
    });
}

// Đồng bộ giá trị từ popup wrapper → formGetEvoucher
function syncPopupFieldsToTarget(wrapper) {
    const targetForm = document.getElementById('formGetEvoucher');
    if (!targetForm) {
        console.warn('Không tìm thấy formGetEvoucher để đồng bộ dữ liệu');
        return;
    }

    const targetInputs = targetForm.querySelectorAll('input, select, textarea');

    targetInputs.forEach(targetInput => {
        const id = targetInput.id;
        const name = targetInput.name;

        let sourceInput = null;

        const sourceId = id ? id.replace('formGetEvoucher_', '') : null;

        if (sourceId) {
            sourceInput = wrapper.querySelector(`#${sourceId}`);
        }

        if (!sourceInput && name) {
            sourceInput = wrapper.querySelector(`[name="${name}"]`);
        }

        if (sourceInput) {
            // Nếu là <select> và target đang rỗng options → copy options trước rồi mới set value
            // (đặc biệt quan trọng với #addresses vì options render động từ server)
            if (
                targetInput.tagName === 'SELECT' &&
                sourceInput.tagName === 'SELECT' &&
                targetInput.options.length <= 1 &&
                sourceInput.options.length > 1
            ) {
                targetInput.innerHTML = sourceInput.innerHTML;
            }
            targetInput.value = sourceInput.value;
        }
    });

    //   Mapping đặc biệt: cardLast6Digits từ popup → startPin trong formGetEvoucher
    const cardLast6Input = wrapper.querySelector('[name="cardLast6Digits"]');
    if (cardLast6Input) {
        const targetStartPin = targetForm.querySelector('[name="startPin"]');
        if (targetStartPin) {
            targetStartPin.value = cardLast6Input.value || "54464099";
        }
    }

    // total: dùng giá trị popup, nếu không có thì dùng mặc định
    const targetTotal = targetForm.querySelector('[name="total"]');
    if (targetTotal) {
        const sourceTotal = wrapper.querySelector('[name="total"]');

        targetTotal.value = sourceTotal?.value?.trim() || "0";
    }

    // Xử lý field riêng của privilege-popup2: bookingTimeUob + serviceType → ghi vào note
    const serviceTypeInput = wrapper.querySelector('[name="serviceType"]');
    if (serviceTypeInput) {
        const targetNote = targetForm.querySelector('[name="note"]');
        const sourceNote = wrapper.querySelector('[name="note"]');
        const noteVal = sourceNote ? sourceNote.value.trim() : '';

        // KHU VỰC THAY ĐỔI: Thu thập các dòng extra để append vào note
        const extraLines = [];

        // 1. Thời gian sử dụng (bookingTimeUob)
        const bookingTimeInput = wrapper.querySelector('[name="bookingTimeUob"]');
        if (bookingTimeInput && bookingTimeInput.value) {
            let bookingLabel = 'Thời gian sử dụng';
            const bookingLabelEl = wrapper.querySelector(`label[for="${bookingTimeInput.id}"]`);
            if (bookingLabelEl) bookingLabel = bookingLabelEl.innerText.trim();
            extraLines.push(`${bookingLabel}: ${bookingTimeInput.value}`);
        }

        // 2. Loại dịch vụ (serviceType)
        const selectedOption = serviceTypeInput.options[serviceTypeInput.selectedIndex];
        const valueText = selectedOption ? selectedOption.text : '';
        if (valueText && serviceTypeInput.value) {
            let labelText = 'Loại dịch vụ';
            const labelEl = wrapper.querySelector(`label[for="${serviceTypeInput.id}"]`);
            if (labelEl) labelText = labelEl.innerText.trim();
            extraLines.push(`${labelText}: ${valueText}`);
        }
        // KẾT THÚC THAY ĐỔI

        if (targetNote && extraLines.length > 0) {
            const appendText = extraLines.join(' | ');
            targetNote.value = noteVal ? `${noteVal} | ${appendText}` : appendText;
        }
    }
}

// Log toàn bộ data của formGetEvoucher ra console
function logFormGetEvoucher() {
    const targetForm = document.getElementById('formGetEvoucher');
    if (!targetForm) return;

    const data = {};
    targetForm.querySelectorAll('input, select, textarea').forEach(el => {
        const key = el.id || el.name || el.type;
        data[key] = el.value;
    });

    console.log('[formGetEvoucher] data:', data);
}

// Nhấn button submit trong formGetEvoucher
function submitFormGetEvoucher() {
    const targetForm = document.getElementById('formGetEvoucher');
    if (!targetForm) return;
    ApiListener.watch();
    const processBtn = targetForm.querySelector('button');
    if (processBtn) {
        processBtn.click();
    } else {
        targetForm.submit();
    }
}

// ĐOẠN CODE ĐỘC LẬP - QUẢN LÝ LẮNG NGHE API, ĐA NGÔN NGỮ THEO URL, CHẶN ALERT & FALLBACK DỰ PHÒNG
const ApiListener = (function () {
    // ==================== CONFIG THEO HTML CỦA BẠN ====================
    const CONFIG = {
        // Cấu hình cho Popup LỖI (Success: false)
        error: {
            inputOpenId: 'popup-error-open',
            textSelector: '#popuperror .ui-font-label'
        },
        // Cấu hình cho Popup THÀNH CÔNG (Success: true)
        success: {
            inputOpenId: 'popup-confirm-open',
            textSelector: '#popupConfirm .ui-font-label'
        }
    };

    // ==================== BẢN DỊCH ĐA NGÔN NGỮ (VI/EN) ====================
    const DICTIONARY = {
        "Đầu số thẻ không hợp lệ!": {
            vi: "Đầu số thẻ không hợp lệ! Vui lòng kiểm tra lại hoặc liên hệ Tổng đài hoặc Zalo để được hỗ trợ",
            en: "Invalid card number prefix! Please check again or contact Hotline or Zalo for support"
        },
        "Mã ưu đãi không đúng, vui lòng kiểm tra lại": {
            vi: "Mã ưu đãi không đúng, vui lòng kiểm tra lại hoặc liên hệ Tổng đài hoặc Zalo để được hỗ trợ",
            en: "Invalid promo code, please check again or contact Hotline or Zalo for support"
        }
    };

    // Hàm tự động xác định ngôn ngữ hiện tại của trang (VI hoặc EN)
    function getCurrentLanguage() {
        const currentPath = window.location.pathname.toLowerCase();
        let detectedLang = 'vi';

        if (currentPath.includes('/en-') || currentPath.includes('/en/')) {
            detectedLang = 'en';
        }

        document.documentElement.lang = detectedLang;
        return detectedLang;
    }
    // =================================================================

    let isListening = false;
    let timeoutId = null;
    const originalAlert = window.alert;

    function startListening() {
        console.log("🎯 Bắt đầu lắng nghe phản hồi API & Chặn Alert mặc định...");
        isListening = true;

        window.alert = function (msg) {
            console.log("🚫 Đã chặn alert gốc:", msg);
        };

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            stopListening();
            console.log("⏱️ Đã hết thời gian chờ API.");
        }, 35000);
    }

    function stopListening() {
        isListening = false;
        if (timeoutId) clearTimeout(timeoutId);
        window.alert = originalAlert;
    }

    // Hàm xử lý dịch thuật dựa trên Message của BE
    function getTranslatedMessage(beMessage) {
        if (!beMessage) return "";

        const currentLang = getCurrentLanguage();
        const translation = DICTIONARY[beMessage.trim()];

        if (translation && translation[currentLang]) {
            return translation[currentLang];
        }

        return beMessage;
    }

    // Hàm mở popup (Trả về true nếu mở thành công, false nếu không tìm thấy DOM)
    function triggerPopup(type, rawMessage) {
        const target = CONFIG[type];
        if (!target) return false;

        const inputOpen = document.getElementById(target.inputOpenId);
        const textNode = document.querySelector(target.textSelector);

        // NẾU THIẾU POPUP HOẶC THIẾU NƠI HIỂN THỊ CHỮ -> BÁO THẤT BẠI ĐỂ DÙNG ALERT GỐC
        if (!inputOpen || !textNode) {
            console.warn(`⚠️ Không tìm thấy thành phần Popup cho [${type.toUpperCase()}]. Chuyển hướng sang Alert mặc định.`);
            return false;
        }

        // Tiến hành dịch câu thông báo trước khi đưa vào HTML
        const translatedMessage = getTranslatedMessage(rawMessage);
        if (translatedMessage) {
            textNode.innerText = translatedMessage;
        }

        inputOpen.checked = true;
        console.log(`🚨 Đã kích hoạt Popup [${type.toUpperCase()}]`);
        return true; // Mở popup custom thành công
    }

    function closeAllModals() {
        const closeIds = [
            'popup-dinning-close',
            'popup-privilege-close',
            'popup-privilege2-close'
        ];
        closeIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.checked = true;
        });
    }

    function handleResponseData(resData) {
        if (!isListening) return;

        let isPopupOpened = false;
        const rawMessage = resData ? resData.Message : "";

        if (resData && resData.Success === false) {
            isPopupOpened = triggerPopup('error', rawMessage || "Err!");
        }
        else if (resData && resData.Success === true) {
            closeAllModals();
            isPopupOpened = triggerPopup('success', rawMessage);
        }

        // 🔄 FALLBACK MECHANISM: Nếu triggerPopup thất bại (bằng false)
        if (!isPopupOpened && rawMessage) {
            stopListening(); // Khôi phục lại alert gốc ngay lập tức

            // Dịch câu thông báo trước khi alert ra cho đồng bộ ngôn ngữ luôn
            const translatedAlertMsg = getTranslatedMessage(rawMessage);
            originalAlert(translatedAlertMsg);
        } else {
            // Nếu dùng popup custom thành công thì nhả alert sau 100ms như cũ
            setTimeout(stopListening, 100);
        }
    }

    // ĐÁNH CHẶN FETCH API
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch(...args);
        if (isListening) {
            const clonedResponse = response.clone();
            try { const resData = await clonedResponse.json(); handleResponseData(resData); } catch (e) { }
        }
        return response;
    };

    // ĐÁNH CHẶN XHR (AXIOS, JQUERY)
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener('load', function () {
            if (isListening) {
                try { const resData = JSON.parse(this.responseText); handleResponseData(resData); } catch (e) { }
            }
        });
        return originalSend.apply(this, args);
    };

    return { watch: startListening };
})();
