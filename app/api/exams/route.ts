import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("department_id");

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("exams")
    .select("*, departments(name)")
    .eq("is_active", true)
    .order("year", { ascending: false });

  if (departmentId) query = query.eq("department_id", departmentId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exams: data });
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { department_id, year, title, is_free } = await req.json();
  if (!department_id || !year || !title)
    return NextResponse.json({ error: "department_id, year, and title are required" }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("exams")
    .insert({ id: crypto.randomUUID(), department_id, year, title, is_free: is_free || false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exam: data }, { status: 201 });
}
