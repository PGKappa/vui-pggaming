'use client'

import { RETAIL_VIEWPORT } from '@/retail-lib/viewport-config'
import { useEffect, useState } from 'react'

/** True when the display/window is the 900px height that needs the taskbar fix. */
function isTaskbarFixHeight(innerHeight: number, screenHeight: number) {
  return (
    screenHeight === RETAIL_VIEWPORT.TASKBAR_FIX_HEIGHT ||
    Math.round(innerHeight) === RETAIL_VIEWPORT.TASKBAR_FIX_HEIGHT
  )
}

/**
 * Visible app height. At 900px only, caps to the desktop work area so content
 * ends above the Windows taskbar when the window is maximized.
 */
export function getRetailAppHeight(): number {
  if (typeof window === 'undefined') return 0

  const visual = window.visualViewport?.height
  const inner = window.innerHeight
  const height = visual && visual > 0 ? visual : inner
  const screenHeight = window.screen?.height ?? 0
  const availHeight = window.screen?.availHeight ?? 0

  if (
    isTaskbarFixHeight(inner, screenHeight) &&
    availHeight > 0 &&
    availHeight < (screenHeight || inner)
  ) {
    const chrome = Math.max(0, window.outerHeight - window.innerHeight)
    const fromWorkArea = Math.max(0, availHeight - chrome)
    return Math.max(0, Math.round(Math.min(height, fromWorkArea)))
  }

  return Math.max(0, Math.round(height))
}

/**
 * Locks the app height to the visible window (window.innerHeight).
 * At 900px, also respects the Windows work area so maximized windows stay
 * above the taskbar.
 */
export function useRetailAppHeight() {
  useEffect(() => {
    const root = document.documentElement

    const update = () => {
      root.style.setProperty(
        '--retail-app-height',
        `${getRetailAppHeight()}px`,
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
}

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

/** True at exactly 900px — needs taskbar-safe layout for special markets. */
export function useRetailTaskbarFixHeight() {
  const [isTaskbarFix, setIsTaskbarFix] = useState(false)

  useEffect(() => {
    const update = () => {
      const screenHeight = window.screen?.height ?? 0
      setIsTaskbarFix(isTaskbarFixHeight(window.innerHeight, screenHeight))
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return isTaskbarFix
}

/** @deprecated Use useRetailPageScroll */
export function useRetailBetslipScroll() {
  return useRetailPageScroll()
}
