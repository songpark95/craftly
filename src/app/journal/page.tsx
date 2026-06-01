"use client";

import Nav from "@/components/Nav";

const HERO_STATS = [
  { emoji: "🧶", value: "7", label: "Finished", change: "+2 this month", up: true },
  { emoji: "⏱️", value: "68h", label: "Time Spent", change: "+12h vs last month", up: true },
  { emoji: "📏", value: "847", label: "Total Rows", change: "+127 this week", up: true },
  { emoji: "🧵", value: "14", label: "Skeins Used", change: "−4 from stash", up: true },
  { emoji: "🔥", value: "12", label: "Day Streak", change: "Best: 18 days", up: true },
];

const TIME_PER_PROJECT = [
  { name: "Forest Green Scarf", color: "#4A7C59", hours: 28, pct: 65 },
  { name: "Sunflower Beanie", color: "#D4A843", hours: 17, pct: 40 },
  { name: "Lavender Amigurumi", color: "#8B7AB8", hours: 12, pct: 28 },
  { name: "Blue Scarf (done)", color: "#C47B7B", hours: 7, pct: 16 },
  { name: "Other", color: "#C4A87C", hours: 4, pct: 9 },
];

const YARN_USAGE = [
  { name: "Forest Green", color: "#4A7C59", skeins: 4, pct: 28 },
  { name: "Sunflower", color: "#D4A843", skeins: 3, pct: 21 },
  { name: "Lavender", color: "#8B7AB8", skeins: 2, pct: 14 },
  { name: "Cream", color: "#F5E6CC", skeins: 2, pct: 14 },
  { name: "Storm", color: "#6B8F9B", skeins: 2, pct: 14 },
  { name: "Rose & Other", color: "#C47B7B", skeins: 1, pct: 9 },
];

const JOURNAL_ENTRIES = [
  { day: 1, month: "Jun", project: "Forest Green Scarf", projectColor: "#4A7C59", note: "Hit row 42 — halfway there! Seed stitch looking really even.", rows: 12, time: "1h 23m", emoji: "🧣" },
  { day: 31, month: "May", project: "Sunflower Beanie", projectColor: "#D4A843", note: "Round 18 of double crochet. Starting to see the shape form.", rows: 8, time: "45m", emoji: "🧢" },
  { day: 30, month: "May", project: "Lavender Amigurumi", projectColor: "#8B7AB8", note: "Started the bear! Magic ring was tricky — redid it 3 times.", rows: 8, time: "1h 5m", emoji: "🧸" },
];

function Heatmap() {
  // Generate a simple 26-week heatmap
  const cells = Array.from({ length: 182 }, (_, i) => {
    const day = i % 7;
    const week = Math.floor(i / 7);
    // Simulate activity: weekdays more active, random rest days
    if (day === 0 && week % 3 === 0) return 0;
    if (week > 20) return Math.floor(Math.random() * 3) + 2;
    if (week > 10) return Math.floor(Math.random() * 4);
    return Math.floor(Math.random() * 3);
  });

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
              const level = cells[week * 7 + day];
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
  const weeklyRows = [14, 20, 8, 26, 18, 23, 18];
  const maxRow = Math.max(...weeklyRows);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      <Nav />
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-serif text-2xl">📊 Stats & Journal</h1>
            <p className="text-sm font-semibold text-warm-gray">
              Your crafting story this year
            </p>
          </div>
          <div className="flex gap-1 rounded-xl bg-warm-bg p-1">
            {["Week", "Month", "Year", "All Time"].map((p, i) => (
              <button
                key={p}
                className={`rounded-lg px-3 py-1 text-[12px] font-bold transition-colors ${
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
          {HERO_STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-white p-5 text-center shadow-soft border border-warm-wood-pale transition-all hover:-translate-y-0.5 hover:shadow-lifted"
            >
              <div className="mb-2 text-2xl">{s.emoji}</div>
              <div className="font-serif text-3xl font-semibold leading-none mb-1">
                {s.value}
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-warm-gray mb-1">
                {s.label}
              </div>
              <div className="text-[11px] font-bold text-sage">{s.change}</div>
            </div>
          ))}
        </div>

        {/* Streak Banner */}
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-sage-deep to-sage p-8 text-white">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">
              Current Streak
            </div>
            <div className="font-serif text-5xl leading-none mt-1">
              12 days 🔥
            </div>
            <div className="mt-1 text-sm font-semibold opacity-90">
              Your best was 18 days — keep going!
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {[21,22,23,24,25,26,27,28,29,30,31,1,2,3].map((d, i) => (
              <div
                key={d}
                className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                  i < 12
                    ? "bg-white text-sage-deep"
                    : i === 12
                    ? "bg-white text-sage-deep ring-2 ring-white/50"
                    : "bg-white/20"
                }`}
              >
                {d}
              </div>
            ))}
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
                {weeklyRows.reduce((a, b) => a + b, 0)} total · avg{" "}
                {Math.round(weeklyRows.reduce((a, b) => a + b, 0) / 7)}/day
              </p>
            </div>
            <div className="flex items-end gap-3 h-40 border-b-2 border-warm-wood-pale pb-0">
              {weeklyRows.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[11px] font-extrabold">{v}</span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${(v / maxRow) * 100}%`,
                      background: v === maxRow ? "var(--sage-deep)" : v > 15 ? "var(--sage)" : "var(--sage-light)",
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
                June 2026 — 68 hours total
              </p>
            </div>
            <div className="space-y-4">
              {TIME_PER_PROJECT.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-[150px]">
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
                      <span className="text-[10px] font-extrabold text-white">
                        {p.hours}h
                      </span>
                    </div>
                  </div>
                  <span className="text-[13px] font-extrabold min-w-[36px] text-right">
                    {p.hours}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Yarn Usage Donut */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
          <div className="mb-4">
            <h2 className="font-serif text-lg">Yarn Used This Year</h2>
            <p className="text-[13px] font-semibold text-warm-gray">
              14 skeins consumed across 6 colors
            </p>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            {/* Donut */}
            <div className="relative h-44 w-44 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                {YARN_USAGE.reduce<{ offset: number; elements: React.ReactElement[] }>(
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
                <span className="font-serif text-3xl font-semibold">14</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-warm-gray">
                  Skeins
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              {YARN_USAGE.map((y) => (
                <div key={y.name} className="flex items-center gap-3 border-b border-warm-bg py-2 last:border-0">
                  <div className="h-3.5 w-3.5 rounded flex-shrink-0" style={{ background: y.color }} />
                  <span className="text-[13px] font-bold flex-1">{y.name}</span>
                  <span className="text-[13px] font-extrabold">{y.skeins} skeins</span>
                  <span className="text-[12px] font-semibold text-warm-gray w-10 text-right">{y.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Journal Entries */}
        <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
          <div className="mb-4">
            <h2 className="font-serif text-lg">📝 Journal</h2>
            <p className="text-[13px] font-semibold text-warm-gray">
              Auto-logged from your crafting sessions
            </p>
          </div>
          <div className="space-y-0">
            {JOURNAL_ENTRIES.map((entry, i) => (
              <div
                key={i}
                className="flex gap-4 border-b border-warm-bg py-4 last:border-0"
              >
                <div className="flex-shrink-0 w-14 text-center">
                  <div className="font-serif text-2xl font-semibold leading-none">
                    {entry.day}
                  </div>
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
                    <span className="text-[14px] font-extrabold">
                      {entry.project}
                    </span>
                  </div>
                  <p className="text-[13px] text-warm-gray mb-2 leading-relaxed">
                    {entry.note}
                  </p>
                  <div className="flex gap-4">
                    <span className="text-[12px] font-bold text-sage-deep">
                      📏 +{entry.rows} rows
                    </span>
                    <span className="text-[12px] font-bold text-sage-deep">
                      ⏱️ {entry.time}
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-warm-bg text-xl">
                  {entry.emoji}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
