"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

// Mock data — will come from Supabase later
const MOCK_PROJECTS = [
  {
    id: "1",
    name: "Forest Green Scarf",
    type: "knit" as const,
    status: "wip" as const,
    currentRow: 42,
    totalRows: 84,
    stitchName: "Seed stitch",
    yarnColor: "#4A7C59",
    yarnName: "Malabrigo Rios — Lettuce",
    notes: "Using seed stitch. Cast on 24 stitches.",
    updatedAt: "2h ago",
  },
  {
    id: "2",
    name: "Sunflower Beanie",
    type: "crochet" as const,
    status: "wip" as const,
    currentRow: 18,
    totalRows: 40,
    stitchName: "Double crochet",
    yarnColor: "#D4A843",
    yarnName: "Malabrigo Rios — Yellow",
    notes: "Working in the round.",
    updatedAt: "1d ago",
  },
  {
    id: "3",
    name: "Lavender Amigurumi",
    type: "crochet" as const,
    status: "wip" as const,
    currentRow: 8,
    totalRows: 60,
    stitchName: "Single crochet",
    yarnColor: "#8B7AB8",
    yarnName: "Malabrigo Rios — Lavanda",
    notes: "Bear pattern from Ravelry.",
    updatedAt: "3d ago",
  },
  {
    id: "4",
    name: "Moss Stitch Cowl",
    type: "knit" as const,
    status: "queued" as const,
    currentRow: 0,
    totalRows: 120,
    stitchName: "Moss stitch",
    yarnColor: "#6B8F9B",
    yarnName: "Cascade 220 — Storm",
    notes: "",
    updatedAt: "1w ago",
  },
  {
    id: "5",
    name: "Cream Baby Blanket",
    type: "knit" as const,
    status: "queued" as const,
    currentRow: 0,
    totalRows: 200,
    stitchName: "Stockinette",
    yarnColor: "#F5E6CC",
    yarnName: "Lion Brand — Cream",
    notes: "Gift for Jamie's baby shower",
    updatedAt: "2w ago",
  },
];

const FINISHED_OBJECTS = [
  { id: "f1", name: "Blue Scarf", emoji: "🧣", hours: 14, date: "Jan 19", color: "#6B8F9B" },
  { id: "f2", name: "Red Beanie", emoji: "🧢", hours: 6, date: "Feb 8", color: "#C47B7B" },
  { id: "f3", name: "Cozy Blanket", emoji: "🧶", hours: 42, date: "Mar 22", color: "#F5E6CC" },
  { id: "f4", name: "Striped Gloves", emoji: "🧤", hours: 18, date: "Apr 14", color: "#6B8F9B" },
  { id: "f5", name: "Tiny Bear", emoji: "🧸", hours: 12, date: "May 28", color: "#8B7AB8" },
];

export default function Home() {
  const [filter, setFilter] = useState<"all" | "wip" | "queued" | "done">("all");

  const wipProjects = MOCK_PROJECTS.filter((p) => p.status === "wip");
  const queuedProjects = MOCK_PROJECTS.filter((p) => p.status === "queued");

  const filtered =
    filter === "all"
      ? MOCK_PROJECTS
      : MOCK_PROJECTS.filter((p) => p.status === filter);

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        {/* Hero Counter — the primary CTA */}
        <section className="mb-8 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="font-serif text-3xl">Your Craft Room</h1>
            <p className="text-sm font-semibold text-warm-gray">
              {wipProjects.length} in progress · {queuedProjects.length} queued
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

        {/* Project Cards Grid */}
        <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
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
                      (project.currentRow / (project.totalRows || 1)) * 100
                    )}%`,
                    background: `linear-gradient(90deg, ${project.yarnColor}, ${project.yarnColor}dd)`,
                  }}
                />
              </div>

              {/* Header */}
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-extrabold leading-tight">
                    {project.name}
                  </h3>
                  <p className="text-[12px] text-warm-gray">
                    {project.stitchName}
                  </p>
                </div>
                <span className="rounded-lg bg-warm-bg px-2 py-0.5 text-[11px] font-bold uppercase text-warm-gray">
                  {project.type}
                </span>
              </div>

              {/* Row Counter Preview */}
              <div className="mb-3 flex items-baseline gap-2">
                <span
                  className="font-serif text-3xl font-semibold"
                  style={{ color: project.yarnColor }}
                >
                  {project.currentRow}
                </span>
                <span className="text-sm text-warm-gray">
                  / {project.totalRows || "∞"} rows
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-warm-bg pt-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ background: project.yarnColor }}
                  />
                  <span className="text-[12px] text-warm-gray">
                    {project.yarnName}
                  </span>
                </div>
                <span className="text-[11px] text-warm-gray">
                  {project.updatedAt}
                </span>
              </div>
            </Link>
          ))}

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
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl">🏆 Finished Objects</h2>
              <p className="text-[13px] font-semibold text-warm-gray">
                {FINISHED_OBJECTS.length} completed ·{" "}
                {FINISHED_OBJECTS.reduce((s, p) => s + p.hours, 0)}h invested
              </p>
            </div>
          </div>
          <div className="rounded-3xl bg-gradient-to-b from-[#F0E6D6] to-[#F5EDE0] p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {FINISHED_OBJECTS.map((fo) => (
                <div
                  key={fo.id}
                  className="flex flex-col items-center rounded-2xl bg-white/70 p-4 text-center backdrop-blur-sm transition-all hover:bg-white hover:shadow-soft"
                >
                  <div
                    className="mb-2 flex h-16 w-16 items-center justify-center rounded-xl text-3xl"
                    style={{
                      background: `linear-gradient(135deg, ${fo.color}40, ${fo.color}20)`,
                    }}
                  >
                    {fo.emoji}
                  </div>
                  <span className="text-[13px] font-bold">{fo.name}</span>
                  <span className="text-[11px] text-warm-gray">
                    {fo.hours}h · {fo.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
