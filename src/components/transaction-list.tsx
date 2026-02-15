"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2, Search, ArrowDownCircle, ArrowUpCircle, Pencil, Check, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupiah, EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_COLORS } from "@/lib/utils";

interface Transaction {
  id: number;
  type: string;
  name: string;
  amount: number;
  category: string;
  date: string;
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fetchTransactions = () => {
    const params = new URLSearchParams();
    if (type && type !== "all") params.set("type", type);
    if (category && category !== "all") params.set("category", category);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/transactions?${params}`)
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(setTransactions)
      .catch(() => setTransactions([]));
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, type, from, to]);

  const deleteTransaction = async (id: number) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAll = async () => {
    await fetch("/api/transactions", { method: "DELETE" });
    setTransactions([]);
    setShowClearConfirm(false);
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditAmount(t.amount.toString());
    setEditCategory(t.category);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    const amount = parseInt(editAmount);
    if (!editName.trim() || isNaN(amount) || amount <= 0) return;

    const res = await fetch(`/api/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), amount, category: editCategory }),
    });

    if (res.ok) {
      const updated = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      setEditingId(null);
    }
  };

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const categories = type === "income" ? INCOME_CATEGORIES : type === "expense" ? EXPENSE_CATEGORIES : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  const getEditCategories = (txType: string) =>
    txType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all your expenses and income
          </p>
        </div>
        {transactions.length > 0 && !showClearConfirm && (
          <Button variant="destructive" size="sm" onClick={() => setShowClearConfirm(true)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
        {showClearConfirm && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm">Delete all?</span>
            <Button variant="destructive" size="sm" onClick={clearAll}>Yes</Button>
            <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>No</Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-36">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {[...new Set(categories)].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-auto"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button variant="outline" onClick={fetchTransactions}>
              <Search className="h-4 w-4 mr-1" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ArrowUpCircle className="h-4 w-4 text-green-500" /> Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ArrowDownCircle className="h-4 w-4 text-red-500" /> Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatRupiah(totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatRupiah(totalIncome - totalExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{transactions.length} Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No transactions found. Use the AI Chat to add expenses or income!
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) =>
                editingId === t.id ? (
                  <div key={t.id} className="flex flex-col gap-2 py-3 px-3 border rounded-lg bg-accent/30">
                    <div className="flex items-center gap-2">
                      {t.type === "income" ? (
                        <ArrowUpCircle className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        className="h-8"
                      />
                      <Input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="Amount"
                        className="h-8 w-32"
                      />
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <Select value={editCategory} onValueChange={setEditCategory}>
                        <SelectTrigger className="h-8 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getEditCategories(t.type).map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="default" className="h-8" onClick={() => saveEdit(t.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8" onClick={cancelEdit}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-3 px-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {t.type === "income" ? (
                        <ArrowUpCircle className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(t.date), "dd MMM yyyy, HH:mm")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0"
                        style={{
                          borderColor: CATEGORY_COLORS[t.category] || "#6b7280",
                          color: CATEGORY_COLORS[t.category] || "#6b7280",
                        }}
                      >
                        {t.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-semibold text-sm ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "income" ? "+" : "-"}{formatRupiah(t.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(t)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTransaction(t.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
