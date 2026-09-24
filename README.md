# Tutora — tutor marketplace prototype

A 1-on-1 language-tutoring marketplace: a marketing **landing page** plus an installable **mobile web app** (PWA).
Plain HTML, CSS and JavaScript — no build step, no framework, no backend.

- Landing page: `index.html`
- Mobile app: `app/` (open it on your phone and use "Add to Home Screen")

## What works

**Landing page**: hero with language search, language categories, how it works, app showcase, tutor carousel,
testimonials, guarantee, "become a tutor", teams, FAQ and footer. Fully responsive.

**App**
- Welcome screen and onboarding (language → level → goal → name)
- Home: next lesson with countdown, streak and stats, phrase of the day with audio, recommended tutors
- Search: filter by price, availability, specialties, top tutor, native speaker; sort; keyword search; save tutors
- Tutor profile: intro (spoken greeting), stats, about, languages, weekly schedule, reviews, resume
- Booking: 25/50-minute lessons, day and time picker in your time zone, checkout (demo — no payment), confirmation, add to calendar (.ics)
- Lessons: upcoming and past, join, reschedule, cancel, rate
- Classroom: mock video lesson with timer, live captions, mic/camera toggles (real camera preview), vocabulary with audio, notes
- Messages: conversations with tutors, auto-replies
- Profile: edit details, plans, reminders, reset, "Load demo data" for a filled-in account

Everything is saved in the browser (`localStorage`), so each device has its own data.

## Run it locally

ES modules don't load from `file://`, so serve the folder:

```bash
cd tutor-marketplace
python3 -m http.server 8000
# open http://localhost:8000 (landing) and http://localhost:8000/app/ (app)
```

## Make it yours

| What | Where |
| --- | --- |
| Name | Find and replace `Tutora` / `tutora` across the project |
| Colours, fonts, corner radius | `shared/tokens.css` |
| Logo | `logoMark()` in `shared/icons.js`, and `app/icons/` for the app icon |
| Tutors, languages, reviews, phrases | `shared/data.js` |
| Landing page copy | `index.html` |
| App screens | `app/app.js` (one function per screen) |

Tutor photos are placeholders from [pravatar.cc](https://pravatar.cc). Replace the `img` numbers in `shared/data.js`
(or change the `photo()` helper to point at your own images). Numbers and stats on the landing page are placeholders too.

## Deploy

Hosted on GitHub Pages from the `main` branch root. Push to `main` and the site updates in a minute or two.
