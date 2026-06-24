import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("department_id");
  // unlockedOnly=true → only return exams for departments user has paid for
  const unlockedOnly = searchParams.get("unlocked_only") === "true";

  const supabase = createServerSupabaseClient();
  const payload = await getAuthUser();

  let query = supabase
    .from("exams")
    .select("*, departments(name)")
    .eq("is_active", true)
    .order("year", { ascending: true });

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  } else if (unlockedOnly && payload && !payload.isAdmin) {
    // Get departments this user has access to
    const { data: accessRows } = await supabase
      .from("user_department_access")
      .select("department_id")
      .eq("user_id", payload.userId);

    const deptIds = accessRows?.map(r => r.department_id) || [];
    if (deptIds.length === 0) {
      return NextResponse.json({ exams: [] });
    }
    query = query.in("department_id", deptIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exams: data });
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { department_id, year, title, is_free } = await req.json();
  if (!department_id || !year || !title)
    return NextResponse.json({ error: "department_id, year, and title are required" }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("exams")
    .insert({
      id: crypto.randomUUID(),
      department_id, year, title,
      is_free: is_free || false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exam: data }, { status: 201 });
}
