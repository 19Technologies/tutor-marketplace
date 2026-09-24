import { LANGUAGES, TUTORS, photo, langById } from './shared/data.js';
import { icon, logoMark } from './shared/icons.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---- Icons & logo ----
$$('[data-logo]').forEach((el) => (el.innerHTML = logoMark(30)));
$$('[data-icon]').forEach((el) => (el.innerHTML = icon(el.dataset.icon, el.closest('.stars') ? 17 : 20)));

// ---- Hero search ----
const langSelect = $('#heroLang');
langSelect.innerHTML = LANGUAGES.map((l) => `<option value="${l.id}">${l.name}</option>`).join('');
$('#heroSearch').addEventListener('submit', (e) => {
  e.preventDefault();
  location.href = `app/#/search?lang=${langSelect.value}`;
});

$('#avatarStack').innerHTML = TUTORS.slice(4, 9).map((t) => `<img src="${photo(t.img, 96)}" alt="" loading="lazy" />`).join('');

// ---- Language grid ----
$('#langGrid').innerHTML = LANGUAGES.map((l, i) => `
  <a class="lang-card reveal" style="--d:${(i % 4) * 0.05}s" href="app/#/search?lang=${l.id}">
    <span class="lang-glyph tint-${l.tint}">${l.glyph}</span>
    <span class="arrow-dot">${icon('arrow', 18)}</span>
    <div><h3>${l.name}</h3><small>${l.tutors.toLocaleString()} tutors</small></div>
  </a>`).join('');

// ---- Tutor rail ----
const featured = TUTORS.filter((t) => t.top).concat(TUTORS.filter((t) => !t.top)).slice(0, 10);
$('#tutorRail').innerHTML = featured.map((t) => `
  <a class="t-card" href="app/#/tutor/${t.id}">
    <div class="t-photo">
      <img src="${photo(t.img, 400)}" alt="${t.name}" loading="lazy" />
      ${t.top ? `<span class="t-badge">${icon('sparkle', 13)} Top tutor</span>` : ''}
    </div>
    <div class="t-body">
      <div class="t-name">${t.name} <span>${t.flag}</span></div>
      <div class="t-meta">Teaches ${langById(t.teaches).name} · ${t.specialties[0]}</div>
      <div class="t-row">
        <span class="t-rating">${icon('star', 16)} ${t.rating.toFixed(1)} <small>(${t.reviews})</small></span>
        <span class="t-price"><b>$${t.price}</b> <small>/ 50 min</small></span>
      </div>
    </div>
  </a>`).join('');

const rail = $('#tutorRail');
$$('[data-scroll]').forEach((btn) =>
  btn.addEventListener('click', () => rail.scrollBy({ left: Number(btn.dataset.scroll) * 616, behavior: 'smooth' }))
);

// ---- Nav ----
const nav = $('#nav');
const toggle = $('#navToggle');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
$$('#navLinks a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---- Placeholder links ----
const toast = $('#toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}
$$('[data-soon]').forEach((el) =>
  el.addEventListener('click', (e) => {
    e.preventDefault();
    showToast(`${el.dataset.soon} — coming soon`);
  })
);

// ---- Reveal on scroll ----
const io = new IntersectionObserver(
  (entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
$$('.reveal').forEach((el) => io.observe(el));

$('#year').textContent = new Date().getFullYear();
