/* FORGE — the heavy bag in the home hero.
   A damped pendulum with a squash spring. Hit it (pointer or the
   "Throw a punch" button) and it swings, throws sparks and reads out
   an impact number. Works with touch, mouse and keyboard. */
(function () {
  "use strict";
  var stage = document.querySelector("[data-bag]");
  if (!stage) return;

  var pivot = stage.querySelector("#bag-pivot");
  var bodyG = stage.querySelector("#bag-body");
  var shadow = stage.querySelector("#bag-shadow");
  var canvas = stage.querySelector(".bag-sparks");
  var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  var forceEl = stage.querySelector("[data-bag-force]");
  var comboEl = stage.querySelector("[data-bag-combo]");
  var bestEl = stage.querySelector("[data-bag-best]");
  var callEl = stage.querySelector("[data-bag-call]");
  var btn = stage.querySelector("[data-bag-punch]");
  var liveEl = stage.querySelector("[data-bag-live]");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var K = 9.5;       // gravity / length — a ~2 s swing, like a real 100 lb bag
  var DAMP = 0.8;
  var theta = 0, omega = 0, sq = 0, sqv = 0;
  var last = 0, raf = 0, running = false, onScreen = true;
  var sparks = [], flashes = [];
  var combo = 0, lastHit = 0, best = 0, side = 1;
  var shown = 0, target = 0;
  var W = 0, H = 0, dpr = 1;
  var CALLS = ["1 · Jab", "2 · Cross", "3 · Hook", "2 · Cross", "5 · Uppercut", "6 · Uppercut", "3 · Hook", "4 · Hook"];

  function resize() {
    if (!ctx) return;
    var r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function fmt(n) {
    return Math.round(n).toLocaleString("en-US");
  }

  function spawnSparks(x, y, dir, power) {
    if (!ctx || reduced) return;
    var n = Math.round(18 + power * 22);
    for (var i = 0; i < n; i++) {
      // Sparks fly back toward the puncher, fanned and slightly upward
      var a = (dir > 0 ? Math.PI : 0) + (Math.random() - 0.5) * 1.9 - 0.35 * (dir > 0 ? -1 : 1);
      var s = 180 + Math.random() * 520 * power;
      sparks.push({
        x: x, y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 120 * Math.random(),
        life: 0,
        max: 0.28 + Math.random() * 0.55,
        w: 0.8 + Math.random() * 1.6,
      });
    }
    flashes.push({ x: x, y: y, life: 0, max: 0.34 });
  }

  function heatColor(k, alpha) {
    // white-hot → yellow → orange → cherry as a spark cools
    var stops = [[255, 255, 255], [255, 90, 90], [225, 6, 0], [140, 0, 15]];
    var f = Math.min(2.999, k * 3);
    var i = Math.floor(f), t = f - i, a = stops[i], b = stops[i + 1];
    return "rgba(" + Math.round(a[0] + (b[0] - a[0]) * t) + "," + Math.round(a[1] + (b[1] - a[1]) * t) + "," + Math.round(a[2] + (b[2] - a[2]) * t) + "," + alpha + ")";
  }

  function drawFX(dt) {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (!sparks.length && !flashes.length) return;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (var i = flashes.length - 1; i >= 0; i--) {
      var f = flashes[i];
      f.life += dt;
      var k = f.life / f.max;
      if (k >= 1) { flashes.splice(i, 1); continue; }
      var r = 8 + k * 70;
      var g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      g.addColorStop(0, "rgba(255,255,255," + (1 - k) * 0.9 + ")");
      g.addColorStop(0.35, "rgba(255,60,60," + (1 - k) * 0.45 + ")");
      g.addColorStop(1, "rgba(225,6,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, 6.2832);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,60,60," + (1 - k) * 0.7 + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 10 + k * 90, 0, 6.2832);
      ctx.stroke();
    }
    for (var j = sparks.length - 1; j >= 0; j--) {
      var p = sparks[j];
      p.life += dt;
      var q = p.life / p.max;
      if (q >= 1) { sparks.splice(j, 1); continue; }
      p.vy += 1100 * dt;
      p.vx *= 0.985;
      var px = p.x, py = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.strokeStyle = heatColor(q, 1 - q * q);
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.moveTo(px - p.vx * 0.018, py - p.vy * 0.018);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function frame(now) {
    var dt = last ? Math.min(0.033, (now - last) / 1000) : 0.016;
    last = now;
    var sway = reduced ? 0 : 0.05 * Math.sin(now / 1000 * 1.05);
    var alpha = -K * Math.sin(theta) - DAMP * omega + sway;
    omega += alpha * dt;
    theta += omega * dt;
    var sqa = -280 * sq - 15 * sqv;
    sqv += sqa * dt;
    sq += sqv * dt;

    pivot.setAttribute("transform", "rotate(" + (theta * 57.29578).toFixed(3) + " 160 0)");
    bodyG.setAttribute(
      "transform",
      "translate(160 480) scale(" + (1 + sq).toFixed(4) + " " + (1 - sq * 0.55).toFixed(4) + ") translate(-160 -480)"
    );
    if (shadow) {
      var sx = Math.sin(theta) * 700;
      var sc = Math.max(0.5, 1 - Math.abs(theta) * 0.8);
      shadow.setAttribute("transform", "translate(" + (160 + sx).toFixed(2) + " 748) scale(" + sc.toFixed(3) + " 1)");
    }
    if (Math.abs(target - shown) > 0.5) {
      shown += (target - shown) * 0.22;
      if (forceEl) forceEl.textContent = fmt(shown);
    }
    drawFX(dt);

    var busy = Math.abs(omega) > 0.002 || Math.abs(sqv) > 0.002 || sparks.length || flashes.length || Math.abs(target - shown) > 0.5;
    if ((reduced && !busy) || !onScreen || document.hidden) {
      running = false;
      last = 0;
      return;
    }
    raf = window.requestAnimationFrame(frame);
  }

  function run() {
    if (running) return;
    running = true;
    raf = window.requestAnimationFrame(frame);
  }

  function punch(x, y, dir) {
    var now = window.performance.now();
    combo = now - lastHit < 800 ? combo + 1 : 1;
    lastHit = now;
    var power = 0.55 + Math.random() * 0.35 + Math.min(combo, 8) * 0.03;
    omega = Math.max(-2.4, Math.min(2.4, omega + dir * power));
    sqv += 2.8 * power;
    var force = Math.round((820 + Math.random() * 760 + Math.min(combo, 10) * 85) / 10) * 10;
    target = force;
    if (force > best) {
      best = force;
      if (bestEl) bestEl.textContent = fmt(best);
    }
    if (comboEl) comboEl.textContent = "×" + combo;
    if (callEl) {
      callEl.textContent = CALLS[(combo - 1) % CALLS.length];
      callEl.classList.remove("is-on");
      void callEl.offsetWidth;
      callEl.classList.add("is-on");
    }
    if (liveEl) liveEl.textContent = "Impact " + fmt(force) + " newtons. Combo " + combo + ".";
    spawnSparks(x, y, dir, power);
    if (navigator.vibrate) {
      try { navigator.vibrate(12); } catch (e) { /* not supported */ }
    }
    stage.classList.add("was-hit");
    run();
  }

  stage.addEventListener("pointerdown", function (e) {
    if (e.button && e.button !== 0) return;
    if (e.target.closest("button, a")) return;
    var sr = stage.getBoundingClientRect();
    var br = bodyG.getBoundingClientRect();
    var cx = (br.left + br.right) / 2;
    var dir = e.clientX < cx ? 1 : -1;
    var inside = e.clientX >= br.left && e.clientX <= br.right;
    var x = inside ? e.clientX : dir > 0 ? br.left + 8 : br.right - 8;
    var y = Math.min(Math.max(e.clientY, br.top + 40), br.bottom - 30);
    punch(x - sr.left, y - sr.top, dir);
  });

  if (btn) {
    btn.addEventListener("click", function () {
      side = -side;
      var sr = stage.getBoundingClientRect();
      var br = bodyG.getBoundingClientRect();
      var x = side > 0 ? br.left + 10 : br.right - 10;
      var y = br.top + br.height * (0.38 + Math.random() * 0.2);
      punch(x - sr.left, y - sr.top, side);
    });
  }

  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && onScreen && !reduced) run();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen && !reduced) run();
    }).observe(stage);
  }
  if (!reduced) run();
})();
