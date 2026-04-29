"use client";

import { ReactNode, useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/browse": "Browse Items",
  "/dashboard/my-items": "My Items",
  "/dashboard/my-borrows": "My Borrows",
  "/dashboard/messages": "Messages",
  "/dashboard/cart": "Cart",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
};

export default function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const pageTitle = useMemo(() => {
    return pageTitles[pathname] ?? "Workspace";
  }, [pathname]);

  const sidebarWidth = isSidebarCollapsed ? "lg:w-20" : "lg:w-64";
  const contentOffset = isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64";

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col transition-all duration-300 lg:w-64`}>
          <div className="flex min-h-0 flex-1 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
            <Sidebar isCollapsed={false} />
          </div>
        </div>
        <div className={`flex min-h-screen flex-col transition-all duration-300 lg:pl-64`}>
          <Navbar
            onMenuClick={() => {}}
            onCollapseClick={() => {}}
            isSidebarCollapsed={false}
            pageTitle={pageTitle}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Desktop Fixed Sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col transition-all duration-300 ${sidebarWidth}`}>
        <div className="flex min-h-0 flex-1 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
          <Sidebar isCollapsed={isSidebarCollapsed} />
        </div>
      </div>

      {/* Main Content - Offset for fixed sidebar */}
      <div className={`flex min-h-screen flex-col transition-all duration-300 ${contentOffset}`}>
        {/* Navbar */}
        <Navbar
          onMenuClick={() => setIsSidebarOpen(true)}
          onCollapseClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          pageTitle={pageTitle}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--ink)]/45"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
          />
          <div className="absolute inset-y-0 left-0 w-full max-w-xs border-r border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
