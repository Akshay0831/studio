import React, { useState } from 'react';
import { useTranslation, useLanguageSwitcher, useRTL } from '../i18n/hooks/useTranslation';
import { ChevronDown, ChevronRight, Globe } from 'lucide-react';
import { Button } from './ui/Button';

interface LanguageSwitcherProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '', 
  showLabel = true, 
  compact = false 
}) => {
  const { currentLanguage, getSupportedLanguages } = useTranslation();
  const supportedLanguages = getSupportedLanguages();
  const { toggleLanguage } = useLanguageSwitcher();
  const { isRTL } = useRTL();
  const [isOpen, setIsOpen] = useState(false);

  const currentLangInfo = supportedLanguages.find((lang: any) => lang.code === currentLanguage) || supportedLanguages[0];

  const handleLanguageChange = (languageCode: string) => {
    toggleLanguage(languageCode);
    setIsOpen(false);
  };

  const getLanguageFlag = (languageCode: string): string => {
    const flagMap: Record<string, string> = {
      en: '🇺🇸',
      es: '🇪🇸',
      fr: '🇫🇷',
      de: '🇩🇪',
      pt: '🇵🇹',
      zh: '🇨🇳',
      ja: '🇯🇵',
      ko: '🇰🇷',
      ru: '🇷🇺',
      ar: '🇸🇦',
      hi: '🇮🇳'
    };
    return flagMap[languageCode] || '🌐';
  };

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <span className="text-lg">{getLanguageFlag(currentLanguage)}</span>
          <span className="text-sm font-medium">
            {currentLangInfo.code.toUpperCase()}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
        
        {isOpen && (
          <div className={`absolute z-50 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg ${
            isRTL ? 'right-0' : 'left-0'
          }`}>
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 ${
                  currentLanguage === lang.code ? 'bg-gray-100 font-medium' : ''
                }`}
              >
                <span className="text-lg">{getLanguageFlag(lang.code)}</span>
                <div className="flex-1">
                  <div className="font-medium">{lang.name}</div>
                  <div className="text-sm text-gray-500">{lang.nativeName}</div>
                </div>
                {currentLanguage === lang.code && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Globe className="h-4 w-4" />
        {showLabel && <span>Language</span>}
        <span className="text-sm font-medium">
          {currentLangInfo.nativeName}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      
      {isOpen && (
        <div className={`absolute z-50 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg ${
          isRTL ? 'right-0' : 'left-0'
        }`}>
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-medium text-sm text-gray-700">Choose Language</h3>
            <p className="text-xs text-gray-500">Select your preferred language</p>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {supportedLanguages.map((lang: any) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 ${
                  currentLanguage === lang.code ? 'bg-gray-100 font-medium' : ''
                }`}
              >
                <span className="text-2xl">{getLanguageFlag(lang.code)}</span>
                <div className="flex-1">
                  <div className="font-medium">{lang.name}</div>
                  <div className="text-sm text-gray-500">{lang.nativeName}</div>
                  {lang.rtl && (
                    <div className="text-xs text-blue-600">RTL Layout</div>
                  )}
                </div>
                {currentLanguage === lang.code && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;