import { ReactNode } from "react";

import DashboardShell from "@/components/dashboard/DashboardShell";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
