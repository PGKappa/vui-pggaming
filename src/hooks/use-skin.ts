'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

//TODO: Add actual skins
export enum SkinType {
  DEFAULT = 'default',
  DARK = 'dark',
}

export default function useSkin() {
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
    } else if (!skinParam) {
      const storedSkin = localStorage.getItem('skin')
      if (storedSkin) {
        setSkin(storedSkin as SkinType)
        updateUrlWithSkin(storedSkin)
      }
    } else {
      setSkin(SkinType.DEFAULT)
      updateUrlWithSkin(SkinType.DEFAULT)
    }
  }, [searchParams, updateUrlWithSkin])

  return [skin, setSkin]
}
