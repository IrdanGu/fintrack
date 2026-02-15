import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get("month"); // format: "2026-02"

    const now = new Date();
    const selectedDate = monthParam ? new Date(monthParam + "-01") : now;
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    // Current month transactions
    const monthTransactions = await prisma.transaction.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      orderBy: { amount: "desc" },
    });

    const totalIncome = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    // Category breakdown (expenses)
    const expenseByCategory: Record<string, number> = {};
    monthTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });

    // Category breakdown (income)
    const incomeByCategory: Record<string, number> = {};
    monthTransactions
      .filter((t) => t.type === "income")
      .forEach((t) => {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      });

    // Top 5 expenses
    const topExpenses = monthTransactions
      .filter((t) => t.type === "expense")
      .slice(0, 5)
      .map((t) => ({ name: t.name, amount: t.amount, category: t.category, date: t.date }));

    // Last 6 months trend
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(selectedDate, i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);

      const mTransactions = await prisma.transaction.findMany({
        where: { date: { gte: mStart, lte: mEnd } },
      });

      monthlyTrend.push({
        month: format(m, "MMM yyyy"),
        income: mTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expense: mTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }

    return NextResponse.json({
      month: format(selectedDate, "MMMM yyyy"),
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      transactionCount: monthTransactions.length,
      expenseByCategory,
      incomeByCategory,
      topExpenses,
      monthlyTrend,
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
