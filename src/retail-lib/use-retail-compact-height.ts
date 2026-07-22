'use client'

import { RETAIL_VIEWPORT } from '@/retail-lib/viewport-config'
import { useEffect, useState } from 'react'

type ScreenWithAvail = Screen & { availTop?: number }

/**
 * Visible content height ending exactly above the Windows taskbar (work area).
 * Uses the most conservative measure so lower resolutions stay clear of the taskbar.
 */
export function getRetailVisibleHeight(): number {
  if (typeof window === 'undefined') return 0

  const visual = window.visualViewport?.height
  const inner = window.innerHeight
  const client = document.documentElement?.clientHeight || inner
  const screen = window.screen as ScreenWithAvail
  const availTop = screen.availTop ?? 0
  const availHeight = screen.availHeight || inner
  const screenHeight = screen.height || inner
  const taskbarHeight = Math.max(0, screenHeight - availHeight)
  const availBottom = availTop + availHeight
  const outer = window.outerHeight
  const chrome = Math.max(0, outer - inner)
  const screenY = window.screenY
  const overlap = Math.max(0, Math.ceil(screenY + outer - availBottom))
  const fromWorkArea = Math.floor(availBottom - screenY - chrome)

  const candidates = [
    visual,
    inner,
    client,
    fromWorkArea,
    inner - overlap,
    client - overlap,
  ].filter(
    (n): n is number =>
      typeof n === 'number' && Number.isFinite(n) && n > 0,
  )

  // Maximized / near-fullscreen: always cap against the desktop work area.
  // At lower resolutions this is where the taskbar most often covers the footer.
  const maximizedLike =
    overlap > 0 ||
    outer >= availHeight - 16 ||
    outer >= screenHeight - 16 ||
    Math.abs(outer - availHeight) <= 16 ||
    Math.abs(outer - screenHeight) <= 16

  if (taskbarHeight > 0 && maximizedLike) {
    candidates.push(availHeight - chrome)
    if (outer >= screenHeight - 16 || overlap > 0) {
      candidates.push(inner - taskbarHeight)
      candidates.push(client - taskbarHeight)
    }
  }

  return Math.max(0, Math.round(Math.min(...candidates)))
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
