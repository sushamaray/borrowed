import {
  checkMessageRateLimit,
  isConversationParticipant,
  jsonError,
  readJsonBody,
  requireSessionUserId,
  validateMessageContent,
} from "@/lib/messaging/security";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return jsonError("Unauthorized", 401);
    }

    const { id: conversationId } = await params;

    // Verify user is a participant
    const participant = await isConversationParticipant(conversationId, userId);

    if (!participant) {
      return jsonError("Forbidden", 403);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, userName: true } },
      },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    const shaped = messages.map((m) => ({
      id: m.id,
      from: m.senderId === userId ? "me" : "them",
      text: m.content,
      time: formatTime(m.createdAt),
      senderId: m.senderId,
      senderName: m.sender.name ?? m.sender.userName ?? "User",
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("GET /api/conversations/[id]/messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return jsonError("Unauthorized", 401);
    }

    const { id: conversationId } = await params;

    // Verify user is a participant
    const participant = await isConversationParticipant(conversationId, userId);

    if (!participant) {
      return jsonError("Forbidden", 403);
    }

    const body = await readJsonBody(request);
    if (!body || typeof body !== "object") {
      return jsonError("Invalid JSON body", 400);
    }

    const messageResult = validateMessageContent(
      (body as Record<string, unknown>).content,
    );
    if (!messageResult.ok) {
      return jsonError(messageResult.error, 400);
    }

    const retryAfter = checkMessageRateLimit(userId);
    if (retryAfter) {
      return NextResponse.json(
        { error: "Too many messages. Please slow down." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

    const content = messageResult.value;

    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, userName: true } },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: msg.createdAt },
    });

    // Notify recipients (all participants except sender)
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId } },
    });
    const senderName = msg.sender.name ?? msg.sender.userName ?? "Someone";
    const preview = content.slice(0, 80);
    if (participants.length > 0) {
      await prisma.notification.createMany({
        data: participants.map((p) => ({
          userId: p.userId,
          type: "new_message",
          title: "New message",
          body: `${senderName}: ${preview}`,
          link: "/dashboard/messages",
        })),
      });
    }

    const shapedMessage = {
      id: msg.id,
      from: "me",
      text: msg.content,
      time: formatTime(msg.createdAt),
      senderId: msg.senderId,
      senderName: msg.sender.name ?? msg.sender.userName ?? "User",
    } as const;

    return NextResponse.json(shapedMessage, { status: 201 });
  } catch (error) {
    console.error("POST /api/conversations/[id]/messages:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

function formatTime(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
