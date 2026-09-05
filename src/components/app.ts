import type { AppSettings, Appearance, RepeatMode, ThemeId, VideoItem } from '../types';
import {
  extractVideoId,
  fetchVideoInfo,
  searchVideos,
  YouTubeError,
} from '../services/youtube';
import {
  addSearchHistory,
  loadFavorites,
  loadPlaylist,
  loadSearchHistory,
  loadSettings,
  saveFavorites,
  savePlaylist,
  saveSettings,
} from '../services/storage';
import { PlayerController } from './player';
import { setAmbientBackground, clearAmbientBackground } from '../utils/ambient';
import { getVisualizer } from '../utils/visualizer';
import { renderSkeletonCards } from '../utils/particles';
import { debounce, escapeHtml, showToast } from '../utils/helpers';

const REPEAT_LABELS: Record<RepeatMode, string> = {
  off: 'Lặp lại: Tắt',
  all: 'Lặp lại: Tất cả',
  one: 'Lặp lại: Một video',
};

export class NeonPlayApp {
  private favorites: VideoItem[] = loadFavorites();
  private videoQueue: VideoItem[] = loadPlaylist();
  private searchHistory: string[] = loadSearchHistory();
  private settings: AppSettings = loadSettings();
  private currentIndex = 0;
  private player!: PlayerController;
  private isSearching = false;
  private theaterMode = false;

  private elements = {
    sidebar: document.getElementById('sidebar')!,
    sidebarToggle: document.getElementById('sidebarToggle')!,
    overlay: document.getElementById('overlay')!,
    layout: document.getElementById('layout')!,
    searchInput: document.getElementById('searchInput') as HTMLInputElement,
    linkInput: document.getElementById('linkInput') as HTMLInputElement,
    videoList: document.getElementById('videoList')!,
    favoriteList: document.getElementById('favoriteList')!,
    player: document.getElementById('player') as HTMLIFrameElement,
    queueCount: document.getElementById('queueCount')!,
    favCount: document.getElementById('favCount')!,
    searchHistory: document.getElementById('searchHistory')!,
    shuffleBtn: document.getElementById('shuffleBtn')!,
    repeatBtn: document.getElementById('repeatBtn')!,
    repeatBadge: document.getElementById('repeatBadge')!,
    equalizer: document.getElementById('equalizer')!,
    queueProgress: document.getElementById('queueProgress')!,
    queueBarFill: document.getElementById('queueBarFill')!,
  };

  async init(): Promise<void> {
    this.applyTheme(this.settings.theme);
    this.applyAppearance(this.settings.appearance);
    this.updateModeButtons();
    this.bindEvents();
    this.renderFavorites();
    this.renderVideoList();
    this.renderSearchHistory();
    this.updateQueueProgress();

    this.player = new PlayerController(
      this.elements.player,
      () => this.onVideoEnded(),
      (playing) => this.setPlayingVisual(playing),
    );
    await this.player.init();
    this.setupKeyboardShortcuts();

    if (this.videoQueue.length > 0) {
      this.playVideo(this.currentIndex, false);
    }
  }

  private bindEvents(): void {
    document.getElementById('searchBtn')!.addEventListener('click', () => this.handleSearch());
    document.getElementById('addFavoriteBtn')!.addEventListener('click', () => this.addFavorites());
    document.getElementById('pasteLinkBtn')!.addEventListener('click', () => this.pasteFromClipboard());
    document.getElementById('playSearchBtn')!.addEventListener('click', () => this.playSearchList());
    document.getElementById('playFavoriteBtn')!.addEventListener('click', () => this.playFavoriteList());
    document.getElementById('clearQueueBtn')!.addEventListener('click', () => this.clearQueue());
    document.getElementById('prevBtn')!.addEventListener('click', () => this.playPrev());
    document.getElementById('nextBtn')!.addEventListener('click', () => this.playNext());
    document.getElementById('shuffleBtn')!.addEventListener('click', () => this.toggleShuffle());
    document.getElementById('repeatBtn')!.addEventListener('click', () => this.cycleRepeat());
    document.getElementById('addFavBtn')!.addEventListener('click', () => this.addCurrentToFavorites());
    document.getElementById('copyLinkBtn')!.addEventListener('click', () => this.copyCurrentLink());
    document.getElementById('theaterBtn')!.addEventListener('click', () => this.toggleTheater());
    document.getElementById('appearanceBtn')!.addEventListener('click', () => this.toggleAppearance());
    document.getElementById('helpBtn')!.addEventListener('click', () => this.openShortcutsModal());
    document.getElementById('closeModalBtn')!.addEventListener('click', () => this.closeShortcutsModal());
    document.querySelector('#shortcutsModal .modal__backdrop')?.addEventListener('click', () => this.closeShortcutsModal());

    this.elements.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });
    this.elements.linkInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.addFavorites();
      }
    });

    const debouncedSearch = debounce(() => {
      if (this.elements.searchInput.value.trim().length >= 3) this.handleSearch();
    }, 600);
    this.elements.searchInput.addEventListener('input', debouncedSearch);

    this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    this.elements.overlay.addEventListener('click', () => this.closeSidebar());

    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const theme = (btn as HTMLElement).dataset.theme as ThemeId;
        if (theme) this.setTheme(theme);
      });
    });
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'n':
          this.playNext();
          break;
        case 'p':
          this.playPrev();
          break;
        case '/':
          e.preventDefault();
          this.elements.searchInput.focus();
          break;
        case 'f':
          this.toggleSidebar();
          break;
        case 't':
          this.toggleTheater();
          break;
        case '?':
          this.openShortcutsModal();
          break;
        case 'escape':
          if (!document.getElementById('shortcutsModal')!.hidden) {
            this.closeShortcutsModal();
          } else if (this.theaterMode) this.toggleTheater();
          else {
            this.closeSidebar();
            this.elements.searchInput.blur();
          }
          break;
      }
    });
  }

  private setPlayingVisual(playing: boolean): void {
    this.elements.equalizer.hidden = !playing;
    document.getElementById('playerWrap')?.classList.toggle('player-wrap--playing', playing);
    if (playing) getVisualizer()?.start();
    else getVisualizer()?.stop();
  }

  private applyAppearance(appearance: Appearance): void {
    document.documentElement.dataset.appearance = appearance;
    const btn = document.getElementById('appearanceBtn');
    if (btn) btn.textContent = appearance === 'dark' ? '🌙' : '☀️';
  }

  private toggleAppearance(): void {
    this.settings.appearance = this.settings.appearance === 'dark' ? 'light' : 'dark';
    saveSettings(this.settings);
    this.applyAppearance(this.settings.appearance);
    showToast({
      message: this.settings.appearance === 'dark' ? 'Dark mode' : 'Light mode',
      type: 'info',
      duration: 2000,
    });
  }

  private openShortcutsModal(): void {
    document.getElementById('shortcutsModal')!.hidden = false;
  }

  private closeShortcutsModal(): void {
    document.getElementById('shortcutsModal')!.hidden = true;
  }

  private applyTheme(theme: ThemeId): void {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.classList.toggle('is-active', (btn as HTMLElement).dataset.theme === theme);
    });
  }

  private setTheme(theme: ThemeId): void {
    this.settings.theme = theme;
    saveSettings(this.settings);
    this.applyTheme(theme);
    showToast({ message: `Theme: ${theme}`, type: 'info', duration: 2000 });
  }

  private toggleShuffle(): void {
    this.settings.shuffle = !this.settings.shuffle;
    saveSettings(this.settings);
    this.updateModeButtons();
    showToast({
      message: this.settings.shuffle ? 'Shuffle: Bật' : 'Shuffle: Tắt',
      type: 'info',
      duration: 2000,
    });
  }

  private cycleRepeat(): void {
    const order: RepeatMode[] = ['off', 'all', 'one'];
    const idx = order.indexOf(this.settings.repeat);
    this.settings.repeat = order[(idx + 1) % order.length];
    saveSettings(this.settings);
    this.updateModeButtons();
    showToast({ message: REPEAT_LABELS[this.settings.repeat], type: 'info', duration: 2000 });
  }

  private updateModeButtons(): void {
    this.elements.shuffleBtn.classList.toggle('ctrl-btn--active', this.settings.shuffle);
    this.elements.repeatBtn.classList.toggle('ctrl-btn--active', this.settings.repeat !== 'off');
    this.elements.repeatBtn.title = REPEAT_LABELS[this.settings.repeat];
    this.elements.repeatBadge.hidden = this.settings.repeat !== 'one';
  }

  private toggleTheater(): void {
    this.theaterMode = !this.theaterMode;
    this.elements.layout.classList.toggle('layout--theater', this.theaterMode);
    document.getElementById('theaterBtn')?.classList.toggle('ctrl-btn--active', this.theaterMode);
  }

  private toggleSidebar(): void {
    this.elements.sidebar.classList.toggle('sidebar--open');
    this.elements.overlay.classList.toggle('overlay--visible');
  }

  private closeSidebar(): void {
    this.elements.sidebar.classList.remove('sidebar--open');
    this.elements.overlay.classList.remove('overlay--visible');
  }

  private setLoading(loading: boolean): void {
    this.isSearching = loading;
    const btnText = document.getElementById('searchBtnText');
    const searchBtn = document.getElementById('searchBtn');
    if (loading) {
      this.elements.videoList.innerHTML = renderSkeletonCards(6);
      if (btnText) btnText.textContent = 'Đang tìm...';
      searchBtn?.classList.add('btn--loading');
    } else {
      if (btnText) btnText.textContent = 'Tìm kiếm';
      searchBtn?.classList.remove('btn--loading');
    }
  }

  private updateQueueProgress(): void {
    const total = this.videoQueue.length;
    const current = total > 0 ? this.currentIndex + 1 : 0;
    this.elements.queueProgress.textContent = `${current} / ${total}`;
    const pct = total > 1 ? ((this.currentIndex + 1) / total) * 100 : total === 1 ? 100 : 0;
    this.elements.queueBarFill.style.width = `${pct}%`;
  }

  private getCurrentVideo(): VideoItem | null {
    return this.videoQueue[this.currentIndex] ?? null;
  }

  private async handleSearch(): Promise<void> {
    const query = this.elements.searchInput.value.trim();
    if (!query) {
      showToast({ message: 'Vui lòng nhập từ khóa tìm kiếm', type: 'warning' });
      return;
    }
    if (this.isSearching) return;

    this.setLoading(true);
    try {
      this.videoQueue = await searchVideos(query);
      savePlaylist(this.videoQueue);
      this.searchHistory = addSearchHistory(query);
      this.renderSearchHistory();
      this.renderVideoList();
      this.playVideo(0);
      showToast({ message: `Tìm thấy ${this.videoQueue.length} video`, type: 'success' });
    } catch (error) {
      showToast({
        message: error instanceof YouTubeError ? error.message : 'Lỗi kết nối. Thử lại sau.',
        type: 'error',
      });
      this.renderVideoList();
    } finally {
      this.isSearching = false;
      const btnText = document.getElementById('searchBtnText');
      const searchBtn = document.getElementById('searchBtn');
      if (btnText) btnText.textContent = 'Tìm kiếm';
      searchBtn?.classList.remove('btn--loading');
    }
  }

  private renderSearchHistory(): void {
    const el = this.elements.searchHistory;
    if (!this.searchHistory.length) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }

    el.hidden = false;
    el.innerHTML = `
      <span class="search-history__label">Gần đây:</span>
      ${this.searchHistory
        .map(
          (q) =>
            `<button class="history-chip" data-query="${escapeHtml(q)}" type="button">${escapeHtml(q)}</button>`,
        )
        .join('')}`;

    el.querySelectorAll('.history-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.elements.searchInput.value = (chip as HTMLElement).dataset.query ?? '';
        this.handleSearch();
      });
    });
  }

  private renderVideoList(): void {
    const { videoList, queueCount } = this.elements;
    queueCount.textContent = String(this.videoQueue.length);
    this.updateQueueProgress();

    if (!this.videoQueue.length) {
      videoList.innerHTML = `
        <div class="empty-state fade-in">
          <div class="empty-state__icon">🎬</div>
          <p>Tìm kiếm video hoặc thêm vào danh sách yêu thích</p>
        </div>`;
      return;
    }

    videoList.innerHTML = this.videoQueue
      .map(
        (video, index) => `
        <article class="video-card reveal-card ${index === this.currentIndex ? 'video-card--active' : ''}"
                 data-index="${index}" tabindex="0" role="button"
                 style="--delay: ${index * 60}ms"
                 aria-label="Phát ${escapeHtml(video.title)}">
          <div class="video-card__thumb-wrap">
            <img src="${video.thumb}" alt="" loading="lazy" class="video-card__thumb">
            <span class="video-card__index">${index + 1}</span>
            ${index === this.currentIndex ? '<span class="video-card__badge">Đang phát</span>' : ''}
            <button class="video-card__remove" data-index="${index}" type="button" aria-label="Xóa khỏi queue">×</button>
            <button class="video-card__fav" data-id="${video.id}" type="button" aria-label="Thêm yêu thích">♥</button>
          </div>
          <h3 class="video-card__title">${escapeHtml(video.title)}</h3>
        </article>`,
      )
      .join('');

    videoList.querySelectorAll('.video-card').forEach((card) => {
      const index = Number((card as HTMLElement).dataset.index);
      card.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.video-card__remove, .video-card__fav')) return;
        this.playVideo(index);
      });
      card.addEventListener('keydown', (e) => {
        const key = (e as KeyboardEvent).key;
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          this.playVideo(index);
        }
      });
    });

    videoList.querySelectorAll('.video-card__remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeFromQueue(Number((btn as HTMLElement).dataset.index));
      });
    });

    videoList.querySelectorAll('.video-card__fav').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).dataset.id!;
        const video = this.videoQueue.find((v) => v.id === id);
        if (video) this.addVideoToFavorites(video);
      });
    });
  }

  private renderFavorites(): void {
    const { favoriteList, favCount } = this.elements;
    favCount.textContent = String(this.favorites.length);

    if (!this.favorites.length) {
      favoriteList.innerHTML = `<div class="empty-state empty-state--compact"><p>Chưa có video yêu thích</p></div>`;
      return;
    }

    favoriteList.innerHTML = this.favorites
      .map(
        (video, index) => `
        <div class="fav-item" data-index="${index}" tabindex="0" role="button">
          <img src="${video.thumb}" alt="" class="fav-item__thumb">
          <span class="fav-item__title">${escapeHtml(video.title)}</span>
          <button class="fav-item__delete" data-index="${index}" type="button" aria-label="Xóa">×</button>
        </div>`,
      )
      .join('');

    favoriteList.querySelectorAll('.fav-item').forEach((item) => {
      const index = Number((item as HTMLElement).dataset.index);
      item.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.fav-item__delete')) return;
        this.playFavorite(index);
      });
    });

    favoriteList.querySelectorAll('.fav-item__delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteFavorite(Number((btn as HTMLElement).dataset.index));
      });
    });
  }

  private playVideo(index: number, scroll = true): void {
    if (!this.videoQueue[index]) return;
    this.currentIndex = index;
    this.player.play(this.videoQueue[index]);
    setAmbientBackground(this.videoQueue[index].thumb);
    this.renderVideoList();
    this.closeSidebar();

    if (scroll) {
      document.querySelector('.player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private onVideoEnded(): void {
    if (this.settings.repeat === 'one') {
      this.playVideo(this.currentIndex, false);
      return;
    }
    this.playNext();
  }

  private playNext(): void {
    if (!this.videoQueue.length) return;

    if (this.settings.shuffle && this.videoQueue.length > 1) {
      let next = this.currentIndex;
      while (next === this.currentIndex) {
        next = Math.floor(Math.random() * this.videoQueue.length);
      }
      this.playVideo(next);
      return;
    }

    if (this.currentIndex < this.videoQueue.length - 1) {
      this.playVideo(this.currentIndex + 1);
    } else if (this.settings.repeat === 'all') {
      this.playVideo(0);
    } else {
      showToast({ message: 'Đã phát hết danh sách', type: 'info' });
    }
  }

  private playPrev(): void {
    if (!this.videoQueue.length) return;

    if (this.currentIndex > 0) {
      this.playVideo(this.currentIndex - 1);
    } else if (this.settings.repeat === 'all') {
      this.playVideo(this.videoQueue.length - 1);
    }
  }

  private removeFromQueue(index: number): void {
    if (index < 0 || index >= this.videoQueue.length) return;
    this.videoQueue.splice(index, 1);
    savePlaylist(this.videoQueue);

    if (!this.videoQueue.length) {
      this.currentIndex = 0;
      this.elements.player.src = '';
      document.getElementById('nowPlaying')!.textContent = 'Chưa chọn video';
      clearAmbientBackground();
    } else if (index < this.currentIndex) {
      this.currentIndex--;
    } else if (index === this.currentIndex) {
      this.currentIndex = Math.min(this.currentIndex, this.videoQueue.length - 1);
      this.playVideo(this.currentIndex, false);
    }

    this.renderVideoList();
    showToast({ message: 'Đã xóa khỏi queue', type: 'info', duration: 2000 });
  }

  private async pasteFromClipboard(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        this.elements.linkInput.value = text;
        showToast({ message: 'Đã dán link', type: 'success', duration: 2000 });
      }
    } catch {
      showToast({ message: 'Không thể đọc clipboard', type: 'warning' });
    }
  }

  private async addFavorites(): Promise<void> {
    const input = this.elements.linkInput.value.trim();
    if (!input) {
      showToast({ message: 'Vui lòng nhập ít nhất một link YouTube', type: 'warning' });
      return;
    }

    const links = input.split(',').map((l) => l.trim()).filter(Boolean);
    let added = 0;

    for (const link of links) {
      const id = extractVideoId(link);
      if (!id) continue;
      if (this.favorites.some((f) => f.id === id)) continue;
      const info = await fetchVideoInfo(id);
      this.favorites.push({ id, ...info });
      added++;
    }

    if (added > 0) {
      saveFavorites(this.favorites);
      this.elements.linkInput.value = '';
      this.renderFavorites();
      showToast({ message: `Đã thêm ${added} video`, type: 'success' });
    } else {
      showToast({ message: 'Không có video mới để thêm', type: 'warning' });
    }
  }

  private addVideoToFavorites(video: VideoItem): void {
    if (this.favorites.some((f) => f.id === video.id)) {
      showToast({ message: 'Đã có trong yêu thích', type: 'info', duration: 2000 });
      return;
    }
    this.favorites.push(video);
    saveFavorites(this.favorites);
    this.renderFavorites();
    showToast({ message: 'Đã thêm yêu thích', type: 'success', duration: 2000 });
  }

  private addCurrentToFavorites(): void {
    const video = this.getCurrentVideo();
    if (!video) {
      showToast({ message: 'Chưa có video đang phát', type: 'warning' });
      return;
    }
    this.addVideoToFavorites(video);
  }

  private async copyCurrentLink(): Promise<void> {
    const video = this.getCurrentVideo();
    if (!video) {
      showToast({ message: 'Chưa có video đang phát', type: 'warning' });
      return;
    }
    const url = `https://www.youtube.com/watch?v=${video.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast({ message: 'Đã sao chép link', type: 'success', duration: 2000 });
    } catch {
      showToast({ message: 'Không thể sao chép', type: 'error' });
    }
  }

  private deleteFavorite(index: number): void {
    this.favorites.splice(index, 1);
    saveFavorites(this.favorites);
    this.renderFavorites();
    showToast({ message: 'Đã xóa khỏi yêu thích', type: 'info', duration: 2000 });
  }

  private playFavorite(index: number): void {
    this.videoQueue = [...this.favorites];
    savePlaylist(this.videoQueue);
    this.playVideo(index);
  }

  private playSearchList(): void {
    const saved = loadPlaylist();
    if (!saved.length) {
      showToast({ message: 'Chưa có danh sách tìm kiếm', type: 'warning' });
      return;
    }
    this.videoQueue = saved;
    this.renderVideoList();
    this.playVideo(0);
  }

  private playFavoriteList(): void {
    if (!this.favorites.length) {
      showToast({ message: 'Danh sách yêu thích trống', type: 'warning' });
      return;
    }
    this.videoQueue = [...this.favorites];
    savePlaylist(this.videoQueue);
    this.renderVideoList();
    this.playVideo(0);
  }

  private clearQueue(): void {
    this.videoQueue = [];
    this.currentIndex = 0;
    savePlaylist([]);
    this.elements.player.src = '';
    document.getElementById('nowPlaying')!.textContent = 'Chưa chọn video';
    document.getElementById('playerWrap')?.classList.remove('player-wrap--active', 'player-wrap--playing');
    this.setPlayingVisual(false);
    clearAmbientBackground();
    this.renderVideoList();
    showToast({ message: 'Đã xóa danh sách phát', type: 'info' });
  }
}
