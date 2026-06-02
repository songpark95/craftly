"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { ProjectDetailSkeleton } from "@/components/Skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  Play,
  Pause,
  Square,
  Minus,
  ChevronLeft,
  Edit3,
  Clock,
  Camera,
  Upload,
  RefreshCw,
  FileText,
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

interface CounterData {
  id: string;
  name: string;
  current_row: number;
  total_rows: number | null;
  sort_order: number;
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

  // PDF pattern
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Session summary modal
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionSummaryRows, setSessionSummaryRows] = useState("0");
  const [sessionSummaryNotes, setSessionSummaryNotes] = useState("");
  const [sessionSaving, setSessionSaving] = useState(false);

  // Multi-counter state
  const [counters, setCounters] = useState<CounterData[]>([]);
  const [activeCounterId, setActiveCounterId] = useState<string | null>(null);
  const [showAddCounter, setShowAddCounter] = useState(false);
  const [newCounterName, setNewCounterName] = useState("");
  const [newCounterTotal, setNewCounterTotal] = useState("");
  const [editingCounterId, setEditingCounterId] = useState<string | null>(null);

  // Linked yarn (from project_yarn junction)
  interface LinkedYarn {
    yarn_id: string;
    name: string;
    color_hex: string | null;
    weight: string | null;
    brand: string | null;
    quantity_used: number;
    yardage_used: number | null;
    skeins_used: number | null;
    yardage_per_skein: number | null;
  }
  const [linkedYarn, setLinkedYarn] = useState<LinkedYarn[]>([]);
  const [showAssignYarn, setShowAssignYarn] = useState(false);
  const [stashYarn, setStashYarn] = useState<{ id: string; name: string; color_hex: string | null; brand: string | null; weight: string | null; quantity: number }[]>([]);
  const [assigningYarn, setAssigningYarn] = useState(false);

  // Photo upload state
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  // Settings menu + Edit/Delete
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTotalRows, setEditTotalRows] = useState("");
  const [editYarnWeight, setEditYarnWeight] = useState("");
  const [editNeedleSize, setEditNeedleSize] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Gauge swatch state
  const [editGaugeStitches, setEditGaugeStitches] = useState("");
  const [editGaugeRows, setEditGaugeRows] = useState("");
  const [editGaugeUnit, setEditGaugeUnit] = useState("4in");
  const [editHookSize, setEditHookSize] = useState("");

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

      // Fetch counters
      const { data: counterData } = await supabase
        .from("project_counters")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });

      if (counterData && counterData.length > 0) {
        setCounters(counterData);
        setActiveCounterId(counterData[0].id);
      } else {
        // Create a default "Main" counter from the project data
        const { data: newCounter } = await supabase
          .from("project_counters")
          .insert({
            project_id: projectId,
            user_id: user.id,
            name: "Main",
            current_row: proj.current_row,
            total_rows: proj.total_rows,
            sort_order: 0,
          })
          .select()
          .single();
        if (newCounter) {
          setCounters([newCounter]);
          setActiveCounterId(newCounter.id);
        }
      }

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

      // Fetch linked yarn from project_yarn
      const { data: pyData } = await supabase
        .from("project_yarn")
        .select("yarn_id, quantity_used, yardage_used, skeins_used, yarn:yarn(id, name, color_hex, weight, brand, yardage_per_skein)")
        .eq("project_id", projectId);

      if (pyData) {
        setLinkedYarn(
          pyData.map((py: any) => ({
            yarn_id: py.yarn_id,
            name: py.yarn?.name || "Unknown",
            color_hex: py.yarn?.color_hex,
            weight: py.yarn?.weight,
            brand: py.yarn?.brand,
            quantity_used: py.quantity_used,
            yardage_used: py.yardage_used || null,
            skeins_used: py.skeins_used || null,
            yardage_per_skein: py.yarn?.yardage_per_skein || null,
          }))
        );
      }

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

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const bump = useCallback(() => {
    setBumping(true);
    setTimeout(() => setBumping(false), 150);
  }, []);

  // Get the active counter
  const activeCounter = counters.find(c => c.id === activeCounterId) || counters[0];

  const addRow = async (n: number) => {
    if (!activeCounter) return;
    const newRow = Math.max(0, activeCounter.current_row + n);

    // Update local state immediately
    setCounters(prev => prev.map(c =>
      c.id === activeCounter.id ? { ...c, current_row: newRow } : c
    ));
    setRow(newRow);
    bump();

    // Debounce the database update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      if (!isUpdating) {
        setIsUpdating(true);
        try {
          await supabase
            .from("project_counters")
            .update({ current_row: newRow })
            .eq("id", activeCounter.id);

          // Also sync the main project row for backward compat
          await supabase
            .from("projects")
            .update({ current_row: newRow, updated_at: new Date().toISOString() })
            .eq("id", project!.id);
        } catch (error) {
          console.error("Failed to update row count:", error);
        } finally {
          setIsUpdating(false);
        }
      }
    }, 500);
  };

  // Counter CRUD
  const addCounter = async () => {
    if (!newCounterName.trim() || !project || !userId) return;
    const { data: newC } = await supabase
      .from("project_counters")
      .insert({
        project_id: project.id,
        user_id: userId,
        name: newCounterName.trim(),
        total_rows: newCounterTotal ? parseInt(newCounterTotal) : null,
        sort_order: counters.length,
      })
      .select()
      .single();
    if (newC) {
      setCounters(prev => [...prev, newC]);
      setActiveCounterId(newC.id);
      setNewCounterName("");
      setNewCounterTotal("");
      setShowAddCounter(false);
    }
  };

  const renameCounter = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    await supabase
      .from("project_counters")
      .update({ name: newName.trim() })
      .eq("id", id);
    setCounters(prev => prev.map(c =>
      c.id === id ? { ...c, name: newName.trim() } : c
    ));
    setEditingCounterId(null);
  };

  const deleteCounter = async (id: string) => {
    if (counters.length <= 1) return; // Don't delete the last counter
    await supabase.from("project_counters").delete().eq("id", id);
    const remaining = counters.filter(c => c.id !== id);
    setCounters(remaining);
    if (activeCounterId === id) {
      setActiveCounterId(remaining[0]?.id || null);
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

    if (timerSeconds > 0) {
      // Show summary modal instead of saving immediately
      setSessionSummaryRows("0");
      setSessionSummaryNotes("");
      setShowSessionSummary(true);
    } else {
      setTimerSeconds(0);
    }
  };

  const saveSession = async () => {
    if (!project || !userId || timerSeconds <= 0) return;
    setSessionSaving(true);

    const rowsAdded = parseInt(sessionSummaryRows) || 0;

    try {
      const { error } = await supabase.from("sessions").insert({
        project_id: project.id,
        user_id: userId,
        started_at: new Date(Date.now() - timerSeconds * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: timerSeconds,
        rows_added: rowsAdded,
        notes: sessionSummaryNotes.trim() || null,
      });

      if (error) {
        console.error("Failed to save session:", error);
        return;
      }

      // If rows were added, bump the project's current_row
      if (rowsAdded > 0) {
        const newTotal = row + rowsAdded;
        setRow(newTotal);
        await supabase
          .from("projects")
          .update({ current_row: newTotal })
          .eq("id", project.id);
      }

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
    } catch (error) {
      console.error("Failed to save session:", error);
    } finally {
      setSessionSaving(false);
      setShowSessionSummary(false);
      setTimerSeconds(0);
    }
  };

  const saveNotes = async () => {
    if (project) {
      try {
        const { error } = await supabase
          .from("projects")
          .update({ notes, updated_at: new Date().toISOString() })
          .eq("id", project.id);
        
        if (error) {
          console.error("Failed to save notes:", error);
          return;
        }
        
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      } catch (error) {
        console.error("Failed to save notes:", error);
      }
    }
  };

  const uploadPdf = async (file: File) => {
    if (!project || !userId) return;
    setPdfUploading(true);
    setPdfError(null);
    try {
      const ext = file.name.split(".").pop() || "pdf";
      const path = `${userId}/${project.id}.${ext}`;
      
      const { error: uploadErr } = await supabase.storage
        .from("pattern-pdfs")
        .upload(path, file, { upsert: true });
      
      if (uploadErr) {
        setPdfError(uploadErr.message);
        setPdfUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("pattern-pdfs")
        .getPublicUrl(path);

      await supabase
        .from("projects")
        .update({
          pattern_pdf_url: urlData.publicUrl,
          pattern_pdf_name: file.name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);

      setProject({
        ...project,
        pattern_pdf_url: urlData.publicUrl,
        pattern_pdf_name: file.name,
      } as any);
    } catch (err: any) {
      setPdfError(err.message || "Upload failed");
    }
    setPdfUploading(false);
  };

  const removePdf = async () => {
    if (!project) return;
    await supabase
      .from("projects")
      .update({ pattern_pdf_url: null, pattern_pdf_name: null, updated_at: new Date().toISOString() })
      .eq("id", project.id);
    setProject({ ...project, pattern_pdf_url: null, pattern_pdf_name: null } as any);
  };

  const openAssignYarn = async () => {
    if (!userId) return;
    // Fetch stash yarn not already linked
    const linkedIds = linkedYarn.map((y) => y.yarn_id);
    const { data } = await supabase
      .from("yarn")
      .select("id, name, color_hex, brand, weight, quantity")
      .eq("user_id", userId)
      .order("name");

    setStashYarn(
      (data || []).filter((y: any) => !linkedIds.includes(y.id))
    );
    setShowAssignYarn(true);
  };

  const assignYarnToProject = async (yarnId: string) => {
    if (!project) return;
    setAssigningYarn(true);
    try {
      const { error } = await supabase.from("project_yarn").insert({
        project_id: project.id,
        yarn_id: yarnId,
        quantity_used: 1,
      });
      if (error) {
        console.error("Failed to assign yarn:", error);
        setAssigningYarn(false);
        return;
      }
      // Re-fetch linked yarn
      const { data: pyData } = await supabase
        .from("project_yarn")
        .select("yarn_id, quantity_used, yardage_used, skeins_used, yarn:yarn(id, name, color_hex, weight, brand, yardage_per_skein)")
        .eq("project_id", project.id);
      if (pyData) {
        setLinkedYarn(
          pyData.map((py: any) => ({
            yarn_id: py.yarn_id,
            name: py.yarn?.name || "Unknown",
            color_hex: py.yarn?.color_hex,
            weight: py.yarn?.weight,
            brand: py.yarn?.brand,
            quantity_used: py.quantity_used,
            yardage_used: py.yardage_used || null,
            skeins_used: py.skeins_used || null,
            yardage_per_skein: py.yarn?.yardage_per_skein || null,
          }))
        );
      }
      // Remove from stash list
      setStashYarn((prev) => prev.filter((y) => y.id !== yarnId));
    } catch (error) {
      console.error("Failed to assign yarn:", error);
    }
    setAssigningYarn(false);
  };

  const removeYarnFromProject = async (yarnId: string) => {
    if (!project) return;
    await supabase
      .from("project_yarn")
      .delete()
      .eq("project_id", project.id)
      .eq("yarn_id", yarnId);
    setLinkedYarn((prev) => prev.filter((y) => y.yarn_id !== yarnId));
  };

  const changeStatus = async (newStatus: string) => {
    if (!project) return;
    await supabase
      .from("projects")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", project.id);
    setProject({ ...project, status: newStatus });
    setShowSettings(false);
  };

  const openEditProject = () => {
    if (!project) return;
    setEditName(project.name);
    setEditTotalRows(project.total_rows?.toString() || "");
    setEditYarnWeight(project.yarn_weight || "");
    setEditNeedleSize(project.needle_size || "");
    setEditGaugeStitches((project as any).gauge_stitches?.toString() || "");
    setEditGaugeRows((project as any).gauge_rows?.toString() || "");
    setEditGaugeUnit((project as any).gauge_unit || "4in");
    setEditHookSize((project as any).hook_size || "");
    setShowEditProject(true);
    setShowSettings(false);
  };

  const saveProjectEdit = async () => {
    if (!project || !editName.trim()) return;
    setEditSaving(true);
    await supabase
      .from("projects")
      .update({
        name: editName.trim(),
        total_rows: editTotalRows ? parseInt(editTotalRows) : null,
        yarn_weight: editYarnWeight || null,
        needle_size: editNeedleSize || null,
        gauge_stitches: editGaugeStitches ? parseFloat(editGaugeStitches) : null,
        gauge_rows: editGaugeRows ? parseFloat(editGaugeRows) : null,
        gauge_unit: editGaugeUnit || "4in",
        hook_size: editHookSize || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);
    setProject({
      ...project,
      name: editName.trim(),
      total_rows: editTotalRows ? parseInt(editTotalRows) : null,
      yarn_weight: editYarnWeight || null,
      needle_size: editNeedleSize || null,
    });
    setShowEditProject(false);
    setEditSaving(false);
  };

  const deleteProject = async () => {
    if (!project) return;
    try {
      const { error } = await supabase.from("projects").delete().eq("id", project.id);
      if (error) {
        console.error("Failed to delete project:", error);
        return;
      }
      router.push("/");
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project || !userId) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setPhotoUploadError("Only JPG, PNG, and WebP images are allowed.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setPhotoUploadError("File size must be under 10MB.");
      return;
    }

    setPhotoUploadError(null);
    setPhotoUploading(true);

    try {
      // Ensure the bucket exists (idempotent call)
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === "project-photos");
      if (!bucketExists) {
        await supabase.storage.createBucket("project-photos", {
          public: true,
        });
      }

      // Upload to: {userId}/{projectId}/{filename}
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `${userId}/${project.id}/photo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("project-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("project-photos")
        .getPublicUrl(filePath);

      const photoUrl = urlData?.publicUrl || "";

      // Update the project's photo_url in the database
      const { error: updateError } = await supabase
        .from("projects")
        .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
        .eq("id", project.id);

      if (updateError) throw updateError;

      // Update local state
      setProject({ ...project, photo_url: photoUrl });
    } catch (err: any) {
      console.error("Photo upload error:", err);
      setPhotoUploadError(err?.message || "Failed to upload photo.");
    } finally {
      setPhotoUploading(false);
      // Reset the file input so the same file can be re-selected
      e.target.value = "";
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

  // Aggregate sessions into last 7 days of row data
  const chartData = useMemo(() => {
    const today = new Date();
    const dayLabels: string[] = [];
    const rowsPerDay: number[] = [];
    const maxDays = 7;

    // Build 7-day window (Mon-Sun style ending on today)
    for (let i = maxDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const label = d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
      dayLabels.push(label);

      // Sum rows_added for sessions on this day
      const total = sessions
        .filter((s) => s.date === key)
        .reduce((sum, s) => sum + (s.rows_added || 0), 0);
      rowsPerDay.push(total);
    }

    const maxRows = Math.max(1, ...rowsPerDay);
    return { dayLabels, rowsPerDay, maxRows };
  }, [sessions]);

  if (loading) {
    return (
      <>
        <Nav />
        <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-warm-gray transition-colors hover:text-sage"
          >
            <ChevronLeft size={16} />
            Back to projects
          </Link>
          <ProjectDetailSkeleton />
        </main>
      </>
    );
  }

  if (!project) return null;

  const currentRow = activeCounter?.current_row ?? row;
  const totalRows = activeCounter?.total_rows ?? project.total_rows;
  const progress = Math.round((currentRow / (totalRows || 1)) * 100);
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
            <div className="relative rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="font-serif text-2xl font-semibold truncate">
                    {project.name}
                  </h1>
                  <p className="text-sm text-warm-gray truncate">
                    {[project.stitch_name, project.type, project.yarn_weight, project.needle_size]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {(project as any).gauge_stitches && (
                    <p className="text-[12px] text-warm-gray mt-0.5">
                      Gauge: {(project as any).gauge_stitches} sts × {(project as any).gauge_rows} rows per {(project as any).gauge_unit === "10cm" ? "10cm" : '4"'}
                      {(project as any).hook_size && ` · Hook ${(project as any).hook_size}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg px-3 py-1 text-[12px] font-bold uppercase ${
                    project.status === "wip"
                      ? "bg-sage-light text-sage-deep"
                      : project.status === "queued"
                      ? "bg-sun-light text-sun-deep"
                      : "bg-craft-purple-light text-craft-purple-deep"
                  }`}>
                    {project.status === "wip" ? "In Progress" : project.status === "queued" ? "Queued" : "Done"}
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-warm-dark hover:bg-warm-bg active:scale-95 transition-colors"
                    >
                      ⋯
                    </button>
                    {showSettings && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl bg-white py-1 shadow-lifted border border-warm-wood-pale">
                          <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase text-warm-gray">
                            Status
                          </div>
                          {["wip", "queued", "done"].map((s) => (
                            <button
                              key={s}
                              onClick={() => changeStatus(s)}
                              className={`w-full px-3 py-2 text-left text-[13px] font-bold transition-colors hover:bg-warm-bg ${
                                project.status === s ? "text-sage" : "text-warm-dark"
                              }`}
                            >
                              {s === "wip" ? "🧵 In Progress" : s === "queued" ? "📋 Queued" : "✅ Done"}
                              {project.status === s && " ✓"}
                            </button>
                          ))}
                          <div className="my-1 border-t border-warm-bg" />
                          <button
                            onClick={openEditProject}
                            className="w-full px-3 py-2 text-left text-[13px] font-bold text-warm-dark hover:bg-warm-bg"
                          >
                            ✏️ Edit Project
                          </button>
                          <button
                            onClick={() => { setShowDeleteConfirm(true); setShowSettings(false); }}
                            className="w-full px-3 py-2 text-left text-[13px] font-bold text-craft-rose hover:bg-craft-rose-light"
                          >
                            🗑 Delete Project
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* COUNTER TABS + HERO COUNTER */}
            <div
              className={`rounded-3xl bg-white p-8 shadow-soft border border-warm-wood-pale ${
                timerRunning ? "timer-active" : ""
              }`}
            >
              {/* Counter Tabs */}
              {counters.length > 1 && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {counters.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveCounterId(c.id);
                        setRow(c.current_row);
                      }}
                      className={`group relative rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all ${
                        activeCounterId === c.id
                          ? "bg-sage text-white shadow-sm"
                          : "bg-warm-bg text-warm-dark hover:bg-sage-light"
                      }`}
                    >
                      {editingCounterId === c.id ? (
                        <input
                          autoFocus
                          defaultValue={c.name}
                          onBlur={(e) => renameCounter(c.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") renameCounter(c.id, (e.target as HTMLInputElement).value);
                            if (e.key === "Escape") setEditingCounterId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-20 bg-transparent text-center outline-none"
                        />
                      ) : (
                        <span onDoubleClick={() => setEditingCounterId(c.id)}>
                          {c.name}
                        </span>
                      )}
                      {counters.length > 1 && activeCounterId === c.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${c.name}" counter?`)) deleteCounter(c.id);
                          }}
                          className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-craft-rose text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAddCounter(true)}
                    className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-warm-gray hover:bg-warm-bg hover:text-warm-dark transition-colors"
                  >
                    + Section
                  </button>
                </div>
              )}

              {/* Add Counter Form */}
              {showAddCounter && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-warm-bg p-3">
                  <input
                    autoFocus
                    placeholder="Section name (e.g. Back, Left Sleeve)"
                    value={newCounterName}
                    onChange={(e) => setNewCounterName(e.target.value)}
                    className="flex-1 rounded-lg border border-warm-wood-pale bg-white px-3 py-1.5 text-sm outline-none focus:border-sage"
                  />
                  <input
                    placeholder="Rows"
                    value={newCounterTotal}
                    onChange={(e) => setNewCounterTotal(e.target.value)}
                    className="w-20 rounded-lg border border-warm-wood-pale bg-white px-3 py-1.5 text-sm outline-none focus:border-sage"
                    type="number"
                  />
                  <button
                    onClick={addCounter}
                    disabled={!newCounterName.trim()}
                    className="rounded-lg bg-sage px-3 py-1.5 text-[12px] font-bold text-white hover:bg-sage-deep disabled:opacity-40"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowAddCounter(false); setNewCounterName(""); setNewCounterTotal(""); }}
                    className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-warm-gray hover:text-warm-dark"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Single counter: show section name if not "Main" */}
              {counters.length === 1 && counters[0]?.name !== "Main" && (
                <div className="mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-sage">
                    {counters[0].name}
                  </span>
                </div>
              )}

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
                  {currentRow}
                </div>
                <span className="text-sm font-semibold text-warm-gray">
                  of {totalRows || "∞"} rows
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

              {/* Single counter: add section button */}
              {counters.length === 1 && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowAddCounter(true)}
                    className="text-[11px] font-bold text-warm-gray hover:text-sage transition-colors"
                  >
                    + Add section counter
                  </button>
                </div>
              )}
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
                    className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-warm-wood-pale bg-white text-warm-dark transition-all hover:border-craft-rose hover:text-craft-rose disabled:opacity-30 disabled:pointer-events-none active:scale-95"
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

            {/* PATTERN PDF */}
            <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
              <div className="mb-3 flex items-center gap-2">
                <FileText size={16} className="text-warm-gray" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                  Pattern PDF
                </span>
              </div>

              {(project as any).pattern_pdf_url ? (
                <div>
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-warm-bg px-3 py-2">
                    <a
                      href={(project as any).pattern_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-bold text-sage hover:text-sage-deep truncate max-w-[200px]"
                    >
                      {(project as any).pattern_pdf_name || "Pattern.pdf"}
                    </a>
                    <button
                      onClick={removePdf}
                      className="text-[11px] font-bold text-craft-rose hover:text-craft-rose-deep transition-colors px-2 py-1"
                    >
                      ✕
                    </button>
                  </div>
                  <iframe
                    src={(project as any).pattern_pdf_url}
                    className="w-full h-[400px] rounded-xl border-2 border-warm-wood-pale"
                    title="Pattern PDF"
                  />
                </div>
              ) : (
                <div>
                  {pdfError && (
                    <div className="mb-3 rounded-xl bg-craft-rose-light px-4 py-2 text-[12px] font-bold text-craft-rose">
                      {pdfError}
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-warm-wood-pale bg-warm-bg px-6 py-8 cursor-pointer transition-all hover:border-sage hover:bg-sage-light">
                    {pdfUploading ? (
                      <span className="text-sm font-bold text-warm-gray">Uploading...</span>
                    ) : (
                      <>
                        <Upload size={24} className="mb-2 text-warm-gray" />
                        <span className="text-sm font-bold text-warm-gray">
                          Upload pattern PDF
                        </span>
                        <span className="text-[11px] text-warm-gray mt-1">
                          JPG, PNG, or PDF · max 10MB
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadPdf(f);
                        e.target.value = "";
                      }}
                      disabled={pdfUploading}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR (1/3 width) */}
          <div className="space-y-6">
            {/* Yarn Allocation */}
            <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                  Yarn
                </h3>
                <button
                  onClick={openAssignYarn}
                  className="text-[11px] font-bold text-sage hover:text-sage-deep transition-colors"
                >
                  + Assign
                </button>
              </div>

              {/* Legacy yarn fields from project */}
              {yarnName && linkedYarn.length === 0 && (
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
              )}

              {/* Linked stash yarn */}
              {linkedYarn.map((ly) => (
                <div
                  key={ly.yarn_id}
                  className="flex items-center justify-between rounded-xl bg-warm-bg px-3 py-2 mb-2 last:mb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-lg flex-shrink-0"
                      style={{ background: ly.color_hex || "#6B9E7A" }}
                    />
                    <div>
                      <div className="text-[13px] font-bold">{ly.name}</div>
                      <div className="text-[11px] text-warm-gray">
                        {[ly.brand, ly.weight].filter(Boolean).join(" · ")}
                      </div>
                      {/* Yardage info */}
                      <div className="text-[11px] text-warm-gray mt-0.5">
                        {ly.skeins_used
                          ? `${ly.skeins_used} skein${ly.skeins_used !== 1 ? "s" : ""}`
                          : ly.quantity_used > 1 && `${ly.quantity_used} qty`}
                        {ly.yardage_used
                          ? ` · ${ly.yardage_used}yd used`
                          : ly.yardage_per_skein && ly.quantity_used
                          ? ` · ${(ly.yardage_per_skein * ly.quantity_used).toFixed(0)}yd total`
                          : ""}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeYarnFromProject(ly.yarn_id)}
                    className="text-[11px] font-bold text-craft-rose hover:text-craft-rose-deep transition-colors px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {!yarnName && linkedYarn.length === 0 && (
                <p className="text-[13px] text-warm-gray">
                  No yarn assigned yet
                </p>
              )}
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

            {/* Progress Photo */}
            <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                Progress Photo
              </h3>

              {project.photo_url ? (
                <div className="relative group">
                  <img
                    src={project.photo_url}
                    alt="Progress photo"
                    className="w-full rounded-xl object-cover aspect-square"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 group-hover:bg-black/30 transition-all">
                    <label className="cursor-pointer rounded-lg bg-white/90 px-4 py-2 text-[12px] font-extrabold text-warm-dark opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-soft flex items-center gap-1.5">
                      <Upload size={14} />
                      Replace
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={photoUploading}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-warm-wood-pale bg-warm-bg p-8 transition-all hover:border-sage hover:bg-sage-light/30">
                  <div className="mb-3 rounded-full bg-white p-3 shadow-soft">
                    <Camera size={24} className="text-warm-gray" />
                  </div>
                  <span className="text-[13px] font-extrabold text-warm-dark mb-1">
                    {photoUploading ? "Uploading..." : "Add a photo"}
                  </span>
                  <span className="text-[11px] text-warm-gray text-center">
                    JPG, PNG, or WebP
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={photoUploading}
                  />
                </label>
              )}

              {photoUploading && (
                <div className="mt-3 flex items-center justify-center gap-2 text-[12px] font-bold text-sage">
                  <RefreshCw size={14} className="animate-spin" />
                  Uploading photo...
                </div>
              )}

              {photoUploadError && (
                <p className="mt-3 text-[12px] font-bold text-craft-rose">
                  {photoUploadError}
                </p>
              )}
            </div>

            {/* Row History (mini bar chart) */}
            <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-warm-gray">
                Rows per Day
              </h3>
              {chartData.rowsPerDay.every((v) => v === 0) ? (
                <p className="text-[12px] text-warm-gray py-6 text-center">
                  No rows logged yet. Start a session to see your progress here.
                </p>
              ) : (
                <div className="flex items-end gap-1.5 h-24">
                  {chartData.rowsPerDay.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${Math.max(4, (v / chartData.maxRows) * 100)}%`,
                          background:
                            v > 0 ? yarnColor : "var(--wood-pale)",
                          opacity: i === 6 ? 1 : 0.7,
                        }}
                      />
                      <span className="text-[9px] font-bold text-warm-gray">
                        {chartData.dayLabels[i]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Project Modal */}
      {showEditProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">Edit Project</h2>
              <button
                onClick={() => setShowEditProject(false)}
                className="rounded-lg p-1 text-warm-gray hover:bg-warm-bg"
              >
                ✕
              </button>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                Project Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                Total Rows (blank = unlimited)
              </label>
              <input
                type="number"
                value={editTotalRows}
                onChange={(e) => setEditTotalRows(e.target.value)}
                placeholder="e.g. 120"
                min="1"
                className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
              />
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                  Yarn Weight
                </label>
                <input
                  type="text"
                  value={editYarnWeight}
                  onChange={(e) => setEditYarnWeight(e.target.value)}
                  placeholder="e.g. Worsted"
                  className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
                />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                  Needle Size
                </label>
                <input
                  type="text"
                  value={editNeedleSize}
                  onChange={(e) => setEditNeedleSize(e.target.value)}
                  placeholder="e.g. 5mm"
                  className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
                />
              </div>
            </div>

            {/* Gauge Swatch */}
            <div className="mb-3">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                Gauge Swatch
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editGaugeStitches}
                  onChange={(e) => setEditGaugeStitches(e.target.value)}
                  placeholder="Stitches"
                  step="0.5"
                  className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
                />
                <span className="text-xs font-bold text-warm-gray">× per</span>
                <input
                  type="number"
                  value={editGaugeRows}
                  onChange={(e) => setEditGaugeRows(e.target.value)}
                  placeholder="Rows"
                  step="0.5"
                  className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
                />
                <select
                  value={editGaugeUnit}
                  onChange={(e) => setEditGaugeUnit(e.target.value)}
                  className="rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-3 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
                >
                  <option value="4in">4 in</option>
                  <option value="10cm">10 cm</option>
                </select>
              </div>
            </div>

            {/* Hook Size (for crochet) */}
            {project.type === "crochet" && (
              <div className="mb-3">
                <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                  Hook Size
                </label>
                <input
                  type="text"
                  value={editHookSize}
                  onChange={(e) => setEditHookSize(e.target.value)}
                  placeholder="e.g. 5.5mm / H-8"
                  className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none transition-colors focus:border-sage"
                />
              </div>
            )}

            <button
              onClick={saveProjectEdit}
              disabled={editSaving || !editName.trim()}
              className="w-full rounded-xl bg-sage py-3 text-sm font-extrabold text-white transition-all hover:bg-sage-deep disabled:opacity-50"
            >
              {editSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale text-center">
            <div className="mb-3 text-4xl">🗑</div>
            <h2 className="font-serif text-lg font-semibold mb-2">Delete this project?</h2>
            <p className="text-[13px] text-warm-gray mb-5">
              &ldquo;{project?.name}&rdquo; will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border-2 border-warm-wood-pale bg-white py-2.5 text-sm font-bold text-warm-gray hover:bg-warm-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteProject}
                className="flex-1 rounded-xl bg-craft-rose py-2.5 text-sm font-extrabold text-white hover:bg-craft-rose-deep transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Yarn Modal */}
      {showAssignYarn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">Assign Yarn</h2>
              <button
                onClick={() => setShowAssignYarn(false)}
                className="rounded-lg p-1 text-warm-gray hover:bg-warm-bg"
              >
                ✕
              </button>
            </div>
            {stashYarn.length === 0 ? (
              <p className="text-[13px] text-warm-gray py-4 text-center">
                No unlinked yarn in your stash. Add yarn in the Stash tab first.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {stashYarn.map((y) => (
                  <button
                    key={y.id}
                    onClick={() => assignYarnToProject(y.id)}
                    disabled={assigningYarn}
                    className="flex w-full items-center gap-3 rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-3 text-left transition-all hover:border-sage hover:bg-sage-light disabled:opacity-50"
                  >
                    <div
                      className="h-8 w-8 flex-shrink-0 rounded-lg"
                      style={{ background: y.color_hex || "#6B9E7A" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold truncate">{y.name}</div>
                      <div className="text-[11px] text-warm-gray">
                        {[y.brand, y.weight].filter(Boolean).join(" · ")} · {y.quantity} skein{y.quantity > 1 ? "s" : ""}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-sage">+ Add</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session Summary Modal */}
      {showSessionSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
            <div className="mb-4 text-center">
              <div className="text-4xl mb-2">⏰</div>
              <h2 className="font-serif text-xl font-semibold">Nice work!</h2>
              <p className="text-[13px] text-warm-gray mt-1">
                {Math.floor(timerSeconds / 3600) > 0 && `${Math.floor(timerSeconds / 3600)}h `}
                {Math.floor((timerSeconds % 3600) / 60)}m {timerSeconds % 60}s logged
              </p>
            </div>

            {/* Rows completed */}
            <div className="mb-4">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                Rows completed
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSessionSummaryRows(String(Math.max(0, (parseInt(sessionSummaryRows) || 0) - 1)))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-warm-wood-pale bg-white text-lg font-bold text-warm-gray hover:border-craft-rose hover:text-craft-rose active:scale-95"
                >
                  −
                </button>
                <input
                  type="number"
                  value={sessionSummaryRows}
                  onChange={(e) => setSessionSummaryRows(e.target.value)}
                  className="flex-1 rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-center text-lg font-bold text-warm-dark outline-none focus:border-sage"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => setSessionSummaryRows(String((parseInt(sessionSummaryRows) || 0) + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-warm-wood-pale bg-white text-lg font-bold text-warm-gray hover:border-sage hover:text-sage active:scale-95"
                >
                  +
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                {[5, 10, 20].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSessionSummaryRows(String(n))}
                    className="rounded-lg border border-warm-wood-pale bg-warm-bg px-3 py-1 text-[12px] font-bold text-warm-gray hover:border-sage hover:text-sage transition-colors"
                  >
                    +{n}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-5">
              <label className="mb-1 block text-[13px] font-extrabold text-warm-gray">
                Session notes <span className="text-warm-gray font-normal">(optional)</span>
              </label>
              <textarea
                value={sessionSummaryNotes}
                onChange={(e) => setSessionSummaryNotes(e.target.value)}
                placeholder="e.g. Finished the ribbing, started cable section"
                rows={2}
                className="w-full rounded-xl border-2 border-warm-wood-pale bg-warm-bg px-4 py-2.5 text-sm font-semibold text-warm-dark outline-none focus:border-sage resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowSessionSummary(false); setTimerSeconds(0); }}
                className="flex-1 rounded-xl border-2 border-warm-wood-pale bg-white py-2.5 text-sm font-bold text-warm-gray hover:bg-warm-bg transition-colors"
              >
                Discard
              </button>
              <button
                onClick={saveSession}
                disabled={sessionSaving}
                className="flex-1 rounded-xl bg-sage py-2.5 text-sm font-extrabold text-white hover:bg-sage-deep transition-colors disabled:opacity-50"
              >
                {sessionSaving ? "Saving..." : "Log Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
