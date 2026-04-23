
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.curevan.com";
const FALLBACK_IMAGE = "https://placehold.co/600x400?text=Curevan+Journal";

/**
 * Robustly formats a media URL, prepending the base URL if necessary and providing a fallback.
 */
export function getMediaUrl(url?: any, fallback = FALLBACK_IMAGE): string {
    if (!url || typeof url !== 'string') return fallback;
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }
    // Remove leading slash if present to avoid double slashes
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${MEDIA_BASE_URL}/${cleanUrl}`;
}

export const getSafeDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) {
        if (!isNaN(date.getTime())) return date;
        return null;
    }
    if (typeof date === 'string') {
        const d = new Date(date);
        if (!isNaN(d.getTime())) return d;
        return null;
    }
    if (typeof date === 'object' && date._seconds) {
        return new Date(date._seconds * 1000);
    }
    return null;
}

/**
 * Escapes a value for CSV format.
 * If the value contains a comma, double quote, or newline, it wraps it in double quotes.
 * Existing double quotes are escaped by doubling them.
 * @param value - The value to escape.
 * @returns The escaped string.
 */
function escapeCsvValue(value: any): string {
    const str = String(value == null ? '' : value); // Handle null/undefined
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Converts an array of headers and an array of data rows into a CSV string,
 * then triggers a browser download.
 * @param headers - An array of strings for the CSV header row.
 * @param data - An array of arrays, where each inner array is a row.
 * @param filename - The name of the file to be downloaded.
 */
export function downloadCsv(headers: string[], data: any[][], filename: string) {
    const csvRows = [
        headers.map(escapeCsvValue).join(','),
        ...data.map(row => row.map(escapeCsvValue).join(','))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Retrieves a cookie value by name client-side.
 * @param name - The name of the cookie.
 * @returns The cookie value or null if not found.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}
