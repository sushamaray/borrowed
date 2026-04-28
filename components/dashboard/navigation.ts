export const dashboardNavItems = [
  {
    section: "Browse",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "home" },
      { href: "/dashboard/browse", label: "Browse Items", icon: "search" },
    ]
  },
  {
    section: "My Activity",
    items: [
      { href: "/dashboard/my-items", label: "My Items", icon: "package" },
      { href: "/dashboard/my-borrows", label: "My Borrows", icon: "clock" },
      { href: "/dashboard/messages", label: "Messages", icon: "message-circle", badge: "messages" },
      { href: "/dashboard/cart", label: "Cart", icon: "shopping-cart", badge: "cart" },
    ]
  },
];

// Mock badge data - replace with real data from API/context
export const getBadgeCount = (badgeType: string): number | null => {
  if (badgeType === "messages") return 3; // Replace with real count
  if (badgeType === "cart") return 2;     // Replace with real count
  return null;
};

export const isActiveDashboardPath = (pathname: string, href: string): boolean => {
  // Exact match for main dashboard to prevent highlighting all other routes
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  // For other routes, match exactly or child routes
  return pathname === href || pathname.startsWith(href + "/");
};
