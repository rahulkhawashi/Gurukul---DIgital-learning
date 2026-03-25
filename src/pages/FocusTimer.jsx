import { useState, useEffect, useRef, useCallback } from 'react';
import { FiPlay, FiPause, FiRotateCcw, FiCoffee, FiZap } from 'react-icons/fi';

const MODES = {
  focus: { label: 'Focus', duration: 25 * 60, color: 'var(--primary-container)', icon: <FiZap /> },
  short: { label: 'Short Break', duration: 5 * 60, color: 'var(--secondary)', icon: <FiCoffee /> },
  long: { label: 'Long Break', duration: 15 * 60, color: 'var(--tertiary)', icon: <FiCoffee /> },
};

export default function FocusTimer() {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
      if (mode === 'focus') setSessions(s => s + 1);
      // Auto-switch
      if (mode === 'focus') {
        const nextMode = (sessions + 1) % 4 === 0 ? 'long' : 'short';
        setMode(nextMode);
        setTimeLeft(MODES[nextMode].duration);
      } else {
        setMode('focus');
        setTimeLeft(MODES.focus.duration);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  function switchMode(newMode) {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
  }

  function reset() {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setTimeLeft(MODES[mode].duration);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / MODES[mode].duration;
  const circumference = 2 * Math.PI * 140;

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - var(--topnav-height))' }}>
      <h1 style={{ marginBottom: 'var(--space-2)' }}>Focus Timer</h1>
      <p style={{ marginBottom: 'var(--space-8)', color: 'var(--on-surface-variant)' }}>
        Stay focused, earn XP 🎯 · Session {sessions + 1}
      </p>

      {/* Mode Toggle */}
      <div className="role-toggle" style={{ marginBottom: 'var(--space-10)', maxWidth: 360 }}>
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            className={`role-toggle-btn ${mode === key ? 'active' : ''}`}
            onClick={() => switchMode(key)}
            style={mode === key ? { background: MODES[key].color } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div style={{ position: 'relative', width: 300, height: 300, marginBottom: 'var(--space-10)' }}>
        <svg width="300" height="300" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Circle */}
          <circle cx="150" cy="150" r="140" fill="none" stroke="var(--surface-container-highest)" strokeWidth="6" />
          {/* Progress */}
          <circle
            cx="150" cy="150" r="140" fill="none"
            stroke={MODES[mode].color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        {/* Time Display */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '4rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--on-surface)',
          }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="label-sm" style={{ color: MODES[mode].color }}>
            {MODES[mode].label}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-icon" onClick={reset} style={{ width: 48, height: 48 }}>
          <FiRotateCcw />
        </button>
        <button
          className="btn btn-primary"
          onClick={() => setIsRunning(!isRunning)}
          style={{
            width: 72, height: 72, borderRadius: 'var(--radius-full)',
            fontSize: '1.5rem',
          }}
        >
          {isRunning ? <FiPause /> : <FiPlay style={{ marginLeft: 2 }} />}
        </button>
        <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="badge badge-primary" style={{ fontSize: 'var(--body-md)', fontWeight: 700 }}>
            {sessions}
          </span>
        </div>
      </div>

      {/* Sessions */}
      <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-2)' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: '50%',
            background: i < (sessions % 4) ? 'var(--secondary)' : 'var(--surface-container-highest)',
            transition: 'background var(--transition-base)',
          }} />
        ))}
      </div>
    </div>
  );
}
