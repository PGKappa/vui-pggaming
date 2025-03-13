import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslations from '../../messages/en.json'
import itTranslations from '../../messages/it.json'
import esTranslations from '../../messages/es.json'
import frTranslations from '../../messages/fr.json'
import cnTranslations from '../../messages/cn.json'

const resources = {
  en: {
    translation: enTranslations,
  },
  it: {
    translation: itTranslations,
  },
  es: {
    translation: esTranslations,
  },
  fr: {
    translation: frTranslations,
  },
  cn: {
    translation: cnTranslations,
  },
}

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'it',
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
