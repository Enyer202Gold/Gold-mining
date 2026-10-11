/* Motion — Gold Mining 2.0 (MOTION_BIBLE) */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(pointer: fine)').matches;

function initParticles(): void {
  if (REDUCED) return;
  const canvas = document.getElementById('particles') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  interface Particle { x: number; y: number; vx: number; vy: number; size: number; opacity: number; }
  let particles: Particle[] = [];
  let running = true;
  let depth = 0;
  function resize(): void { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  function spawn(): Particle {
    return { x: Math.random() * canvas.width, y: canvas.height + 10, vx: (Math.random() - 0.5) * 0.3, vy: -(0.2 + Math.random() * 0.5), size: 1 + Math.random() * 2.5, opacity: 0.15 + Math.random() * 0.25 };
  }
  function init(): void {
    resize();
    const count = window.innerWidth < 768 ? 50 : 120;
    particles = Array.from({ length: count }, () => { const p = spawn(); p.y = Math.random() * canvas.height; return p; });
  }
  ScrollTrigger.create({ trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1, onUpdate: (self) => { depth = self.progress; } });
  let last = performance.now();
  function tick(now: number): void {
    if (!running) return;
    const dt = Math.min((now - last) / 16.67, 3);
    last = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const speedMul = 1 + depth * 0.5;
    for (const p of particles) {
      p.x += p.vx * dt * speedMul;
      p.y += p.vy * dt * speedMul;
      if (p.y < -10) Object.assign(p, spawn());
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 160, 23, ${p.opacity})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(tick); }
  });
  window.addEventListener('resize', resize);
  init();
  requestAnimationFrame(tick);
}

function initDescent(): void {
  if (REDUCED) return;
  ScrollTrigger.create({
    trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1,
    onUpdate: (self) => { document.documentElement.style.setProperty('--depth', self.progress.toFixed(3)); },
  });
}

function initReveals(): void {
  // El hero tiene su propia intro dedicada (initHero); se excluye del sistema
  // genérico para que dos animaciones no peleen por los mismos elementos
  // (eso los dejaba atorados en opacity: 0).
  const reveals = [...document.querySelectorAll('[data-reveal]')].filter((el) => !el.closest('#hero'));
  if (REDUCED) { reveals.forEach((el) => el.classList.add('visible')); return; }
  reveals.forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 24 }, {
      opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 75%', once: true },
      onComplete: () => el.classList.add('visible'),
    });
  });
  document.querySelectorAll('[data-divider]').forEach((el) => {
    gsap.fromTo(el, { scaleX: 0 }, {
      scaleX: 1, duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 80%', once: true },
    });
  });
}

function initMeters(): void {
  document.querySelectorAll('[data-meter-value]').forEach((el) => {
    const value = parseFloat(el.getAttribute('data-meter-value') || '0');
    const fill = el as HTMLElement;
    if (REDUCED) { fill.style.width = `${Math.min(value, 100)}%`; return; }
    ScrollTrigger.create({
      trigger: el, start: 'top 80%', once: true,
      onEnter: () => { gsap.to(fill, { width: `${Math.min(value, 100)}%`, duration: 0.8, ease: 'power3.out' }); },
    });
  });
}

function initHero(): void {
  const hero = document.getElementById('hero');
  if (!hero || REDUCED) return;
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.from('.hero-badge', { opacity: 0, y: 8, duration: 0.4 }, 0.2)
    .from('.hero-title .hero-line', { opacity: 0, y: 24, duration: 0.6, stagger: 0.12 }, 0.3)
    .from('.hero-subtitle', { opacity: 0, y: 16, duration: 0.5 }, 0.5)
    .from('.hero-desc', { opacity: 0, y: 16, duration: 0.5 }, 0.6)
    .from('.hero-ctas', { opacity: 0, y: 16, duration: 0.5 }, 0.7)
    .from('.hero-more', { opacity: 0, duration: 0.4 }, 0.9);
  gsap.to('.hero-inner', {
    y: -80, opacity: 0.3, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 },
  });
}

async function initLenis(): Promise<void> {
  if (REDUCED || !FINE_POINTER) return;
  try {
    const { default: Lenis } = await import('lenis');
    const lenis = new Lenis({ duration: 1.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } catch { /* fallback: scroll nativo */ }
}

function initBreathing(): void {
  if (REDUCED) return;
  gsap.to('.tunnel-bg', { opacity: 0.92, duration: 3, ease: 'power2.inOut', yoyo: true, repeat: -1 });
}

export function initMotion(): void {
  initParticles(); initDescent(); initReveals();
  initMeters(); initHero(); initBreathing(); initLenis();
}
