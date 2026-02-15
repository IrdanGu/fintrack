"use client";

import { useEffect, useState, useCallback } from "react";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  format,
  subDays,
} from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, CATEGORY_COLORS } from "@/lib/utils";
import { TrendingDown, TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface Transaction {
  id: number;
  type: string;
  name: string;
  amount: number;
  category: string;
  date: string;
}

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(setTransactions)
      .catch(() => setTransactions([]));
  }, []);

  const now = new Date();

  const calcTotal = useCallback(
    (from: Date, type: string) =>
      transactions
        .filter((t) => t.type === type && new Date(t.date) >= from)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const todayExpense = calcTotal(startOfDay(now), "expense");
  const todayIncome = calcTotal(startOfDay(now), "income");
  const monthExpense = calcTotal(startOfMonth(now), "expense");
  const monthIncome = calcTotal(startOfMonth(now), "income");
  const weekExpense = calcTotal(startOfWeek(now, { weekStartsOn: 1 }), "expense");
  const weekIncome = calcTotal(startOfWeek(now, { weekStartsOn: 1 }), "income");

  // Category breakdown pie chart (expenses this month)
  const monthStart = startOfMonth(now);
  const monthExpenses = transactions.filter(
    (t) => t.type === "expense" && new Date(t.date) >= monthStart
  );
  const categoryData = Object.entries(
    monthExpenses.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Daily bar chart (last 7 days) — income vs expense
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(now, 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const inRange = (t: Transaction) => {
      const d = new Date(t.date);
      return d >= dayStart && d <= dayEnd;
    };
    return {
      day: format(date, "EEE"),
      expense: transactions.filter((t) => t.type === "expense" && inRange(t)).reduce((s, t) => s + t.amount, 0),
      income: transactions.filter((t) => t.type === "income" && inRange(t)).reduce((s, t) => s + t.amount, 0),
    };
  });

  const recent = transactions.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your finances
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${todayIncome - todayExpense >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatRupiah(todayIncome - todayExpense)}
            </div>
            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
              <span className="text-green-600">+{formatRupiah(todayIncome)}</span>
              <span className="text-red-600">-{formatRupiah(todayExpense)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${weekIncome - weekExpense >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatRupiah(weekIncome - weekExpense)}
            </div>
            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
              <span className="text-green-600">+{formatRupiah(weekIncome)}</span>
              <span className="text-red-600">-{formatRupiah(weekExpense)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Income (Month)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(monthIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expenses (Month)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatRupiah(monthExpense)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No expenses this month
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={CATEGORY_COLORS[entry.name] || "#6b7280"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <XAxis dataKey="day" fontSize={12} />
                <YAxis
                  fontSize={12}
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `${(v / 1000000).toFixed(1)}M`
                      : v >= 1000
                      ? `${(v / 1000).toFixed(0)}K`
                      : v.toString()
                  }
                />
                <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No transactions yet. Use the AI Chat to add your first transaction!
            </p>
          ) : (
            <div className="space-y-2">
              {recent.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {t.type === "income" ? (
                      <ArrowUpCircle className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(t.date), "dd MMM yyyy")}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: CATEGORY_COLORS[t.category] || "#6b7280",
                        color: CATEGORY_COLORS[t.category] || "#6b7280",
                      }}
                    >
                      {t.category}
                    </Badge>
                  </div>
                  <span className={`font-semibold text-sm ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "-"}{formatRupiah(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
