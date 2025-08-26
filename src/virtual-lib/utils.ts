import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL

export function getTimeDistanceFromNow(targetTime: Date) {
  const diff = targetTime.getTime() - Date.now()

  if (diff < 0) {
    return '00:00'
  }

  const minutes = Math.floor(diff / 1000 / 60).toString().padStart(2, '0')
  const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0')

  return `${minutes}:${seconds}`
}