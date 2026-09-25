# Forge Boxing Club — website

A fast, hand-built marketing site for **Forge**, a boxing gym. Seven pages plus a 404, no framework, no build step and no dependencies. Upload the folder to any static host and it works.

![Forge social preview](assets/img/og-image.png)

## What's in it

| Page | What it does |
| --- | --- |
| `index.html` | Home. Hero with an interactive heavy bag (hit it, it swings and throws sparks), the Heat → Hammer → Temper method, program cards, a minute-by-minute "first class" timeline, a live **Today at Forge** board, coaches, pricing teaser. |
| `programs.html` | Eight programs, each with specs, a to-scale "inside a class" minute breakdown, outcomes and live **next sessions** pulled from the timetable. |
| `schedule.html` | Weekly timetable. Filter by program, coach (`?coach=maya`) or beginner-friendly classes. Highlights today and any class that's on now. Day tabs on phones. |
| `coaches.html` | Six coach profiles with stance, focus, go-to combo (in boxing numbers) and the classes they teach, generated from the timetable. |
| `membership.html` | Plans with a monthly / yearly toggle, extras, comparison table and FAQ. |
| `about.html` | Story, milestones, an interactive floor plan and house rules. |
| `contact.html` | Free-class booking form with inline validation, a first-class picker built from the next two weeks of the timetable, and a calendar download on confirmation. |
| `404.html` | "Beat the count" error page. |

**The heat rating.** Every class is rated on a blacksmith's steel-colour chart, from dull red (1,200°F, easy going) to white-hot (2,300°F, full intensity). It's the site's signature detail and shows up on cards, the timetable and program pages.

## Preview it

Open `index.html` in a browser, or run a local server from this folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Put it online

It's a plain static site, so any host works. Nothing needs building.

- **GitHub Pages:** repository **Settings → Pages → Build and deployment → Deploy from a branch**, pick the branch and the `/ (root)` folder, then save. The `.nojekyll` file is already in place.
- **Netlify / Cloudflare Pages / Vercel:** create a new site from this repository, leave the build command empty and set the publish directory to the repository root. On Netlify you can also drag the folder onto the dashboard.

`404.html` is picked up automatically by GitHub Pages, Netlify and Cloudflare Pages.

## Before launch: replace the placeholders

The content is written to be realistic, but the business details are placeholders. Search and replace these across the project:

| Placeholder | Where it appears |
| --- | --- |
| `www.forgeboxing.example` (domain) | `<head>` of every page, the JSON-LD block in `index.html`, `sitemap.xml`, `robots.txt` |
| `hello@forgeboxing.example` | `assets/js/data.js`, footer, contact page, JSON-LD |
| `(555) 010-4477` / `+15550104477` | `assets/js/data.js`, footer, mobile menu, contact page, membership FAQ, timetable page, JSON-LD |
| `88 Foundry Road, Unit 4, Northside` | Footer, mobile menu, contact page, `forms.js` (calendar file), JSON-LD, Google Maps links |
| Parking and station note | `contact.html` |
| Social links | Footer (currently point at the Instagram, YouTube and Facebook home pages) |
| Coaches: names, bios, quotes, stats | `coaches.html`, the coach cards on `index.html`, coach keys in `data.js` |
| Prices and policies | `membership.html`, `index.html` teaser, private coaching on `programs.html` |
| Story, milestones, "Est. 2019", floor sizes, "14 heavy bags" | `about.html`, `index.html` hero stats |

Everything else (copy, class structure, FAQ answers) is ready to use, but read it through and adjust anything that doesn't match how you run the gym.

## Connect the booking form

Open `assets/js/data.js` and paste a form endpoint into `formEndpoint`:

```js
FORGE.config = {
  formEndpoint: "https://formspree.io/f/your-id",
  email: "hello@yourgym.com",
  ...
};
```

Any service that accepts a JSON `POST` works (Formspree, Basin, Getform, your own API). Bookings arrive with name, email, phone, experience, program interest, chosen class, notes and newsletter opt-in. A hidden `_gotcha` field catches most spam bots.

**If you leave it empty**, the form still works: after validation it opens the visitor's email app with the booking filled in and addressed to `email`, and the confirmation screen tells them to press send.

## Everyday edits

**Timetable and opening hours.** Edit `assets/js/data.js`. Each class is one line:

```js
{ d: 1, t: "18:00", m: 75, p: "technical", c: "dante" },
// d = weekday (0 Sun … 6 Sat), t = 24h start, m = minutes, p = program, c = coach
```

That one file feeds the timetable, the "Today at Forge" board, next-session lists, coach class lists and the booking form's class picker. A few counts are written into the page copy, so update them if the timetable changes: "40 classes" (home stats, timetable title, meta descriptions, social image) and "Runs … times a week" on `programs.html`.

**Prices.** In `membership.html`, each price has both values on it, for example `data-monthly="179" data-annual="152"`. The toggle swaps them. Update the visible number, both attributes and the matching `plan-note` text.

**Coach photos.** The portraits are typographic by design, so the site looks finished without photography. To add a real photo, put an image inside the portrait and it covers the artwork:

```html
<div class="portrait">
  <img src="assets/img/coach-dante.jpg" alt="Dante Cruz holding pads" width="800" height="1000" loading="lazy">
  ...
</div>
```

Use 4:5 portrait images around 800 × 1000 px, compressed to under 150 KB each.

**Header and footer.** They're repeated in each HTML file, so a change to the navigation or footer needs making in all eight pages.

## Technical notes

- **No dependencies.** Plain HTML, one stylesheet and small vanilla JavaScript files. The home page transfers about 250 KB with gzip, and about 210 KB of that is the three font files, which are cached after the first visit.
- **Fonts** are self-hosted in `assets/fonts` (Big Shoulders and Archivo, both SIL Open Font License; licence files included), so there are no third-party requests.
- **Accessibility:** skip link, visible focus states, semantic landmarks and headings, labelled controls, keyboard-operable timetable tabs, menu and heavy bag, form errors announced and linked to their fields, and `prefers-reduced-motion` respected (embers, sway and sparks switch off).
- **Performance:** animations pause when off-screen or when the tab is hidden, canvas pixel density is capped, fonts are preloaded.
- **SEO:** unique titles and descriptions, canonical and Open Graph tags, a 1200 × 630 social image, `ExerciseGym` structured data with opening hours, `sitemap.xml` and `robots.txt`.
- **Browser support:** current Chrome, Edge, Safari and Firefox, desktop and mobile. Page-to-page fades use the View Transitions API where supported and fall back to normal navigation elsewhere.

### File map

```
index.html  programs.html  schedule.html  coaches.html
membership.html  about.html  contact.html  404.html
assets/
  css/styles.css        design tokens and all components
  js/data.js            timetable, hours, programs, coaches, form settings
  js/main.js            header, menu, reveals, open-now status, pricing toggle, floor plan
  js/schedule.js        timetable, today board, next sessions, class picker
  js/forms.js           booking form
  js/embers.js          hero ember particles
  js/bag.js             interactive heavy bag
  fonts/                self-hosted variable fonts + licences
  img/                  logo, favicons, app icons, social image
site.webmanifest  sitemap.xml  robots.txt  .nojekyll
```

### Recommended next steps

- Add a privacy policy page, since the booking form collects personal details.
- Add real photography of the floor, coaches and classes.
- Add member testimonials once you have permission to quote people.
