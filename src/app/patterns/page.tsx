"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { PatternCardSkeleton } from "@/components/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { Search as SearchIcon, Plus } from "lucide-react";

interface Pattern {
  id: string;
  name: string;
  type: string;
  category: string | null;
  difficulty: number;
  description: string | null;
  url: string | null;
  saved: boolean;
  tags: string[] | null;
}

const CATEGORIES = [
  { key: "all", label: "All", emoji: "✨" },
  { key: "texture", label: "Texture", emoji: "🌿" },
  { key: "cable", label: "Cable", emoji: "⚡" },
  { key: "lace", label: "Lace", emoji: "🌸" },
  { key: "colorwork", label: "Colorwork", emoji: "🎨" },
  { key: "foundation", label: "Foundation", emoji: "🌀" },
  { key: "edging", label: "Edging", emoji: "🧩" },
];

function StitchPreview({ type }: { type: string }) {
  const isKnit = type === "knit";
  const grid = isKnit
    ? [
        [1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1],
      ]
    : [
        [0, 0, 1, 1, 0, 0],
        [0, 1, 0, 0, 1, 0],
        [1, 0, 0, 0, 0, 1],
        [0, 1, 0, 0, 1, 0],
      ];

  return (
    <div
      className="flex h-24 items-center justify-center rounded-t-2xl"
      style={{
        background: isKnit ? "var(--sage-light)" : "var(--purple-light)",
      }}
    >
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${grid[0].length}, 16px)` }}
      >
        {grid.flat().map((v, i) => (
          <div
            key={i}
            className="h-4 w-4 rounded-[3px]"
            style={{
              background: v
                ? isKnit
                  ? "var(--sage)"
                  : "var(--purple)"
                : isKnit
                ? "var(--sage-light)"
                : "var(--purple-light)",
              border: !v
                ? `1px solid ${isKnit ? "var(--sage)" : "var(--purple)"}`
                : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function PatternsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "knit" | "crochet">("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Edit/Delete patterns
  const [editingPatternId, setEditingPatternId] = useState<string | null>(null);
  const [showEditPattern, setShowEditPattern] = useState(false);
  const [editPatternName, setEditPatternName] = useState("");
  const [editPatternType, setEditPatternType] = useState<"knit" | "crochet">("knit");
  const [editPatternCategory, setEditPatternCategory] = useState("");
  const [editPatternDifficulty, setEditPatternDifficulty] = useState(1);
  const [editPatternDescription, setEditPatternDescription] = useState("");
  const [editPatternSaving, setEditPatternSaving] = useState(false);
  const [patternToDelete, setPatternToDelete] = useState<string | null>(null);

  const refreshPatterns = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("patterns")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    setPatterns(data || []);
  };

  const openEditPattern = (p: Pattern) => {
    setEditingPatternId(p.id);
    setEditPatternName(p.name);
    setEditPatternType(p.type as "knit" | "crochet");
    setEditPatternCategory(p.category || "");
    setEditPatternDifficulty(p.difficulty || 1);
    setEditPatternDescription(p.description || "");
    setShowEditPattern(true);
  };

  const saveEditPattern = async () => {
    if (!editingPatternId || !editPatternName.trim()) return;
    setEditPatternSaving(true);
    await supabase
      .from("patterns")
      .update({
        name: editPatternName.trim(),
        type: editPatternType,
        category: editPatternCategory || null,
        difficulty: editPatternDifficulty,
        description: editPatternDescription.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingPatternId);
    await refreshPatterns();
    setShowEditPattern(false);
    setEditingPatternId(null);
    setEditPatternSaving(false);
  };

  const deletePattern = async () => {
    if (!patternToDelete) return;
    try {
      const { error } = await supabase.from("patterns").delete().eq("id", patternToDelete);
      if (error) {
        console.error("Failed to delete pattern:", error);
        return;
      }
      await refreshPatterns();
      setPatternToDelete(null);
    } catch (error) {
      console.error("Failed to delete pattern:", error);
    }
  };

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
        .eq("user_id", user.id)
        .order("name");

      setPatterns(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = patterns.filter((p) => {
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const savedCount = patterns.filter((p) => p.saved).length;

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl mb-1">📖 Stitch Patterns</h1>
          <p className="text-sm font-semibold text-warm-gray mb-4">
            {loading ? "Loading..." : `${savedCount} saved · ${patterns.length} total`}
          </p>
          <Link
            href="/patterns/new"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-sage px-6 py-4 text-base font-extrabold text-white shadow-soft transition-all hover:bg-sage-deep hover:-translate-y-0.5 hover:shadow-lifted active:scale-[0.98]"
          >
            <Plus size={20} />
            Add Pattern
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTypeFilter("all")}
            className={`rounded-full px-4 py-1.5 text-[13px] font-bold border transition-all ${
              typeFilter === "all"
                ? "bg-sage text-white border-sage"
                : "bg-white text-warm-gray border-warm-wood-pale"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter("knit")}
            className={`rounded-full px-4 py-1.5 text-[13px] font-bold border transition-all ${
              typeFilter === "knit"
                ? "bg-sage text-white border-sage"
                : "bg-white text-warm-gray border-warm-wood-pale"
            }`}
          >
            🧶 Knit
          </button>
          <button
            onClick={() => setTypeFilter("crochet")}
            className={`rounded-full px-4 py-1.5 text-[13px] font-bold border transition-all ${
              typeFilter === "crochet"
                ? "bg-craft-purple text-white border-craft-purple"
                : "bg-white text-warm-gray border-warm-wood-pale"
            }`}
          >
            🪝 Crochet
          </button>

          <div className="h-6 w-px bg-warm-wood-pale mx-1" />

          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCatFilter(c.key)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-bold border transition-all ${
                catFilter === c.key
                  ? "bg-sage-light text-sage-deep border-sage"
                  : "bg-white text-warm-gray border-warm-wood-pale hover:border-sage"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}

          <div className="flex-1" />

          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patterns..."
              className="rounded-lg border border-warm-wood-pale bg-white py-2 pl-8 pr-3 text-[13px] font-semibold outline-none focus:border-sage w-full max-w-xs"
            />
          </div>
        </div>

        {/* Pattern Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <PatternCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-soft border border-warm-wood-pale">
            <div className="mb-4 text-4xl">📖</div>
            <h2 className="font-serif text-xl mb-2">No patterns yet</h2>
            <p className="text-sm text-warm-gray mb-6 text-center max-w-md">
              Save your favorite stitch patterns to reference them later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((pattern) => (
              <div
                key={pattern.id}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-soft border border-warm-wood-pale transition-all hover:-translate-y-0.5 hover:shadow-lifted"
              >
                <StitchPreview type={pattern.type} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <h3 className="text-[15px] font-extrabold truncate min-w-0 flex-1">{pattern.name}</h3>
                    <div className="flex items-center gap-1">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          pattern.type === "knit"
                            ? "bg-sage-light text-sage-deep"
                            : "bg-craft-purple-light text-craft-purple-deep"
                        }`}
                      >
                        {pattern.type}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPatternId(editingPatternId === pattern.id ? null : pattern.id);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-warm-gray hover:bg-warm-bg active:scale-95"
                        >
                          ⋯
                        </button>
                        {editingPatternId === pattern.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setEditingPatternId(null)} />
                            <div className="absolute right-0 top-full z-40 mt-1 w-36 rounded-xl bg-white py-1 shadow-lifted border border-warm-wood-pale">
                              <button
                                onClick={() => { openEditPattern(pattern); setEditingPatternId(null); }}
                                className="w-full px-3 py-2 text-left text-[13px] font-bold text-warm-dark hover:bg-warm-bg"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => { setPatternToDelete(pattern.id); setEditingPatternId(null); }}
                                className="w-full px-3 py-2 text-left text-[13px] font-bold text-craft-rose hover:bg-craft-rose-light"
                              >
                                🗑 Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-[12px] text-warm-gray mb-3 leading-relaxed">
                    {pattern.description}
                  </p>
                  {pattern.tags && pattern.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {pattern.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-warm-bg px-2 py-0.5 text-[10px] font-bold text-warm-gray"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-warm-bg pt-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <div
                          key={d}
                          className={`h-2 w-2 rounded-full ${
                            d <= (pattern.difficulty || 1) ? "bg-sage" : "bg-warm-wood-pale"
                          }`}
                        />
                      ))}
                    </div>
                    {pattern.saved && (
                      <span className="text-[11px] font-bold text-warm-gray">💾 Saved</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add Pattern Card */}
            <Link href="/patterns/new">
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-wood-pale bg-warm-bg transition-all hover:border-sage hover:bg-sage-light cursor-pointer">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-sage shadow-soft">
                  +
                </div>
                <span className="text-sm font-bold text-warm-gray">Add a new pattern</span>
              </div>
            </Link>
          </div>
        )}
      </main>

      {/* Edit Pattern Modal */}
      {showEditPattern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">Edit Pattern</h2>
              <button onClick={() => setShowEditPattern(false)} className="rounded-lg p-1 text-warm-gray hover:bg-warm-bg">✕</button>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">Name <span className="text-craft-rose">*</span></label>
              <input type="text" value={editPatternName} onChange={(e) => setEditPatternName(e.target.value)} className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage" />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">Type</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditPatternType("knit")} className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${editPatternType === "knit" ? "border-sage bg-sage/10 text-sage" : "border-warm-wood-pale bg-warm-bg text-warm-gray hover:border-warm-gray"}`}>🧶 Knit</button>
                <button type="button" onClick={() => setEditPatternType("crochet")} className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${editPatternType === "crochet" ? "border-craft-purple bg-craft-purple/10 text-craft-purple" : "border-warm-wood-pale bg-warm-bg text-warm-gray hover:border-warm-gray"}`}>🧵 Crochet</button>
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter(c => c.key !== "all").map((c) => (
                  <button key={c.key} type="button" onClick={() => setEditPatternCategory(editPatternCategory === c.key ? "" : c.key)} className={`rounded-xl border-2 px-3 py-1.5 text-[12px] font-bold transition-all ${editPatternCategory === c.key ? "border-sage bg-sage/10 text-sage" : "border-warm-wood-pale bg-warm-bg text-warm-gray hover:border-warm-gray"}`}>{c.emoji} {c.label}</button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">Difficulty</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button key={d} type="button" onClick={() => setEditPatternDifficulty(d)} className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all ${d <= editPatternDifficulty ? "border-sun bg-sun/10 text-sun" : "border-warm-wood-pale bg-warm-bg text-warm-gray hover:border-warm-gray"}`}>★</button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">Description</label>
              <textarea value={editPatternDescription} onChange={(e) => setEditPatternDescription(e.target.value)} rows={3} className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage resize-none" />
            </div>
            <button onClick={saveEditPattern} disabled={editPatternSaving || !editPatternName.trim()} className="w-full rounded-xl bg-sage py-3 text-sm font-extrabold text-white transition-all hover:bg-sage-deep disabled:opacity-50">
              {editPatternSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Delete Pattern Confirmation */}
      {patternToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale text-center">
            <div className="mb-3 text-4xl">🗑</div>
            <h2 className="font-serif text-lg font-semibold mb-2">Delete this pattern?</h2>
            <p className="text-[13px] text-warm-gray mb-5">This will permanently remove it from your library.</p>
            <div className="flex gap-3">
              <button onClick={() => setPatternToDelete(null)} className="flex-1 rounded-xl border-2 border-warm-wood-pale bg-white py-2.5 text-sm font-bold text-warm-gray hover:bg-warm-bg transition-colors">Cancel</button>
              <button onClick={deletePattern} className="flex-1 rounded-xl bg-craft-rose py-2.5 text-sm font-extrabold text-white hover:bg-craft-rose-deep transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}