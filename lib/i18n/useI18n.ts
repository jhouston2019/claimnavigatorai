import { useState, useEffect } from 'react';

export type Language = 'en' | 'es';

export interface Translations {
  [key: string]: any;
}

// Load translations dynamically
async function loadTranslations(lang: Language): Promise<Translations> {
  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${lang}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading translations:', error);
    // Fallback to English if Spanish fails
    if (lang === 'es') {
      return loadTranslations('en');
    }
    return {};
  }
}

export function useI18n() {
  const [lang, setLang] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>({});
  const [loading, setLoading] = useState(true);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
      setLang(savedLang);
    }
  }, []);

  // Load translations when language changes
  useEffect(() => {
    setLoading(true);
    loadTranslations(lang)
      .then(setTranslations)
      .finally(() => setLoading(false));
  }, [lang]);

  // Translation function
  const t = (path: string): string => {
    const keys = path.split('.');
    let value: any = translations;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return path; // Return the path if translation not found
      }
    }
    
    return typeof value === 'string' ? value : path;
  };

  // Change language
  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  return {
    lang,
    setLang: changeLanguage,
    t,
    loading,
    translations
  };
}

// Helper function to get nested translation
export function getTranslation(translations: Translations, path: string): string {
  const keys = path.split('.');
  let value: any = translations;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path;
    }
  }
  
  return typeof value === 'string' ? value : path;
}

// Language detection utilities
export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  // Check localStorage first
  const savedLang = localStorage.getItem('lang') as Language;
  if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
    return savedLang;
  }
  
  // Check browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('es')) {
    return 'es';
  }
  
  return 'en';
}

// Format date according to language
export function formatDate(date: Date, lang: Language): string {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Format currency according to language
export function formatCurrency(amount: number, lang: Language, currency = 'USD'): string {
  return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

// Format number according to language
export function formatNumber(number: number, lang: Language): string {
  return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US').format(number);
}
