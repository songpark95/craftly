"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import {
  Play,
  Pause,
  Square,
  Minus,
  ChevronLeft,
  Edit3,
  Clock,
} from "lucide-react";

interface ProjectData {
  id: string;
  name: string;
  type: string;
  status: string;
  current_row: number;
  total_rows: number | null;
  stitch_name: string | null;
  yarn_weight: string | null;
  needle_size: string | null;
  yarn_color: string | null;
  yarn_name: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface SessionData {
  id: string;
  date: string;
  rows_added: number;
  duration_seconds: number;
  notes: string | null;
}

const QUICK_ADDS = [5, 10, 20];

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [row, setRow] = useState(0);
  const [bumping, setBumping] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerStart, setTimerStart] = useState<number | null>(null);

  const formatSessionDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Load project data
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
      setUserId(user.id);

      const projectId = params.id as string;

      const { data: proj } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();

      if (!proj) {
        router.push("/");
        return;
      }

      setProject(proj);
      setRow(proj.current_row);
      setNotes(proj.notes || "");

      // Fetch sessions
      const { data: sess } = await supabase
        .from("sessions")
        .select("*")
        .eq("project_id", projectId)
        .order("started_at", { ascending: false })
        .limit(10);

      setSessions(
        (sess || []).map((s) => ({
          id: s.id,
          date: formatSessionDate(s.started_at),
          rows_added: s.rows_added || 0,
          duration_seconds: s.duration_seconds || 0,
          notes: s.notes,
        }))
      );

      setLoading(false);
    }
    load();
  }, []);

  // Timer tick
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      if (timerStart) {
        setTimerSeconds(Math.floor((Date.now() - timerStart) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerStart]);

  const bump = useCallback(() => {
    setBumping(true);
    setTimeout(() => setBumping(false), 150);
  }, []);

  const addRow = async (n: number) => {
    const newRow = Math.max(0, row + n);
    setRow(newRow);
    bump();

    // Optimistically update the DB
    if (project) {
      await supabase
        .from("projects")
        .update({ current_row: newRow, updated_at: new Date().toISOString() })
        .eq("id", project.id);
    }
  };

  const startTimer = () => {
    setTimerRunning(true);
    setTimerStart(Date.now() - timerSeconds * 1000);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
    setTimerStart(null);
  };

  const stopTimer = async () => {
    setTimerRunning(false);
    setTimerStart(null);

    if (project && userId && timerSeconds > 0) {
      await supabase.from("sessions").insert({
        project_id: project.id,
        user_id: userId,
        started_at: new Date(Date.now() - timerSeconds * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: timerSeconds,
        rows_added: 0,
      });

      // Reload sessions
      const { data: sess } = await supabase
        .from("sessions")
        .select("*")
        .eq("project_id", project.id)
        .order("started_at", { ascending: false })
        .limit(10);

      setSessions(
        (sess || []).map((s) => ({
          id: s.id,
          date: formatSessionDate(s.started_at),
          rows_added: s.rows_added || 0,
          duration_seconds: s.duration_seconds || 0,
          notes: s.notes,
        }))
      );
    }

    setTimerSeconds(0);
  };

  const saveNotes = async () => {
    if (project) {
      await supabase
        .from("projects")
        .update({ notes, updated_at: new Date().toISOString() })
        .eq("id", project.id);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${m}:${String(sec).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <>
        <Nav />
        <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
          <p className="text-sm font-bold text-warm-gray">Loading project...</p>
        </main>
      </>
    );
  }

  if (!project) return null;

  const progress = Math.round((row / (project.total_rows || 1)) * 100);
  const yarnColor = project.yarn_color || "#6B9E7A";
  const yarnName = project.yarn_name || "";

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-warm-gray transition-colors hover:text-sage"
        >
          <ChevronLeft size={16} />
          Back to projects
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT: Counter + Timer + Notes (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header */}
            <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-serif text-2xl font-semibold">
                    {project.name}
                  </h1>
                  <p className="text-sm text-warm-gray">
                    {[project.stitch_name, project.type, project.yarn_weight, project.needle_size]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className="rounded-lg bg-sage-light px-3 py-1 text-[12px] font-bold text-sage-deep uppercase">
                  {project.status}
                </span>
              </div>
            </div>

            {/* HERO COUNTER */}
            <div
              className={`rounded-3xl bg-white p-8 shadow-soft border border-warm-wood-pale ${
                timerRunning ? "timer-active" : ""
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                  Row Counter
                </span>
                <span className="text-xs font-bold text-warm-gray">
                  {progress}% complete
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-warm-bg">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${yarnColor}, ${yarnColor}cc)`,
                  }}
                />
              </div>

              {/* Big Counter */}
              <div className="mb-8 flex flex-col items-center">
                <div
                  className={`font-serif text-[96px] font-semibold leading-none transition-transform ${
                    bumping ? "counter-bump" : ""
                  }`}
                  style={{ color: yarnColor }}
                >
                  {row}
                </div>
                <span className="text-sm font-semibold text-warm-gray">
                  of {project.total_rows || "∞"} rows
                </span>
              </div>

              {/* Main Buttons */}
              <div className="mb-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => addRow(-1)}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-warm-wood-pale bg-white text-xl text-warm-gray transition-all hover:border-craft-rose hover:bg-craft-rose-light hover:text-craft-rose active:scale-95"
                >
                  <Minus size={24} />
                </button>
                <button
                  onClick={() => addRow(1)}
                  className="flex h-20 w-20 items-center justify-center rounded-2xl bg-sage text-3xl font-bold text-white shadow-glow transition-all hover:bg-sage-deep hover:scale-105 active:scale-95"
                >
                  +1
                </button>
                <button
                  onClick={() => addRow(-1)}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-warm-wood-pale bg-white text-xl text-warm-gray opacity-0 pointer-events-none"
                  aria-hidden
                >
                  <Minus size={24} />
                </button>
              </div>

              {/* Quick Add Buttons */}
              <div className="flex items-center justify-center gap-3">
                {QUICK_ADDS.map((n) => (
                  <button
                    key={n}
                    onClick={() => addRow(n)}
                    className="rounded-xl border-2 border-warm-wood-pale bg-white px-6 py-2.5 text-sm font-extrabold text-warm-dark transition-all hover:border-sage hover:bg-sage-light hover:text-sage-deep active:scale-95"
                  >
                    +{n}
                  </button>
                ))}
              </div>
            </div>

            {/* SESSION TIMER */}
            <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
              <div className="mb-4 flex items-center gap-2">
                <Clock size={16} className="text-warm-gray" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                  Session Timer
                </span>
              </div>

              <div className="flex items-center gap-6">
                {/* Timer Display */}
                <div className="font-mono text-4xl font-bold tabular-nums text-warm-dark">
                  {formatTime(timerSeconds)}
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                  {!timerRunning ? (
                    <button
                      onClick={startTimer}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage text-white transition-all hover:bg-sage-deep active:scale-95"
                    >
                      <Play size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-sun text-white transition-all hover:brightness-90 active:scale-95"
                    >
                      <Pause size={20} />
                    </button>
                  )}
                  <button
                    onClick={stopTimer}
                    disabled={timerSeconds === 0}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-warm-wood-pale bg-white text-warm-gray transition-all hover:border-craft-rose hover:text-craft-rose disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                  >
                    <Square size={18} />
                  </button>
                </div>

                {timerRunning && (
                  <span className="text-xs font-bold text-sage animate-pulse">
                    ● Recording
                  </span>
                )}
              </div>
            </div>

            {/* NOTES */}
            <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 size={16} className="text-warm-gray" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                    Notes
                  </span>
                </div>
                <button
                  onClick={saveNotes}
                  className="rounded-lg bg-sage px-3 py-1 text-[12px] font-bold text-white transition-all hover:bg-sage-deep"
                >
                  {notesSaved ? "✓ Saved" : "Save"}
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this project..."
                className="min-h-[120px] w-full resize-y rounded-xl border-2 border-warm-wood-pale bg-warm-bg p-4 text-sm leading-relaxed text-warm-dark outline-none transition-colors focus:border-sage"
              />
            </div>
          </div>

          {/* RIGHT SIDEBAR (1/3 width) */}
          <div className="space-y-6">
            {/* Yarn Allocation */}
            <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                Yarn
              </h3>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg"
                  style={{ background: yarnColor }}
                />
                <div>
                  <div className="text-sm font-bold">{yarnName}</div>
                  {project.yarn_weight && (
                    <div className="text-xs text-warm-gray">
                      {project.yarn_weight}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                Recent Sessions
              </h3>
              {sessions.length === 0 ? (
                <p className="text-[13px] text-warm-gray">No sessions yet</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between border-b border-warm-bg pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <div className="text-[13px] font-bold">{s.date}</div>
                        {s.notes && (
                          <div className="text-[11px] text-warm-gray">
                            {s.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {s.rows_added > 0 && (
                          <div className="text-[13px] font-bold text-sage-deep">
                            +{s.rows_added} rows
                          </div>
                        )}
                        <div className="text-[11px] text-warm-gray">
                          {formatDuration(s.duration_seconds)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Photos */}
            <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                Progress Photos
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center rounded-xl bg-warm-bg text-2xl"
                  >
                    {i === 3 ? "+" : "📷"}
                  </div>
                ))}
              </div>
            </div>

            {/* Row History (mini bar chart) */}
            <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                Rows per Day
              </h3>
              <div className="flex items-end gap-1.5 h-24">
                {[8, 14, 0, 12, 8, 14, 12].map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max(4, (v / 14) * 100)}%`,
                        background:
                          v > 0 ? yarnColor : "var(--wood-pale)",
                        opacity: i === 6 ? 1 : 0.7,
                      }}
                    />
                    <span className="text-[9px] font-bold text-warm-gray">
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
