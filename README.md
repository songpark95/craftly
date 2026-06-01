# craftly

A cozy browser-based crafting companion — track projects, yarn stash, stitch patterns, and crafting stats.

## Tech Stack
- **Next.js 16** (App Router)
- **Tailwind CSS** with custom warm palette
- **Supabase** (auth, database, storage)
- **Zustand** for client state (timer, optimistic counter)
- **TypeScript**

## Pages
| Route | Description |
|-------|-------------|
| `/` | Dashboard — project cards, finished objects shelf |
| `/projects/[id]` | Project detail — hero row counter, session timer, notes |
| `/stash` | Yarn stash — filter by weight, allocation status |
| `/patterns` | Stitch pattern library — knit/crochet charts, categories |
| `/journal` | Stats & journal — heatmap, streaks, charts, session logs |

## Getting Started

```bash
# Install
npm install

# Set up Supabase
cp .env.local.example .env.local
# Fill in your Supabase URL + anon key

# Run schema
# Copy supabase/schema.sql into Supabase Dashboard → SQL Editor → Run

# Dev server
npm run dev
```

## Database
Run `supabase/schema.sql` in your Supabase project. It creates:
- `projects` — WIP/queued/done projects with row counters
- `sessions` — timer logs per project
- `yarn` — stash inventory (color, weight, fiber)
- `project_yarn` — many-to-many allocation
- `patterns` — stitch reference library
- `project_photos` — progress photos
- `row_history` — daily row aggregates

Plus RLS policies (user sees only their data) and storage buckets for photos.
