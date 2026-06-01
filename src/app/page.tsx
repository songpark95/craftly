"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  current_row: number;
  total_rows: number | null;
  stitch_name: string | null;
  yarn_color: string | null;
  yarn_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "wip" | "queued" | "done">("all");
  const [now] = useState(() => Date.now());

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

      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      setProjects(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const wipProjects = projects.filter((p) => p.status === "wip");
  const queuedProjects = projects.filter((p) => p.status === "queued");
  const finishedProjects = projects.filter((p) => p.status === "done");

  const filtered =
    filter === "all"
      ? projects
      : projects.filter((p) => p.status === filter);

  const formatTimeAgo = (dateStr: string) => {
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        {/* Hero Counter — the primary CTA */}
        <section className="mb-8 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="font-serif text-3xl">Your Craft Room</h1>
            <p className="text-sm font-semibold text-warm-gray">
              {loading
                ? "Loading..."
                : `${wipProjects.length} in progress · ${queuedProjects.length} queued`}
            </p>
          </div>
        </section>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {(["all", "wip", "queued", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${
                filter === f
                  ? "bg-sage text-white"
                  : "bg-white text-warm-gray border border-warm-wood-pale hover:border-sage hover:text-sage"
              }`}
            >
              {f === "all"
                ? "All Projects"
                : f === "wip"
                ? "🧶 In Progress"
                : f === "queued"
                ? "📋 Queued"
                : "✅ Done"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm font-bold text-warm-gray">Loading projects...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mb-12 flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-soft border border-warm-wood-pale">
            <div className="mb-4 text-4xl">🧶</div>
            <h2 className="font-serif text-xl mb-2">No projects yet</h2>
            <p className="text-sm text-warm-gray mb-6 text-center max-w-md">
              Start your first project and track your rows, sessions, and progress here.
            </p>
            <Link
              href="/projects/new"
              className="rounded-xl bg-sage px-6 py-3 text-sm font-extrabold text-white transition-all hover:bg-sage-deep"
            >
              + Start a New Project
            </Link>
          </div>
        ) : (
          <>
            {/* Project Cards Grid */}
            <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => {
                const yarnColor = project.yarn_color || "#6B9E7A";
                const yarnName = project.yarn_name || "";
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale transition-all hover:-translate-y-0.5 hover:shadow-lifted"
                  >
                    {/* Progress Bar */}
                    <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-warm-bg">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round(
                            (project.current_row / (project.total_rows || 1)) * 100
                          )}%`,
                          background: `linear-gradient(90deg, ${yarnColor}, ${yarnColor}dd)`,
                        }}
                      />
                    </div>

                    {/* Header */}
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="text-[15px] font-extrabold leading-tight">
                          {project.name}
                        </h3>
                        {project.stitch_name && (
                          <p className="text-[12px] text-warm-gray">
                            {project.stitch_name}
                          </p>
                        )}
                      </div>
                      <span className="rounded-lg bg-warm-bg px-2 py-0.5 text-[11px] font-bold uppercase text-warm-gray">
                        {project.type}
                      </span>
                    </div>

                    {/* Row Counter Preview */}
                    <div className="mb-3 flex items-baseline gap-2">
                      <span
                        className="font-serif text-3xl font-semibold"
                        style={{ color: yarnColor }}
                      >
                        {project.current_row}
                      </span>
                      <span className="text-sm text-warm-gray">
                        / {project.total_rows || "∞"} rows
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-warm-bg pt-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ background: yarnColor }}
                        />
                        <span className="text-[12px] text-warm-gray">
                          {yarnName}
                        </span>
                      </div>
                      <span className="text-[11px] text-warm-gray">
                        {formatTimeAgo(project.updated_at)}
                      </span>
                    </div>
                  </Link>
                );
              })}

              {/* Add Project Card */}
              <Link
                href="/projects/new"
                className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-wood-pale bg-warm-bg transition-all hover:border-sage hover:bg-sage-light"
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-sage shadow-soft">
                  +
                </div>
                <span className="text-sm font-bold text-warm-gray">
                  Start a new project
                </span>
              </Link>
            </section>

            {/* Finished Objects Shelf */}
            {finishedProjects.length > 0 && (
              <section className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl">🏆 Finished Objects</h2>
                    <p className="text-[13px] font-semibold text-warm-gray">
                      {finishedProjects.length} completed
                    </p>
                  </div>
                </div>
                <div className="rounded-3xl bg-gradient-to-b from-[#F0E6D6] to-[#F5EDE0] p-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                    {finishedProjects.map((fo) => {
                      const color = fo.yarn_color || "#6B9E7A";
                      return (
                        <div
                          key={fo.id}
                          className="flex flex-col items-center rounded-2xl bg-white/70 p-4 text-center backdrop-blur-sm transition-all hover:bg-white hover:shadow-soft"
                        >
                          <div
                            className="mb-2 flex h-16 w-16 items-center justify-center rounded-xl text-3xl"
                            style={{
                              background: `linear-gradient(135deg, ${color}40, ${color}20)`,
                            }}
                          >
                            🧶
                          </div>
                          <span className="text-[13px] font-bold">{fo.name}</span>
                          <span className="text-[11px] text-warm-gray">
                            {fo.total_rows || "?"} rows
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
