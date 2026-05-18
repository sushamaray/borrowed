import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: mentorId } = await params;
    const body = await request.json();
    const { sessionFormat, scheduledAt, goals } = body;

    const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }
    if (!mentor.available) {
      return NextResponse.json({ error: "Mentor is not available" }, { status: 409 });
    }

    const booking = await prisma.mentorBooking.create({
      data: {
        mentorId,
        userId: session.user.id,
        sessionFormat: sessionFormat === "in-person" ? "IN_PERSON" : "VIDEO",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        goals: goals ?? null,
        status: "pending",
      },
      include: { mentor: true },
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "mentor_confirmed",
        title: "Mentor session confirmed",
        body: `Your session with ${mentor.name} has been booked.`,
        link: "/dashboard/mentors",
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("POST /api/mentors/[id]/book:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
