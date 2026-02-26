'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useEffect, useState } from 'react'

export enum SkinType {
  DEFAULT = 'retail-default',
  SPORTRADAR = 'sportradar',
  DP = 'dp',
  SC = 'sc',
  STANLEYBET = 'stanleybet',
}

export const SkinContext = createContext<[SkinType, (skin: SkinType) => void]>([
  SkinType.DEFAULT,
  () => {},
])

export default function SkinProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [skin, setSkin] = useState<SkinType>(SkinType.DEFAULT)
  const router = useRouter()

  const getSearchParams = useCallback(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search)
    }
    return new URLSearchParams()
  }, [])

  const updateUrlWithSkin = useCallback(
    (skinValue: string) => {
      const params = new URLSearchParams(getSearchParams().toString())
      params.set('skin', skinValue)
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [getSearchParams, router],
  )

  useEffect(() => {
    const skinParam = getSearchParams().get('skin')

    if (skinParam && Object.values(SkinType).includes(skinParam as SkinType)) {
      setSkin(skinParam as SkinType)
      localStorage.setItem('skin', skinParam)
    } else {
      const storedSkin = localStorage.getItem('skin') ?? SkinType.DEFAULT
      setSkin(storedSkin as SkinType)
      updateUrlWithSkin(storedSkin)
    }
  }, [getSearchParams, updateUrlWithSkin])

  return (
    <SkinContext.Provider value={[skin, setSkin]}>
      {children}
    </SkinContext.Provider>
  )
}
