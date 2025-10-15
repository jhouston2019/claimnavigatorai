# Document Generator Tool

A comprehensive AI-powered document generation tool for insurance claims, built with modern web technologies and responsive design.

## Features

### 🎨 **Full-Width Modern Design**
- Full page width layout with navy header and light gray panels
- Responsive grid system that adapts to all screen sizes
- Consistent styling across all document types
- Modern button styling with hover effects

### 📱 **Responsive Design**
- **Desktop**: Multi-column grid layout
- **Tablet**: 2-column layout with optimized spacing
- **Mobile**: Single-column stacked layout
- Sticky header navigation for easy access

### 🤖 **AI-Powered Generation**
- GPT-4 integration for intelligent document drafting
- Context-aware content generation based on form inputs
- Professional tone and structure for all document types
- Fallback templates for offline functionality

### 📄 **Export Functionality**
- **PDF Export**: High-quality PDF generation with proper formatting
- **DOCX Export**: Microsoft Word compatible documents
- Server-side rendering for consistent output
- Automatic file naming and download

### 📋 **Document Types Supported**

1. **Proof of Loss** - Formal statement of damages and losses
2. **Appeal Letter** - Challenge denied or underpaid claims
3. **Demand Letter** - Request proper settlement amounts
4. **Damage Inventory** - Detailed list of damaged items
5. **Claim Timeline** - Chronological record of claim events
6. **Repair vs Replace** - Analysis of repair vs replacement costs
7. **Out-of-Pocket Log** - Track expenses related to the claim
8. **Appraisal Demand** - Request independent appraisal
9. **Notice of Delay** - Document insurance company delays
10. **Coverage Clarification** - Request policy coverage details
11. **Notice of Claim** - Initial claim notification
12. **ROM Estimate** - Rough Order of Magnitude estimate
13. **Photograph Log** - Document evidence with photos
14. **Document Index** - Organize claim documentation
15. **Comparative Estimates** - Compare repair estimates
16. **Settlement Sheet** - Analyze settlement offers

## File Structure

```
/resource-center/tools/document-generator/
├── index.html                    # Main entry point
├── test-functionality.html      # Comprehensive testing page
├── README.md                    # This documentation
└── /forms/                      # Individual form pages
    ├── proof-of-loss.html
    ├── appeal-letter.html
    ├── demand-letter.html
    ├── damage-inventory.html
    ├── claim-timeline.html
    ├── repair-replace.html
    ├── out-of-pocket.html
    ├── appraisal-demand.html
    ├── notice-of-delay.html
    ├── coverage-clarification.html
    ├── notice-of-claim.html
    ├── rom-estimate.html
    ├── photograph-log.html
    ├── document-index.html
    ├── comparative-estimates.html
    └── settlement-sheet.html

/netlify/functions/              # Backend functions
├── generate-letter.js           # AI document generation
├── export-pdf.js               # PDF export functionality
├── export-docx.js              # DOCX export functionality
└── package.json                # Function dependencies
```

## Technical Implementation

### Frontend Technologies
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with Grid and Flexbox layouts
- **JavaScript ES6+**: Class-based architecture with async/await
- **Responsive Design**: Mobile-first approach with breakpoints

### Backend Technologies
- **Netlify Functions**: Serverless backend functions
- **OpenAI GPT-4**: AI-powered content generation
- **Puppeteer**: Server-side PDF generation
- **html-to-docx**: DOCX file generation

### Key Features

#### 1. **Dynamic Form Generation**
```javascript
class DocumentGenerator {
    constructor() {
        this.selectedType = null;
        this.generatedContent = null;
        this.init();
    }
    
    async draftWithAI() {
        // AI generation logic
    }
    
    async exportPDF() {
        // PDF export logic
    }
}
```

#### 2. **Responsive Grid System**
```css
.document-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

@media (max-width: 768px) {
    .document-grid {
        grid-template-columns: 1fr;
    }
}
```

#### 3. **AI Integration**
```javascript
const response = await fetch('/netlify/functions/generate-letter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        documentType: 'proof-of-loss',
        formData: data
    })
});
```

## Usage Instructions

### 1. **Accessing the Tool**
- Navigate to `/resource-center/tools/document-generator/`
- Select a document type from the grid
- Fill out the form with your information

### 2. **Generating Documents**
- Click "Draft with AI" to generate content
- Review the generated content in the preview area
- Use "Export PDF" or "Export DOCX" to download

### 3. **Form Fields**
Each document type includes:
- **Common Fields**: Name, address, policy information
- **Specific Fields**: Tailored to each document type
- **Tooltips**: Helpful guidance for complex fields
- **Validation**: Required field checking

### 4. **Export Options**
- **PDF**: High-quality, print-ready documents
- **DOCX**: Editable Microsoft Word documents
- **Automatic Naming**: Files named based on document type

## Deployment Requirements

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Netlify Configuration
```toml
[build]
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
```

### Dependencies
```json
{
  "dependencies": {
    "openai": "^4.38.2",
    "@sparticvs/chromium": "^123.0.1",
    "puppeteer-core": "^22.7.1",
    "html-to-docx": "^1.8.0"
  }
}
```

## Testing

### Automated Testing
- Run `test-functionality.html` for comprehensive testing
- Tests cover page structure, responsive design, forms, and exports
- Netlify function endpoint testing included

### Manual Testing Checklist
- [ ] All document types load correctly
- [ ] Forms validate required fields
- [ ] AI generation works for each type
- [ ] PDF export downloads correctly
- [ ] DOCX export downloads correctly
- [ ] Responsive design works on mobile/tablet
- [ ] Navigation links work properly

## Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## Performance Considerations

- **Lazy Loading**: Forms load only when needed
- **Optimized Images**: Compressed assets for fast loading
- **Efficient CSS**: Minimal unused styles
- **Async Functions**: Non-blocking AI generation

## Security Features

- **Input Validation**: All form inputs are validated
- **XSS Protection**: Content sanitization
- **CSRF Protection**: Secure form submissions
- **API Key Security**: Environment variable protection

## Troubleshooting

### Common Issues

1. **AI Generation Fails**
   - Check OpenAI API key configuration
   - Verify Netlify function deployment
   - Check browser console for errors

2. **Export Functions Fail**
   - Ensure all dependencies are installed
   - Check Netlify function logs
   - Verify file permissions

3. **Responsive Design Issues**
   - Clear browser cache
   - Check CSS media queries
   - Test on actual devices

### Support
For technical support or feature requests, please contact the development team.

## Version History

- **v1.0.0**: Initial release with 16 document types
- Full-width responsive design
- AI-powered generation
- PDF/DOCX export functionality
- Comprehensive testing suite

---

**Built with ❤️ for Claim Navigator AI**
