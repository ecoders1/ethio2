import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function GET(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload) return NextResponse.json({ access: [] });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_department_access")
    .select("department_id")
    .eq("user_id", payload.userId);

  if (error) return NextResponse.json({ access: [] });
  return NextResponse.json({ access: data?.map((a) => a.department_id) || [] });
}
