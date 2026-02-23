# Railway Environment Variables

Required environment variables for deploying the frontend to Railway:

## Required Variables

```bash
# Strapi backend URL
PUBLIC_STRAPI_URL=https://your-strapi-backend.railway.app

# Site URL for sitemap and canonical URLs
SITE_URL=https://promocode.lv

# Strapi API token (for contact form submissions)
# Generate in Strapi Admin: Settings → API Tokens
STRAPI_API_TOKEN=your_strapi_api_token_here

# Google reCAPTCHA v2 secret key (for spam protection)
# Get from: https://www.google.com/recaptcha/admin
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here
```

## Optional Variables

```bash
# Node environment (defaults to production)
NODE_ENV=production
```

## How to Set in Railway

1. Go to Railway Dashboard
2. Select your frontend service
3. Click **"Variables"** tab
4. Click **"New Variable"** for each:
   - `PUBLIC_STRAPI_URL`
   - `SITE_URL`
   - `STRAPI_API_TOKEN`
   - `RECAPTCHA_SECRET_KEY`

## Important Notes

- **Start Command must be:** `node dist/server/entry.mjs`
- Do NOT use `npx serve dist` (this is for static sites only)
- The frontend uses a Node.js server adapter for the contact form API
