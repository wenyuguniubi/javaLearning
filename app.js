(function () {
  "use strict";

  const storageKey = "java-interview-workbench-v1";
  const moduleIds = [
    "java",
    "jvm",
    "concurrency",
    "spring",
    "mysql",
    "redis",
    "mq",
    "network",
    "distributed",
    "design",
    "algorithm",
    "project",
    "behavior"
  ];

  const dailyTasks = [
    { topic: "Java 集合", task: "闭卷回答：HashMap 扩容时元素如何迁移？", target: "#java" },
    { topic: "JVM 排障", task: "闭卷回答：如何证明存在内存泄漏？", target: "#jvm" },
    { topic: "并发控制", task: "闭卷回答：如何给线程池设置容量？", target: "#concurrency" },
    { topic: "Spring 事务", task: "闭卷回答：事务失效有哪些根因？", target: "#spring" },
    { topic: "MySQL", task: "闭卷回答：联合索引如何设计？", target: "#mysql" },
    { topic: "Redis", task: "闭卷回答：缓存一致性如何取舍？", target: "#redis" },
    { topic: "MQ 可靠性", task: "闭卷回答：如何保证消息不丢？", target: "#mq" },
    { topic: "网络与 Netty", task: "闭卷回答：EventLoop 被阻塞会怎样？", target: "#network" },
    { topic: "分布式稳定性", task: "闭卷回答：多层重试为何危险？", target: "#distributed" },
    { topic: "系统设计", task: "用 5 分钟完成一次容量估算。", target: "#design" },
    { topic: "算法", task: "限时完成一道中等题并口述边界。", target: "#algorithm" },
    { topic: "项目深挖", task: "核实一个项目数字并准备证据。", target: "#project" },
    { topic: "行为面", task: "练习 90 秒自我介绍。", target: "#behavior" }
  ];

  const elements = {
    root: document.documentElement,
    sidebar: document.getElementById("sidebar"),
    navToggle: document.getElementById("nav-toggle"),
    themeToggle: document.getElementById("theme-toggle"),
    progressLabel: document.getElementById("progress-label"),
    resetProgress: document.getElementById("reset-progress"),
    printPage: document.getElementById("print-page"),
    toast: document.getElementById("toast"),
    todayTopic: document.getElementById("today-topic"),
    todayTask: document.getElementById("today-task"),
    todayLink: document.getElementById("today-link")
  };

  let state = loadState();
  let toastTimer = null;

  function defaultState() {
    return {
      theme: "system",
      mastery: {}
    };
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return defaultState();
      }
      const parsed = JSON.parse(raw);
      return {
        theme: ["system", "light", "dark"].includes(parsed.theme) ? parsed.theme : "system",
        mastery: parsed.mastery && typeof parsed.mastery === "object" ? parsed.mastery : {}
      };
    } catch (error) {
      return defaultState();
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      showToast("浏览器禁止本地存储，本次进度不会保留。");
    }
  }

  function showToast(message) {
    if (!elements.toast) {
      return;
    }
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      elements.toast.hidden = true;
    }, 2600);
  }

  function resolvedTheme() {
    if (state.theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return state.theme;
  }

  function applyTheme() {
    const theme = resolvedTheme();
    elements.root.dataset.theme = theme;
    elements.themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
    const label = state.theme === "system" ? "主题：跟随系统" : state.theme === "dark" ? "主题：深色" : "主题：浅色";
    elements.themeToggle.textContent = label;
  }

  function cycleTheme() {
    const order = ["system", "light", "dark"];
    const currentIndex = order.indexOf(state.theme);
    state.theme = order[(currentIndex + 1) % order.length];
    applyTheme();
    saveState();
  }

  function setMastery(moduleId, level) {
    if (!moduleIds.includes(moduleId) || level < 1 || level > 4) {
      return;
    }
    state.mastery[moduleId] = level;
    renderMastery();
    saveState();
    showToast(level >= 3 ? "已标记为可应对追问。" : "已保存掌握度，后续需要复测。" );
  }

  function renderMastery() {
    document.querySelectorAll(".module[data-module]").forEach(function (section) {
      const moduleId = section.dataset.module;
      const level = Number(state.mastery[moduleId] || 0);
      section.querySelectorAll(".mastery-control button").forEach(function (button) {
        const selected = Number(button.dataset.level) === level;
        button.setAttribute("aria-pressed", String(selected));
      });

      const navLink = document.querySelector('[data-module-link="' + moduleId + '"]');
      if (navLink) {
        navLink.dataset.complete = String(level >= 3);
      }
    });

    const masteredCount = moduleIds.filter(function (moduleId) {
      return Number(state.mastery[moduleId] || 0) >= 3;
    }).length;
    elements.progressLabel.textContent = "已掌握 " + masteredCount + " / " + moduleIds.length;
  }

  function bindMasteryButtons() {
    document.querySelectorAll(".module[data-module]").forEach(function (section) {
      section.querySelectorAll(".mastery-control button").forEach(function (button) {
        button.addEventListener("click", function () {
          setMastery(section.dataset.module, Number(button.dataset.level));
        });
      });
    });
  }

  function setSidebarOpen(open) {
    elements.sidebar.dataset.open = String(open);
    elements.navToggle.setAttribute("aria-expanded", String(open));
  }

  function bindNavigation() {
    elements.navToggle.addEventListener("click", function () {
      const isOpen = elements.sidebar.dataset.open === "true";
      setSidebarOpen(!isOpen);
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

    const links = Array.from(document.querySelectorAll(".chapter-nav a"));
    const sections = links
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    const observer = new IntersectionObserver(function (entries) {
      const visible = entries
        .filter(function (entry) { return entry.isIntersecting; })
        .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];

      if (!visible) {
        return;
      }

      links.forEach(function (link) {
        const isCurrent = link.getAttribute("href") === "#" + visible.target.id;
        if (isCurrent) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }, {
      rootMargin: "-18% 0px -62% 0px",
      threshold: [0.05, 0.2, 0.5]
    });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function renderTodayTask() {
    const dayIndex = Math.floor(Date.now() / 86400000) % dailyTasks.length;
    const task = dailyTasks[dayIndex];
    elements.todayTopic.textContent = task.topic;
    elements.todayTask.textContent = task.task;
    elements.todayLink.href = task.target;
  }

  function resetProgress() {
    const confirmed = window.confirm("确定清空全部掌握度和本地学习进度吗？主题设置会保留。");
    if (!confirmed) {
      return;
    }
    state.mastery = {};
    renderMastery();
    saveState();
    showToast("本地学习进度已清空。");
  }

  function initialize() {
    applyTheme();
    renderMastery();
    renderTodayTask();
    bindMasteryButtons();
    bindNavigation();
    observeSections();

    elements.themeToggle.addEventListener("click", cycleTheme);
    elements.resetProgress.addEventListener("click", resetProgress);
    elements.printPage.addEventListener("click", function () {
      window.print();
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", function () {
        if (state.theme === "system") {
          applyTheme();
        }
      });
    }
  }

  initialize();
})();
