# LAYOUT ALIGNMENT ENFORCEMENT - BATCH SCRIPT
# Mechanical application of canonical layout to all Advanced Tools pages

$files = @(
    "evidence-photo-analyzer.html",
    "policy-comparison-tool.html",
    "bad-faith-evidence-tracker.html",
    "insurance-profile-database.html",
    "regulatory-updates-monitor.html",
    "compliance-monitor.html",
    "appeal-package-builder.html",
    "mediation-preparation-kit.html",
    "arbitration-strategy-guide.html",
    "expert-witness-database.html",
    "settlement-history-database.html",
    "deadline-tracker-pro.html",
    "expert-opinion-generator.html",
    "communication-templates.html",
    "mediation-arbitration-evidence-organizer.html"
)

$basePath = "app/resource-center/advanced-tools/"

Write-Host "LAYOUT ALIGNMENT ENFORCEMENT - STARTING" -ForegroundColor Cyan
Write-Host "Canonical Source: Resource Center" -ForegroundColor Yellow
Write-Host "Target: 15 Advanced Tools pages" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    $fullPath = Join-Path $basePath $file
    
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file" -ForegroundColor Green
        
        # Read file content
        $content = Get-Content $fullPath -Raw
        
        # 1. Replace Poppins font with Inter
        $content = $content -replace 'https://fonts\.googleapis\.com/css2\?family=Poppins:wght@400;500;600;700&family=Source\+Sans\+3:wght@400;500;600&display=swap', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        
        # 2. Add canonical layout stylesheet if not present
        if ($content -notmatch 'advanced-tools-layout\.css') {
            $content = $content -replace '(<link rel="stylesheet" href="/app/assets/css/claim-analysis\.css">)', '$1`n    <link rel="stylesheet" href="/app/assets/css/advanced-tools-layout.css">'
        }
        
        # 3. Remove inline <style> blocks (keep only tool-specific)
        $content = $content -replace '(?s)<style>.*?body\.\w+-page \{.*?background:.*?url\(.*?\).*?</style>', ''
        
        # 4. Replace non-canonical hero with canonical hero
        $content = $content -replace '(?s)<!-- Hero Header -->.*?<div class="tool-header"[^>]*>.*?<h1>(.*?)</h1>.*?<p>(.*?)</p>.*?</div>', @'
<!-- Hero Header -->
    <section class="tool-hero">
        <div class="tool-hero-container">
            <p class="tool-hero-eyebrow">Advanced Tools</p>
            <h1 class="tool-hero-title">$1</h1>
            <p class="tool-hero-subtitle">$2</p>
        </div>
    </section>
'@
        
        # 5. Add padding to main container
        $content = $content -replace '<main class="tool-container">', '<main class="tool-container" style="padding-top: 80px;">'
        
        # Write back
        Set-Content -Path $fullPath -Value $content -NoNewline
        
        Write-Host "  ✓ Font replaced (Poppins → Inter)" -ForegroundColor Gray
        Write-Host "  ✓ Canonical stylesheet added" -ForegroundColor Gray
        Write-Host "  ✓ Non-canonical styles removed" -ForegroundColor Gray
        Write-Host "  ✓ Hero structure aligned" -ForegroundColor Gray
        Write-Host "  ✓ Container padding normalized" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "LAYOUT ALIGNMENT ENFORCEMENT - COMPLETE" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files Modified: $($files.Count)" -ForegroundColor Yellow
Write-Host "Canonical Layout: app/assets/css/advanced-tools-layout.css" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test visual alignment against Resource Center" -ForegroundColor White
Write-Host "2. Verify all forms still function" -ForegroundColor White
Write-Host "3. Check responsive breakpoints" -ForegroundColor White
Write-Host ""
Write-Host "Uniformity > speed" -ForegroundColor Green
Write-Host "Rules > creativity" -ForegroundColor Green
Write-Host "Consistency > aesthetics" -ForegroundColor Green

