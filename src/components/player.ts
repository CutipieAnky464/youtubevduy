import type { VideoItem, YTOnStateChangeEvent, YTPlayer } from '../types';
import { YTPlayerState } from '../types';
import { getEmbedUrl, loadYouTubeApi } from '../services/youtube';

export class PlayerController {
  private player: YTPlayer | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private iframe: HTMLIFrameElement;
  private onEnded: () => void;
  private onPlayingChange: (playing: boolean) => void;

  constructor(
    iframe: HTMLIFrameElement,
    onEnded: () => void,
    onPlayingChange: (playing: boolean) => void = () => {},
  ) {
    this.iframe = iframe;
    this.onEnded = onEnded;
    this.onPlayingChange = onPlayingChange;
  }

  async init(): Promise<void> {
    await loadYouTubeApi();
    this.player = new window.YT.Player(this.iframe.id, {
      events: { onStateChange: (event) => this.handleStateChange(event) },
    });
  }

  play(video: VideoItem): void {
    this.iframe.src = getEmbedUrl(video.id);
    this.updateNowPlaying(video.title);
    document.getElementById('playerWrap')?.classList.add('player-wrap--active');
  }

  destroy(): void {
    this.clearInterval();
    this.player?.destroy();
  }

  private handleStateChange(event: YTOnStateChangeEvent): void {
    const playing = event.data === YTPlayerState.PLAYING;
    this.onPlayingChange(playing);

    if (playing) {
      this.startEndDetection();
    } else if (event.data === YTPlayerState.ENDED) {
      this.clearInterval();
      this.onPlayingChange(false);
      this.onEnded();
    } else if (event.data !== YTPlayerState.BUFFERING) {
      this.clearInterval();
    }
  }

  private startEndDetection(): void {
    this.clearInterval();
    this.checkInterval = setInterval(() => {
      if (!this.player) return;
      const remaining = this.player.getDuration() - this.player.getCurrentTime();
      if (remaining <= 2 && remaining >= 0) {
        this.clearInterval();
        this.onEnded();
      }
    }, 1000);
  }

  private clearInterval(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private updateNowPlaying(title: string): void {
    const el = document.getElementById('nowPlaying');
    if (el) el.textContent = title;
  }
}
