'use client'

import { useEffect } from 'react'

export default function ZoomBlocker() {
  useEffect(() => {
    // Block Ctrl/Cmd + scroll zoom (incluso Firefox con deltaMode)
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      // Firefox specific: previeni zoom anche quando deltaMode indica zoom
      if (e.deltaMode === 1 || Math.abs(e.deltaY) > 100) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      }
    }

    // Block Ctrl/Cmd + +/- keys and Ctrl/Cmd + 0
    const handleKeyDown = (e: KeyboardEvent) => {
      // Blocca tutte le combinazioni di zoom
      if (e.ctrlKey || e.metaKey) {
        if (
          e.key === '+' ||
          e.key === '-' ||
          e.key === '0' ||
          e.key === '=' ||
          e.key === 'Add' || // numpad +
          e.key === 'Subtract' || // numpad -
          e.key === 'NumpadAdd' ||
          e.key === 'NumpadSubtract' ||
          e.key === 'Minus' ||
          e.key === 'Equal' ||
          e.key === 'Plus'
        ) {
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      }
    }

    // Block pinch zoom on touch devices
    let lastDistance = 0
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY,
        )

        if (lastDistance > 0) {
          // Pinch detected, prevent default
          if (Math.abs(distance - lastDistance) > 5) {
            e.preventDefault()
          }
        }
        lastDistance = distance
      }
    }

    const handleTouchEnd = () => {
      lastDistance = 0
    }

    // Firefox: blocca anche il doppio tap per zoom
    let lastTapTime = 0
    const handleTouchStart = (e: TouchEvent) => {
      const now = Date.now()
      if (now - lastTapTime < 300) {
        // Double tap detected
        e.preventDefault()
      }
      lastTapTime = now
    }

    // Blocca gesturestart/gesturechange per Safari e alcuni browser
    const handleGesture = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }

    // Add event listeners with { passive: false } to allow preventDefault
    document.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    })
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('gesturestart', handleGesture, {
      passive: false,
    } as any)
    document.addEventListener('gesturechange', handleGesture, {
      passive: false,
    } as any)
    document.addEventListener('gestureend', handleGesture, {
      passive: false,
    } as any)

    return () => {
      document.removeEventListener('wheel', handleWheel)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('gesturestart', handleGesture)
      document.removeEventListener('gesturechange', handleGesture)
      document.removeEventListener('gestureend', handleGesture)
    }
  }, [])

  return null
}
