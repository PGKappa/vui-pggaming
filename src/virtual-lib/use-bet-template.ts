'use client'

import { resolveBetTemplate } from '@/retail-lib/bet-templates'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

/**
 * Template della betslip (standard | noIncrement), scelto come sul retail
 * con il parametro `?bet=` nell'URL. Senza parametro o con un valore
 * sconosciuto si usa `standard`.
 */
export function useBetTemplate() {
  const param = useSearchParams().get('bet')
  return useMemo(() => resolveBetTemplate(param), [param])
}
