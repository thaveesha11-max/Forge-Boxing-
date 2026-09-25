/* FORGE — timetable page and the home page "next sessions" board.
   Reads FORGE.hours from data.js. */
(function () {
  "use strict";
  if (!window.FORGE || !FORGE.hours || !FORGE.util) return;

  var U = FORGE.util;
  var H = FORGE.hours;
  var WEEK = [1, 2, 3, 4, 5, 6, 0];

  function sessions(d) {
    return (H[d] || []).map(function (r) {
      return { start: U.toMin(r[0]), end: U.toMin(r[1]) };
    });
  }
  function label(s) {
    if (s.start < 12 * 60) return "Morning session";
    if (s.start < 17 * 60) return "Afternoon session";
    return "Evening session";
  }
  function range(s) {
    return U.fmtTime(s.start, { short: true }) + " – " + U.fmtTime(s.end, { short: true });
  }
  function hrs(m) {
    return m % 60 ? (m / 60).toFixed(1) + " hrs" : m / 60 + (m === 60 ? " hr" : " hrs");
  }
  function state(s, isToday, mins) {
    if (!isToday) return "";
    if (mins >= s.end) return "past";
    if (mins >= s.start) return "now";
    return "later";
  }
  function nowMin() {
    var n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }

  /* Totals shown in page copy */
  var total = 0, minutes = 0;
  WEEK.forEach(function (d) {
    sessions(d).forEach(function (s) { total++; minutes += s.end - s.start; });
  });
  document.querySelectorAll("[data-count-sessions]").forEach(function (el) { el.textContent = total; });
  document.querySelectorAll("[data-count-hours]").forEach(function (el) { el.textContent = minutes / 60; });

  /* ---------------------------------------------------------------
     Home: next sessions board
     --------------------------------------------------------------- */
  var board = document.querySelector("[data-today]");
  function renderBoard() {
    if (!board) return;
    var now = new Date();
    var mins = nowMin();
    var rows = [];
    for (var i = 0; i < 7 && rows.length < 4; i++) {
      var d = (now.getDay() + i) % 7;
      sessions(d).forEach(function (s) {
        if (rows.length >= 4) return;
        var st = state(s, i === 0, mins);
        if (st === "past") return;
        var day = i === 0 ? "Today" : i === 1 ? "Tomorrow" : U.DAY[d];
        rows.push(
          '<li class="board-row' + (st === "now" ? " is-now" : "") + '">' +
            '<span class="board-time">' + U.fmtTime(s.start, { parts: true }).time + "<small>" + U.fmtTime(s.start, { parts: true }).suffix + " · " + hrs(s.end - s.start) + "</small></span>" +
            '<span class="board-name"><strong>' + day + "</strong><span>" + label(s) + " · " + range(s) + "</span></span>" +
            '<span class="board-side"><span class="chip-when' + (st === "now" ? " now" : "") + '">' + (st === "now" ? "On now" : i === 0 ? "Today" : U.DAY_SHORT[d]) + "</span></span>" +
          "</li>"
        );
      });
    }
    board.querySelector("[data-today-list]").innerHTML = rows.join("") || '<li class="board-empty">No sessions scheduled.</li>';
  }
  renderBoard();
  if (board) window.setInterval(renderBoard, 60000);

  /* ---------------------------------------------------------------
     Timetable page: day cards
     --------------------------------------------------------------- */
  var cards = document.querySelector("[data-timetable]");
  function renderCards() {
    if (!cards) return;
    var today = new Date().getDay();
    var mins = nowMin();
    cards.innerHTML = WEEK.map(function (d) {
      var list = sessions(d);
      var isToday = d === today;
      var body = list.length
        ? list.map(function (s) {
            var st = state(s, isToday, mins);
            return (
              '<li class="slot slot-' + (s.start < 12 * 60 ? "am" : s.start < 17 * 60 ? "pm" : "eve") + (st ? " is-" + st : "") + '">' +
                '<span class="slot-kind label">' + label(s) + "</span>" +
                '<span class="slot-time">' + U.fmtTime(s.start, { short: true }) + '<span aria-hidden="true"> → </span><span class="sr-only"> to </span>' + U.fmtTime(s.end, { short: true }) + "</span>" +
                '<span class="slot-meta">' + hrs(s.end - s.start) + (st === "now" ? ' · <b>On now</b>' : st === "past" ? " · Finished" : "") + "</span>" +
              "</li>"
            );
          }).join("")
        : '<li class="slot slot-rest"><span class="slot-kind label">Rest day</span><span class="slot-time">Recover.</span><span class="slot-meta">Come back stronger Monday</span></li>';
      return (
        '<article class="day' + (isToday ? " is-today" : "") + (list.length ? "" : " is-rest") + '">' +
          '<header class="day-head"><h2>' + U.DAY[d] + "</h2>" + (isToday ? '<span class="tag tag-hot">Today</span>' : '<span class="day-count">' + (list.length ? list.length + (list.length > 1 ? " sessions" : " session") : "Closed") + "</span>") + "</header>" +
          '<ul class="day-slots" role="list">' + body + "</ul>" +
        "</article>"
      );
    }).join("");
  }

  /* Timetable page: week at a glance, drawn to scale (8 AM – 10 PM) */
  var chart = document.querySelector("[data-weekchart]");
  var FROM = 8 * 60, TO = 22 * 60;
  function pct(m) { return ((m - FROM) / (TO - FROM)) * 100; }
  function renderChart() {
    if (!chart) return;
    var today = new Date().getDay();
    var ticks = "";
    for (var h = 8; h <= 22; h += 2) {
      ticks += '<span style="left:' + pct(h * 60) + '%">' + U.fmtTime(h * 60, { short: true }).replace(" ", "") + "</span>";
    }
    var now = new Date();
    var m = nowMin();
    var nowLine = m >= FROM && m <= TO ? '<i class="wk-now" style="left:' + pct(m) + '%"></i>' : "";
    chart.innerHTML =
      '<div class="wk-axis" aria-hidden="true"><span></span><div class="wk-ticks">' + ticks + "</div></div>" +
      WEEK.map(function (d) {
        var bars = sessions(d).map(function (s) {
          return '<span class="wk-bar" style="left:' + pct(s.start) + "%;width:" + (pct(s.end) - pct(s.start)) + '%" title="' + range(s) + '"><em>' + range(s) + "</em></span>";
        }).join("");
        return (
          '<div class="wk-row' + (d === now.getDay() ? " is-today" : "") + '"><span class="wk-day">' + U.DAY_SHORT[d] + "</span>" +
          '<div class="wk-track">' + bars + (d === today ? nowLine : "") + (bars ? "" : '<span class="wk-rest">Rest day</span>') + "</div></div>"
        );
      }).join("");
  }
  renderCards();
  renderChart();
  if (cards || chart) window.setInterval(function () { renderCards(); renderChart(); }, 60000);
})();
