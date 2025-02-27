'use client'

import { createContext, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export enum SkinType {
  DEFAULT = 'default',
  DARK = 'dark',
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
  const searchParams = useSearchParams()
  const router = useRouter()

  const updateUrlWithSkin = useCallback(
    (skinValue: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('skin', skinValue)
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router],
  )

  useEffect(() => {
    const skinParam = searchParams.get('skin')

    if (skinParam && Object.values(SkinType).includes(skinParam as SkinType)) {
      setSkin(skinParam as SkinType)
      localStorage.setItem('skin', skinParam)
    } else {
      const storedSkin = localStorage.getItem('skin') ?? SkinType.DEFAULT
      setSkin(storedSkin as SkinType)
      updateUrlWithSkin(storedSkin)
    }
  }, [searchParams, updateUrlWithSkin])

  return (
    <SkinContext.Provider value={[skin, setSkin]}>
      {children}
    </SkinContext.Provider>
  )
}
