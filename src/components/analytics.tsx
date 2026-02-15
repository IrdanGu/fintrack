"use client";

import { useEffect, useState } from "react";
import { format, subMonths, addMonths } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, CATEGORY_COLORS } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Hash,
  ArrowDownCircle,
} from "lucide-react";

interface AnalyticsData {
  month: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  expenseByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
  topExpenses: { name: string; amount: number; category: string; date: string }[];
  monthlyTrend: { month: string; income: number; expense: number }[];
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const monthStr = format(currentMonth, "yyyy-MM");
    fetch(`/api/analytics?month=${monthStr}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const nextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

  const expensePieData = data
    ? Object.entries(data.expenseByCategory).map(([name, value]) => ({ name, value }))
    : [];

  const incomePieData = data
    ? Object.entries(data.incomeByCategory).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Monthly financial summary</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : !data ? (
        <div className="text-center py-16 text-muted-foreground">Failed to load analytics</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">
                  {formatRupiah(data.totalIncome)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Expense</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600">
                  {formatRupiah(data.totalExpense)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-xl font-bold ${data.net >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatRupiah(data.net)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{data.transactionCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* 6-Month Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">6-Month Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.monthlyTrend}>
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis
                    fontSize={11}
                    tickFormatter={(v) =>
                      v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(1)}M`
                        : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
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

          {/* Category Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expense by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expense by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {expensePieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No expenses this month
                  </p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={expensePieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {expensePieData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={CATEGORY_COLORS[entry.name] || "#6b7280"}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-2">
                      {expensePieData
                        .sort((a, b) => b.value - a.value)
                        .map((c) => (
                          <div key={c.name} className="flex justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: CATEGORY_COLORS[c.name] || "#6b7280" }}
                              />
                              <span>{c.name}</span>
                            </div>
                            <span className="font-medium">{formatRupiah(c.value)}</span>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Income by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Income by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {incomePieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No income this month
                  </p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={incomePieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {incomePieData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={CATEGORY_COLORS[entry.name] || "#6b7280"}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-2">
                      {incomePieData
                        .sort((a, b) => b.value - a.value)
                        .map((c) => (
                          <div key={c.name} className="flex justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: CATEGORY_COLORS[c.name] || "#6b7280" }}
                              />
                              <span>{c.name}</span>
                            </div>
                            <span className="font-medium">{formatRupiah(c.value)}</span>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top 5 Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 5 Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No expenses this month
                </p>
              ) : (
                <div className="space-y-3">
                  {data.topExpenses.map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          {i + 1}
                        </span>
                        <ArrowDownCircle className="h-4 w-4 text-red-500 shrink-0" />
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
                      <span className="font-semibold text-red-600">{formatRupiah(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
