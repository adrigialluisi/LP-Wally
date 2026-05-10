/* ============================================
   WALLY FONSECA TATTOO — MAIN.JS v3
   i18n · Portfolio filter · Lightbox · CountUp
   About slides · Smooth scroll
   ============================================ */

(function () {
  'use strict';

  const SUPPORTED_LANGS = ['en', 'pt', 'es', 'fr'];
  const DEFAULT_LANG = 'en';

  let currentLang = DEFAULT_LANG;
  let translations = {};
  let aboutSlide = 0;
  const ABOUT_TOTAL = 2;

  /* ── i18n ──────────────────────────────────── */

  function detectLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && SUPPORTED_LANGS.includes(urlLang)) return urlLang;

    const stored = sessionStorage.getItem('wf-lang');
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;

    const navLang = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    if (SUPPORTED_LANGS.includes(navLang)) return navLang;

    return DEFAULT_LANG;
  }

  async function loadTranslation(lang) {
    try {
      const res = await fetch(`assets/i18n/${lang}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[i18n] Failed to load ${lang}.json`, err);
      if (lang !== DEFAULT_LANG) return loadTranslation(DEFAULT_LANG);
      return {};
    }
  }

  function resolve(obj, path) {
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
  }

  function applyTranslations(data) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const value = resolve(data, el.getAttribute('data-i18n'));
      if (value !== null) el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const value = resolve(data, el.getAttribute('data-i18n-aria'));
      if (value !== null) el.setAttribute('aria-label', value);
    });

    if (data.meta) {
      document.title = data.meta.title || document.title;
      document.documentElement.lang = data.meta.lang || 'en';
      const set = (sel, val) => { const el = document.querySelector(sel); if (el && val) el.content = val; };
      set('meta[name="description"]', data.meta.description);
      set('meta[property="og:title"]', data.meta.title);
      set('meta[property="og:description"]', data.meta.description);
      set('meta[property="og:locale"]', data.meta.locale);
      set('meta[name="twitter:title"]', data.meta.title);
      set('meta[name="twitter:description"]', data.meta.description);
    }
  }

  async function switchLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
    currentLang = lang;
    sessionStorage.setItem('wf-lang', lang);

    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);

    translations = await loadTranslation(lang);
    applyTranslations(translations);

    const current = document.querySelector('.lang-current');
    if (current) current.textContent = lang.toUpperCase();
  }


  /* ── Header scroll ────────────────────────── */

  function initHeaderScroll() {
    const hdr = document.getElementById('hdr');
    if (!hdr) return;
    window.addEventListener('scroll', () => {
      hdr.classList.toggle('hdr--solid', window.scrollY > 80);
    }, { passive: true });
  }


  /* ── Language dropdown ────────────────────── */

  function initLangDropdown() {
    const current = document.querySelector('.lang-current');
    const dropdown = document.querySelector('.lang-dropdown');
    if (!current || !dropdown) return;

    current.addEventListener('click', () => dropdown.classList.toggle('open'));

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.lang-wrap')) dropdown.classList.remove('open');
    });

    dropdown.querySelectorAll('.lang-selector__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchLanguage(btn.dataset.lang);
        dropdown.classList.remove('open');
      });
    });
  }


  /* ── Portfolio filter + load more ─────────── */

  function initPortfolio() {
    const pills = document.querySelectorAll('.pill');
    const items = document.querySelectorAll('.mosaic__item');
    const loadMoreBtn = document.getElementById('loadMore');
    if (!pills.length || !items.length) return;

    function filterArt(cat) {
      let shown = 0;
      items.forEach((item) => {
        const match = cat === 'all' || item.dataset.category === cat;
        if (match && shown < 6) {
          item.style.display = '';
          item.removeAttribute('data-hidden');
          shown++;
        } else if (match) {
          item.style.display = 'none';
          item.setAttribute('data-hidden', 'true');
        } else {
          item.style.display = 'none';
          item.removeAttribute('data-hidden');
        }
      });
      updateLM();
    }

    function updateLM() {
      const h = document.querySelectorAll('.mosaic__item[data-hidden]');
      if (loadMoreBtn) loadMoreBtn.style.display = h.length ? 'block' : 'none';
    }

    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => { p.classList.remove('active'); p.setAttribute('aria-selected', 'false'); });
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
        filterArt(pill.dataset.filter);
      });
    });

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        let count = 0;
        document.querySelectorAll('.mosaic__item[data-hidden]').forEach((item) => {
          if (count < 6) { item.style.display = ''; item.removeAttribute('data-hidden'); count++; }
        });
        updateLM();
      });
    }

    updateLM();
  }


  /* ── About slides ─────────────────────────── */

  function initAboutSlides() {
    const track = document.getElementById('aboutTrack');
    const dots = document.querySelectorAll('.about-dot');
    const arrows = document.querySelectorAll('.about-arrow');
    if (!track) return;

    function goSlide(n) {
      aboutSlide = Math.max(0, Math.min(n, ABOUT_TOTAL - 1));
      track.style.transform = `translateX(-${aboutSlide * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === aboutSlide));
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => goSlide(parseInt(dot.dataset.slideTo, 10)));
    });

    arrows.forEach((arrow) => {
      arrow.addEventListener('click', () => {
        arrow.dataset.slide === 'prev' ? goSlide(aboutSlide - 1) : goSlide(aboutSlide + 1);
      });
    });

    let touchX = 0;
    const slider = document.querySelector('.about-slides');
    if (slider) {
      slider.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
      slider.addEventListener('touchend', (e) => {
        const diff = touchX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? goSlide(aboutSlide + 1) : goSlide(aboutSlide - 1);
      }, { passive: true });
    }
  }


  /* ── Lightbox ─────────────────────────────── */

  function initLightbox() {
    const lb = document.getElementById('lb');
    const lbImg = document.getElementById('lbImg');
    const lbClose = document.querySelector('.lb__x');
    if (!lb || !lbImg) return;

    function openLb(src, alt) {
      lbImg.src = src;
      lbImg.alt = alt || '';
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeLb() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.mosaic__item').forEach((item) => {
      item.addEventListener('click', () => {
        const img = item.querySelector('.mosaic__img');
        if (img) openLb(img.src, img.alt);
      });
    });

    if (lbClose) lbClose.addEventListener('click', closeLb);
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
  }


  /* ── Count up ─────────────────────────────── */

  function initCountUp() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const counters = document.querySelectorAll('[data-countup]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const text = el.textContent.trim();
        const hasPlus = text.includes('+');
        const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
        if (isNaN(num) || num === 0 || reduced) { observer.unobserve(el); return; }
        animateCount(el, num, hasPlus);
        observer.unobserve(el);
      });
    }, { threshold: 0.3 });

    counters.forEach((c) => observer.observe(c));
  }

  function animateCount(el, target, hasPlus) {
    const duration = 2000;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target) + (hasPlus ? '+' : '');
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + (hasPlus ? '+' : '');
    }
    requestAnimationFrame(step);
  }


  /* ── Reveal on scroll ─────────────────────── */

  function initReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach((el) => observer.observe(el));
  }


  /* ── Smooth scroll ────────────────────────── */

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const hdrH = document.getElementById('hdr')?.offsetHeight || 0;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - hdrH, behavior: 'smooth' });
      });
    });
  }


  /* ── Init ──────────────────────────────────── */

  async function init() {
    currentLang = detectLanguage();
    await switchLanguage(currentLang);

    initHeaderScroll();
    initLangDropdown();
    initPortfolio();
    initAboutSlides();
    initLightbox();
    initCountUp();
    initReveal();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
