import {
  LANGUAGES, LEVELS, GOALS, TUTORS, PHRASES, AUTO_REPLIES,
  tutorById, langById, photo, priceFor, slotsFor, reviewsFor, seeded,
} from '../shared/data.js';
import { icon, logoMark } from '../shared/icons.js';

// ================= Helpers =================
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const view = $('#view');
const fixed = $('#fixed');
const tabbar = $('#tabbar');
const sheetRoot = $('#sheet');
const toastEl = $('#toast');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (key, time) => {
  const [y, m, d] = key.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi);
};
const week = () => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d;
});
const isToday = (d) => dayKey(d) === dayKey(new Date());
const fmtDay = (d) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const fmtLong = (d) => d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
const fmtTime = (d) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const money = (n) => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
const round2 = (n) => Math.round(n * 100) / 100;
const firstName = (name) => name.split(' ')[0];
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const compact = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'k' : String(n));
const stars = (n, size = 14) => Array.from({ length: Math.round(n) }, () => icon('star', size)).join('');
const online = (t) => seeded('on' + t.id + new Date().getHours())() > 0.45;

function until(date) {
  const m = Math.round((date - Date.now()) / 60000);
  if (m <= 0) return 'Starting now';
  if (m < 60) return `in ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `in ${h}h ${m % 60}m`;
  const d = Math.round(h / 24);
  return `in ${d} day${d > 1 ? 's' : ''}`;
}
function ago(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// Time-of-day buckets used by the schedule and the availability filter.
const BUCKETS = [
  ['morning', 'Morning', '6:00–12:00'],
  ['afternoon', 'Afternoon', '12:00–17:00'],
  ['evening', 'Evening', '17:00–21:00'],
  ['night', 'Night', '21:00–24:00'],
];
const bucket = (s) => { const h = +s.slice(0, 2); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'; };

// ================= State (saved on this device) =================
const KEY = 'tutora-state-v1';
const blank = () => ({
  onboarded: false, name: '', learning: 'spanish', level: 'b1', goal: 'conversation',
  saved: [], bookings: [], threads: {}, notifications: true, plan: null,
});
let state = load();
function load() {
  try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return blank(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep in memory */ }
}
const thread = (id) => (state.threads[id] ||= { unread: false, msgs: [] });
const findBooking = (id) => state.bookings.find((b) => b.id === id);
const upcoming = () => state.bookings.filter((b) => b.status === 'upcoming').sort((a, b) => a.start.localeCompare(b.start));
const pastLessons = () => state.bookings.filter((b) => b.status === 'done').sort((a, b) => b.start.localeCompare(a.start));

// Lessons whose end time has passed count as completed.
function settle() {
  let changed = false;
  for (const b of state.bookings) {
    if (b.status === 'upcoming' && new Date(b.start).getTime() + b.minutes * 60000 < Date.now()) { b.status = 'done'; changed = true; }
  }
  if (changed) save();
}

// Open times for a tutor on a day, hiding the next hour and times you've already booked.
function openSlots(t, key) {
  const soon = Date.now() + 60 * 60000;
  const taken = new Set(state.bookings.filter((b) => b.tutorId === t.id && b.status === 'upcoming').map((b) => b.start));
  return slotsFor(t.id, key).filter((s) => {
    const d = at(key, s);
    return d.getTime() > soon && !taken.has(d.toISOString());
  });
}
const firstOpenDay = (t) => dayKey(week().find((d) => openSlots(t, dayKey(d)).length) || new Date());

function seedDemo() {
  const mk = (tutorId, days, time, minutes, status, extra = {}) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    const t = tutorById(tutorId);
    return { id: uid(), tutorId, start: at(dayKey(d), time).toISOString(), minutes, price: priceFor(t, minutes), trial: false, status, ...extra };
  };
  const soon = new Date(Date.now() + 2 * 3600e3);
  soon.setMinutes(soon.getMinutes() < 30 ? 30 : 60, 0, 0);
  const now = Date.now();
  state = {
    ...blank(), onboarded: true, name: 'Sam', learning: 'spanish', level: 'b1', goal: 'conversation',
    saved: ['lucia-fernandez', 'camille-laurent', 'yuki-tanaka'],
    bookings: [
      { id: uid(), tutorId: 'lucia-fernandez', start: soon.toISOString(), minutes: 50, price: 19, trial: false, status: 'upcoming' },
      mk('lucia-fernandez', 3, '18:30', 50, 'upcoming'),
      mk('mateo-rojas', -24, '19:00', 25, 'done', { trial: true, rating: 5 }),
      mk('lucia-fernandez', -21, '18:30', 50, 'done', { trial: true, rating: 5 }),
      ...[-17, -14, -10, -7, -3].map((d) => mk('lucia-fernandez', d, '18:30', 50, 'done', { rating: 5 })),
    ],
    threads: {
      'lucia-fernandez': {
        unread: true,
        msgs: [
          { from: 'them', text: '¡Hola Sam! Great lesson today — you used the subjunctive twice without thinking about it 🙌', ts: now - 3 * 864e5 },
          { from: 'me', text: '¡Gracias! It still feels strange but I’m getting there.', ts: now - 3 * 864e5 + 40 * 60e3 },
          { from: 'them', text: 'Before our next lesson, listen to the podcast episode I sent and write down five new expressions. ¡Hasta pronto!', ts: now - 50 * 60e3 },
        ],
      },
      'mateo-rojas': {
        unread: false,
        msgs: [{ from: 'them', text: 'Hi Sam! It was great meeting you in the trial. If you ever want Colombian slang practice, I’m here 😄', ts: now - 24 * 864e5 }],
      },
    },
  };
  save();
}

// ================= UI primitives =================
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

function openSheet(html, mount) {
  sheetRoot.innerHTML = `<div class="sheet-backdrop" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="sheet-handle"></div>${html}</div>`;
  sheetRoot.setAttribute('aria-hidden', 'false');
  void sheetRoot.offsetHeight; // start the slide-up transition
  sheetRoot.classList.add('open');
  mount?.($('.sheet', sheetRoot));
}
function closeSheet() {
  if (!sheetRoot.classList.contains('open')) return;
  sheetRoot.classList.remove('open');
  sheetRoot.setAttribute('aria-hidden', 'true');
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  setTimeout(() => { if (!sheetRoot.classList.contains('open')) sheetRoot.innerHTML = ''; }, 350);
}

function speak(text, lang) {
  if (!('speechSynthesis' in window)) return toast('Audio isn’t supported on this device');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

const initial = () => esc((state.name || 'G')[0].toUpperCase());
const topbar = (title, fallback, right = '<span class="spacer"></span>') =>
  `<header class="topbar"><button class="icon-btn" data-act="back" data-fallback="${fallback}" aria-label="Back">${icon('back')}</button><h1>${title}</h1>${right}</header>`;
const emptyState = (ic, title, text, cta = '') =>
  `<div class="empty"><div class="blob">${icon(ic)}</div><h2>${title}</h2><p>${text}</p>${cta}</div>`;

function tutorCard(t, i = 0) {
  const saved = state.saved.includes(t.id);
  return `<article class="tcard" style="animation-delay:${Math.min(i, 6) * 40}ms">
    <a class="tcard-main" href="#/tutor/${t.id}">
      <div class="tcard-photo"><img src="${photo(t.img, 200)}" alt="" loading="lazy" />${online(t) ? '<span class="online" title="Online now"></span>' : ''}</div>
      <div>
        <div class="tcard-name">${t.name} <span>${t.flag}</span>${t.top ? `<span class="badge-top">${icon('sparkle', 13)} Top</span>` : ''}</div>
        <div class="tcard-sub">${icon('book', 15)} ${langById(t.teaches).name}</div>
        <div class="tcard-stats">
          <div><b>${icon('star', 15)}${t.rating.toFixed(1)}</b><small>${t.reviews} reviews</small></div>
          <div><b>${money(t.price)}</b><small>50-min lesson</small></div>
        </div>
      </div>
    </a>
    <button class="heart ${saved ? 'on' : ''}" data-act="save" data-id="${t.id}" aria-label="Save ${t.name}" aria-pressed="${saved}">${icon('heart', 22)}</button>
    <p class="tcard-text"><b>${t.headline}.</b> ${t.bio}</p>
    <div class="tcard-meta">${icon('users', 16)} ${t.students.toLocaleString()} students · ${t.lessons.toLocaleString()} lessons</div>
    <div class="tcard-meta">${icon('chat', 16)} Speaks ${t.speaks.map((s) => s[0]).join(', ')}</div>
    <div class="tcard-actions">
      <a class="btn btn-primary btn-sm" href="#/book/${t.id}">Book trial lesson</a>
      <a class="btn btn-outline btn-sm" href="#/chat/${t.id}">Message</a>
    </div>
  </article>`;
}

const miniCard = (t) => `<a class="mini" href="#/tutor/${t.id}">
  <div class="ph"><img src="${photo(t.img, 300)}" alt="" loading="lazy" />${t.top ? `<span class="badge-top">${icon('sparkle', 12)} Top</span>` : ''}</div>
  <div class="bd"><b>${t.name} ${t.flag}</b><div class="ln"><span class="r">${icon('star', 13)}${t.rating.toFixed(1)}</span><span>${money(t.price)}/50 min</span></div></div>
</a>`;

const tutorMini = (t, sub) => `<div class="tutor-mini"><img src="${photo(t.img, 160)}" alt="" /><div><b>${t.name} ${t.flag}</b><small>${sub ?? `${icon('star')} ${t.rating.toFixed(1)} · ${langById(t.teaches).name} tutor`}</small></div></div>`;

// Day strip + time slots, shared by the tutor profile and the booking screen.
function scheduleHtml(t, key, selected, prefix) {
  const slots = openSlots(t, key);
  const days = week().map((d) => {
    const k = dayKey(d);
    const has = openSlots(t, k).length > 0;
    return `<button class="day ${k === key ? 'on' : ''} ${has ? '' : 'none'}" data-act="${prefix}Day" data-k="${k}">
      <small>${isToday(d) ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}</small><b>${d.getDate()}</b><i></i></button>`;
  }).join('');
  const groups = BUCKETS.map(([id, label]) => [label, slots.filter((s) => bucket(s) === id)]).filter((g) => g[1].length);
  const body = groups.length
    ? groups.map(([label, list]) => `<div class="slot-group"><h4>${label}</h4><div class="slot-grid">${list.map((s) =>
        `<button class="slot ${selected === s ? 'on' : ''}" data-act="${prefix}Slot" data-t="${s}">${fmtTime(at(key, s))}</button>`).join('')}</div></div>`).join('')
    : `<div class="no-slots">No open times this day — try another one.</div>`;
  return `<div class="days">${days}</div>${body}`;
}

function openRate(b) {
  const t = tutorById(b.tutorId);
  openSheet(`<h2>How was your lesson with ${firstName(t.name)}?</h2>
    <p>Your rating helps other learners find the right tutor.</p>
    <div class="stars-input">${[1, 2, 3, 4, 5].map((n) => `<button data-act="star" data-n="${n}" aria-label="${n} stars">${icon('star', 44)}</button>`).join('')}</div>
    <div class="foot one"><button class="btn btn-primary" id="rateGo" data-act="rateSubmit" data-id="${b.id}" disabled>Submit rating</button></div>`);
}

function downloadIcs(b) {
  const t = tutorById(b.tutorId);
  const s = new Date(b.start);
  const e = new Date(s.getTime() + b.minutes * 60000);
  const f = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tutora//Demo//EN', 'BEGIN:VEVENT',
    `UID:${b.id}@tutora.demo`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(s)}`, `DTEND:${f(e)}`,
    `SUMMARY:${langById(t.teaches).name} lesson with ${t.name}`, 'DESCRIPTION:Join from the Lessons tab in the app.',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  a.download = 'lesson.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ================= Screens =================
// Each screen returns { html, fixed?, tab?, mode?, mount? }.
// mount() runs after render and may return a cleanup function.

function Welcome() {
  const rings = [[32, '7%', '10%', 118], [44, '62%', '5%', 96], [51, '60%', '46%', 124], [5, '9%', '56%', 92], [25, '35%', '27%', 104]];
  const words = [['¡Hola!', '33%', '6%'], ['Bonjour', '4%', '40%'], ['こんにちは', '34%', '76%']];
  return {
    mode: 'bare',
    html: `<section class="welcome">
      <div class="welcome-art" aria-hidden="true">
        ${rings.map(([img, l, tp, s], i) => `<div class="ring" style="left:${l};top:${tp};width:${s}px;height:${s}px;animation-delay:${i * 80}ms,${i * 0.7}s"><img src="${photo(img, 300)}" alt="" /></div>`).join('')}
        ${words.map(([w, l, tp], i) => `<span class="word" style="left:${l};top:${tp};animation-delay:${300 + i * 120}ms,${i}s">${w}</span>`).join('')}
      </div>
      <div class="welcome-copy">
        <div class="logo">${logoMark(28)} tutora</div>
        <h1>Speak it<br />for real.</h1>
        <p>1-on-1 lessons with tutors who make you want to talk.</p>
        <a class="btn btn-primary btn-block" href="#/onboarding">Get started</a>
        <button class="btn btn-outline btn-block" data-act="demoLogin">Explore with a demo account</button>
        <a class="btn btn-ghost btn-block" href="../">Back to website</a>
      </div>
    </section>`,
  };
}

// ---- Onboarding ----
let ob = null;
let obTimer;
function Onboarding() {
  ob ||= { step: 0, learning: null, level: null, goal: null, name: state.name || '' };
  const s = ob.step;
  const radio = (on) => `<span class="radio">${on ? icon('check', 14) : ''}</span>`;
  let body = '';
  let ready = false;
  if (s === 0) {
    body = `<h1>What do you want to learn?</h1><p>You can add more languages later.</p>
      <div class="ob-grid">${LANGUAGES.map((l) => `<button class="opt ${ob.learning === l.id ? 'on' : ''}" data-act="obPick" data-k="learning" data-v="${l.id}">
        <span class="glyph tint-${l.tint}">${l.glyph}</span><div><b>${l.name}</b><small>${l.tutors.toLocaleString()} tutors</small></div></button>`).join('')}</div>`;
    ready = !!ob.learning;
  } else if (s === 1) {
    body = `<h1>How’s your ${langById(ob.learning).name}?</h1><p>Tutors use this to plan your first lesson.</p>
      <div class="ob-list">${LEVELS.map((l) => `<button class="opt ${ob.level === l.id ? 'on' : ''}" data-act="obPick" data-k="level" data-v="${l.id}">
        <div><b>${l.name}</b><small>${l.hint}</small></div>${radio(ob.level === l.id)}</button>`).join('')}</div>`;
    ready = !!ob.level;
  } else if (s === 2) {
    body = `<h1>What’s your main goal?</h1><p>We’ll suggest tutors who specialise in it.</p>
      <div class="ob-list">${GOALS.map((g) => `<button class="opt ${ob.goal === g.id ? 'on' : ''}" data-act="obPick" data-k="goal" data-v="${g.id}">
        <span class="emoji">${g.emoji}</span><div><b>${g.name}</b></div>${radio(ob.goal === g.id)}</button>`).join('')}</div>`;
    ready = !!ob.goal;
  } else {
    body = `<h1>What should we call you?</h1><p>Tutors will see your first name.</p>
      <label class="field"><span>First name</span><input class="input" id="obName" autocomplete="given-name" maxlength="30" placeholder="e.g. Sam" value="${esc(ob.name)}" /></label>`;
    ready = ob.name.trim().length > 0;
  }
  return {
    mode: 'bare',
    html: `<section class="ob">
      <div class="ob-top"><button class="icon-btn" data-act="obBack" aria-label="Back">${icon('back')}</button><div class="progress"><i style="width:${((s + 1) / 4) * 100}%"></i></div></div>
      <div class="ob-body">${body}</div>
      <div class="ob-foot"><button class="btn btn-primary btn-block" id="obNext" data-act="obNext" ${ready ? '' : 'disabled'}>${s === 3 ? 'Show me tutors' : 'Continue'}</button></div>
    </section>`,
    mount() {
      const inp = $('#obName');
      if (!inp) return;
      inp.focus();
      inp.addEventListener('input', () => { ob.name = inp.value; $('#obNext').disabled = !inp.value.trim(); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && inp.value.trim()) A.obNext(); });
    },
  };
}

// ---- Home ----
function Home() {
  const lang = langById(state.learning);
  const next = upcoming()[0];
  const done = pastLessons();
  const hours = Math.round(done.reduce((s, b) => s + b.minutes, 0) / 6) / 10;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const phrases = PHRASES[lang.id];
  const [phrase, meaning] = phrases[Math.floor(Date.now() / 864e5) % phrases.length];
  const recs = TUTORS.filter((t) => t.teaches === lang.id).sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  const mine = [...new Set(state.bookings.map((b) => b.tutorId))].map(tutorById).filter(Boolean);
  const unread = Object.values(state.threads).some((t) => t.unread);
  const cheapest = Math.min(...recs.map((t) => priceFor(t, 25)));

  const nextCard = next ? (() => {
    const t = tutorById(next.tutorId);
    const d = new Date(next.start);
    return `<div class="next">
      <div class="next-top"><span>Next lesson · ${isToday(d) ? 'Today' : fmtDay(d)}, ${fmtTime(d)}</span><span class="countdown" data-until="${next.start}">${until(d)}</span></div>
      <div class="next-row"><img src="${photo(t.img, 160)}" alt="" /><div><b>${langById(t.teaches).name} with ${firstName(t.name)}</b><small>${next.minutes} min${next.trial ? ' · Trial lesson' : ''}</small></div></div>
      <div class="next-actions"><a class="btn btn-primary" href="#/classroom/${next.id}">${icon('video', 20)} Join lesson</a><a class="btn btn-outline" href="#/lessons">All lessons</a></div>
    </div>`;
  })() : `<div class="first"><h2>Book your first lesson</h2><p>Trial lessons from ${money(cheapest)}. Find a ${lang.name} tutor you click with.</p><a class="btn btn-dark" href="#/search?lang=${lang.id}">Find a tutor ${icon('arrow', 20)}</a></div>`;

  return {
    tab: 'home',
    html: `<header class="home-head">
        <div><small>${greet}</small><h1>Hi, ${esc(state.name || 'there')} 👋</h1></div>
        <a class="icon-btn" href="#/messages" aria-label="Messages">${icon('bell')}${unread ? '<span class="dot"></span>' : ''}</a>
        <a class="avatar" href="#/profile" aria-label="Profile">${initial()}</a>
      </header>
      ${nextCard}
      <div class="stat-row">
        <div class="stat">${icon('flame', 20)}<b>${weekStreak(done)}</b><small>week streak</small></div>
        <div class="stat">${icon('clock', 20)}<b>${hours}h</b><small>learned</small></div>
        <div class="stat">${icon('book', 20)}<b>${done.length * 14}</b><small>words saved</small></div>
      </div>
      <section class="sec"><div class="sec-head"><h2>Phrase of the day</h2></div>
        <div class="phrase tint-${lang.tint}"><div><small>${lang.name}</small><b>${phrase}</b><span>${meaning}</span></div>
        <button class="speak" data-act="speak" data-text="${esc(phrase)}" data-lang="${lang.speech}" aria-label="Listen">${icon('volume')}</button></div>
      </section>
      ${mine.length ? `<section class="sec"><div class="sec-head"><h2>Your tutors</h2></div><div class="row-list">${mine.map((t) => `<div class="row">
          <img src="${photo(t.img, 120)}" alt="" /><a class="grow" href="#/tutor/${t.id}"><b>${t.name}</b><small>${langById(t.teaches).name} · ${plural(state.bookings.filter((b) => b.tutorId === t.id && b.status === 'done').length, 'lesson')} together</small></a>
          <a class="btn btn-outline btn-sm" href="#/book/${t.id}">Book</a></div>`).join('')}</div></section>` : ''}
      <section class="sec"><div class="sec-head"><h2>Top ${lang.name} tutors</h2><a href="#/search?lang=${lang.id}">See all</a></div><div class="rail">${recs.map(miniCard).join('')}</div></section>
      <section class="sec"><div class="sec-head"><h2>Explore languages</h2></div>
        <div class="lang-chips">${LANGUAGES.filter((l) => l.id !== lang.id).map((l) => `<a class="lang-chip" href="#/search?lang=${l.id}"><span class="tint-${l.tint}">${l.glyph}</span>${l.name}</a>`).join('')}</div>
      </section>`,
    mount() {
      const tick = () => $$('[data-until]').forEach((el) => (el.textContent = until(new Date(el.dataset.until))));
      const id = setInterval(tick, 30000);
      return () => clearInterval(id);
    },
  };
}

function weekStreak(done) {
  const wk = (d) => Math.floor((new Date(d).getTime() - 345600000) / 6048e5); // weeks start on Monday
  const weeks = new Set(done.map((b) => wk(b.start)));
  let w = wk(Date.now());
  if (!weeks.has(w)) w--;
  let n = 0;
  while (weeks.has(w)) { n++; w--; }
  return n;
}

// ---- Search ----
const SORTS = { best: 'Our top picks', priceAsc: 'Price: lowest first', priceDesc: 'Price: highest first', reviews: 'Most reviews', rating: 'Highest rating' };
const MAX_PRICE = 40;
const filters = { lang: null, q: '', max: MAX_PRICE, times: [], specs: [], top: false, native: false, sort: 'best' };

function searchResults() {
  const q = filters.q.trim().toLowerCase();
  const list = TUTORS.filter((t) =>
    t.teaches === filters.lang &&
    t.price <= filters.max &&
    (!filters.top || t.top) &&
    (!filters.native || t.native) &&
    (!filters.specs.length || filters.specs.some((s) => t.specialties.includes(s))) &&
    (!q || [t.name, t.headline, t.bio, t.country, ...t.specialties].join(' ').toLowerCase().includes(q)) &&
    (!filters.times.length || week().some((d) => openSlots(t, dayKey(d)).some((s) => filters.times.includes(bucket(s)))))
  );
  const by = {
    best: (a, b) => (b.top - a.top) || (b.rating * 100 + b.reviews / 10) - (a.rating * 100 + a.reviews / 10),
    priceAsc: (a, b) => a.price - b.price,
    priceDesc: (a, b) => b.price - a.price,
    reviews: (a, b) => b.reviews - a.reviews,
    rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
  };
  return list.sort(by[filters.sort]);
}
const activeFilters = () => (filters.max < MAX_PRICE) + !!filters.times.length + !!filters.specs.length + filters.top + filters.native + !!filters.q.trim();

function renderResults() {
  const list = searchResults();
  $('#results').innerHTML = `<div class="result-count"><span>${list.length} ${list.length === 1 ? 'tutor' : 'tutors'} available</span>${activeFilters() ? '<button class="link" data-act="fClear">Clear filters</button>' : ''}</div>` +
    (list.length
      ? `<div class="tlist">${list.map(tutorCard).join('')}</div>`
      : emptyState('search', 'No tutors match', 'Try a wider price range or clear a filter or two.', '<button class="btn btn-outline" data-act="fClear">Clear all filters</button>'));
}

function Search(r) {
  if (r.q.lang && LANGUAGES.some((l) => l.id === r.q.lang)) filters.lang = r.q.lang;
  filters.lang ||= state.learning;
  const lang = langById(filters.lang);
  const chip = (act, on, label) => `<button class="chip ${on ? 'on' : ''}" data-act="${act}">${label}</button>`;
  return {
    tab: 'search',
    html: `<header class="search-head" id="shead">
        <div class="search-title">
          <button class="lang-switch" data-act="pickLang"><span class="g tint-${lang.tint}">${lang.glyph}</span>${lang.name} tutors ${icon('down', 20)}</button>
          <a class="icon-btn outlined" href="#/saved" aria-label="Saved tutors">${icon('heart')}</a>
        </div>
        <label class="search-input">${icon('search', 20)}<input id="q" type="search" placeholder="Name, specialty or keyword" value="${esc(filters.q)}" autocomplete="off" /></label>
        <div class="chip-row">
          ${chip('fPrice', filters.max < MAX_PRICE, `${filters.max < MAX_PRICE ? `Up to ${money(filters.max)}` : 'Price'} ${icon('down', 16)}`)}
          ${chip('fTime', filters.times.length, `${filters.times.length ? BUCKETS.filter((b) => filters.times.includes(b[0])).map((b) => b[1]).join(', ') : 'Availability'} ${icon('down', 16)}`)}
          ${chip('fSpec', filters.specs.length, `${filters.specs.length ? filters.specs.join(', ') : 'Specialties'} ${icon('down', 16)}`)}
          ${chip('fTop', filters.top, `${icon('sparkle', 16)} Top tutor`)}
          ${chip('fNative', filters.native, 'Native speaker')}
          ${chip('fSort', false, `${icon('sliders', 16)} ${SORTS[filters.sort]}`)}
        </div>
      </header>
      <div id="results"></div>`,
    mount() {
      renderResults();
      const q = $('#q');
      q.addEventListener('input', () => { filters.q = q.value; renderResults(); });
      view.onscroll = () => $('#shead')?.classList.toggle('stuck', view.scrollTop > 4);
    },
  };
}

// ---- Tutor profile ----
let prof = { id: null, day: null, more: false };
function Tutor(r) {
  const t = tutorById(r.id);
  if (!t) return NotFound();
  if (prof.id !== t.id) prof = { id: t.id, day: firstOpenDay(t), more: false };
  const lang = langById(t.teaches);
  const saved = state.saved.includes(t.id);
  const p5 = Math.min(97, Math.max(60, Math.round((t.rating - 4) * 95)));
  const dist = [p5, Math.max(2, 97 - p5), 2, 1, 0];
  const similar = TUTORS.filter((x) => x.teaches === t.teaches && x.id !== t.id)
    .concat(TUTORS.filter((x) => x.teaches !== t.teaches && x.top)).slice(0, 6);
  const booked = state.bookings.some((b) => b.tutorId === t.id);

  return {
    mode: 'no-tabs',
    html: `<div class="p-hero">
        <div class="video-cover">
          <img src="${photo(t.img, 600)}" alt="${t.name}" />
          <button class="play" data-act="intro" data-id="${t.id}" aria-label="Play intro">${icon('play', 30)}</button>
          <span class="video-tag">${icon('video', 16)} Intro video · 1:24</span>
        </div>
        <div class="topbar topbar--float">
          <button class="icon-btn" data-act="back" data-fallback="#/search?lang=${t.teaches}" aria-label="Back">${icon('back')}</button>
          <div style="display:flex;gap:8px">
            <button class="icon-btn" data-act="share" data-id="${t.id}" aria-label="Share">${icon('share', 20)}</button>
            <button class="icon-btn fav ${saved ? 'on' : ''}" data-act="save" data-id="${t.id}" aria-label="Save" aria-pressed="${saved}">${icon('heart', 20)}</button>
          </div>
        </div>
      </div>
      <section class="p-head">
        <div class="p-name"><h1>${t.name}</h1><span class="flag">${t.flag}</span>${t.top ? `<span class="badge-top">${icon('sparkle', 13)} Top tutor</span>` : ''}</div>
        <div class="tcard-sub">${icon('book', 15)} ${lang.name} tutor · from ${t.country}</div>
        <p class="p-headline">${t.headline}</p>
        <div class="p-stats">
          <div><b>${icon('star')}${t.rating.toFixed(1)}</b><small>${t.reviews} reviews</small></div>
          <div><b>${money(t.price)}</b><small>50 min</small></div>
          <div><b>${compact(t.students)}</b><small>students</small></div>
          <div><b>${compact(t.lessons)}</b><small>lessons</small></div>
        </div>
      </section>
      <nav class="p-tabs" id="ptabs">
        <button class="on" data-act="jump" data-to="about">About</button>
        <button data-act="jump" data-to="schedule">Schedule</button>
        <button data-act="jump" data-to="reviews">Reviews (${t.reviews})</button>
        <button data-act="jump" data-to="resume">Resume</button>
      </nav>
      <section class="p-sec" id="sec-about">
        <h2>About me</h2>
        <p class="bio ${prof.more ? '' : 'clamp'}">${t.bio}</p>
        <button class="more-btn" data-act="bioMore">${prof.more ? 'Show less' : 'Read more'}</button>
        <h3>I speak</h3>
        <div class="pills">${t.speaks.map(([l, lv]) => `<span class="pill lvl"><b>${l}</b> <em>${lv}</em></span>`).join('')}</div>
        <h3>Lessons focus on</h3>
        <div class="pills">${t.specialties.map((s) => `<span class="pill">${s}</span>`).join('')}</div>
      </section>
      <section class="p-sec" id="sec-schedule">
        <h2>Schedule</h2>
        <p class="tz">${icon('globe')} Times in your time zone · ${tz}</p>
        <div id="sched">${scheduleHtml(t, prof.day, null, 't')}</div>
      </section>
      <section class="p-sec" id="sec-reviews">
        <h2>What students say</h2>
        <div class="rating-sum">
          <div><div class="big">${t.rating.toFixed(1)}</div><div class="stars">${stars(5, 15)}</div><small class="muted">${t.reviews} reviews</small></div>
          <div class="bars">${dist.map((p, i) => `<div>${5 - i}<span><i style="width:${p}%"></i></span></div>`).join('')}</div>
        </div>
        ${reviewsFor(t).map((rv) => `<div class="review"><div class="review-top"><span class="avatar">${rv.name[0]}</span><div><b>${rv.name}</b><small>${rv.country} · ${rv.ago}</small></div><span class="stars">${stars(rv.stars, 13)}</span></div><p>${rv.text}</p></div>`).join('')}
      </section>
      <section class="p-sec" id="sec-resume">
        <h2>Resume</h2>
        <div class="timeline">${t.resume.map(([y, title, place]) => `<div><small>${y}</small><b>${title}</b><span>${place}</span></div>`).join('')}</div>
      </section>
      <section class="sec"><div class="sec-head"><h2>You might also like</h2></div><div class="rail">${similar.map(miniCard).join('')}</div></section>`,
    fixed: `<div class="actionbar">
        <div class="price"><b>${money(t.price)}</b><small>50-min lesson</small></div>
        <a class="icon-btn outlined" href="#/chat/${t.id}" aria-label="Message ${t.name}">${icon('chat')}</a>
        <a class="btn btn-primary" href="#/book/${t.id}">${booked ? 'Book lesson' : 'Book trial lesson'}</a>
      </div>`,
    mount() {
      const secs = ['about', 'schedule', 'reviews', 'resume'];
      view.onscroll = () => {
        let active = 'about';
        for (const s of secs) if ($('#sec-' + s)?.getBoundingClientRect().top < 160) active = s;
        $$('#ptabs button').forEach((b) => b.classList.toggle('on', b.dataset.to === active));
      };
    },
  };
}

// ---- Booking ----
let bk = null;
function Book(r) {
  const t = tutorById(r.id);
  if (!t) return NotFound();
  const re = r.q.re ? findBooking(r.q.re) : null;
  if (!bk || bk.src !== location.hash) {
    bk = { src: location.hash, tutorId: t.id, minutes: re ? re.minutes : 50, day: r.q.d || firstOpenDay(t), time: r.q.t || null, re: re?.id || null };
  }
  const trial = !state.bookings.some((b) => b.tutorId === t.id && b.status !== 'cancelled');
  const title = re ? 'Reschedule lesson' : trial ? 'Book a trial lesson' : 'Book a lesson';
  return {
    mode: 'no-tabs',
    html: `${topbar(title, `#/tutor/${t.id}`)}
      <div class="pad">
        ${tutorMini(t)}
        ${re ? '' : `<h2 class="step-title">Lesson length</h2>
          <div class="seg tall">${[25, 50].map((m) => `<button class="${bk.minutes === m ? 'on' : ''}" data-act="bLen" data-m="${m}">${m} minutes<small>${money(priceFor(t, m))}</small></button>`).join('')}</div>`}
        <h2 class="step-title">Pick a time</h2>
        <p class="tz">${icon('globe')} ${tz}</p>
        <div id="sched">${scheduleHtml(t, bk.day, bk.time, 'b')}</div>
      </div>`,
    fixed: bookBar(t),
  };
}
function bookBar(t) {
  const when = bk.time ? at(bk.day, bk.time) : null;
  return `<div class="actionbar">
    <div class="price"><b>${when ? fmtTime(when) : 'Choose a time'}</b><small>${when ? `${fmtDay(when)} · ${bk.minutes} min` : `${bk.minutes}-minute lesson`}</small></div>
    <button class="btn btn-primary" data-act="bNext" ${bk.time ? '' : 'disabled'}>${bk.re ? 'Confirm new time' : 'Continue'}</button>
  </div>`;
}

// ---- Checkout ----
let pending = null;
function Checkout(r) {
  const t = tutorById(r.id);
  const { d, t: time } = r.q;
  if (!t || !d || !time) return NotFound();
  const minutes = +r.q.m === 25 ? 25 : 50;
  const start = at(d, time);
  const end = new Date(start.getTime() + minutes * 60000);
  const price = priceFor(t, minutes);
  const fee = 0.5;
  const total = round2(price + fee);
  const trial = !state.bookings.some((b) => b.tutorId === t.id && b.status !== 'cancelled');
  pending = { tutorId: t.id, start: start.toISOString(), minutes, price: total, trial };
  return {
    mode: 'no-tabs',
    html: `${topbar('Checkout', `#/book/${t.id}`)}
      <div class="pad">
        ${tutorMini(t)}
        <div class="summary">
          <div class="line"><span>Lesson</span><b>${langById(t.teaches).name}${trial ? ' trial' : ''} · ${minutes} min</b></div>
          <div class="line"><span>Date</span><b>${fmtLong(start)}</b></div>
          <div class="line"><span>Time</span><b>${fmtTime(start)} – ${fmtTime(end)}</b></div>
        </div>
        <h2 class="step-title">Payment method</h2>
        <button class="pay on" data-act="noop"><span class="cardart"></span><div class="grow"><b>Demo card •••• 4242</b><small>Placeholder for this prototype</small></div><span class="radio"></span></button>
        <button class="pay" data-act="toast" data-msg="Payments aren’t connected in this demo"><span class="icon-btn outlined" style="width:44px;height:30px;border-radius:6px">${icon('plus', 18)}</span><div class="grow"><b>Add a payment method</b><small>Card, Apple Pay, Google Pay</small></div></button>
        <div class="summary">
          <div class="line"><span>${minutes}-minute lesson</span><b>${money(price)}</b></div>
          <div class="line"><span>Processing fee</span><b>${money(fee)}</b></div>
          <div class="line total"><span>Total</span><b>${money(total)}</b></div>
        </div>
        <div class="policy">
          <div>${icon('check')} Free rescheduling or cancellation up to 12 hours before</div>
          <div>${icon('check')} Not the right fit? Your next trial with another tutor is on us</div>
        </div>
        <div class="notice">${icon('info')} Demo checkout: no payment is taken and no card details are collected.</div>
      </div>`,
    fixed: `<div class="actionbar"><div class="price"><b>${money(total)}</b><small>${fmtDay(start)}, ${fmtTime(start)}</small></div><button class="btn btn-primary" data-act="confirm">Confirm booking</button></div>`,
  };
}

// ---- Booking confirmed ----
function Confirmed(r) {
  const b = findBooking(r.id);
  if (!b) return NotFound();
  const t = tutorById(b.tutorId);
  const s = new Date(b.start);
  return {
    mode: 'bare',
    html: `<section class="done">
      <div class="done-check">${icon('check', 54)}</div>
      <h1>You’re booked!</h1>
      <p>${firstName(t.name)} will see you ${fmtLong(s)} at ${fmtTime(s)}. We’ll remind you before it starts.</p>
      ${tutorMini(t, `${b.minutes} min · ${fmtDay(s)}, ${fmtTime(s)}`)}
      <div class="actions">
        <button class="btn btn-outline btn-block" data-act="ics" data-id="${b.id}">${icon('calendar', 20)} Add to calendar</button>
        <a class="btn btn-outline btn-block" href="#/chat/${t.id}">${icon('chat', 20)} Message ${firstName(t.name)}</a>
        <a class="btn btn-primary btn-block" href="#/lessons">Go to my lessons</a>
      </div>
    </section>`,
    mount() {
      const box = $('.done');
      const colors = ['var(--brand)', 'var(--sun)', 'var(--mint)', 'var(--sky)', 'var(--lilac)', 'var(--ink)'];
      for (let i = 0; i < 28; i++) {
        const c = document.createElement('i');
        c.className = 'confetti';
        c.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.6}s;animation-duration:${1.8 + Math.random()}s`;
        box.appendChild(c);
      }
    },
  };
}

// ---- Lessons ----
let lessonsTab = 'upcoming';
function Lessons(r) {
  if (r.q.tab) lessonsTab = r.q.tab === 'past' ? 'past' : 'upcoming';
  const up = upcoming();
  const past = pastLessons();
  const list = lessonsTab === 'upcoming' ? up : past;
  const card = (b) => {
    const t = tutorById(b.tutorId);
    const s = new Date(b.start);
    const e = new Date(s.getTime() + b.minutes * 60000);
    const isPast = b.status === 'done';
    const actions = isPast
      ? `<a class="btn btn-outline btn-sm" href="#/book/${t.id}">Book again</a>${b.rating ? '' : `<button class="btn btn-outline btn-sm" data-act="rate" data-id="${b.id}">Rate lesson</button>`}`
      : `<a class="btn btn-primary btn-sm" href="#/classroom/${b.id}">${icon('video', 18)} Join</a><a class="btn btn-outline btn-sm" href="#/book/${t.id}?re=${b.id}">Reschedule</a><button class="btn btn-outline btn-sm" style="flex:none;width:40px;padding:0" data-act="cancel" data-id="${b.id}" aria-label="Cancel lesson">${icon('x', 18)}</button>`;
    return `<article class="lesson ${isPast ? 'past' : ''}">
      <div class="datebox"><small>${s.toLocaleDateString(undefined, { month: 'short' })}</small><b>${s.getDate()}</b><span>${s.toLocaleDateString(undefined, { weekday: 'short' })}</span></div>
      <div class="grow">
        <div class="lesson-top"><img src="${photo(t.img, 80)}" alt="" /><b>${langById(t.teaches).name} with ${firstName(t.name)}</b>${b.trial ? '<span class="tag">Trial</span>' : ''}</div>
        <div class="lesson-time">${icon('clock', 15)} ${fmtTime(s)} – ${fmtTime(e)}${!isPast ? ` · ${until(s)}` : ''}${isPast && b.rating ? ` <span class="mini-stars">${stars(b.rating)}</span>` : ''}</div>
        <div class="lesson-actions">${actions}</div>
      </div>
    </article>`;
  };
  const empty = lessonsTab === 'upcoming'
    ? emptyState('calendar', 'No lessons booked', 'Find a tutor and book a trial — it only takes a minute.', '<a class="btn btn-primary" href="#/search">Find a tutor</a>')
    : emptyState('book', 'No past lessons yet', 'Lessons you finish will show up here with your ratings and notes.');
  return {
    tab: 'lessons',
    html: `<header class="page-head"><h1>Lessons</h1><a class="icon-btn outlined" href="#/search" aria-label="Book a lesson">${icon('plus')}</a></header>
      <div class="pad" style="margin-bottom:16px"><div class="seg">
        <button class="${lessonsTab === 'upcoming' ? 'on' : ''}" data-act="lTab" data-v="upcoming">Upcoming${up.length ? ` (${up.length})` : ''}</button>
        <button class="${lessonsTab === 'past' ? 'on' : ''}" data-act="lTab" data-v="past">Past${past.length ? ` (${past.length})` : ''}</button>
      </div></div>
      ${list.length ? list.map(card).join('') : empty}`,
  };
}

// ---- Classroom (mock video lesson) ----
let cls = null;
function Classroom(r) {
  const b = findBooking(r.id);
  if (!b) return NotFound();
  const t = tutorById(b.tutorId);
  const lang = langById(t.teaches);
  const vocab = PHRASES[lang.id];
  const lines = [t.greeting, ...vocab.map(([p, m]) => `Let’s practise: “${p}” — ${m}`), 'Great! Now try using it in a sentence of your own.', 'Nice pronunciation 👏'];
  b.words ||= [];
  cls = { b, lang, mic: true, cam: false, panel: false, tab: 'vocab', stream: null };
  return {
    mode: 'bare',
    html: '',
    fixed: `<div class="class">
      <header class="class-top">
        <button class="icon-btn" data-act="cLeave" aria-label="Leave classroom">${icon('back')}</button>
        <div class="grow"><b>${lang.name} with ${firstName(t.name)}</b><small id="timer">00:00 / ${b.minutes}:00</small></div>
        <span class="live-pill">LIVE</span>
      </header>
      <div class="stage">
        <img class="bg" src="${photo(t.img, 300)}" alt="" />
        <div class="face-wrap"><img class="face" src="${photo(t.img, 600)}" alt="${t.name}" /></div>
        <span class="name-tag">${icon('mic', 15)} ${firstName(t.name)}</span>
        <div class="self" id="self"></div>
      </div>
      <div class="caption"><div><small>Live captions</small><div class="txt" id="cap">${lines[0]}</div></div></div>
      <div class="controls">
        <button class="ctl" id="ctlMic" data-act="cMic" aria-label="Mute microphone">${icon('mic')}</button>
        <button class="ctl" id="ctlCam" data-act="cCam" aria-label="Turn camera on">${icon('videoOff')}</button>
        <button class="ctl" id="ctlNotes" data-act="cPanel" aria-label="Vocabulary and notes">${icon('note')}</button>
        <button class="ctl end" data-act="cEnd" aria-label="End lesson">${icon('phone', 26)}</button>
      </div>
      <div class="panel" id="panel">
        <div class="panel-head"><div class="seg" id="ctabs"><button class="on" data-act="cTab" data-v="vocab">Vocabulary</button><button data-act="cTab" data-v="notes">Notes</button></div>
        <button class="icon-btn" data-act="cPanel" aria-label="Close">${icon('x')}</button></div>
        <div class="panel-body" id="panelBody"></div>
      </div>
    </div>`,
    mount() {
      paintSelf();
      paintPanel();
      const started = Date.now();
      const timer = setInterval(() => {
        const s = Math.floor((Date.now() - started) / 1000);
        const el = $('#timer');
        if (el) el.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)} / ${b.minutes}:00`;
      }, 1000);
      let li = 0;
      const captions = setInterval(() => {
        li = (li + 1) % lines.length;
        const el = $('#cap');
        if (el) el.outerHTML = `<div class="txt" id="cap">${lines[li]}</div>`;
      }, 5500);
      return () => {
        clearInterval(timer);
        clearInterval(captions);
        cls?.stream?.getTracks().forEach((tr) => tr.stop());
        cls = null;
      };
    },
  };
}
function paintSelf() {
  const self = $('#self');
  if (!self || !cls) return;
  self.innerHTML = cls.cam && cls.stream
    ? '<video autoplay playsinline muted></video>'
    : `<span class="avatar">${initial()}</span>`;
  if (cls.cam && cls.stream) $('video', self).srcObject = cls.stream;
  if (!cls.mic) self.insertAdjacentHTML('beforeend', `<span class="muted-ic">${icon('micOff', 14)}</span>`);
}
function paintPanel() {
  const body = $('#panelBody');
  if (!body || !cls) return;
  const { b, lang } = cls;
  $$('#ctabs button').forEach((x) => x.classList.toggle('on', x.dataset.v === cls.tab));
  if (cls.tab === 'vocab') {
    const items = [...PHRASES[lang.id], ...b.words];
    body.innerHTML = items.map(([p, m]) => `<div class="vocab"><div class="grow"><b>${esc(p)}</b><small>${esc(m)}</small></div>
        <button class="speak" data-act="speak" data-text="${esc(p)}" data-lang="${lang.speech}" aria-label="Listen">${icon('volume', 18)}</button></div>`).join('') +
      `<div class="add-word"><input class="input" id="newWord" placeholder="Add a word or phrase" /><button class="btn btn-dark" data-act="cAddWord">Add</button></div>`;
  } else {
    body.innerHTML = `<textarea class="notes" id="notes" placeholder="Jot down corrections, new grammar, homework…">${esc(b.notes || '')}</textarea>`;
    $('#notes').addEventListener('input', (e) => { b.notes = e.target.value; save(); });
  }
}

// ---- Messages ----
function Messages() {
  const list = Object.entries(state.threads)
    .map(([id, th]) => ({ t: tutorById(id), th, last: th.msgs[th.msgs.length - 1] }))
    .filter((x) => x.t && x.last)
    .sort((a, b) => b.last.ts - a.last.ts);
  return {
    tab: 'messages',
    html: `<header class="page-head"><h1>Messages</h1></header>
      ${list.length ? list.map(({ t, th, last }) => `<a class="thread ${th.unread ? 'unread' : ''}" href="#/chat/${t.id}">
          <div class="ph"><img src="${photo(t.img, 120)}" alt="" />${online(t) ? '<span class="online"></span>' : ''}</div>
          <div class="grow"><div class="top"><b>${t.name}</b><time>${ago(last.ts)}</time></div>
          <p><span style="overflow:hidden;text-overflow:ellipsis">${last.from === 'me' ? 'You: ' : ''}${esc(last.text)}</span>${th.unread ? '<i class="unread-dot"></i>' : ''}</p></div>
        </a>`).join('')
        : emptyState('chat', 'No messages yet', 'Message a tutor to ask about lessons before you book.', '<a class="btn btn-primary" href="#/search">Find a tutor</a>')}`,
  };
}

// ---- Chat ----
let chatPaint = null;
let chatTutor = null;
const chatTyping = {};
function Chat(r) {
  const t = tutorById(r.id);
  if (!t) return NotFound();
  const th = thread(t.id);
  th.unread = false;
  save();
  const suggestions = ['Hi! I’d like to book a trial lesson.', 'What materials do you use?', 'Can you help me prepare for an exam?'];
  return {
    mode: 'full',
    html: `<section class="chat">
      <header class="chat-head">
        <button class="icon-btn" data-act="back" data-fallback="#/messages" aria-label="Back">${icon('back')}</button>
        <a href="#/tutor/${t.id}" style="display:flex;gap:10px;align-items:center;flex:1;min-width:0">
          <img src="${photo(t.img, 120)}" alt="" /><div class="grow"><b>${t.name}</b><small>${online(t) ? 'Online now' : 'Usually replies within an hour'}</small></div>
        </a>
        <a class="btn btn-primary btn-sm" href="#/book/${t.id}">Book</a>
      </header>
      <div class="msgs" id="msgs"></div>
      <div class="suggest" id="suggest">${th.msgs.some((m) => m.from === 'me') ? '' : suggestions.map((s) => `<button class="chip" data-act="suggest" data-text="${esc(s)}">${s}</button>`).join('')}</div>
      <div class="composer">
        <textarea id="txt" rows="1" placeholder="Message ${firstName(t.name)}…" aria-label="Message"></textarea>
        <button class="send" id="send" data-act="send" disabled aria-label="Send">${icon('send', 20)}</button>
      </div>
    </section>`,
    mount() {
      const msgs = $('#msgs');
      const txt = $('#txt');
      chatTutor = t.id;
      chatPaint = (typing = chatTyping[t.id]) => {
        let lastDay = '';
        msgs.innerHTML = th.msgs.map((m) => {
          const d = new Date(m.ts);
          const k = dayKey(d);
          const sep = k !== lastDay ? `<div class="day-sep">${isToday(d) ? 'Today' : fmtDay(d)}</div>` : '';
          lastDay = k;
          return `${sep}<div class="msg ${m.from}">${esc(m.text)}<time>${fmtTime(d)}</time></div>`;
        }).join('') + (typing ? '<div class="typing"><i></i><i></i><i></i></div>' : '');
        msgs.scrollTop = msgs.scrollHeight;
      };
      chatPaint();
      txt.addEventListener('input', () => {
        $('#send').disabled = !txt.value.trim();
        txt.style.height = 'auto';
        txt.style.height = Math.min(txt.scrollHeight, 120) + 'px';
      });
      txt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && matchMedia('(pointer: fine)').matches) { e.preventDefault(); A.send(); }
      });
      return () => { chatPaint = null; chatTutor = null; };
    },
  };
}
function sendMessage(tutorId, text) {
  const th = thread(tutorId);
  th.msgs.push({ from: 'me', text, ts: Date.now() });
  save();
  chatPaint?.();
  const s = $('#suggest');
  if (s) s.innerHTML = '';
  setTimeout(() => { chatTyping[tutorId] = true; if (chatTutor === tutorId) chatPaint?.(true); }, 700);
  setTimeout(() => {
    chatTyping[tutorId] = false;
    th.msgs.push({ from: 'them', text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)], ts: Date.now() });
    if (chatTutor === tutorId) chatPaint?.(false); else th.unread = true;
    save();
    if (current?.name === 'messages') rerender(); else renderTabs(currentTab);
  }, 2600);
}

// ---- Profile ----
function Profile() {
  const lang = langById(state.learning);
  const lvl = LEVELS.find((l) => l.id === state.level);
  const goal = GOALS.find((g) => g.id === state.goal);
  const chev = icon('chevron', 20, 'chev');
  const row = (ic, title, sub, attrs, right = chev, tag = 'button') =>
    `<${tag} class="row" ${attrs}><span class="ic-box">${icon(ic, 20)}</span><div class="grow"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>${right}</${tag}>`;
  return {
    tab: 'profile',
    html: `<header class="page-head"><h1>Profile</h1></header>
      <div class="me"><span class="avatar lg">${initial()}</span><div class="grow"><b>${esc(state.name || 'Guest')}</b><small>Learning ${lang.name} · ${lvl?.name ?? ''}</small></div>
        <button class="icon-btn outlined" data-act="editMe" aria-label="Edit profile">${icon('pen', 20)}</button></div>
      <div class="plan"><div class="grow"><small>Subscription</small><b>${state.plan ? `${state.plan} lessons a month` : 'No active plan'}</b></div><button class="btn btn-dark btn-sm" data-act="plans">${state.plan ? 'Change' : 'See plans'}</button></div>
      <p class="menu-title">Learning</p>
      <div class="row-list">
        ${row('heart', 'Saved tutors', `${state.saved.length} saved`, 'href="#/saved"', chev, 'a')}
        ${row('trophy', 'Learning goal', goal?.name ?? 'Not set', 'data-act="editMe"')}
        ${row('book', 'Lesson history', `${pastLessons().length} completed`, 'href="#/lessons?tab=past"', chev, 'a')}
      </div>
      <p class="menu-title">Settings</p>
      <div class="row-list">
        ${row('bell', 'Lesson reminders', 'Push and email', 'data-act="notif"', `<span class="switch ${state.notifications ? 'on' : ''}"></span>`)}
        ${row('card', 'Payment methods', 'Demo card •••• 4242', 'data-act="toast" data-msg="Payments aren’t connected in this demo"')}
        ${row('globe', 'Time zone', esc(tz), '', '', 'div')}
        ${row('help', 'Help centre', 'FAQs and support', 'data-act="toast" data-msg="Help centre — coming soon"')}
      </div>
      <p class="menu-title">Demo</p>
      <div class="row-list">
        ${row('sparkle', 'Load demo data', 'Sample lessons, tutors and messages', 'data-act="demoLogin"', '')}
        ${row('refresh', 'Reset app', 'Clear everything saved on this device', 'data-act="reset"', '')}
        ${row('logout', 'Back to website', '', 'href="../"', chev, 'a')}
      </div>
      <p class="fine">Tutora · prototype build</p>`,
  };
}

// ---- Saved ----
function Saved() {
  const list = state.saved.map(tutorById).filter(Boolean);
  return {
    tab: 'profile',
    html: `${topbar('Saved tutors', '#/profile')}
      ${list.length ? `<div class="tlist">${list.map(tutorCard).join('')}</div>`
        : emptyState('heart', 'No saved tutors yet', 'Tap the heart on any tutor to keep them here.', '<a class="btn btn-primary" href="#/search">Browse tutors</a>')}`,
  };
}

function NotFound() {
  return { tab: null, mode: 'bare', html: emptyState('help', 'Page not found', 'That link doesn’t lead anywhere.', '<a class="btn btn-primary" href="#/home">Go home</a>') };
}

// ================= Actions (data-act="…") =================
const A = {
  noop() {},
  closeSheet,
  toast: (el) => toast(el.dataset.msg),
  speak: (el) => speak(el.dataset.text, el.dataset.lang),
  back(el) {
    if (navDepth > 0) history.back();
    else location.hash = el.dataset.fallback || '#/home';
  },
  demoLogin() {
    seedDemo();
    closeSheet();
    if (location.hash === '#/home') rerender(); else location.hash = '#/home';
    toast('Demo account loaded');
  },
  save(el) {
    const id = el.dataset.id;
    const on = !state.saved.includes(id);
    state.saved = on ? [...state.saved, id] : state.saved.filter((x) => x !== id);
    save();
    el.classList.toggle('on', on);
    el.setAttribute('aria-pressed', on);
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    toast(on ? 'Saved to your tutors' : 'Removed from saved');
    if (current?.name === 'saved') rerender();
  },
  share(el) {
    const t = tutorById(el.dataset.id);
    const url = location.href;
    if (navigator.share) navigator.share({ title: t.name, text: t.headline, url }).catch(() => {});
    else navigator.clipboard?.writeText(url).then(() => toast('Link copied'), () => toast('Couldn’t copy link'));
  },
  intro(el) {
    const t = tutorById(el.dataset.id);
    const lang = langById(t.teaches);
    openSheet(`<div class="intro">
      <img class="face" src="${photo(t.img, 300)}" alt="" />
      <div class="wave">${'<i></i>'.repeat(14)}</div>
      <blockquote>“${t.greeting}”</blockquote>
      <p class="muted">${t.name} · ${lang.name} tutor</p>
      <div class="foot one">
        <button class="btn btn-outline" data-act="speak" data-text="${esc(t.greeting)}" data-lang="${lang.speech}">${icon('volume', 20)} Play again</button>
        <a class="btn btn-primary" href="#/book/${t.id}">Book trial lesson</a>
      </div></div>`);
    speak(t.greeting, lang.speech);
  },

  // Onboarding
  obPick(el) {
    ob[el.dataset.k] = el.dataset.v;
    rerender();
    const step = ob.step;
    clearTimeout(obTimer);
    obTimer = setTimeout(() => { if (ob && ob.step === step) A.obNext(); }, 260);
  },
  obNext() {
    if (!ob) return;
    if (ob.step < 3) { ob.step++; rerender(); view.scrollTop = 0; return; }
    Object.assign(state, { onboarded: true, learning: ob.learning, level: ob.level, goal: ob.goal, name: ob.name.trim() });
    save();
    filters.lang = state.learning;
    ob = null;
    location.hash = `#/search?lang=${state.learning}`;
    toast(`Welcome, ${state.name}! Here are tutors for you.`);
  },
  obBack() {
    clearTimeout(obTimer);
    if (ob && ob.step > 0) { ob.step--; rerender(); } else { ob = null; location.hash = '#/welcome'; }
  },

  // Search filters
  pickLang() {
    openSheet(`<h2>I want to learn</h2><p>Pick a language to see its tutors.</p>
      <div class="ob-list">${LANGUAGES.map((l) => `<button class="opt ${filters.lang === l.id ? 'on' : ''}" data-act="setLang" data-v="${l.id}">
        <span class="glyph tint-${l.tint}">${l.glyph}</span><div><b>${l.name}</b><small>${l.tutors.toLocaleString()} tutors</small></div></button>`).join('')}</div>`);
  },
  setLang(el) {
    filters.lang = el.dataset.v;
    filters.specs = [];
    closeSheet();
    history.replaceState(null, '', `#/search?lang=${filters.lang}`);
    rerender();
    view.scrollTop = 0;
  },
  fPrice() {
    const label = (v) => (+v >= MAX_PRICE ? 'Any price' : `Up to $${v}`);
    openSheet(`<h2>Price per lesson</h2><p>For a 50-minute lesson.</p>
      <div class="range-val" id="rv">${label(filters.max)}</div>
      <input type="range" class="range" id="rr" min="10" max="${MAX_PRICE}" step="1" value="${filters.max}" aria-label="Maximum price" />
      <div class="range-ends"><span>$10</span><span>$${MAX_PRICE}+</span></div>
      <div class="foot"><button class="btn btn-outline" data-act="priceReset">Reset</button><button class="btn btn-primary" data-act="priceApply">Show tutors</button></div>`,
    (s) => { const rr = $('#rr', s); rr.addEventListener('input', () => ($('#rv', s).textContent = label(rr.value))); });
  },
  priceApply() { filters.max = +$('#rr').value; closeSheet(); rerender(); },
  priceReset() { filters.max = MAX_PRICE; closeSheet(); rerender(); },
  fTime() {
    openSheet(`<h2>When can you learn?</h2><p>Show tutors with open times in the next 7 days.</p>
      <div class="check-list">${BUCKETS.map(([id, label, range]) => `<button class="opt ${filters.times.includes(id) ? 'on' : ''}" data-act="toggleOn" data-v="${id}">
        <div><b>${label}</b><small>${range}</small></div><span class="radio">${filters.times.includes(id) ? icon('check', 14) : ''}</span></button>`).join('')}</div>
      <div class="foot"><button class="btn btn-outline" data-act="timeReset">Reset</button><button class="btn btn-primary" data-act="timeApply">Show tutors</button></div>`);
  },
  timeApply() { filters.times = $$('.sheet .opt.on').map((o) => o.dataset.v); closeSheet(); rerender(); },
  timeReset() { filters.times = []; closeSheet(); rerender(); },
  fSpec() {
    const all = [...new Set(TUTORS.filter((t) => t.teaches === filters.lang).flatMap((t) => t.specialties))];
    openSheet(`<h2>Specialties</h2><p>What do you want lessons to focus on?</p>
      <div class="pills">${all.map((s) => `<button class="chip ${filters.specs.includes(s) ? 'on' : ''}" data-act="toggleOn" data-v="${esc(s)}">${s}</button>`).join('')}</div>
      <div class="foot"><button class="btn btn-outline" data-act="specReset">Reset</button><button class="btn btn-primary" data-act="specApply">Show tutors</button></div>`);
  },
  specApply() { filters.specs = $$('.sheet .chip.on').map((o) => o.dataset.v); closeSheet(); rerender(); },
  specReset() { filters.specs = []; closeSheet(); rerender(); },
  toggleOn(el) {
    const on = el.classList.toggle('on');
    const r = $('.radio', el);
    if (r) r.innerHTML = on ? icon('check', 14) : '';
  },
  fTop() { filters.top = !filters.top; rerender(); },
  fNative() { filters.native = !filters.native; rerender(); },
  fSort() {
    openSheet(`<h2>Sort by</h2><div class="check-list" style="margin-top:14px">${Object.entries(SORTS).map(([k, v]) => `<button class="opt ${filters.sort === k ? 'on' : ''}" data-act="setSort" data-v="${k}">
      <div><b>${v}</b></div><span class="radio">${filters.sort === k ? icon('check', 14) : ''}</span></button>`).join('')}</div>`);
  },
  setSort(el) { filters.sort = el.dataset.v; closeSheet(); rerender(); },
  fClear() { Object.assign(filters, { q: '', max: MAX_PRICE, times: [], specs: [], top: false, native: false, sort: 'best' }); rerender(); },

  // Tutor profile
  jump(el) { $('#sec-' + el.dataset.to)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  bioMore() { prof.more = !prof.more; rerender(); },
  tDay(el) {
    prof.day = el.dataset.k;
    $('#sched').innerHTML = scheduleHtml(tutorById(prof.id), prof.day, null, 't');
  },
  tSlot(el) { location.hash = `#/book/${prof.id}?d=${prof.day}&t=${el.dataset.t}`; },

  // Booking
  bLen(el) { bk.minutes = +el.dataset.m; rerender(); },
  bDay(el) {
    bk.day = el.dataset.k;
    bk.time = null;
    const t = tutorById(bk.tutorId);
    $('#sched').innerHTML = scheduleHtml(t, bk.day, bk.time, 'b');
    fixed.innerHTML = bookBar(t);
  },
  bSlot(el) {
    bk.time = el.dataset.t;
    $$('#sched .slot').forEach((s) => s.classList.toggle('on', s === el));
    fixed.innerHTML = bookBar(tutorById(bk.tutorId));
  },
  bNext() {
    if (!bk.time) return;
    if (bk.re) {
      const b = findBooking(bk.re);
      b.start = at(bk.day, bk.time).toISOString();
      save();
      location.hash = '#/lessons';
      toast(`Moved to ${fmtDay(new Date(b.start))}, ${fmtTime(new Date(b.start))}`);
      return;
    }
    location.hash = `#/checkout/${bk.tutorId}?d=${bk.day}&t=${bk.time}&m=${bk.minutes}`;
  },
  confirm() {
    if (!pending) return;
    if (new Date(pending.start).getTime() < Date.now()) { toast('That time has passed — pick another'); return; }
    const b = { id: uid(), ...pending, status: 'upcoming' };
    const t = tutorById(b.tutorId);
    const s = new Date(b.start);
    state.bookings.push(b);
    state.onboarded = true;
    const th = thread(t.id);
    th.msgs.push({ from: 'them', text: `Hi ${state.name || 'there'}! Thanks for booking — I’m looking forward to our lesson on ${fmtDay(s)} at ${fmtTime(s)}. Is there anything you’d like to focus on?`, ts: Date.now() });
    th.unread = true;
    save();
    pending = null;
    bk = null;
    location.hash = `#/confirmed/${b.id}`;
  },
  ics(el) { downloadIcs(findBooking(el.dataset.id)); },

  // Lessons
  lTab(el) { lessonsTab = el.dataset.v; history.replaceState(null, '', `#/lessons?tab=${lessonsTab}`); rerender(); },
  cancel(el) {
    const b = findBooking(el.dataset.id);
    const t = tutorById(b.tutorId);
    const hoursAway = (new Date(b.start) - Date.now()) / 3600e3;
    openSheet(`<h2>Cancel this lesson?</h2>
      <p>${langById(t.teaches).name} with ${t.name}, ${fmtDay(new Date(b.start))} at ${fmtTime(new Date(b.start))}.
      ${hoursAway >= 12 ? 'It’s more than 12 hours away, so cancelling is free.' : 'It starts in less than 12 hours — normally this would be charged.'}</p>
      <div class="foot"><button class="btn btn-outline" data-act="closeSheet">Keep it</button><button class="btn btn-dark" data-act="cancelYes" data-id="${b.id}">Cancel lesson</button></div>`);
  },
  cancelYes(el) {
    findBooking(el.dataset.id).status = 'cancelled';
    save();
    closeSheet();
    rerender();
    toast('Lesson cancelled');
  },
  rate(el) { openRate(findBooking(el.dataset.id)); },
  star(el) {
    const n = +el.dataset.n;
    $$('.stars-input button').forEach((b, i) => b.classList.toggle('on', i < n));
    const go = $('#rateGo');
    go.disabled = false;
    go.dataset.n = n;
  },
  rateSubmit(el) {
    const b = findBooking(el.dataset.id);
    b.rating = +el.dataset.n;
    save();
    closeSheet();
    rerender();
    toast('Thanks for the feedback!');
  },

  // Classroom
  cLeave() { location.hash = '#/lessons'; },
  cMic() {
    cls.mic = !cls.mic;
    const btn = $('#ctlMic');
    btn.classList.toggle('off', !cls.mic);
    btn.innerHTML = icon(cls.mic ? 'mic' : 'micOff');
    paintSelf();
  },
  async cCam() {
    const btn = $('#ctlCam');
    if (!cls.cam) {
      try {
        cls.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (!cls) return; // left the classroom while the permission prompt was open
        cls.cam = true;
      } catch {
        toast('Camera unavailable — check your browser permissions');
        return;
      }
    } else {
      cls.stream?.getTracks().forEach((tr) => tr.stop());
      cls.stream = null;
      cls.cam = false;
    }
    btn.classList.toggle('on', cls.cam);
    btn.innerHTML = icon(cls.cam ? 'video' : 'videoOff');
    paintSelf();
  },
  cPanel() {
    cls.panel = !cls.panel;
    $('#panel').classList.toggle('open', cls.panel);
    $('#ctlNotes').classList.toggle('on', cls.panel);
  },
  cTab(el) { cls.tab = el.dataset.v; paintPanel(); },
  cAddWord() {
    const inp = $('#newWord');
    const w = inp.value.trim();
    if (!w) return;
    cls.b.words.push([w, 'Added during the lesson']);
    save();
    paintPanel();
    $('#newWord')?.focus();
  },
  cEnd() {
    const b = cls.b;
    b.status = 'done';
    save();
    location.hash = '#/lessons?tab=past';
    setTimeout(() => openRate(b), 450);
  },

  // Chat
  send() {
    const txt = $('#txt');
    const text = txt?.value.trim();
    if (!text || !chatTutor) return;
    sendMessage(chatTutor, text);
    txt.value = '';
    txt.style.height = '';
    $('#send').disabled = true;
  },
  suggest(el) { if (chatTutor) sendMessage(chatTutor, el.dataset.text); },

  // Profile
  editMe() {
    openSheet(`<h2>Your profile</h2><p>Tutors see your first name and learning goal.</p>
      <div style="display:grid;gap:14px">
        <label class="field"><span>First name</span><input class="input" id="pfName" maxlength="30" value="${esc(state.name)}" /></label>
        <label class="field"><span>Learning</span><select class="input" id="pfLang">${LANGUAGES.map((l) => `<option value="${l.id}" ${l.id === state.learning ? 'selected' : ''}>${l.name}</option>`).join('')}</select></label>
        <label class="field"><span>Level</span><select class="input" id="pfLevel">${LEVELS.map((l) => `<option value="${l.id}" ${l.id === state.level ? 'selected' : ''}>${l.name}</option>`).join('')}</select></label>
        <label class="field"><span>Goal</span><select class="input" id="pfGoal">${GOALS.map((g) => `<option value="${g.id}" ${g.id === state.goal ? 'selected' : ''}>${g.name}</option>`).join('')}</select></label>
      </div>
      <div class="foot"><button class="btn btn-outline" data-act="closeSheet">Cancel</button><button class="btn btn-primary" data-act="saveMe">Save</button></div>`);
  },
  saveMe() {
    state.name = $('#pfName').value.trim() || state.name;
    state.learning = $('#pfLang').value;
    state.level = $('#pfLevel').value;
    state.goal = $('#pfGoal').value;
    filters.lang = state.learning;
    save();
    closeSheet();
    rerender();
    toast('Profile updated');
  },
  plans() {
    const base = 20;
    const opts = [[4, 0], [8, 10], [12, 15]];
    openSheet(`<h2>Choose a plan</h2><p>Lessons renew monthly. Change or cancel any time.</p>
      <div class="plans">${opts.map(([n, off]) => `<button class="plan-opt ${state.plan === n ? 'on' : ''}" data-act="setPlan" data-n="${n}">
        <div class="grow"><b>${n} lessons a month${off ? `<span class="save">Save ${off}%</span>` : ''}</b><small>${n / 4} per week · 50 minutes each</small></div>
        <span class="amt">${money(Math.round(n * base * (1 - off / 100)))}</span></button>`).join('')}</div>
      <div class="notice">${icon('info')} Demo only: choosing a plan doesn’t charge anything.</div>`);
  },
  setPlan(el) { state.plan = +el.dataset.n; save(); closeSheet(); rerender(); toast('Plan selected (demo)'); },
  notif() { state.notifications = !state.notifications; save(); rerender(); },
  reset() {
    openSheet(`<h2>Reset the app?</h2><p>This clears your profile, lessons, saved tutors and messages on this device.</p>
      <div class="foot"><button class="btn btn-outline" data-act="closeSheet">Cancel</button><button class="btn btn-dark" data-act="resetYes">Reset</button></div>`);
  },
  resetYes() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    state = blank();
    filters.lang = null;
    closeSheet();
    location.hash = '#/welcome';
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  fn(el, e);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

// ================= Router =================
const routes = {
  welcome: Welcome, onboarding: Onboarding, home: Home, search: Search, tutor: Tutor, book: Book,
  checkout: Checkout, confirmed: Confirmed, lessons: Lessons, classroom: Classroom, messages: Messages,
  chat: Chat, profile: Profile, saved: Saved,
};
const TABS = [['home', 'home', 'Home'], ['search', 'search', 'Search'], ['lessons', 'calendar', 'Lessons'], ['messages', 'chat', 'Messages'], ['profile', 'user', 'Profile']];

let current = null;
let currentTab = null;
let cleanup = null;
let navDepth = 0;

function parse() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = h.split('?');
  const [name, id] = path.split('/');
  return { name, id: id && decodeURIComponent(id), q: Object.fromEntries(new URLSearchParams(qs)) };
}

function renderTabs(active) {
  currentTab = active;
  tabbar.classList.toggle('hidden', !active);
  if (!active) { tabbar.innerHTML = ''; return; }
  const unread = Object.values(state.threads).filter((t) => t.unread).length;
  tabbar.innerHTML = TABS.map(([id, ic, label]) => `<a class="tab ${id === active ? 'on' : ''}" href="#/${id}" ${id === active ? 'aria-current="page"' : ''}>
    <span class="ic-wrap">${icon(ic, 22)}</span>${label}${id === 'messages' && unread ? `<span class="badge">${unread}</span>` : ''}</a>`).join('');
}

function render({ keep = false } = {}) {
  settle();
  let r = parse();
  if (r.name === 'demo') {
    // Shareable link that opens the app with sample data: app/#/demo
    seedDemo();
    r = { name: 'home', q: {} };
    history.replaceState(null, '', '#/home');
  } else if (!routes[r.name]) {
    r = { name: state.onboarded ? 'home' : 'welcome', q: {} };
    history.replaceState(null, '', '#/' + r.name);
  }
  cleanup?.();
  cleanup = null;
  view.onscroll = null;
  if (!keep) closeSheet();
  const scroll = view.scrollTop;
  const scr = routes[r.name](r);
  current = r;
  view.className = `view ${scr.mode || ''}`;
  view.innerHTML = `<div class="${keep ? '' : 'screen'}">${scr.html}</div>`;
  fixed.innerHTML = scr.fixed || '';
  view.scrollTop = keep ? scroll : 0;
  renderTabs(scr.tab || null);
  cleanup = scr.mount?.() || null;
}
const rerender = () => render({ keep: true });

addEventListener('hashchange', () => { navDepth++; render(); });
render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
