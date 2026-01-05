# HurricaneClaimNavigator Clone Guide

This guide will help you clone Claim Navigator into HurricaneClaimNavigator while preserving the existing branding and color scheme.

## Step 1: Prepare the HurricaneClaimNavigator Repository

1. **Clone the HurricaneClaimNavigator repository:**
   ```bash
   git clone https://github.com/jhouston2019/hurricaneclaimnavigator.git
   cd hurricaneclaimnavigator
   ```

2. **Backup the existing index.html and branding files:**
   ```bash
   cp index.html index.html.backup
   cp -r assets/css assets/css.backup 2>/dev/null || true
   ```

## Step 2: Copy Core Application Files

Copy these directories and files from Claim Navigator to HurricaneClaimNavigator:

### Essential Directories:
```bash
# Copy the entire app directory
cp -r ../Claim Navigator/app ./

# Copy netlify functions
cp -r ../Claim Navigator/netlify ./

# Copy assets (but preserve existing CSS)
cp -r ../Claim Navigator/assets/data ./
cp -r ../Claim Navigator/assets/docs ./
cp -r ../Claim Navigator/assets/js ./

# Copy document libraries
cp -r ../Claim Navigator/docs ./
cp -r ../Claim Navigator/"Document Library - Final English" ./
cp -r ../Claim Navigator/"Document Library - Final Spanish" ./

# Copy public directory
cp -r ../Claim Navigator/public ./

# Copy scripts
cp -r ../Claim Navigator/scripts ./

# Copy supabase
cp -r ../Claim Navigator/supabase ./
```

### Essential Files:
```bash
# Configuration files
cp ../Claim Navigator/package.json ./
cp ../Claim Navigator/package-lock.json ./
cp ../Claim Navigator/netlify.toml ./
cp ../Claim Navigator/manifest.json ./

# Static files
cp ../Claim Navigator/_redirects ./
cp ../Claim Navigator/404.html ./
cp ../Claim Navigator/robots.txt ./
cp ../Claim Navigator/sitemap.xml ./

# Legal pages
cp ../Claim Navigator/terms.html ./
cp ../Claim Navigator/privacy.html ./
cp ../Claim Navigator/disclaimer.html ./
cp ../Claim Navigator/success.html ./

# Other pages
cp ../Claim Navigator/product.html ./
```

## Step 3: Adapt Branding and Messaging

### Update package.json:
```json
{
  "name": "hurricaneclaimnavigator",
  "version": "1.0.0",
  "description": "AI-powered hurricane claim documentation tools with Netlify Functions",
  // ... rest of the content
}
```

### Update manifest.json:
```json
{
  "name": "HurricaneClaimNavigator - AI-Powered Hurricane Claim Documentation Tools",
  "short_name": "HurricaneClaimNavigator",
  "description": "AI-powered documentation tools for hurricane damage insurance claims. Save time and maximize your claim potential.",
  // ... rest of the content
}
```

### Update netlify.toml:
- Change the redirect URLs from `Claim Navigator.netlify.app` to your hurricane site URL
- Update any site-specific configurations

## Step 4: Update Content for Hurricane Context

### Key Messaging Changes:
- Replace "property damage claims" with "hurricane damage claims"
- Update examples to focus on hurricane-specific scenarios
- Modify case studies to show hurricane damage examples
- Update service descriptions to emphasize hurricane-specific documentation needs

### Update index.html:
- Keep the existing color scheme and branding
- Update the hero section messaging to focus on hurricane claims
- Modify the value propositions to be hurricane-specific
- Update case studies to show hurricane damage examples
- Change the title and meta descriptions

## Step 5: Environment Configuration

### Update environment variables in netlify.toml:
```toml
[build.environment]
  NODE_VERSION = "18"
  # Update these with your hurricane site's Supabase credentials
  SUPABASE_URL = "https://your-hurricane-project-id.supabase.co"
  SUPABASE_ANON_KEY = "your-hurricane-anon-key-here"
  SUPABASE_SERVICE_ROLE_KEY = "your-hurricane-service-role-key-here"
```

### Update redirects in netlify.toml:
```toml
# Redirect www to non-www
[[redirects]]
  from = "https://www.hurricaneclaimnavigator.netlify.app/*"
  to = "https://hurricaneclaimnavigator.netlify.app/:splat"
  status = 301
  force = true
```

## Step 6: Hurricane-Specific Customizations

### Update the main index.html content:

1. **Hero Section:**
   - Change title to "HurricaneClaimNavigator is your AI-Powered hurricane claim solution"
   - Update subtitle to focus on hurricane damage claims
   - Modify the tagline to emphasize hurricane-specific challenges

2. **Features Grid:**
   - Update examples to show hurricane damage scenarios
   - Modify tool descriptions to be hurricane-specific

3. **Case Studies:**
   - Replace with hurricane damage examples
   - Update metrics to reflect hurricane claim scenarios
   - Modify tools used to be hurricane-relevant

4. **Services:**
   - Emphasize hurricane-specific documentation needs
   - Update service descriptions for hurricane context
   - Modify compliance requirements for hurricane-prone states

## Step 7: Test and Deploy

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Test locally:**
   ```bash
   npm run dev
   ```

3. **Verify all functionality:**
   - Test the login/registration system
   - Verify document generation works
   - Check that all links and navigation work
   - Ensure the branding is consistent

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Clone Claim Navigator functionality for hurricane claims"
   git push origin main
   ```

## Step 8: Post-Deployment Tasks

1. **Update Supabase:**
   - Set up a new Supabase project for HurricaneClaimNavigator
   - Run the schema setup scripts
   - Populate the document database

2. **Update Stripe:**
   - Create new Stripe products for hurricane claims
   - Update checkout functions with new product IDs

3. **SEO Updates:**
   - Update all meta tags and descriptions
   - Modify structured data for hurricane context
   - Update sitemap with hurricane-specific content

## Files to Modify for Hurricane Context

### High Priority:
- `index.html` - Main landing page content
- `package.json` - Project name and description
- `manifest.json` - PWA configuration
- `netlify.toml` - Environment and redirects

### Medium Priority:
- `app/login.html` - Update branding references
- `app/register.html` - Update branding references
- `terms.html` - Update service name
- `privacy.html` - Update service name
- `disclaimer.html` - Update service name

### Low Priority:
- Update any hardcoded references in JavaScript files
- Modify document templates to be hurricane-specific
- Update affiliate tool recommendations for hurricane context

## Preserving Existing Branding

The existing HurricaneClaimNavigator branding should be preserved by:
1. Keeping the existing color scheme in CSS
2. Maintaining the existing logo and visual identity
3. Preserving the existing layout structure
4. Only updating text content and messaging

This approach ensures that HurricaneClaimNavigator maintains its unique identity while gaining all the functionality of Claim Navigator.
