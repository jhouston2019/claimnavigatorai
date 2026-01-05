# How to Get Your Supabase Credentials

## Step 1: Go to Your Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project

## Step 2: Get Your Project URL
1. Go to **Settings** → **API**
2. Copy the **Project URL** (looks like: `https://your-project-id.supabase.co`)

## Step 3: Get Your API Keys
1. In the same **Settings** → **API** page
2. Copy the **anon public** key (starts with `eyJ...`)
3. Copy the **service_role** key (starts with `eyJ...`)

## Step 4: Add to Netlify
### Option A: Netlify Dashboard (Recommended)
1. Go to: https://app.netlify.com/
2. Select your site: `Claim Navigator`
3. Go to **Site settings** → **Environment variables**
4. Add these variables:
   - `SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `SUPABASE_ANON_KEY` = `your-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`

### Option B: Update netlify.toml
Replace the placeholder values in `netlify.toml` with your actual credentials:
```toml
SUPABASE_URL = "https://your-actual-project-id.supabase.co"
SUPABASE_ANON_KEY = "your-actual-anon-key"
SUPABASE_SERVICE_ROLE_KEY = "your-actual-service-role-key"
```

## Step 5: Redeploy
After adding the environment variables, trigger a new deployment:
1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Deploy site**

## Step 6: Test the Function
Once deployed, test the populate function:
```powershell
Invoke-RestMethod -Uri "https://Claim Navigator.com/.netlify/functions/populate-documents-bilingual" -Method POST -ContentType "application/json" -Body "{}"
```

## Security Note
- Never commit real API keys to your repository
- Use Netlify's environment variables for production
- The `netlify.toml` file should only contain placeholder values
