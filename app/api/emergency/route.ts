import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const EARTH_RADIUS_KM = 6371;
const MAX_RADIUS_KM = 50;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const latDelta = toRadians(to.latitude - from.latitude);
  const lngDelta = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseRadiusKm(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(Math.max(value, 1), MAX_RADIUS_KM);
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/km$/i, "").trim());
    if (Number.isFinite(parsed)) {
      return Math.min(Math.max(parsed, 1), MAX_RADIUS_KM);
    }
  }

  return 5;
}

function displayName(user: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
}) {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  return user.name ?? user.userName ?? "Someone nearby";
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const item = typeof body.item === "string" ? body.item.trim() : "";
    const neededBy = typeof body.neededBy === "string" ? body.neededBy.trim() : "";
    const radiusKm = parseRadiusKm(body.radius);

    if (!item) {
      return NextResponse.json({ error: "Item is required" }, { status: 400 });
    }

    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        userName: true,
        location: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!requester || requester.latitude === null || requester.longitude === null) {
      return NextResponse.json(
        { error: "Set your location before sending an emergency request" },
        { status: 400 },
      );
    }

    const requesterPoint = {
      latitude: requester.latitude,
      longitude: requester.longitude,
    };

    const candidates = await prisma.user.findMany({
      where: {
        id: { not: requester.id },
        latitude: { not: null },
        longitude: { not: null },
        lentItems: { some: { status: "active" } },
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        userName: true,
        latitude: true,
        longitude: true,
      },
    });

    const nearbyLenders = candidates
      .map((candidate) => {
        if (candidate.latitude === null || candidate.longitude === null) return null;

        const distance = distanceKm(requesterPoint, {
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        });

        return { ...candidate, distance };
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> => {
        return candidate !== null && candidate.distance <= radiusKm;
      })
      .sort((a, b) => a.distance - b.distance);

    const requesterName = displayName(requester);
    const neededLabel = neededBy ? ` Needed ${neededBy}.` : "";
    const locationLabel = requester.location ? ` near ${requester.location}` : "";

    if (nearbyLenders.length > 0) {
      await prisma.notification.createMany({
        data: nearbyLenders.map((lender) => ({
          userId: lender.id,
          type: "emergency_request",
          title: "Emergency borrow request nearby",
          body: `${requesterName} urgently needs ${item}${locationLabel}.${neededLabel}`,
          link: `/dashboard/messages?userId=${requester.id}&emergency=true&item=${encodeURIComponent(item)}`,
        })),
      });
    }

    return NextResponse.json({
      ok: true,
      radiusKm,
      notifiedCount: nearbyLenders.length,
      recipients: nearbyLenders.slice(0, 5).map((lender) => {
        const name = displayName(lender);
        return {
          id: lender.id,
          initials: initials(name),
          distanceKm: Number(lender.distance.toFixed(1)),
        };
      }),
    });
  } catch (error) {
    console.error("POST /api/emergency:", error);
    return NextResponse.json({ error: "Failed to send emergency request" }, { status: 500 });
  }
}
