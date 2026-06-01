"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-bg p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl font-semibold">
            craft<span className="text-sage italic">ly</span>
          </h1>
          <p className="mt-2 text-sm font-semibold text-warm-gray">
            Sign in to your crafting companion
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl bg-white p-8 shadow-soft border border-warm-wood-pale"
        >
          {error && (
            <div className="mb-4 rounded-xl bg-craft-rose-light px-4 py-3 text-[13px] font-bold text-craft-rose">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1.5 block text-[13px] font-extrabold text-warm-gray"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-1.5 block text-[13px] font-extrabold text-warm-gray"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sage py-3 text-sm font-extrabold text-white transition-all hover:bg-sage-deep disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-warm-gray">
          Single-user app — sign in with your email
        </p>
      </div>
    </div>
  );
}
