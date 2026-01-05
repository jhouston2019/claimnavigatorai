# Images Directory Structure

This directory contains all images and photos for the Claim Navigator website.

## Directory Structure

```
assets/images/
├── icons/           # UI icons, buttons, and small graphics
├── heroes/          # Hero section images and banners
├── features/        # Feature showcase images
├── testimonials/    # Customer photos and testimonial images
├── logos/           # Company logos and branding
├── backgrounds/     # Background images and patterns
└── placeholders/    # Placeholder images for development
```

## Image Guidelines

### File Formats
- **Web Images**: Use WebP format for best performance, with JPG/PNG fallbacks
- **Icons**: Use SVG format for scalable icons, PNG for complex graphics
- **Photos**: Use JPG for photographs, PNG for images with transparency

### Naming Convention
- Use lowercase with hyphens: `hero-banner.jpg`
- Include size in filename for responsive images: `logo-32x32.png`, `logo-64x64.png`
- Use descriptive names: `customer-testimonial-john-smith.jpg`

### Optimization
- Compress images for web use
- Use appropriate dimensions (don't serve 4K images for thumbnails)
- Consider using responsive images with srcset

### Usage Examples
```html
<!-- Hero image -->
<img src="assets/images/heroes/claim-navigator-hero.jpg" alt="Claim Navigator">

<!-- Feature icon -->
<img src="assets/images/icons/ai-analysis.svg" alt="AI Analysis">

<!-- Customer testimonial -->
<img src="assets/images/testimonials/customer-photo.jpg" alt="Customer Photo">
```

## Adding New Images

1. Choose the appropriate subdirectory based on image purpose
2. Follow the naming convention
3. Optimize the image for web use
4. Update this README if adding new categories
