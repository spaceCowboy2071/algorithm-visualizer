// src/services/codeRunner.ts
// Thin API client between React components and the /api/execute serverless function.
// Keeps all fetch/error-handling logic out of the UI layer.

import type { TestRunResult } from '../types/visualization';
import type { Problem } from '../data/problemsData';

/**
 * Sends user code + test cases to the serverless proxy, which forwards
 * them to Judge0 for execution. Returns structured pass/fail results.
 */
export async function executeCode(
  code: string,
  language: 'javascript' | 'python',
  problem: Problem,
): Promise<TestRunResult> {
  try {
    const res = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        language,
        testCases: problem.testCases,
        starterCode: problem.starterCode[language],
        problemCategory: problem.category,
        argTypes: problem.argTypes,
        returnType: problem.returnType,
        inPlace: problem.inPlace,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return {
        results: [],
        passed: 0,
        total: problem.testCases.length,
        allPassed: false,
        error: body.error || `Request failed (${res.status})`,
      };
    }

    return await res.json();
  } catch (err: any) {
    return {
      results: [],
      passed: 0,
      total: problem.testCases.length,
      allPassed: false,
      error: err?.message || 'Network error — check your connection',
    };
  }
}
