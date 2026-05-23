import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const type = new URL(req.url).searchParams.get("type") as "front" | "back" | "selfie" | null;

    if (!type || !["front", "back", "selfie"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const v = await prisma.idVerification.findUnique({
      where: { userId: id },
      select: {
        frontImage: true,
        frontMimeType: true,
        backImage: true,
        backMimeType: true,
        selfieImage: true,
        selfieMimeType: true,
      },
    });

    if (!v) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let imageBytes: Buffer | null = null;
    let mimeType: string | null = null;

    if (type === "front") {
      imageBytes = v.frontImage as Buffer | null;
      mimeType = v.frontMimeType;
    } else if (type === "back") {
      imageBytes = v.backImage as Buffer | null;
      mimeType = v.backMimeType;
    } else {
      imageBytes = v.selfieImage as Buffer | null;
      mimeType = v.selfieMimeType;
    }

    if (!imageBytes || !mimeType) {
      return NextResponse.json({ error: "Image not available" }, { status: 404 });
    }

    return new Response(new Uint8Array(imageBytes), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/admin/users/[id]/id-image:", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
