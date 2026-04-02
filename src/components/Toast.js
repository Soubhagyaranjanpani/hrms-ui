import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Toast.css';

// ─── Event bus (singleton) ────────────────────────────────────────────────────
let subscribers = [];

export const toast = {
  success: (title, message, options = {}) => emit({ type: 'success', title, message, ...options }),
  error:   (title, message, options = {}) => emit({ type: 'error',   title, message, ...options }),
  warning: (title, message, options = {}) => emit({ type: 'warning', title, message, ...options }),
  info:    (title, message, options = {}) => emit({ type: 'info',    title, message, ...options }),
};

function emit(payload) {
  subscribers.forEach((cb) => cb({ ...payload, id: Date.now() + Math.random() }));
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICONS = {
  success: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 14.5l4 4 8-8" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M9 9l10 10M19 9L9 19" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M13 3.8c.55-.96 1.93-.96 2.48 0l10.5 18.2c.55.96-.14 2.16-1.24 2.16H2.76c-1.1 0-1.79-1.2-1.24-2.16L13 3.8z"
            stroke="currentColor" strokeWidth="1.8"/>
      <path d="M14 11v6M14 20v1" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M14 12.5v7M14 9v1" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round"/>
    </svg>
  ),
};

const CHECK_ICON = (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M3 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DURATION    = 5000;   // ms before auto-close
const CIRCUMF     = 88;     // stroke-dasharray for r=14 circle (2πr ≈ 88)

// ─── Modal popup ─────────────────────────────────────────────────────────────
function PopupModal({ id, type, title, message, onClose }) {
  const [show, setShow]         = useState(false);
  const [progress, setProgress] = useState(100);
  const [countdown, setCountdown] = useState(Math.ceil(DURATION / 1000));
  const rafRef  = useRef(null);
  const startRef = useRef(null);

  const dismiss = useCallback(() => {
    setShow(false);
    cancelAnimationFrame(rafRef.current);
    // Wait for exit animation then remove
    setTimeout(() => onClose(id), 280);
  }, [id, onClose]);

  useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setShow(true), 10);

    startRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct     = Math.max(0, 1 - elapsed / DURATION);
      setProgress(pct * 100);
      setCountdown(Math.ceil(pct * (DURATION / 1000)));
      if (elapsed < DURATION) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        dismiss();
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [dismiss]);

  const dashOffset = ((1 - progress / 100) * CIRCUMF).toFixed(2);

  return (
    <div className={`hp-overlay ${show ? 'hp-overlay--show' : ''}`}>
      <div className={`hp-modal hp--${type}`}>

        {/* Timer ring */}
        <div className="hp-timer">
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle className="hp-timer__track" cx="18" cy="18" r="14"/>
            <circle
              className="hp-timer__fill"
              cx="18" cy="18" r="14"
              strokeDasharray={CIRCUMF}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="hp-timer__num">{countdown}</div>
        </div>

        {/* Icon */}
        <div className="hp-icon">{ICONS[type]}</div>

        {/* Text */}
        <p className="hp-title">{title}</p>
        <p className="hp-message">{message}</p>

        {/* OK button */}
        <button className="hp-ok-btn" onClick={dismiss}>
          {CHECK_ICON}
          OK, got it
        </button>

        {/* Bottom progress bar */}
        <div className="hp-bar-track">
          <div className="hp-bar-fill" style={{ width: `${progress}%` }} />
        </div>

      </div>
    </div>
  );
}

// ─── Container — place once in App.js ────────────────────────────────────────
export function ToastContainer() {
  const [popups, setPopups] = useState([]);

  const add = useCallback((p) => {
    // Only one popup at a time — replace any existing
    setPopups([p]);
  }, []);

  const remove = useCallback((id) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  useEffect(() => {
    subscribers.push(add);
    return () => { subscribers = subscribers.filter((s) => s !== add); };
  }, [add]);

  return (
    <>
      {popups.map((p) => (
        <PopupModal key={p.id} {...p} onClose={remove} />
      ))}
    </>
  );
}