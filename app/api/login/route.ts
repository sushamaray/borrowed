import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    console.log("[login] Incoming login request");
    const body = (await req.json()) as {
      identifier?: string;
      password?: string;
    };
    const { password } = body;
    const identifier = body.identifier?.trim();
    const normalizedIdentifier = identifier?.toLowerCase();

    // Validation
    if (!identifier || !password) {
      console.log("[login] Missing credentials", {
        hasIdentifier: Boolean(identifier),
        hasPassword: Boolean(password),
      });
      return Response.json(
        { message: "Email or userName and password required" },
        { status: 400 },
      );
    }

    // Find user
    console.log("[login] Looking up user", { identifier: normalizedIdentifier });
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedIdentifier }, { userName: normalizedIdentifier }],
      },
    });

    if (!user) {
      console.log("[login] User not found", { identifier: normalizedIdentifier });
      return Response.json({ message: "Invalid email or userName" }, { status: 404 });
    }

    // Check password
    console.log("[login] Comparing password", {
      identifier: normalizedIdentifier,
      userId: user.id,
    });
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      console.log("[login] Invalid password", {
        identifier: normalizedIdentifier,
        userId: user.id,
      });
      return Response.json({ message: "Invalid password" }, { status: 401 });
    }

    console.log("[login] Login success", {
      identifier: normalizedIdentifier,
      userId: user.id,
      userName: user.userName,
    });
    return Response.json({
      message: "Login success",
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        name: user.firstName,
      },
    });
  } catch (error) {
    console.error("[login] Server error", error);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
