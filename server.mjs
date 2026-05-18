import { createServer } from "node:http";
import next from "next";
import nextEnv from "@next/env";
import prismaClientModule from "./lib/generated/prisma/index.js";
import { Server } from "socket.io";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const { PrismaClient } = prismaClientModule;
const dev =
  process.env.NODE_ENV !== "production" &&
  process.env.npm_lifecycle_event !== "start";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number.parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

let getTokenModule;

async function getSocketUserId(req) {
  getTokenModule ??= import("next-auth/jwt");
  const { getToken } = await getTokenModule;
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });

  return typeof token?.userId === "string" ? token.userId : null;
}

async function canJoinConversation(conversationId, userId) {
  if (typeof conversationId !== "string" || !conversationId.trim()) {
    return false;
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: conversationId.trim(),
        userId,
      },
    },
    select: { userId: true },
  });

  return Boolean(participant);
}

app.prepare().then(() => {
  const socketPath = "/api/socket";
  const httpServer = createServer((req, res) => {
    if (!req.url?.startsWith(socketPath)) {
      handle(req, res);
    }
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
  });

  globalThis.__borrowedSocketIo = io;

  io.use(async (socket, nextSocket) => {
    try {
      const userId = await getSocketUserId(socket.request);

      if (!userId) {
        nextSocket(new Error("Unauthorized"));
        return;
      }

      socket.data.userId = userId;
      nextSocket();
    } catch {
      nextSocket(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.userId;

    socket.join(`user:${userId}`);

    try {
      const participants = await prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true },
      });
      for (const p of participants) {
        socket.join(`conversation:${p.conversationId}`);
      }
    } catch {
      // non-fatal — manual conversation:join still works
    }

    socket.on("conversation:join", async (conversationId, ack) => {
      const allowed = await canJoinConversation(conversationId, userId);

      if (!allowed) {
        ack?.({ ok: false, error: "Forbidden" });
        return;
      }

      const room = `conversation:${conversationId.trim()}`;
      await socket.join(room);
      ack?.({ ok: true });
    });

    socket.on("message:send", ({ conversationId, message }) => {
      if (typeof conversationId !== "string" || !conversationId.trim()) return;
      if (!message || typeof message.id !== "string") return;

      const room = `conversation:${conversationId.trim()}`;
      if (!socket.rooms.has(room)) return;

      socket.to(room).emit("message:new", { conversationId, message });
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? "development" : process.env.NODE_ENV
      }`,
    );
  });
});
