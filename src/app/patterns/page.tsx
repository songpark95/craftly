"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { Search as SearchIcon } from "lucide-react";

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
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-serif text-2xl">📖 Stitch Patterns</h1>
            <p className="text-sm font-semibold text-warm-gray">
              {loading ? "Loading..." : `${savedCount} saved · ${patterns.length} total`}
            </p>
          </div>
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
              className="rounded-lg border border-warm-wood-pale bg-white py-1.5 pl-8 pr-3 text-[13px] font-semibold outline-none focus:border-sage w-48"
            />
          </div>
        </div>

        {/* Pattern Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm font-bold text-warm-gray">Loading patterns...</p>
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
                className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-soft border border-warm-wood-pale transition-all hover:-translate-y-0.5 hover:shadow-lifted"
              >
                <StitchPreview type={pattern.type} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-[15px] font-extrabold">{pattern.name}</h3>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        pattern.type === "knit"
                          ? "bg-sage-light text-sage-deep"
                          : "bg-craft-purple-light text-craft-purple-deep"
                      }`}
                    >
                      {pattern.type}
                    </span>
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
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-wood-pale bg-warm-bg transition-all hover:border-sage hover:bg-sage-light cursor-pointer">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-sage shadow-soft">
                +
              </div>
              <span className="text-sm font-bold text-warm-gray">Add a new pattern</span>
            </div>
          </div>
        )}
      </main>
    </>
  );
}