(function() {
  'use strict';

  const isMobile = window.innerWidth < 768;

  // ===== Particle System =====
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: -1000, y: -1000 };
  const PARTICLE_COUNT = isMobile ? 25 : 60;
  const COLORS = [
    'rgba(147, 130, 220, 0.3)',
    'rgba(255, 154, 139, 0.25)',
    'rgba(100, 180, 255, 0.25)',
  ];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      // Mouse repel
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100 && !isMobile) {
        const force = (100 - dist) / 100 * 0.8;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }

      p.x += p.dx;
      p.y += p.dy;

      // Wrap around edges
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.y > canvas.height + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    requestAnimationFrame(animateParticles);
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  resizeCanvas();
  initParticles();
  animateParticles();

  // ===== Scroll Animations =====
  const animateEls = document.querySelectorAll('.animate-in');
  const sectionLabels = document.querySelectorAll('.section-label');

  // Add animate-in to section labels
  sectionLabels.forEach(el => el.classList.add('animate-in'));

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger delay based on sibling index
        const parent = entry.target.parentElement;
        const siblings = parent ? Array.from(parent.querySelectorAll('.animate-in')) : [];
        const index = siblings.indexOf(entry.target);
        const delay = Math.max(0, index) * 0.12;

        entry.target.style.transitionDelay = delay + 's';
        entry.target.classList.add('visible');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.animate-in').forEach(el => {
    scrollObserver.observe(el);
  });

  // ===== Count-Up Animation =====
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function countUp(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    const duration = 1500;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(easeOutExpo(progress) * target);
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        countUp(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-count]').forEach(el => {
    countObserver.observe(el);
  });

  // ===== 3D Tilt Effect =====
  if (!isMobile) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform =
          `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  // ===== Parallax =====
  const orbs = document.querySelectorAll('.orb');
  const glassCards = document.querySelectorAll('.glass-primary, .glass-secondary');
  if (!isMobile) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      // Background orbs: 0.3x speed
      orbs.forEach((orb, i) => {
        const speed = 0.3 + i * 0.05;
        orb.style.transform = `translateY(${scrollY * speed}px)`;
      });
      // Glass cards: subtle 0.03x parallax for depth
      glassCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const offset = (rect.top - window.innerHeight / 2) * 0.03;
        card.style.transform = `translateY(${offset}px)`;
      });
    }, { passive: true });
  }

  // ===== i18n =====
  const translations = {};
  let currentLang = localStorage.getItem('lang') || 'zh';

  async function loadLang(lang) {
    if (translations[lang]) return translations[lang];
    try {
      const res = await fetch(`i18n/${lang}.json`);
      translations[lang] = await res.json();
      return translations[lang];
    } catch (e) {
      console.warn(`Failed to load ${lang} translations`, e);
      return {};
    }
  }

  function applyLang(dict) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });
    // Update html lang
    document.documentElement.lang = currentLang === 'zh' ? 'zh' : 'en';
  }

  function updateToggleUI() {
    const zhSpan = document.querySelector('.lang-zh');
    const enSpan = document.querySelector('.lang-en');
    if (zhSpan && enSpan) {
      zhSpan.classList.toggle('active', currentLang === 'zh');
      enSpan.classList.toggle('active', currentLang === 'en');
    }
  }

  // Init language
  loadLang(currentLang).then(dict => {
    applyLang(dict);
    updateToggleUI();
  });

  // Toggle handler
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.addEventListener('click', async () => {
      currentLang = currentLang === 'zh' ? 'en' : 'zh';
      localStorage.setItem('lang', currentLang);
      const dict = await loadLang(currentLang);
      applyLang(dict);
      updateToggleUI();
    });
  }

  // ===== Mobile Menu =====
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });

    // Close menu on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });
  }

  // ===== Nav scroll shadow =====
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.06)';
    } else {
      nav.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.03)';
    }
  }, { passive: true });

  // ===== Smooth scroll for nav links =====
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== Hero Load Animation =====
  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      document.getElementById('nav').classList.add('nav-loaded');
      document.querySelector('.hero').classList.add('hero-loaded');
    });
  });

})();
