import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { signJWT } from "@/lib/jwt";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip + ":register", 5, 60000);
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  try {
    const { fullName, email, password, deviceId } = await req.json();

    // Validation
    if (!fullName || fullName.trim().length < 6) {
      return NextResponse.json({ error: "Full name must be at least 6 characters." }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id, device_id")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
    }

    // Check device binding (one account per device)
    if (deviceId) {
      const { data: deviceUser } = await supabase
        .from("users")
        .select("id")
        .eq("device_id", deviceId)
        .single();
      if (deviceUser) {
        return NextResponse.json(
          { error: "This device is already linked to an account." },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hashPassword(password);

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        id: crypto.randomUUID(),
        full_name: fullName.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        device_id: deviceId || null,
        is_admin: false,
      })
      .select("id, full_name, email, is_admin, device_id")
      .single();

    if (error || !newUser) {
      console.error("Register error:", error);
      return NextResponse.json({ error: "Registration failed." }, { status: 500 });
    }

    const token = await signJWT({
      userId: newUser.id,
      email: newUser.email,
      isAdmin: false,
      deviceId: deviceId || "",
    });

    const response = NextResponse.json({ user: newUser }, { status: 201 });
    response.cookies.set("eee_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
