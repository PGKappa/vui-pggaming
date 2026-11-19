import { useNow } from '@/virtual-lib/use-clock'

// Conto alla rovescia MM:SS verso targetDate, sull'orologio condiviso
export default function useTimeLeft(targetDate: Date | string): string {
  const now = useNow()

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

  const difference = target.getTime() - now

  if (difference <= 0) return '00:00'

  const totalSeconds = Math.floor(difference / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
