"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Package, Clock, MessageCircle, ShoppingCart,
  User, Settings, Search, GraduationCap, Star, Inbox, ClipboardList,
} from "lucide-react";
import { useSession } from "next-auth/react";

import {
  dashboardNavItems,
  isActiveDashboardPath,
  getBadgeCount,
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
  badge,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
  icon: React.ReactNode;
  isCollapsed?: boolean;
  badge?: string;
}) {
  const badgeCount = badge ? getBadgeCount(badge) : null;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group relative z-10 flex h-11 items-center gap-2.5 rounded-[0.65rem] text-sm font-semibold transition-colors duration-200 ${
        isCollapsed ? "justify-center px-0" : "px-[0.85rem]"
      } ${
        active
          ? "text-white"
          : "text-white/50 hover:text-white/85"
      }`}
      title={isCollapsed ? label : undefined}
    >
      {active && <span className="absolute inset-0 -z-10 rounded-[0.65rem] bg-[#3b2a80]" />}
      {/* Active left bar indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r-full bg-[#6d5bba]" />
      )}

      {isCollapsed ? (
        <div className="relative flex h-5 w-5 items-center justify-center flex-shrink-0">
          {icon}
          {badgeCount && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#6d5bba] text-white text-[0.58rem] font-black">
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </div>
      ) : (
        <>
          <div className="relative flex h-5 w-5 items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <span className="flex-1 whitespace-nowrap">{label}</span>
          {badgeCount && (
            <span className={`rounded-full text-white text-[0.65rem] font-black px-[7px] py-[2px] min-w-[20px] text-center ${
              active ? "bg-[rgba(59,42,128,0.6)]" : "bg-white/15"
            }`}>
              {badgeCount}
            </span>
          )}
        </>
      )}

      {/* Collapsed tooltip */}
      {isCollapsed && (
        <div className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-lg bg-[#12082e] px-2.5 py-1.5 text-xs text-white shadow-xl group-hover:block border border-white/10 z-50">
          {label}
        </div>
      )}
    </Link>
  );
}

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="h-[18px] w-[18px]" />,
  search: <Search className="h-[18px] w-[18px]" />,
  "graduation-cap": <GraduationCap className="h-[18px] w-[18px]" />,
  package: <Package className="h-[18px] w-[18px]" />,
  clock: <Clock className="h-[18px] w-[18px]" />,
  "message-circle": <MessageCircle className="h-[18px] w-[18px]" />,
  "shopping-cart": <ShoppingCart className="h-[18px] w-[18px]" />,
  user: <User className="h-[18px] w-[18px]" />,
  settings: <Settings className="h-[18px] w-[18px]" />,
  star: <Star className="h-4.5 w-4.5" />,
  inbox: <Inbox className="h-4.5 w-4.5" />,
  "clipboard-list": <ClipboardList className="h-4.5 w-4.5" />,
};

export default function Sidebar({ onNavigate, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "User";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex h-full flex-col overflow-hidden bg-[linear-gradient(175deg,#12082e_0%,#180b3a_60%,#130930_100%)]"
    >
      {/* Logo */}
      <div
        className={`flex flex-shrink-0 items-center gap-2.5 border-b border-white/[0.06] py-[1.1rem] ${
          isCollapsed ? "justify-center px-0" : "px-5"
        }`}
      >
        <div
          className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] shadow-[0_4px_12px_rgba(59,42,128,0.45)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="white" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
        {!isCollapsed && (
          <div className="min-w-0 overflow-hidden">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-white/35">
              Workspace
            </p>
            <span className="block truncate text-[0.95rem] font-black tracking-[-0.02em] text-white">
              Borrowed
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav
        className={`scrollbar-none relative flex-1 overflow-y-auto overflow-x-hidden pb-3 pt-2 ${
          isCollapsed ? "px-3" : "px-2"
        }`}
      >
        {dashboardNavItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className={sectionIndex > 0 ? "mt-5" : "mt-2"}>
            {!isCollapsed && (
              <h3
                className="px-3 pb-1.5 text-[0.6rem] font-black uppercase tracking-[0.16em] text-white/25"
              >
                {section.section}
              </h3>
            )}
            {isCollapsed && <div className="h-1" />}
            <div className="relative space-y-[2px] px-1">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={isActiveDashboardPath(pathname, item.href)}
                  onNavigate={onNavigate}
                  icon={iconMap[item.icon]}
                  isCollapsed={isCollapsed}
                  badge={item.badge}
                />
              ))}
            </div>
          </div>
        ))}

        {session?.user?.isMentor && (
          <div className="mt-5">
            {!isCollapsed && (
              <h3 className="px-3 pb-1.5 text-[0.6rem] font-black uppercase tracking-[0.16em] text-white/25">
                Mentor
              </h3>
            )}
            {isCollapsed && <div className="h-1" />}
            <div className="relative space-y-0.5 px-1">
              <NavItem
                href="/dashboard/mentor"
                label="Mentor Dashboard"
                active={isActiveDashboardPath(pathname, "/dashboard/mentor")}
                onNavigate={onNavigate}
                icon={iconMap["star"]}
                isCollapsed={isCollapsed}
              />
            </div>
          </div>
        )}
      </nav>

      {/* Bottom user card */}
      {!isCollapsed && (
        <div
          className="mx-2 mb-3 flex flex-shrink-0 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.05] px-3 py-2.5"
        >
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] text-[0.7rem] font-black text-white"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.75rem] font-bold text-white/85">
              {userName.split(" ")[0]}
            </p>
            <p className="text-[0.65rem] font-medium text-white/35">
              v1.0 · Free plan
            </p>
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="flex justify-center pb-3 flex-shrink-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] text-[0.7rem] font-black text-white"
          >
            {initials}
          </div>
        </div>
      )}
    </div>
  );
}
