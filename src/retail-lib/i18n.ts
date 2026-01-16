import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslations from '../../retail-messages/en.json'
import esTranslations from '../../retail-messages/es.json'
import itTranslations from '../../retail-messages/it.json'
import ruTranslations from '../../retail-messages/ru.json'

const resources = {
  en: {
    translation: enTranslations,
  },
  es: {
    translation: esTranslations,
  },
  it: {
    translation: itTranslations,
  },
  ru: {
    translation: ruTranslations,
  },
}

// Prova a recuperare la lingua dal localStorage o usa 'es' come default
const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'en'

  try {
    // Nuova chiave semplice e dedicata
    const storedLang = localStorage.getItem('i18n.lang')
    if (storedLang) return storedLang

    const cached = localStorage.getItem('rootContext')
    if (cached) {
      const data = JSON.parse(cached)
      if (data.userData?.lang) {
        return data.userData.lang
      }
    }
  } catch {
    // Ignora errori di parsing
  }
  return 'en' // Default a inglese
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

export default i18n
