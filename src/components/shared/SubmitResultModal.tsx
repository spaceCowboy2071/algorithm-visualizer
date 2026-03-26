// src/components/shared/SubmitResultModal.tsx
// Centered overlay modal displaying submit test results with confetti on
// all-pass and synthesised sound effects via the Web Audio API.

import { useState, useEffect, useRef } from 'react';
import type { TestRunResult, TestCaseResult } from '../../types/visualization';

// ---------------------------------------------------------------------------
// Sound effects (Web Audio API — no external files)
// ---------------------------------------------------------------------------

/** Short celebratory rising sweep + sparkle burst. */
export function playSuccessSound(): void {
  try {
    const ctx = new AudioContext();

    // --- Rising sweep (0–200ms) ---
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(400, ctx.currentTime);
    sweep.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.2);
    sweepGain.gain.setValueAtTime(0.25, ctx.currentTime);
    sweepGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    sweep.connect(sweepGain).connect(ctx.destination);
    sweep.start(ctx.currentTime);
    sweep.stop(ctx.currentTime + 0.25);

    // --- Sparkle notes (200ms–500ms) ---
    const sparkleFreqs = [1200, 1500, 1800, 2200, 2600];
    sparkleFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + 0.2 + i * 0.05;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    });

    // Close context after all sounds finish
    setTimeout(() => ctx.close(), 800);
  } catch {
    // AudioContext unavailable — silently ignore
  }
}

/** Descending "awww" disappointment tone with filtered noise. */
export function playFailureSound(): void {
  try {
    const ctx = new AudioContext();

    // --- Descending sine wave ---
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.8);
    oscGain.gain.setValueAtTime(0.12, ctx.currentTime);
    oscGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.5);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    // Low-pass filter for muffled, vocal quality
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.8);
    filter.Q.value = 5;

    osc.connect(filter).connect(oscGain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.85);

    // --- Noise layer for breathy texture ---
    const bufferSize = ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(600, ctx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.8);
    noiseFilter.Q.value = 2;

    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.85);

    setTimeout(() => ctx.close(), 1200);
  } catch {
    // AudioContext unavailable — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Confetti
// ---------------------------------------------------------------------------

const CONFETTI_COLORS = [
  '#22c55e', // green
  '#4ade80', // light green
  '#facc15', // yellow
  '#f472b6', // pink
  '#60a5fa', // blue
  '#a78bfa', // purple
  '#fb923c', // orange
  '#34d399', // emerald
];

interface ConfettiPiece {
  id: number;
  x: number; // translate-x end (px)
  y: number; // translate-y end (px)
  rotation: number; // degrees
  color: string;
  size: number; // px
  delay: number; // s
  shape: 'square' | 'circle';
}

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 180;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotation: Math.random() * 720 - 360,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 4 + Math.random() * 6,
      delay: Math.random() * 0.3,
      shape: Math.random() > 0.5 ? 'square' : 'circle',
    };
  });
}

function ConfettiExplosion() {
  const [pieces] = useState(() => generateConfetti(30));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Inject keyframes once */}
      <style>{`
        @keyframes confetti-fly {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--cx), var(--cy)) rotate(var(--cr)) scale(0.4);
            opacity: 0;
          }
        }
      `}</style>
      <div className="absolute left-1/2 top-1/2">
        {pieces.map((p) => (
          <div
            key={p.id}
            style={{
              ['--cx' as string]: `${p.x}px`,
              ['--cy' as string]: `${p.y}px`,
              ['--cr' as string]: `${p.rotation}deg`,
              position: 'absolute',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              animation: `confetti-fly 1.5s ease-out ${p.delay}s forwards`,
              opacity: 0,
              animationFillMode: 'forwards',
              // Start visible, then the keyframe will handle the rest.
              // We set initial opacity via the keyframe's 0% state.
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test case row (matches TestResults.tsx visual style)
// ---------------------------------------------------------------------------

function TestCaseRow({ tc, index }: { tc: TestCaseResult; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[#30363d] rounded mb-1.5">
      {/* Summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-[#1c2128] transition text-left"
      >
        <span className={tc.passed ? 'text-green-400' : 'text-red-400'}>
          {tc.passed ? '\u2713' : '\u2717'}
        </span>
        <span className="text-gray-400">Test {index + 1}</span>
        <span className={`ml-auto text-[10px] ${tc.passed ? 'text-green-600' : 'text-red-600'}`}>
          {tc.passed ? 'Passed' : tc.status === 'runtime-error-other' ? 'Error' : 'Failed'}
        </span>
        <span className="text-gray-600 text-[10px]">{expanded ? '\u25be' : '\u25b8'}</span>
      </button>

      {/* Detail panel */}
      {expanded && (
        <div className="px-3 pb-2 text-[11px] font-mono space-y-1 border-t border-[#30363d]">
          <div className="pt-1.5">
            <span className="text-gray-500">Input: </span>
            <span className="text-gray-300">{JSON.stringify(tc.args)}</span>
          </div>
          <div>
            <span className="text-gray-500">Expected: </span>
            <span className="text-green-400">{JSON.stringify(tc.expected)}</span>
          </div>
          <div>
            <span className="text-gray-500">Actual: </span>
            <span className={tc.passed ? 'text-green-400' : 'text-red-400'}>
              {tc.actual !== null ? JSON.stringify(tc.actual) : 'null'}
            </span>
          </div>
          {tc.stderr && (
            <div>
              <span className="text-gray-500">Error: </span>
              <span className="text-red-400">{tc.stderr}</span>
            </div>
          )}
          {tc.time && (
            <div>
              <span className="text-gray-500">Time: </span>
              <span className="text-gray-400">{tc.time}s</span>
              {tc.memory && (
                <>
                  <span className="text-gray-600 mx-1">|</span>
                  <span className="text-gray-500">Memory: </span>
                  <span className="text-gray-400">{tc.memory} KB</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

interface SubmitResultModalProps {
  result: TestRunResult;
  onClose: () => void;
}

export default function SubmitResultModal({ result, onClose }: SubmitResultModalProps) {
  const [visible, setVisible] = useState(false);
  const soundPlayed = useRef(false);

  // Trigger entrance animation on mount
  useEffect(() => {
    // Tiny delay so the browser paints the initial state first
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Play sound once on mount
  useEffect(() => {
    if (soundPlayed.current) return;
    soundPlayed.current = true;
    if (result.allPassed) {
      playSuccessSound();
    } else {
      playFailureSound();
    }
  }, [result.allPassed]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      {/* Inject entrance animation keyframes */}
      <style>{`
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes backdrop-enter {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          animation: 'backdrop-enter 200ms ease-out forwards',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-50"
        style={{
          top: '50%',
          left: '50%',
          transform: visible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.95)',
          opacity: visible ? 1 : 0,
          animation: 'modal-enter 200ms ease-out forwards',
          width: 'min(480px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 64px)',
        }}
      >
        <div
          className="relative rounded-lg border border-[#30363d] shadow-2xl flex flex-col"
          style={{
            backgroundColor: '#161b22',
            maxHeight: 'calc(100vh - 64px)',
          }}
        >
          {/* Confetti layer */}
          {result.allPassed && <ConfettiExplosion />}

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d]">
            <h2 className="text-sm font-bold font-mono" style={{ color: 'var(--accent)' }}>
              Submit Results
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition text-lg leading-none px-1"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>

          {/* Summary banner */}
          <div className="px-4 py-3 border-b border-[#30363d]">
            {result.error && result.results.length === 0 ? (
              <div className="text-red-400 text-xs font-mono whitespace-pre-wrap">
                {result.error}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className={`text-2xl font-bold font-mono ${
                    result.allPassed ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {result.passed}/{result.total}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-bold ${
                      result.allPassed ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {result.allPassed ? (
                      <>All Tests Passed! <span className="inline-block ml-0.5">&#127881;</span></>
                    ) : (
                      'Some Tests Failed'
                    )}
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {result.passed} passed, {result.total - result.passed} failed
                  </span>
                </div>
                {/* Pass rate bar */}
                <div className="ml-auto w-20 h-2 rounded-full bg-[#30363d] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      result.allPassed ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(result.passed / Math.max(result.total, 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Execution-level error banner */}
            {result.error && result.results.length > 0 && (
              <div className="mt-2 p-2 bg-red-900/20 border border-red-800/40 rounded text-xs text-red-400 font-mono whitespace-pre-wrap">
                {result.error}
              </div>
            )}
          </div>

          {/* Test case rows — scrollable */}
          <div className="overflow-y-auto p-4 space-y-0" style={{ maxHeight: '340px' }}>
            {result.results.map((tc, i) => (
              <TestCaseRow key={i} tc={tc} index={i} />
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[#30363d] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded text-xs font-mono font-bold transition"
              style={{
                backgroundColor: 'var(--accent)',
                color: '#0d1117',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--accent)';
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
