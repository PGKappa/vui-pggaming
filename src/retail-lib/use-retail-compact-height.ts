'use client'

import { RETAIL_VIEWPORT } from '@/retail-lib/viewport-config'
import { useEffect, useState } from 'react'

/**
 * Visible content height ending exactly above the Windows taskbar (work area).
 * When a maximized browser window overlaps the taskbar, innerHeight alone is too tall.
 */
export function getRetailVisibleHeight(): number {
  if (typeof window === 'undefined') return 0

  const inner = window.visualViewport?.height ?? window.innerHeight
  const availTop = window.screen?.availTop ?? 0
  const availHeight = window.screen?.availHeight ?? inner
  const availBottom = availTop + availHeight
  const chrome = Math.max(0, window.outerHeight - window.innerHeight)
  const windowBottom = window.screenY + window.outerHeight
  const taskbarOverlap = Math.max(0, Math.ceil(windowBottom - availBottom))
  // Hard cap: content must fit between window chrome and the desktop work area
  const maxFromWorkArea = Math.floor(availBottom - window.screenY - chrome)

  return Math.max(
    0,
    Math.round(Math.min(inner - taskbarOverlap, maxFromWorkArea, inner)),
  )
}

/**
 * Locks the app height to the desktop work area so content ends above the Windows taskbar.
 */
export function useRetailAppHeight() {
  useEffect(() => {
    const root = document.documentElement

    const update = () => {
      root.style.setProperty(
        '--retail-app-height',
        `${getRetailVisibleHeight()}px`,
      )
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
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
      setIsCompactHeight(
        getRetailVisibleHeight() < RETAIL_VIEWPORT.SCROLL_THRESHOLD,
      )
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
      const width = window.innerWidth
      const height = getRetailVisibleHeight()
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
        getRetailVisibleHeight() === RETAIL_VIEWPORT.ORIGINAL_HEIGHT,
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
