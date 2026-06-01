"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import { Search, BookOpen, Star } from "lucide-react";

const MOCK_PATTERNS = [
  { id: "p1", name: "Seed Stitch", type: "knit", category: "texture", difficulty: 1, description: "Alternating knit and purl. Reversible, lies flat.", saved: true, tags: ["Reversible", "Lies flat"] },
  { id: "p2", name: "Cable Stitch", type: "knit", category: "cable", difficulty: 3, description: "Crossed stitches create a braided rope effect.", saved: true, tags: ["3D texture", "Cable needle"] },
  { id: "p3", name: "Magic Ring", type: "crochet", category: "foundation", difficulty: 2, description: "Adjustable loop for starting in the round. Essential for amigurumi.", saved: true, tags: ["In the round", "Essential"] },
  { id: "p4", name: "Moss Stitch", type: "knit", category: "texture", difficulty: 1, description: "Like seed stitch but shifted every two rows. Denser texture.", saved: false, tags: ["Dense", "Warm"] },
  { id: "p5", name: "Granny Square", type: "crochet", category: "colorwork", difficulty: 2, description: "Classic motif worked in rounds from center out.", saved: true, tags: ["Colorful", "Modular"] },
  { id: "p6", name: "Bobble Stitch", type: "crochet", category: "texture", difficulty: 2, description: "Cluster of stitches creating a raised bump. Playful 3D texture.", saved: false, tags: ["3D bumps", "Playful"] },
  { id: "p7", name: "1×1 Ribbing", type: "knit", category: "edging", difficulty: 1, description: "Stretchy vertical columns. Essential for cuffs and hems.", saved: true, tags: ["Stretchy", "Essential"] },
  { id: "p8", name: "Shell Stitch", type: "crochet", category: "lace", difficulty: 2, description: "Groups of dc fanning from one point. Scalloped, lacy fabric.", saved: false, tags: ["Scalloped", "Drapey"] },
];

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
        [1,0,1,0,1,0],
        [0,1,0,1,0,1],
        [1,0,1,0,1,0],
        [0,1,0,1,0,1],
      ]
    : [
        [0,0,1,1,0,0],
        [0,1,0,0,1,0],
        [1,0,0,0,0,1],
        [0,1,0,0,1,0],
      ];

  return (
    <div
      className="flex h-24 items-center justify-center rounded-t-2xl"
      style={{ background: isKnit ? "var(--sage-light)" : "var(--purple-light)" }}
    >
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 16px)` }}>
        {grid.flat().map((v, i) => (
          <div
            key={i}
            className="h-4 w-4 rounded-[3px]"
            style={{
              background: v
                ? isKnit ? "var(--sage)" : "var(--purple)"
                : isKnit ? "var(--sage-light)" : "var(--purple-light)",
              border: !v ? `1px solid ${isKnit ? "var(--sage)" : "var(--purple)"}` : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function PatternsPage() {
  const [typeFilter, setTypeFilter] = useState<"all" | "knit" | "crochet">("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK_PATTERNS.filter((p) => {
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-serif text-2xl">📖 Stitch Patterns</h1>
            <p className="text-sm font-semibold text-warm-gray">
              {MOCK_PATTERNS.filter((p) => p.saved).length} saved ·{" "}
              {MOCK_PATTERNS.length} total
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTypeFilter("all")}
            className={`rounded-full px-4 py-1.5 text-[13px] font-bold border transition-all ${
              typeFilter === "all" ? "bg-sage text-white border-sage" : "bg-white text-warm-gray border-warm-wood-pale"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter("knit")}
            className={`rounded-full px-4 py-1.5 text-[13px] font-bold border transition-all ${
              typeFilter === "knit" ? "bg-sage text-white border-sage" : "bg-white text-warm-gray border-warm-wood-pale"
            }`}
          >
            🧶 Knit
          </button>
          <button
            onClick={() => setTypeFilter("crochet")}
            className={`rounded-full px-4 py-1.5 text-[13px] font-bold border transition-all ${
              typeFilter === "crochet" ? "bg-craft-purple text-white border-craft-purple" : "bg-white text-warm-gray border-warm-wood-pale"
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
                catFilter === c.key ? "bg-sage-light text-sage-deep border-sage" : "bg-white text-warm-gray border-warm-wood-pale hover:border-sage"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}

          <div className="flex-1" />

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patterns..."
              className="rounded-lg border border-warm-wood-pale bg-white py-1.5 pl-8 pr-3 text-[13px] font-semibold outline-none focus:border-sage w-48"
            />
          </div>
        </div>

        {/* Pattern Grid */}
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
                <div className="flex items-center justify-between border-t border-warm-bg pt-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((d) => (
                      <div
                        key={d}
                        className={`h-2 w-2 rounded-full ${
                          d <= pattern.difficulty ? "bg-sage" : "bg-warm-wood-pale"
                        }`}
                      />
                    ))}
                  </div>
                  {pattern.saved && (
                    <span className="text-[11px] font-bold text-warm-gray">
                      💾 Saved
                    </span>
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
            <span className="text-sm font-bold text-warm-gray">
              Add a new pattern
            </span>
          </div>
        </div>
      </main>
    </>
  );
}
