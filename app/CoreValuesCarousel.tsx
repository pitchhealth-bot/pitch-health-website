"use client";

import { useRef, useState, type PointerEvent } from "react";

const values = [
  {
    title: "Responsibility",
    description: "Responsibility means taking full ownership of our results, our actions, and our impact on others. We don't pass blame or make excuses. We do what we say, and we hold ourselves accountable to the highest standards.",
    accent: "#e88cdf",
  },
  {
    title: "Excellence",
    description: "Excellence is a journey, not a finish line. It's the daily rejection of mediocrity and the constant pursuit of becoming better, as individuals and as a team.",
    accent: "#c59cff",
  },
  {
    title: "Alignment",
    description: "We move together toward the same vision. Alignment means being clear, connected, and committed, every decision and effort pushing in the same direction.",
    accent: "#b8afff",
  },
  {
    title: "Growth",
    description: "Who we are today has created the results we have, but to achieve more, we must evolve. Growth means continually stretching beyond our current selves and becoming the kind of people capable of creating the next level of success.",
    accent: "#e88cdf",
  },
  {
    title: "Innovation",
    description: "We look for ways to improve how we work and serve others. We stay open to new ideas and better solutions.",
    accent: "#c59cff",
  },
];

export default function CoreValuesCarousel() {
  const [current, setCurrent] = useState(0);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const count = values.length;
  const advance = (step: number) => setCurrent(i => (i + step + count) % count);

  function finishDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    gesture.current = null;
    setDragging(false);
    setDragX(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!cancelled && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) advance(dx < 0 ? 1 : -1);
  }

  return (
    <section className="core-values-section" aria-labelledby="values-title">
      <div className="container">
        <div className="core-values-heading">
          <div>
            <p className="core-values-eyebrow">What we believe</p>
            <h2 id="values-title">Our Core <span>Values.</span></h2>
            <p className="core-values-intro">The principles that shape how we work and show up for others.</p>
          </div>
          <div className="core-values-controls">
            <button type="button" aria-label="Previous core value" onClick={() => advance(-1)}>←</button>
            <button type="button" aria-label="Next core value" onClick={() => advance(1)}>→</button>
          </div>
        </div>
        <div
          className={"core-values-stage" + (dragging ? " is-dragging" : "")}
          role="region"
          aria-roledescription="carousel"
          aria-label="Pitch Health core values"
          onPointerDown={event => {
            if (!event.isPrimary || event.button !== 0 || gesture.current) return;
            if ((event.target as HTMLElement).closest("a,button,input,textarea,select")) return;
            gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }}
          onPointerMove={event => {
            const start = gesture.current;
            if (!start || start.id !== event.pointerId) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            setDragX(Math.abs(dx) > Math.abs(dy) ? dx : 0);
          }}
          onPointerUp={event => finishDrag(event)}
          onPointerCancel={event => finishDrag(event, true)}
          onLostPointerCapture={event => finishDrag(event, true)}
          onKeyDown={e => {
            if (e.key === "ArrowRight") { e.preventDefault(); advance(1); }
            if (e.key === "ArrowLeft") { e.preventDefault(); advance(-1); }
          }}
          tabIndex={0}
        >
          {values.map((value, index) => {
            const offset = (index - current + count) % count;
            const visible = offset < 3;
            return (
              <article
                key={index}
                className={"core-value-card" + (offset === 0 ? " is-active" : "")}
                style={{
                  zIndex: visible ? 10 - offset : 0,
                  opacity: visible ? 1 : 0,
                  pointerEvents: offset === 0 ? "auto" : "none",
                  transform: visible
                    ? `translate3d(${offset * 30 + (offset === 0 ? dragX : 0)}px,${offset * 19}px,0) scale(${1 - offset * 0.045})`
                    : "translate3d(120px,36px,0) scale(.84)",
                  borderTopColor: value.accent,
                }}
                aria-hidden={offset !== 0}
                aria-roledescription="slide"
                aria-label={`Core value ${index + 1} of ${count}`}
              >
                <div className="core-value-topline">
                  <span className="core-value-number">{String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
                  <span className="core-value-dot" style={{ background: value.accent }} aria-hidden="true" />
                </div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </article>
            );
          })}
        </div>
        <div className="core-values-bottom">
          <span aria-live="polite">{String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
          <div className="core-values-dots" aria-label="Choose a core value">
            {values.map((_, i) =>
              <button key={i} type="button" aria-label={`Show core value ${i + 1}`} aria-current={current === i ? "true" : undefined} className={current === i ? "active" : ""} onClick={() => setCurrent(i)} />
            )}
          </div>
          <span>Drag, swipe, or use arrows to explore</span>
        </div>
      </div>
    </section>
  );
}
