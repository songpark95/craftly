"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState<"knit" | "crochet">("knit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give your project a name");
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

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({
        name: name.trim(),
        type,
        user_id: user.id,
        status: "wip",
        current_row: 0,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/projects/${data.id}`);
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-warm-gray transition-colors hover:text-warm-dark"
      >
        <ArrowLeft size={16} />
        Back to craft room
      </Link>

      <h1 className="mb-8 font-serif text-3xl font-semibold text-warm-dark">
        New Project
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

        <div className="mb-6">
          <label
            htmlFor="name"
            className="mb-1.5 block text-[13px] font-extrabold text-warm-gray"
          >
            Project Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cozy Winter Scarf"
            required
            className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
            autoFocus
          />
        </div>

        <div className="mb-8">
          <label className="mb-3 block text-[13px] font-extrabold text-warm-gray">
            What are you making?
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType("knit")}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                type === "knit"
                  ? "border-sage bg-sage/10 text-sage"
                  : "border-warm-wood-pale bg-warm-bg text-warm-gray hover:border-warm-gray"
              }`}
            >
              🧶 Knit
            </button>
            <button
              type="button"
              onClick={() => setType("crochet")}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                type === "crochet"
                  ? "border-craft-purple bg-craft-purple/10 text-craft-purple"
                  : "border-warm-wood-pale bg-warm-bg text-warm-gray hover:border-warm-gray"
              }`}
            >
              🧵 Crochet
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded-xl bg-sage py-3 text-sm font-extrabold text-white transition-all hover:bg-sage-deep disabled:opacity-50"
        >
          {loading ? "Creating..." : "Start Project"}
        </button>
      </form>
    </div>
  );
}
