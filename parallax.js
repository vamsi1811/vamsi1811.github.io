/**
 * parallax.js — Multi-layer scroll parallax engine
 * Works across all portfolio pages
 */
(function () {
  'use strict';

  /* ── Throttled rAF scroll handler ─────────────────────────── */
  let ticking = false;
  let scrollY = 0;

  function onScroll() {
    scrollY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  /* ── Mouse parallax state ──────────────────────────────────── */
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;

  document.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth  - 0.5) * 2;  // -1 → 1
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── Lerp helper ───────────────────────────────────────────── */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── Main update loop ──────────────────────────────────────── */
  function update() {
    ticking = false;

    // Smooth mouse (called every frame via rAF loop below)
    parallaxMouse();

    /* 1. Floating orbs — different speeds, opposite directions */
    const orbs = document.querySelectorAll('.orb');
    const speeds = [0.06, -0.04, 0.08];
    const xDrifts = [0.03, -0.05, 0.04];
    orbs.forEach((orb, i) => {
      const speed = speeds[i] || 0.05;
      const xDrift = xDrifts[i] || 0;
      orb.style.transform =
        `translateY(${scrollY * speed}px) translateX(${scrollY * xDrift}px)`;
    });

    /* 2. Page banner — slower than scroll (sticky-ish) */
    const banner = document.querySelector('.page-banner-inner');
    if (banner) {
      banner.style.transform = `translateY(${scrollY * 0.28}px)`;
      banner.style.opacity   = Math.max(0, 1 - scrollY / 420);
    }

    /* 3. Hero content layers at different depths */
    const heroEyebrow = document.querySelector('.hero-eyebrow');
    const heroName    = document.querySelector('.hero-name');
    const heroBio     = document.querySelector('.hero-bio');
    const heroCta     = document.querySelector('.hero-cta');
    const heroVisual  = document.querySelector('.hero-visual');
    const quickStrip  = document.querySelector('.quick-strip');

    if (heroName)    heroName.style.transform    = `translateY(${scrollY * 0.12}px)`;
    if (heroEyebrow) heroEyebrow.style.transform = `translateY(${scrollY * 0.10}px)`;
    if (heroBio)     heroBio.style.transform     = `translateY(${scrollY * 0.16}px)`;
    if (heroCta)     heroCta.style.transform     = `translateY(${scrollY * 0.20}px)`;
    if (heroVisual)  heroVisual.style.transform  = `translateY(${scrollY * -0.08}px)`;
    if (quickStrip)  quickStrip.style.transform  = `translateY(${scrollY * 0.05}px)`;

    /* 4. Parallax cards — subtle depth on scroll-into-view */
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const rect   = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const ratio  = (window.innerHeight / 2 - center) / window.innerHeight;
      const speed  = parseFloat(el.dataset.parallax) || 0.06;
      el.style.transform = `translateY(${ratio * speed * 120}px)`;
    });

    /* 5. Section heading chars float slightly */
    document.querySelectorAll('.page-title').forEach(el => {
      const rect  = el.getBoundingClientRect();
      const ratio = (window.innerHeight - rect.top) / window.innerHeight;
      if (ratio > 0 && ratio < 1.5) {
        el.style.transform = `translateY(${(0.5 - ratio) * 18}px)`;
      }
    });

    /* 6. Timeline line grows on scroll */
    // This was using a pseudo-element selector and can break the script in some browsers.
    // The timeline line animation is handled entirely in CSS, so no JS selector is needed here.

    /* 7. Skill bar glow pulses with scroll position */
    document.querySelectorAll('.skill-fill').forEach(fill => {
      const rect = fill.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const vis = 1 - Math.abs(rect.top - window.innerHeight / 2) / (window.innerHeight / 2);
        fill.style.boxShadow = `0 0 ${8 + vis * 16}px rgba(79,142,247,${0.3 + vis * 0.4})`;
      }
    });
  }

  /* ── Mouse parallax (smooth lerp, runs every frame) ───────── */
  function parallaxMouse() {
    mouseX = lerp(mouseX, targetMouseX, 0.06);
    mouseY = lerp(mouseY, targetMouseY, 0.06);

    // Avatar reacts to cursor
    const avatar = document.querySelector('.avatar-wrap');
    if (avatar) {
      avatar.style.transform =
        `rotateY(${mouseX * 8}deg) rotateX(${-mouseY * 6}deg) translateZ(0)`;
    }

    // Badges drift opposite direction
    document.querySelectorAll('.badge').forEach((b, i) => {
      const depth = 0.5 + i * 0.3;
      b.style.transform =
        `translate(${mouseX * 10 * depth}px, ${mouseY * 6 * depth}px)`;
    });

    // Floating particles drift with mouse
    document.querySelectorAll('.px-particle').forEach((p, i) => {
      const d = parseFloat(p.dataset.depth) || 1;
      p.style.transform =
        `translate(${mouseX * 18 * d}px, ${mouseY * 12 * d}px)`;
    });

    // Orbs very subtle mouse drift
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach((orb, i) => {
      const d = [0.03, -0.02, 0.04][i] || 0.02;
      // Compose with existing scroll transform by storing separately
      orb.style.marginLeft = `${mouseX * 30 * d}px`;
      orb.style.marginTop  = `${mouseY * 20 * d}px`;
    });
  }

  /* ── Continuous rAF loop for mouse lerp ───────────────────── */
  function rafLoop() {
    parallaxMouse();
    requestAnimationFrame(rafLoop);
  }

  /* ── Floating particles injector ──────────────────────────── */
  function injectParticles() {
    const container = document.createElement('div');
    container.id = 'px-particles';
    container.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;';

    const count = window.innerWidth < 768 ? 10 : 22;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'px-particle';
      const size   = 2 + Math.random() * 3;
      const x      = Math.random() * 100;
      const y      = Math.random() * 100;
      const dur    = 6 + Math.random() * 10;
      const delay  = Math.random() * 8;
      const depth  = (0.3 + Math.random() * 0.9).toFixed(2);
      p.dataset.depth = depth;
      p.style.cssText = `
        position:absolute;
        left:${x}%;top:${y}%;
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:rgba(79,142,247,${0.15 + Math.random() * 0.25});
        box-shadow:0 0 ${size * 3}px rgba(79,142,247,0.3);
        animation:particleFloat ${dur}s ${delay}s ease-in-out infinite alternate;
        will-change:transform;
      `;
      container.appendChild(p);
    }

    // Gold particles sprinkled in
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div');
      p.className = 'px-particle';
      const size  = 1.5 + Math.random() * 2;
      const dur   = 8 + Math.random() * 8;
      const delay = Math.random() * 6;
      const depth = (0.2 + Math.random() * 0.5).toFixed(2);
      p.dataset.depth = depth;
      p.style.cssText = `
        position:absolute;
        left:${Math.random()*100}%;top:${Math.random()*100}%;
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:rgba(240,192,96,${0.2 + Math.random() * 0.3});
        box-shadow:0 0 ${size*4}px rgba(240,192,96,0.3);
        animation:particleFloat ${dur}s ${delay}s ease-in-out infinite alternate;
        will-change:transform;
      `;
      container.appendChild(p);
    }

    document.body.prepend(container);

    // Inject keyframe
    const style = document.createElement('style');
    style.textContent = `
      @keyframes particleFloat {
        0%   { transform: translateY(0px) translateX(0px) scale(1);   opacity: 0.4; }
        50%  { transform: translateY(-30px) translateX(12px) scale(1.2); opacity: 0.8; }
        100% { transform: translateY(-60px) translateX(-8px) scale(0.8); opacity: 0.3; }
      }
      .avatar-wrap { perspective: 800px; transform-style: preserve-3d; }
    `;
    document.head.appendChild(style);
  }

  /* ── Horizontal parallax on section dividers ──────────────── */
  function initDividerParallax() {
    document.querySelectorAll('.section-divider').forEach(div => {
      div.style.transition = 'width 1s ease, box-shadow 0.5s ease';
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.style.width = '120px';
            e.target.style.boxShadow = '0 0 20px rgba(79,142,247,0.6), 0 0 40px rgba(240,192,96,0.3)';
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.5 });
      obs.observe(div);
    });
  }

  /* ── Tilt effect on glass cards ───────────────────────────── */
  function initCardTilt() {
    const selector = '.g-card, .proj-card, .tl-card, .cert-card, .stat-box, .quick-card, .edu-card';
    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect   = card.getBoundingClientRect();
        const cx     = e.clientX - rect.left;
        const cy     = e.clientY - rect.top;
        const rx     = (cy / rect.height - 0.5) * 12;   // tilt X
        const ry     = (cx / rect.width  - 0.5) * -12;  // tilt Y
        const gx     = (cx / rect.width  * 100).toFixed(1);
        const gy     = (cy / rect.height * 100).toFixed(1);
        card.style.transform =
          `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px) scale(1.02)`;
        card.style.setProperty('--gx', gx + '%');
        card.style.setProperty('--gy', gy + '%');
        card.style.background =
          `radial-gradient(circle at ${gx}% ${gy}%, rgba(79,142,247,0.1) 0%, var(--glass-bg) 60%)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.background = '';
      });
    });
  }

  /* ── Stagger children on scroll-enter ─────────────────────── */
  function initStagger() {
    const rows = ['.projects-grid', '.certs-grid', '.tools-strip',
                  '.interests-grid', '.quick-strip', '.stat-grid'];
    rows.forEach(sel => {
      const container = document.querySelector(sel);
      if (!container) return;
      const children = [...container.children];
      children.forEach((child, i) => {
        child.style.transitionDelay = `${i * 0.07}s`;
      });
    });
  }

  /* ── Scroll-progress indicator ────────────────────────────── */
  function initProgressBar() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    bar.style.cssText = `
      position:fixed;top:0;left:0;height:2px;width:0%;z-index:9999;
      background:linear-gradient(90deg,#4F8EF7,#A78BFA,#F0C060);
      transition:width 0.1s linear;
      box-shadow:0 0 8px rgba(79,142,247,0.6);
    `;
    document.body.appendChild(bar);
    window.addEventListener('scroll', () => {
      const total  = document.documentElement.scrollHeight - window.innerHeight;
      const pct    = total > 0 ? (window.scrollY / total * 100).toFixed(1) : 0;
      bar.style.width = pct + '%';
    });
  }

  /* ── Boot ──────────────────────────────────────────────────── */
  function init() {
    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    injectParticles();
    initDividerParallax();
    initCardTilt();
    initStagger();
    initProgressBar();

    window.addEventListener('scroll', onScroll, { passive: true });
    requestAnimationFrame(rafLoop);

    // Initial paint
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();