# Resource Center Structure

This directory contains all Resource Center pages and tools for Claim Navigator.

## Current Structure

```
app/resource-center/
├── index.html                    # Main resource center hub
├── quick-start.html             # Quick start guide
├── evidence-organizer.html     # Evidence organization tool
├── document-generator.html      # Document generation tool
├── financial-calculator.html    # Financial calculation tool
├── negotiation-tools.html       # Negotiation scripts and tools
├── claim-timeline.html          # Claim timeline tracker
├── professional-network.html    # Professional directory
├── situational-advisory.html    # Scenario-based guidance
├── maximize-claim.html          # Claim maximization strategies
├── insurance-tactics.html       # Insurance company tactics
├── advanced-tools.html          # Premium AI-powered tools
└── document-generator/          # Document generator subdirectory
    ├── index.html
    ├── generate.html
    ├── generator.html
    └── appeal-letter.html
```

## Future Structure (Scalable Organization)

For future additions, use this organized structure:

```
app/resource-center/
├── index.html                   # Main hub
├── quick-start.html             # Quick start guide
├── tools/                       # Interactive JS tools
│   ├── financial-calculator.html
│   ├── evidence-organizer.html
│   ├── document-generator.html
│   ├── negotiation-tools.html
│   ├── advanced-tools.html
│   └── [future tools]
├── guides/                      # Static/instructional pages
│   ├── claim-timeline.html
│   ├── situational-advisory.html
│   ├── maximize-claim.html
│   ├── insurance-tactics.html
│   └── [future guides]
├── assets/                      # Resource center specific assets
│   ├── css/
│   ├── js/
│   ├── images/
│   └── [future assets]
└── document-generator/          # Existing subdirectory
```

## Adding New Tools

When adding new tools:

1. **Interactive Tools** → Place in `tools/` directory
   - Calculators, generators, analyzers
   - JavaScript-heavy functionality
   - Examples: Policy Analyzer, Settlement Comparison Tool

2. **Static Guides** → Place in `guides/` directory
   - Instructional content
   - Step-by-step guides
   - Examples: State-specific guides, Legal requirements

3. **Assets** → Place in `assets/` directory
   - CSS, JavaScript, images specific to resource center
   - Keep separate from main app assets

## Navigation Updates

When adding new pages:

1. Update `components/Navigation.tsx` with new paths
2. Add to `sitemap.xml` with proper priority
3. Update breadcrumb navigation in new pages
4. Run `npm test` to verify no broken links
5. Test mobile responsiveness

## SEO Considerations

Each new page should include:

```html
<title>Page Name - Claim Navigator</title>
<meta name="description" content="Concise description of the tool or feature">
<link rel="canonical" href="https://Claim Navigator.com/app/resource-center/page-name.html">
```

## Testing

Run the navigation test to ensure all links work:

```bash
npm test
```

This will verify:
- All files exist
- No broken internal links
- Navigation.tsx has correct paths
- Sitemap.xml includes all pages
