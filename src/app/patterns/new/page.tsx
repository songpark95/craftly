"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { key: "texture", label: "✨ Texture" },
  { key: "cable", label: "⚡ Cable" },
  { key: "lace", label: "🌸 Lace" },
  { key: "colorwork", label: "🎨 Colorwork" },
  { key: "foundation", label: "🌀 Foundation" },
  { key: "edging", label: "🧩 Edging" },
];

const DIFFICULTY_LABELS = ["", "Beginner", "Easy", "Intermediate", "Advanced", "Expert"];

export default function NewPatternPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState<"knit" | "crochet">("knit");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give your pattern a name");
      return;
    }

    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("patterns").insert({
      name: name.trim(),
      type,
      category: category || null,
      difficulty,
      description: description.trim() || "",
      instructions: instructions.trim() || "",
      user_id: user.id,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/patterns");
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <Link
        href="/patterns"
        className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-warm-gray transition-colors hover:text-warm-dark"
      >
        <ArrowLeft size={16} />
        Back to patterns
      </Link>

      <h1 className="mb-8 font-serif text-3xl font-semibold text-warm-dark">
        New Pattern
      </h1>

      <form
        onSubmit={handleCreate}
        className="rounded-2xl bg-white p-8 shadow-soft border border-warm-wood-pale"
      >
        {error && (
          <div className="mb-4 rounded-xl bg-craft-rose-light px-4 py-3 text-[13px] font-bold text-craft-rose">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-extrabold text-warm-gray">
            Pattern Name <span className="text-craft-rose">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Old Shale Lace"
            required
            autoFocus
            className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
          />
        </div>

        {/* Type */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-extrabold text-warm-gray">
            Type
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType("knit")}
              className={`flex-1 rounded-xl border-[3px] px-4 py-4 text-base font-bold transition-all ${
                type === "knit"
                  ? "border-sage bg-sage/15 text-sage shadow-[0_0_0_2px_rgba(74,124,89,0.15)]"
                  : "border-warm-wood-pale bg-warm-bg text-warm-gray hover:border-warm-gray"
              }`}
            >
              🧶 Knit
            </button>
            <button
              type="button"
              onClick={() => setType("crochet")}
              className={`flex-1 rounded-xl border-[3px] px-4 py-4 text-base font-bold transition-all ${
                type === "crochet"
                  ? "border-craft-purple bg-craft-purple/15 text-craft-purple shadow-[0_0_0_2px_rgba(123,94,167,0.15)]"
                  : "border-warm-wood-pale bg-warm-bg text-warm-gray hover:border-warm-gray"
              }`}
            >
              🧵 Crochet
            </button>
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-extrabold text-warm-gray">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(category === c.key ? "" : c.key)}
                className={`rounded-xl border-2 px-3 py-1.5 text-[12px] font-bold transition-all ${
                  category === c.key
                    ? "border-sage bg-sage/10 text-sage"
                    : "border-warm-wood-pale bg-warm-bg text-warm-gray hover:border-warm-gray"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-extrabold text-warm-gray">
            Difficulty — {DIFFICULTY_LABELS[difficulty]}
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all ${
                  d <= difficulty
                    ? "border-sun bg-sun/10 text-sun"
                    : "border-warm-wood-pale bg-warm-bg text-warm-gray hover:border-warm-gray"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-extrabold text-warm-gray">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this stitch look like?"
            rows={2}
            className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage resize-none"
          />
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <label className="mb-1.5 block text-[13px] font-extrabold text-warm-gray">
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Step-by-step stitch instructions..."
            rows={4}
            className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded-xl bg-sage py-3 text-sm font-extrabold text-white transition-all hover:bg-sage-deep disabled:opacity-50"
        >
          {loading ? "Creating..." : "Save Pattern"}
        </button>
      </form>
    </div>
  );
}
