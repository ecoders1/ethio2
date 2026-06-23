import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function GET(req: NextRequest) {
  void req;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ departments: data });
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, name_am, name_om, description } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("departments")
    .insert({ id: crypto.randomUUID(), name, name_am: name_am || "", name_om: name_om || "", description })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ department: data }, { status: 201 });
}
