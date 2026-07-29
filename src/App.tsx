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
        {/* task cards go here */}
        <div className="lg-column-empty">
          <span className="lg-empty-plus">+</span>
          <span className="lg-empty-label">Add</span>
        </div>
      </div>
    </div>
  ))}
</div>
        

        

        <div className="lg-watermark" aria-hidden="true">
          SprintGrid
        </div>
      </div>

      
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

/* ---------- ambient background ---------- */
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

/* ---------- headline ---------- */
.lg-headline {
  position: relative;
  z-index: 3;
  max-width: 640px;
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 0.9s ease, transform 0.9s ease;
}
.lg-root.is-in .lg-headline { opacity: 1; transform: translateY(0); }

.lg-headline h1 {
  margin: 0;
  font-weight: 500;
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.25;
  color: #f3f1ed;
}

/* ---------- top-right CTA ---------- */
.lg-cta {
  position: absolute;
  top: 40px;
  right: 48px;
  z-index: 3;
  max-width: 260px;
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 0.9s ease, transform 0.9s ease;
  transition-delay: 0.15s;
}
.lg-root.is-in .lg-cta { opacity: 1; transform: translateY(0); }

.lg-cta-copy {
  margin: 0 0 12px;
  font-size: 11.5px;
  line-height: 1.6;
  color: #cfcdc8;
}
.lg-cta-copy em { color: #f4f2ee; font-style: italic; }

.lg-cta-sub {
  margin: 8px 0 0;
  font-size: 11px;
  color: #8b8a86;
}
.lg-cta-sub a {
  color: #6fc7e0;
  text-decoration: none;
}
.lg-cta-sub a:hover { text-decoration: underline; }

.lg-download {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  color: #f4f2ee;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background 0.25s ease, transform 0.25s ease;
}
.lg-download:hover { background: rgba(255,255,255,0.14); transform: translateY(-1px); }
.lg-apple { flex-shrink: 0; }

/* ---------- center stage ---------- */
.lg-stage {
  position: relative;
  z-index: 2;
  margin-top: 9vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

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
}

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

.lg-badge {
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 128px;
  padding: 12px 10px 14px;
  background: #131313;
  border: 1px solid rgba(255,255,255,0.12);
  clip-path: polygon(
    4% 0%, 12% 4%, 20% 0%, 28% 4%, 36% 0%, 44% 4%, 52% 0%, 60% 4%, 68% 0%, 76% 4%, 84% 0%, 92% 4%, 100% 0%,
    100% 100%, 92% 96%, 84% 100%, 76% 96%, 68% 100%, 60% 96%, 52% 100%, 44% 96%, 36% 100%, 28% 96%, 20% 100%, 12% 96%, 4% 100%,
    0% 100%, 0% 0%
  );
  transform: rotate(-6deg);
  opacity: 0;
  animation: lg-badge-wobble 6s ease-in-out infinite;
  animation-play-state: paused;
  transition: opacity 0.8s ease;
  transition-delay: 0.45s;
  margin-bottom: -18px;
}
.lg-root.is-in .lg-badge { opacity: 1; animation-play-state: running; }
@keyframes lg-badge-wobble {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(-3deg); }
}
.lg-badge-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #a9a8a4;
}
.lg-badge-name {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 600;
  font-size: 19px;
  color: #f4f2ee;
}

/* ---------- device card ---------- */
.lg-device {
  position: relative;
  z-index: 3;
  display: flex;
  gap: 10px;
  padding: 10px;
  background: linear-gradient(180deg, #eeece7, #d8d6d0);
  border-radius: 22px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.6);
  opacity: 0;
  transform: translateY(16px) scale(0.97);
  transition: opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1);
  transition-delay: 0.6s;
}
.lg-root.is-in .lg-device { opacity: 1; transform: translateY(0) scale(1); }

.lg-device-left {
  width: 140px;
  height: 176px;
  border-radius: 14px;
  background: #cfcdc6;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  align-content: center;
  justify-items: center;
  gap: 9px;
  padding: 16px;
}
.lg-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #9a988f;
  transition: background 0.4s ease;
}
.lg-dot.is-lit { background: #4a4943; animation: lg-dot-pulse 3.2s ease-in-out infinite; }
@keyframes lg-dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.lg-device-right {
  width: 200px;
  height: 176px;
  border-radius: 14px;
  background: #101012;
  padding: 14px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.lg-device-count {
  position: absolute;
  top: 10px;
  right: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #6fc7e0;
}

.lg-tasklist {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}
.lg-tasklist li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lg-check {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1.4px solid #55544f;
  flex-shrink: 0;
  position: relative;
}
.lg-tasklist li.is-done .lg-check {
  background: #6fc7e0;
  border-color: #6fc7e0;
}
.lg-tasklist li.is-done .lg-check::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0.5px;
  width: 3px;
  height: 6px;
  border-right: 1.5px solid #101012;
  border-bottom: 1.5px solid #101012;
  transform: rotate(40deg);
}
.lg-tasklist li.lg-active .lg-check {
  animation: lg-check-fill 3.2s ease-in-out infinite;
}
@keyframes lg-check-fill {
  0%, 55% { background: transparent; border-color: #55544f; }
  70%, 100% { background: #6fc7e0; border-color: #6fc7e0; }
}
.lg-line {
  height: 6px;
  border-radius: 3px;
  background: #2a2a2c;
}
.lg-tasklist li.is-done .lg-line { background: #26282a; position: relative; opacity: 0.6; }
.lg-line.long { width: 130px; }
.lg-line.mid { width: 96px; }
.lg-line.short { width: 70px; }

.lg-download-small {
  align-self: flex-start;
  margin-top: auto;
  padding: 6px 10px;
  font-size: 10px;
  border-radius: 6px;
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

/* ---------- responsive ---------- */
@media (max-width: 860px) {
  .lg-root { padding: 28px 20px; }
  .lg-cta { position: static; max-width: 100%; text-align: left; margin-top: 20px; }
  .lg-headline h1 { font-size: 22px; }
  .lg-device { flex-direction: column; align-items: center; }
  .lg-device-left, .lg-device-right { width: 220px; }
  .lg-watermark { font-size: clamp(60px, 22vw, 140px); }
}

@media (prefers-reduced-motion: reduce) {
  .lg-root * {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
`;