
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
