# FRC District Navigator

A static web app for exploring FIRST Robotics Competition (FRC) district history, event patterns, and championship streaks.

## Features

- **Event Twins** - Find teams that attended the same two district events
- **Championship History** - View district championship rankings, records, and Worlds advancement
- **District Explorer** - Browse all FRC districts across all available years (2009-present)

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) with static adapter
- [Tailwind CSS](https://tailwindcss.com/) (dark theme)
- [Vitest](https://vitest.dev/) for testing
- Data from [The Blue Alliance API](https://www.thebluealliance.com/apidocs)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- A TBA API key from [The Blue Alliance](https://www.thebluealliance.com/account)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/FRCDistNav.git
   cd FRCDistNav
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## Fetching FRC Data

The app comes with sample data for Michigan 2024. To fetch complete data from The Blue Alliance:

### Windows PowerShell:
```powershell
$env:TBA_API_KEY="your_api_key_here"; npm run fetch-data
```

### Windows Command Prompt:
```cmd
set TBA_API_KEY=your_api_key_here && npm run fetch-data
```

### macOS/Linux:
```bash
TBA_API_KEY=your_api_key_here npm run fetch-data
```

This will download data for all districts and years, which may take several minutes.

### Committing Data Updates

After fetching new data, commit and push the JSON files:

```bash
git add static/data/
git commit -m "chore: update FRC data from TBA"
git push
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run fetch-data` | Fetch data from TBA API |

## Deployment

Build the static site:

```bash
npm run build
```

The output in `build/` can be deployed to any static hosting service:
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

## License

MIT
