(function () {
  "use strict";

  const storageKey = "java-interview-workbench-v1";
  const readingPositionKey = "java-interview-reading-position-review-v1";
  const themeOrder = ["system", "light", "dark"];
  const root = document.documentElement;
  const sidebar = document.getElementById("sidebar");
  const navToggle = document.getElementById("nav-toggle");
  const themeToggle = document.getElementById("theme-toggle");
  const printButton = document.getElementById("print-page");
  let themePreference = loadThemePreference();
  let positionSaveTimer = null;

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

  function currentSectionId() {
    const sections = Array.from(document.querySelectorAll("main > section[id]"));
    const topbar = document.querySelector(".topbar");
    const readingLine = window.scrollY + (topbar ? topbar.offsetHeight : 0) + 24;
    let current = sections[0] || null;

    sections.forEach(function (section) {
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      if (sectionTop <= readingLine) {
        current = section;
      }
    });

    return current ? current.id : "";
  }

  function saveReadingPosition() {
    window.clearTimeout(positionSaveTimer);
    positionSaveTimer = null;

    try {
      window.localStorage.setItem(readingPositionKey, JSON.stringify({
        scrollY: Math.max(0, Math.round(window.scrollY)),
        sectionId: currentSectionId()
      }));
    } catch (error) {
      return;
    }
  }

  function scheduleReadingPositionSave() {
    if (positionSaveTimer !== null) {
      return;
    }

    positionSaveTimer = window.setTimeout(saveReadingPosition, 400);
  }

  function loadReadingPosition() {
    try {
      const raw = window.localStorage.getItem(readingPositionKey);
      if (!raw) {
        return null;
      }

      const position = JSON.parse(raw);
      if (!Number.isFinite(position.scrollY) || position.scrollY < 0) {
        return null;
      }

      return {
        scrollY: position.scrollY,
        sectionId: typeof position.sectionId === "string" ? position.sectionId : ""
      };
    } catch (error) {
      return null;
    }
  }

  function restoreReadingPosition() {
    if (window.location.hash) {
      return;
    }

    const position = loadReadingPosition();
    if (!position) {
      return;
    }

    window.requestAnimationFrame(function () {
      const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const section = position.sectionId ? document.getElementById(position.sectionId) : null;
      if (position.scrollY <= maxScrollY || section) {
        const previousScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = "auto";

        if (position.scrollY <= maxScrollY) {
          window.scrollTo(0, position.scrollY);
        } else {
          section.scrollIntoView({ block: "start" });
        }

        document.documentElement.style.scrollBehavior = previousScrollBehavior;
      }
    });
  }

  function initializeReadingPosition() {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.addEventListener("scroll", scheduleReadingPositionSave, { passive: true });
    window.addEventListener("pagehide", saveReadingPosition);
    restoreReadingPosition();
  }

  function initialize() {
    applyTheme();
    bindNavigation();
    observeSections();
    initializeReadingPosition();

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
