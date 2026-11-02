'use client'

import {
  BET_TEMPLATES,
  BetTemplate,
  BetTemplateId,
  DEFAULT_BET_TEMPLATE_ID,
  resolveBetTemplate,
} from '@/retail-lib/bet-templates'
import { createContext, useContext, useEffect, useState } from 'react'

type BetTemplateValue = { id: BetTemplateId; template: BetTemplate }

const STANDARD: BetTemplateValue = {
  id: DEFAULT_BET_TEMPLATE_ID as BetTemplateId,
  template: BET_TEMPLATES[DEFAULT_BET_TEMPLATE_ID as BetTemplateId],
}

export const BetTemplateContext = createContext<BetTemplateValue>(STANDARD)

export default function BetTemplateProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [value, setValue] = useState<BetTemplateValue>(STANDARD)

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('bet')
    setValue(resolveBetTemplate(param))
  }, [])

  return (
    <BetTemplateContext.Provider value={value}>
      {children}
    </BetTemplateContext.Provider>
  )
}

export function useBetTemplate(): BetTemplateValue {
  return useContext(BetTemplateContext)
}
