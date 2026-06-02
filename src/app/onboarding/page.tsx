"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STEPS = ["craft", "experience", "projects"];

const CRAFT_OPTIONS = [
  {
    key: "knit",
    label: "Knit",
    emoji: "🧶",
    description: "Needles and yarn — stockinette, cables, lace",
  },
  {
    key: "crochet",
    label: "Crochet",
    emoji: "🪝",
    description: "Hook and yarn — amigurumi, granny squares, Tunisian",
  },
  {
    key: "both",
    label: "Both",
    emoji: "✨",
    description: "Why choose? I do it all.",
  },
];

const EXPERIENCE_OPTIONS = [
  {
    key: "beginner",
    emoji: "🌱",
    label: "Just starting",
    description: "First project or two — figuring out what the yarn weight labels mean",
  },
  {
    key: "casual",
    emoji: "☕",
    label: "Casual",
    description: "Done a few projects, know my way around a pattern — mostly follow along",
  },
  {
    key: "intermediate",
    emoji: "🔧",
    label: "Intermediate",
    description: "Comfortable modifying patterns, swatching, picking up stitches",
  },
  {
    key: "obsessive",
    emoji: "🔥",
    label: "Obsessive",
    description: "Own a ball winder, have a spreadsheet, stash has its own room",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [craft, setCraft] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = STEPS[step];
  const canProceed =
    (currentStep === "craft" && craft.length > 0) ||
    (currentStep === "experience" && experience !== "");

  const toggleCraft = (key: string) => {
    if (key === "both") {
      setCraft(craft.length === 2 ? [] : ["knit", "crochet"]);
      return;
    }
    const next = craft.includes(key)
      ? craft.filter((c) => c !== key)
      : [...craft, key];
    // If both selected, "both" should stay checked
    setCraft(next);
  };

  const next = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const finish = async () => {
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("user_profiles").upsert(
      {
        id: user.id,
        display_name: user.email?.split("@")[0] || null,
        craft_preference: craft,
        experience_level: experience,
        onboarding_completed: true,
        onboarding_step: 3,
      },
      { onConflict: "id" }
    );

    if (insertError) {
      console.error("Onboarding save error:", insertError);
      setError("Couldn't save — but you can still explore the app.");
      // Let them through anyway
    }

    router.push("/");
    router.refresh();
  };

  const skip = () => {
    // Save minimal profile and go
    finish();
  };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Brand header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🧶</div>
          <h1 className="font-serif text-3xl font-semibold text-warm-dark mb-1">
            Craftly
          </h1>
          <p className="text-sm text-warm-gray font-medium">
            Let&apos;s get you set up
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                i < step
                  ? "w-2 bg-sage"
                  : i === step
                    ? "w-8 bg-sage"
                    : "w-2 bg-warm-wood-pale"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-soft border border-warm-wood-pale mb-6">
          {currentStep === "craft" && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-warm-dark mb-1">
                What do you make?
              </h2>
              <p className="text-sm text-warm-gray mb-5">
                Pick all that apply
              </p>
              <div className="grid grid-cols-1 gap-3">
                {CRAFT_OPTIONS.map((opt) => {
                  const selected =
                    opt.key === "both"
                      ? craft.includes("knit") && craft.includes("crochet")
                      : craft.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleCraft(opt.key)}
                      className={`flex items-center gap-4 rounded-xl border-[3px] px-5 py-4 text-left transition-all ${
                        selected
                          ? "border-sage bg-sage/10 shadow-[0_0_0_2px_rgba(74,124,89,0.1)]"
                          : "border-warm-wood-pale bg-warm-bg hover:border-warm-gray"
                      }`}
                    >
                      <span className="text-3xl">{opt.emoji}</span>
                      <div>
                        <div className="text-[15px] font-extrabold text-warm-dark">
                          {opt.label}
                        </div>
                        <div className="text-[12px] text-warm-gray mt-0.5">
                          {opt.description}
                        </div>
                      </div>
                      {selected && (
                        <div className="ml-auto text-sage text-lg">✓</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === "experience" && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-warm-dark mb-1">
                Where are you at?
              </h2>
              <p className="text-sm text-warm-gray mb-5">
                This shapes what you see on the dashboard
              </p>
              <div className="grid grid-cols-1 gap-3">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setExperience(opt.key)}
                    className={`flex items-start gap-4 rounded-xl border-[3px] px-5 py-4 text-left transition-all ${
                      experience === opt.key
                        ? "border-sage bg-sage/10 shadow-[0_0_0_2px_rgba(74,124,89,0.1)]"
                        : "border-warm-wood-pale bg-warm-bg hover:border-warm-gray"
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{opt.emoji}</span>
                    <div>
                      <div className="text-[15px] font-extrabold text-warm-dark">
                        {opt.label}
                      </div>
                      <div className="text-[12px] text-warm-gray mt-0.5 leading-relaxed">
                        {opt.description}
                      </div>
                    </div>
                    {experience === opt.key && (
                      <div className="ml-auto text-sage text-lg mt-0.5">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === "projects" && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-warm-dark mb-1">
                Ready to go
              </h2>
              <p className="text-sm text-warm-gray mb-5">
                You can add your first project from the dashboard, or start
                exploring your yarn stash.
              </p>
              <div className="rounded-xl bg-warm-bg border border-warm-wood-pale p-5">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-[14px] font-bold text-warm-dark mb-1">
                  What you&apos;ll find on the dashboard
                </div>
                <ul className="text-[12px] text-warm-gray space-y-1.5 leading-relaxed">
                  <li>
                    <span className="font-bold text-warm-dark">Projects</span>{" "}
                    — track your WIPs with row counters and progress
                  </li>
                  <li>
                    <span className="font-bold text-warm-dark">Stash</span> —
                    catalog your yarns and fabrics
                  </li>
                  <li>
                    <span className="font-bold text-warm-dark">Patterns</span>{" "}
                    — save patterns with notes and PDFs
                  </li>
                  <li>
                    <span className="font-bold text-warm-dark">Journal</span>{" "}
                    — log sessions and see your stats
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-craft-rose-light px-4 py-3 text-[13px] font-bold text-craft-rose text-center">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={back}
              className="rounded-xl border-2 border-warm-wood-pale bg-white px-5 py-3 text-sm font-bold text-warm-gray hover:bg-warm-bg transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={step === 2 ? finish : next}
            disabled={!canProceed && step < 2}
            className="flex-1 rounded-xl bg-sage py-3 text-sm font-extrabold text-white transition-all hover:bg-sage-deep disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? "Saving..."
              : step === 2
                ? "Let's go"
                : "Continue"}
          </button>
        </div>

        {step < 2 && (
          <button
            onClick={skip}
            className="mt-3 w-full text-center text-[12px] font-bold text-warm-gray hover:text-warm-dark transition-colors py-2"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
