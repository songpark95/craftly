import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SEED_STITCHES } from "@/lib/seed-stitches";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if user already has stitches — skip if so
  const { count } = await supabase
    .from("stitches")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (count && count > 0) {
    return NextResponse.json({ seeded: 0, message: "Stitches already exist" });
  }

  // Insert all seed stitches
  const rows = SEED_STITCHES.map((s) => ({
    ...s,
    user_id: user.id,
    saved: true,
  }));

  const { data, error } = await supabase.from("stitches").insert(rows).select("id, name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ seeded: data?.length || 0 });
}