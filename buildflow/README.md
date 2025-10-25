# BuildFlow

A nostalgic, Lego-inspired web application that helps engineers and creative builders generate and visualize DIY projects.

## Features

- Browse existing project manuals
- Generate custom DIY projects with AI
- Interactive flipbook-style instructions
- Materials list with pricing
- Firebase Cloud Storage integration
- Gemini AI integration

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Backend**: Firebase Cloud Storage, Firebase Auth
- **AI**: Google Gemini API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

4. Update `.env.local` with your Firebase and Gemini API credentials

### Development

Run the development server:

```bash
# Demo mode (uses preloaded data)
npm run dev:demo

# Live mode (uses AI generation)
npm run dev:live

# Default development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building

```bash
# Development build
npm run build

# Staging build
npm run build:staging

# Production build
npm run build:production
```

### Scripts

- `npm run dev` - Start development server
- `npm run dev:demo` - Start in demo mode
- `npm run dev:live` - Start in live mode
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
├── services/           # Firebase and API services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Environment Variables

See `.env.local.example` for required environment variables:

- Firebase configuration
- Gemini AI API key
- Application settings

## License

MIT License
