# HurricaneClaimNavigator Clone Script for Windows PowerShell
# This script copies Claim Command Pro files to HurricaneClaimNavigator while preserving branding

Write-Host "🚀 Starting HurricaneClaimNavigator clone process..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json") -or -not (Test-Path "app")) {
    Write-Host "❌ Error: This script must be run from the Claim Command Pro root directory" -ForegroundColor Red
    Write-Host "Please navigate to the Claim Command Pro directory and run this script" -ForegroundColor Yellow
    exit 1
}

# Get the HurricaneClaimNavigator directory path
$HURRICANE_DIR = "../hurricaneclaimnavigator"

# Check if HurricaneClaimNavigator directory exists
if (-not (Test-Path $HURRICANE_DIR)) {
    Write-Host "❌ Error: HurricaneClaimNavigator directory not found at $HURRICANE_DIR" -ForegroundColor Red
    Write-Host "Please clone the HurricaneClaimNavigator repository first:" -ForegroundColor Yellow
    Write-Host "git clone https://github.com/jhouston2019/hurricaneclaimnavigator.git" -ForegroundColor Cyan
    exit 1
}

Write-Host "📁 Found HurricaneClaimNavigator directory at $HURRICANE_DIR" -ForegroundColor Green

# Backup existing files in HurricaneClaimNavigator
Write-Host "💾 Backing up existing files..." -ForegroundColor Yellow
Set-Location $HURRICANE_DIR

if (Test-Path "index.html") {
    Copy-Item "index.html" "index.html.backup"
    Write-Host "✅ Backed up index.html" -ForegroundColor Green
}

if (Test-Path "assets/css") {
    Copy-Item "assets/css" "assets/css.backup" -Recurse
    Write-Host "✅ Backed up assets/css" -ForegroundColor Green
}

# Go back to Claim Command Pro directory
Set-Location ..

Write-Host "📋 Copying core application files..." -ForegroundColor Yellow

# Copy essential directories
Write-Host "📂 Copying app directory..." -ForegroundColor Cyan
Copy-Item "app" $HURRICANE_DIR -Recurse -Force

Write-Host "📂 Copying netlify functions..." -ForegroundColor Cyan
Copy-Item "netlify" $HURRICANE_DIR -Recurse -Force

Write-Host "📂 Copying assets (preserving existing CSS)..." -ForegroundColor Cyan
# Copy assets but preserve existing CSS
if (Test-Path "$HURRICANE_DIR/assets/css") {
    # Backup existing CSS first
    Copy-Item "$HURRICANE_DIR/assets/css" "$HURRICANE_DIR/assets/css.original" -Recurse
}
Copy-Item "assets/data" "$HURRICANE_DIR/assets/" -Recurse -Force
Copy-Item "assets/docs" "$HURRICANE_DIR/assets/" -Recurse -Force
Copy-Item "assets/js" "$HURRICANE_DIR/assets/" -Recurse -Force

Write-Host "📂 Copying document libraries..." -ForegroundColor Cyan
Copy-Item "docs" $HURRICANE_DIR -Recurse -Force
Copy-Item "Document Library - Final English" $HURRICANE_DIR -Recurse -Force
Copy-Item "Document Library - Final Spanish" $HURRICANE_DIR -Recurse -Force

Write-Host "📂 Copying public directory..." -ForegroundColor Cyan
Copy-Item "public" $HURRICANE_DIR -Recurse -Force

Write-Host "📂 Copying scripts..." -ForegroundColor Cyan
Copy-Item "scripts" $HURRICANE_DIR -Recurse -Force

Write-Host "📂 Copying supabase..." -ForegroundColor Cyan
Copy-Item "supabase" $HURRICANE_DIR -Recurse -Force

Write-Host "📄 Copying essential files..." -ForegroundColor Cyan

# Copy configuration files
Copy-Item "package.json" $HURRICANE_DIR -Force
Copy-Item "package-lock.json" $HURRICANE_DIR -Force
Copy-Item "netlify.toml" $HURRICANE_DIR -Force
Copy-Item "manifest.json" $HURRICANE_DIR -Force

# Copy static files
Copy-Item "_redirects" $HURRICANE_DIR -Force
Copy-Item "404.html" $HURRICANE_DIR -Force
Copy-Item "robots.txt" $HURRICANE_DIR -Force
Copy-Item "sitemap.xml" $HURRICANE_DIR -Force

# Copy legal pages
Copy-Item "terms.html" $HURRICANE_DIR -Force
Copy-Item "privacy.html" $HURRICANE_DIR -Force
Copy-Item "disclaimer.html" $HURRICANE_DIR -Force
Copy-Item "success.html" $HURRICANE_DIR -Force

# Copy other pages
Copy-Item "product.html" $HURRICANE_DIR -Force

Write-Host "✅ Core files copied successfully!" -ForegroundColor Green

# Now update the files for hurricane context
Write-Host "🔄 Updating files for hurricane context..." -ForegroundColor Yellow

Set-Location $HURRICANE_DIR

# Update package.json
Write-Host "📝 Updating package.json..." -ForegroundColor Cyan
$packageJson = Get-Content "package.json" -Raw
$packageJson = $packageJson -replace '"name": "Claim Command Pro"', '"name": "hurricaneclaimnavigator"'
$packageJson = $packageJson -replace '"description": "AI-powered claim documentation tools with Netlify Functions"', '"description": "AI-powered hurricane claim documentation tools with Netlify Functions"'
Set-Content "package.json" $packageJson

# Update manifest.json
Write-Host "📝 Updating manifest.json..." -ForegroundColor Cyan
$manifestJson = Get-Content "manifest.json" -Raw
$manifestJson = $manifestJson -replace '"name": "Claim Command Pro - AI-Powered Claim Documentation Tools"', '"name": "HurricaneClaimNavigator - AI-Powered Hurricane Claim Documentation Tools"'
$manifestJson = $manifestJson -replace '"short_name": "Claim Command Pro"', '"short_name": "HurricaneClaimNavigator"'
$manifestJson = $manifestJson -replace '"description": "AI-powered documentation tools for property and business interruption insurance claims. Save time and maximize your claim potential."', '"description": "AI-powered documentation tools for hurricane damage insurance claims. Save time and maximize your claim potential."'
Set-Content "manifest.json" $manifestJson

# Update netlify.toml redirects
Write-Host "📝 Updating netlify.toml..." -ForegroundColor Cyan
$netlifyToml = Get-Content "netlify.toml" -Raw
$netlifyToml = $netlifyToml -replace 'Claim Command Pro\.netlify\.app', 'hurricaneclaimnavigator.netlify.app'
Set-Content "netlify.toml" $netlifyToml

Write-Host "✅ Files updated for hurricane context!" -ForegroundColor Green

# Restore original CSS if it existed
if (Test-Path "assets/css.original") {
    Write-Host "🎨 Restoring original CSS..." -ForegroundColor Yellow
    Remove-Item "assets/css" -Recurse -Force
    Rename-Item "assets/css.original" "assets/css"
    Write-Host "✅ Original CSS restored" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 HurricaneClaimNavigator clone completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Review and customize the index.html content for hurricane-specific messaging" -ForegroundColor White
Write-Host "2. Update environment variables in netlify.toml with your Supabase credentials" -ForegroundColor White
Write-Host "3. Set up a new Supabase project for HurricaneClaimNavigator" -ForegroundColor White
Write-Host "4. Update Stripe configuration for hurricane-specific products" -ForegroundColor White
Write-Host "5. Test the application locally with: npm run dev" -ForegroundColor White
Write-Host "6. Deploy to Netlify" -ForegroundColor White
Write-Host ""
Write-Host "📁 Original files backed up as:" -ForegroundColor Yellow
Write-Host "   - index.html.backup" -ForegroundColor White
Write-Host "   - assets/css.backup (if existed)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Manual updates still needed:" -ForegroundColor Yellow
Write-Host "   - Update hero section messaging in index.html" -ForegroundColor White
Write-Host "   - Modify case studies for hurricane examples" -ForegroundColor White
Write-Host "   - Update service descriptions for hurricane context" -ForegroundColor White
Write-Host "   - Configure Supabase and Stripe for the new site" -ForegroundColor White
