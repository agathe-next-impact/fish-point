import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import _slugify from "slugify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return _slugify(text, { lower: true, strict: true, locale: 'fr' })
}
