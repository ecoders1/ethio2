import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { hashPassword, comparePassword } from "@/lib/auth";
import { signJWT } from "@/lib/jwt";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip + ":login", 10, 60000);
  if (!success) {
    return NextResponse.json({ error: "Too many login attempts. Try again in a minute." }, { status: 429 });
  }

  try {
    const { email, password, remember, deviceId } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, password_hash, is_admin, device_id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Device binding check (skip for admin)
    if (!user.is_admin && deviceId && user.device_id && user.device_id !== deviceId) {
      return NextResponse.json(
        { error: "This account is linked to a different device." },
        { status: 403 }
      );
    }

    // Update device_id if not set
    if (!user.is_admin && deviceId && !user.device_id) {
      await supabase.from("users").update({ device_id: deviceId }).eq("id", user.id);
    }

    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 1 day

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      deviceId: deviceId || user.device_id || "",
    });

    const userData = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      is_admin: user.is_admin,
      device_id: user.device_id,
    };

    const response = NextResponse.json({ user: userData });
    response.cookies.set("eee_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
