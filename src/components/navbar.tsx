"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, MessageSquare, Receipt, BarChart3, Wallet, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mr-8 font-bold text-lg">
          <Wallet className="h-5 w-5 text-primary" />
          <span>FinTrack</span>
        </Link>
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Logout</span>
        </Button>
      </div>
    </header>
  );
}
