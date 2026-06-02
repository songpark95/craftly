"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { YarnCardSkeleton } from "@/components/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { Search as SearchIcon, Plus, Link as LinkIcon, X, Camera } from "lucide-react";
import { searchYarnTemplates, YarnTemplate } from "@/lib/yarn-templates";

interface ScannedYarn {
  name: string;
  brand: string;
  weight: string;
  fiber: string;
  color_hex: string;
  color_name: string;
  yardage_per_skein: number | null;
  quantity_estimate: number;
  confidence: "high" | "medium" | "low";
  notes: string;
}

const PRESET_COLORS = [
  "#4A7C59", "#D4A843", "#7B5EA7", "#C9707D",
  "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#EC4899", "#10B981", "#F97316",
];

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

  // Add Yarn modal state
  const [showAddYarn, setShowAddYarn] = useState(false);
  const [yarnName, setYarnName] = useState("");
  const [yarnBrand, setYarnBrand] = useState("");
  const [yarnColor, setYarnColor] = useState(PRESET_COLORS[0]);
  const [yarnWeight, setYarnWeight] = useState("");
  const [yarnFiber, setYarnFiber] = useState("");
  const [yarnQuantity, setYarnQuantity] = useState(1);
  const [yarnYardage, setYarnYardage] = useState("");
  const [yarnSaving, setYarnSaving] = useState(false);
  const [yarnError, setYarnError] = useState<string | null>(null);
  const [yarnSuggestions, setYarnSuggestions] = useState<YarnTemplate[]>([]);

  // Edit/Delete yarn
  const [editingYarnId, setEditingYarnId] = useState<string | null>(null);
  const [showEditYarn, setShowEditYarn] = useState(false);
  const [editYarnName, setEditYarnName] = useState("");
  const [editYarnBrand, setEditYarnBrand] = useState("");
  const [editYarnColor, setEditYarnColor] = useState(PRESET_COLORS[0]);
  const [editYarnWeight, setEditYarnWeight] = useState("");
  const [editYarnFiber, setEditYarnFiber] = useState("");
  const [editYarnQuantity, setEditYarnQuantity] = useState(1);
  const [editYarnSaving, setEditYarnSaving] = useState(false);
  const [yarnToDelete, setYarnToDelete] = useState<string | null>(null);

  // Photo scan state
  const [showScan, setShowScan] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResults, setScanResults] = useState<ScannedYarn[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSavingId, setScanSavingId] = useState<number | null>(null);
  const [savedScans, setSavedScans] = useState<Set<number>>(new Set());
  const scanInputRef = useRef<HTMLInputElement>(null);

  const refreshYarnList = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: yarnData } = await supabase
      .from("yarn")
      .select("*, project_yarn!left(project_id, quantity_used, project:projects(name))")
      .eq("user_id", user.id)
      .order("name");
    const mapped: YarnWithAllocation[] = (yarnData || []).map((y) => {
      const py = y.project_yarn?.[0];
      return {
        id: y.id, name: y.name, brand: y.brand, color_hex: y.color_hex,
        weight: y.weight, fiber: y.fiber, quantity: y.quantity,
        photo_url: y.photo_url, allocated: !!py, project_name: py?.project?.name || null,
      };
    });
    setYarnList(mapped);
  };

  const resetYarnForm = () => {
    setYarnName("");
    setYarnBrand("");
    setYarnColor(PRESET_COLORS[0]);
    setYarnWeight("");
    setYarnFiber("");
    setYarnQuantity(1);
    setYarnYardage("");
    setYarnError(null);
    setYarnSuggestions([]);
  };

  const applyTemplate = (t: YarnTemplate) => {
    setYarnName(`${t.brand} ${t.name}`);
    setYarnBrand(t.brand);
    setYarnWeight(t.weight);
    setYarnFiber(t.fiber);
    if (t.colors.length > 0) setYarnColor(t.colors[0]);
    if (t.yardage_per_skein) setYarnYardage(String(t.yardage_per_skein));
    setYarnSuggestions([]);
  };

  const handleYarnNameChange = (val: string) => {
    setYarnName(val);
    setYarnSuggestions(searchYarnTemplates(val));
  };

  // Photo scan functions
  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 data URL
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setScanImage(dataUrl);
      setShowScan(true);
      setScanLoading(true);
      setScanError(null);
      setScanResults([]);
      setSavedScans(new Set());

      try {
        const res = await fetch("/api/recognize-yarn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
        const data = await res.json();
        if (data.error) {
          setScanError(data.error);
        } else {
          setScanResults(data.yarns || []);
        }
      } catch {
        setScanError("Failed to analyze photo. Try again.");
      } finally {
        setScanLoading(false);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const saveScanYarn = async (yarn: ScannedYarn, index: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setScanSavingId(index);
    const { error } = await supabase.from("yarn").insert({
      user_id: user.id,
      name: yarn.name !== "Unknown" ? yarn.name : yarn.color_name || "Unknown Yarn",
      brand: yarn.brand !== "Unknown" ? yarn.brand : null,
      color_hex: yarn.color_hex || PRESET_COLORS[0],
      weight: yarn.weight !== "Unknown" ? yarn.weight.toLowerCase() : null,
      fiber: yarn.fiber !== "Unknown" ? yarn.fiber : null,
      yardage: yarn.yardage_per_skein || null,
      quantity: yarn.quantity_estimate || 1,
    });

    if (!error) {
      setSavedScans((prev) => new Set([...prev, index]));
      await refreshYarnList();
    }
    setScanSavingId(null);
  };

  const resetScan = () => {
    setShowScan(false);
    setScanImage(null);
    setScanResults([]);
    setScanError(null);
    setSavedScans(new Set());
  };

  const handleAddYarn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yarnName.trim()) {
      setYarnError("Give your yarn a name");
      return;
    }
    setYarnSaving(true);
    setYarnError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setYarnError("Not authenticated");
      setYarnSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("yarn").insert({
      name: yarnName.trim(),
      brand: yarnBrand.trim() || null,
      color_hex: yarnColor,
      weight: yarnWeight || null,
      fiber: yarnFiber.trim() || null,
      quantity: yarnQuantity,
      yardage_per_skein: yarnYardage ? parseFloat(yarnYardage) : null,
      user_id: user.id,
    });

    if (insertError) {
      setYarnError(insertError.message);
      setYarnSaving(false);
      return;
    }

    // Refresh yarn list
    const { data: yarnData } = await supabase
      .from("yarn")
      .select("*, project_yarn!left(project_id, quantity_used, project:projects(name))")
      .eq("user_id", user.id)
      .order("name");

    const mapped: YarnWithAllocation[] = (yarnData || []).map((y) => {
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
    setShowAddYarn(false);
    resetYarnForm();
    setYarnSaving(false);
  };

  const openEditYarn = (y: YarnWithAllocation) => {
    setEditingYarnId(y.id);
    setEditYarnName(y.name);
    setEditYarnBrand(y.brand || "");
    setEditYarnColor(y.color_hex || PRESET_COLORS[0]);
    setEditYarnWeight(y.weight || "");
    setEditYarnFiber(y.fiber || "");
    setEditYarnQuantity(y.quantity);
    setShowEditYarn(true);
  };

  const saveEditYarn = async () => {
    if (!editingYarnId || !editYarnName.trim()) return;
    setEditYarnSaving(true);
    await supabase
      .from("yarn")
      .update({
        name: editYarnName.trim(),
        brand: editYarnBrand.trim() || null,
        color_hex: editYarnColor,
        weight: editYarnWeight || null,
        fiber: editYarnFiber.trim() || null,
        quantity: editYarnQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingYarnId);
    await refreshYarnList();
    setShowEditYarn(false);
    setEditingYarnId(null);
    setEditYarnSaving(false);
  };

  const deleteYarn = async () => {
    if (!yarnToDelete) return;
    try {
      const { error } = await supabase.from("yarn").delete().eq("id", yarnToDelete);
      if (error) {
        console.error("Failed to delete yarn:", error);
        return;
      }
      await refreshYarnList();
      setYarnToDelete(null);
    } catch (error) {
      console.error("Failed to delete yarn:", error);
    }
  };

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
        .select("*, project_yarn!left(project_id, quantity_used, project:projects(name))")
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
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl mb-1">🧵 Yarn Stash</h1>
          <p className="text-sm font-semibold text-warm-gray mb-4">
            {loading
              ? "Loading..."
              : `${totalSkeins} skeins · ${freeSkeins} unallocated`}
          </p>
          <button
            onClick={() => { resetYarnForm(); setShowAddYarn(true); }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-sage px-6 py-4 text-base font-extrabold text-white shadow-soft transition-all hover:bg-sage-deep hover:-translate-y-0.5 hover:shadow-lifted active:scale-[0.98]"
          >
            <Plus size={20} />
            Add Yarn to Stash
          </button>
          <button
            onClick={() => scanInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sage bg-sage-light px-6 py-3 text-sm font-extrabold text-sage transition-all hover:bg-sage/10 active:scale-[0.98]"
          >
            <Camera size={18} />
            Scan Photo to Add Yarn
          </button>
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleScanFile}
            className="hidden"
          />
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
              className="rounded-lg border border-warm-wood-pale bg-white py-2 pl-8 pr-3 text-[13px] font-semibold outline-none focus:border-sage w-full max-w-xs"
            />
          </div>
        </div>

        {/* Yarn Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <YarnCardSkeleton key={i} />
            ))}
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
                  className="relative rounded-2xl bg-white p-4 shadow-soft border border-warm-wood-pale transition-all hover:-translate-y-0.5 hover:shadow-lifted"
                >
                  <div className="flex items-start gap-3">
                    {/* Color swatch */}
                    <div
                      className="h-12 w-12 flex-shrink-0 rounded-xl"
                      style={{ background: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="text-[14px] font-extrabold truncate">
                          {yarn.name}
                        </h3>
                        <div className="relative ml-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingYarnId(editingYarnId === yarn.id ? null : yarn.id);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-warm-gray hover:bg-warm-bg active:scale-95"
                          >
                            ⋯
                          </button>
                          {editingYarnId === yarn.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setEditingYarnId(null)} />
                              <div className="absolute right-0 top-full z-40 mt-1 w-36 rounded-xl bg-white py-1 shadow-lifted border border-warm-wood-pale">
                                <button
                                  onClick={() => { openEditYarn(yarn); setEditingYarnId(null); }}
                                  className="w-full px-3 py-2 text-left text-[13px] font-bold text-warm-dark hover:bg-warm-bg"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => { setYarnToDelete(yarn.id); setEditingYarnId(null); }}
                                  className="w-full px-3 py-2 text-left text-[13px] font-bold text-craft-rose hover:bg-craft-rose-light"
                                >
                                  🗑 Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-[12px] text-warm-gray">
                        {[yarn.brand, yarn.weight].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-[12px] text-warm-gray">
                        {[yarn.fiber, `${yarn.quantity} skein${yarn.quantity > 1 ? "s" : ""}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {(yarn as any).yardage_per_skein && (
                        <p className="text-[12px] text-warm-gray">
                          {(yarn as any).yardage_per_skein}yd/skein · {((yarn as any).yardage_per_skein * yarn.quantity).toFixed(0)}yd total
                        </p>
                      )}
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

      {/* Add Yarn Modal */}
      {showAddYarn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">Add Yarn</h2>
              <button
                onClick={() => setShowAddYarn(false)}
                className="rounded-lg p-1 text-warm-gray hover:bg-warm-bg"
              >
                <X size={18} />
              </button>
            </div>

            {yarnError && (
              <div className="mb-4 rounded-xl bg-craft-rose-light px-4 py-3 text-[13px] font-bold text-craft-rose">
                {yarnError}
              </div>
            )}

            <form onSubmit={handleAddYarn}>
              {/* Name with autocomplete */}
              <div className="mb-3 relative">
                <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                  Name <span className="text-craft-rose">*</span>
                </label>
                <input
                  type="text"
                  value={yarnName}
                  onChange={(e) => handleYarnNameChange(e.target.value)}
                  onFocus={() => { if (yarnName.length >= 2) setYarnSuggestions(searchYarnTemplates(yarnName)); }}
                  onBlur={() => setTimeout(() => setYarnSuggestions([]), 200)}
                  placeholder="e.g. Malabrigo Rios"
                  required
                  autoFocus
                  className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
                />
                {yarnSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-warm-wood-pale bg-white py-1 shadow-lifted max-h-48 overflow-y-auto">
                    {yarnSuggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); applyTemplate(s); }}
                        className="w-full px-3 py-2 text-left hover:bg-sage-light transition-colors"
                      >
                        <span className="text-[13px] font-bold text-warm-dark">{s.brand} {s.name}</span>
                        <span className="ml-2 text-[11px] text-warm-gray">{s.weight} · {s.fiber} · {s.yardage_per_skein}yd</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Brand */}
              <div className="mb-3">
                <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                  Brand
                </label>
                <input
                  type="text"
                  value={yarnBrand}
                  onChange={(e) => setYarnBrand(e.target.value)}
                  placeholder="e.g. Malabrigo"
                  className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
                />
              </div>

              {/* Color */}
              <div className="mb-3">
                <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setYarnColor(c)}
                      className={`h-11 w-11 rounded-lg transition-all ${
                        yarnColor === c
                          ? "ring-2 ring-offset-2 ring-sage scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={yarnColor}
                    onChange={(e) => setYarnColor(e.target.value)}
                    className="h-11 w-11 cursor-pointer rounded-lg border-2 border-warm-wood-pale"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Weight + Fiber row */}
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                    Weight
                  </label>
                  <select
                    value={yarnWeight}
                    onChange={(e) => setYarnWeight(e.target.value)}
                    className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
                  >
                    <option value="">Any</option>
                    <option value="lace">Lace</option>
                    <option value="fingering">Fingering</option>
                    <option value="sport">Sport</option>
                    <option value="dk">DK</option>
                    <option value="worsted">Worsted</option>
                    <option value="bulky">Bulky</option>
                    <option value="jumbo">Jumbo</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                    Fiber
                  </label>
                  <input
                    type="text"
                    value={yarnFiber}
                    onChange={(e) => setYarnFiber(e.target.value)}
                    placeholder="e.g. Merino wool"
                    className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-3">
                <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                  Skeins
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setYarnQuantity(Math.max(1, yarnQuantity - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-warm-wood-pale bg-white text-lg font-bold text-warm-gray hover:border-craft-rose hover:text-craft-rose active:scale-95"
                  >
                    -
                  </button>
                  <span className="min-w-[3ch] text-center text-lg font-bold">
                    {yarnQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setYarnQuantity(yarnQuantity + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-warm-wood-pale bg-white text-lg font-bold text-warm-gray hover:border-sage hover:text-sage active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Yardage per Skein */}
              <div className="mb-6">
                <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                  Yardage per Skein
                </label>
                <input
                  type="number"
                  value={yarnYardage}
                  onChange={(e) => setYarnYardage(e.target.value)}
                  placeholder="e.g. 210"
                  min="0"
                  className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
                />
              </div>

              <button
                type="submit"
                disabled={yarnSaving || !yarnName.trim()}
                className="w-full rounded-xl bg-sage py-3 text-sm font-extrabold text-white transition-all hover:bg-sage-deep disabled:opacity-50"
              >
                {yarnSaving ? "Adding..." : "Add to Stash"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Yarn Modal */}
      {showEditYarn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">Edit Yarn</h2>
              <button onClick={() => setShowEditYarn(false)} className="rounded-lg p-1 text-warm-gray hover:bg-warm-bg">✕</button>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">Name <span className="text-craft-rose">*</span></label>
              <input type="text" value={editYarnName} onChange={(e) => setEditYarnName(e.target.value)} className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage" />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">Brand</label>
              <input type="text" value={editYarnBrand} onChange={(e) => setEditYarnBrand(e.target.value)} className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage" />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setEditYarnColor(c)} className={`h-8 w-8 rounded-lg transition-all ${editYarnColor === c ? "ring-2 ring-offset-2 ring-sage scale-110" : "hover:scale-105"}`} style={{ background: c }} />
                ))}
                <input type="color" value={editYarnColor} onChange={(e) => setEditYarnColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded-lg border-2 border-warm-wood-pale" />
              </div>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">Weight</label>
                <select value={editYarnWeight} onChange={(e) => setEditYarnWeight(e.target.value)} className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage">
                  <option value="">Any</option>
                  <option value="lace">Lace</option><option value="fingering">Fingering</option><option value="sport">Sport</option>
                  <option value="dk">DK</option><option value="worsted">Worsted</option><option value="bulky">Bulky</option><option value="jumbo">Jumbo</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">Fiber</label>
                <input type="text" value={editYarnFiber} onChange={(e) => setEditYarnFiber(e.target.value)} className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage" />
              </div>
            </div>
            <div className="mb-6">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">Skeins</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setEditYarnQuantity(Math.max(1, editYarnQuantity - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-warm-wood-pale bg-white text-lg font-bold text-warm-gray hover:border-craft-rose hover:text-craft-rose active:scale-95">-</button>
                <span className="min-w-[3ch] text-center text-lg font-bold">{editYarnQuantity}</span>
                <button type="button" onClick={() => setEditYarnQuantity(editYarnQuantity + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-warm-wood-pale bg-white text-lg font-bold text-warm-gray hover:border-sage hover:text-sage active:scale-95">+</button>
              </div>
            </div>
            <button onClick={saveEditYarn} disabled={editYarnSaving || !editYarnName.trim()} className="w-full rounded-xl bg-sage py-3 text-sm font-extrabold text-white transition-all hover:bg-sage-deep disabled:opacity-50">
              {editYarnSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Delete Yarn Confirmation */}
      {yarnToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale text-center">
            <div className="mb-3 text-4xl">🗑</div>
            <h2 className="font-serif text-lg font-semibold mb-2">Delete this yarn?</h2>
            <p className="text-[13px] text-warm-gray mb-5">This will permanently remove it from your stash.</p>
            <div className="flex gap-3">
              <button onClick={() => setYarnToDelete(null)} className="flex-1 rounded-xl border-2 border-warm-wood-pale bg-white py-2.5 text-sm font-bold text-warm-gray hover:bg-warm-bg transition-colors">Cancel</button>
              <button onClick={deleteYarn} className="flex-1 rounded-xl bg-craft-rose py-2.5 text-sm font-extrabold text-white hover:bg-craft-rose-deep transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Scan Modal */}
      {showScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">📸 Yarn Scan</h2>
              <button onClick={resetScan} className="rounded-lg p-1 text-warm-gray hover:bg-warm-bg">
                <X size={18} />
              </button>
            </div>

            {/* Image preview */}
            {scanImage && (
              <div className="mb-4 rounded-xl overflow-hidden border border-warm-wood-pale">
                <img src={scanImage} alt="Scanned yarn" className="w-full h-48 object-cover" />
              </div>
            )}

            {/* Loading state */}
            {scanLoading && (
              <div className="flex flex-col items-center py-8">
                <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-sage border-t-transparent" />
                <p className="text-sm font-bold text-warm-gray">Analyzing your yarn...</p>
                <p className="text-[12px] text-warm-gray mt-1">This may take a few seconds</p>
              </div>
            )}

            {/* Error */}
            {scanError && (
              <div className="mb-4 rounded-xl bg-craft-rose-light px-4 py-3 text-[13px] font-bold text-craft-rose text-center">
                {scanError}
              </div>
            )}

            {/* Results */}
            {!scanLoading && scanResults.length > 0 && (
              <div>
                <p className="text-[13px] font-bold text-warm-gray mb-3">
                  Found {scanResults.length} yarn{scanResults.length !== 1 ? "s" : ""} — tap to save each one
                </p>
                <div className="space-y-3">
                  {scanResults.map((yarn, i) => {
                    const saved = savedScans.has(i);
                    const saving = scanSavingId === i;
                    return (
                      <div
                        key={i}
                        className={`rounded-xl border-2 p-4 transition-all ${
                          saved
                            ? "border-sage bg-sage/10"
                            : "border-warm-wood-pale bg-warm-bg"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="h-10 w-10 flex-shrink-0 rounded-lg border border-warm-wood-pale"
                            style={{ background: yarn.color_hex || "#808080" }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-extrabold text-warm-dark truncate">
                                {yarn.brand !== "Unknown" ? yarn.brand : ""} {yarn.name}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                yarn.confidence === "high" ? "bg-sage/20 text-sage" :
                                yarn.confidence === "medium" ? "bg-sun/20 text-warm-dark" :
                                "bg-warm-wood-pale text-warm-gray"
                              }`}>
                                {yarn.confidence}
                              </span>
                            </div>
                            <div className="text-[12px] text-warm-gray mt-0.5">
                              {[yarn.weight, yarn.fiber, yarn.yardage_per_skein ? `${yarn.yardage_per_skein}yd` : null]
                                .filter(Boolean)
                                .join(" · ")}
                              {yarn.quantity_estimate > 1 && (
                                <span className="ml-1 font-bold">×{yarn.quantity_estimate}</span>
                              )}
                            </div>
                            {yarn.notes && (
                              <div className="text-[11px] text-warm-gray mt-1 italic">{yarn.notes}</div>
                            )}
                          </div>
                          <button
                            onClick={() => saveScanYarn(yarn, i)}
                            disabled={saved || saving}
                            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-extrabold transition-all ${
                              saved
                                ? "bg-sage/20 text-sage cursor-default"
                                : "bg-sage text-white hover:bg-sage-deep active:scale-95"
                            }`}
                          >
                            {saved ? "✓ Saved" : saving ? "..." : "Save"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No results */}
            {!scanLoading && scanResults.length === 0 && !scanError && (
              <div className="text-center py-6">
                <p className="text-sm text-warm-gray">No yarn detected in this photo.</p>
                <p className="text-[12px] text-warm-gray mt-1">Try a closer shot or better lighting.</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { resetScan(); scanInputRef.current?.click(); }}
                className="flex-1 rounded-xl border-2 border-warm-wood-pale bg-white py-2.5 text-sm font-bold text-warm-gray hover:bg-warm-bg transition-colors"
              >
                Retake Photo
              </button>
              <button
                onClick={resetScan}
                className="flex-1 rounded-xl bg-sage py-2.5 text-sm font-extrabold text-white hover:bg-sage-deep transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}