import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
    if (!mentor) {
      return NextResponse.json({ error: "Not a mentor" }, { status: 404 });
    }

    const { bookingId } = await params;
    const booking = await prisma.mentorBooking.findFirst({
      where: { id: bookingId, mentorId: mentor.id },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status } = body;
    if (status !== "confirmed" && status !== "cancelled") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.mentorBooking.update({
      where: { id: bookingId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/mentors/me/bookings/[bookingId]:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
