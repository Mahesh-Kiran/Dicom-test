# SAR Deep Zoom Viewer

A production-ready MERN application for visualizing large satellite/SAR images with Google Maps-like pan & zoom experience.

## Features

- **Deep Zoom Viewer**: Smooth pan/zoom for large images (24k×16k+ pixels)
- **Modern UI**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Image Tiling**: Automatic Deep Zoom (DZI) tile generation using Sharp
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- OpenSeadragon for deep zoom functionality
- Zustand for state management
- Framer Motion for animations
- Lucide React icons

### Backend
- Node.js + Express + TypeScript
- Sharp for image processing and tiling
- File system storage (no database required)

### Development
- ESLint + Prettier
- Husky pre-commit hooks
- Vitest + React Testing Library (frontend)
- Jest (backend)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and setup the project:**
```bash
# Install server dependencies
cd server && npm install

# Install web dependencies  
cd ../web && npm install
```

2. **Start development servers:**
```bash
# Terminal 1 - Start backend server
cd server && npm run dev

# Terminal 2 - Start frontend dev server
cd web && npm run dev
```

3. **Open your browser:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Project Structure

```
├── server/                 # Backend API
│   ├── src/
│   │   ├── index.ts       # Express server setup
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── types.ts       # TypeScript types
│   ├── data/              # File storage
│   │   ├── uploads/       # Original images
│   │   └── tiles/         # Generated DZI tiles
│   └── package.json
├── web/                   # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   └── package.json
└── README.md
```

## Usage

1. **Upload an Image**: Click "Upload Image" in the toolbar to select a large image file (.png, .jpg, .tif)
2. **View & Navigate**: Use mouse wheel to zoom, drag to pan, or use the toolbar controls
3. **Keyboard Shortcuts**:
   - `+` / `-`: Zoom in/out
   - `0`: Fit to screen
   - `1`: 1:1 scale
   - `R`: Reset view
   - `F11`: Fullscreen

## API Endpoints

- `POST /api/images/upload` - Upload and tile an image
- `GET /api/images/:id/manifest` - Get image manifest
- `GET /tiles/:id/*` - Serve generated tiles

## Development

### Available Scripts

**Server:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm test         # Run tests
```

**Web:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run tests
```

### Code Quality

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **TypeScript** for type safety

## Performance

- **Lazy Loading**: Tiles are loaded on-demand
- **Caching**: Browser caches tiles automatically
- **Optimization**: Images are pre-tiled for smooth zooming
- **Responsive**: Adapts to different screen sizes

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (with touch gestures)

## License

MIT License - see LICENSE file for details.
