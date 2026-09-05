let ambientEl: HTMLElement | null = null;

export function initAmbient(): void {
  ambientEl = document.getElementById('ambientBg');
}

export function setAmbientBackground(thumbUrl: string | null): void {
  if (!ambientEl) ambientEl = document.getElementById('ambientBg');
  if (!ambientEl) return;

  if (thumbUrl) {
    ambientEl.style.setProperty('--ambient-image', `url("${thumbUrl}")`);
    ambientEl.classList.add('ambient--active');
  } else {
    ambientEl.classList.remove('ambient--active');
  }
}

export function clearAmbientBackground(): void {
  setAmbientBackground(null);
}
