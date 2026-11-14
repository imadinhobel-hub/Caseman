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

// Nos expertises : catégorie active au défilement + scène animée
const xp = document.getElementById('xp');
if (xp) {
  const steps = [...xp.querySelectorAll('.xp-step')];
  const scenes = [...xp.querySelectorAll('.scene')];
  const stepsEl = document.getElementById('xp-steps');
  const stage = document.getElementById('xp-stage');
  xp.classList.add('is-ready');

  const setActive = (n) => {
    if (xp.dataset.active === n) return;
    xp.dataset.active = n;
    steps.forEach((s) => s.classList.toggle('is-active', s.dataset.step === n));
    scenes.forEach((s) => s.classList.toggle('is-on', s.dataset.scene === n));
  };

  // la catégorie qui croise le milieu de l'écran devient active
  const stepIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.dataset.step); });
  }, { rootMargin: '-45% 0px -54% 0px' });
  steps.forEach((s) => stepIO.observe(s));

  // à l'arrivée sur la section, la première scène se joue
  const stageIO = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    if (!xp.dataset.active) setActive('1');
    stageIO.disconnect();
  }, { threshold: 0.3 });
  stageIO.observe(stage);

  // progression le long du rail
  const updateRail = () => {
    const r = stepsEl.getBoundingClientRect();
    const p = Math.min(Math.max((window.innerHeight / 2 - r.top) / r.height, 0), 1);
    stepsEl.style.setProperty('--p', p.toFixed(4));
  };
  updateRail();
  window.addEventListener('scroll', updateRail, { passive: true });
  window.addEventListener('resize', updateRail);

  if (!reduceMotion) {
    // légère inclinaison 3D qui suit la souris
    if (window.matchMedia('(hover: hover)').matches) {
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        stage.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
        stage.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
      });
      stage.addEventListener('pointerleave', () => {
        stage.style.removeProperty('--rx');
        stage.style.removeProperty('--ry');
      });
    }

    // formats de sujets qui défilent, synchronisés avec la liste
    const ticker = document.getElementById('xp-ticker');
    const tags = [...xp.querySelectorAll('.xp-tags li')];
    let ti = 0;
    const showFormat = (i) => {
      tags.forEach((t, k) => t.classList.toggle('is-current', k === i));
      ticker.textContent = tags[i].textContent;
      ticker.classList.remove('is-in');
      void ticker.offsetWidth;
      ticker.classList.add('is-in');
    };
    setInterval(() => {
      if (xp.dataset.active !== '1' || document.hidden) {
        tags.forEach((t) => t.classList.remove('is-current'));
        return;
      }
      ti = (ti + 1) % tags.length;
      showFormat(ti);
    }, 2200);
  }
}
