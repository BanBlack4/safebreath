import React, { createContext, useContext, useState, useEffect } from 'react';

// Basic simple translation dictionary
const translations = {
  es: {
    'app.title': 'SafeBreath',
    'nav.dashboard': 'Inicio',
    'nav.vitals': 'Vitales',
    'nav.history': 'Historial',
    'nav.profile': 'Perfil',
    'dashboard.welcome': 'Hola, {name}',
    'profile.title': 'Perfil de Salud',
    'profile.subtitle': 'Personaliza tu experiencia para una detección más precisa.',
    // other keys...
  },
  en: {
    'app.title': 'SafeBreath',
    'nav.dashboard': 'Home',
    'nav.vitals': 'Vitals',
    'nav.history': 'History',
    'nav.profile': 'Profile',
    'dashboard.welcome': 'Hi, {name}',
    'profile.title': 'Health Profile',
    'profile.subtitle': 'Customize your experience for accurate detection.',
  }
};

type Language = 'es' | 'en';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
});

export const useTranslation = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('safebreath_lang') as Language) || 'es';
  });

  useEffect(() => {
    localStorage.setItem('safebreath_lang', lang);
  }, [lang]);

  const t = (key: string, params?: Record<string, string>) => {
    let text = (translations[lang] as any)[key] || (translations['es'] as any)[key] || key;
    if (params) {
      Object.keys(params).forEach(k => {
        text = text.replace(`{${k}}`, params[k]);
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};
