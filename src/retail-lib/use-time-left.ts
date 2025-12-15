import { useEffect, useState } from 'react'

export default function useTimeLeft(targetTime: Date | string): string {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Se targetTime è già un Date object valido, usalo direttamente
      let target: Date
      if (targetTime instanceof Date && !isNaN(targetTime.getTime())) {
        target = targetTime
      } else {
        // Altrimenti convertilo da stringa
        // Trim spazi bianchi e NON forzare UTC
        const timeStr = (
          typeof targetTime === 'string' ? targetTime : ''
        ).trim()
        target = new Date(timeStr)
      }

      // Controlla se la data è valida
      if (isNaN(target.getTime())) {
        console.error('Invalid date passed to useTimeLeft:', targetTime)
        return '00:00'
      }

      const now = new Date()
      const difference = target.getTime() - now.getTime()

      if (difference > 0) {
        const totalSeconds = Math.floor(difference / 1000)
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60

        const minutesStr = minutes.toString().padStart(2, '0')
        const secondsStr = seconds.toString().padStart(2, '0')

        return `${minutesStr}:${secondsStr}`
      } else {
        return '00:00'
      }
    }

    setTimeLeft(calculateTimeLeft())

    // Aggiorna ogni secondo per vedere i secondi cambiare
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetTime])

  return timeLeft
}
