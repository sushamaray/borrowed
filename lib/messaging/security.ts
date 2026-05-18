import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const MESSAGE_MAX_LENGTH = 1000;
const MESSAGE_RATE_WINDOW_MS = 10_000;
const MESSAGE_RATE_LIMIT = 8;

type RateBucket = {
  count: number;
  resetAt: number;
};

type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const globalForMessaging = globalThis as typeof globalThis & {
  messageRateBuckets?: Map<string, RateBucket>;
};

const messageRateBuckets =
  globalForMessaging.messageRateBuckets ?? new Map<string, RateBucket>();

if (process.env.NODE_ENV !== "production") {
  globalForMessaging.messageRateBuckets = messageRateBuckets;
}

export async function requireSessionUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  return typeof userId === "string" && userId ? userId : null;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJsonBody(request: NextRequest) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

export function validateMessageContent(
  value: unknown,
): ValidationResult<string> {
  if (typeof value !== "string") {
    return { ok: false, error: "Message content is required" };
  }

  const content = value.trim();

  if (!content) {
    return { ok: false, error: "Message content is required" };
  }

  if (content.length > MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Message must be ${MESSAGE_MAX_LENGTH} characters or less`,
    };
  }

  return { ok: true, value: content };
}

export function validateRequiredId(
  value: unknown,
  name: string,
): ValidationResult<string> {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: `${name} is required` };
  }

  return { ok: true, value: value.trim() };
}

export async function isConversationParticipant(
  conversationId: string,
  userId: string,
) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    select: { userId: true },
  });

  return Boolean(participant);
}

export function checkMessageRateLimit(userId: string) {
  const now = Date.now();
  const bucket = messageRateBuckets.get(userId);

  if (!bucket || bucket.resetAt <= now) {
    messageRateBuckets.set(userId, {
      count: 1,
      resetAt: now + MESSAGE_RATE_WINDOW_MS,
    });
    return null;
  }

  if (bucket.count >= MESSAGE_RATE_LIMIT) {
    return Math.ceil((bucket.resetAt - now) / 1000);
  }

  bucket.count += 1;
  return null;
}
