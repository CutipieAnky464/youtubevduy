import { isTouchDevice, prefersReducedMotion } from './performance';

export function initRippleEffect(): void {
  document.addEventListener(
    'click',
    (e) => {
      const target = (e.target as HTMLElement).closest('.btn, .ctrl-btn, .history-chip, .theme-btn');
      if (!target || prefersReducedMotion()) return;

      const rect = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      target.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    },
    { passive: true },
  );
}

export function initCursorGlow(): () => void {
  const glow = document.getElementById('cursorGlow');
  if (!glow || isTouchDevice() || prefersReducedMotion()) {
    glow?.remove();
    return () => {};
  }

  let x = 0;
  let y = 0;
  let cx = 0;
  let cy = 0;
  let animId = 0;

  const onMove = (e: MouseEvent): void => {
    x = e.clientX;
    y = e.clientY;
  };

  const animate = (): void => {
    cx += (x - cx) * 0.12;
    cy += (y - cy) * 0.12;
    glow.style.transform = `translate(${cx}px, ${cy}px)`;
    animId = requestAnimationFrame(animate);
  };

  document.addEventListener('mousemove', onMove, { passive: true });
  animId = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animId);
    document.removeEventListener('mousemove', onMove);
  };
}

export function initScrollReveal(): void {
  if (prefersReducedMotion()) {
    document.querySelectorAll('.reveal-on-scroll').forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );

  document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
}

export function initCardTilt(container: HTMLElement): void {
  if (isTouchDevice() || prefersReducedMotion()) return;

  container.addEventListener(
    'mousemove',
    (e) => {
      const card = (e.target as HTMLElement).closest('.video-card') as HTMLElement | null;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateY(-6px) scale(1.02)`;
    },
    { passive: true },
  );

  container.addEventListener(
    'mouseleave',
    () => {
      container.querySelectorAll('.video-card').forEach((card) => {
        (card as HTMLElement).style.transform = '';
      });
    },
    { passive: true },
  );
}

export function initMagneticButtons(): void {
  if (isTouchDevice() || prefersReducedMotion()) return;

  document.querySelectorAll('.ctrl-btn--main, .btn--primary').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const el = btn as HTMLElement;
      const rect = el.getBoundingClientRect();
      const x = (e as MouseEvent).clientX - rect.left - rect.width / 2;
      const y = (e as MouseEvent).clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.05)`;
    });
    btn.addEventListener('mouseleave', () => {
      (btn as HTMLElement).style.transform = '';
    });
  });
}
