"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface TodoItem {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
}

interface ProjectTodosProps {
  projectId: string;
}

export default function ProjectTodos({ projectId }: ProjectTodosProps) {
  const supabase = createClient();

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch userId once
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // Fetch todos
  const fetchTodos = useCallback(async () => {
    const { data, error } = await supabase
      .from("project_todos")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!error && data) {
      setTodos(data as TodoItem[]);
    }
    setLoading(false);
  }, [supabase, projectId]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const toggleTodo = async (todo: TodoItem) => {
    const newCompleted = !todo.completed;
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed: newCompleted } : t))
    );
    await supabase
      .from("project_todos")
      .update({ completed: newCompleted })
      .eq("id", todo.id);
  };

  const addTodo = async () => {
    if (!newTitle.trim() || !userId) return;
    setAdding(true);
    const maxSort = todos.reduce((max, t) => Math.max(max, t.sort_order), 0);
    const { data, error } = await supabase
      .from("project_todos")
      .insert({
        project_id: projectId,
        user_id: userId,
        title: newTitle.trim(),
        sort_order: maxSort + 1,
      })
      .select()
      .single();

    if (!error && data) {
      setTodos((prev) => [...prev, data as TodoItem]);
      setNewTitle("");
    }
    setAdding(false);
  };

  const deleteTodo = async (id: string) => {
    // Optimistic removal
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("project_todos").delete().eq("id", id);
  };

  const moveTodo = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= todos.length) return;

    const current = todos[index];
    const target = todos[targetIndex];

    // Swap sort_order values
    const currentSort = current.sort_order;
    const targetSort = target.sort_order;

    // Optimistic reorder
    const updated = [...todos];
    updated[index] = { ...current, sort_order: targetSort };
    updated[targetIndex] = { ...target, sort_order: currentSort };
    // Re-sort by sort_order then created_at
    updated.sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    setTodos(updated);

    // Persist both swaps
    await supabase
      .from("project_todos")
      .update({ sort_order: targetSort })
      .eq("id", current.id);
    await supabase
      .from("project_todos")
      .update({ sort_order: currentSort })
      .eq("id", target.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
        <div className="h-5 w-24 animate-pulse rounded bg-warm-wood-pale mb-4" />
        <div className="space-y-2">
          <div className="h-10 w-full animate-pulse rounded-xl bg-warm-wood-pale" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-warm-wood-pale" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-warm-gray">
            To-Do
          </span>
          {totalCount > 0 && (
            <span className="rounded-full bg-sage-light px-2.5 py-0.5 text-[11px] font-bold text-sage-deep">
              {completedCount} of {totalCount} done
            </span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {todos.length === 0 ? (
        <p className="text-center text-[12px] text-warm-gray py-6">
          No to-dos yet. Add one below!
        </p>
      ) : (
        <ul className="space-y-1.5">
          {todos.map((todo, index) => (
            <li
              key={todo.id}
              className="group flex items-center gap-2 rounded-xl border border-warm-wood-pale bg-warm-bg px-3 py-2.5 transition-all hover:border-sage/40"
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo)}
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                  todo.completed
                    ? "border-sage bg-sage text-white"
                    : "border-warm-wood-light bg-white hover:border-sage"
                }`}
              >
                {todo.completed && <Check size={12} strokeWidth={3} />}
              </button>

              {/* Title */}
              <span
                className={`flex-1 truncate text-[13px] font-semibold transition-all ${
                  todo.completed
                    ? "text-warm-gray line-through"
                    : "text-warm-dark"
                }`}
              >
                {todo.title}
              </span>

              {/* Up button */}
              <button
                onClick={() => moveTodo(index, "up")}
                disabled={index === 0}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-warm-gray/50 transition-all hover:bg-white hover:text-warm-dark disabled:opacity-20 disabled:pointer-events-none"
                title="Move up"
              >
                <ChevronUp size={14} />
              </button>

              {/* Down button */}
              <button
                onClick={() => moveTodo(index, "down")}
                disabled={index === todos.length - 1}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-warm-gray/50 transition-all hover:bg-white hover:text-warm-dark disabled:opacity-20 disabled:pointer-events-none"
                title="Move down"
              >
                <ChevronDown size={14} />
              </button>

              {/* Delete button (hidden until hover on desktop) */}
              <button
                onClick={() => deleteTodo(todo.id)}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-craft-rose/50 transition-all hover:bg-craft-rose-light hover:text-craft-rose opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add todo input */}
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a to-do..."
          className="flex-1 rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-3.5 py-2.5 text-[13px] font-semibold text-warm-dark outline-none transition-colors placeholder:text-warm-gray/50 focus:border-sage"
          disabled={adding}
        />
        <button
          onClick={addTodo}
          disabled={!newTitle.trim() || adding}
          className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-xl bg-sage text-white transition-all hover:bg-sage-deep active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
