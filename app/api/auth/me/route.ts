import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  void req;
  const payload = await getAuthUser();
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data: user } = await supabase
      .from("users")
      .select("id, full_name, email, is_admin, device_id")
      .eq("id", payload.userId)
      .single();

    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
