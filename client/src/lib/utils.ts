import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const percentFormatter = new Intl.NumberFormat("en-IN", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "always",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatBillingCyclePeriod(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return "";
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const startOptions: Intl.DateTimeFormatOptions = sameYear
    ? { day: "numeric", month: "short" }
    : { day: "numeric", month: "short", year: "numeric" };

  const endOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  const formattedStart = new Intl.DateTimeFormat("en-IN", startOptions).format(
    start,
  );
  const formattedEnd = new Intl.DateTimeFormat("en-IN", endOptions).format(end);

  return `${formattedStart} - ${formattedEnd}`;
}
