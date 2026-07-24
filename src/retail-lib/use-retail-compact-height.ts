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

function readViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight
}

/**
 * True when viewport is ≤840px — left column uses fixed layout heights.
 * Betslip still fits to the viewport (sticky); only the page/left content scrolls.
 */
export function useRetailPageScroll() {
  const [isPageScroll, setIsPageScroll] = useState(false)

  useEffect(() => {
    const update = () => {
      setIsPageScroll(readViewportHeight() <= RETAIL_VIEWPORT.PAGE_SCROLL_HEIGHT)
    }

    update()
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  return isPageScroll
}

/**
 * Live betslip column height in px: visual viewport minus navbar and bottom padding.
 * Updates on window / visualViewport resize so windowed ↔ fullscreen adapts.
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
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [])

  return height
}

/** @deprecated Prefer useBetslipViewportHeight() for accurate windowed sizing on Windows. */
export function getBetslipViewportHeight() {
  const { NAVBAR_HEIGHT, MAIN_BOTTOM_PADDING } = RETAIL_VIEWPORT
  return `calc(100dvh - ${NAVBAR_HEIGHT}px - ${MAIN_BOTTOM_PADDING}px)`
}
