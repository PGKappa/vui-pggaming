import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslations from '../../messages/en.json'
import itTranslations from '../../messages/it.json'

const resources = {
  en: {
    translation: enTranslations,
  },
  it: {
    translation: itTranslations,
  },
}

i18n.use(initReactI18next).init({
  resources,
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
