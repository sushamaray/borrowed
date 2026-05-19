import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
    if (!mentor) {
      return NextResponse.json({ error: "Not a mentor" }, { status: 404 });
    }

    const bookings = await prisma.mentorBooking.findMany({
      where: { mentorId: mentor.id },
      include: {
        user: {
          select: {
            id: true, name: true, firstName: true, lastName: true,
            userName: true, email: true, profilePicture: true, image: true,
            location: true, createdAt: true,
            identityVerified: true, contactVerified: true,
            idVerified: true, addressVerified: true, meetupVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("GET /api/mentors/me/bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
