import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const EXPENSE_CATEGORIES = [
  "Food & Drink",
  "Transport",
  "Lifestyle",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health",
  "Education",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Bonus",
  "Other",
] as const;

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  // Expense categories
  "Food & Drink": "#f97316",
  Transport: "#3b82f6",
  Lifestyle: "#a855f7",
  Shopping: "#ec4899",
  "Bills & Utilities": "#eab308",
  Entertainment: "#14b8a6",
  Health: "#ef4444",
  Education: "#6366f1",
  Other: "#6b7280",
  // Income categories
  Salary: "#22c55e",
  Freelance: "#10b981",
  Business: "#059669",
  Investment: "#0d9488",
  Gift: "#f59e0b",
  Bonus: "#84cc16",
};
