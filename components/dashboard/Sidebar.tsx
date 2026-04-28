"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingBag, MessageCircle, ShoppingCart, User, Settings, Search } from "lucide-react";

import {
  dashboardNavItems,
  isActiveDashboardPath,
} from "./navigation";

type SidebarProps = {
  onNavigate?: () => void;
  isCollapsed?: boolean;
};

function NavItem({
  href,
  label,
  active,
  onNavigate,
  icon,
  isCollapsed = false,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
  icon: React.ReactNode;
  isCollapsed?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--primary)] text-white"
          : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
      }`}
      title={isCollapsed ? label : undefined}
    >
      <div className="flex h-5 w-5 items-center justify-center">{icon}</div>
      {!isCollapsed && <span>{label}</span>}
      {isCollapsed && (
        <div className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded bg-[var(--surface)] px-2 py-1 text-xs text-[var(--foreground)] shadow-lg group-hover:block">
          {label}
        </div>
      )}
    </Link>
  );
}

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="h-5 w-5" />,
  search: <Search className="h-5 w-5" />,
  package: <Package className="h-5 w-5" />,
  "shopping-bag": <ShoppingBag className="h-5 w-5" />,
  "message-circle": <MessageCircle className="h-5 w-5" />,
  "shopping-cart": <ShoppingCart className="h-5 w-5" />,
  user: <User className="h-5 w-5" />,
  settings: <Settings className="h-5 w-5" />,
};

export default function Sidebar({ onNavigate, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className={`px-4 py-6 ${isCollapsed ? "flex justify-center" : ""}`}>
        <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center" : ""}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white font-bold text-sm">
            B
          </div>
          {!isCollapsed && <span className="font-bold text-[var(--foreground)]">Borrowed</span>}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {dashboardNavItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            active={isActiveDashboardPath(pathname, item.href)}
            onNavigate={onNavigate}
            icon={iconMap[item.icon]}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      <div className="border-t border-[var(--border)] p-4">
        <div className={`text-xs text-[var(--text-secondary)] ${isCollapsed ? "text-center" : ""}`}>
          {isCollapsed ? "v1.0" : "Borrowed v1.0"}
        </div>
      </div>
    </div>
  );
}
