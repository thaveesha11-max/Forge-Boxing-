/* FORGE — global behaviour. Loaded on every page after data.js. */
(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  /* ---------------------------------------------------------------
     Preloader: hold at least 1.6 s so the hammer lands, then fade
     --------------------------------------------------------------- */
  var pre = document.querySelector("[data-preloader]");
  if (pre && !root.classList.contains("no-preloader")) {
    var started = Date.now();
    var hide = function () {
      window.setTimeout(function () {
        pre.classList.add("is-done");
      }, Math.max(0, 1600 - (Date.now() - started)));
    };
    if (document.readyState === "complete") hide();
    else window.addEventListener("load", hide);
    window.setTimeout(function () { pre.classList.add("is-done"); }, 5000);
  }

  /* ---------------------------------------------------------------
     Shared helpers (used by schedule.js and forms.js too)
     --------------------------------------------------------------- */
  var DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function toMin(t) {
    var p = t.split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function fmtTime(mins, opts) {
    mins = typeof mins === "string" ? toMin(mins) : mins;
    var h = Math.floor(mins / 60) % 24;
    var m = mins % 60;
    var suffix = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 || 12;
    var mm = m < 10 ? "0" + m : "" + m;
    if (opts && opts.parts) return { time: h12 + ":" + mm, suffix: suffix };
    if (opts && opts.short && m === 0) return h12 + " " + suffix;
    return h12 + ":" + mm + " " + suffix;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function heatHTML(level, size) {
    var info = (window.FORGE && FORGE.heat && FORGE.heat[level]) || { name: "" };
    return (
      '<span class="heat' + (size ? " heat-" + size : "") + '" data-heat="' + level +
      '" role="img" aria-label="Heat ' + level + " of 5, " + esc(info.name) + '"><i></i><i></i><i></i><i></i><i></i></span>'
    );
  }

  function openState(now) {
    var hours = (window.FORGE && FORGE.hours) || {};
    var d = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var today = hours[d];
    if (today) {
      var o = toMin(today[0]);
      var c = toMin(today[1]);
      if (mins >= o && mins < c) return { open: true, text: "Open now · until " + fmtTime(c, { short: true }) };
      if (mins < o) return { open: false, text: "Closed · opens " + fmtTime(o, { short: true }) };
    }
    for (var i = 1; i <= 7; i++) {
      var nd = (d + i) % 7;
      if (hours[nd]) {
        return {
          open: false,
          text: "Closed · opens " + (i === 1 ? "tomorrow" : DAY[nd]) + " " + fmtTime(toMin(hours[nd][0]), { short: true }),
        };
      }
    }
    return { open: false, text: "Closed" };
  }

  window.FORGE = window.FORGE || {};
  FORGE.util = {
    DAY: DAY,
    DAY_SHORT: DAY_SHORT,
    MONTH_SHORT: MONTH_SHORT,
    toMin: toMin,
    fmtTime: fmtTime,
    esc: esc,
    heatHTML: heatHTML,
    openState: openState,
    reduced: reduced,
  };

  /* ---------------------------------------------------------------
     Header: solid after scrolling, tucks away on the way down
     --------------------------------------------------------------- */
  var header = document.querySelector("[data-header]");
  var menuOpen = false;
  if (header) {
    var lastY = window.scrollY;
    var ticking = false;
    var update = function () {
      var y = window.scrollY;
      header.classList.toggle("is-solid", y > 24);
      if (Math.abs(y - lastY) > 6) {
        var hide = y > lastY && y > 480 && !menuOpen;
        header.classList.toggle("is-hidden", hide);
        root.classList.toggle("header-shown", !hide);
        lastY = y;
      }
      ticking = false;
    };
    root.classList.add("header-shown");
    update();
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------------
     Mobile menu
     --------------------------------------------------------------- */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.querySelector("[data-mobile-menu]");
  if (toggle && menu) {
    var outside = document.querySelectorAll("main, footer");
    var setMenu = function (open, returnFocus) {
      menuOpen = open;
      menu.classList.toggle("is-open", open);
      menu.inert = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
      body.classList.toggle("menu-open", open);
      Array.prototype.forEach.call(outside, function (el) {
        el.inert = open;
      });
      if (open) {
        header.classList.remove("is-hidden");
        var first = menu.querySelector("a");
        if (first) window.setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
      } else if (returnFocus) {
        toggle.focus();
      }
    };
    toggle.addEventListener("click", function () {
      setMenu(!menuOpen);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuOpen) setMenu(false, true);
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    var wide = window.matchMedia("(min-width: 1081px)");
    var onWide = function (e) {
      if (e.matches && menuOpen) setMenu(false);
    };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
  }

  /* ---------------------------------------------------------------
     Open-now status, today's hours, year
     --------------------------------------------------------------- */
  function paintStatus() {
    var state = openState(new Date());
    document.querySelectorAll("[data-open-status]").forEach(function (el) {
      el.textContent = state.text;
      el.classList.add("status");
      el.classList.toggle("is-open", state.open);
      el.classList.toggle("is-closed", !state.open);
    });
  }
  paintStatus();
  window.setInterval(paintStatus, 60 * 1000);

  var todayIdx = new Date().getDay();
  document.querySelectorAll("[data-days]").forEach(function (row) {
    var days = row.getAttribute("data-days").split(",").map(Number);
    if (days.indexOf(todayIdx) !== -1) row.classList.add("is-today");
  });
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------------------------------------------------------------
     Reveal on scroll. Content is always rendered; elements below the
     fold start slightly offset (and "hot") and settle when seen.
     --------------------------------------------------------------- */
  var revealEls = document.querySelectorAll("[data-reveal], [data-reveal-heat]");
  if (!reduced && "IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.remove("is-pending");
          io.unobserve(el);
          el.addEventListener("transitionend", function clear() {
            el.style.transitionDelay = "";
            el.removeEventListener("transitionend", clear);
          });
        });
      },
      { rootMargin: "0px 0px -6% 0px" }
    );
    var fold = window.innerHeight * 0.95;
    revealEls.forEach(function (el) {
      if (el.getBoundingClientRect().top > fold) {
        var delay = el.getAttribute("data-reveal-delay");
        if (delay) el.style.transitionDelay = delay + "ms";
        el.classList.add("is-pending");
        io.observe(el);
      }
    });
  }

  /* ---------------------------------------------------------------
     Program cards: heat spot follows the pointer
     --------------------------------------------------------------- */
  document.querySelectorAll(".pcard").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---------------------------------------------------------------
     Copy buttons
     --------------------------------------------------------------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-copy]");
    if (!btn) return;
    var text = btn.getAttribute("data-copy");
    var original = btn.textContent;
    var done = function (label) {
      btn.textContent = label;
      window.setTimeout(function () { btn.textContent = original; }, 1600);
    };
    var fallback = function () {
      var target = btn.previousElementSibling;
      if (target) {
        var range = document.createRange();
        range.selectNodeContents(target);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      done("Selected");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done("Copied"); }, fallback);
    } else {
      fallback();
    }
  });

  /* ---------------------------------------------------------------
     Membership: monthly / annual billing
     --------------------------------------------------------------- */
  var billing = document.querySelector("[data-billing]");
  if (billing) {
    var scope = document.querySelector("[data-plans]") || document;
    billing.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-cycle]");
      if (!btn) return;
      var cycle = btn.getAttribute("data-cycle");
      billing.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      scope.querySelectorAll("[data-monthly][data-annual]").forEach(function (el) {
        el.textContent = el.getAttribute("data-" + cycle);
        if (!reduced && el.animate) {
          el.animate(
            [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
            { duration: 380, easing: "cubic-bezier(.16,1,.3,1)" }
          );
        }
      });
    });
  }

  /* ---------------------------------------------------------------
     About: floor plan zones
     --------------------------------------------------------------- */
  var floorBtns = document.querySelectorAll("[data-zone-btn]");
  if (floorBtns.length) {
    var activate = function (id) {
      document.querySelectorAll(".floor-plan .zone").forEach(function (z) {
        z.classList.toggle("is-active", z.id === "zone-" + id);
      });
      floorBtns.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-zone-btn") === id));
      });
    };
    floorBtns.forEach(function (b) {
      var id = b.getAttribute("data-zone-btn");
      b.addEventListener("click", function () { activate(id); });
      b.addEventListener("mouseenter", function () { activate(id); });
      b.addEventListener("focus", function () { activate(id); });
    });
    document.querySelectorAll(".floor-plan .zone").forEach(function (z) {
      z.addEventListener("mouseenter", function () { activate(z.id.replace("zone-", "")); });
    });
  }

  /* ---------------------------------------------------------------
     Programs: sub-navigation follows the section in view
     --------------------------------------------------------------- */
  var subLinks = document.querySelectorAll(".subnav a[href^='#']");
  if (subLinks.length && "IntersectionObserver" in window) {
    var list = document.querySelector(".subnav ul");
    var byId = {};
    subLinks.forEach(function (a) {
      byId[a.getAttribute("href").slice(1)] = a;
    });
    var sio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var link = byId[entry.target.id];
          if (!link) return;
          subLinks.forEach(function (a) { a.classList.toggle("is-active", a === link); });
          if (list) {
            list.scrollTo({
              left: link.offsetLeft - list.clientWidth / 2 + link.clientWidth / 2,
              behavior: reduced ? "auto" : "smooth",
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    Object.keys(byId).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) sio.observe(sec);
    });
  }

  /* ---------------------------------------------------------------
     404: the referee's count
     --------------------------------------------------------------- */
  var ko = document.querySelector("[data-ko]");
  if (ko) {
    var n = 1;
    var out = document.querySelector("[data-ko-line]");
    var timer = window.setInterval(function () {
      n += 1;
      if (n > 10) {
        window.clearInterval(timer);
        if (out) out.textContent = "Still here. Good. Get back up and pick a door below.";
        return;
      }
      ko.textContent = n;
      ko.classList.remove("tick");
      void ko.offsetWidth;
      ko.classList.add("tick");
    }, reduced ? 250 : 800);
  }
})();
