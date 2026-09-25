/* FORGE — rising embers behind the home hero. Pauses off-screen,
   stops for reduced-motion users, caps pixel density for battery. */
(function () {
  "use strict";
  var canvas = document.querySelector("[data-embers]");
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = 1, target = 0;
  var parts = [];
  var running = false, onScreen = true, raf = 0;
  // Hot → cool, the way a spark fades
  var HOT = [
    [255, 255, 255],
    [255, 90, 90],
    [225, 6, 0],
    [140, 0, 15],
  ];

  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    target = Math.round(Math.min(150, Math.max(40, (W * H) / 9000)));
  }

  function spawn(anywhere) {
    // Bias toward the right, where the bag hangs in the glow
    var x = W * (0.25 + Math.pow(Math.random(), 0.7) * 0.8);
    return {
      x: x,
      y: anywhere ? Math.random() * H : H + 8,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(0.35 + Math.random() * 1.15),
      life: anywhere ? Math.random() * 200 : 0,
      max: 220 + Math.random() * 320,
      size: 0.5 + Math.random() * Math.random() * 2.4,
      seed: Math.random() * 1000,
      flick: 0.6 + Math.random() * 0.4,
    };
  }

  function colorAt(k) {
    var f = Math.min(HOT.length - 1.001, k * (HOT.length - 1));
    var i = Math.floor(f);
    var t = f - i;
    var a = HOT[i], b = HOT[i + 1];
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];
  }

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    while (parts.length < target) parts.push(spawn(parts.length < target * 0.8 && t < 1000));
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life += 1;
      p.vx += Math.sin((p.y + p.seed) * 0.012 + t * 0.0007) * 0.014;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      var k = p.life / p.max;
      if (k >= 1 || p.y < -12) {
        if (parts.length > target) parts.splice(i, 1);
        else parts[i] = spawn(false);
        continue;
      }
      var fade = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
      var flicker = 0.75 + 0.25 * Math.sin(t * 0.02 * p.flick + p.seed);
      var alpha = Math.max(0, fade * flicker);
      var c = colorAt(k);
      var rgb = c[0] + "," + c[1] + "," + c[2];
      if (p.size > 1.2) {
        ctx.fillStyle = "rgba(" + rgb + "," + alpha * 0.12 + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, 6.2832);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(" + rgb + "," + alpha + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    raf = window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || !onScreen || document.hidden) return;
    running = true;
    raf = window.requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    window.cancelAnimationFrame(raf);
  }

  resize();
  window.addEventListener("resize", function () {
    resize();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen) start();
      else stop();
    }).observe(canvas);
  }
  start();
})();
