/**
 * Consistent Navigation Bar Template for All Tool Pages
 * Provides standardized navigation across all ClaimNavigatorAI tools
 */

export function createNavigationBar(currentTool, currentPage = '') {
  return `
    <header class="header">
      <div class="bar container">
        <div class="brand">
          <div class="logo"></div>
          <div>ClaimNavigatorAI</div>
        </div>
        <nav class="nav">
          <a href="/app/index.html">Home</a>
          <span class="nav-separator">></span>
          <span class="nav-current">${currentTool}</span>
          <span class="nav-separator">></span>
          <a href="/app/resource-center.html">Resource Center</a>
        </nav>
      </div>
    </header>
  `;
}

export function createToolNavigationBar(toolName, toolPath = '') {
  const navigationItems = [
    { name: 'Home', path: '/app/index.html' },
    { name: toolName, path: toolPath, isCurrent: true },
    { name: 'Resource Center', path: '/app/resource-center.html' }
  ];

  return `
    <header class="header">
      <div class="bar container">
        <div class="brand">
          <div class="logo"></div>
          <div>ClaimNavigatorAI</div>
        </div>
        <nav class="nav">
          ${navigationItems.map((item, index) => {
            if (item.isCurrent) {
              return `<span class="nav-current">${item.name}</span>`;
            }
            return `<a href="${item.path}">${item.name}</a>`;
          }).join(' <span class="nav-separator">></span> ')}
        </nav>
      </div>
    </header>
  `;
}

// CSS for navigation bar
export const navigationStyles = `
  .header {
    background: #0f172a;
    color: white;
    padding: 1rem 0;
  }
  
  .bar {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
  }
  
  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 1.125rem;
  }
  
  .logo {
    width: 32px;
    height: 32px;
    background: #3b82f6;
    border-radius: 6px;
  }
  
  .nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .nav a {
    color: #c9d4ff;
    text-decoration: none;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.3s ease;
  }
  
  .nav a:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  .nav-current {
    color: white;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
  }
  
  .nav-separator {
    color: #64748b;
    margin: 0 0.25rem;
  }
  
  @media (max-width: 768px) {
    .bar {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }
    
    .nav {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
`;
