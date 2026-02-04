import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Formatting Function for Korean Won
export const formatKRW = (value: number) => {
    return (value / 100000000).toFixed(1) + "억원";
};

// Helper for billions format in text
export const formatBillions = (value: number) => {
    return (value / 100000000).toFixed(0) + "억 원";
};
