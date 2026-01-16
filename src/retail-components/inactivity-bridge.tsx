'use client'

import { useEffect } from 'react'

export default function InactivityBridge() {
  useEffect(() => {
    const handleActivity = () => {
      // Send message to parent window
      if (window.parent && window.parent !== window) {
        window.parent.postMessage('user-activity', '*')
      }
    }

    // Listen for user activity events
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll']

    events.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    // Initial activity on component mount
    handleActivity()

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [])

  return null
}
