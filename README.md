# Launchpad App 🚀

Product launch management tool for ecommerce entrepreneurs. Track products from discovery to launch with automated workflows.

## Features

- **Product Pipeline**: Kanban board to track products through stages (Discovery → Research → Creative → Testing → Scaling → Retired)
- **Automation Integration**: Connect with n8n for automated product discovery and creative generation
- **Asset Management**: Store and organize product images, videos, and creatives
- **GemPages Converter**: Convert HTML to GemPages-compatible format

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- React Router
- @hello-pangea/dnd (drag & drop)

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_N8N_WEBHOOK_URL` | n8n webhook endpoint |

## Deployment

Deployed on Vercel. Push to `main` triggers auto-deploy.

## License

Private
