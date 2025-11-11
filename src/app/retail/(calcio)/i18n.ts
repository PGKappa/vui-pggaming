import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslations from '../../../../retail-messages/en.json'
import ruTranslations from '../../../../retail-messages/ru.json'
import itTranslations from '../../../../retail-messages/it.json'
import esTranslations from '../../../../retail-messages/es.json'

const resources = {
  en: {
    translation: enTranslations,
  },
  ru: {
    translation: ruTranslations,
  },
  it: {
    translation: itTranslations,
  },
  es: {
    translation: esTranslations,
  },
}

// Custom detection function to read language from URL
const detectLanguageFromURL = () => {
  if (typeof window === 'undefined') return 'en'

  const urlParams = new URLSearchParams(window.location.search)
  const initCode = urlParams.get('init_code')

  if (initCode) {
    const parts = initCode.split('-')

    if (parts.length >= 4) {
      const langPart = parts[2].toLowerCase() // 'en'
      return langPart
    } else if (parts.length >= 3) {
      // Per formato TEST-RUS-ru-RU: parts[2] = 'ru'
      const langPart = parts[2].toLowerCase()
      return langPart
    }
  }

  return 'en'
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguageFromURL(),
  fallbackLng: 'en',
  debug: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
  },
})

export default i18n
