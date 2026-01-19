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

    // Listen for inactivity message from parent
    const handleInactivityMessage = (event: MessageEvent) => {
      // Verifica che il messaggio sia quello di inattività
      // Può essere una stringa o un oggetto con proprietà type
      const isInactivityMessage =
        event.data === 'cashier-inactive' ||
        event.data === 'inactivity-timeout' ||
        event.data === 'session-expired' ||
        (typeof event.data === 'object' &&
          (event.data.type === 'cashier-inactive' ||
            event.data.type === 'inactivity-timeout' ||
            event.data.type === 'session-expired'))

      if (isInactivityMessage) {
        console.log(
          'Inactivity message received from parent, clearing localStorage and reloading...',
        )

        try {
          // Pulisce completamente il localStorage
          localStorage.clear()
          console.log('localStorage cleared')
        } catch (error) {
          console.error('Error clearing localStorage:', error)
        }

        // Ricarica la pagina per resettare lo stato
        window.location.reload()
      }
    }

    window.addEventListener('message', handleInactivityMessage)

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      window.removeEventListener('message', handleInactivityMessage)
    }
  }, [])

  return null
}
