import React, { useEffect, useState } from "react";

/**
 * SprintGridLanding
 * Same visual theme as the "Monologue" (Every) landing page — dark stage
 * with drifting light beams, serif headline top-left, monospace copy +
 * CTA top-right, a rotated "Made by" stamp badge, a small hardware-style
 * device card in the center, and an enormous italic serif wordmark
 * bleeding across the bottom.
 *
 * Re-themed around a task manager product ("SprintGrid"): the device card now
 * shows a mini task list with a looping checkbox animation instead of a
 * voice waveform.
 *
 * Self-contained: no external animation library, just React state + CSS
 * transitions/keyframes. Drop into any React project.
 */
export default function SprintGridLanding() {
  const [loaded, setLoaded] = useState(false);
  
  const [tasks, setTasks] = useState({
  "To Do": [],
  "In Progress": [],
  "In Review": [],
  Done: [],
});
const [activeColumn, setActiveColumn] = useState(null);
const [form, setForm] = useState({
  title: "",
  description: "",
  priority: "Medium",
  dueDate: "",
});

const openModal = (col) => {
  setActiveColumn(col);
  setForm({ title: "", description: "", priority: "Medium", dueDate: "" });
};
const closeModal = () => setActiveColumn(null);
const handleCreate = () => {
  if (!form.title.trim()) return;
  setTasks((prev) => ({
    ...prev,
    [activeColumn]: [...prev[activeColumn], { ...form, id: Date.now() }],
  }));
  closeModal();
};

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  



  return (
    <div className={`lg-root ${loaded ? "is-in" : ""}`}>
      <style>{CSS}</style>

      <div className="lg-beams" aria-hidden="true" />
      <div className="lg-grain" aria-hidden="true" />
      <div className="lg-vignette" aria-hidden="true" />

      

      

      {/* ---------- center stage ---------- */}
      <div className="lg-stage">
        {/* ---------- kanban columns ---------- */}
        <div className="lg-columns">
          {["To Do", "In Progress", "In Review", "Done"].map((col) => (
            <div key={col} className="lg-column">
              <h3 className="lg-column-title">{col}</h3>
              <div className="lg-column-body">
                {tasks[col].length === 0 ? (
                  <div
                    className="lg-column-empty"
                    onClick={() => openModal(col)}
                  >
                    <span className="lg-empty-plus">+</span>
                    <span className="lg-empty-label">Add</span>
                  </div>
                ) : (
                  <>
                    {tasks[col].map((t) => (
                      <div key={t.id} className="lg-task-card">
                        <div className="lg-task-top">
                          <span className={`lg-priority lg-priority-${t.priority.toLowerCase()}`}>
                            {t.priority}
                          </span>
                          {t.dueDate && <span className="lg-task-date">{t.dueDate}</span>}
                        </div>
                        <div className="lg-task-title">{t.title}</div>
                        {t.description && (
                          <div className="lg-task-desc">{t.description}</div>
                        )}
                      </div>
                    ))}
                    <button
                      className="lg-add-more"
                      onClick={() => openModal(col)}
                    >
                      + Add task
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
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
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
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
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                  />
                </label>
              </div>
            </div>

            <div className="lg-modal-footer">
              <button className="lg-btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="lg-btn-primary"
                onClick={handleCreate}
                disabled={!form.title.trim()}
              >
                Create Task
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
}

.lg-task-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
.lg-priority-medium { background: rgba(230,180,90,0.15); color: #e6b45a; }
.lg-priority-high { background: rgba(224,111,111,0.15); color: #e06f6f; }

.lg-task-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #8b8a86;
}

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