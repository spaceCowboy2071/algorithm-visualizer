/// <reference lib="webworker" />
declare const self: DedicatedWorkerGlobalScope;

// src/workers/executionWorker.ts
// Web Worker that executes user code in an isolated thread.
// JS runs natively via Function(). Python runs via Pyodide (lazy-loaded from CDN).

import {
  TreeNode, ListNode,
  buildTree, serializeTree, findNode,
  buildList, buildListCycle, serializeList,
  buildJSArgs, convertJSReturn,
  extractFunctionName, isClassBased, isMultiFunction,
  buildPythonHarness,
} from '../services/harnessHelpers';

// ---------------------------------------------------------------------------
// Pyodide lazy loading
// ---------------------------------------------------------------------------

let pyodide: any = null;

async function ensurePyodide(): Promise<any> {
  if (pyodide) return pyodide;
  self.postMessage({ type: 'pyodide-status', status: 'loading' });
  try {
    const mod = await import(
      /* @vite-ignore */
      'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.mjs'
    );
    pyodide = await mod.loadPyodide();
    self.postMessage({ type: 'pyodide-status', status: 'loaded' });
    return pyodide;
  } catch (err: any) {
    self.postMessage({ type: 'pyodide-status', status: 'error', error: err?.message });
    throw new Error(`Failed to load Pyodide: ${err?.message}`);
  }
}

// ---------------------------------------------------------------------------
// JavaScript execution
// ---------------------------------------------------------------------------

interface TestCase {
  args: any[];
  expected: any;
}

interface CaseResult {
  actual: any;
  passed: boolean;
  error?: string;
  time?: string;
}

function executeJS(
  code: string,
  starterCode: string,
  testCases: TestCase[],
  argTypes: string[],
  returnType: string,
  inPlace: boolean,
): CaseResult[] {
  const funcName = extractFunctionName(starterCode, 'javascript');
  if (!funcName) throw new Error('Could not detect function name in your code.');
  if (isClassBased(starterCode)) throw new Error('Class-based problems (Trie, WordDictionary, etc.) are not yet supported.');
  if (isMultiFunction(starterCode, 'javascript')) throw new Error('Multi-function problems (encode/decode, serialize/deserialize) are not yet supported.');

  // Evaluate user code in a scope that has TreeNode and ListNode available.
  // The Function() constructor creates a new function scope — user code can't
  // access the worker's globals (self, postMessage, etc.) unless explicitly passed.
  const wrappedCode = `
    ${code}
    if (typeof ${funcName} === 'function') return ${funcName};
    if (typeof ${funcName} !== 'undefined') return ${funcName};
    throw new Error('Function "${funcName}" not found in your code.');
  `;

  let userFunc: (...args: any[]) => any;
  try {
    const factory = new Function('TreeNode', 'ListNode', wrappedCode);
    userFunc = factory(TreeNode, ListNode);
  } catch (err: any) {
    throw new Error(`Syntax Error: ${err.message}`);
  }

  if (typeof userFunc !== 'function') {
    throw new Error(`"${funcName}" is not a function.`);
  }

  return testCases.map(tc => {
    try {
      const t0 = performance.now();
      const args = buildJSArgs(tc.args, argTypes);
      let actual = userFunc(...args);
      actual = convertJSReturn(actual, returnType, inPlace, args[0]);
      const elapsed = ((performance.now() - t0) / 1000).toFixed(3);
      const passed = JSON.stringify(actual) === JSON.stringify(tc.expected);
      return { actual, passed, time: elapsed };
    } catch (err: any) {
      return { actual: null, passed: false, error: err.message };
    }
  });
}

// ---------------------------------------------------------------------------
// Python execution (via Pyodide)
// ---------------------------------------------------------------------------

async function executePython(
  code: string,
  starterCode: string,
  testCases: TestCase[],
  argTypes: string[],
  returnType: string,
  inPlace: boolean,
): Promise<CaseResult[]> {
  const funcName = extractFunctionName(starterCode, 'python');
  if (!funcName) throw new Error('Could not detect function name in your code.');
  if (isClassBased(starterCode)) throw new Error('Class-based problems are not yet supported.');
  if (isMultiFunction(starterCode, 'python')) throw new Error('Multi-function problems are not yet supported.');

  const py = await ensurePyodide();
  const harness = buildPythonHarness(code, JSON.stringify(testCases), funcName, argTypes, returnType, inPlace);

  try {
    py.runPython(harness);
  } catch (err: any) {
    // Pyodide wraps Python exceptions in JS errors
    const msg = err.message || String(err);
    throw new Error(msg.includes('SyntaxError') ? `Syntax Error: ${msg}` : msg);
  }

  // Read __r from Python globals and convert to JS
  const pyResults = py.globals.get('__r');
  const results: CaseResult[] = pyResults.toJs({ dict_converter: Object.fromEntries });
  pyResults.destroy(); // free Pyodide proxy
  return results;
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.onmessage = async (e: MessageEvent) => {
  const { type, id, language, code, starterCode, testCases, argTypes, returnType, inPlace } = e.data;
  if (type !== 'execute') return;

  try {
    let results: CaseResult[];
    if (language === 'javascript') {
      results = executeJS(code, starterCode, testCases, argTypes, returnType, inPlace);
    } else {
      results = await executePython(code, starterCode, testCases, argTypes, returnType, inPlace);
    }
    self.postMessage({ type: 'result', id, results });
  } catch (err: any) {
    self.postMessage({ type: 'error', id, error: err.message || 'Unknown execution error' });
  }
};

// Signal the main thread that the worker is ready
self.postMessage({ type: 'ready' });
