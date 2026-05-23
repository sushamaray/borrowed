import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SessionWrapper from "@/components/SessionWrapper";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isAdmin) {
    redirect("/unauthorized");
  }

  return (
    <SessionWrapper session={session}>
      <AdminShell>{children}</AdminShell>
    </SessionWrapper>
  );
}
