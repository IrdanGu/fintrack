"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRupiah, CATEGORY_COLORS } from "@/lib/utils";

interface TransactionItem {
  name: string;
  amount: number;
  category: string;
}

interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => setMessages(data))
      .catch(() => setMessages([]));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: userMsg, createdAt: new Date().toISOString() },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: JSON.stringify(data),
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: JSON.stringify({ expenses: [], income: [], message: "Failed to send message. Please try again." }),
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    await fetch("/api/chat", { method: "DELETE" });
    setMessages([]);
  };

  const renderAssistant = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      const expenses: TransactionItem[] = parsed.expenses || [];
      const income: TransactionItem[] = parsed.income || [];
      const msg: string = parsed.message || "";

      const hasItems = expenses.length > 0 || income.length > 0;

      return (
        <div className="space-y-2">
          {msg && <p className="text-sm">{msg}</p>}
          {hasItems && (
            <div className="space-y-1.5">
              {expenses.map((e, i) => (
                <div
                  key={`exp-${i}`}
                  className="flex items-center justify-between bg-background/50 rounded-md px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span className="font-medium">{e.name}</span>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: CATEGORY_COLORS[e.category] || "#6b7280",
                        color: CATEGORY_COLORS[e.category] || "#6b7280",
                      }}
                    >
                      {e.category}
                    </Badge>
                  </div>
                  <span className="font-semibold text-red-600">-{formatRupiah(e.amount)}</span>
                </div>
              ))}
              {income.map((e, i) => (
                <div
                  key={`inc-${i}`}
                  className="flex items-center justify-between bg-background/50 rounded-md px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span className="font-medium">{e.name}</span>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: CATEGORY_COLORS[e.category] || "#6b7280",
                        color: CATEGORY_COLORS[e.category] || "#6b7280",
                      }}
                    >
                      {e.category}
                    </Badge>
                  </div>
                  <span className="font-semibold text-green-600">+{formatRupiah(e.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-1 border-t">
                {expenses.length > 0 && (
                  <span className="text-red-600">
                    Expenses: -{formatRupiah(expenses.reduce((sum, e) => sum + e.amount, 0))}
                  </span>
                )}
                {income.length > 0 && (
                  <span className="text-green-600">
                    Income: +{formatRupiah(income.reduce((sum, e) => sum + e.amount, 0))}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    } catch {
      return <p className="text-sm">{content}</p>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">AI Chat</h1>
          <p className="text-sm text-muted-foreground">
            Type your expenses or income naturally, e.g. &quot;kopi 50rb, gaji 5jt&quot;
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">
                  Start by typing your transactions, e.g. &quot;gaji 5jt&quot; or &quot;makan siang 25rb, grab 15rb&quot;
                </p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-[80%] px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.role === "assistant" ? renderAssistant(msg.content) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </Card>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <Card className="bg-muted px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </Card>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="flex gap-2 pt-4 border-t">
        <Input
          placeholder="Type your transactions... (e.g. kopi 50rb, gaji 5jt)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
