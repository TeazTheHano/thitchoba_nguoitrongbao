// ==========================================================================
// APPLICATION SHELL & SPA ENGINE
// Encapsulates configuration, caching, renderers, and routing inside a single
// modular object to prevent global namespace pollution and ensure solid architecture.
// ==========================================================================

const App = {
  // 1. Engine Configuration
  config: {
    retries: 3,
    retryDelayMs: 1000,
    defaultRoute: "#/landing",
    placeholders: {
      main: "#main_placeholder",
      header: "#header_placeholder",
      footer: "#footer_placeholder",
    },
    errorTemplate: (error) => `
            <div style="padding: 40px; color: #ef4444; font-family: 'Inter', sans-serif; text-align: center; background: #fee2e2; border-radius: 8px; margin: 20px;">
                <h3 style="margin-bottom: 12px; font-weight: 600;">Unable to load page</h3>
                <p style="opacity: 0.8; font-size: 14px;">${error.message || error}</p>
            </div>
        `,
  },

  // 2. Component Template Registry
  components: {
    HEADER: "components/header.html",
    FOOTER: "components/footer.html",
    LANDING_HERO: "components/landing_hero.html",
      LANDING_1: 'components/landing_1.html',
    HANHTRINH_HOME_HERO: "components/hanhtrinh_home_hero.html",
    HANHTRINH_HOME_SERVICES: "components/hanhtrinh_home_services.html",
  },

  // 3. HTML Cache Store
  cache: new Map(),

  // 4. Utility Methods
  utils: {
    delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  },

  // 5. HTML Loader & Fetch Engine
  async fetchHtml(path, retries = this.config.retries) {
    if (!path) {
      throw new Error("fetchHtml: Path must be a valid string.");
    }

    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch file: ${path} (${response.statusText})`,
          );
        }
        const html = await response.text();
        this.cache.set(path, html);
        return html;
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
        await this.utils.delay(this.config.retryDelayMs);
      }
    }
  },

  async injectHtml(target, path) {
    const element = document.querySelector(target);
    if (!element) {
      throw new Error(
        `injectHtml: Target element "${target}" not found in DOM.`,
      );
    }
    const html = await this.fetchHtml(path);
    element.innerHTML = html;
    return element;
  },

  // 6. Section & Page Render Engine
  async renderSection(section) {
    if (!section.component) {
      throw new Error(
        `renderSection: No template declared for target placeholder "${section.target}"`,
      );
    }

    await this.injectHtml(section.target, section.component);

    if (typeof section.afterLoad === "function") {
      await section.afterLoad();
    }
  },

  async renderPage(page) {
    // Render base shell page first
    await this.injectHtml(this.config.placeholders.main, page.template);

    // Render sub-sections sequentially to prevent DOM insertion collisions
    for (const section of page.sections) {
      await this.renderSection(section);
    }
  },

  async ensureLayout() {
    // Inject header if not loaded
    const headerEl = document.querySelector(this.config.placeholders.header);
    if (headerEl && !headerEl.innerHTML.trim()) {
      await this.injectHtml(
        this.config.placeholders.header,
        this.components.HEADER,
      );
      if (typeof headerScroll === "function") {
        headerScroll();
      }
    }

    // Inject footer if not loaded
    const footerEl = document.querySelector(this.config.placeholders.footer);
    if (footerEl && !footerEl.innerHTML.trim()) {
      await this.injectHtml(
        this.config.placeholders.footer,
        this.components.FOOTER,
      );
    }
  },

  // 7. Client-side SPA Router
  routes: [],

  matchRoute(hash) {
    for (const route of this.routes) {
      if (typeof route.path === "string" && route.path === hash) {
        return route;
      }
      if (route.path instanceof RegExp) {
        const match = hash.match(route.path);
        if (match) {
          return {
            ...route,
            params: match,
          };
        }
      }
    }
    return null;
  },

  async routeController() {
    try {
      await this.ensureLayout();

      const hash = window.location.hash || this.config.defaultRoute;
      const route = this.matchRoute(hash);

      if (!route) {
        await this.injectHtml(this.config.placeholders.main, "pages/404.html");
        return;
      }

      await this.renderPage(route.page);
    } catch (error) {
      console.error("[SPA Router Exception]:", error);
      const mainPlaceholder = document.querySelector(
        this.config.placeholders.main,
      );
      if (mainPlaceholder) {
        mainPlaceholder.innerHTML = this.config.errorTemplate(error);
      }
    }
  },

  // 8. Initialization & Listeners
  init() {
    const handler = this.routeController.bind(this);
    window.addEventListener("load", handler);
    window.addEventListener("hashchange", handler);

    // Global click-outside listener to close open details dropdowns
    document.addEventListener("click", (event) => {
      const dropdowns = document.querySelectorAll("details.ui-dropdown");
      dropdowns.forEach((dropdown) => {
        if (dropdown.hasAttribute("open") && !dropdown.contains(event.target)) {
          dropdown.removeAttribute("open");
        }
      });
    });
  },
};

// ==========================================================================
// BACKWARD COMPATIBILITY & CONFIGURATION INJECTION
// Define components and pages cleanly within the App boundaries while
// exporting shorthand references if needed.
// ==========================================================================

const COMPONENTS = App.components;

const landingPage = {
  template: "pages/landing.html",
  sections: [
    // {
    //     target: '#hero-section_placeholder',
    //     component: COMPONENTS.HERO,
    //     // afterLoad() {
    //     //     if (typeof trackMousePosition === 'function') {
    //     //         trackMousePosition('#hero');
    //     //     }
    //     //     if (typeof autoNextSelection === 'function') {
    //     //         autoNextSelection({
    //     //             container: '#hero',
    //     //             itemSelector: 'input[name="hero"]',
    //     //             interval: 5000,
    //     //             type: 'radio'
    //     //         });
    //     //     }
    //     // }
    // },
    {
      target: "#intro1_placeholder",
      component: COMPONENTS.INTRO1,
    },
       {
            target: '#landing-1_placeholder',
            component: COMPONENTS.LANDING_1,
        },
  ],
};

const hanhtrinhHomePage = {
  template: "pages/hanhtrinh_home.html",
  sections: [
    // {
    //     target: '#hero-section_placeholder',
    //     component: COMPONENTS.HERO,
    //     // afterLoad() {
    //     //     if (typeof trackMousePosition === 'function') {
    //     //         trackMousePosition('#hero');
    //     //     }
    //     //     if (typeof autoNextSelection === 'function') {
    //     //         autoNextSelection({
    //     //             container: '#hero',
    //     //             itemSelector: 'input[name="hero"]',
    //     //             interval: 5000,
    //     //             type: 'radio'
    //     //         });
    //     //     }
    //     // }
    // },
    // {
    //   target: "#intro1_placeholder",
    //   component: COMPONENTS.INTRO1,
    // },
    {
      target: "#hanhtrinh_home_hero_placeholder",
      component: COMPONENTS.HANHTRINH_HOME_HERO,
    },
    {
      target: "#hanhtrinh_home_services_placeholder",
      component: COMPONENTS.HANHTRINH_HOME_SERVICES,
    },
  ],
};
const hanhtrinhPhongChoCaoCapPage = {
  template: "pages/hanhtrinh_phongchocaocap.html",
  sections: [],
};

const detailshElitePage = {
  template: "pages/detail-shElite.html",
  sections: [],
};
// 9. Attach Routes
App.routes = [
  {
    path: "#/landing",
    page: landingPage,
  },
  {
    path: "#/hanhtrinh-home",
    page: hanhtrinhHomePage,
  },
  {
    path: "#/hanhtrinh-phongchocaocap",
    page: hanhtrinhPhongChoCaoCapPage,
  },
  {
    path: "#/detail-shElite",
    page: detailshElitePage,
  },
];

// 10. Start the App Shell
App.init();
