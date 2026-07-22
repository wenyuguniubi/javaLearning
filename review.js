(function () {
  "use strict";

  const storageKey = "java-interview-workbench-v1";
  const themeOrder = ["system", "light", "dark"];
  const root = document.documentElement;
  const sidebar = document.getElementById("sidebar");
  const navToggle = document.getElementById("nav-toggle");
  const themeToggle = document.getElementById("theme-toggle");
  const printButton = document.getElementById("print-page");
  let themePreference = loadThemePreference();

  function loadStoredState() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function loadThemePreference() {
    const stored = loadStoredState();
    return themeOrder.includes(stored.theme) ? stored.theme : "system";
  }

  function saveThemePreference() {
    try {
      const stored = loadStoredState();
      stored.theme = themePreference;
      window.localStorage.setItem(storageKey, JSON.stringify(stored));
    } catch (error) {
      return;
    }
  }

  function resolveTheme() {
    if (themePreference === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return themePreference;
  }

  function applyTheme() {
    const theme = resolveTheme();
    root.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
    themeToggle.textContent = themePreference === "system"
      ? "主题：跟随系统"
      : themePreference === "dark"
        ? "主题：深色"
        : "主题：浅色";
  }

  function cycleTheme() {
    const current = themeOrder.indexOf(themePreference);
    themePreference = themeOrder[(current + 1) % themeOrder.length];
    applyTheme();
    saveThemePreference();
  }

  function setSidebarOpen(open) {
    sidebar.dataset.open = String(open);
    navToggle.setAttribute("aria-expanded", String(open));
  }

  function bindNavigation() {
    navToggle.addEventListener("click", function () {
      setSidebarOpen(sidebar.dataset.open !== "true");
    });

    document.querySelectorAll(".chapter-nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        setSidebarOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    });
  }

  function observeSections() {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const links = Array.from(document.querySelectorAll(".chapter-nav a[href^='#']"));
    const sections = links
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    const observer = new IntersectionObserver(function (entries) {
      const current = entries
        .filter(function (entry) {
          return entry.isIntersecting;
        })
        .sort(function (a, b) {
          return b.intersectionRatio - a.intersectionRatio;
        })[0];

      if (!current) {
        return;
      }

      links.forEach(function (link) {
        if (link.getAttribute("href") === "#" + current.target.id) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }, {
      rootMargin: "-16% 0px -68% 0px",
      threshold: [0.02, 0.15, 0.35]
    });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initialize() {
    applyTheme();
    bindNavigation();
    observeSections();

    themeToggle.addEventListener("click", cycleTheme);
    printButton.addEventListener("click", function () {
      window.print();
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", function () {
        if (themePreference === "system") {
          applyTheme();
        }
      });
    }
  }

  initialize();
})();
