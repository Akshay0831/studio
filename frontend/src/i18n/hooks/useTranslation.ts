import { useEffect, useState } from 'react';
import { useTranslation as useReactTranslation } from 'react-i18next';
import i18n, { DEFAULT_LANGUAGE, supportedLanguages } from '../config';

// Translation hook with enhanced features
export const useTranslation = () => {
  const { t, i18n: reactI18n } = useReactTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(reactI18n.language);
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    // Update language state when language changes
    setCurrentLanguage(reactI18n.language);
    setIsRTL(getLanguageDirection(reactI18n.language));
    
    // Update document direction for RTL languages
    document.documentElement.dir = getLanguageDirection(reactI18n.language) ? 'rtl' : 'ltr';
  }, [reactI18n.language]);

  // Change language function
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Get current language info
  const getCurrentLanguage = () => {
    return getSupportedLanguages().find((lang: any) => lang.code === currentLanguage) || getSupportedLanguages()[0];
  };

  // Get supported languages
  const getSupportedLanguages = () => {
    return supportedLanguages;
  };

  // Format number according to current locale
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(currentLanguage, options).format(number);
  };

  // Format date according to current locale
  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(currentLanguage, options).format(dateObj);
  };

  // Format currency according to current locale
  const formatCurrency = (amount: number, currency: string, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency,
      ...options
    }).format(amount);
  };

  // Check if text should be translated (contains keys)
  const shouldTranslate = (text: string): boolean => {
    return text.includes('.') || text.includes('_') || text.includes('-');
  };

  // Get translation with fallback
  const tWithFallback = (key: string, fallback?: string, options?: any) => {
    const translation = t(key, options);
    return translation !== key ? translation : (fallback || key);
  };

  // Get translation with formatting
  const tFormatted = (key: string, format?: string, options?: any) => {
    return t(key, { ...options, format });
  };

  return {
    // Core translation functions
    t,
    tWithFallback,
    tFormatted,
    
    // Language functions
    changeLanguage,
    currentLanguage,
    getCurrentLanguage,
    getSupportedLanguages,
    isRTL,
    
    // Format functions
    formatNumber,
    formatDate,
    formatCurrency,
    
    // Utility functions
    shouldTranslate
  };
};

// Helper function to get language direction
export const getLanguageDirection = (languageCode: string): boolean => {
  const language = supportedLanguages.find(lang => lang.code === languageCode);
  return language?.rtl || false;
};

// Helper function to detect browser language
export const detectBrowserLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0];
  return supportedLanguages.find((lang: any) => lang.code === browserLang)?.code || DEFAULT_LANGUAGE;
};

// Hook for language switching component
export const useLanguageSwitcher = () => {
  const { changeLanguage, currentLanguage, getSupportedLanguages } = useTranslation();
  
  const toggleLanguage = (languageCode: string) => {
    changeLanguage(languageCode);
    // Save to localStorage
    localStorage.setItem('studio-language', languageCode);
  };

  const cycleLanguage = () => {
    const languages = getSupportedLanguages();
    const currentIndex = languages.findIndex((lang: any) => lang.code === currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    toggleLanguage(languages[nextIndex].code);
  };

  return {
    toggleLanguage,
    cycleLanguage,
    currentLanguage,
    supportedLanguages: getSupportedLanguages()
  };
};

// Hook for RTL-specific styling
export const useRTL = () => {
  const { isRTL } = useTranslation();
  
  const getRTLStyles = () => {
    return {
      direction: isRTL ? 'rtl' : 'ltr',
      textAlign: isRTL ? 'right' : 'left',
      marginLeft: isRTL ? 'auto' : undefined,
      marginRight: isRTL ? undefined : 'auto'
    };
  };

  return {
    isRTL,
    getRTLStyles
  };
};