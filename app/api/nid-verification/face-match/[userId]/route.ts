import { verifyFaceBuffers } from "@/lib/face-verification";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,191}$/;

type RouteParams = Promise<{ userId: string }>;

function isValidUserId(userId: string) {
  return USER_ID_PATTERN.test(userId);
}

function roundNumber(value: number, decimals: number) {
  return Number(value.toFixed(decimals));
}

async function runFaceMatch(userId: string) {
  console.log("[nid-face-match] Verification request received", { userId });

  const verification = await prisma.nidVerification.findUnique({
    where: { userId },
    select: {
      userId: true,
      frontImage: true,
      selfieImage: true,
    },
  });

  if (!verification) {
    return NextResponse.json(
      { success: false, error: "Verification record not found" },
      { status: 404 },
    );
  }

  if (!verification.frontImage || !verification.selfieImage) {
    return NextResponse.json(
      { success: false, error: "Front image and selfie image are required" },
      { status: 400 },
    );
  }

  try {
    const result = await verifyFaceBuffers(
      verification.frontImage,
      verification.selfieImage,
    );
    const similarityScore = roundNumber(result.score, 2);
    const distance = roundNumber(result.distance, 4);
    const isVerified = result.status === "verified";
    const reviewedAt = new Date();

    await prisma.$transaction([
      prisma.nidVerification.update({
        where: { userId },
        data: {
          faceMatchScore: similarityScore,
          status: result.status,
          reviewedAt,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          nidVerified: isVerified,
          identityVerified: isVerified,
          verifiedAt: isVerified ? reviewedAt : null,
        },
      }),
    ]);

    console.log("[nid-face-match] Database updated", {
      userId,
      similarityScore,
      distance,
      status: result.status,
      isVerified,
    });

    return NextResponse.json({
      success: true,
      userId,
      similarityScore,
      distance,
      status: result.status,
      verified: isVerified,
    });
  } catch (error) {
    console.error("[nid-face-match] Face verification failed", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

async function resolveUserId(params: RouteParams) {
  const { userId } = await params;

  if (!userId?.trim()) {
    return null;
  }

  const trimmedUserId = userId.trim();
  if (!isValidUserId(trimmedUserId)) {
    throw new Error("Invalid userId");
  }

  return trimmedUserId;
}

export async function GET(
  _request: Request,
  segmentData: { params: RouteParams },
) {
  try {
    const userId = await resolveUserId(segmentData.params);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 },
      );
    }

    return await runFaceMatch(userId);
  } catch (error) {
    console.error("[nid-face-match] GET request failed", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: message === "Invalid userId" ? 400 : 500 },
    );
  }
}

export async function POST(
  _request: Request,
  segmentData: { params: RouteParams },
) {
  try {
    const userId = await resolveUserId(segmentData.params);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 },
      );
    }

    return await runFaceMatch(userId);
  } catch (error) {
    console.error("[nid-face-match] POST request failed", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: message === "Invalid userId" ? 400 : 500 },
    );
  }
}
