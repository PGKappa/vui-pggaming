'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

//TODO: Add actual skins
export enum SkinType {
  DEFAULT = 'default',
  DARK = 'dark',
}

export default function useSkin() {
  const [skin, setSkin] = useState<SkinType>(SkinType.DEFAULT)
  const searchParams = useSearchParams()

  useEffect(() => {
    const skinParam = searchParams.get('skin')

    if (skinParam && Object.values(SkinType).includes(skinParam as SkinType)) {
      setSkin(skinParam as SkinType)
      localStorage.setItem('skin', skinParam)
    } else if (!skinParam) {
      const storedSkin = localStorage.getItem('skin')
      if (storedSkin) {
        setSkin(storedSkin as SkinType)
        window.location.search = `?skin=${storedSkin}`
      }
    } else {
      setSkin(SkinType.DEFAULT)
      window.location.search = '?skin=default'
    }
  }, [searchParams])

  // Apply skin class to html element
  useEffect(() => {
    const root = document.documentElement

    // Remove all skin classes
    root.classList.remove(...Object.values(SkinType))

    // Add the current skin class
    root.classList.add(skin)
  }, [skin])

  return [skin, setSkin]
}
