import { useState, useEffect } from "react"
import { getTimeDistanceFromNow } from "./utils"

export default function useTimeLeft(date: Date): string {
  const [timeLeft, setTimeLeft] = useState<string>('00:00')

  useEffect(() => {
    const interval = setInterval(() => {
      const timeDistance = getTimeDistanceFromNow(date)
      setTimeLeft(timeDistance)
    }, 1000)

    return () => clearInterval(interval)
  }, [date])

  return timeLeft
}