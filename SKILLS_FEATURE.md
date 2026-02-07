# Skills Management Feature

## Overview

The Skills Management feature allows you to view, configure, and manage all LaunchPad skills from a centralized dashboard.

## Components

### 1. Database Schema (`skills` table)
- `id` - UUID primary key
- `name` - Unique skill name
- `description` - Skill description
- `emoji` - Display emoji
- `homepage` - Documentation URL
- `status` - active | inactive | not_configured
- `config` - JSONB for credentials/settings
- `metadata` - JSONB for additional data
- `requires` - JSONB for requirements (bins, env)
- `install_steps` - JSONB for installation instructions
- `usage_count` - Number of times used
- `last_used` - Last usage timestamp
- `created_at`, `updated_at` - Timestamps

### 2. Skills Discovery Script
**Location:** `/scripts/discover-skills.js`

**Purpose:** Scans `/home/node/clawd/skills/` directory and syncs skills to Supabase

**Usage:**
```bash
cd /home/node/clawd/launchpad-app
VITE_SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/discover-skills.js
```

**Features:**
- Parses SKILL.md frontmatter
- Extracts metadata, requirements, and installation steps
- Upserts to Supabase (preserves existing config)
- Real-time discovery of new skills

### 3. React Components

#### `Skills.jsx` (Main Page)
**Location:** `/src/pages/Skills.jsx`

**Features:**
- Grid/List view toggle
- Search and filter by status
- Real-time skill updates (Supabase subscriptions)
- Quick stats dashboard
- Status toggle (active/inactive)
- Configure button opens modal
- Sync button to rediscover skills

#### `SkillConfigModal.jsx`
**Location:** `/src/components/SkillConfigModal.jsx`

**Features:**
- **Settings Tab:**
  - Basic info (status, homepage link)
  - Requirements display (bins, env vars, install steps)
  - General configuration fields
  
- **Credentials Tab:**
  - Secure input fields for API keys/secrets
  - Toggle visibility for sensitive data
  - Test connection button
  - Encryption notice
  
- **Usage Tab:**
  - Total uses counter
  - Last used timestamp
  - Activity timeline
  - Usage analytics (coming soon)

### 4. Navigation
Skills added to main navigation in `Layout.jsx` with Wrench icon

### 5. Routing
Route `/skills` added to `App.jsx`

## Skills Format (SKILL.md)

Skills are discovered from `/home/node/clawd/skills/[skill-name]/SKILL.md`

**Example frontmatter:**
```yaml
---
name: gog
description: Google Workspace CLI for Gmail, Calendar, Drive, Contacts, Sheets, and Docs.
homepage: https://gogcli.sh
metadata: 
  clawdbot:
    emoji: "🎮"
    requires:
      bins: ["gog"]
      env: ["GOG_ACCOUNT"]
    install:
      - id: brew
        kind: brew
        formula: steipete/tap/gogcli
        bins: ["gog"]
        label: "Install gog (brew)"
---
```

## Migration

**File:** `supabase/migrations/20260207104759_create_skills_table.sql`

Applied to Supabase on: 2026-02-07

## Deployment Checklist

- [x] Create database migration
- [x] Push migration to Supabase
- [x] Create discovery script
- [x] Run discovery script (10 skills loaded)
- [x] Build SkillsPage component
- [x] Build SkillConfigModal component
- [x] Update App.jsx routing
- [x] Update Layout.jsx navigation
- [x] Install dependencies (gray-matter)
- [ ] Test locally
- [ ] Commit to git
- [ ] Push to GitHub
- [ ] Deploy to Vercel

## Skills Loaded (10 total)

1. 🔧 **brave-search** - Web search via Brave API
2. 🧩 **coding-agent** - Code generation agent
3. 🔧 **github** - GitHub integration
4. 🎮 **gog** - Google Workspace CLI
5. 🔧 **n8n-ecommerce** - n8n e-commerce automation
6. 🖼️ **openai-image-gen** - OpenAI image generation
7. ☁️ **openai-whisper-api** - Whisper transcription
8. 🎞️ **video-frames** - Video frame extraction
9. 🔧 **video-transcript-downloader** - Video transcripts
10. 🔧 **whatsapp-business** - WhatsApp Business API

## Future Enhancements

- [ ] Skill usage tracking (increment usage_count on use)
- [ ] Detailed usage analytics charts
- [ ] Skill dependencies graph
- [ ] Auto-install missing binaries
- [ ] Skill marketplace/discovery
- [ ] Skill version management
- [ ] Export/import skill configurations
- [ ] Skill testing automation
- [ ] Multi-user permission management

## API Endpoints (via Supabase)

- `GET /rest/v1/skills` - List all skills
- `POST /rest/v1/skills` - Create skill
- `PATCH /rest/v1/skills?id=eq.{id}` - Update skill
- `DELETE /rest/v1/skills?id=eq.{id}` - Delete skill

All endpoints use Supabase Row Level Security (RLS) - authenticated users only.

## Security

- All sensitive credentials stored in `config` JSONB field
- Encrypted at rest in Supabase
- Never logged or exposed in plaintext
- Row Level Security enabled
- Service role key required for discovery script

## Development

**Start dev server:**
```bash
cd /home/node/clawd/launchpad-app
npm run dev
```

**Sync skills:**
```bash
node scripts/discover-skills.js
```

**Push migrations:**
```bash
SUPABASE_ACCESS_TOKEN="..." npx supabase db push --linked --yes
```

## Production URLs

- **App:** https://launchpad-app-three.vercel.app/skills
- **Supabase:** https://rxtcssesqwooggydfkvs.supabase.co
- **GitHub:** (Your repo URL)

---

Built with ❤️ for LaunchPad by Clawdbot Agent
