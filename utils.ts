import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple seeded random for daily challenges
export function getDailyWord(category: string, list: string[]): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  // Use day of year + category hash as seed
  const catHash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = dayOfYear + catHash;
  const index = seed % list.length;
  
  return list[index];
}
