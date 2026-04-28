export const dashboardNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/dashboard/browse", label: "Browse Items", icon: "search" },
  { href: "/dashboard/my-items", label: "My Items", icon: "package" },
  { href: "/dashboard/my-borrows", label: "My Borrows", icon: "shopping-bag" },
  { href: "/dashboard/messages", label: "Messages", icon: "message-circle" },
  { href: "/dashboard/cart", label: "Cart", icon: "shopping-cart" },
  { href: "/dashboard/profile", label: "Profile", icon: "user" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
];

export const isActiveDashboardPath = (pathname: string, href: string): boolean => {
  return pathname === href || pathname.startsWith(href + "/");
};
