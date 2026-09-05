const BAR_COUNT = 48;

export class AudioVisualizer {
  private ctx: CanvasRenderingContext2D;
  private bars: Float32Array;
  private targets: Float32Array;
  private animId = 0;
  private running = false;
  private phase = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Canvas 2D not supported');
    this.ctx = context;
    this.bars = new Float32Array(BAR_COUNT);
    this.targets = new Float32Array(BAR_COUNT);
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.canvas.classList.add('visualizer--active');
    this.tick();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animId);
    this.canvas.classList.remove('visualizer--active');
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private tick = (): void => {
    if (!this.running) return;

    this.phase += 0.08;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    for (let i = 0; i < BAR_COUNT; i++) {
      const wave =
        Math.sin(this.phase + i * 0.25) * 0.35 +
        Math.sin(this.phase * 1.7 + i * 0.12) * 0.25 +
        Math.random() * 0.08;
      this.targets[i] = Math.max(0.06, Math.min(1, 0.25 + wave + 0.35));
      this.bars[i] += (this.targets[i] - this.bars[i]) * 0.18;
    }

    this.ctx.clearRect(0, 0, w, h);
    const barW = w / BAR_COUNT;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '0, 212, 255';

    for (let i = 0; i < BAR_COUNT; i++) {
      const barH = this.bars[i] * h * 0.85;
      const x = i * barW + barW * 0.15;
      const y = h - barH;

      const grad = this.ctx.createLinearGradient(0, h, 0, y);
      grad.addColorStop(0, `rgba(${accent}, 0.15)`);
      grad.addColorStop(0.5, `rgba(${accent}, 0.55)`);
      grad.addColorStop(1, `rgba(${accent}, 0.95)`);

      this.ctx.fillStyle = grad;
      this.ctx.fillRect(x, y, barW * 0.7, barH);
    }

    this.animId = requestAnimationFrame(this.tick);
  };
}

let instance: AudioVisualizer | null = null;

export function initVisualizer(canvas: HTMLCanvasElement): AudioVisualizer {
  instance = new AudioVisualizer(canvas);
  return instance;
}

export function getVisualizer(): AudioVisualizer | null {
  return instance;
}
