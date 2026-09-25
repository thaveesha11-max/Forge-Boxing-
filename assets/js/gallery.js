/* FORGE — gallery: fills slots from assets/gallery/, filters, lightbox. */
(function () {
  "use strict";
  var gal = document.querySelector("[data-gallery]");
  if (!gal) return;
  var box = document.querySelector("[data-lightbox]");
  var body = document.querySelector("[data-lb-body]");

  gal.querySelectorAll(".gslot").forEach(function (slot) {
    var media = slot.querySelector("img, video");
    var empty = function () { slot.classList.add("is-empty"); media.remove(); };
    var ready = function () {
      slot.classList.add("is-filled");
      slot.tabIndex = 0;
      slot.setAttribute("role", "button");
      slot.setAttribute("aria-label", "Open " + slot.getAttribute("data-label"));
    };
    if (media.tagName === "IMG") {
      if (media.complete) (media.naturalWidth ? ready : empty)();
      else { media.addEventListener("load", ready); media.addEventListener("error", empty); }
    } else {
      media.addEventListener("loadedmetadata", ready);
      media.addEventListener("error", empty);
      slot.addEventListener("mouseenter", function () { if (slot.classList.contains("is-filled")) media.play().catch(function () {}); });
      slot.addEventListener("mouseleave", function () { if (media.pause) media.pause(); });
    }
  });

  function open(slot) {
    if (!slot.classList.contains("is-filled") || !box) return;
    var m = slot.querySelector("img, video");
    body.innerHTML = "";
    var el;
    if (m.tagName === "IMG") {
      el = document.createElement("img");
      el.src = m.src;
      el.alt = m.alt;
    } else {
      el = document.createElement("video");
      el.src = m.src;
      el.controls = true;
      el.autoplay = true;
      el.playsInline = true;
    }
    body.appendChild(el);
    if (box.showModal) box.showModal(); else box.setAttribute("open", "");
  }
  function close() {
    body.innerHTML = "";
    if (box.close) box.close(); else box.removeAttribute("open");
  }
  gal.addEventListener("click", function (e) { var s = e.target.closest(".gslot"); if (s) open(s); });
  gal.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { var s = e.target.closest(".gslot"); if (s) { e.preventDefault(); open(s); } }
  });
  if (box) {
    box.querySelector("[data-lb-close]").addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    box.addEventListener("close", function () { body.innerHTML = ""; });
  }

  document.querySelectorAll("[data-gfilter]").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-gfilter");
      document.querySelectorAll("[data-gfilter]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      gal.querySelectorAll(".gslot").forEach(function (s) {
        s.hidden = f !== "all" && s.getAttribute("data-kind") !== f;
      });
    });
  });
})();
