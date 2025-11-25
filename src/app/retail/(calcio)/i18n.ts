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
