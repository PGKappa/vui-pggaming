import { useEffect, useState } from 'react'

export default function useTimeLeft(targetDate: Date | string): string {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()

      let target: Date
      if (typeof targetDate === 'string') {
        target = new Date(targetDate)
      } else if (targetDate instanceof Date) {
        target = targetDate
      } else {
        return ''
      }

      if (isNaN(target.getTime())) {
        return 'Invalid Date'
      }

      const difference = target.getTime() - now.getTime()

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((difference / 1000 / 60) % 60)
        const seconds = Math.floor((difference / 1000) % 60)

        if (days > 0) {
          return `${days}d ${hours}h`
        } else if (hours > 0) {
          return `${hours}h ${minutes}m`
        } else if (minutes > 0) {
          return `${minutes}m ${seconds}s`
        } else {
          return `${seconds}s`
        }
      } else {
        return '00:00'
      }
    }

    const updateTimeLeft = () => {
      setTimeLeft(calculateTimeLeft())
    }

    // Aggiorna immediatamente
    updateTimeLeft()

    // Aggiorna ogni secondo
    const intervalId = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(intervalId)
  }, [targetDate])

  return timeLeft
}
