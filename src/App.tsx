import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

/**
 * SprintGridLanding
 * Dark-stage themed kanban board with:
 * - Supabase anonymous guest auth (auto sign-in on load)
 * - Tasks persisted in Supabase, scoped to the guest user via RLS
 * - 4 columns (To Do / In Progress / In Review / Done)
 * - Create task modal (title, description, priority, due date, labels)
 * - Loading + error states on task creation
 * - Drag & drop tasks between columns (persisted + optimistic UI)
 * - Custom labels/tags with board-wide filtering (local state — see note below)
 * - Due date urgency badges (overdue / due today / due soon)
 * - Realtime sync so changes reflect across sessions for the same user
 */

// ---------- status mapping between UI columns and DB enum values ----------
const STATUS_MAP = {
  "To Do": "todo",
  "In Progress": "in_progress",
  "In Review": "in_review",
  Done: "done",
};
const REVERSE_STATUS_MAP = Object.fromEntries(
  Object.entries(STATUS_MAP).map(([k, v]) => [v, k])
);

export default function SprintGridLanding() {
  // ---------- state ----------
  const [loaded, setLoaded] = useState(false);

  const [tasks, setTasks] = useState({
    "To Do": [],
    "In Progress": [],
    "In Review": [],
    Done: [],
  });

  // NOTE: labels are still local/client-side in this version. If you have a
  // `labels` table in Supabase too, this is the same fetch/insert pattern as
  // tasks below — ask and I'll wire that up as well.
  const [labels, setLabels] = useState([
    { id: "l1", name: "Bug", color: "#e06f6f" },
    { id: "l2", name: "Feature", color: "#6fc7e0" },
    { id: "l3", name: "Design", color: "#e6b45a" },
  ]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#6fc7e0");
  const [activeLabelFilter, setActiveLabelFilter] = useState(null);

  const [activeColumn, setActiveColumn] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    labelIds: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const [draggedTask, setDraggedTask] = useState(null); // { id, fromColumn }
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // ---------- Supabase auth + data state ----------
  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  // ---------- 3. guest session: auto anonymous sign-in ----------
  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUserId(session.user.id);
      } else {
        const { data, error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
          console.error("Anonymous sign-in failed:", signInError.message);
          setTasksError("Could not start a guest session. Please refresh.");
        } else {
          setUserId(data.user.id);
        }
      }
      setAuthReady(true);
    };

    initSession();
  }, []);

  // ---------- 5. fetch tasks once auth is ready ----------
  useEffect(() => {
    if (!authReady || !userId) return;

    const fetchTasks = async () => {
      setTasksLoading(true);
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });

      if (fetchError) {
        console.error("Fetch error:", fetchError.message);
        setTasksError(fetchError.message);
        setTasksLoading(false);
        return;
      }

      const grouped = { "To Do": [], "In Progress": [], "In Review": [], Done: [] };
      data.forEach((t) => {
        const col = REVERSE_STATUS_MAP[t.status];
        if (col) grouped[col].push(t);
      });
      setTasks(grouped);
      setTasksError(null);
      setTasksLoading(false);
    };

    fetchTasks();
  }, [authReady, userId]);

  // ---------- 8. realtime sync ----------
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const t = payload.new;
            const col = REVERSE_STATUS_MAP[t.status];
            if (!col) return;
            setTasks((prev) => {
              // avoid duplicating a task we already added optimistically
              if (prev[col].some((task) => task.id === t.id)) return prev;
              return { ...prev, [col]: [...prev[col], t] };
            });
          }

          if (payload.eventType === "UPDATE") {
            const t = payload.new;
            const newCol = REVERSE_STATUS_MAP[t.status];
            setTasks((prev) => {
              const next = {};
              for (const col of Object.keys(prev)) {
                next[col] = prev[col].filter((task) => task.id !== t.id);
              }
              if (newCol) next[newCol] = [...next[newCol], t];
              return next;
            });
          }

          if (payload.eventType === "DELETE") {
            const oldId = payload.old.id;
            setTasks((prev) => {
              const next = {};
              for (const col of Object.keys(prev)) {
                next[col] = prev[col].filter((task) => task.id !== oldId);
              }
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ---------- modal handlers ----------
  const openModal = (col) => {
    setActiveColumn(col);
    setForm({ title: "", description: "", priority: "Medium", dueDate: "", labelIds: [] });
    setError(null);
    setIsSaving(false);
  };

  const closeModal = () => {
    setActiveColumn(null);
    setError(null);
    setIsSaving(false);
  };

  // ---------- 6. insert a task ----------
  const handleCreate = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!userId) {
      setError("Still starting your session — try again in a moment.");
      return;
    }

    setError(null);
    setIsSaving(true);

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert({
        title: form.title,
        description: form.description || null,
        priority: form.priority.toLowerCase(),
        due_date: form.dueDate || null,
        status: STATUS_MAP[activeColumn],
        user_id: userId,
      })
      .select()
      .single();

    setIsSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTasks((prev) => ({
      ...prev,
      [activeColumn]: [...prev[activeColumn], data],
    }));
    closeModal();
  };

  // ---------- label handlers (still local state) ----------
  const handleCreateLabel = () => {
    if (!newLabelName.trim()) return;
    setLabels((prev) => [
      ...prev,
      { id: `l${Date.now()}`, name: newLabelName.trim(), color: newLabelColor },
    ]);
    setNewLabelName("");
  };

  const toggleLabelOnForm = (labelId) => {
    setForm((prev) => ({
      ...prev,
      labelIds: prev.labelIds?.includes(labelId)
        ? prev.labelIds.filter((id) => id !== labelId)
        : [...(prev.labelIds || []), labelId],
    }));
  };

  // ---------- drag & drop handlers ----------
  const handleDragStart = (task, fromColumn) => {
    setDraggedTask({ id: task.id, fromColumn });
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    setDragOverColumn(column);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  // ---------- 7. update status on drop ----------
  const handleDrop = async (e, toColumn) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTask || draggedTask.fromColumn === toColumn) {
      setDraggedTask(null);
      return;
    }

    const { id, fromColumn } = draggedTask;

    // optimistic UI update
    setTasks((prev) => {
      const movedTask = prev[fromColumn].find((t) => t.id === id);
      if (!movedTask) return prev;
      return {
        ...prev,
        [fromColumn]: prev[fromColumn].filter((t) => t.id !== id),
        [toColumn]: [...prev[toColumn], movedTask],
      };
    });
    setDraggedTask(null);

    // persist to Supabase
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status: STATUS_MAP[toColumn] })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update task status:", updateError.message);
      // roll back on failure
      setTasks((prev) => {
        const movedTask = prev[toColumn].find((t) => t.id === id);
        if (!movedTask) return prev;
        return {
          ...prev,
          [toColumn]: prev[toColumn].filter((t) => t.id !== id),
          [fromColumn]: [...prev[fromColumn], movedTask],
        };
      });
      setTasksError("Couldn't save the move. Reverted.");
    }
  };

  // ---------- due date helper ----------
  const getDueStatus = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due - today) / 86400000);

    if (diffDays < 0) return "overdue";
    if (diffDays === 0) return "due-today";
    if (diffDays <= 2) return "due-soon";
    return "on-track";
  };

  return (
    <div className={`lg-root ${loaded ? "is-in" : ""}`}>
      <style>{CSS}</style>

      <div className="lg-beams" aria-hidden="true" />
      <div className="lg-grain" aria-hidden="true" />
      <div className="lg-vignette" aria-hidden="true" />

      {/* ---------- center stage ---------- */}
      <div className="lg-stage">
        {tasksError && (
          <div className="lg-banner-error-inline">{tasksError}</div>
        )}

        {/* ---------- label filter bar ---------- */}
        <div className="lg-filter-bar">
          <span className="lg-filter-label">Filter:</span>
          <button
            className={`lg-label-chip ${!activeLabelFilter ? "is-active" : ""}`}
            onClick={() => setActiveLabelFilter(null)}
          >
            All
          </button>
          {labels.map((l) => (
            <button
              key={l.id}
              className={`lg-label-chip ${activeLabelFilter === l.id ? "is-active" : ""}`}
              style={{
                borderColor: l.color,
                color: activeLabelFilter === l.id ? "#0c0c0d" : l.color,
                background: activeLabelFilter === l.id ? l.color : "transparent",
              }}
              onClick={() => setActiveLabelFilter(l.id)}
            >
              {l.name}
            </button>
          ))}
        </div>

        {/* ---------- kanban columns ---------- */}
        <div className="lg-columns">
          {["To Do", "In Progress", "In Review", "Done"].map((col) => {
            const visibleTasks = activeLabelFilter
              ? tasks[col].filter((t) => t.labelIds?.includes(activeLabelFilter))
              : tasks[col];

            return (
              <div
                key={col}
                className={`lg-column ${dragOverColumn === col ? "is-drag-over" : ""}`}
                onDragOver={(e) => handleDragOver(e, col)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col)}
              >
                <h3 className="lg-column-title">{col}</h3>

                <div className="lg-column-body">
                  {tasksLoading ? (
                    <div className="lg-column-loading">
                      <span className="lg-spinner lg-spinner-dark" />
                    </div>
                  ) : visibleTasks.length === 0 ? (
                    <div className="lg-column-empty" onClick={() => openModal(col)}>
                      <span className="lg-empty-plus">+</span>
                      <span className="lg-empty-label">Add</span>
                    </div>
                  ) : (
                    <>
                      {visibleTasks.map((t) => {
                        const dueStatus = t.due_date ? getDueStatus(t.due_date) : null;
                        return (
                          <div
                            key={t.id}
                            className="lg-task-card"
                            draggable
                            onDragStart={() => handleDragStart(t, col)}
                          >
                            <div className="lg-task-top">
                              <span
                                className={`lg-priority lg-priority-${(t.priority || "normal").toLowerCase()}`}
                              >
                                {t.priority || "normal"}
                              </span>
                              {t.due_date && (
                                <span className={`lg-due-badge lg-due-${dueStatus}`}>
                                  {dueStatus !== "on-track" && (
                                    <span className="lg-due-dot" />
                                  )}
                                  {t.due_date}
                                </span>
                              )}
                            </div>

                            {t.labelIds?.length > 0 && (
                              <div className="lg-task-labels">
                                {t.labelIds.map((id) => {
                                  const l = labels.find((lb) => lb.id === id);
                                  if (!l) return null;
                                  return (
                                    <span
                                      key={id}
                                      className="lg-task-label"
                                      style={{ background: l.color }}
                                    >
                                      {l.name}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            <div className="lg-task-title">{t.title}</div>
                            {t.description && (
                              <div className="lg-task-desc">{t.description}</div>
                            )}
                          </div>
                        );
                      })}
                      <button className="lg-add-more" onClick={() => openModal(col)}>
                        + Add task
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg-watermark" aria-hidden="true">
          SprintGrid
        </div>
      </div>

      {/* ---------- create task modal ---------- */}
      {activeColumn && (
        <div className="lg-modal-overlay" onClick={closeModal}>
          <div className="lg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lg-modal-header">
              <span className="lg-modal-eyebrow">{activeColumn}</span>
              <h2 className="lg-modal-title">New Task</h2>
              <button className="lg-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="lg-modal-body">
              <label className="lg-field">
                <span className="lg-field-label">Title</span>
                <input
                  autoFocus
                  className="lg-input"
                  placeholder="e.g. Design onboarding flow"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label className="lg-field">
                <span className="lg-field-label">Description (optional)</span>
                <textarea
                  className="lg-textarea"
                  placeholder="Add more context..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>

              <div className="lg-field-row">
                <label className="lg-field">
                  <span className="lg-field-label">Priority</span>
                  <div className="lg-priority-select">
                    {["Low", "Medium", "High"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`lg-priority-chip lg-priority-chip-${p.toLowerCase()} ${
                          form.priority === p ? "is-active" : ""
                        }`}
                        onClick={() => setForm({ ...form, priority: p })}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="lg-field">
                  <span className="lg-field-label">Due date (optional)</span>
                  <input
                    type="date"
                    className="lg-input"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </label>
              </div>

              <label className="lg-field">
                <span className="lg-field-label">Labels</span>
                <div className="lg-label-picker">
                  {labels.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      className={`lg-label-chip ${
                        form.labelIds?.includes(l.id) ? "is-active" : ""
                      }`}
                      style={{
                        borderColor: l.color,
                        color: form.labelIds?.includes(l.id) ? "#0c0c0d" : l.color,
                        background: form.labelIds?.includes(l.id) ? l.color : "transparent",
                      }}
                      onClick={() => toggleLabelOnForm(l.id)}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
                <div className="lg-label-create">
                  <input
                    className="lg-input lg-input-sm"
                    placeholder="New label name"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                  />
                  <input
                    type="color"
                    className="lg-color-swatch"
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                  />
                  <button
                    type="button"
                    className="lg-btn-ghost lg-btn-sm"
                    onClick={handleCreateLabel}
                  >
                    Add
                  </button>
                </div>
              </label>
            </div>

            {error && (
              <div className="lg-error-banner">
                <span className="lg-error-icon">!</span>
                {error}
              </div>
            )}

            <div className="lg-modal-footer">
              <button className="lg-btn-ghost" onClick={closeModal} disabled={isSaving}>
                Cancel
              </button>
              <button
                className="lg-btn-primary"
                onClick={handleCreate}
                disabled={!form.title.trim() || isSaving}
              >
                {isSaving ? (
                  <span className="lg-btn-loading">
                    <span className="lg-spinner" />
                    Saving...
                  </span>
                ) : (
                  "Create Task"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,600&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap');

.lg-root {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background: #0c0c0d;
  color: #f4f2ee;
  font-family: 'Playfair Display', serif;
  overflow: hidden;
  padding: 40px 48px;
}

.lg-root * { box-sizing: border-box; }

.lg-beams {
  position: absolute;
  inset: -10% -10%;
  pointer-events: none;
  background:
    repeating-linear-gradient(
      100deg,
      rgba(255,255,255,0.05) 0px,
      rgba(255,255,255,0.05) 2px,
      transparent 2px,
      transparent 90px
    );
  mask-image: radial-gradient(ellipse 70% 60% at 50% 20%, black 0%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 20%, black 0%, transparent 70%);
  animation: lg-drift 30s linear infinite;
  opacity: 0.7;
}
@keyframes lg-drift {
  from { transform: translateX(0); }
  to { transform: translateX(-90px); }
}

.lg-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.04;
  background-image: repeating-radial-gradient(circle at 0 0, #fff 0, transparent 1px);
  background-size: 3px 3px;
}

.lg-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 35%, transparent 35%, rgba(0,0,0,0.7) 100%);
}

.lg-stage {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lg-banner-error-inline {
  width: 100%;
  max-width: 900px;
  margin: 0 auto 14px;
  background: rgba(224,111,111,0.12);
  border: 1px solid rgba(224,111,111,0.35);
  color: #e06f6f;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  padding: 9px 12px;
  border-radius: 9px;
  position: relative;
  z-index: 3;
  text-align: center;
}

/* ---------- filter bar ---------- */
.lg-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto 14px;
  position: relative;
  z-index: 3;
}
.lg-filter-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #8b8a86;
  margin-right: 4px;
}

/* ---------- columns ---------- */
.lg-columns {
  position: relative;
  z-index: 3;
  display: flex;
  gap: 16px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto 40px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.9s ease, transform 0.9s ease;
  transition-delay: 0.3s;
}
.lg-root.is-in .lg-columns { opacity: 1; transform: translateY(0); }

.lg-column {
  flex: 1;
  min-width: 0;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 14px;
  min-height: 220px;
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.lg-column.is-drag-over {
  background: rgba(111,199,224,0.06);
  border-color: rgba(111,199,224,0.5);
}

.lg-column-title {
  margin: 0 0 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #cfcdc8;
  text-align: center;
}

.lg-column-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.lg-column-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
}
.lg-spinner-dark {
  border: 2px solid rgba(255,255,255,0.15);
  border-top-color: #6fc7e0;
  width: 20px;
  height: 20px;
}

.lg-column-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 140px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s ease;
}
.lg-column-empty:hover { background: rgba(255,255,255,0.03); }

.lg-empty-plus {
  font-family: 'JetBrains Mono', monospace;
  font-size: 32px;
  font-weight: 300;
  color: #f4f2ee;
  line-height: 1;
}

.lg-empty-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #f4f2ee;
  text-transform: capitalize;
}

/* ---------- task cards ---------- */
.lg-task-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: grab;
  transition: transform 0.15s ease, opacity 0.15s ease, border-color 0.2s ease;
}
.lg-task-card:active {
  cursor: grabbing;
  opacity: 0.6;
}

.lg-task-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.lg-priority {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 20px;
}
.lg-priority-low { background: rgba(111,199,224,0.15); color: #6fc7e0; }
.lg-priority-medium, .lg-priority-normal { background: rgba(230,180,90,0.15); color: #e6b45a; }
.lg-priority-high { background: rgba(224,111,111,0.15); color: #e06f6f; }

.lg-task-title {
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  color: #f4f2ee;
  font-weight: 500;
}

.lg-task-desc {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #a9a8a4;
  line-height: 1.4;
}

.lg-add-more {
  margin-top: auto;
  background: none;
  border: 1px dashed rgba(255,255,255,0.15);
  color: #cfcdc8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.lg-add-more:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.3);
}

/* ---------- labels / tags ---------- */
.lg-label-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.lg-label-chip {
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.2);
  background: transparent;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.lg-label-create {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  align-items: center;
}
.lg-input-sm { flex: 1; padding: 6px 9px; font-size: 11.5px; }
.lg-color-swatch {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  padding: 0;
}
.lg-btn-sm { padding: 6px 10px; font-size: 11px; }

.lg-task-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.lg-task-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #0c0c0d;
  padding: 2px 7px;
  border-radius: 20px;
  font-weight: 600;
}

/* ---------- due date badges ---------- */
.lg-due-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 20px;
}
.lg-due-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
.lg-due-on-track { color: #8b8a86; }

.lg-due-due-soon {
  color: #e6b45a;
  background: rgba(230,180,90,0.12);
}
.lg-due-due-soon .lg-due-dot { background: #e6b45a; }

.lg-due-due-today {
  color: #f4a15e;
  background: rgba(244,161,94,0.15);
}
.lg-due-due-today .lg-due-dot { background: #f4a15e; animation: lg-pulse-dot 1.5s ease-in-out infinite; }

.lg-due-overdue {
  color: #e06f6f;
  background: rgba(224,111,111,0.15);
}
.lg-due-overdue .lg-due-dot { background: #e06f6f; animation: lg-pulse-dot 1.5s ease-in-out infinite; }

@keyframes lg-pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ---------- watermark ---------- */
.lg-watermark {
  position: relative;
  z-index: 1;
  margin-top: -64px;
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 600;
  font-size: clamp(90px, 16vw, 220px);
  line-height: 1;
  color: transparent;
  background: linear-gradient(180deg, #6a6868 0%, #151514 100%);
  -webkit-background-clip: text;
  background-clip: text;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 1.2s ease, transform 1.2s ease;
  transition-delay: 0.4s;
  user-select: none;
  white-space: nowrap;
}
.lg-root.is-in .lg-watermark { opacity: 0.9; transform: translateY(0); }

/* ---------- create task modal ---------- */
.lg-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(6,6,7,0.72);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: lg-fade-in 0.25s ease;
}
@keyframes lg-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.lg-modal {
  width: 420px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  background: linear-gradient(165deg, #16161a 0%, #0e0e10 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 18px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06);
  padding: 24px;
  animation: lg-pop-in 0.3s cubic-bezier(0.16,1,0.3,1);
  position: relative;
}
@keyframes lg-pop-in {
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.lg-modal-header {
  position: relative;
  margin-bottom: 18px;
}

.lg-modal-eyebrow {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6fc7e0;
  background: rgba(111,199,224,0.12);
  padding: 3px 9px;
  border-radius: 20px;
  margin-bottom: 8px;
}

.lg-modal-title {
  margin: 0;
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 600;
  font-size: 24px;
  color: #f4f2ee;
}

.lg-modal-close {
  position: absolute;
  top: -4px;
  right: -4px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #cfcdc8;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease;
}
.lg-modal-close:hover { background: rgba(255,255,255,0.15); }

.lg-modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lg-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.lg-field-row {
  display: flex;
  gap: 14px;
}

.lg-field-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #8b8a86;
}

.lg-input, .lg-textarea {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 9px;
  padding: 9px 11px;
  color: #f4f2ee;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
  resize: none;
}
.lg-input:focus, .lg-textarea:focus {
  border-color: #6fc7e0;
  background: rgba(255,255,255,0.07);
}
.lg-input::placeholder, .lg-textarea::placeholder { color: #6b6a66; }

.lg-input[type="date"] {
  color-scheme: dark;
}

.lg-priority-select {
  display: flex;
  gap: 6px;
}

.lg-priority-chip {
  flex: 1;
  padding: 8px 0;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.03);
  color: #cfcdc8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.lg-priority-chip-low.is-active { background: rgba(111,199,224,0.18); border-color: #6fc7e0; color: #6fc7e0; }
.lg-priority-chip-medium.is-active { background: rgba(230,180,90,0.18); border-color: #e6b45a; color: #e6b45a; }
.lg-priority-chip-high.is-active { background: rgba(224,111,111,0.18); border-color: #e06f6f; color: #e06f6f; }

.lg-error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(224,111,111,0.12);
  border: 1px solid rgba(224,111,111,0.35);
  color: #e06f6f;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  padding: 9px 12px;
  border-radius: 9px;
  margin-top: 14px;
}
.lg-error-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e06f6f;
  color: #0c0c0d;
  font-weight: 700;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lg-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.lg-btn-ghost {
  padding: 9px 16px;
  border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.12);
  background: transparent;
  color: #cfcdc8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.lg-btn-ghost:hover { background: rgba(255,255,255,0.06); }
.lg-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

.lg-btn-primary {
  padding: 9px 18px;
  border-radius: 9px;
  border: none;
  background: linear-gradient(135deg, #6fc7e0, #4a9cb8);
  color: #0c0c0d;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.lg-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(111,199,224,0.35); }
.lg-btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.lg-btn-loading {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.lg-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(12,12,13,0.3);
  border-top-color: #0c0c0d;
  border-radius: 50%;
  animation: lg-spin 0.6s linear infinite;
}

@keyframes lg-spin {
  to { transform: rotate(360deg); }
}

/* ---------- responsive ---------- */
@media (max-width: 860px) {
  .lg-root { padding: 28px 20px; }
  .lg-columns { flex-direction: column; }
  .lg-watermark { font-size: clamp(60px, 22vw, 140px); }
  .lg-field-row { flex-direction: column; }
}

@media (prefers-reduced-motion: reduce) {
  .lg-root * {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
`;