import type { VideoItem } from '../types';

const API_KEY = (import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined)?.trim();

export function isApiConfigured(): boolean {
  return Boolean(
    API_KEY &&
    API_KEY.length > 10 &&
    API_KEY !== 'your_youtube_api_key_here',
  );
}

export class YouTubeError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'YouTubeError';
  }
}

export async function searchVideos(query: string, maxResults = 12): Promise<VideoItem[]> {
  if (!isApiConfigured()) {
    throw new YouTubeError(
      'Chưa cấu hình API key. Tạo file .env và thêm VITE_YOUTUBE_API_KEY.',
      'MISSING_API_KEY',
    );
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('q', query);
  url.searchParams.set('key', API_KEY!);
  url.searchParams.set('maxResults', String(maxResults));

  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string; errors?: { reason?: string }[] };
    } | null;
    const reason = body?.error?.errors?.[0]?.reason;
    throw new YouTubeError(
      body?.error?.message ?? 'Không thể tìm kiếm video. Vui lòng thử lại.',
      reason,
    );
  }

  const data = (await response.json()) as {
    items: {
      id: { videoId: string };
      snippet: {
        title: string;
        thumbnails: { medium: { url: string } };
      };
    }[];
  };

  return data.items.map((item) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    thumb: item.snippet.thumbnails.medium.url,
  }));
}

export async function fetchVideoInfo(videoId: string): Promise<Pick<VideoItem, 'title' | 'thumb'>> {
  const url = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(url);

  if (!response.ok) {
    return {
      title: 'Video không rõ tên',
      thumb: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    };
  }

  const data = (await response.json()) as { title?: string; thumbnail_url?: string };

  return {
    title: data.title ?? 'Video không rõ tên',
    thumb: data.thumbnail_url ?? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  };
}

export function extractVideoId(url: string): string | null {
  const match = url.match(/(?:v=|\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function getEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    enablejsapi: '1',
    rel: '0',
    modestbranding: '1',
  });
  return `https://www.youtube.com/embed/${videoId}?${params}`;
}

export function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();

  return new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve();

    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(script);
  });
}
