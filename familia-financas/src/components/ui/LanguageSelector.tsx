// Componente Seletor de Idioma
import { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹' }
];

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:text-primary-500 transition-colors rounded-base border border-neutral-200 hover:border-primary-200"
        aria-label="Selecionar idioma"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">
          {currentLanguage?.flag} {currentLanguage?.name}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-base shadow-lg border border-neutral-200 z-50">
          <div className="py-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-primary-50 transition-colors flex items-center gap-3 ${
                  language === lang.code 
                    ? 'text-primary-600 bg-primary-50 font-medium' 
                    : 'text-neutral-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
                {language === lang.code && (
                  <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}