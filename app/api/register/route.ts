import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    console.log("[register] Incoming registration request");
    const body = (await req.json()) as {
      firstName?: string;
      lastName?: string;
      userName?: string;
      email?: string;
      password?: string;
    };
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const userName = body.userName?.trim().toLowerCase();
    const email = body.email?.toLowerCase().trim();
    const { password } = body;

    // Validation
    if (!firstName || !lastName || !userName || !email || !password) {
      console.log("[register] Missing required fields", {
        hasFirstName: Boolean(firstName),
        hasLastName: Boolean(lastName),
        hasUserName: Boolean(userName),
        hasEmail: Boolean(email),
        hasPassword: Boolean(password),
      });
      return Response.json({ message: "All fields are required" }, { status: 400 });
    }

    if (userName.length < 3) {
      console.log("[register] Username too short", { userName });
      return Response.json(
        { message: "Username must be at least 3 characters" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      console.log("[register] Password too short", { email, userName });
      return Response.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    console.log("[register] Checking for existing user", { email, userName });
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { userName }],
      },
    });

    if (existingUser) {
      const conflictField = existingUser.email === email ? "email" : "userName";
      console.log("[register] Duplicate user detected", { conflictField, email, userName });
      return Response.json(
        { message: `User with this ${conflictField} already exists` },
        { status: 400 },
      );
    }

    // Hash password
    console.log("[register] Hashing password", { email, userName });
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log("[register] Creating user", { email, userName });
    await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        userName,
        email,
        password: hashedPassword,
      },
    });

    console.log("[register] User created successfully", { email, userName });
    return Response.json({ message: "User created successfully" });
  } catch (error) {
    console.error("[register] Server error", error);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
