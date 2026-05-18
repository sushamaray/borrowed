export const dashboardNavItems = [
  {
    section: "Browse",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "home" },
      { href: "/dashboard/browse", label: "Browse Items", icon: "search" },
      { href: "/dashboard/mentors", label: "Mentors", icon: "graduation-cap" },
    ]
  },
  {
    section: "My Activity",
    items: [
      { href: "/dashboard/my-items", label: "Lent Items", icon: "package" },
      { href: "/dashboard/my-borrows", label: "Borrowed Items", icon: "clock" },
      { href: "/dashboard/messages", label: "Messages", icon: "message-circle", badge: "messages" },
      { href: "/dashboard/cart", label: "Cart", icon: "shopping-cart", badge: "cart" },
    ]
  },
  {
    section: "Account",
    items: [
      { href: "/dashboard/profile", label: "Profile", icon: "user" },
    ]
  },
];

export const getBadgeCount = (badgeType: string): number | null => {
  if (badgeType === "messages") return 3;
  if (badgeType === "cart") return 2;
  return null;
};

export const isActiveDashboardPath = (pathname: string, href: string): boolean => {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(href + "/");
};
