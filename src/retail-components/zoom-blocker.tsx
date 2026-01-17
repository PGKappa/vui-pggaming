'use client'

import { useEffect } from 'react'

export default function ZoomBlocker() {
  useEffect(() => {
    // Block Ctrl/Cmd + scroll zoom
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
      }
    }

    // Block Ctrl/Cmd + +/- keys and Ctrl/Cmd + 0
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')
      ) {
        e.preventDefault()
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

    // Add event listeners with { passive: false } to allow preventDefault
    document.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('wheel', handleWheel)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return null
}
