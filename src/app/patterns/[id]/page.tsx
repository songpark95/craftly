"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, FileText, Upload } from "lucide-react";

interface PatternData {
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
  pdf_url: string | null;
  pdf_name: string | null;
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

export default function PatternDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const patternId = params.id as string;

  const [pattern, setPattern] = useState<PatternData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
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
        .from("patterns")
        .select("*")
        .eq("id", patternId)
        .eq("user_id", user.id)
        .single();

      if (!data) {
        router.push("/patterns");
        return;
      }

      setPattern(data);
      setNotes(data.notes || "");
      setLoading(false);
    }
    load();
  }, [patternId]);

  const uploadPdf = async (file: File) => {
    if (!pattern) return;
    setPdfUploading(true);
    setPdfError(null);
    try {
      const ext = file.name.split(".").pop() || "pdf";
      const path = `patterns/${pattern.user_id}/${pattern.id}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("pattern-pdfs")
        .upload(path, file, { upsert: true });

      if (uploadErr) {
        setPdfError(uploadErr.message);
        setPdfUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("pattern-pdfs")
        .getPublicUrl(path);

      await supabase
        .from("patterns")
        .update({
          pdf_url: urlData.publicUrl,
          pdf_name: file.name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pattern.id);

      setPattern({
        ...pattern,
        pdf_url: urlData.publicUrl,
        pdf_name: file.name,
      });
    } catch (err: any) {
      setPdfError(err.message || "Upload failed");
    }
    setPdfUploading(false);
  };

  const removePdf = async () => {
    if (!pattern) return;
    await supabase
      .from("patterns")
      .update({ pdf_url: null, pdf_name: null, updated_at: new Date().toISOString() })
      .eq("id", pattern.id);
    setPattern({ ...pattern, pdf_url: null, pdf_name: null });
  };

  const saveNotes = async () => {
    if (!pattern) return;
    await supabase
      .from("patterns")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", pattern.id);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const toggleSaved = async () => {
    if (!pattern) return;
    const newSaved = !pattern.saved;
    await supabase
      .from("patterns")
      .update({ saved: newSaved, updated_at: new Date().toISOString() })
      .eq("id", pattern.id);
    setPattern({ ...pattern, saved: newSaved });
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

  if (!pattern) return null;

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Back */}
        <Link
          href="/patterns"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-warm-gray transition-colors hover:text-warm-dark"
        >
          <ArrowLeft size={16} />
          Back to patterns
        </Link>

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase ${
                  pattern.type === "knit"
                    ? "bg-sage-light text-sage-deep"
                    : "bg-craft-purple-light text-craft-purple-deep"
                }`}
              >
                {pattern.type}
              </span>
              {pattern.category && (
                <span className="text-[12px] font-bold text-warm-gray">
                  {CATEGORIES[pattern.category] || pattern.category}
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-warm-dark">
              {pattern.name}
            </h1>
            <div className="mt-2 flex items-center gap-4">
              {/* Difficulty dots */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((d) => (
                  <div
                    key={d}
                    className={`h-2.5 w-2.5 rounded-full ${
                      d <= (pattern.difficulty || 1) ? "bg-sage" : "bg-warm-wood-pale"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={toggleSaved}
                className="text-[12px] font-bold text-warm-gray hover:text-warm-dark transition-colors"
              >
                {pattern.saved ? "💾 Saved" : "☆ Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Tags */}
        {pattern.tags && pattern.tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {pattern.tags.map((tag) => (
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
        {(pattern.stitch_key || pattern.chart_data) && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stitch Key */}
            {pattern.stitch_key && (
              <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
                <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                  Stitch Key
                </h2>
                <div className="space-y-2">
                  {pattern.stitch_key.repeat > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-warm-gray w-20 shrink-0">Repeat</span>
                      <span className="text-sm font-semibold text-warm-dark">
                        {pattern.stitch_key.repeat} sts × {pattern.stitch_key.rows} rows
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-bold text-warm-gray w-20 shrink-0 pt-0.5">Note</span>
                    <span className="text-[13px] leading-relaxed text-warm-dark">
                      {pattern.stitch_key.note}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            {pattern.chart_data && pattern.chart_data.length > 0 && (
              <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
                <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                  Chart
                </h2>
                <div className="flex justify-center">
                  <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${pattern.chart_data[0]?.length || 1}, minmax(0, 1fr))` }}>
                    {pattern.chart_data.map((row, ri) =>
                      row.map((cell, ci) => (
                        <div
                          key={`${ri}-${ci}`}
                          className={`flex h-8 w-8 items-center justify-center rounded text-[10px] font-bold border ${
                            cell === "." ? "bg-white text-warm-gray border-warm-wood-pale" :
                            cell === "-" ? "bg-sage-light text-sage-deep border-sage" :
                            cell === "sc" ? "bg-white text-warm-dark border-warm-wood-pale" :
                            cell === "dc" ? "bg-sage-light text-sage-deep border-sage" :
                            cell === "hdc" ? "bg-craft-purple-light text-craft-purple border-craft-purple" :
                            cell === "FP" ? "bg-craft-amber-light text-craft-amber border-craft-amber" :
                            cell === "BO" ? "bg-craft-rose-light text-craft-rose border-craft-rose" :
                            cell === "V" ? "bg-sage-light text-sage-deep border-sage" :
                            cell === "dc3" ? "bg-sage-light text-sage-deep border-sage" :
                            cell === "sh5" ? "bg-sage text-white border-sage-deep" :
                            cell.startsWith("t") ? "bg-craft-purple-light text-craft-purple border-craft-purple" :
                            "bg-white text-warm-gray border-warm-wood-pale"
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
                  {pattern.type === "knit" ? (
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
        {pattern.description && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-warm-dark">
              {pattern.description}
            </p>
          </div>
        )}

        {/* Instructions */}
        {pattern.instructions && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
              Instructions
            </h2>
            <div className="text-sm leading-relaxed text-warm-dark whitespace-pre-wrap">
              {pattern.instructions}
            </div>
          </div>
        )}

        {/* Pattern PDF */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
          <div className="mb-3 flex items-center gap-2">
            <FileText size={16} className="text-warm-gray" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-warm-gray">
              Pattern PDF
            </span>
          </div>

          {pattern.pdf_url ? (
            <div>
              <div className="mb-3 flex items-center justify-between rounded-xl bg-warm-bg px-3 py-2">
                <a
                  href={pattern.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-bold text-sage hover:text-sage-deep truncate max-w-[300px]"
                >
                  {pattern.pdf_name || "Pattern.pdf"}
                </a>
                <button
                  onClick={removePdf}
                  className="text-[11px] font-bold text-craft-rose hover:text-craft-rose-deep transition-colors px-2 py-1"
                >
                  ✕
                </button>
              </div>
              <iframe
                src={pattern.pdf_url}
                className="w-full h-[500px] rounded-xl border-2 border-warm-wood-pale"
                title="Pattern PDF"
              />
            </div>
          ) : (
            <div>
              {pdfError && (
                <div className="mb-3 rounded-xl bg-craft-rose-light px-4 py-2 text-[12px] font-bold text-craft-rose">
                  {pdfError}
                </div>
              )}
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-warm-wood-pale bg-warm-bg px-6 py-8 cursor-pointer transition-all hover:border-sage hover:bg-sage-light">
                {pdfUploading ? (
                  <span className="text-sm font-bold text-warm-gray">Uploading...</span>
                ) : (
                  <>
                    <Upload size={24} className="mb-2 text-warm-gray" />
                    <span className="text-sm font-bold text-warm-gray">
                      Upload pattern PDF
                    </span>
                    <span className="text-[11px] text-warm-gray mt-1">
                      JPG, PNG, or PDF · max 10MB
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadPdf(f);
                    e.target.value = "";
                  }}
                  disabled={pdfUploading}
                />
              </label>
            </div>
          )}
        </div>

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
            placeholder="Personal notes about this pattern..."
            className="min-h-[100px] w-full resize-y rounded-xl border-2 border-warm-wood-pale bg-warm-bg p-4 text-sm leading-relaxed text-warm-dark outline-none transition-colors focus:border-sage"
          />
        </div>
      </main>
    </>
  );
}
