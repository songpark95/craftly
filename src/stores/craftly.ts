import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Project {
  id: string;
  name: string;
  type: "knit" | "crochet";
  status: "wip" | "queued" | "done";
  currentRow: number;
  totalRows?: number;
  stitchName?: string;
  yarnWeight?: string;
  needleSize?: string;
  notes: string;
  photoUrl?: string;
  createdAt: string;
}

interface TimerState {
  running: boolean;
  projectId: string | null;
  startTime: number | null;
  elapsed: number; // seconds
}

interface CraftlyStore {
  // Timer (persists across page navigations)
  timer: TimerState;
  startTimer: (projectId: string) => void;
  stopTimer: () => number; // returns elapsed seconds
  pauseTimer: () => void;
  resumeTimer: () => void;
  tickTimer: () => void;

  // Counter (optimistic update, syncs to DB)
  optimisticRow: Record<string, number>;
  setOptimisticRow: (projectId: string, row: number) => void;
  clearOptimisticRow: (projectId: string) => void;
}

export const useCraftlyStore = create<CraftlyStore>()(
  persist(
    (set, get) => ({
      // Timer
      timer: {
        running: false,
        projectId: null,
        startTime: null,
        elapsed: 0,
      },

      startTimer: (projectId) =>
        set({
          timer: {
            running: true,
            projectId,
            startTime: Date.now(),
            elapsed: 0,
          },
        }),

      stopTimer: () => {
        const { timer } = get();
        const elapsed = timer.startTime
          ? Math.floor((Date.now() - timer.startTime) / 1000)
          : timer.elapsed;
        set({
          timer: {
            running: false,
            projectId: null,
            startTime: null,
            elapsed: 0,
          },
        });
        return elapsed;
      },

      pauseTimer: () => {
        const { timer } = get();
        if (!timer.running || !timer.startTime) return;
        const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
        set({
          timer: {
            ...timer,
            running: false,
            elapsed,
            startTime: null,
          },
        });
      },

      resumeTimer: () => {
        const { timer } = get();
        if (timer.running) return;
        set({
          timer: {
            ...timer,
            running: true,
            startTime: Date.now() - timer.elapsed * 1000,
          },
        });
      },

      tickTimer: () => {
        const { timer } = get();
        if (!timer.running || !timer.startTime) return;
        // Force re-render by updating a derived value
        set({ timer: { ...timer } });
      },

      // Optimistic counter
      optimisticRow: {},
      setOptimisticRow: (projectId, row) =>
        set((state) => ({
          optimisticRow: { ...state.optimisticRow, [projectId]: row },
        })),
      clearOptimisticRow: (projectId) =>
        set((state) => {
          const { [projectId]: _, ...rest } = state.optimisticRow;
          return { optimisticRow: rest };
        }),
    }),
    {
      name: "craftly-store",
      partialize: (state) => ({
        timer: state.timer,
      }),
    }
  )
);
