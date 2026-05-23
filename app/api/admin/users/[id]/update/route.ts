import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ALLOWED_FIELDS = [
  "identityVerified",
  "contactVerified",
  "idVerified",
  "addressVerified",
  "meetupVerified",
  "isAdmin",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json() as { field: string; value: boolean };

    if (!ALLOWED_FIELDS.includes(body.field as AllowedField)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { [body.field]: body.value },
      select: {
        identityVerified: true,
        contactVerified: true,
        idVerified: true,
        addressVerified: true,
        meetupVerified: true,
        isAdmin: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/admin/users/[id]/update:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
