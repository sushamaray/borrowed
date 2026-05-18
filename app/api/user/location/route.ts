import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { location: true, latitude: true, longitude: true },
    });

    return NextResponse.json({
      location: user?.location,
      latitude: user?.latitude,
      longitude: user?.longitude,
    });
  } catch (error) {
    console.error("Error fetching user location:", error);
    return NextResponse.json({ error: "Failed to fetch location" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { location, latitude, longitude } = body;

    if (!location || typeof location !== "string") {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { location, latitude, longitude },
      select: { location: true, latitude: true, longitude: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating user location:", error);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}
