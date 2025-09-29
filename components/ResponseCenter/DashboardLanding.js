/**
 * Response Center Dashboard Landing Component
 * Card/tile layout for main dashboard overview
 */

class DashboardLanding {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onCardClick: null,
      ...options
    };
    
    this.cards = [
      {
        id: 'document-library',
        title: 'Document Library',
        icon: '📄',
        description: 'Access templates and samples instantly',
        color: 'blue',
        stats: '50+ Templates',
        action: 'Browse Library'
      },
      {
        id: 'situational-advisory',
        title: 'Situational Advisory',
        icon: '🎯',
        description: 'AI-powered guidance for your specific situation',
        color: 'green',
        stats: 'AI-Powered',
        action: 'Get Guidance'
      },
      {
        id: 'insurance-tactics',
        title: 'Insurance Company Tactics',
        icon: '⚔️',
        description: 'Common tactics and how to counter them',
        color: 'red',
        stats: '25+ Tactics',
        action: 'Learn More'
      },
      {
        id: 'claim-timeline',
        title: 'Claim Timeline & Sequence Guide',
        icon: '⏰',
        description: 'Step-by-step claim management roadmap',
        color: 'purple',
        stats: '9 Phases',
        action: 'View Timeline'
      },
      {
        id: 'maximize-claim',
        title: 'How to Maximize Your Claim',
        icon: '💰',
        description: 'Strategies to maximize your settlement',
        color: 'yellow',
        stats: 'Proven Methods',
        action: 'Maximize Now'
      },
      {
        id: 'solution-center',
        title: 'Solution Center',
        icon: '💬',
        description: 'Messaging and communication hub',
        color: 'indigo',
        stats: '24/7 Support',
        action: 'Open Center'
      }
    ];
    
    this.init();
  }

  init() {
    console.log('🏠 DashboardLanding init() called');
    this.createDashboard();
    this.bindEvents();
    this.injectStyles();
    console.log('✅ DashboardLanding initialized');
  }

  createDashboard() {
    console.log('🏗️ Creating dashboard HTML');
    this.container.innerHTML = `
      <div class="dashboard-landing">
        <div class="dashboard-header">
          <h1 class="dashboard-title">Welcome to Response Center</h1>
          <p class="dashboard-subtitle">Your comprehensive claim management toolkit</p>
        </div>
        
        <div class="dashboard-stats">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-number">50+</div>
              <div class="stat-label">Documents</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <div class="stat-number">AI</div>
              <div class="stat-label">Powered</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-content">
              <div class="stat-number">24/7</div>
              <div class="stat-label">Support</div>
            </div>
          </div>
        </div>
        
        <div class="dashboard-cards">
          ${this.cards.map(card => this.createCardHTML(card)).join('')}
        </div>
        
        <div class="dashboard-footer">
          <div class="quick-actions">
            <h3>Quick Actions</h3>
            <div class="action-buttons">
              <button class="action-btn primary" data-action="generate-response">
                <span class="btn-icon">🤖</span>
                <span class="btn-text">Generate AI Response</span>
              </button>
              <button class="action-btn secondary" data-action="upload-documents">
                <span class="btn-icon">📤</span>
                <span class="btn-text">Upload Documents</span>
              </button>
              <button class="action-btn secondary" data-action="view-playbook">
                <span class="btn-icon">📖</span>
                <span class="btn-text">View Playbook</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createCardHTML(card) {
    return `
      <div class="dashboard-card ${card.color}" data-card="${card.id}">
        <div class="card-header">
          <div class="card-icon">${card.icon}</div>
          <div class="card-stats">${card.stats}</div>
        </div>
        
        <div class="card-content">
          <h3 class="card-title">${card.title}</h3>
          <p class="card-description">${card.description}</p>
        </div>
        
        <div class="card-footer">
          <button class="card-action" data-card="${card.id}">
            ${card.action}
            <span class="action-arrow">→</span>
          </button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Card clicks
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('.dashboard-card')) {
        const card = e.target.closest('.dashboard-card');
        const cardId = card.dataset.card;
        this.handleCardClick(cardId);
      }
      
      if (e.target.closest('.card-action')) {
        const button = e.target.closest('.card-action');
        const cardId = button.dataset.card;
        this.handleCardClick(cardId);
      }
      
      if (e.target.closest('.action-btn')) {
        const button = e.target.closest('.action-btn');
        const action = button.dataset.action;
        this.handleQuickAction(action);
      }
    });

    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const button = e.target.closest('button');
        if (button) button.click();
      }
    });
  }

  handleCardClick(cardId) {
    // Add click animation
    const card = this.container.querySelector(`[data-card="${cardId}"]`);
    if (card) {
      card.classList.add('clicked');
      setTimeout(() => card.classList.remove('clicked'), 200);
    }

    // Trigger callback
    if (this.options.onCardClick) {
      this.options.onCardClick(cardId);
    }
  }

  handleQuickAction(action) {
    // Add click animation
    const button = this.container.querySelector(`[data-action="${action}"]`);
    if (button) {
      button.classList.add('clicked');
      setTimeout(() => button.classList.remove('clicked'), 200);
    }

    // Handle specific actions
    switch (action) {
      case 'generate-response':
        if (this.options.onCardClick) {
          this.options.onCardClick('ai-generator');
        }
        break;
      case 'upload-documents':
        if (this.options.onCardClick) {
          this.options.onCardClick('my-documents');
        }
        break;
      case 'view-playbook':
        if (this.options.onCardClick) {
          this.options.onCardClick('claim-playbook');
        }
        break;
    }
  }

  updateStats(stats) {
    const statCards = this.container.querySelectorAll('.stat-card');
    if (stats.documentCount) {
      statCards[0].querySelector('.stat-number').textContent = `${stats.documentCount}+`;
    }
    if (stats.aiEnabled !== undefined) {
      statCards[1].querySelector('.stat-number').textContent = stats.aiEnabled ? 'AI' : 'Manual';
    }
    if (stats.supportHours) {
      statCards[2].querySelector('.stat-number').textContent = stats.supportHours;
    }
  }

  highlightCard(cardId) {
    // Remove previous highlights
    this.container.querySelectorAll('.dashboard-card').forEach(card => {
      card.classList.remove('highlighted');
    });
    
    // Highlight specified card
    const card = this.container.querySelector(`[data-card="${cardId}"]`);
    if (card) {
      card.classList.add('highlighted');
      setTimeout(() => card.classList.remove('highlighted'), 3000);
    }
  }

  injectStyles() {
    if (document.querySelector('#dashboard-landing-styles')) return;
    
    const styles = `
      <style id="dashboard-landing-styles">
        .dashboard-landing {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary);
          margin: 0 0 0.5rem 0;
        }

        .dashboard-subtitle {
          font-size: 1.125rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
          margin: 0;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .dashboard-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .dashboard-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
          transition: all 0.3s ease;
          cursor: pointer;
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
          background: var(--primary);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .dashboard-card.blue::before {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .dashboard-card.green::before {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .dashboard-card.red::before {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .dashboard-card.purple::before {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        }

        .dashboard-card.yellow::before {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .dashboard-card.indigo::before {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
        }

        .dashboard-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.15);
        }

        .dashboard-card:hover::before {
          transform: scaleX(1);
        }

        .dashboard-card.clicked {
          transform: scale(0.98);
        }

        .dashboard-card.highlighted {
          animation: highlight 3s ease-in-out;
        }

        @keyframes highlight {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .card-icon {
          font-size: 2.5rem;
        }

        .card-stats {
          background: var(--bg-light);
          color: var(--primary);
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .card-content {
          margin-bottom: 1.5rem;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--primary);
          margin: 0 0 0.5rem 0;
        }

        .card-description {
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .card-footer {
          display: flex;
          justify-content: flex-end;
        }

        .card-action {
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .card-action:hover {
          background: #1d4ed8;
          transform: translateX(2px);
        }

        .action-arrow {
          transition: transform 0.2s ease;
        }

        .card-action:hover .action-arrow {
          transform: translateX(2px);
        }

        .dashboard-footer {
          background: var(--bg-light);
          border-radius: 16px;
          padding: 2rem;
        }

        .quick-actions h3 {
          margin: 0 0 1.5rem 0;
          color: var(--primary);
          font-size: 1.25rem;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.primary {
          background: var(--primary);
          color: white;
        }

        .action-btn.primary:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .action-btn.secondary {
          background: white;
          color: var(--primary);
          border: 1px solid var(--border);
        }

        .action-btn.secondary:hover {
          background: var(--bg-light);
          transform: translateY(-1px);
        }

        .action-btn.clicked {
          transform: scale(0.95);
        }

        .btn-icon {
          font-size: 1.125rem;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .dashboard-landing {
            padding: 1rem;
          }

          .dashboard-title {
            font-size: 2rem;
          }

          .dashboard-cards {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .dashboard-card {
            padding: 1.5rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-btn {
            justify-content: center;
          }
        }

        /* Focus styles */
        .dashboard-card:focus,
        .card-action:focus,
        .action-btn:focus {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .dashboard-card {
            border-width: 2px;
          }

          .card-action,
          .action-btn.primary {
            background: #000000;
            color: #ffffff;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .dashboard-card,
          .stat-card,
          .card-action,
          .action-btn {
            transition: none;
          }

          .dashboard-card.highlighted {
            animation: none;
          }
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardLanding;
}

// Global registration
if (typeof window !== 'undefined') {
  window.DashboardLanding = DashboardLanding;
}
