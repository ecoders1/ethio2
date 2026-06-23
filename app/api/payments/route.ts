import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function GET(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("payments")
    .select("*, users(full_name, email), departments(name)")
    .order("created_at", { ascending: false });

  if (!payload.isAdmin) {
    query = query.eq("user_id", payload.userId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payments: data });
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { department_id, screenshot_url } = await req.json();
  if (!department_id) return NextResponse.json({ error: "department_id required" }, { status: 400 });

  const supabase = createServerSupabaseClient();

  // Check if already has access
  const { data: existing } = await supabase
    .from("user_department_access")
    .select("id")
    .eq("user_id", payload.userId)
    .eq("department_id", department_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You already have access to this department." }, { status: 409 });
  }

  // Check for pending payment
  const { data: pendingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", payload.userId)
    .eq("department_id", department_id)
    .eq("status", "pending")
    .single();

  if (pendingPayment) {
    return NextResponse.json({ error: "You already have a pending payment for this department." }, { status: 409 });
  }

  // Get price from settings
  const { data: priceSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "department_price")
    .single();

  const amount = priceSetting ? parseFloat(priceSetting.value) : 200;

  const { data, error } = await supabase
    .from("payments")
    .insert({
      id: crypto.randomUUID(),
      user_id: payload.userId,
      department_id,
      amount,
      screenshot_url: screenshot_url || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payment: data }, { status: 201 });
}
