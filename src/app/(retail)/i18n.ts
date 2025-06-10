import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslations from '../../../retail-messages/en.json'
import itTranslations from '../../../retail-messages/it.json'
import esTranslations from '../../../retail-messages/es.json'
import frTranslations from '../../../retail-messages/fr.json'
import cnTranslations from '../../../retail-messages/cn.json'
import ruTransaltions from '../../../retail-messages/ru.json'

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
  ru: {
    translation: ruTransaltions,
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
