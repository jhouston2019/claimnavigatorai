#!/bin/bash

# HurricaneClaimNavigator Clone Script
# This script copies Claim Command Pro files to HurricaneClaimNavigator while preserving branding

set -e  # Exit on any error

echo "🚀 Starting HurricaneClaimNavigator clone process..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "app" ]; then
    echo "❌ Error: This script must be run from the Claim Command Pro root directory"
    echo "Please navigate to the Claim Command Pro directory and run this script"
    exit 1
fi

# Get the HurricaneClaimNavigator directory path
HURRICANE_DIR="../hurricaneclaimnavigator"

# Check if HurricaneClaimNavigator directory exists
if [ ! -d "$HURRICANE_DIR" ]; then
    echo "❌ Error: HurricaneClaimNavigator directory not found at $HURRICANE_DIR"
    echo "Please clone the HurricaneClaimNavigator repository first:"
    echo "git clone https://github.com/jhouston2019/hurricaneclaimnavigator.git"
    exit 1
fi

echo "📁 Found HurricaneClaimNavigator directory at $HURRICANE_DIR"

# Backup existing files in HurricaneClaimNavigator
echo "💾 Backing up existing files..."
cd "$HURRICANE_DIR"
if [ -f "index.html" ]; then
    cp index.html index.html.backup
    echo "✅ Backed up index.html"
fi

if [ -d "assets/css" ]; then
    cp -r assets/css assets/css.backup
    echo "✅ Backed up assets/css"
fi

# Go back to Claim Command Pro directory
cd - > /dev/null

echo "📋 Copying core application files..."

# Copy essential directories
echo "📂 Copying app directory..."
cp -r app "$HURRICANE_DIR/"

echo "📂 Copying netlify functions..."
cp -r netlify "$HURRICANE_DIR/"

echo "📂 Copying assets (preserving existing CSS)..."
# Copy assets but preserve existing CSS
if [ -d "$HURRICANE_DIR/assets/css" ]; then
    # Backup existing CSS first
    cp -r "$HURRICANE_DIR/assets/css" "$HURRICANE_DIR/assets/css.original"
fi
cp -r assets/data "$HURRICANE_DIR/assets/"
cp -r assets/docs "$HURRICANE_DIR/assets/"
cp -r assets/js "$HURRICANE_DIR/assets/"

echo "📂 Copying document libraries..."
cp -r "docs" "$HURRICANE_DIR/"
cp -r "Document Library - Final English" "$HURRICANE_DIR/"
cp -r "Document Library - Final Spanish" "$HURRICANE_DIR/"

echo "📂 Copying public directory..."
cp -r public "$HURRICANE_DIR/"

echo "📂 Copying scripts..."
cp -r scripts "$HURRICANE_DIR/"

echo "📂 Copying supabase..."
cp -r supabase "$HURRICANE_DIR/"

echo "📄 Copying essential files..."

# Copy configuration files
cp package.json "$HURRICANE_DIR/"
cp package-lock.json "$HURRICANE_DIR/"
cp netlify.toml "$HURRICANE_DIR/"
cp manifest.json "$HURRICANE_DIR/"

# Copy static files
cp _redirects "$HURRICANE_DIR/"
cp 404.html "$HURRICANE_DIR/"
cp robots.txt "$HURRICANE_DIR/"
cp sitemap.xml "$HURRICANE_DIR/"

# Copy legal pages
cp terms.html "$HURRICANE_DIR/"
cp privacy.html "$HURRICANE_DIR/"
cp disclaimer.html "$HURRICANE_DIR/"
cp success.html "$HURRICANE_DIR/"

# Copy other pages
cp product.html "$HURRICANE_DIR/"

echo "✅ Core files copied successfully!"

# Now update the files for hurricane context
echo "🔄 Updating files for hurricane context..."

cd "$HURRICANE_DIR"

# Update package.json
echo "📝 Updating package.json..."
sed -i.bak 's/"name": "Claim Command Pro"/"name": "hurricaneclaimnavigator"/' package.json
sed -i.bak 's/"description": "AI-powered claim documentation tools with Netlify Functions"/"description": "AI-powered hurricane claim documentation tools with Netlify Functions"/' package.json

# Update manifest.json
echo "📝 Updating manifest.json..."
sed -i.bak 's/"name": "Claim Command Pro - AI-Powered Claim Documentation Tools"/"name": "HurricaneClaimNavigator - AI-Powered Hurricane Claim Documentation Tools"/' manifest.json
sed -i.bak 's/"short_name": "Claim Command Pro"/"short_name": "HurricaneClaimNavigator"/' manifest.json
sed -i.bak 's/"description": "AI-powered documentation tools for property and business interruption insurance claims. Save time and maximize your claim potential."/"description": "AI-powered documentation tools for hurricane damage insurance claims. Save time and maximize your claim potential."/' manifest.json

# Update netlify.toml redirects
echo "📝 Updating netlify.toml..."
sed -i.bak 's/Claim Command Pro\.netlify\.app/hurricaneclaimnavigator.netlify.app/g' netlify.toml

# Clean up backup files
rm -f package.json.bak manifest.json.bak netlify.toml.bak

echo "✅ Files updated for hurricane context!"

# Restore original CSS if it existed
if [ -d "assets/css.original" ]; then
    echo "🎨 Restoring original CSS..."
    rm -rf assets/css
    mv assets/css.original assets/css
    echo "✅ Original CSS restored"
fi

echo ""
echo "🎉 HurricaneClaimNavigator clone completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Review and customize the index.html content for hurricane-specific messaging"
echo "2. Update environment variables in netlify.toml with your Supabase credentials"
echo "3. Set up a new Supabase project for HurricaneClaimNavigator"
echo "4. Update Stripe configuration for hurricane-specific products"
echo "5. Test the application locally with: npm run dev"
echo "6. Deploy to Netlify"
echo ""
echo "📁 Original files backed up as:"
echo "   - index.html.backup"
echo "   - assets/css.backup (if existed)"
echo ""
echo "🔧 Manual updates still needed:"
echo "   - Update hero section messaging in index.html"
echo "   - Modify case studies for hurricane examples"
echo "   - Update service descriptions for hurricane context"
echo "   - Configure Supabase and Stripe for the new site"
