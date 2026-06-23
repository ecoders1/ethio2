import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";

// One-time seed endpoint to create admin account
// Call: POST /api/admin/seed with { secret: "eee-seed-2024" }
export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  if (secret !== "eee-seed-2024") {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  const adminEmail = process.env.ADMIN_EMAIL || "milkiyaas43@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Ayyuu@4313@";

  const supabase = createServerSupabaseClient();

  // Check if admin already exists
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", adminEmail)
    .single();

  if (existing) {
    return NextResponse.json({ message: "Admin already exists" });
  }

  const passwordHash = await hashPassword(adminPassword);
  const { error } = await supabase.from("users").insert({
    id: crypto.randomUUID(),
    full_name: "EEE Administrator",
    email: adminEmail,
    password_hash: passwordHash,
    is_admin: true,
    device_id: null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Admin created successfully. Email: " + adminEmail });
}
