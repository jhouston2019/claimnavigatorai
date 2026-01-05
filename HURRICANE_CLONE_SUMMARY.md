# HurricaneClaimNavigator Clone Summary

## Quick Start Instructions

### 1. Clone the HurricaneClaimNavigator Repository
```bash
git clone https://github.com/jhouston2019/hurricaneclaimnavigator.git
cd hurricaneclaimnavigator
```

### 2. Run the Clone Script

**For Linux/Mac:**
```bash
# From the Claim Navigator directory
chmod +x clone-to-hurricane.sh
./clone-to-hurricane.sh
```

**For Windows PowerShell:**
```powershell
# From the Claim Navigator directory
.\clone-to-hurricane.ps1
```

### 3. Manual Steps After Script

1. **Replace index.html with hurricane-specific content:**
   - Use the `hurricane-index-template.html` as a reference
   - Keep your existing CSS and color scheme
   - Update all messaging to focus on hurricane claims

2. **Update Configuration Files:**
   - Set up new Supabase project for HurricaneClaimNavigator
   - Update environment variables in `netlify.toml`
   - Configure Stripe for hurricane-specific products

3. **Test and Deploy:**
   ```bash
   npm install
   npm run dev  # Test locally
   git add .
   git commit -m "Clone Claim Navigator functionality for hurricane claims"
   git push origin main
   ```

## What Gets Copied

### ✅ Core Application Files
- `app/` - All application pages and functionality
- `netlify/functions/` - All backend functions
- `assets/data/` - Document data and configurations
- `assets/docs/` - Document libraries
- `assets/js/` - JavaScript functionality
- `docs/` - Document libraries
- `Document Library - Final English/` - English documents
- `Document Library - Final Spanish/` - Spanish documents
- `public/` - Public assets
- `scripts/` - Utility scripts
- `supabase/` - Database schemas

### ✅ Configuration Files
- `package.json` - Updated with hurricane branding
- `package-lock.json` - Dependencies
- `netlify.toml` - Updated with hurricane URLs
- `manifest.json` - Updated PWA configuration
- `_redirects` - URL redirects
- `404.html` - Error page
- `robots.txt` - SEO configuration
- `sitemap.xml` - Site map

### ✅ Legal Pages
- `terms.html` - Terms of service
- `privacy.html` - Privacy policy
- `disclaimer.html` - Legal disclaimer
- `success.html` - Success page
- `product.html` - Product page

## What Gets Preserved

### 🎨 Existing Branding
- Your current color scheme and CSS
- Existing logo and visual identity
- Current layout structure
- Brand-specific styling

### 📝 What You Need to Update Manually

1. **Hero Section Messaging:**
   - Update tagline to focus on hurricane damage
   - Modify value propositions for hurricane context
   - Change examples to hurricane scenarios

2. **Case Studies:**
   - Replace with hurricane damage examples
   - Update metrics for hurricane claims
   - Modify tools used for hurricane context

3. **Services:**
   - Emphasize hurricane-specific documentation needs
   - Update compliance requirements for hurricane-prone states
   - Modify service descriptions

4. **Environment Setup:**
   - Create new Supabase project
   - Update environment variables
   - Configure Stripe products

## Key Messaging Changes

### From Claim Navigator to HurricaneClaimNavigator:

| Original | Hurricane Version |
|----------|------------------|
| "property damage claims" | "hurricane damage claims" |
| "business interruption claims" | "hurricane business interruption claims" |
| "storm damage" | "hurricane damage" |
| "property owners" | "hurricane-affected property owners" |
| "claim navigation" | "hurricane claim navigation" |

## Post-Deployment Checklist

- [ ] Test login/registration system
- [ ] Verify document generation works
- [ ] Check all navigation links
- [ ] Ensure branding consistency
- [ ] Update Supabase with hurricane documents
- [ ] Configure Stripe for hurricane products
- [ ] Test checkout process
- [ ] Verify email notifications
- [ ] Check mobile responsiveness
- [ ] Test bilingual functionality

## Support Files Created

1. **`clone-to-hurricane.sh`** - Linux/Mac automation script
2. **`clone-to-hurricane.ps1`** - Windows PowerShell script
3. **`hurricane-index-template.html`** - Template for hurricane-specific content
4. **`clone-to-hurricane-guide.md`** - Detailed step-by-step guide

## Next Steps After Cloning

1. **Content Customization:**
   - Review and update all hurricane-specific messaging
   - Add hurricane-specific case studies
   - Update service descriptions

2. **Technical Setup:**
   - Set up new Supabase project
   - Configure environment variables
   - Set up Stripe products
   - Test all functionality

3. **SEO and Marketing:**
   - Update meta tags and descriptions
   - Modify structured data
   - Update sitemap
   - Set up analytics

4. **Launch:**
   - Deploy to Netlify
   - Test production environment
   - Set up monitoring
   - Launch marketing campaign

The clone process preserves your existing branding while adding all the powerful functionality of Claim Navigator, specifically tailored for hurricane damage claims.
