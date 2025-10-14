import React from 'react';
import { useI18n } from '../lib/i18n/useI18n';

interface NavigationProps {
  currentPath?: string;
  className?: string;
}

export function Navigation({ currentPath = '', className = '' }: NavigationProps) {
  const { t } = useI18n();

  const navigationItems = [
    {
      id: 'how-to-use',
      label: t('navigation.how_to_use'),
      path: '/response-center#how-to-use',
      icon: '📚'
    },
    {
      id: 'ai-agent',
      label: t('navigation.ai_agent'),
      path: '/response-center#ai-agent',
      icon: '🤖'
    },
    {
      id: 'my-claims',
      label: t('navigation.my_claims'),
      path: '/app/claims.html',
      icon: '📋'
    },
    {
      id: 'document-generator',
      label: t('navigation.document_generator'),
      path: '/app/resource-center/document-generator.html',
      icon: '📄'
    },
    {
      id: 'situational-advisory',
      label: t('navigation.situational_advisory'),
      path: '/app/resource-center/situational-advisory.html',
      icon: '💡'
    },
    {
      id: 'maximize-claim',
      label: t('navigation.maximize_claim'),
      path: '/app/resource-center/maximize-claim.html',
      icon: '📈'
    },
    {
      id: 'insurance-tactics',
      label: t('navigation.insurance_tactics'),
      path: '/app/resource-center/insurance-tactics.html',
      icon: '🎯'
    },
    {
      id: 'advanced-tools',
      label: t('navigation.advanced_tools'),
      path: '/app/resource-center/advanced-tools.html',
      icon: '⚡'
    },
    {
      id: 'my-documents',
      label: t('navigation.my_documents'),
      path: '/response-center#my-documents',
      icon: '📁'
    },
    {
      id: 'analysis-tools',
      label: t('navigation.analysis_tools'),
      path: '/response-center#analysis-tools',
      icon: '🔍'
    },
    {
      id: 'claim-playbook',
      label: t('navigation.claim_playbook'),
      path: '/response-center#claim-playbook',
      icon: '📖'
    },
    {
      id: 'claim-timeline',
      label: t('navigation.claim_timeline'),
      path: '/response-center#claim-timeline-guide',
      icon: '⏰'
    },
    {
      id: 'documentation-guides',
      label: t('navigation.documentation_guides'),
      path: '/response-center#claim-documentation-guides',
      icon: '📝'
    },
    {
      id: 'resources',
      label: t('navigation.resources'),
      path: '/response-center#recommended-resources',
      icon: '🔗'
    },
    {
      id: 'appeal-builder',
      label: t('navigation.appeal_builder'),
      path: '/response-center#appeal-builder',
      icon: '⚖️'
    },
    {
      id: 'settings',
      label: t('navigation.settings'),
      path: '/response-center#settings',
      icon: '⚙️'
    }
  ];

  const isActive = (path: string) => {
    if (path.includes('#')) {
      return currentPath.includes(path.split('#')[0]);
    }
    return currentPath === path;
  };

  return (
    <nav className={`navigation ${className}`}>
      <div className="tabs">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`tab ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => {
              if (item.path.includes('#')) {
                // Handle hash navigation
                const [basePath, hash] = item.path.split('#');
                if (basePath === '/response-center') {
                  window.location.href = `/response-center.html#${hash}`;
                } else {
                  window.location.href = item.path;
                }
              } else {
                window.location.href = item.path;
              }
            }}
            title={item.label}
          >
            <span className="tab-icon">{item.icon}</span>
            <span className="tab-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// CSS styles for the navigation component
export const navigationStyles = `
  .navigation .tabs {
    display: flex;
    border-bottom: 2px solid var(--border);
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .navigation .tab {
    padding: 0.75rem 1rem;
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: 0.5rem 0.5rem 0 0;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .navigation .tab:hover {
    background: var(--bg-light);
    color: var(--primary);
  }

  .navigation .tab.active {
    border-bottom: 3px solid var(--primary);
    font-weight: bold;
    color: var(--primary);
    background: var(--bg-light);
  }

  .navigation .tab-icon {
    font-size: 1rem;
  }

  .navigation .tab-label {
    font-weight: 500;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .navigation .tabs {
      flex-direction: column;
      border-bottom: none;
    }

    .navigation .tab {
      border-bottom: 1px solid var(--border);
      border-radius: 0;
      justify-content: flex-start;
      padding: 1rem;
    }

    .navigation .tab.active {
      border-bottom-color: var(--border);
      border-left: 3px solid var(--primary);
      border-bottom: 1px solid var(--border);
    }

    .navigation .tab-icon {
      font-size: 1.2rem;
    }

    .navigation .tab-label {
      font-size: 1rem;
    }
  }

  /* Tablet responsiveness */
  @media (max-width: 1024px) and (min-width: 769px) {
    .navigation .tabs {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      display: grid;
    }

    .navigation .tab {
      justify-content: center;
      text-align: center;
    }
  }
`;

// Hook for navigation state management
export function useNavigation() {
  const [currentPath, setCurrentPath] = React.useState('');

  React.useEffect(() => {
    setCurrentPath(window.location.pathname + window.location.hash);
  }, []);

  const navigate = (path: string) => {
    if (path.includes('#')) {
      const [basePath, hash] = path.split('#');
      if (basePath === '/response-center') {
        window.location.href = `/response-center.html#${hash}`;
      } else {
        window.location.href = path;
      }
    } else {
      window.location.href = path;
    }
  };

  return { currentPath, navigate };
}
