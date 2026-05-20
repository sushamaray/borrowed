import {
  checkMessageRateLimit,
  jsonError,
  readJsonBody,
  requireSessionUserId,
  validateMessageContent,
  validateRequiredId,
} from "@/lib/messaging/security";
import { prisma } from "@/lib/prisma";
import { emitConversationMessage, emitNewConversationNotification, joinUserToConversation } from "@/lib/socket";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return jsonError("Unauthorized", 401);
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, userName: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, userName: true } },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    const shaped = conversations.map((conv) => {
      const other = conv.participants.find((p) => p.userId !== userId);
      const otherUser = other?.user;
      const lastMsg = conv.messages[conv.messages.length - 1];
      const unread = conv.messages.filter(
        (m) => m.senderId !== userId && !m.readAt,
      ).length;

      return {
        id: conv.id,
        with: {
          id: otherUser?.id ?? "",
          name: otherUser?.name ?? otherUser?.userName ?? "User",
          handle: otherUser?.userName ? `@${otherUser.userName}` : "",
          avatar: (otherUser?.name ?? "U")
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase(),
        },
        lastMsg: lastMsg?.content ?? "",
        time: lastMsg
          ? formatTime(lastMsg.createdAt)
          : formatTime(conv.lastMessageAt),
        unread,
        messages: conv.messages.map((m) => ({
          id: m.id,
          from: m.senderId === userId ? "me" : "them",
          text: m.content,
          time: formatTime(m.createdAt),
          type: m.type ?? "text",
          metadata: m.metadata ?? null,
        })),
      };
    });

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("GET /api/conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return jsonError("Unauthorized", 401);
    }

    const body = await readJsonBody(request);
    if (!body || typeof body !== "object") {
      return jsonError("Invalid JSON body", 400);
    }

    const bodyRecord = body as Record<string, unknown>;
    const recipientResult = validateRequiredId(
      bodyRecord.recipientId,
      "recipientId",
    );
    if (!recipientResult.ok) {
      return jsonError(recipientResult.error, 400);
    }

    const messageResult = validateMessageContent(bodyRecord.message);
    if (!messageResult.ok) {
      return jsonError(messageResult.error, 400);
    }

    const recipientId = recipientResult.value;
    const content = messageResult.value;

    if (recipientId === userId) {
      return jsonError("Cannot start a conversation with yourself", 400);
    }

    const retryAfter = checkMessageRateLimit(userId);
    if (retryAfter) {
      return NextResponse.json(
        { error: "Too many messages. Please slow down." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });

    if (!recipient) {
      return jsonError("Recipient not found", 404);
    }

    // Check if conversation already exists between these two users
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
    });

    const conv = existing ?? (await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: recipientId }],
        },
      },
    }));

    const msg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: userId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, userName: true } },
      },
    });

    await prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: msg.createdAt },
    });

    const shapedMessage = {
      id: msg.id,
      from: "me" as const,
      text: msg.content,
      time: formatTime(msg.createdAt),
      senderId: msg.senderId,
      senderName: msg.sender.name ?? msg.sender.userName ?? "User",
    };

    emitConversationMessage(conv.id, shapedMessage);
    joinUserToConversation(recipientId, conv.id);
    emitNewConversationNotification(recipientId);

    return NextResponse.json({ conversationId: conv.id, message: msg }, { status: 201 });
  } catch (error) {
    console.error("POST /api/conversations:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
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
