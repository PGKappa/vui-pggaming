'use client'

import { useSearchParams } from 'next/navigation'

export function useLang(): string {
  const params = useSearchParams()
  const initCode = params.get('init_code') ?? ''
  const parts = initCode.split('-')
  const lang = parts[2]?.toLowerCase() ?? 'en'
  console.log('initCode:', initCode, '| parts:', parts, '| lang:', lang)
  return lang
}