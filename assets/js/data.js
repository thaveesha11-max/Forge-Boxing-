/*
 * FORGE — site data
 * ------------------------------------------------------------------
 * One place to edit the timetable, opening hours, programs, coaches
 * and form settings. Every page reads from this file, so a change
 * here updates the timetable, the "Today at Forge" widget, the
 * "Next sessions" lists and the free-class booking form together.
 */
window.FORGE = window.FORGE || {};

FORGE.config = {
  // Paste a form endpoint (Formspree, Basin, Getform, your own API…)
  // to receive free-class bookings. Leave empty and the booking form
  // opens the visitor's email app with the details filled in instead.
  formEndpoint: "",
  email: "hello@forgeboxing.example",
  phone: "+15550104477",
  phoneDisplay: "(555) 010-4477",
};

// Opening hours, keyed by JS weekday: 0 = Sunday … 6 = Saturday.
FORGE.hours = {
  0: ["09:00", "12:00"],
  1: ["06:00", "21:00"],
  2: ["06:00", "21:00"],
  3: ["06:00", "21:00"],
  4: ["06:00", "21:00"],
  5: ["06:00", "21:00"],
  6: ["08:00", "14:00"],
};

// Heat ratings follow a blacksmith's steel-colour chart.
FORGE.heat = {
  1: { name: "Dull red", temp: "1,200°F" },
  2: { name: "Cherry", temp: "1,500°F" },
  3: { name: "Orange", temp: "1,750°F" },
  4: { name: "Yellow", temp: "2,000°F" },
  5: { name: "White", temp: "2,300°F" },
};

FORGE.programs = {
  foundations:  { name: "Foundations",        level: "Beginner",       heat: 2, beginner: true },
  conditioning: { name: "Fight Conditioning", level: "All levels",     heat: 4, beginner: true },
  technical:    { name: "Technical Boxing",   level: "Intermediate",   heat: 3 },
  sparring:     { name: "Sparring Lab",       level: "Coach approval", heat: 5 },
  fightteam:    { name: "Fight Team",         level: "Invite only",    heat: 5 },
  womens:       { name: "Women's Boxing",     level: "All levels",     heat: 3, beginner: true },
  youth:        { name: "Youth Boxing",       level: "Ages 8–15",      heat: 2, beginner: true },
  opengym:      { name: "Open Gym",           level: "Members",        heat: 1 },
};

FORGE.coaches = {
  dante: "Dante",
  maya: "Maya",
  rafa: "Rafa",
  sam: "Sam",
  jonah: "Jonah",
  tessa: "Tessa",
};

// Weekly timetable. d = weekday (0 Sun … 6 Sat), t = start (24h),
// m = length in minutes, p = program key, c = coach key.
FORGE.schedule = [
  // Monday
  { d: 1, t: "06:00", m: 45, p: "conditioning", c: "rafa" },
  { d: 1, t: "07:00", m: 60, p: "foundations", c: "sam" },
  { d: 1, t: "12:15", m: 45, p: "conditioning", c: "rafa" },
  { d: 1, t: "16:30", m: 60, p: "youth", c: "jonah" },
  { d: 1, t: "17:45", m: 60, p: "foundations", c: "sam" },
  { d: 1, t: "18:00", m: 75, p: "technical", c: "dante" },
  { d: 1, t: "19:00", m: 60, p: "womens", c: "maya" },
  { d: 1, t: "19:30", m: 45, p: "conditioning", c: "rafa" },
  // Tuesday
  { d: 2, t: "06:00", m: 60, p: "foundations", c: "sam" },
  { d: 2, t: "07:00", m: 45, p: "conditioning", c: "rafa" },
  { d: 2, t: "12:15", m: 60, p: "foundations", c: "maya" },
  { d: 2, t: "16:30", m: 60, p: "youth", c: "jonah" },
  { d: 2, t: "17:45", m: 45, p: "conditioning", c: "tessa" },
  { d: 2, t: "18:00", m: 60, p: "foundations", c: "sam" },
  { d: 2, t: "19:15", m: 75, p: "sparring", c: "tessa" },
  // Wednesday
  { d: 3, t: "06:00", m: 45, p: "conditioning", c: "rafa" },
  { d: 3, t: "07:00", m: 60, p: "foundations", c: "sam" },
  { d: 3, t: "12:15", m: 45, p: "conditioning", c: "rafa" },
  { d: 3, t: "16:30", m: 60, p: "youth", c: "jonah" },
  { d: 3, t: "17:45", m: 60, p: "foundations", c: "sam" },
  { d: 3, t: "18:00", m: 60, p: "womens", c: "maya" },
  { d: 3, t: "19:15", m: 75, p: "technical", c: "dante" },
  // Thursday
  { d: 4, t: "06:00", m: 60, p: "foundations", c: "sam" },
  { d: 4, t: "07:00", m: 45, p: "conditioning", c: "rafa" },
  { d: 4, t: "12:15", m: 60, p: "foundations", c: "maya" },
  { d: 4, t: "17:45", m: 45, p: "conditioning", c: "tessa" },
  { d: 4, t: "18:00", m: 60, p: "foundations", c: "sam" },
  { d: 4, t: "19:15", m: 75, p: "sparring", c: "tessa" },
  // Friday
  { d: 5, t: "06:00", m: 45, p: "conditioning", c: "rafa" },
  { d: 5, t: "07:00", m: 60, p: "foundations", c: "sam" },
  { d: 5, t: "12:15", m: 45, p: "conditioning", c: "rafa" },
  { d: 5, t: "17:30", m: 75, p: "technical", c: "dante" },
  { d: 5, t: "18:45", m: 90, p: "fightteam", c: "dante" },
  // Saturday
  { d: 6, t: "08:00", m: 45, p: "conditioning", c: "rafa" },
  { d: 6, t: "09:00", m: 60, p: "foundations", c: "sam" },
  { d: 6, t: "09:30", m: 60, p: "youth", c: "jonah" },
  { d: 6, t: "10:15", m: 60, p: "womens", c: "maya" },
  { d: 6, t: "11:30", m: 120, p: "opengym", c: "tessa" },
  // Sunday
  { d: 0, t: "09:00", m: 60, p: "foundations", c: "maya" },
  { d: 0, t: "10:15", m: 105, p: "opengym", c: "sam" },
];
