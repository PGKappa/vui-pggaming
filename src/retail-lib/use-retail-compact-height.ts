'use client'

import { RETAIL_VIEWPORT } from '@/retail-lib/viewport-config'
import { useEffect, useState } from 'react'

/** True when viewport height is below the scroll threshold (default 1080px). */
export function useRetailCompactHeight() {
  const [isCompactHeight, setIsCompactHeight] = useState(false)

  useEffect(() => {
    const update = () => {
      setIsCompactHeight(window.innerHeight < RETAIL_VIEWPORT.SCROLL_THRESHOLD)
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return isCompactHeight
}

/** True when the page should use a single full-page scrollbar with fixed original sizes. */
export function useRetailPageScroll() {
  const [isPageScroll, setIsPageScroll] = useState(false)

  useEffect(() => {
    const update = () => {
      const { innerWidth: width, innerHeight: height } = window
      // Below 720: always. Exactly 1280x720 (and other widths ≤1280 at 720): also enable.
      setIsPageScroll(
        height < RETAIL_VIEWPORT.BETSLIP_SCROLL_THRESHOLD ||
          (width <= RETAIL_VIEWPORT.MIN_WIDTH &&
            height <= RETAIL_VIEWPORT.BETSLIP_SCROLL_THRESHOLD),
      )
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return isPageScroll
}

/** True only at exactly 1080px — restores the original fixed layout. */
export function useRetailOriginalLayout() {
  const [isOriginalLayout, setIsOriginalLayout] = useState(false)

  useEffect(() => {
    const update = () => {
      setIsOriginalLayout(
        window.innerHeight === RETAIL_VIEWPORT.ORIGINAL_HEIGHT,
      )
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return isOriginalLayout
}

/** @deprecated Use useRetailPageScroll */
export function useRetailBetslipScroll() {
  return useRetailPageScroll()
}
