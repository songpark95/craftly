"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { JournalSkeleton } from "@/components/Skeleton";
import { createClient } from "@/lib/supabase/client";

/* ─── Types ─── */

type Period = "week" | "month" | "year" | "all";

interface RawSession {
  id: string;
  project_id: string;
  started_at: string;
  duration_seconds: number | null;
  rows_added: number | null;
  notes: string | null;
  projects: { name: string; yarn_color: string | null } | null;
}

interface RawProject {
  id: string;
  name: string;
  status: string | null;
  current_row: number | null;
  total_rows: number | null;
  yarn_color: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: string;
  target: number;
  getValue: (d: StatsData) => number;
}

interface ProjectPhoto {
  project_id: string;
  photo_url: string;
  photo_type: "start" | "progress" | "final";
}

interface StatsData {
  projects: RawProject[];
  sessions: RawSession[];
  allSessions: RawSession[];
}

/* ─── Achievements Definitions ─── */

const ACHIEVEMENTS: Achievement[] = [
  // Getting Started
  { id: "first-project", emoji: "🌱", name: "Seed Planted", description: "Start your first project", category: "Getting Started", target: 1, getValue: (d) => d.projects.length },
  { id: "first-session", emoji: "⏱️", name: "First Stitch", description: "Log your first session", category: "Getting Started", target: 1, getValue: (d) => d.allSessions.length },
  { id: "first-finish", emoji: "🏁", name: "Finished Object", description: "Complete your first project", category: "Getting Started", target: 1, getValue: (d) => d.projects.filter((p) => p.status === "done").length },

  // Crafting Volume
  { id: "rows-100", emoji: "📏", name: "Century", description: "Log 100 total rows", category: "Crafting", target: 100, getValue: (d) => d.allSessions.reduce((s, sess) => s + (sess.rows_added || 0), 0) },
  { id: "rows-500", emoji: "📐", name: "Half Grand", description: "Log 500 total rows", category: "Crafting", target: 500, getValue: (d) => d.allSessions.reduce((s, sess) => s + (sess.rows_added || 0), 0) },
  { id: "rows-1000", emoji: "🏔️", name: "Kilometer", description: "Log 1,000 total rows", category: "Crafting", target: 1000, getValue: (d) => d.allSessions.reduce((s, sess) => s + (sess.rows_added || 0), 0) },
  { id: "rows-5000", emoji: "🌋", name: "Marathon Crafter", description: "Log 5,000 total rows", category: "Crafting", target: 5000, getValue: (d) => d.allSessions.reduce((s, sess) => s + (sess.rows_added || 0), 0) },

  // Streaks
  { id: "streak-3", emoji: "🔥", name: "Getting Warm", description: "3-day crafting streak", category: "Streaks", target: 3, getValue: (d) => calcBestStreak(d.allSessions) },
  { id: "streak-7", emoji: "🔥🔥", name: "Week Warrior", description: "7-day crafting streak", category: "Streaks", target: 7, getValue: (d) => calcBestStreak(d.allSessions) },
  { id: "streak-30", emoji: "🔥🔥🔥", name: "Monthly Master", description: "30-day crafting streak", category: "Streaks", target: 30, getValue: (d) => calcBestStreak(d.allSessions) },
  { id: "streak-100", emoji: "💎", name: "Diamond Hands", description: "100-day crafting streak", category: "Streaks", target: 100, getValue: (d) => calcBestStreak(d.allSessions) },

  // Time
  { id: "time-1h", emoji: "⏰", name: "Hour of Craft", description: "Spend 1 hour crafting", category: "Time", target: 3600, getValue: (d) => d.allSessions.reduce((s, sess) => s + (sess.duration_seconds || 0), 0) },
  { id: "time-10h", emoji: "⏳", name: "Dedicated", description: "Spend 10 hours crafting", category: "Time", target: 36000, getValue: (d) => d.allSessions.reduce((s, sess) => s + (sess.duration_seconds || 0), 0) },
  { id: "time-100h", emoji: "🕰️", name: "Craft Veteran", description: "Spend 100 hours crafting", category: "Time", target: 360000, getValue: (d) => d.allSessions.reduce((s, sess) => s + (sess.duration_seconds || 0), 0) },

  // Collection
  { id: "projects-3", emoji: "📚", name: "Multi-Crafter", description: "Have 3 projects", category: "Collection", target: 3, getValue: (d) => d.projects.length },
  { id: "projects-5", emoji: "📖", name: "Project Collector", description: "Have 5 projects", category: "Collection", target: 5, getValue: (d) => d.projects.length },
  { id: "finishes-3", emoji: "🏆", name: "Triple Crown", description: "Finish 3 projects", category: "Collection", target: 3, getValue: (d) => d.projects.filter((p) => p.status === "done").length },

  // Session volume
  { id: "sessions-10", emoji: "📝", name: "Regular", description: "Log 10 sessions", category: "Crafting", target: 10, getValue: (d) => d.allSessions.length },
  { id: "sessions-50", emoji: "📋", name: "Habitual", description: "Log 50 sessions", category: "Crafting", target: 50, getValue: (d) => d.allSessions.length },
  { id: "sessions-100", emoji: "📚", name: "Centurion", description: "Log 100 sessions", category: "Crafting", target: 100, getValue: (d) => d.allSessions.length },

  // Special
  { id: "big-session", emoji: "💪", name: "Power Hour", description: "50+ rows in one session", category: "Special", target: 50, getValue: (d) => Math.max(0, ...d.allSessions.map((s) => s.rows_added || 0)) },
  { id: "night-owl", emoji: "🦉", name: "Night Owl", description: "Log a session after 10 PM", category: "Special", target: 1, getValue: (d) => d.allSessions.filter((s) => new Date(s.started_at).getHours() >= 22).length },
  { id: "early-bird", emoji: "🐦", name: "Early Bird", description: "Log a session before 8 AM", category: "Special", target: 1, getValue: (d) => d.allSessions.filter((s) => new Date(s.started_at).getHours() < 8).length },
];

/* ─── Helpers ─── */

function calcBestStreak(sessions: RawSession[]): number {
  const dates = new Set(sessions.map((s) => new Date(s.started_at).toISOString().split("T")[0]));
  let best = 0;
  let current = 0;
  const today = new Date();
  for (let i = 0; i < 3650; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (dates.has(key)) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

function periodCutoff(period: Period): Date | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "week") now.setDate(now.getDate() - 7);
  else if (period === "month") now.setDate(now.getDate() - 30);
  else if (period === "year") now.setFullYear(now.getFullYear() - 1);
  return now;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/* ─── Components ─── */

function StatCard({ emoji, value, label, sub }: { emoji: string; value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-center shadow-soft border border-warm-wood-pale transition-all hover:-translate-y-0.5 hover:shadow-lifted">
      <div className="mb-2 text-2xl">{emoji}</div>
      <div className="font-serif text-3xl font-semibold leading-none mb-1">{value}</div>
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-warm-gray mb-1">{label}</div>
      {sub && <div className="text-[11px] font-bold text-sage">{sub}</div>}
    </div>
  );
}

function AchievementCard({ achievement, value }: { achievement: Achievement; value: number }) {
  const unlocked = value >= achievement.target;
  const progress = Math.min(1, value / achievement.target);
  const pct = Math.round(progress * 100);

  return (
    <div
      className={`relative rounded-2xl p-5 transition-all ${
        unlocked
          ? "bg-white shadow-soft border border-sage/30 hover:-translate-y-0.5 hover:shadow-lifted"
          : "bg-warm-bg border border-warm-wood-pale/50 opacity-70"
      }`}
    >
      {unlocked && (
        <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-sage flex items-center justify-center">
          <span className="text-[10px] text-white font-bold">✓</span>
        </div>
      )}
      <div className="mb-2 text-2xl">{achievement.emoji}</div>
      <div className={`font-serif text-sm font-semibold leading-tight mb-0.5 ${unlocked ? "text-warm-dark" : "text-warm-gray"}`}>
        {achievement.name}
      </div>
      <p className="text-[11px] font-semibold text-warm-gray mb-3 leading-snug">{achievement.description}</p>
      {!unlocked && (
        <div className="h-1.5 w-full rounded-full bg-warm-wood-pale overflow-hidden">
          <div className="h-full rounded-full bg-sage/60 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {!unlocked && (
        <div className="mt-1 text-[10px] font-bold text-warm-gray text-right">
          {achievement.target >= 3600 ? `${Math.floor(value / 3600)}h / ${Math.floor(achievement.target / 3600)}h` : `${value} / ${achievement.target}`}
        </div>
      )}
    </div>
  );
}

function Heatmap({ sessions }: { sessions: { started_at: string; rows_added: number }[] }) {
  const levelColors = ["#F0E6D6", "#C8DFCA", "#8FBF9A", "#6B9E7A", "#4A7C59"];

  const dateRows = new Map<string, number>();
  for (const s of sessions) {
    const dateStr = new Date(s.started_at).toISOString().split("T")[0];
    dateRows.set(dateStr, (dateRows.get(dateStr) || 0) + (s.rows_added || 0));
  }

  const allRows = Array.from(dateRows.values());
  const maxRows = Math.max(1, ...allRows);

  const today = new Date();
  const endDate = new Date(today);
  const endDay = endDate.getDay();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - endDay - 25 * 7);

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const grid: { date: Date; dateStr: string; rows: number; level: number }[][] = [];
  for (let week = 0; week < 26; week++) {
    const weekDays: { date: Date; dateStr: string; rows: number; level: number }[] = [];
    for (let day = 0; day < 7; day++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + week * 7 + day);
      const dateStr = d.toISOString().split("T")[0];
      const rows = dateRows.get(dateStr) || 0;
      const isFuture = d > today;
      let level = 0;
      if (!isFuture && rows > 0) {
        const ratio = rows / maxRows;
        if (ratio <= 0.25) level = 1;
        else if (ratio <= 0.5) level = 2;
        else if (ratio <= 0.75) level = 3;
        else level = 4;
      }
      weekDays.push({ date: d, dateStr, rows, level: isFuture ? -1 : level });
    }
    grid.push(weekDays);
  }

  const monthPositions: { label: string; week: number }[] = [];
  let lastMonth = -1;
  for (let week = 0; week < grid.length; week++) {
    const m = grid[week][0].date.getMonth();
    if (m !== lastMonth) {
      monthPositions.push({ label: monthLabels[m], week });
      lastMonth = m;
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale mb-6">
      <div className="mb-4">
        <h2 className="font-serif text-lg">Crafting Activity</h2>
        <p className="text-[13px] font-semibold text-warm-gray">
          {allRows.length > 0
            ? `${allRows.reduce((a, b) => a + b, 0)} total rows across ${dateRows.size} days`
            : "Start logging sessions to see your activity here"}
        </p>
      </div>
      <div className="flex gap-1 mb-1 ml-6">
        {monthPositions.map((mp, i) => {
          const nextWeek = i < monthPositions.length - 1 ? monthPositions[i + 1].week : 26;
          const span = nextWeek - mp.week;
          return (
            <div key={i} className="text-[10px] font-bold text-warm-gray" style={{ width: `${span * 18}px` }}>
              {mp.label}
            </div>
          );
        })}
      </div>
      <div className="flex gap-0.5 overflow-x-auto pb-2">
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((cell, di) => (
              <div
                key={di}
                className={`h-3.5 w-3.5 rounded-[3px] transition-transform hover:scale-150 ${
                  cell.level === -1 ? "opacity-0 cursor-default" : "cursor-pointer"
                }`}
                style={{ background: cell.level >= 0 ? levelColors[cell.level] : "transparent" }}
                title={
                  cell.level >= 0 ? `${monthLabels[cell.date.getMonth()]} ${cell.date.getDate()}: ${cell.rows} rows` : ""
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="text-[11px] font-semibold text-warm-gray">Less</span>
        {levelColors.map((c, i) => (
          <div key={i} className="h-3.5 w-3.5 rounded-[3px]" style={{ background: c }} />
        ))}
        <span className="text-[11px] font-semibold text-warm-gray">More</span>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

const EMOJIS = ["🧣", "🧢", "🧸", "🧤", "🧵", "🎀", "🪢", "🧶"];

export default function JournalPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");
  const [projects, setProjects] = useState<RawProject[]>([]);
  const [allSessions, setAllSessions] = useState<RawSession[]>([]);
  const [projectPhotos, setProjectPhotos] = useState<ProjectPhoto[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);

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

      const { data: projectData } = await supabase.from("projects").select("*").eq("user_id", user.id);
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("*, projects!inner(name, yarn_color)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      const { data: photoData } = await supabase
        .from("project_photos")
        .select("project_id, photo_url, photo_type");

      setProjects(projectData || []);
      setAllSessions((sessionData as unknown as RawSession[]) || []);
      setProjectPhotos((photoData as ProjectPhoto[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  // Filter sessions by period
  const sessions = useMemo(() => {
    const cutoff = periodCutoff(period);
    if (!cutoff) return allSessions;
    return allSessions.filter((s) => new Date(s.started_at) >= cutoff);
  }, [allSessions, period]);

  // Compute stats
  const stats = useMemo(() => {
    const finished = projects.filter((p) => p.status === "done").length;
    const totalTimeSeconds = sessions.reduce((s, sess) => s + (sess.duration_seconds || 0), 0);
    const totalRows = projects.reduce((s, p) => s + (p.current_row || 0), 0);

    // Streak
    const sessionDates = allSessions
      .map((s) => new Date(s.started_at).toISOString().split("T")[0])
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort()
      .reverse();

    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const dateStr = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      if (sessionDates.includes(dateStr)) streak++;
      else if (i > 0) break;
    }
    const bestStreak = calcBestStreak(allSessions);

    // Weekly rows (always last 7 days regardless of period)
    const weeklyRows = Array.from({ length: 7 }, (_, i) => {
      const dateStr = new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0];
      const daySessions = allSessions.filter(
        (s) => new Date(s.started_at).toISOString().split("T")[0] === dateStr
      );
      return daySessions.reduce((sum, s) => sum + (s.rows_added || 0), 0);
    });

    // Time per project (filtered by period)
    const projectTimeMap = new Map<string, { name: string; color: string; seconds: number }>();
    for (const sess of sessions) {
      const proj = sess.projects;
      if (!proj) continue;
      const existing = projectTimeMap.get(sess.project_id);
      if (existing) {
        existing.seconds += sess.duration_seconds || 0;
      } else {
        projectTimeMap.set(sess.project_id, {
          name: proj.name,
          color: proj.yarn_color || "#6B9E7A",
          seconds: sess.duration_seconds || 0,
        });
      }
    }
    const totalHours = totalTimeSeconds / 3600;
    const timePerProject = Array.from(projectTimeMap.values())
      .map((p) => ({
        name: p.name,
        color: p.color,
        hours: Math.round((p.seconds / 3600) * 10) / 10,
        pct: totalHours > 0 ? Math.round((p.seconds / totalTimeSeconds) * 100) : 0,
      }))
      .sort((a, b) => b.hours - a.hours);

    // Journal entries from filtered sessions
    const journalEntries = sessions.slice(0, 20).map((sess, idx) => {
      const proj = sess.projects;
      const d = new Date(sess.started_at);
      const totalS = sess.duration_seconds || 0;
      const h = Math.floor(totalS / 3600);
      const m = Math.floor((totalS % 3600) / 60);
      const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
      return {
        day: d.getDate(),
        month: d.toLocaleDateString("en-US", { month: "short" }),
        project: proj?.name || "Unknown",
        projectColor: proj?.yarn_color || "#6B9E7A",
        note: sess.notes || "Crafting session logged",
        rows: sess.rows_added || 0,
        time: timeStr,
        emoji: EMOJIS[idx % EMOJIS.length],
      };
    });

    return {
      finished,
      totalTimeSeconds,
      totalRows,
      streak,
      bestStreak,
      weeklyRows,
      timePerProject,
      journalEntries,
    };
  }, [projects, sessions, allSessions]);

  // Achievement values (always based on ALL data, not period-filtered)
  const achievementData: StatsData = { projects, sessions, allSessions };
  const achievementValues = useMemo(() => {
    return ACHIEVEMENTS.map((a) => ({ achievement: a, value: a.getValue(achievementData) }));
  }, [projects, allSessions]);
  const unlockedCount = achievementValues.filter(({ achievement, value }) => value >= achievement.target).length;

  if (loading) {
    return (
      <>
        <Nav />
        <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
          <div className="mb-6">
            <h1 className="font-serif text-2xl">📖 Journal</h1>
            <p className="text-sm font-semibold text-warm-gray">
              <span className="inline-block h-4 w-40 animate-pulse bg-warm-wood-pale rounded" />
            </p>
          </div>
          <JournalSkeleton />
        </main>
      </>
    );
  }

  const totalHours = Math.round(stats.totalTimeSeconds / 3600);
  const maxRow = Math.max(...stats.weeklyRows, 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Group achievements by category
  const achievementGroups = new Map<string, { achievement: Achievement; value: number }[]>();
  for (const av of achievementValues) {
    const cat = av.achievement.category;
    if (!achievementGroups.has(cat)) achievementGroups.set(cat, []);
    achievementGroups.get(cat)!.push(av);
  }

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl">📊 Stats & Journal</h1>
            <p className="text-sm font-semibold text-warm-gray">Your crafting story</p>
          </div>
          <div className="flex gap-1 rounded-xl bg-warm-bg p-1">
            {(["week", "month", "year", "all"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-2 text-[12px] font-bold transition-colors capitalize ${
                  period === p ? "bg-sage text-white" : "text-warm-gray hover:text-warm-dark"
                }`}
              >
                {p === "all" ? "All Time" : p}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard emoji="🧶" value={String(stats.finished)} label="Finished" />
          <StatCard emoji="⏱️" value={totalHours > 0 ? `${totalHours}h` : "0m"} label="Time Spent" />
          <StatCard emoji="📏" value={String(stats.totalRows)} label="Total Rows" />
          <StatCard emoji="🧵" value={String(sessions.length)} label="Sessions" />
          <StatCard emoji="🔥" value={String(stats.streak)} label="Day Streak" sub={`Best: ${stats.bestStreak} days`} />
        </div>

        {/* Achievements Toggle */}
        <button
          onClick={() => setShowAchievements(!showAchievements)}
          className="w-full mb-6 rounded-2xl bg-white p-4 shadow-soft border border-warm-wood-pale flex items-center justify-between transition-all hover:shadow-lifted"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🏆</span>
            <div className="text-left">
              <div className="font-serif text-sm font-semibold">Achievements</div>
              <div className="text-[12px] font-semibold text-warm-gray">
                {unlockedCount} of {ACHIEVEMENTS.length} unlocked
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-32 rounded-full bg-warm-bg overflow-hidden">
              <div
                className="h-full rounded-full bg-sage transition-all"
                style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
              />
            </div>
            <span className={`text-warm-gray transition-transform ${showAchievements ? "rotate-180" : ""}`}>▾</span>
          </div>
        </button>

        {/* Achievements Grid */}
        {showAchievements && (
          <div className="mb-6 space-y-6">
            {Array.from(achievementGroups.entries()).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-serif text-sm font-semibold text-warm-gray mb-3 uppercase tracking-wider">{category}</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map(({ achievement, value }) => (
                    <AchievementCard key={achievement.id} achievement={achievement} value={value} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Project Timeline */}
        {projects.length > 0 && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <div className="mb-4">
              <h2 className="font-serif text-lg">📸 Project Progress</h2>
              <p className="text-[13px] font-semibold text-warm-gray">
                {projectPhotos.length > 0
                  ? `${projects.length} projects · ${projectPhotos.length} photos uploaded`
                  : "Upload photos on each project to see your progress here"}
              </p>
            </div>
            <div className="space-y-5">
              {projects.map((project) => {
                const photos = projectPhotos.filter((p) => p.project_id === project.id);
                const byType = new Map(photos.map((p) => [p.photo_type, p.photo_url]));
                const hasAny = byType.size > 0;
                const progress = project.total_rows ? Math.round(((project.current_row || 0) / project.total_rows) * 100) : 0;
                const statusColor = project.status === "done" ? "bg-sage text-white" : project.status === "active" ? "bg-sage-light text-sage-deep" : "bg-warm-bg text-warm-gray";
                const statusLabel = project.status === "done" ? "Finished" : project.status === "active" ? "In Progress" : "Not Started";

                return (
                  <div key={project.id} className={`rounded-xl border border-warm-wood-pale/60 p-4 ${hasAny ? "bg-warm-bg/30" : "bg-white"}`}>
                    {/* Project header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: project.yarn_color || "#6B9E7A" }}
                        />
                        <span className="text-[14px] font-extrabold">{project.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${statusColor}`}>
                          {statusLabel}
                        </span>
                        {project.total_rows ? (
                          <span className="text-[11px] font-bold text-warm-gray">
                            {project.current_row || 0}/{project.total_rows} rows ({progress}%)
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Photo timeline: Start → Progress → Final */}
                    <div className="flex items-start gap-2">
                      {(["start", "progress", "final"] as const).map((type, i) => {
                        const url = byType.get(type);
                        const label = type === "start" ? "Started" : type === "progress" ? "In Progress" : "Final";
                        return (
                          <div key={type} className="flex items-start gap-2 flex-1">
                            {/* Connector line */}
                            {i > 0 && (
                              <div className="flex-shrink-0 w-6 pt-8">
                                <div className="h-px w-full bg-warm-wood-pale" style={{ width: '100%' }}>
                                  <div className="h-px bg-warm-wood-pale" style={{ width: '100%', marginTop: '0px' }} />
                                </div>
                              </div>
                            )}
                            <div className="flex-1 flex flex-col items-center">
                              {url ? (
                                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 shadow-sm">
                                  <img src={url} alt={`${project.name} ${label}`} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-full aspect-square rounded-lg border-2 border-dashed border-warm-wood-pale flex items-center justify-center mb-2 bg-white">
                                  <span className="text-[20px] opacity-30">
                                    {type === "start" ? "🌱" : type === "progress" ? "🔨" : "🏁"}
                                  </span>
                                </div>
                              )}
                              <span className={`text-[10px] font-bold text-center ${url ? "text-warm-dark" : "text-warm-gray"}`}>
                                {label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Heatmap */}
        <Heatmap sessions={allSessions.map((s) => ({ started_at: s.started_at, rows_added: s.rows_added || 0 }))} />

        {/* Two column: Weekly + Time */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Weekly Rows */}
          <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <div className="mb-4">
              <h2 className="font-serif text-lg">Rows This Week</h2>
              <p className="text-[13px] font-semibold text-warm-gray">
                {stats.weeklyRows.reduce((a, b) => a + b, 0)} total · avg{" "}
                {Math.round(stats.weeklyRows.reduce((a, b) => a + b, 0) / 7)}/day
              </p>
            </div>
            <div className="flex items-end gap-3 h-40 border-b-2 border-warm-wood-pale pb-0">
              {stats.weeklyRows.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[11px] font-extrabold">{v}</span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${(v / maxRow) * 100}%`,
                      background:
                        v === maxRow && v > 0 ? "var(--sage-deep)" : v > 15 ? "var(--sage)" : "var(--sage-light)",
                      minHeight: 4,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              {days.map((d) => (
                <span key={d} className="flex-1 text-center text-[11px] font-bold text-warm-gray">
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Time per Project */}
          <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <div className="mb-4">
              <h2 className="font-serif text-lg">Time per Project</h2>
              <p className="text-[13px] font-semibold text-warm-gray">
                {totalHours > 0 ? `${totalHours} hours total` : "No sessions yet"}
              </p>
            </div>
            <div className="space-y-4">
              {stats.timePerProject.length === 0 ? (
                <p className="text-[13px] text-warm-gray">No data yet</p>
              ) : (
                stats.timePerProject.map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-shrink-0 w-24 sm:w-32 lg:w-40">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <span className="text-[13px] font-bold truncate">{p.name}</span>
                    </div>
                    <div className="flex-1 h-5 rounded-full bg-warm-bg overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center pl-2.5"
                        style={{
                          width: `${Math.max(p.pct, 10)}%`,
                          background: `linear-gradient(90deg, ${p.color}, ${p.color}cc)`,
                          minWidth: 36,
                        }}
                      >
                        <span className="text-[10px] font-extrabold text-white">{p.hours}h</span>
                      </div>
                    </div>
                    <span className="text-[13px] font-extrabold min-w-[36px] text-right">{p.hours}h</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Yarn Stash */}
        {(() => {
          const yarnUsage = allSessions.length > 0 ? (() => {
            // Derive yarn usage from projects
            const yarnMap = new Map<string, { name: string; color: string; count: number }>();
            for (const p of projects) {
              const existing = yarnMap.get(p.id);
              if (existing) existing.count++;
              else yarnMap.set(p.id, { name: p.name, color: p.yarn_color || "#6B9E7A", count: 1 });
            }
            return Array.from(yarnMap.values());
          })() : [];
          return yarnUsage.length > 0 ? (
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
              <div className="mb-4">
                <h2 className="font-serif text-lg">Yarn Stash</h2>
                <p className="text-[13px] font-semibold text-warm-gray">{yarnUsage.length} colors in rotation</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {yarnUsage.map((y) => (
                  <div key={y.name} className="flex items-center gap-2 rounded-xl bg-warm-bg px-3 py-2">
                    <div className="h-3.5 w-3.5 rounded-full" style={{ background: y.color }} />
                    <span className="text-[13px] font-bold">{y.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* Journal Entries */}
        <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
          <div className="mb-4">
            <h2 className="font-serif text-lg">📝 Journal</h2>
            <p className="text-[13px] font-semibold text-warm-gray">
              {period === "all" ? "All time" : `Last ${period === "week" ? "7 days" : period === "month" ? "30 days" : "year"}`} ·{" "}
              {sessions.length} sessions
            </p>
          </div>
          <div className="space-y-0">
            {stats.journalEntries.length === 0 ? (
              <p className="text-[13px] text-warm-gray py-4">
                {period === "all" ? "No sessions logged yet" : "No sessions in this period — try expanding the range"}
              </p>
            ) : (
              stats.journalEntries.map((entry, i) => (
                <div key={i} className="flex gap-4 border-b border-warm-bg py-4 last:border-0">
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className="font-serif text-2xl font-semibold leading-none">{entry.day}</div>
                    <div className="text-[10px] font-extrabold uppercase text-warm-gray">{entry.month}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: entry.projectColor }} />
                      <span className="text-[14px] font-extrabold">{entry.project}</span>
                    </div>
                    <p className="text-[13px] text-warm-gray mb-2 leading-relaxed">{entry.note}</p>
                    <div className="flex gap-4">
                      {entry.rows > 0 && (
                        <span className="text-[12px] font-bold text-sage-deep">📏 +{entry.rows} rows</span>
                      )}
                      <span className="text-[12px] font-bold text-sage-deep">⏱️ {entry.time}</span>
                    </div>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-warm-bg text-xl">
                    {entry.emoji}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
