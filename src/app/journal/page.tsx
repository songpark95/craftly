"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { JournalSkeleton } from "@/components/Skeleton";
import { createClient } from "@/lib/supabase/client";

interface SessionStats {
  finished: number;
  totalTimeSeconds: number;
  totalRows: number;
  skeinsUsed: number;
  streak: number;
  bestStreak: number;
  weeklyRows: number[];
  timePerProject: { name: string; color: string; hours: number; pct: number }[];
  yarnUsage: { name: string; color: string; skeins: number; pct: number }[];
  journalEntries: {
    day: number;
    month: string;
    project: string;
    projectColor: string;
    note: string;
    rows: number;
    time: string;
    emoji: string;
  }[];
}

const EMOJIS = ["🧣", "🧢", "🧸", "🧤", "🧵", "🎀", "🪢", "🧶"];

function Heatmap() {
  const levelColors = ["#F0E6D6", "#C8DFCA", "#8FBF9A", "#6B9E7A", "#4A7C59"];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale mb-6">
      <div className="mb-4">
        <h2 className="font-serif text-lg">Crafting Activity</h2>
        <p className="text-[13px] font-semibold text-warm-gray">
          Rows completed per day — last 6 months
        </p>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {Array.from({ length: 26 }, (_, week) => (
          <div key={week} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, day) => {
              const level = Math.floor(Math.random() * 4);
              return (
                <div
                  key={day}
                  className="h-3.5 w-3.5 rounded-[3px] transition-transform hover:scale-150"
                  style={{ background: levelColors[level] }}
                  title={`Week ${week + 1}, Day ${day + 1}`}
                />
              );
            })}
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

export default function JournalPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SessionStats | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/login");
        return;
      }

      // Fetch all projects for this user
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id);

      // Fetch all sessions for this user
      const { data: sessions } = await supabase
        .from("sessions")
        .select("*, projects!inner(name, yarn_color)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      // Fetch all yarn
      const { data: yarn } = await supabase
        .from("yarn")
        .select("*")
        .eq("user_id", user.id);

      const projectList = projects || [];
      const sessionList = sessions || [];
      const yarnList = yarn || [];

      // Stats computed from real data
      const finished = projectList.filter((p) => p.status === "done").length;
      const totalTimeSeconds = sessionList.reduce((s, sess) => s + (sess.duration_seconds || 0), 0);
      const totalRows = projectList.reduce((s, p) => s + (p.current_row || 0), 0);
      const skeinsUsed = 0;

      // Streak from sessions
      const sessionDates = sessionList
        .map((s) => new Date(s.started_at).toISOString().split("T")[0])
        .filter((v, i, a) => a.indexOf(v) === i) // unique dates
        .sort()
        .reverse();

      let streak = 0;
      let bestStreak = 0;
      const today = new Date().toISOString().split("T")[0];
      let checkDate = today;

      // Count consecutive days with sessions
      for (let i = 0; i < 365; i++) {
        const dateStr = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
        if (sessionDates.includes(dateStr)) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      bestStreak = streak;

      // Weekly rows (last 7 days)
      const weeklyRows = Array.from({ length: 7 }, (_, i) => {
        const dateStr = new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0];
        const daySessions = sessionList.filter(
          (s) => new Date(s.started_at).toISOString().split("T")[0] === dateStr
        );
        return daySessions.reduce((sum, s) => sum + (s.rows_added || 0), 0);
      });

      // Time per project
      const projectTimeMap = new Map<string, { name: string; color: string; seconds: number }>();
      for (const sess of sessionList) {
        const proj = sess.projects as unknown as { name: string; yarn_color: string | null };
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

      // Yarn usage (simplified: show all yarn)
      const totalYarnQty = yarnList.reduce((s, y) => s + (y.quantity || 0), 0);
      const yarnUsage = yarnList.map((y) => ({
        name: y.name,
        color: y.color_hex || "#6B9E7A",
        skeins: y.quantity || 0,
        pct: totalYarnQty > 0 ? Math.round(((y.quantity || 0) / totalYarnQty) * 100) : 0,
      }));

      // Journal entries from sessions
      const journalEntries = sessionList.slice(0, 10).map((sess, idx) => {
        const proj = sess.projects as unknown as { name: string; yarn_color: string | null };
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

      setStats({
        finished,
        totalTimeSeconds,
        totalRows,
        skeinsUsed,
        streak,
        bestStreak,
        weeklyRows,
        timePerProject,
        yarnUsage,
        journalEntries,
      });

      setLoading(false);
    }
    load();
  }, []);

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

  if (!stats) return null;

  const totalHours = Math.round(stats.totalTimeSeconds / 3600);
  const maxRow = Math.max(...stats.weeklyRows, 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-serif text-2xl">📊 Stats & Journal</h1>
            <p className="text-sm font-semibold text-warm-gray">
              Your crafting story
            </p>
          </div>
          <div className="flex gap-1 rounded-xl bg-warm-bg p-1">
            {["Week", "Month", "Year", "All Time"].map((p, i) => (
              <button
                key={p}
                className={`rounded-lg px-3 py-2 text-[12px] font-bold transition-colors ${
                  i === 1 ? "bg-sage text-white" : "text-warm-gray hover:text-warm-dark"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard emoji="🧶" value={String(stats.finished)} label="Finished" />
          <StatCard emoji="⏱️" value={`${totalHours}h`} label="Time Spent" />
          <StatCard emoji="📏" value={String(stats.totalRows)} label="Total Rows" />
          <StatCard emoji="🧵" value={String(stats.yarnUsage.reduce((s, y) => s + y.skeins, 0))} label="Skeins" />
          <StatCard emoji="🔥" value={String(stats.streak)} label="Day Streak" sub={`Best: ${stats.bestStreak} days`} />
        </div>

        {/* Streak Banner */}
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-sage-deep to-sage p-8 text-white">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">
              Current Streak
            </div>
            <div className="font-serif text-5xl leading-none mt-1">
              {stats.streak} days 🔥
            </div>
            <div className="mt-1 text-sm font-semibold opacity-90">
              {stats.bestStreak > 0
                ? `Your best was ${stats.bestStreak} days — keep going!`
                : "Start a streak by logging a session!"}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 14 }, (_, i) => {
              const d = new Date(Date.now() - (13 - i) * 86400000);
              return (
                <div
                  key={i}
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                    i < stats.streak
                      ? "bg-white text-sage-deep"
                      : i === stats.streak
                      ? "bg-white text-sage-deep ring-2 ring-white/50"
                      : "bg-white/20"
                  }`}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>
        </div>

        {/* Heatmap */}
        <Heatmap />

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
                        v === maxRow && v > 0
                          ? "var(--sage-deep)"
                          : v > 15
                          ? "var(--sage)"
                          : "var(--sage-light)",
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
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ background: p.color }}
                      />
                      <span className="text-[13px] font-bold truncate">{p.name}</span>
                    </div>
                    <div className="flex-1 h-5 rounded-full bg-warm-bg overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center pl-2.5"
                        style={{
                          width: `${p.pct}%`,
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

        {/* Yarn Usage Donut */}
        {stats.yarnUsage.length > 0 && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <div className="mb-4">
              <h2 className="font-serif text-lg">Yarn Stash</h2>
              <p className="text-[13px] font-semibold text-warm-gray">
                {stats.yarnUsage.reduce((s, y) => s + y.skeins, 0)} skeins across{" "}
                {stats.yarnUsage.length} colors
              </p>
            </div>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              {/* Donut */}
              <div className="relative h-44 w-44 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {stats.yarnUsage.reduce<{ offset: number; elements: React.ReactElement[] }>(
                    (acc, yarn, i) => {
                      const circumference = 2 * Math.PI * 36;
                      const segmentLength = (yarn.pct / 100) * circumference;
                      const el = (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r="36"
                          fill="none"
                          stroke={yarn.color}
                          strokeWidth="28"
                          strokeDasharray={`${segmentLength} ${circumference}`}
                          strokeDashoffset={-acc.offset}
                        />
                      );
                      acc.offset += segmentLength;
                      acc.elements.push(el);
                      return acc;
                    },
                    { offset: 0, elements: [] }
                  ).elements}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-serif text-3xl font-semibold">
                    {stats.yarnUsage.reduce((s, y) => s + y.skeins, 0)}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-warm-gray">
                    Skeins
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2">
                {stats.yarnUsage.map((y) => (
                  <div
                    key={y.name}
                    className="flex items-center gap-3 border-b border-warm-bg py-2 last:border-0"
                  >
                    <div className="h-3.5 w-3.5 rounded flex-shrink-0" style={{ background: y.color }} />
                    <span className="text-[13px] font-bold flex-1">{y.name}</span>
                    <span className="text-[13px] font-extrabold">{y.skeins} skeins</span>
                    <span className="text-[12px] font-semibold text-warm-gray w-10 text-right">
                      {y.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Journal Entries */}
        <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
          <div className="mb-4">
            <h2 className="font-serif text-lg">📝 Journal</h2>
            <p className="text-[13px] font-semibold text-warm-gray">
              Auto-logged from your crafting sessions
            </p>
          </div>
          <div className="space-y-0">
            {stats.journalEntries.length === 0 ? (
              <p className="text-[13px] text-warm-gray py-4">No sessions logged yet</p>
            ) : (
              stats.journalEntries.map((entry, i) => (
                <div key={i} className="flex gap-4 border-b border-warm-bg py-4 last:border-0">
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className="font-serif text-2xl font-semibold leading-none">{entry.day}</div>
                    <div className="text-[10px] font-extrabold uppercase text-warm-gray">
                      {entry.month}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ background: entry.projectColor }}
                      />
                      <span className="text-[14px] font-extrabold">{entry.project}</span>
                    </div>
                    <p className="text-[13px] text-warm-gray mb-2 leading-relaxed">{entry.note}</p>
                    <div className="flex gap-4">
                      {entry.rows > 0 && (
                        <span className="text-[12px] font-bold text-sage-deep">
                          📏 +{entry.rows} rows
                        </span>
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

function StatCard({
  emoji,
  value,
  label,
  sub,
}: {
  emoji: string;
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 text-center shadow-soft border border-warm-wood-pale transition-all hover:-translate-y-0.5 hover:shadow-lifted">
      <div className="mb-2 text-2xl">{emoji}</div>
      <div className="font-serif text-3xl font-semibold leading-none mb-1">{value}</div>
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-warm-gray mb-1">
        {label}
      </div>
      {sub && <div className="text-[11px] font-bold text-sage">{sub}</div>}
    </div>
  );
}