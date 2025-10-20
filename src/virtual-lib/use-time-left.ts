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
