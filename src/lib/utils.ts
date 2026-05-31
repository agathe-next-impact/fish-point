import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import _slugify from "slugify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return _slugify(text, { lower: true, strict: true, locale: 'fr' })
}

export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: Date | string | number): string {
  const timestamp = new Date(date).getTime()
  const diffInSeconds = Math.round((timestamp - Date.now()) / 1000)
  const absDiff = Math.abs(diffInSeconds)

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ]

  const formatter = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })
  for (const [unit, secondsInUnit] of units) {
    if (absDiff >= secondsInUnit) {
      return formatter.format(Math.round(diffInSeconds / secondsInUnit), unit)
    }
  }

  return formatter.format(diffInSeconds, 'second')
}

export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
