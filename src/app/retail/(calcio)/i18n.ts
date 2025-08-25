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

  console.log('🔍 Detecting language from URL:', initCode)

  if (initCode) {
    const parts = initCode.split('-')
    console.log('📝 Init code parts:', parts)

    if (parts.length >= 4) {
      const langPart = parts[2].toLowerCase() // 'en'
      console.log('🌍 Extracted language:', langPart)
      return langPart
    } else if (parts.length >= 3) {
      // Per formato TEST-RUS-ru-RU: parts[2] = 'ru'
      const langPart = parts[2].toLowerCase()
      console.log('🌍 Extracted language (fallback):', langPart)
      return langPart
    }
  }

  console.log('⚠️ No language found, defaulting to en')
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
