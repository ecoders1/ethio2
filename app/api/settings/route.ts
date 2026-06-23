import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function GET(req: NextRequest) {
  void req;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("app_settings").select("key, value");
  if (error) return NextResponse.json({ settings: {} });

  const settings: Record<string, string> = {};
  data?.forEach((s) => (settings[s.key] = s.value));
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, value } = await req.json();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
