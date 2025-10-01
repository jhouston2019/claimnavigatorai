import React from 'react';
import { useI18n } from '../lib/i18n/useI18n';

interface LanguageToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LanguageToggle({ 
  className = '', 
  showLabel = true,
  size = 'md'
}: LanguageToggleProps) {
  const { lang, setLang, t } = useI18n();

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  const handleLanguageChange = (newLang: 'en' | 'es') => {
    setLang(newLang);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabel && (
        <span className="text-gray-600 dark:text-gray-300">
          {t('common.language')}:
        </span>
      )}
      
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => handleLanguageChange('en')}
          className={`
            ${sizeClasses[size]}
            rounded-md transition-all duration-200
            ${lang === 'en' 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }
          `}
          aria-label="Switch to English"
        >
          🇺🇸 {t('common.english')}
        </button>
        
        <button
          onClick={() => handleLanguageChange('es')}
          className={`
            ${sizeClasses[size]}
            rounded-md transition-all duration-200
            ${lang === 'es' 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }
          `}
          aria-label="Cambiar a Español"
        >
          🇪🇸 {t('common.spanish')}
        </button>
      </div>
    </div>
  );
}

// Alternative dropdown version
export function LanguageDropdown({ 
  className = '',
  showLabel = true 
}: LanguageToggleProps) {
  const { lang, setLang, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLang: 'en' | 'es') => {
    setLang(newLang);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('common.language')}
        </label>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between px-3 py-2 
          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
          rounded-md shadow-sm text-sm
          hover:bg-gray-50 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center">
          {lang === 'en' ? '🇺🇸' : '🇪🇸'} 
          <span className="ml-2">
            {lang === 'en' ? t('common.english') : t('common.spanish')}
          </span>
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="
          absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-600 rounded-md shadow-lg
        ">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`
              w-full flex items-center px-3 py-2 text-sm
              hover:bg-gray-50 dark:hover:bg-gray-700
              ${lang === 'en' ? 'bg-blue-50 dark:bg-blue-900' : ''}
            `}
          >
            🇺🇸 {t('common.english')}
          </button>
          
          <button
            onClick={() => handleLanguageChange('es')}
            className={`
              w-full flex items-center px-3 py-2 text-sm
              hover:bg-gray-50 dark:hover:bg-gray-700
              ${lang === 'es' ? 'bg-blue-50 dark:bg-blue-900' : ''}
            `}
          >
            🇪🇸 {t('common.spanish')}
          </button>
        </div>
      )}
    </div>
  );
}
