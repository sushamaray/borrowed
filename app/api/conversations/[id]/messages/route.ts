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

const ALLOWED_TYPES = ["text", "item_share", "item_offer", "private_borrow_request"] as const;
type MessageType = (typeof ALLOWED_TYPES)[number];

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
      type: m.type ?? "text",
      metadata: m.metadata ?? null,
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

    const participant = await isConversationParticipant(conversationId, userId);
    if (!participant) {
      return jsonError("Forbidden", 403);
    }

    const body = await readJsonBody(request);
    if (!body || typeof body !== "object") {
      return jsonError("Invalid JSON body", 400);
    }

    const b = body as Record<string, unknown>;

    // Validate message type
    const msgType: MessageType = ALLOWED_TYPES.includes(b.type as MessageType)
      ? (b.type as MessageType)
      : "text";

    // For card messages, content can be a short descriptor; for text messages validate normally
    let content: string;
    if (msgType === "text") {
      const messageResult = validateMessageContent(b.content);
      if (!messageResult.ok) {
        return jsonError(messageResult.error, 400);
      }
      content = messageResult.value;
    } else {
      // Card messages use a short fixed content string
      content = typeof b.content === "string" && b.content.trim().length > 0
        ? b.content.trim().slice(0, 200)
        : msgType;
    }

    // For item_share: validate the lentItem belongs to sender and is active
    let metadata: Record<string, unknown> | null = null;
    if (msgType === "item_share") {
      const lentItemId = typeof b.lentItemId === "string" ? b.lentItemId : null;
      if (!lentItemId) return jsonError("lentItemId required for item_share", 400);

      const lentItem = await prisma.lentItem.findFirst({
        where: { id: lentItemId, lenderId: userId, status: "active" },
        include: { product: { select: { name: true, slug: true, category: true, imageUrl: true } } },
      });
      if (!lentItem) return jsonError("Item not found or not available", 404);

      metadata = {
        lentItemId: lentItem.id,
        itemName: lentItem.product.name,
        slug: lentItem.product.slug,
        category: lentItem.product.category,
        pricePerDay: lentItem.pricePerDay,
        imageUrl: lentItem.product.imageUrl ?? null,
      };
    } else if (msgType === "item_offer" || msgType === "private_borrow_request") {
      // Accept metadata as-is from client
      if (b.metadata && typeof b.metadata === "object" && !Array.isArray(b.metadata)) {
        metadata = b.metadata as Record<string, unknown>;
      }
    }

    const retryAfter = checkMessageRateLimit(userId);
    if (retryAfter) {
      return NextResponse.json(
        { error: "Too many messages. Please slow down." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        type: msgType,
        metadata: metadata ?? undefined,
      },
      include: {
        sender: { select: { id: true, name: true, userName: true } },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: msg.createdAt },
    });

    // Notify recipients (skip notification for card messages to avoid noise)
    if (msgType === "text") {
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
    }

    const shapedMessage = {
      id: msg.id,
      from: "me" as const,
      text: msg.content,
      time: formatTime(msg.createdAt),
      senderId: msg.senderId,
      senderName: msg.sender.name ?? msg.sender.userName ?? "User",
      type: msg.type ?? "text",
      metadata: msg.metadata ?? null,
    };

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
