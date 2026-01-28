# Security Documentation

## Overview

LaunchPad uses industry-standard security practices to protect your data.

## Authentication

- **Provider:** Supabase Auth
- **Methods:** Email/password, OAuth (Google, GitHub)
- **Session:** JWT tokens with automatic refresh
- **Password:** Minimum 6 characters, hashed with bcrypt (Supabase handles this)

## Data Protection

### Row Level Security (RLS)

All database tables have RLS enabled. Users can only:
- **View** their own data
- **Create** data linked to their user ID
- **Update** their own data
- **Delete** their own data

No user can ever access another user's data, even with direct API access.

### Encryption

- **In Transit:** All connections use HTTPS/TLS
- **At Rest:** Supabase encrypts all data at rest
- **Passwords:** Never stored in plain text (bcrypt hashed)

## API Security

### Keys

| Key Type | Location | Purpose |
|----------|----------|---------|
| Anon Key | Frontend (public) | Safe to expose, RLS protects data |
| Service Role Key | Server only | NEVER in frontend code |

The anon key is safe to use in the browser because:
1. It can only access data allowed by RLS policies
2. Users must be authenticated to access their data
3. The key alone cannot bypass security

### Rate Limiting

- Supabase has built-in rate limiting
- Additional client-side rate limiting in `src/lib/api.js`
- Webhooks should implement their own rate limiting

## HTTP Security Headers

All responses include:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [strict policy]
```

### Content Security Policy

- Scripts: Only from same origin
- Styles: Same origin + inline (required for Tailwind)
- Images: Same origin + HTTPS sources
- Connections: Same origin + Supabase + n8n

## Environment Variables

### Required for Production

Set these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Never Commit

These should NEVER be in git:
- `.env.local`
- `.env`
- Service role keys
- Database passwords
- Any private API keys

## Checklist for Deployment

- [x] RLS enabled on all tables
- [x] Service role key NOT in frontend
- [x] Environment variables in Vercel (not git)
- [x] HTTPS enforced
- [x] Security headers configured
- [x] CSP policy active
- [x] Input validation on all forms
- [x] XSS sanitization (DOMPurify)
- [x] No secrets in console.log
- [x] .gitignore covers all env files

## Supabase Dashboard Security

In your Supabase dashboard, verify:

1. **Authentication → URL Configuration**
   - Site URL: Your Vercel URL
   - Redirect URLs: Your Vercel URL/*

2. **Authentication → Email Templates**
   - Customize to match your brand
   - Remove any test/debug info

3. **Database → Tables**
   - RLS should show "Enabled" for all tables
   - Check policies are correctly configured

4. **API Settings**
   - JWT expiry: 3600 seconds (1 hour) recommended
   - Enable Row Level Security by default

## Reporting Security Issues

If you discover a security vulnerability, please do NOT open a public issue. 
Contact the maintainer directly.
