import { useTranslation } from "react-i18next"

export default function useLanguage() {
  const { i18n } = useTranslation()
  return i18n.language || 'en'
}