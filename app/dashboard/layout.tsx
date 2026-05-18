import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import SessionWrapper from "@/components/SessionWrapper";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <SessionWrapper session={session}>
      <DashboardShell>{children}</DashboardShell>
    </SessionWrapper>
  );
}
