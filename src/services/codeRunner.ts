// src/services/codeRunner.ts
// Manages a Web Worker that executes user code in an isolated thread.
// Replaces the old fetch-based Judge0 proxy with zero-cost browser execution.

import type { TestRunResult, TestCaseResult, SubmissionStatus } from '../types/visualization';
import type { Problem } from '../data/problemsData';

const TIMEOUT_MS = 10_000; // 10 seconds before we kill the worker (TLE)

// ---------------------------------------------------------------------------
// Worker lifecycle
// ---------------------------------------------------------------------------

let worker: Worker | null = null;
let requestId = 0;
let pyodideLoaded = false;
let onPyodideStatus: ((status: string) => void) | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../workers/executionWorker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.addEventListener('message', handleGlobalMessages);
  }
  return worker;
}

function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    pyodideLoaded = false; // Pyodide state is lost when worker dies
  }
}

function handleGlobalMessages(e: MessageEvent) {
  if (e.data.type === 'pyodide-status') {
    if (e.data.status === 'loaded') pyodideLoaded = true;
    onPyodideStatus?.(e.data.status);
  }
}

/** Register a callback for Pyodide loading status updates. */
export function setPyodideStatusCallback(cb: ((status: string) => void) | null): void {
  onPyodideStatus = cb;
}

/** True once Pyodide has finished loading in the current worker instance. */
export function isPyodideLoaded(): boolean {
  return pyodideLoaded;
}

// ---------------------------------------------------------------------------
// Main entry point — same signature as the old fetch-based version
// ---------------------------------------------------------------------------

export async function executeCode(
  code: string,
  language: 'javascript' | 'python',
  problem: Problem,
): Promise<TestRunResult> {
  const id = String(++requestId);
  const w = getWorker();
  let timeoutHandle: ReturnType<typeof setTimeout>;

  const result = await Promise.race([
    // --- Execution promise ---
    new Promise<TestRunResult>((resolve) => {
      const handler = (e: MessageEvent) => {
        if (e.data.id !== id) return;
        w.removeEventListener('message', handler);
        clearTimeout(timeoutHandle);

        if (e.data.type === 'error') {
          resolve(buildErrorResult(problem.testCases, e.data.error));
          return;
        }

        // e.data.type === 'result'
        resolve(buildSuccessResult(e.data.results, problem.testCases));
      };
      w.addEventListener('message', handler);

      w.postMessage({
        type: 'execute',
        id,
        language,
        code,
        starterCode: problem.starterCode[language],
        testCases: problem.testCases,
        argTypes: problem.argTypes || [],
        returnType: problem.returnType || 'raw',
        inPlace: problem.inPlace || false,
      });
    }),

    // --- Timeout promise ---
    new Promise<TestRunResult>((resolve) => {
      timeoutHandle = setTimeout(() => {
        terminateWorker();
        resolve(buildTLEResult(problem.testCases));
      }, TIMEOUT_MS);
    }),
  ]);

  return result;
}

// ---------------------------------------------------------------------------
// Result builders
// ---------------------------------------------------------------------------

function buildSuccessResult(
  workerResults: Array<{ actual: any; passed: boolean; error?: string; time?: string }>,
  testCases: Array<{ args: any[]; expected: any }>,
): TestRunResult {
  const results: TestCaseResult[] = testCases.map((tc, i) => {
    const r = workerResults[i] || { actual: null, passed: false, error: 'No result' };
    return {
      args: tc.args,
      expected: tc.expected,
      actual: r.actual ?? null,
      passed: !!r.passed,
      status: (r.passed ? 'accepted' : r.error ? 'runtime-error-other' : 'wrong-answer') as SubmissionStatus,
      stdout: '',
      stderr: r.error || '',
      compileOutput: null,
      time: r.time || null,
      memory: null,
    };
  });
  const passed = results.filter(r => r.passed).length;
  return { results, passed, total: testCases.length, allPassed: passed === testCases.length, error: null };
}

function buildErrorResult(
  testCases: Array<{ args: any[]; expected: any }>,
  error: string,
): TestRunResult {
  const isSyntax = error.toLowerCase().includes('syntax');
  const status: SubmissionStatus = isSyntax ? 'compilation-error' : 'runtime-error-other';
  return {
    results: testCases.map(tc => ({
      args: tc.args,
      expected: tc.expected,
      actual: null,
      passed: false,
      status,
      stdout: '',
      stderr: error,
      compileOutput: isSyntax ? error : null,
      time: null,
      memory: null,
    })),
    passed: 0,
    total: testCases.length,
    allPassed: false,
    error,
  };
}

function buildTLEResult(
  testCases: Array<{ args: any[]; expected: any }>,
): TestRunResult {
  return {
    results: testCases.map(tc => ({
      args: tc.args,
      expected: tc.expected,
      actual: null,
      passed: false,
      status: 'time-limit-exceeded' as SubmissionStatus,
      stdout: '',
      stderr: '',
      compileOutput: null,
      time: null,
      memory: null,
    })),
    passed: 0,
    total: testCases.length,
    allPassed: false,
    error: 'Time Limit Exceeded (10s)',
  };
}
