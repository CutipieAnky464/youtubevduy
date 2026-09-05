interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

import { getDevicePixelRatio, isMobileViewport, prefersReducedMotion } from './performance';

export function initParticles(canvas: HTMLCanvasElement): () => void {
  if (prefersReducedMotion()) {
    canvas.style.display = 'none';
    return () => {};
  }

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return () => {};
  const ctx = context;

  const particles: Particle[] = [];
  let count = isMobileViewport() ? 28 : 48;
  const maxDist = isMobileViewport() ? 100 : 130;
  let animId = 0;
  let w = 0;
  let h = 0;
  let running = true;
  let frame = 0;

  function resize(): void {
    const dpr = getDevicePixelRatio();
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    count = isMobileViewport() ? 28 : 48;
  }

  function seed(): void {
    particles.length = 0;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.4 + 0.4,
      });
    }
  }

  function draw(): void {
    if (!running) return;

    frame++;
    ctx.clearRect(0, 0, w, h);
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '0, 212, 255';

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${accent}, 0.5)`;
      ctx.fill();
    }

    if (frame % 2 === 0) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${accent}, ${0.1 * (1 - dist / maxDist)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  const onVisibility = (): void => {
    running = !document.hidden;
    if (running) draw();
    else cancelAnimationFrame(animId);
  };

  resize();
  seed();
  draw();

  const onResize = (): void => {
    resize();
    seed();
  };

  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    running = false;
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

export function renderSkeletonCards(count = 6): string {
  return Array.from({ length: count }, () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton--thumb shimmer"></div>
      <div class="skeleton skeleton--text shimmer"></div>
      <div class="skeleton skeleton--text skeleton--short shimmer"></div>
    </div>`).join('');
}
