"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is disabled, user is signed in immediately
    // If enabled, they'll need to confirm via email
    setSuccess(true);
    setLoading(false);

    // Try to redirect immediately (works if email confirm is off)
    setTimeout(() => {
      router.push("/onboarding");
      router.refresh();
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-bg p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl font-semibold">
            craft<span className="text-sage italic">ly</span>
          </h1>
          <p className="mt-2 text-sm font-semibold text-warm-gray">
            Create your crafting account
          </p>
        </div>

        <form
          onSubmit={handleSignUp}
          className="rounded-2xl bg-white p-8 shadow-soft border border-warm-wood-pale"
        >
          {error && (
            <div className="mb-4 rounded-xl bg-craft-rose-light px-4 py-3 text-[13px] font-bold text-craft-rose">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl bg-sage/10 px-4 py-3 text-[13px] font-bold text-sage">
              Account created! Redirecting...
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

          <div className="mb-4">
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
              minLength={6}
              className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-[13px] font-extrabold text-warm-gray"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full rounded-xl bg-sage py-3 text-sm font-extrabold text-white transition-all hover:bg-sage-deep disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-warm-gray">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-sage hover:text-sage-deep">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
