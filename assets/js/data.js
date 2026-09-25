/*
 * FORGE — site data
 * ------------------------------------------------------------------
 * Edit training sessions, prices and contact details here. The
 * timetable page, the home page "next session" board, the live
 * "training now" status and the contact form all read this file.
 */
window.FORGE = window.FORGE || {};

FORGE.config = {
  // Paste a form endpoint (Formspree, Basin, Getform…) to receive
  // enquiries. Leave empty and the contact form opens the visitor's
  // email app with the message filled in instead.
  formEndpoint: "",
  email: "hello@forgeboxing.example",
  phone: "+94770000000",
  phoneDisplay: "+94 77 000 0000",
  currency: "LKR",
};

// Training sessions, keyed by JS weekday: 0 = Sunday … 6 = Saturday.
// Each entry is [start, end] in 24-hour time.
FORGE.hours = {
  0: [],
  1: [["10:00", "12:00"], ["19:00", "21:00"]],
  2: [["10:00", "12:00"]],
  3: [["10:00", "12:00"], ["19:00", "21:00"]],
  4: [["10:00", "12:00"]],
  5: [["10:00", "12:00"], ["19:00", "21:00"]],
  6: [["16:00", "18:00"]],
};
