/**
 * Dashboard Landing Component
 * Card/tile layout for the main dashboard view
 */

class DashboardLanding {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onCardClick: null,
      ...options
    };
    
    this.init();
  }

  init() {
    this.createDashboard();
    this.bindEvents();
  }

  createDashboard() {
    this.dashboard = document.createElement('div');
    this.dashboard.className = 'dashboard-landing';
    
    // Header
    const header = document.createElement('div');
    header.className = 'dashboard-header';
    header.innerHTML = `
      <h1 class="dashboard-title">Claim Resource & AI Response Center</h1>
      <p class="dashboard-subtitle">Your comprehensive claim management hub</p>
    `;
    
    // Cards grid
    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'dashboard-cards';
    
    const cards = [
      {
        id: 'document-library',
        title: 'Document Library',
        description: 'Access templates, samples, and certified policy requests instantly',
        icon: '📄',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
      },
      {
        id: 'situational-advisory',
        title: 'Situational Advisory',
        description: 'Get personalized guidance based on your specific claim situation',
        icon: '🎯',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981, #059669)'
      },
      {
        id: 'insurance-tactics',
        title: 'Insurance Company Tactics',
        description: 'Learn common tactics used by insurance companies and how to counter them',
        icon: '⚔️',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
      },
      {
        id: 'claim-timeline',
        title: 'Claim Timeline & Sequence Guide',
        description: 'Step-by-step guide through the entire claim process',
        icon: '⏰',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
      },
      {
        id: 'maximize-claim',
        title: 'How to Maximize Your Claim',
        description: 'Strategies and tips to get the maximum settlement for your claim',
        icon: '💰',
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
      },
      {
        id: 'how-to-use',
        title: 'How to Use This Site',
        description: 'Complete guide on navigating and using all available tools',
        icon: '❓',
        color: '#6b7280',
        gradient: 'linear-gradient(135deg, #6b7280, #4b5563)'
      },
      {
        id: 'solution-center',
        title: 'Solution Center',
        description: 'Get help and support from our team of experts',
        icon: '💬',
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)'
      }
    ];
    
    cards.forEach(card => {
      const cardElement = this.createCard(card);
      cardsGrid.appendChild(cardElement);
    });
    
    this.dashboard.appendChild(header);
    this.dashboard.appendChild(cardsGrid);
    this.container.appendChild(this.dashboard);
  }

  createCard(cardData) {
    const card = document.createElement('div');
    card.className = 'dashboard-card';
    card.dataset.section = cardData.id;
    
    card.innerHTML = `
      <div class="card-icon" style="background: ${cardData.gradient}">
        <span class="icon">${cardData.icon}</span>
      </div>
      <div class="card-content">
        <h3 class="card-title">${cardData.title}</h3>
        <p class="card-description">${cardData.description}</p>
        <div class="card-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    `;
    
    // Add hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
      card.style.boxShadow = `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    });
    
    return card;
  }

  bindEvents() {
    // Card click handlers
    this.dashboard.addEventListener('click', (e) => {
      const card = e.target.closest('.dashboard-card');
      if (card) {
        const sectionId = card.dataset.section;
        if (this.options.onCardClick) {
          this.options.onCardClick(sectionId);
        }
      }
    });
  }

  // Public methods
  show() {
    this.dashboard.style.display = 'block';
  }

  hide() {
    this.dashboard.style.display = 'none';
  }
}

// CSS styles
const styles = `
.dashboard-landing {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-title {
  font-size: 3rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dashboard-subtitle {
  font-size: 1.25rem;
  color: #64748b;
  margin: 0;
  font-weight: 400;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.dashboard-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.dashboard-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 16px 16px 0 0;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card-icon .icon {
  font-size: 1.5rem;
  color: white;
}

.card-content {
  position: relative;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
}

.card-description {
  color: #64748b;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.card-arrow {
  position: absolute;
  top: 0;
  right: 0;
  color: #94a3b8;
  transition: all 0.2s ease;
}

.dashboard-card:hover .card-arrow {
  color: #3b82f6;
  transform: translateX(4px);
}

/* Responsive design */
@media (max-width: 768px) {
  .dashboard-landing {
    padding: 1rem;
  }
  
  .dashboard-title {
    font-size: 2rem;
  }
  
  .dashboard-subtitle {
    font-size: 1rem;
  }
  
  .dashboard-cards {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .dashboard-card {
    padding: 1.5rem;
  }
  
  .card-title {
    font-size: 1.25rem;
  }
  
  .card-description {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .dashboard-landing {
    padding: 0.5rem;
  }
  
  .dashboard-cards {
    gap: 1rem;
  }
  
  .dashboard-card {
    padding: 1rem;
  }
  
  .card-icon {
    width: 50px;
    height: 50px;
  }
  
  .card-icon .icon {
    font-size: 1.25rem;
  }
}

/* Animation for card entrance */
@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dashboard-card {
  animation: cardSlideIn 0.6s ease forwards;
}

.dashboard-card:nth-child(1) { animation-delay: 0.1s; }
.dashboard-card:nth-child(2) { animation-delay: 0.2s; }
.dashboard-card:nth-child(3) { animation-delay: 0.3s; }
.dashboard-card:nth-child(4) { animation-delay: 0.4s; }
.dashboard-card:nth-child(5) { animation-delay: 0.5s; }
.dashboard-card:nth-child(6) { animation-delay: 0.6s; }
.dashboard-card:nth-child(7) { animation-delay: 0.7s; }

/* Focus states for accessibility */
.dashboard-card:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.dashboard-card:focus:not(:focus-visible) {
  outline: none;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .dashboard-card {
    border: 2px solid #000000;
  }
  
  .card-title {
    color: #000000;
  }
  
  .card-description {
    color: #333333;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .dashboard-card {
    animation: none;
    transition: none;
  }
  
  .dashboard-card:hover {
    transform: none;
  }
}
`;

// Inject styles
if (!document.querySelector('#dashboard-landing-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'dashboard-landing-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardLanding;
}
