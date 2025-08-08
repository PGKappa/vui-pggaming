import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslations from '../../../../retail-messages/en.json'
import ruTranslations from '../../../../retail-messages/ru.json'
import itTranslations from '../../../../retail-messages/it.json'

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
}

// Custom detection function to read language from URL
const detectLanguageFromURL = () => {
  if (typeof window === 'undefined') return 'en'

  const urlParams = new URLSearchParams(window.location.search)
  const initCode = urlParams.get('init_code')

  if (initCode) {
    // Extract language from init_code format: TEST-USD-en-US or TEST-RUS-ru-RU
    const parts = initCode.split('-')
    if (parts.length >= 3) {
      const langPart = parts[2] // 'en' or 'ru'
      return langPart.toLowerCase()
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
