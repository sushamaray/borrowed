import type { Server as SocketIOServer } from "socket.io";

export type RealtimeMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  senderId: string;
  senderName: string;
};

const globalForSocket = globalThis as typeof globalThis & {
  __borrowedSocketIo?: SocketIOServer;
};

export function joinUserToConversation(userId: string, conversationId: string) {
  globalForSocket.__borrowedSocketIo
    ?.in(`user:${userId}`)
    .socketsJoin(`conversation:${conversationId}`);
}

export function emitNewConversationNotification(recipientId: string) {
  globalForSocket.__borrowedSocketIo
    ?.to(`user:${recipientId}`)
    .emit("conversation:new");
}

export function emitConversationMessage(
  conversationId: string,
  message: RealtimeMessage,
) {
  globalForSocket.__borrowedSocketIo
    ?.to(`conversation:${conversationId}`)
    .emit("message:new", { conversationId, message });
}
