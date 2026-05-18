import { ReactNode } from "react";
import SessionWrapper from "@/components/SessionWrapper";

import DashboardShell from "@/components/dashboard/DashboardShell";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionWrapper>
      <DashboardShell>{children}</DashboardShell>
    </SessionWrapper>
  );
}
