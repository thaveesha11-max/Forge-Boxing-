/* FORGE — timetable, "Today at Forge", next sessions, coach classes,
   and the first-class picker on the booking form. Reads data.js. */
(function () {
  "use strict";
  if (!window.FORGE || !FORGE.schedule || !FORGE.util) return;

  var U = FORGE.util;
  var P = FORGE.programs;
  var C = FORGE.coaches;
  var WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first

  function byTime(a, b) {
    return U.toMin(a.t) - U.toMin(b.t);
  }
  function classesOn(day) {
    return FORGE.schedule.filter(function (c) { return c.d === day; }).sort(byTime);
  }
  function nowMin(date) {
    return date.getHours() * 60 + date.getMinutes();
  }
  function dateLabel(date) {
    return U.DAY_SHORT[date.getDay()] + " " + date.getDate() + " " + U.MONTH_SHORT[date.getMonth()];
  }
  function addDays(date, n) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + n);
    return d;
  }
  function ymd(date) {
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return date.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
  }
  // Upcoming sessions from now, across the next `days` days.
  function upcoming(filter, days, limit) {
    var now = new Date();
    var out = [];
    for (var i = 0; i < days; i++) {
      var date = addDays(now, i);
      classesOn(date.getDay()).forEach(function (c) {
        if (i === 0 && U.toMin(c.t) <= nowMin(now)) return;
        if (filter && !filter(c)) return;
        out.push({ c: c, date: date });
      });
      if (limit && out.length >= limit) break;
    }
    return limit ? out.slice(0, limit) : out;
  }

  /* ---------------------------------------------------------------
     Today at Forge (home)
     --------------------------------------------------------------- */
  var board = document.querySelector("[data-today]");
  function renderToday() {
    if (!board) return;
    var now = new Date();
    var mins = nowMin(now);
    var list = classesOn(now.getDay());
    var label = "Today";
    var dayName = U.DAY[now.getDay()];
    var isToday = true;
    var remaining = list.filter(function (c) { return U.toMin(c.t) + c.m > mins; });

    if (!remaining.length) {
      for (var i = 1; i <= 7; i++) {
        var next = addDays(now, i);
        var l = classesOn(next.getDay());
        if (l.length) {
          list = l;
          dayName = U.DAY[next.getDay()];
          label = i === 1 ? "Tomorrow" : dayName;
          isToday = false;
          break;
        }
      }
    }

    var rows = list.map(function (c) {
      var start = U.toMin(c.t);
      var end = start + c.m;
      var state = "later";
      var when = "";
      if (isToday) {
        if (end <= mins) { state = "past"; when = "Finished"; }
        else if (start <= mins) { state = "now"; when = "On now"; }
        else {
          var diff = start - mins;
          when = diff < 60 ? "In " + diff + " min" : diff < 180 ? "In " + Math.floor(diff / 60) + "h " + (diff % 60 ? (diff % 60) + "m" : "") : "Later";
          if (diff < 60) state = "soon";
        }
      } else {
        when = dayName.slice(0, 3);
      }
      var p = P[c.p];
      var parts = U.fmtTime(start, { parts: true });
      return (
        '<li class="board-row' + (state === "past" ? " is-past" : "") + (state === "now" ? " is-now" : "") + '">' +
          '<span class="board-time">' + parts.time + "<small>" + parts.suffix + " · " + c.m + " min</small></span>" +
          '<span class="board-name"><strong>' + U.esc(p.name) + "</strong><span>Coach " + U.esc(C[c.c]) + " · " + U.esc(p.level) + "</span></span>" +
          '<span class="board-side">' + U.heatHTML(p.heat, "sm") +
            '<span class="chip-when' + (state === "now" || state === "soon" ? " now" : "") + '">' + when + "</span></span>" +
        "</li>"
      );
    });

    board.querySelector("[data-today-label]").textContent = label + " · " + dayName;
    board.querySelector("[data-today-list]").innerHTML = rows.length
      ? rows.join("")
      : '<li class="board-empty">No classes scheduled.</li>';
  }
  renderToday();
  if (board) window.setInterval(renderToday, 60 * 1000);

  /* ---------------------------------------------------------------
     Weekly timetable (schedule page)
     --------------------------------------------------------------- */
  var tt = document.querySelector("[data-timetable]");
  if (tt) {
    var chipsEl = document.querySelector("[data-tt-chips]");
    var beginnerEl = document.querySelector("[data-tt-beginner]");
    var daysEl = document.querySelector("[data-tt-days]");
    var countEl = document.querySelector("[data-tt-count]");
    var coachEl = document.querySelector("[data-tt-coach]");
    var params = new URLSearchParams(window.location.search);
    var state = {
      program: P[params.get("program")] ? params.get("program") : "all",
      coach: C[params.get("coach")] ? params.get("coach") : null,
      beginner: false,
      day: new Date().getDay(),
    };

    // Filter chips
    var keys = Object.keys(P);
    chipsEl.innerHTML =
      '<button type="button" class="chip" data-program="all">All classes</button>' +
      keys.map(function (k) {
        return '<button type="button" class="chip" data-program="' + k + '">' + U.esc(P[k].name) + "</button>";
      }).join("");
    chipsEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-program]");
      if (!b) return;
      state.program = b.getAttribute("data-program");
      paint();
    });
    if (beginnerEl) {
      beginnerEl.addEventListener("change", function () {
        state.beginner = beginnerEl.checked;
        paint();
      });
    }
    if (coachEl) {
      coachEl.addEventListener("click", function () {
        state.coach = null;
        paint();
      });
    }

    // Day tabs (small screens)
    var monday = addDays(new Date(), -((new Date().getDay() + 6) % 7));
    daysEl.innerHTML = WEEK.map(function (d, i) {
      var date = addDays(monday, i);
      var today = d === new Date().getDay();
      return (
        '<button type="button" role="tab" id="tab-' + d + '" aria-controls="day-' + d + '" data-day="' + d + '"' +
        (today ? ' class="is-today"' : "") + ">" +
        "<b>" + U.DAY_SHORT[d] + "</b><span>" + date.getDate() + "</span></button>"
      );
    }).join("");
    daysEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-day]");
      if (!b) return;
      state.day = parseInt(b.getAttribute("data-day"), 10);
      paint();
    });
    daysEl.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var i = WEEK.indexOf(state.day);
      i = (i + (e.key === "ArrowRight" ? 1 : 6)) % 7;
      state.day = WEEK[i];
      paint();
      daysEl.querySelector('[data-day="' + state.day + '"]').focus();
    });

    function matches(c) {
      if (state.program !== "all" && c.p !== state.program) return false;
      if (state.coach && c.c !== state.coach) return false;
      if (state.beginner && !P[c.p].beginner) return false;
      return true;
    }

    function paint() {
      var now = new Date();
      var mins = nowMin(now);
      var total = 0;
      var shown = 0;

      tt.innerHTML = WEEK.map(function (d, i) {
        var date = addDays(monday, i);
        var isToday = d === now.getDay();
        var items = classesOn(d);
        total += items.length;
        var visible = items.filter(matches);
        shown += visible.length;
        var lis = visible.map(function (c) {
          var p = P[c.p];
          var start = U.toMin(c.t);
          var parts = U.fmtTime(start, { parts: true });
          var cls = "tt-class";
          if (isToday && start + c.m <= mins) cls += " is-past";
          else if (isToday && start <= mins) cls += " is-now";
          return (
            '<li class="' + cls + '">' +
              '<span class="time">' + parts.time + "<small>" + parts.suffix + "</small></span>" +
              '<span class="name"><a href="programs.html#' + c.p + '">' + U.esc(p.name) + "</a></span>" +
              '<span class="coach">' + U.esc(C[c.c]) + " · " + c.m + " min</span>" +
              '<span class="meta">' + U.heatHTML(p.heat, "sm") + (isToday && cls.indexOf("is-now") > -1 ? '<span class="chip-when now">On now</span>' : "") + "</span>" +
            "</li>"
          );
        }).join("");
        return (
          '<section class="tt-col' + (isToday ? " is-today" : "") + (d === state.day ? " is-selected" : "") +
            '" id="day-' + d + '" role="tabpanel" aria-labelledby="tab-' + d + '">' +
            '<div class="tt-head"><h2>' + U.DAY_SHORT[d] + "</h2><span>" + (isToday ? "Today" : date.getDate() + " " + U.MONTH_SHORT[date.getMonth()]) + "</span></div>" +
            '<ul class="tt-list">' + (lis || '<li class="tt-empty">No matching classes.</li>') + "</ul>" +
          "</section>"
        );
      }).join("");

      chipsEl.querySelectorAll("[data-program]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-program") === state.program));
      });
      daysEl.querySelectorAll("[data-day]").forEach(function (b) {
        var sel = parseInt(b.getAttribute("data-day"), 10) === state.day;
        b.setAttribute("aria-selected", String(sel));
        b.tabIndex = sel ? 0 : -1;
      });
      if (coachEl) {
        coachEl.hidden = !state.coach;
        if (state.coach) coachEl.querySelector("span").textContent = "Coach: " + C[state.coach];
      }
      if (countEl) {
        countEl.textContent = shown === total ? "Showing all " + total + " classes this week" : "Showing " + shown + " of " + total + " classes";
      }
    }
    paint();
    window.setInterval(paint, 60 * 1000);
  }

  /* ---------------------------------------------------------------
     Next sessions for a program (programs page)
     --------------------------------------------------------------- */
  document.querySelectorAll("[data-next]").forEach(function (el) {
    var key = el.getAttribute("data-next");
    var items = upcoming(function (c) { return c.p === key; }, 14, 3);
    if (!items.length) return;
    var now = new Date();
    el.innerHTML = items.map(function (it) {
      var sameDay = ymd(it.date) === ymd(now);
      var tomorrow = ymd(it.date) === ymd(addDays(now, 1));
      var day = sameDay ? "Today" : tomorrow ? "Tomorrow" : dateLabel(it.date);
      return (
        '<li><span class="when">' + day + "</span>" +
        '<span class="tnum">' + U.fmtTime(it.c.t) + ' <span class="who">with ' + U.esc(C[it.c.c]) + "</span></span>" +
        '<span class="muted tnum">' + it.c.m + " min</span></li>"
      );
    }).join("");
  });

  /* ---------------------------------------------------------------
     Which classes each coach runs (coaches page)
     --------------------------------------------------------------- */
  document.querySelectorAll("[data-coach-classes]").forEach(function (el) {
    var key = el.getAttribute("data-coach-classes");
    var seen = {};
    FORGE.schedule.filter(function (c) { return c.c === key; }).forEach(function (c) {
      (seen[c.p] = seen[c.p] || []).push(c.d);
    });
    el.innerHTML = Object.keys(seen).map(function (p) {
      var days = seen[p]
        .filter(function (d, i, a) { return a.indexOf(d) === i; })
        .sort(function (a, b) { return WEEK.indexOf(a) - WEEK.indexOf(b); })
        .map(function (d) { return U.DAY_SHORT[d]; })
        .join(" · ");
      return '<span class="tag tag-line">' + U.esc(P[p].name) + " — " + days + "</span>";
    }).join("");
  });

  /* ---------------------------------------------------------------
     Booking form: pick a first class
     --------------------------------------------------------------- */
  var picker = document.querySelector("[data-trial-select]");
  if (picker) {
    var sessions = upcoming(function (c) { return P[c.p].beginner; }, 14);
    var groups = {};
    var order = [];
    sessions.forEach(function (s) {
      var key = ymd(s.date);
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(s);
    });
    var html = '<option value="">Choose a class</option>';
    order.forEach(function (key) {
      var first = groups[key][0];
      html += '<optgroup label="' + U.DAY[first.date.getDay()] + " " + first.date.getDate() + " " + U.MONTH_SHORT[first.date.getMonth()] + '">';
      groups[key].forEach(function (s) {
        var label = U.fmtTime(s.c.t) + " · " + P[s.c.p].name + " with " + C[s.c.c];
        var value = key + " " + s.c.t + " | " + P[s.c.p].name + " | " + C[s.c.c] + " | " + s.c.m;
        html += '<option value="' + U.esc(value) + '" data-program="' + s.c.p + '">' + U.esc(label) + "</option>";
      });
      html += "</optgroup>";
    });
    html += '<option value="undecided">Not sure yet, call me</option>';
    picker.innerHTML = html;
  }

  FORGE.sched = { upcoming: upcoming, classesOn: classesOn, dateLabel: dateLabel };
})();
