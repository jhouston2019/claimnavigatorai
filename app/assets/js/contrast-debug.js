/**
 * Contrast Debug Tool
 * Highlights elements with poor contrast (light text on light bg, dark text on dark bg)
 * Only runs when window.CN_QA_MODE is true
 */
(function() {
  'use strict';

  // Only run in QA mode or when explicitly triggered
  if (!window.CN_QA_MODE && !window.location.search.includes('qa=contrast')) {
    return;
  }

  /**
   * Determine if a color is light (for contrast checking)
   * @param {string} color - CSS color value (rgb, rgba, hex, etc.)
   * @returns {boolean} - true if color is light
   */
  function isLightColor(color) {
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
      return false; // Treat transparent as dark for safety
    }

    // Extract RGB values from various formats
    let r, g, b;

    // Handle rgb/rgba format
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      r = parseInt(rgbMatch[1], 10);
      g = parseInt(rgbMatch[2], 10);
      b = parseInt(rgbMatch[3], 10);
    } else {
      // Handle hex format
      const hexMatch = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
      if (hexMatch) {
        r = parseInt(hexMatch[1], 16);
        g = parseInt(hexMatch[2], 16);
        b = parseInt(hexMatch[3], 16);
      } else {
        // Named colors - common light colors
        const lightColors = ['white', '#fff', '#ffffff', 'rgb(255, 255, 255)', 'rgba(255, 255, 255'];
        if (lightColors.some(lc => color.toLowerCase().includes(lc.toLowerCase()))) {
          return true;
        }
        // Default to dark if we can't parse
        return false;
      }
    }

    // Calculate relative luminance (simplified)
    // Using the formula: 0.2126*R + 0.7152*G + 0.0722*B
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    
    // Threshold: > 180 is considered light
    return luminance > 180;
  }

  /**
   * Get computed background color, traversing up the DOM if needed
   * @param {Element} element - DOM element
   * @returns {string} - Background color
   */
  function getBackgroundColor(element) {
    const style = window.getComputedStyle(element);
    let bg = style.backgroundColor;

    // If transparent or rgba(0,0,0,0), check parent
    if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
      const parent = element.parentElement;
      if (parent && parent !== document.body) {
        return getBackgroundColor(parent);
      }
      // Default to page background
      return 'rgb(248, 249, 251)'; // --cn-bg-page
    }

    return bg;
  }

  /**
   * Scan page for contrast issues
   */
  function scanForContrastIssues() {
    const allElements = document.querySelectorAll('body *');
    let issueCount = 0;

    allElements.forEach(el => {
      // Skip script, style, and hidden elements
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') {
        return;
      }

      const style = window.getComputedStyle(el);
      if (!style) return;

      // Skip if element is not visible
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return;
      }

      const fg = style.color;
      const bg = getBackgroundColor(el);

      if (!fg || !bg) return;

      const bgLight = isLightColor(bg);
      const fgLight = isLightColor(fg);

      // Check for problematic combinations:
      // 1. Both light (white text on white/light background)
      // 2. Both dark (black text on black/dark background)
      if ((bgLight && fgLight) || (!bgLight && !fgLight)) {
        // Add visual indicator
        el.style.outline = '2px solid rgba(220, 38, 38, 0.9)';
        el.style.outlineOffset = '2px';
        el.setAttribute('data-contrast-issue', 'true');
        issueCount++;
      }
    });

    // Log summary
    if (issueCount > 0) {
      console.warn(`[Contrast Debug] Found ${issueCount} elements with potential contrast issues (red outline)`);
    } else {
      console.log('[Contrast Debug] No contrast issues detected');
    }

    return issueCount;
  }

  /**
   * Clear all contrast indicators
   */
  function clearIndicators() {
    document.querySelectorAll('[data-contrast-issue]').forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.removeAttribute('data-contrast-issue');
    });
  }

  // Run scan after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      scanForContrastIssues();
    }, 500);
  });

  // Also scan after DOM mutations (for dynamic content)
  if (window.MutationObserver) {
    const observer = new MutationObserver(() => {
      // Debounce scans
      clearTimeout(window._contrastScanTimeout);
      window._contrastScanTimeout = setTimeout(() => {
        clearIndicators();
        scanForContrastIssues();
      }, 1000);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  // Expose API for manual control
  window.CNContrastDebug = {
    scan: scanForContrastIssues,
    clear: clearIndicators
  };
})();

