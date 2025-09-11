import { useEffect, useState } from 'react'

export default function useTimeLeft(
  targetTime: Date | string,
  discipline?: string,
): string {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target =
        targetTime instanceof Date ? targetTime : new Date(targetTime)

      if (discipline === 'SOCCER') {
        return '05:00'
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

    if (discipline === 'SOCCER') {
      return
    }

    // Aggiorna ogni secondo per vedere i secondi cambiare
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetTime, discipline])

  return timeLeft
}
