"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, FileText } from "lucide-react";

interface StitchData {
  id: string;
  name: string;
  type: string;
  category: string | null;
  difficulty: number;
  description: string | null;
  instructions: string | null;
  notes: string | null;
  saved: boolean;
  tags: string[] | null;
  stitch_key: { repeat: number; rows: number; note: string } | null;
  chart_data: string[][] | null;
  user_id: string;
}

const CATEGORIES: Record<string, string> = {
  texture: "✨ Texture",
  cable: "⚡ Cable",
  lace: "🌸 Lace",
  colorwork: "🎨 Colorwork",
  foundation: "🌀 Foundation",
  edging: "🧩 Edging",
};

export default function StitchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const stitchId = params.id as string;

  const [stitch, setStitch] = useState<StitchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("stitches")
        .select("*")
        .eq("id", stitchId)
        .eq("user_id", user.id)
        .single();

      if (!data) {
        router.push("/stitches");
        return;
      }

      setStitch(data);
      setNotes(data.notes || "");
      setLoading(false);
    }
    load();
  }, [stitchId]);

  const saveNotes = async () => {
    if (!stitch) return;
    await supabase
      .from("stitches")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", stitch.id);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const toggleSaved = async () => {
    if (!stitch) return;
    const newSaved = !stitch.saved;
    await supabase
      .from("stitches")
      .update({ saved: newSaved, updated_at: new Date().toISOString() })
      .eq("id", stitch.id);
    setStitch({ ...stitch, saved: newSaved });
  };

  if (loading) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-warm-wood-pale" />
            <div className="h-10 w-64 rounded bg-warm-wood-pale" />
            <div className="h-48 rounded-2xl bg-warm-wood-pale" />
          </div>
        </main>
      </>
    );
  }

  if (!stitch) return null;

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Back */}
        <Link
          href="/stitches"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-warm-gray transition-colors hover:text-warm-dark"
        >
          <ArrowLeft size={16} />
          Back to stitches
        </Link>

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase ${
                  stitch.type === "knit"
                    ? "bg-sage-light text-sage-deep"
                    : "bg-craft-purple-light text-craft-purple-deep"
                }`}
              >
                {stitch.type}
              </span>
              {stitch.category && (
                <span className="text-[12px] font-bold text-warm-gray">
                  {CATEGORIES[stitch.category] || stitch.category}
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-warm-dark">
              {stitch.name}
            </h1>
            <div className="mt-2 flex items-center gap-4">
              {/* Difficulty dots */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((d) => (
                  <div
                    key={d}
                    className={`h-2.5 w-2.5 rounded-full ${
                      d <= (stitch.difficulty || 1) ? "bg-sage" : "bg-warm-wood-pale"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={toggleSaved}
                className="text-[12px] font-bold text-warm-gray hover:text-warm-dark transition-colors"
              >
                {stitch.saved ? "💾 Saved" : "☆ Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Tags */}
        {stitch.tags && stitch.tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {stitch.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-warm-bg px-2.5 py-1 text-[11px] font-bold text-warm-gray border border-warm-wood-pale"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stitch Key + Chart Row */}
        {(stitch.stitch_key || stitch.chart_data) && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stitch Key */}
            {stitch.stitch_key && (
              <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
                <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                  Stitch Key
                </h2>
                <div className="space-y-2">
                  {stitch.stitch_key.repeat > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-warm-gray w-20 shrink-0">Repeat</span>
                      <span className="text-sm font-semibold text-warm-dark">
                        {stitch.stitch_key.repeat} sts × {stitch.stitch_key.rows} rows
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-bold text-warm-gray w-20 shrink-0 pt-0.5">Note</span>
                    <span className="text-[13px] leading-relaxed text-warm-dark">
                      {stitch.stitch_key.note}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            {stitch.chart_data && stitch.chart_data.length > 0 && (
              <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
                <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                  Chart
                </h2>
                <div className="flex justify-center">
                  <div
                    className="inline-grid gap-[2px]"
                    style={{
                      gridTemplateColumns: `repeat(${stitch.chart_data[0]?.length || 1}, minmax(0, 1fr))`,
                    }}
                  >
                    {stitch.chart_data.map((row, ri) =>
                      row.map((cell, ci) => (
                        <div
                          key={`${ri}-${ci}`}
                          className={`flex h-8 w-8 items-center justify-center rounded text-[10px] font-bold border ${
                            cell === "."
                              ? "bg-white text-warm-gray border-warm-wood-pale"
                              : cell === "-"
                              ? "bg-sage-light text-sage-deep border-sage"
                              : cell === "sc"
                              ? "bg-white text-warm-dark border-warm-wood-pale"
                              : cell === "dc"
                              ? "bg-sage-light text-sage-deep border-sage"
                              : cell === "hdc"
                              ? "bg-craft-purple-light text-craft-purple border-craft-purple"
                              : cell === "FP"
                              ? "bg-craft-amber-light text-craft-amber border-craft-amber"
                              : cell === "BO"
                              ? "bg-craft-rose-light text-craft-rose border-craft-rose"
                              : cell === "V"
                              ? "bg-sage-light text-sage-deep border-sage"
                              : cell === "dc3"
                              ? "bg-sage-light text-sage-deep border-sage"
                              : cell === "sh5"
                              ? "bg-sage text-white border-sage-deep"
                              : cell.startsWith("t")
                              ? "bg-craft-purple-light text-craft-purple border-craft-purple"
                              : "bg-white text-warm-gray border-warm-wood-pale"
                          }`}
                          title={cell}
                        >
                          {cell}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  {stitch.type === "knit" ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warm-gray">
                        <span className="inline-block h-3 w-3 rounded border border-warm-wood-pale bg-white" /> knit (RS)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warm-gray">
                        <span className="inline-block h-3 w-3 rounded border border-sage bg-sage-light" /> purl (RS)
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warm-gray">
                        <span className="inline-block h-3 w-3 rounded border border-warm-wood-pale bg-white" /> sc
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warm-gray">
                        <span className="inline-block h-3 w-3 rounded border border-sage bg-sage-light" /> dc
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warm-gray">
                        <span className="inline-block h-3 w-3 rounded border border-craft-purple bg-craft-purple-light" /> hdc/cluster
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {stitch.description && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-warm-dark">
              {stitch.description}
            </p>
          </div>
        )}

        {/* Instructions */}
        {stitch.instructions && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
              Instructions
            </h2>
            <div className="text-sm leading-relaxed text-warm-dark whitespace-pre-wrap">
              {stitch.instructions}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-warm-gray">
              Notes
            </h2>
            <button
              onClick={saveNotes}
              className="text-[12px] font-bold text-sage hover:text-sage-deep transition-colors"
            >
              {notesSaved ? "✓ Saved" : "Save"}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Personal notes about this stitch..."
            className="min-h-[100px] w-full resize-y rounded-xl border-2 border-warm-wood-pale bg-warm-bg p-4 text-sm leading-relaxed text-warm-dark outline-none transition-colors focus:border-sage"
          />
        </div>
      </main>
    </>
  );
}
