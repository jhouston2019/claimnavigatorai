/**
 * Font Color Audit Tool
 * Scans the page for color contrast issues and generates a report
 */
(function() {
  'use strict';

  function rgbToLuminance(r, g, b) {
    // Convert to relative luminance
    const [rs, gs, bs] = [r, g, b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function parseColor(color) {
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
      return null;
    }

    // RGB/RGBA
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10)
      };
    }

    // Hex
    const hexMatch = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1], 16),
        g: parseInt(hexMatch[2], 16),
        b: parseInt(hexMatch[3], 16)
      };
    }

    // Named colors
    const namedColors = {
      'white': { r: 255, g: 255, b: 255 },
      'black': { r: 0, g: 0, b: 0 },
      '#fff': { r: 255, g: 255, b: 255 },
      '#ffffff': { r: 255, g: 255, b: 255 },
      '#000': { r: 0, g: 0, b: 0 },
      '#000000': { r: 0, g: 0, b: 0 }
    };
    if (namedColors[color.toLowerCase()]) {
      return namedColors[color.toLowerCase()];
    }

    return null;
  }

  function getBackgroundColor(element) {
    const style = window.getComputedStyle(element);
    let bg = style.backgroundColor;
    
    if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
      const parent = element.parentElement;
      if (parent && parent !== document.body) {
        return getBackgroundColor(parent);
      }
      return 'rgb(248, 249, 251)'; // Default light background
    }
    
    return bg;
  }

  function calculateContrastRatio(fg, bg) {
    const fgRgb = parseColor(fg);
    const bgRgb = parseColor(bg);
    
    if (!fgRgb || !bgRgb) return null;
    
    const fgLum = rgbToLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
    const bgLum = rgbToLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    
    const lighter = Math.max(fgLum, bgLum);
    const darker = Math.min(fgLum, bgLum);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  function isLightColor(color) {
    const rgb = parseColor(color);
    if (!rgb) return false;
    const luminance = rgbToLuminance(rgb.r, rgb.g, rgb.b);
    return luminance > 0.5;
  }

  function auditPage() {
    const issues = [];
    const allElements = document.querySelectorAll('body *');
    
    allElements.forEach((el, index) => {
      // Skip script, style, hidden elements
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') {
        return;
      }

      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return;
      }

      const fg = style.color;
      const bg = getBackgroundColor(el);
      
      if (!fg || !bg) return;

      const fgRgb = parseColor(fg);
      const bgRgb = parseColor(bg);
      
      if (!fgRgb || !bgRgb) return;

      const fgLight = isLightColor(fg);
      const bgLight = isLightColor(bg);
      
      const contrast = calculateContrastRatio(fg, bg);
      
      // Check for issues
      if (fgLight && bgLight) {
        issues.push({
          type: 'white-on-white',
          element: el,
          tag: el.tagName,
          text: el.textContent?.substring(0, 50) || '',
          fg: fg,
          bg: bg,
          contrast: contrast,
          selector: getSelector(el)
        });
      } else if (!fgLight && !bgLight) {
        issues.push({
          type: 'black-on-black',
          element: el,
          tag: el.tagName,
          text: el.textContent?.substring(0, 50) || '',
          fg: fg,
          bg: bg,
          contrast: contrast,
          selector: getSelector(el)
        });
      } else if (contrast && contrast < 4.5) {
        issues.push({
          type: 'low-contrast',
          element: el,
          tag: el.tagName,
          text: el.textContent?.substring(0, 50) || '',
          fg: fg,
          bg: bg,
          contrast: contrast.toFixed(2),
          selector: getSelector(el)
        });
      }
    });

    return issues;
  }

  function getSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.className) {
      const classes = el.className.toString().split(' ').filter(c => c).slice(0, 2).join('.');
      if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
    }
    return el.tagName.toLowerCase();
  }

  function generateReport() {
    const issues = auditPage();
    
    console.group('🎨 Font Color Audit Report');
    console.log(`Total elements scanned: ${document.querySelectorAll('body *').length}`);
    console.log(`Issues found: ${issues.length}`);
    
    if (issues.length === 0) {
      console.log('✅ No contrast issues detected!');
      console.groupEnd();
      return;
    }

    const byType = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Issues by Type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\n🔍 Detailed Issues:');
    issues.forEach((issue, i) => {
      console.group(`Issue ${i + 1}: ${issue.type}`);
      console.log(`Element: ${issue.tag} (${issue.selector})`);
      console.log(`Text: "${issue.text}"`);
      console.log(`Foreground: ${issue.fg}`);
      console.log(`Background: ${issue.bg}`);
      if (issue.contrast) {
        console.log(`Contrast Ratio: ${issue.contrast}${issue.contrast < 4.5 ? ' ⚠️ (Below WCAG AA)' : ''}`);
      }
      console.log(`Element:`, issue.element);
      console.groupEnd();
    });

    console.groupEnd();

    // Visual highlighting
    issues.forEach(issue => {
      issue.element.style.outline = '3px solid red';
      issue.element.style.outlineOffset = '2px';
      issue.element.setAttribute('data-audit-issue', issue.type);
    });

    return issues;
  }

  // Run audit
  if (window.location.search.includes('audit=colors') || window.CN_QA_MODE) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.CNFontColorAudit = {
          run: generateReport,
          clear: () => {
            document.querySelectorAll('[data-audit-issue]').forEach(el => {
              el.style.outline = '';
              el.style.outlineOffset = '';
              el.removeAttribute('data-audit-issue');
            });
          }
        };
        generateReport();
      }, 1000);
    });
  }
})();

