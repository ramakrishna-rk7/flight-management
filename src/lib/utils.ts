import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDuration(departs: string, arrives: string): string {
  const diff = new Date(arrives).getTime() - new Date(departs).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function canCancel(departsAt: string): boolean {
  const now = new Date();
  const departs = new Date(departsAt);
  const diffHours = (departs.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours >= 2;
}
