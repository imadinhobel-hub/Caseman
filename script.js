document.getElementById('year').textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// En-tête : ombre au défilement
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Menu mobile
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const setMenu = (open) => {
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
};
burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

// Compteurs
const animateCount = (el) => {
  const to = Number(el.dataset.to);
  if (reduceMotion) { el.textContent = to; return; }
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / 1500, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

// Apparitions progressives
const reveals = document.querySelectorAll('.reveal');
reveals.forEach((el) => {
  const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
  el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.07}s`);
});

const show = (el) => {
  el.classList.add('is-visible');
  el.querySelectorAll('.count').forEach(animateCount);
};

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    show(e.target);
    io.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

reveals.forEach((el) => {
  // Le haut de page s'affiche immédiatement
  if (el.closest('.hero')) requestAnimationFrame(() => show(el));
  else io.observe(el);
});

// Bande défilante des domaines : boucle infinie sans à-coup
document.querySelectorAll('.marquee__track').forEach((track) => {
  if (reduceMotion) return;
  const original = [...track.children];
  // 1) on répète la série jusqu'à dépasser la largeur de l'écran
  while (track.scrollWidth < window.innerWidth * 1.2) {
    original.forEach((li) => track.appendChild(li.cloneNode(true)));
  }
  // 2) on double l'ensemble : l'animation glisse d'exactement une moitié
  [...track.children].forEach((li) => {
    const clone = li.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
  // vitesse constante (~40 px/s), quelle que soit la largeur
  track.style.setProperty('--dur', `${Math.round(track.scrollWidth / 2 / 40)}s`);
});
