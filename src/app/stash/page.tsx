"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { Search as SearchIcon, Plus, Link as LinkIcon } from "lucide-react";

interface YarnWithAllocation {
  id: string;
  name: string;
  brand: string | null;
  color_hex: string | null;
  weight: string | null;
  fiber: string | null;
  quantity: number;
  photo_url: string | null;
  allocated: boolean;
  project_name: string | null;
}

const WEIGHTS = ["All", "Lace", "Fingering", "Sport", "DK", "Worsted", "Bulky"];

export default function StashPage() {
  const router = useRouter();
  const supabase = createClient();
  const [yarnList, setYarnList] = useState<YarnWithAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightFilter, setWeightFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/login");
        return;
      }

      // Fetch yarn with project allocation info
      const { data: yarnData } = await supabase
        .from("yarn")
        .select("*, project_yarn!left(project_id, skeins_used), project_yarn!left(project:projects(name))")
        .eq("user_id", user.id)
        .order("name");

      const mapped: YarnWithAllocation[] = (yarnData || []).map((y) => {
        // Get the first allocation
        const py = y.project_yarn?.[0];
        return {
          id: y.id,
          name: y.name,
          brand: y.brand,
          color_hex: y.color_hex,
          weight: y.weight,
          fiber: y.fiber,
          quantity: y.quantity,
          photo_url: y.photo_url,
          allocated: !!py,
          project_name: py?.project?.name || null,
        };
      });

      setYarnList(mapped);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = yarnList.filter((y) => {
    if (weightFilter !== "All" && y.weight !== weightFilter) return false;
    if (showFreeOnly && y.allocated) return false;
    if (
      search &&
      !y.name.toLowerCase().includes(search.toLowerCase()) &&
      !(y.brand && y.brand.toLowerCase().includes(search.toLowerCase()))
    )
      return false;
    return true;
  });

  const totalSkeins = yarnList.reduce((s, y) => s + y.quantity, 0);
  const freeSkeins = yarnList
    .filter((y) => !y.allocated)
    .reduce((s, y) => s + y.quantity, 0);

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-serif text-2xl">🧵 Yarn Stash</h1>
            <p className="text-sm font-semibold text-warm-gray">
              {loading
                ? "Loading..."
                : `${totalSkeins} skeins · ${freeSkeins} unallocated`}
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
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search yarn..."
              className="rounded-lg border border-warm-wood-pale bg-white py-1.5 pl-8 pr-3 text-[13px] font-semibold outline-none focus:border-sage w-48"
            />
          </div>
        </div>

        {/* Yarn Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm font-bold text-warm-gray">Loading stash...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-soft border border-warm-wood-pale">
            <div className="mb-4 text-4xl">🧵</div>
            <h2 className="font-serif text-xl mb-2">No yarn in your stash</h2>
            <p className="text-sm text-warm-gray mb-6 text-center max-w-md">
              Add your first skein to start tracking your yarn stash.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((yarn) => {
              const color = yarn.color_hex || "#6B9E7A";
              return (
                <div
                  key={yarn.id}
                  className="rounded-2xl bg-white p-4 shadow-soft border border-warm-wood-pale transition-all hover:-translate-y-0.5 hover:shadow-lifted"
                >
                  <div className="flex items-start gap-3">
                    {/* Color swatch */}
                    <div
                      className="h-12 w-12 flex-shrink-0 rounded-xl"
                      style={{ background: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-extrabold truncate">
                        {yarn.name}
                      </h3>
                      <p className="text-[12px] text-warm-gray">
                        {[yarn.brand, yarn.weight].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-[12px] text-warm-gray">
                        {[yarn.fiber, `${yarn.quantity} skein${yarn.quantity > 1 ? "s" : ""}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>

                  {yarn.allocated && yarn.project_name && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-sage-light px-3 py-1.5">
                      <LinkIcon size={12} className="text-sage-deep" />
                      <span className="text-[11px] font-bold text-sage-deep">
                        {yarn.project_name}
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
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}