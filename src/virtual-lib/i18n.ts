import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslations from '../../messages/en.json'
import itTranslations from '../../messages/it.json'
import esTranslations from '../../messages/es.json'
import frTranslations from '../../messages/fr.json'
import cnTranslations from '../../messages/cn.json'
import ruTranslations from '../../messages/ru.json'

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
    translation: ruTranslations,
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
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
