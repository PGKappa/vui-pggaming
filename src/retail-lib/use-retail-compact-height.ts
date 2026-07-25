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

/**
 * Previously true when viewport height ≤839px (full-height betslip + page scroll).
 * Always false now — betslip stays sticky at all heights.
 */
export function useRetailPageScroll() {
  return false
}

function readViewportHeight() {
  return window.innerHeight
}

/**
 * Live betslip column height in px: window height minus navbar and bottom padding.
 * Only used when sticky (viewport ≥840).
 */
export function useBetslipViewportHeight() {
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const update = () => {
      const vh = readViewportHeight()
      setHeight(
        Math.max(
          0,
          Math.floor(
            vh -
              RETAIL_VIEWPORT.NAVBAR_HEIGHT -
              RETAIL_VIEWPORT.MAIN_BOTTOM_PADDING,
          ),
        ),
      )
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return height
}

/** @deprecated Prefer useBetslipViewportHeight() for accurate windowed sizing on Windows. */
export function getBetslipViewportHeight() {
  const { NAVBAR_HEIGHT, MAIN_BOTTOM_PADDING } = RETAIL_VIEWPORT
  return `calc(100dvh - ${NAVBAR_HEIGHT}px - ${MAIN_BOTTOM_PADDING}px)`
}
