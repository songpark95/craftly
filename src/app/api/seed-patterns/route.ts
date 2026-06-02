import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SEED_PATTERNS } from "@/lib/seed-patterns";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if user already has patterns — skip if so
  const { count } = await supabase
    .from("patterns")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (count && count > 0) {
    return NextResponse.json({ seeded: 0, message: "Patterns already exist" });
  }

  // Insert all seed patterns
  const rows = SEED_PATTERNS.map((p) => ({
    ...p,
    user_id: user.id,
    saved: true,
  }));

  const { data, error } = await supabase.from("patterns").insert(rows).select("id, name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ seeded: data?.length || 0 });
}
