# Local Development Guide — Claim Navigator

## ⚠️ CRITICAL: DO NOT USE file:// PROTOCOL

Opening HTML files directly in a browser (via `file://`) will cause **ERR_FILE_NOT_FOUND** errors due to relative path resolution issues.

**Always run Claim Navigator via a local HTTP server.**

---

## Quick Start (3 Options)

### Option 1: Simple HTTP Server (Recommended for Testing)

**No installation required** — uses npx to run a temporary server:

```bash
npm run dev:simple
```

Then open in your browser:
```
http://localhost:3000/app/resource-center.html
```

**What this does:**
- Serves the entire project directory on port 3000
- No Netlify Functions (backend features won't work)
- Perfect for testing UI, navigation, and layout
- Fastest startup time

---

### Option 2: Netlify Dev (Recommended for Full Functionality)

**Requires Netlify CLI** — provides full backend support:

```bash
npm run dev
```

Then open in your browser:
```
http://localhost:8888/app/resource-center.html
```

**What this does:**
- Serves the project with Netlify Functions enabled
- AI tools, document generation, and database features work
- Requires environment variables configured (see `.env` setup)
- Mimics production environment

**First-time setup:**
```bash
npm install -g netlify-cli
netlify login
```

---

### Option 3: Python HTTP Server (No Node.js Required)

**Uses Python** — available on most systems:

```bash
python -m http.server 3000
```

Or with Python 2:
```bash
python -m SimpleHTTPServer 3000
```

Then open in your browser:
```
http://localhost:3000/app/resource-center.html
```

**What this does:**
- Simple static file server
- No backend functionality
- No dependencies
- Good for quick UI testing

---

## Canonical URLs

Once your server is running, access the application via:

| Page | URL (Simple Server) | URL (Netlify Dev) |
|------|---------------------|-------------------|
| **Resource Center** | `http://localhost:3000/app/resource-center.html` | `http://localhost:8888/app/resource-center.html` |
| **Claim Management Center** | `http://localhost:3000/app/claim-management-center.html` | `http://localhost:8888/app/claim-management-center.html` |
| **Step-by-Step Guide** | `http://localhost:3000/app/step-by-step-claim-guide.html` | `http://localhost:8888/app/step-by-step-claim-guide.html` |
| **Any Tool** | `http://localhost:3000/app/tools/[tool-name].html` | `http://localhost:8888/app/tools/[tool-name].html` |

---

## What Works in Each Mode

| Feature | Simple Server | Netlify Dev | Production |
|---------|--------------|-------------|------------|
| Navigation | ✅ | ✅ | ✅ |
| UI/Layout | ✅ | ✅ | ✅ |
| Resource Center | ✅ | ✅ | ✅ |
| Step-by-Step Guide | ✅ | ✅ | ✅ |
| Document Generation | ❌ | ✅ | ✅ |
| AI Tools | ❌ | ✅ | ✅ |
| Workflow Tools (DB) | ❌ | ✅ | ✅ |
| Authentication | ❌ | ✅ | ✅ |
| File Uploads | ❌ | ✅ | ✅ |

---

## Environment Variables (Required for Netlify Dev)

Create a `.env` file in the project root:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Optional: Stripe (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

---

## Troubleshooting

### Issue: ERR_FILE_NOT_FOUND

**Cause:** Opening files directly via `file://` protocol  
**Solution:** Use one of the three server options above

### Issue: "Cannot GET /app/resource-center.html"

**Cause:** Server root is incorrect  
**Solution:** Ensure you're running the server from the project root (the directory containing `/app/`)

### Issue: Netlify Functions not working

**Cause:** Not using `netlify dev`  
**Solution:** Use Option 2 (Netlify Dev) instead of simple server

### Issue: Port already in use

**Cause:** Another process is using the port  
**Solution:** 
- Kill the existing process
- Or change the port:
  - Simple: `npx serve . -p 3001`
  - Netlify: `netlify dev --port 8889`
  - Python: `python -m http.server 3001`

---

## Recommended Workflow

1. **UI/Layout Testing:** Use `npm run dev:simple` (fastest)
2. **Feature Development:** Use `npm run dev` (full backend)
3. **Production Testing:** Deploy to Netlify staging

---

## Important Notes

- ✅ All 136 resources are correctly linked
- ✅ All relative paths resolve correctly via HTTP server
- ❌ Do NOT use `file://` — it will break navigation
- ✅ Project root = directory containing `/app/`
- ✅ Resource Center is the canonical index of all tools

---

## Quick Reference Commands

```bash
# Simple server (UI testing only)
npm run dev:simple

# Full Netlify environment (all features)
npm run dev

# Python alternative (no Node.js)
python -m http.server 3000
```

**Default entry point:**  
`http://localhost:3000/app/resource-center.html`

---

**Last Updated:** January 6, 2026  
**Status:** ✅ Production Ready



