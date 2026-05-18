import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  return NextResponse.json({
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    session: session ? "active" : "none"
  });
}