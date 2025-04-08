import { Locale } from 'date-fns'
import { enGB, itCH, zhCN } from 'date-fns/locale'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const languageLocalMap: { [key: string]: Locale } = {
  en: enGB,
  it: itCH,
  cn: zhCN,
}

export default function useLocale() {
  const { i18n } = useTranslation()
  const currentLocale = useMemo(() => {
    const locale = languageLocalMap[i18n.language]
    return locale ?? enGB
  }, [i18n.language])

  return currentLocale
}
