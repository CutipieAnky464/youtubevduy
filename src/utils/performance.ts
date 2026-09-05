export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function isMobileViewport(): boolean {
  return window.innerWidth < 768;
}

export function getDevicePixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, 2);
}
