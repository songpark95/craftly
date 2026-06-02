"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { PatternCardSkeleton } from "@/components/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { Search as SearchIcon } from "lucide-react";

interface Stitch {
  id: string;
  name: string;
  type: string;
  category: string | null;
  difficulty: number;
  description: string | null;
  url: string | null;
  saved: boolean;
  tags: string[] | null;
  user_id: string;
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

export default function StitchesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [stitches, setStitches] = useState<Stitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "knit" | "crochet">("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Menu / Delete state
  const [editingStitchId, setEditingStitchId] = useState<string | null>(null);
  const [stitchToDelete, setStitchToDelete] = useState<string | null>(null);

  const refreshStitches = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("stitches")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    setStitches(data || []);
  };

  const deleteStitch = async () => {
    if (!stitchToDelete) return;
    try {
      const { error } = await supabase.from("stitches").delete().eq("id", stitchToDelete);
      if (error) {
        console.error("Failed to delete stitch:", error);
        return;
      }
      await refreshStitches();
      setStitchToDelete(null);
    } catch (error) {
      console.error("Failed to delete stitch:", error);
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
        .from("stitches")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      // Auto-seed if user has no stitches yet
      if (!data || data.length === 0) {
        await fetch("/api/seed-stitches", { method: "POST" });
        const { data: seeded } = await supabase
          .from("stitches")
          .select("*")
          .eq("user_id", user.id)
          .order("name");
        setStitches(seeded || []);
      } else {
        setStitches(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = stitches.filter((s) => {
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    if (catFilter !== "all" && s.category !== catFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const savedCount = stitches.filter((s) => s.saved).length;

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl mb-1">🧵 Stitch Library</h1>
          <p className="text-sm font-semibold text-warm-gray mb-4">
            {loading ? "Loading..." : `${savedCount} saved · ${stitches.length} total`}
          </p>
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
              placeholder="Search stitches..."
              className="rounded-lg border border-warm-wood-pale bg-white py-2 pl-8 pr-3 text-[13px] font-semibold outline-none focus:border-sage w-full max-w-xs"
            />
          </div>
        </div>

        {/* Stitch Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <PatternCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-soft border border-warm-wood-pale">
            <div className="mb-4 text-4xl">🧵</div>
            <h2 className="font-serif text-xl mb-2">No stitches yet</h2>
            <p className="text-sm text-warm-gray mb-6 text-center max-w-md">
              Save your favorite stitch techniques to reference them later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((stitch) => (
              <Link
                key={stitch.id}
                href={`/stitches/${stitch.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-soft border border-warm-wood-pale transition-all hover:-translate-y-0.5 hover:shadow-lifted block"
              >
                <StitchPreview type={stitch.type} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <h3 className="text-[15px] font-extrabold truncate min-w-0 flex-1">{stitch.name}</h3>
                    <div className="flex items-center gap-1">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          stitch.type === "knit"
                            ? "bg-sage-light text-sage-deep"
                            : "bg-craft-purple-light text-craft-purple-deep"
                        }`}
                      >
                        {stitch.type}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStitchId(editingStitchId === stitch.id ? null : stitch.id);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-warm-gray hover:bg-warm-bg active:scale-95"
                        >
                          ⋯
                        </button>
                        {editingStitchId === stitch.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setEditingStitchId(null)} />
                            <div className="absolute right-0 top-full z-40 mt-1 w-36 rounded-xl bg-white py-1 shadow-lifted border border-warm-wood-pale">
                              <button
                                onClick={() => { setStitchToDelete(stitch.id); setEditingStitchId(null); }}
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
                    {stitch.description}
                  </p>
                  {stitch.tags && stitch.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {stitch.tags.map((tag) => (
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
                            d <= (stitch.difficulty || 1) ? "bg-sage" : "bg-warm-wood-pale"
                          }`}
                        />
                      ))}
                    </div>
                    {stitch.saved && (
                      <span className="text-[11px] font-bold text-warm-gray">💾 Saved</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Delete Stitch Confirmation */}
      {stitchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale text-center">
            <div className="mb-3 text-4xl">🗑</div>
            <h2 className="font-serif text-lg font-semibold mb-2">Delete this stitch?</h2>
            <p className="text-[13px] text-warm-gray mb-5">This will permanently remove it from your library.</p>
            <div className="flex gap-3">
              <button onClick={() => setStitchToDelete(null)} className="flex-1 rounded-xl border-2 border-warm-wood-pale bg-white py-2.5 text-sm font-bold text-warm-gray hover:bg-warm-bg transition-colors">Cancel</button>
              <button onClick={deleteStitch} className="flex-1 rounded-xl bg-craft-rose py-2.5 text-sm font-extrabold text-white hover:bg-craft-rose-deep transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}