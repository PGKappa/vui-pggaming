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

const PAGE_SCROLL_MQ = `(max-height: ${RETAIL_VIEWPORT.PAGE_SCROLL_HEIGHT}px)`

function readIsPageScroll() {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia(PAGE_SCROLL_MQ).matches
  }
  return window.innerHeight <= RETAIL_VIEWPORT.PAGE_SCROLL_HEIGHT
}

/**
 * True when the *viewport* height is ≤839px.
 * In that mode the betslip uses fixed 900px height (not sticky) and the page scrolls.
 * From 840px up the betslip stays sticky and fits the window.
 */
export function useRetailPageScroll() {
  const [isPageScroll, setIsPageScroll] = useState(readIsPageScroll)

  useEffect(() => {
    const mq = window.matchMedia(PAGE_SCROLL_MQ)
    const update = () => setIsPageScroll(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isPageScroll
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
