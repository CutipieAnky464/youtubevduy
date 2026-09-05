# NeonPlay

> YouTube Playlist Manager — tìm kiếm, quản lý yêu thích và phát tự động theo hàng đợi.

![Tech Stack](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![YouTube API](https://img.shields.io/badge/YouTube_Data_API-v3-FF0000?style=flat&logo=youtube&logoColor=white)

## Tính năng

- **Tìm kiếm video** qua YouTube Data API v3 với debounce và loading state
- **Danh sách yêu thích** lưu trữ persistent bằng LocalStorage
- **Auto-play queue** — tự chuyển video tiếp theo khi video kết thúc
- **Responsive design** — sidebar collapsible trên mobile
- **Keyboard shortcuts** — `/` tìm kiếm, `N` video tiếp, `F` mở yêu thích
- **Toast notifications** — thay thế `alert()` native
- **Accessibility** — ARIA labels, keyboard navigation, semantic HTML

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Build tool | [Vite 6](https://vitejs.dev/) |
| Language | TypeScript (strict mode) |
| Styling | CSS Custom Properties, Glassmorphism |
| API | YouTube Data API v3, noembed.com |
| Storage | LocalStorage |

## Kiến trúc

```
src/
├── main.ts                 # Entry point
├── types.ts                # TypeScript interfaces
├── style.css               # Design system & components
├── components/
│   ├── app.ts              # Main application orchestrator
│   └── player.ts           # YouTube IFrame API controller
├── services/
│   ├── youtube.ts          # API calls & video utilities
│   └── storage.ts          # LocalStorage persistence
└── utils/
    └── helpers.ts          # Toast, debounce, escapeHtml
```

## Cài đặt

### Yêu cầu

- Node.js 18+
- YouTube Data API key ([Google Cloud Console](https://console.cloud.google.com/apis/credentials))

### Chạy local

```bash
# Clone repository
git clone <your-repo-url>
cd neonplay

# Cài dependencies
npm install

# Cấu hình API key
cp .env.example .env
# Sửa .env và thêm VITE_YOUTUBE_API_KEY=your_key_here

# Chạy dev server
npm run dev
```

Mở `http://localhost:5173` trong trình duyệt.

### Build production

```bash
npm run build
npm run preview
```

## Deploy

### Vercel / Netlify

1. Push code lên GitHub
2. Import project trên Vercel/Netlify
3. Thêm environment variable: `VITE_YOUTUBE_API_KEY`
4. Deploy

### GitHub Pages

```bash
npm run build
# Deploy thư mục dist/ lên gh-pages branch
```

## Phím tắt

| Phím | Hành động |
|------|-----------|
| `/` | Focus ô tìm kiếm |
| `N` | Video tiếp theo |
| `F` | Mở/đóng sidebar yêu thích |
| `Esc` | Đóng sidebar |

## Screenshots

> Thêm screenshot sau khi chạy `npm run dev` và chụp màn hình ứng dụng.

## License

MIT
