"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import { Search, Plus, Filter, Link as LinkIcon } from "lucide-react";

const MOCK_YARN = [
  { id: "y1", name: "Lettuce", brand: "Malabrigo Rios", color: "#4A7C59", weight: "Worsted", fiber: "Merino", qty: 2, allocated: true, project: "Forest Green Scarf" },
  { id: "y2", name: "Yellow", brand: "Malabrigo Rios", color: "#D4A843", weight: "Worsted", fiber: "Merino", qty: 3, allocated: true, project: "Sunflower Beanie" },
  { id: "y3", name: "Lavanda", brand: "Malabrigo Rios", color: "#8B7AB8", weight: "Worsted", fiber: "Merino", qty: 2, allocated: true, project: "Lavender Amigurumi" },
  { id: "y4", name: "Storm", brand: "Cascade 220", color: "#6B8F9B", weight: "Worsted", fiber: "Wool", qty: 2, allocated: false, project: null },
  { id: "y5", name: "Cream", brand: "Lion Brand", color: "#F5E6CC", weight: "DK", fiber: "Acrylic", qty: 4, allocated: false, project: null },
  { id: "y6", name: "Rose", brand: "Malabrigo Rios", color: "#C47B7B", weight: "Worsted", fiber: "Merino", qty: 1, allocated: false, project: null },
  { id: "y7", name: "Oat", brand: "Cascade 220", color: "#D4C4A8", weight: "Worsted", fiber: "Wool", qty: 3, allocated: true, project: "Cream Baby Blanket" },
  { id: "y8", name: "Sage", brand: "Malabrigo Rios", color: "#8FBF9A", weight: "Worsted", fiber: "Merino", qty: 1, allocated: false, project: null },
];

const WEIGHTS = ["All", "Lace", "Fingering", "Sport", "DK", "Worsted", "Bulky"];

export default function StashPage() {
  const [weightFilter, setWeightFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  const filtered = MOCK_YARN.filter((y) => {
    if (weightFilter !== "All" && y.weight !== weightFilter) return false;
    if (showFreeOnly && y.allocated) return false;
    if (search && !y.name.toLowerCase().includes(search.toLowerCase()) && !y.brand.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalSkeins = MOCK_YARN.reduce((s, y) => s + y.qty, 0);
  const freeSkeins = MOCK_YARN.filter(y => !y.allocated).reduce((s, y) => s + y.qty, 0);

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-serif text-2xl">🧵 Yarn Stash</h1>
            <p className="text-sm font-semibold text-warm-gray">
              {totalSkeins} skeins · {freeSkeins} unallocated
            </p>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-sage px-4 py-2 text-[13px] font-bold text-white transition-all hover:bg-sage-deep">
            <Plus size={14} />
            Add Yarn
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFreeOnly(!showFreeOnly)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-bold border transition-all ${
              showFreeOnly
                ? "bg-sage text-white border-sage"
                : "bg-white text-warm-gray border-warm-wood-pale hover:border-sage"
            }`}
          >
            Free Only
          </button>

          <div className="h-6 w-px bg-warm-wood-pale" />

          {WEIGHTS.map((w) => (
            <button
              key={w}
              onClick={() => setWeightFilter(w)}
              className={`rounded-full px-3 py-1 text-[12px] font-bold transition-all ${
                weightFilter === w
                  ? "bg-sage text-white"
                  : "bg-white text-warm-gray border border-warm-wood-pale hover:border-sage"
              }`}
            >
              {w}
            </button>
          ))}

          <div className="flex-1" />

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search yarn..."
              className="rounded-lg border border-warm-wood-pale bg-white py-1.5 pl-8 pr-3 text-[13px] font-semibold outline-none focus:border-sage w-48"
            />
          </div>
        </div>

        {/* Yarn Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((yarn) => (
            <div
              key={yarn.id}
              className="rounded-2xl bg-white p-4 shadow-soft border border-warm-wood-pale transition-all hover:-translate-y-0.5 hover:shadow-lifted"
            >
              <div className="flex items-start gap-3">
                {/* Color swatch */}
                <div
                  className="h-12 w-12 flex-shrink-0 rounded-xl"
                  style={{ background: yarn.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-extrabold truncate">
                    {yarn.name}
                  </h3>
                  <p className="text-[12px] text-warm-gray">
                    {yarn.brand} · {yarn.weight}
                  </p>
                  <p className="text-[12px] text-warm-gray">
                    {yarn.fiber} · {yarn.qty} skein{yarn.qty > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {yarn.allocated && yarn.project && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-sage-light px-3 py-1.5">
                  <LinkIcon size={12} className="text-sage-deep" />
                  <span className="text-[11px] font-bold text-sage-deep">
                    {yarn.project}
                  </span>
                </div>
              )}

              {!yarn.allocated && (
                <div className="mt-3 rounded-lg bg-warm-bg px-3 py-1.5">
                  <span className="text-[11px] font-bold text-warm-gray">
                    ✨ Free to use
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
