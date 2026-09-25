/* FORGE — free-class booking form.
   Validates in place, then either POSTs to FORGE.config.formEndpoint
   or, if no endpoint is set, opens the visitor's email app with the
   booking filled in. Runs after data.js, main.js and schedule.js. */
(function () {
  "use strict";
  var form = document.querySelector("[data-booking]");
  if (!form || !window.FORGE) return;

  var U = FORGE.util;
  var cfg = FORGE.config || {};
  var confirmEl = document.querySelector("[data-confirm]");
  var statusEl = form.querySelector("[data-form-status]");
  var submitBtn = form.querySelector("[data-submit]");
  var programSel = form.querySelector("#program");
  var classSel = form.querySelector("#first-class");
  var params = new URLSearchParams(window.location.search);
  var plan = params.get("plan") || "";
  var tried = false;

  /* Preselect from links like contact.html?program=womens */
  function suggestClass() {
    if (classSel.value) return;
    var opt = classSel.querySelector('option[data-program="' + programSel.value + '"]');
    if (opt) classSel.value = opt.value;
  }
  var wanted = params.get("program");
  if (wanted && programSel.querySelector('option[value="' + wanted + '"]')) {
    programSel.value = wanted;
    suggestClass();
  }
  programSel.addEventListener("change", suggestClass);

  /* Validation */
  var checks = {
    "first-name": function () {
      return form.elements.first_name.value.trim() ? "" : "Enter your first name.";
    },
    email: function () {
      var v = form.elements.email.value.trim();
      if (!v) return "Enter your email address.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Enter an email address like name@example.com.";
    },
    experience: function () {
      return form.querySelector('input[name="experience"]:checked') ? "" : "Choose your boxing experience.";
    },
    "first-class": function () {
      return classSel.value ? "" : "Choose a class, or pick “Not sure yet, call me”.";
    },
    waiver: function () {
      return form.elements.waiver.checked ? "" : "Tick this box to confirm you’ll complete the waiver.";
    },
  };
  var focusTarget = {
    experience: function () { return form.querySelector("#exp-none"); },
  };

  function setError(key, msg) {
    var err = document.getElementById(key + "-error");
    if (!err) return;
    var field = err.closest(".field");
    err.textContent = msg;
    if (field) field.classList.toggle("has-error", !!msg);
    var input = document.getElementById(key);
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function validate() {
    var first = null;
    Object.keys(checks).forEach(function (key) {
      var msg = checks[key]();
      setError(key, msg);
      if (msg && !first) first = focusTarget[key] ? focusTarget[key]() : document.getElementById(key);
    });
    return first;
  }

  form.addEventListener("input", function () {
    if (tried) validate();
  });
  form.addEventListener("change", function () {
    if (tried) validate();
  });

  /* Helpers */
  function parseClass(value) {
    if (!value || value === "undecided") return null;
    var parts = value.split(" | ");
    var dt = parts[0].split(" ");
    var d = dt[0].split("-").map(Number);
    var t = dt[1].split(":").map(Number);
    return {
      start: new Date(d[0], d[1] - 1, d[2], t[0], t[1]),
      name: parts[1],
      coach: parts[2],
      mins: parseInt(parts[3], 10) || 60,
    };
  }
  function whenLabel(c) {
    var s = c.start;
    return U.DAY_SHORT[s.getDay()] + " " + s.getDate() + " " + U.MONTH_SHORT[s.getMonth()] + ", " + U.fmtTime(s.getHours() * 60 + s.getMinutes());
  }
  function collect() {
    var c = parseClass(classSel.value);
    var exp = form.querySelector('input[name="experience"]:checked');
    var name = (form.elements.first_name.value.trim() + " " + form.elements.last_name.value.trim()).trim();
    return {
      _subject: "Free class booking: " + name,
      name: name,
      first_name: form.elements.first_name.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      experience: exp ? exp.value : "",
      interested_in: programSel.options[programSel.selectedIndex].text,
      first_class: c ? c.name + ", " + whenLabel(c) + " with " + c.coach : "Not sure yet, please call",
      notes: form.elements.notes.value.trim(),
      newsletter: form.elements.newsletter.checked ? "yes" : "no",
      plan: plan,
      _class: c,
    };
  }
  function mailtoHref(data) {
    var lines = [
      "Hi Forge, I'd like to book my free class.",
      "",
      "Name: " + data.name,
      "Email: " + data.email,
      "Phone: " + (data.phone || "-"),
      "Experience: " + data.experience,
      "Interested in: " + data.interested_in,
      "Free class: " + data.first_class,
      "Newsletter: " + data.newsletter,
    ];
    if (data.plan) lines.push("Plan: " + data.plan);
    if (data.notes) lines.push("", "Notes: " + data.notes);
    return "mailto:" + cfg.email + "?subject=" + encodeURIComponent(data._subject) + "&body=" + encodeURIComponent(lines.join("\n"));
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function icsStamp(d, utc) {
    if (utc) {
      return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + "00Z";
    }
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00";
  }
  function downloadICS(c) {
    var end = new Date(c.start.getTime() + c.mins * 60000);
    var ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Forge Boxing Club//Free class//EN",
      "BEGIN:VEVENT",
      "UID:" + Date.now() + "@forgeboxing.example",
      "DTSTAMP:" + icsStamp(new Date(), true),
      "DTSTART:" + icsStamp(c.start),
      "DTEND:" + icsStamp(end),
      "SUMMARY:Free class: " + c.name + " at Forge",
      "LOCATION:88 Foundry Road\\, Unit 4\\, Northside",
      "DESCRIPTION:Arrive 15 minutes early so we can wrap your hands. Bring water\\, flat trainers and a towel.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    var url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    var a = document.createElement("a");
    a.href = url;
    a.download = "forge-free-class.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function showConfirm(data, mode, href) {
    var c = data._class;
    confirmEl.querySelector("[data-t-name]").textContent = data.name;
    confirmEl.querySelector("[data-t-class]").textContent = c ? c.name : "To be arranged";
    confirmEl.querySelector("[data-t-when]").textContent = c ? whenLabel(c) : "We’ll call you";
    confirmEl.querySelector("[data-t-coach]").textContent = c ? c.coach : "Any coach";
    var title = confirmEl.querySelector("[data-confirm-title]");
    var text = confirmEl.querySelector("[data-confirm-text]");
    var again = confirmEl.querySelector("[data-mailto]");
    if (mode === "mailto") {
      title.textContent = "One more step.";
      text.textContent =
        "Your email app should open with your booking filled in. Press send and we’ll confirm your spot. If nothing opened, email " +
        cfg.email + " or call " + (cfg.phoneDisplay || cfg.phone) + ".";
      again.href = href;
      again.hidden = false;
    } else {
      title.textContent = "Request received.";
      text.textContent = "Thanks, " + data.first_name + ". We’ll confirm your spot by email within a few hours. Arrive 15 minutes early so we can wrap your hands.";
      again.hidden = true;
    }
    var ics = confirmEl.querySelector("[data-ics]");
    ics.hidden = !c;
    ics.onclick = c ? function () { downloadICS(c); } : null;
    form.hidden = true;
    confirmEl.hidden = false;
    confirmEl.focus({ preventScroll: true });
    confirmEl.scrollIntoView({ behavior: U.reduced ? "auto" : "smooth", block: "center" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    tried = true;
    if (form.elements._gotcha && form.elements._gotcha.value) return; // bot
    var bad = validate();
    if (bad) {
      statusEl.textContent = "Some details are missing. Check the highlighted fields.";
      bad.focus();
      return;
    }
    statusEl.textContent = "";
    var data = collect();

    if (!cfg.formEndpoint) {
      var href = mailtoHref(data);
      showConfirm(data, "mailto", href);
      window.location.href = href;
      return;
    }

    var payload = {};
    Object.keys(data).forEach(function (k) {
      if (k !== "_class") payload[k] = data[k];
    });
    submitBtn.disabled = true;
    submitBtn.firstChild.textContent = "Sending… ";
    fetch(cfg.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        showConfirm(data, "sent");
      })
      .catch(function () {
        statusEl.textContent =
          "We couldn’t send your booking just now. Try again in a minute, or call " + (cfg.phoneDisplay || cfg.phone) + ".";
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.firstChild.textContent = "Book my free class ";
      });
  });
})();
