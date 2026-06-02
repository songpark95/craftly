#!/usr/bin/env node
/**
 * Craftly Pattern Seed Script
 * 
 * Signs in with test credentials, then inserts all starter patterns.
 * Run: node seed/run.js
 * 
 * Requires: SUPABASE_URL, SUPABASE_ANON_KEY in env or .env.local
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load env from .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...rest] = trimmed.split("=");
      env[key] = rest.join("=");
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = process.env.SEED_EMAIL || "song@craftly.test";
const PASSWORD = process.env.SEED_PASSWORD || "craftly123";

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function main() {
  console.log(`Signing in as ${EMAIL}...`);
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });

  if (authError) {
    console.error("Auth failed:", authError.message);
    process.exit(1);
  }

  const userId = auth.user.id;
  console.log(`User ID: ${userId}`);

  // Load patterns
  const patternsPath = path.join(__dirname, "patterns.json");
  const patterns = JSON.parse(fs.readFileSync(patternsPath, "utf8"));
  console.log(`Loaded ${patterns.length} patterns`);

  // Check which patterns already exist
  const { data: existing } = await supabase
    .from("patterns")
    .select("name")
    .eq("user_id", userId);

  const existingNames = new Set((existing || []).map((p) => p.name));
  const toInsert = patterns
    .filter((p) => !existingNames.has(p.name))
    .map((p) => ({
      ...p,
      user_id: userId,
      saved: true,
    }));

  if (toInsert.length === 0) {
    console.log("All patterns already seeded. Nothing to do.");
    return;
  }

  console.log(`Inserting ${toInsert.length} new patterns...`);

  // Batch insert (Supabase handles up to 1000 rows per request)
  const { data, error } = await supabase.from("patterns").insert(toInsert).select("id, name");

  if (error) {
    console.error("Insert failed:", error.message);
    console.error("Details:", error.details);
    process.exit(1);
  }

  console.log(`\nSeeded ${data.length} patterns:`);
  data.forEach((p) => console.log(`  ✓ ${p.name} (${p.id})`));
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
