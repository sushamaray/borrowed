import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type UploadKind = "front" | "selfie";
function isUploadKind(value: FormDataEntryValue | null): value is UploadKind {
  return value === "front" || value === "selfie";
}

function isUploadedFileLike(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    typeof value.arrayBuffer === "function" &&
    "size" in value &&
    typeof value.size === "number" &&
    "type" in value &&
    typeof value.type === "string"
  );
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const kind = formData.get("kind");
    const file = formData.get("file");

    if (!isUploadKind(kind)) {
      return NextResponse.json(
        { error: "Invalid upload kind" },
        { status: 400 },
      );
    }

    if (!isUploadedFileLike(file)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WEBP images are allowed" },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Image must be smaller than 10MB" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Authenticated user no longer exists" },
        { status: 404 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const data =
      kind === "front"
        ? {
            frontImage: bytes,
            frontMimeType: file.type,
            submittedAt: new Date(),
          }
        : {
            selfieImage: bytes,
            selfieMimeType: file.type,
            submittedAt: new Date(),
          };

    await prisma.idVerification.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        user: { connect: { id: session.user.id } },
        ...data,
      },
    });

    return NextResponse.json({
      success: true,
      kind,
      fileName: file.name ?? `${kind}-image`,
    });
  } catch (error) {
    console.error("POST /api/id-verification:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload verification image";

    return NextResponse.json(
      {
        error: "Failed to upload verification image",
        ...(process.env.NODE_ENV !== "production" ? { details: message } : {}),
      },
      { status: 500 },
    );
  }
}
