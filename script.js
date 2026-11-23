// ===========================================================
// Portfolio Numérique — script commun
// Thème clair/sombre · menu mobile · menus déroulants · animations
// (le thème initial est appliqué par un petit script dans <head>
//  pour éviter le flash blanc au chargement)
// ===========================================================

(function () {
  "use strict";

  var root = document.documentElement;
  var STORAGE_KEY = "portfolio-theme";

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { /* stockage indisponible : on ignore */ }
    return null;
  }

  // ---------- Mode sombre ----------
  var themeBtn = document.getElementById("theme-toggle");

  function setTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", String(theme === "dark"));
      themeBtn.setAttribute("aria-label", theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre");
    }
    if (persist) store(STORAGE_KEY, theme);
  }

  setTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    });
  }

  // Suit le thème du système tant que l'utilisateur n'a rien choisi
  if (window.matchMedia) {
    var mqDark = window.matchMedia("(prefers-color-scheme: dark)");
    var onSystemChange = function (e) {
      if (!store(STORAGE_KEY)) setTheme(e.matches ? "dark" : "light", false);
    };
    if (mqDark.addEventListener) mqDark.addEventListener("change", onSystemChange);
  }

  // ---------- Menu mobile + menus déroulants ----------
  var header = document.querySelector(".site-header");
  var menuBtn = document.getElementById("menu-toggle");
  var nav = document.getElementById("main-nav");
  var ddItems = Array.prototype.slice.call(document.querySelectorAll(".has-dd"));
  var mqMobile = window.matchMedia("(max-width: 900px)");

  function closeDropdowns(except) {
    ddItems.forEach(function (item) {
      if (item === except) return;
      item.classList.remove("open");
      item.querySelector(".dd-btn").setAttribute("aria-expanded", "false");
    });
  }

  function setMenu(open) {
    if (!menuBtn || !nav) return;
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    document.body.classList.toggle("menu-open", open && mqMobile.matches);
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  ddItems.forEach(function (item) {
    var btn = item.querySelector(".dd-btn");
    btn.addEventListener("click", function () {
      if (mqMobile.matches) return;
      var willOpen = !item.classList.contains("open");
      closeDropdowns(item);
      item.classList.toggle("open", willOpen);
      btn.setAttribute("aria-expanded", String(willOpen));
    });
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".has-dd")) closeDropdowns();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var openItem = document.querySelector(".has-dd.open");
    if (openItem) {
      closeDropdowns();
      openItem.querySelector(".dd-btn").focus();
    }
    if (nav && nav.classList.contains("open")) {
      setMenu(false);
      if (menuBtn) menuBtn.focus();
    }
  });

  // Sur mobile, les groupes sont toujours dépliés dans le tiroir
  function syncMobile() {
    ddItems.forEach(function (item) {
      item.querySelector(".dd-btn").setAttribute("aria-expanded", mqMobile.matches ? "true" : String(item.classList.contains("open")));
    });
    if (!mqMobile.matches) setMenu(false);
  }
  if (mqMobile.addEventListener) mqMobile.addEventListener("change", syncMobile);
  syncMobile();

  // ---------- Ombre du header au scroll ----------
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 4);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Apparition progressive au scroll ----------
  var targets = document.querySelectorAll(".card, section.block, .ia-disclosure, .stats li, .pager a");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.setProperty("--i", String(i % 4));
      io.observe(el);
    });
  }
})();

// ===========================================================
// Astuce : le quiz/checklist de cybersécurité (chapitre 1) et
// toute autre fonctionnalité interactive spécifique à une page
// (quiz, filtre de projets, animation de tri...) peuvent être
// écrits ici en dessous, ou dans un fichier JS séparé importé
// seulement par la page concernée. C'est à vous de les coder —
// demandez à une IA de vous aider à déboguer, pas d'écrire la
// solution complète à votre place (règle d'or n°6).
// ===========================================================

// ---------- Checklist cybersécurité : isolée et progressive ----------
(function () {
  "use strict";
  var list = document.getElementById("checklist");
  var output = document.getElementById("checklist-score");
  if (!list || !output) return; // Les autres pages ne sont pas affectées.
  var boxes = Array.prototype.slice.call(list.querySelectorAll('input[type="checkbox"]'));
  var progress = document.getElementById("checklist-progress");
  var feedback = document.getElementById("checklist-feedback");

  function updateScore() {
    var checked = boxes.filter(function (box) { return box.checked; }).length;
    var total = boxes.length;
    var percent = total ? Math.round((checked / total) * 100) : 0;
    output.textContent = checked + " / " + total + " — " + percent + " %";
    if (progress) {
      progress.max = total;
      progress.value = checked;
      progress.setAttribute("aria-valuetext", checked + " bonnes pratiques sur " + total);
    }
    if (feedback) {
      if (checked === total) feedback.textContent = "Excellent : les dix réflexes sont cochés. Continue à les appliquer et à rester vigilant.";
      else if (checked >= 7) feedback.textContent = "Bon niveau de prévention. Renforce les quelques pratiques qui restent.";
      else if (checked >= 4) feedback.textContent = "Des bases sont en place. Priorise les mots de passe uniques, la MFA et les mises à jour.";
      else feedback.textContent = "La protection peut être améliorée. Commence par sécuriser tes comptes essentiels et tes appareils.";
    }
  }
  boxes.forEach(function (box) { box.addEventListener("change", updateScore); });
  updateScore();
})();
