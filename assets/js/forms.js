/* FORGE — enquiry form. Validates in place, then POSTs to
   FORGE.config.formEndpoint, or opens the visitor's email app. */
(function () {
  "use strict";
  var form = document.querySelector("[data-enquiry]");
  if (!form || !window.FORGE) return;
  var cfg = FORGE.config || {};
  var statusEl = form.querySelector("[data-form-status]");
  var submitBtn = form.querySelector("[data-submit]");
  var done = document.querySelector("[data-confirm]");
  var tried = false;

  var wanted = new URLSearchParams(window.location.search).get("interest");
  var sel = form.elements.interest;
  if (wanted && sel.querySelector('option[value="' + wanted + '"]')) sel.value = wanted;

  var checks = {
    name: function () { return form.elements.name.value.trim() ? "" : "Enter your name."; },
    contact: function () {
      var e = form.elements.email.value.trim(), p = form.elements.phone.value.trim();
      if (!e && !p) return "Add a phone number or an email so we can reply.";
      if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return "Enter an email address like name@example.com.";
      return "";
    },
  };
  function validate() {
    var first = null;
    Object.keys(checks).forEach(function (k) {
      var msg = checks[k]();
      var err = document.getElementById(k + "-error");
      err.textContent = msg;
      err.closest(".field").classList.toggle("has-error", !!msg);
      if (msg && !first) first = k === "contact" ? form.elements.phone : form.elements[k];
    });
    return first;
  }
  form.addEventListener("input", function () { if (tried) validate(); });

  function show(mode, href) {
    var title = done.querySelector("[data-confirm-title]");
    var text = done.querySelector("[data-confirm-text]");
    var again = done.querySelector("[data-mailto]");
    if (mode === "mailto") {
      title.textContent = "One more step.";
      text.textContent = "Your email app should open with your message filled in. Press send and we’ll get back to you. If nothing opened, call or WhatsApp " + cfg.phoneDisplay + ".";
      again.href = href;
      again.hidden = false;
    } else {
      title.textContent = "Message received.";
      text.textContent = "Thanks, " + form.elements.name.value.trim().split(" ")[0] + ". We’ll be in touch soon.";
    }
    form.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });
    done.scrollIntoView({ block: "center", behavior: FORGE.util.reduced ? "auto" : "smooth" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    tried = true;
    if (form.elements._gotcha.value) return;
    var bad = validate();
    if (bad) {
      statusEl.textContent = "Some details are missing. Check the highlighted fields.";
      bad.focus();
      return;
    }
    statusEl.textContent = "";
    var data = {
      _subject: "Forge enquiry: " + sel.options[sel.selectedIndex].text,
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      email: form.elements.email.value.trim(),
      interest: sel.options[sel.selectedIndex].text,
      message: form.elements.message.value.trim(),
    };
    if (!cfg.formEndpoint) {
      var body = ["Name: " + data.name, "Phone: " + (data.phone || "-"), "Email: " + (data.email || "-"), "Interested in: " + data.interest, "", data.message].join("\n");
      var href = "mailto:" + cfg.email + "?subject=" + encodeURIComponent(data._subject) + "&body=" + encodeURIComponent(body);
      show("mailto", href);
      window.location.href = href;
      return;
    }
    submitBtn.disabled = true;
    fetch(cfg.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); show("sent"); })
      .catch(function () { statusEl.textContent = "We couldn’t send that just now. Try again, or call " + cfg.phoneDisplay + "."; })
      .then(function () { submitBtn.disabled = false; });
  });
})();
