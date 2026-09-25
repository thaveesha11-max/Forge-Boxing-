/* FORGE — cosmic preloader: starfield, nebula drift and blood drips.
   The fade-out timing lives in main.js. */
(function () {
  "use strict";
  var pre = document.querySelector("[data-preloader]");
  if (!pre || document.documentElement.classList.contains("no-preloader")) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Blood drips under the words */
  pre.querySelectorAll(".pl-word").forEach(function (word, w) {
    var n = word.textContent.length > 4 ? 5 : 3;
    for (var i = 0; i < n; i++) {
      var drip = document.createElement("i");
      drip.className = "pl-drip";
      drip.style.left = (8 + Math.random() * 84).toFixed(1) + "%";
      drip.style.setProperty("--h", (18 + Math.random() * 60).toFixed(0) + "px");
      drip.style.setProperty("--w", (3 + Math.random() * 4).toFixed(1) + "px");
      drip.style.animationDelay = (0.9 + w * 0.45 + Math.random() * 0.9).toFixed(2) + "s";
      word.appendChild(drip);
    }
  });

  /* Starfield */
  var canvas = pre.querySelector("canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var W, H, stars = [], raf = 0, t0 = performance.now();
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = [];
    var n = Math.min(420, Math.round((W * H) / 3500));
    for (var i = 0; i < n; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), tw: Math.random() * 6.28 });
    }
  }
  function frame(now) {
    var t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    var cx = W / 2, cy = H / 2;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      // slow warp outward from the centre
      var k = reduced ? 1 : 1 + t * 0.02 * (0.3 + s.z);
      var x = cx + (s.x - cx) * k, y = cy + (s.y - cy) * k;
      var a = 0.25 + 0.75 * s.z * (0.6 + 0.4 * Math.sin(t * 2 + s.tw));
      ctx.fillStyle = s.z > 0.93 ? "rgba(255,120,120," + a + ")" : "rgba(235,235,255," + a + ")";
      ctx.fillRect(x, y, s.z > 0.8 ? 1.8 : 1.1, s.z > 0.8 ? 1.8 : 1.1);
    }
    if (!pre.classList.contains("is-done") && !reduced) raf = requestAnimationFrame(frame);
  }
  resize();
  window.addEventListener("resize", resize);
  raf = requestAnimationFrame(frame);
  pre.addEventListener("transitionend", function () { cancelAnimationFrame(raf); });
})();
