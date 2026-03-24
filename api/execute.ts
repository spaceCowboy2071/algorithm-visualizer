// api/execute.ts — Vercel Serverless Function
// Proxies code execution requests to Judge0 API.
// The browser calls POST /api/execute → this function wraps user code in a test
// harness, sends it to Judge0, parses the output, and returns structured results.

// ---------------------------------------------------------------------------
// Judge0 language IDs (must match the Judge0 CE instance on RapidAPI)
// ---------------------------------------------------------------------------
const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63, // Node.js 12.14.0
  python: 71,     // Python 3.8.1
};

// Judge0 status ID → human-readable name
const STATUS_MAP: Record<number, string> = {
  1: 'queued',
  2: 'processing',
  3: 'accepted',
  4: 'wrong-answer',
  5: 'time-limit-exceeded',
  6: 'compilation-error',
  7: 'runtime-error-sigsegv',
  8: 'runtime-error-sigxfsz',
  9: 'runtime-error-sigfpe',
  10: 'runtime-error-sigabrt',
  11: 'runtime-error-nzec',
  12: 'runtime-error-other',
  13: 'internal-error',
  14: 'exec-format-error',
};

// ---------------------------------------------------------------------------
// Request / response shapes
// ---------------------------------------------------------------------------
interface TestCase {
  args: any[];
  expected: any;
}

interface ExecuteRequest {
  code: string;
  language: 'javascript' | 'python';
  testCases: TestCase[];
  starterCode: string;
  problemCategory: string;
  argTypes?: string[];
  returnType?: string;
  inPlace?: boolean;
}

// ---------------------------------------------------------------------------
// Starter-code analysis helpers
// ---------------------------------------------------------------------------

/** Pull the first function name out of starter code. */
function extractFunctionName(starterCode: string, language: string): string | null {
  if (language === 'javascript') {
    const m = starterCode.match(/function\s+(\w+)\s*\(/)
           || starterCode.match(/(?:var|let|const)\s+(\w+)\s*=/);
    return m ? m[1] : null;
  }
  const m = starterCode.match(/def\s+(\w+)\s*\(/);
  return m ? m[1] : null;
}

/** True when the starter code defines a class (Trie, WordDictionary, etc.). */
function isClassBased(starterCode: string): boolean {
  return /^\s*class\s+\w+/m.test(starterCode);
}

/** True when the starter code defines >1 function (encode/decode, serialize/deserialize). */
function isMultiFunction(starterCode: string, language: string): boolean {
  const pattern = language === 'javascript' ? /function\s+\w+/g : /def\s+\w+/g;
  return (starterCode.match(pattern) || []).length > 1;
}

// ---------------------------------------------------------------------------
// JavaScript helpers injected into the harness
// ---------------------------------------------------------------------------
function getJSHelpers(argTypes: string[], returnType: string): string {
  let h = '';
  const needTree = argTypes.some(t => t === 'tree' || t === 'nodeValue') || returnType === 'tree';
  const needList = argTypes.some(t => t === 'list' || t === 'list-cycle' || t === 'lists') || returnType === 'list';

  if (needTree) {
    h += `
class TreeNode {
  constructor(v,l,r){this.val=v===undefined?0:v;this.left=l||null;this.right=r||null;}
}
function __buildTree(a){
  if(!a||!a.length||a[0]==null)return null;
  const r=new TreeNode(a[0]),q=[r];let i=1;
  while(q.length&&i<a.length){
    const n=q.shift();
    if(i<a.length&&a[i]!=null){n.left=new TreeNode(a[i]);q.push(n.left);}i++;
    if(i<a.length&&a[i]!=null){n.right=new TreeNode(a[i]);q.push(n.right);}i++;
  }return r;
}
function __serTree(r){
  if(!r)return[];const res=[],q=[r];
  while(q.length){const n=q.shift();if(n){res.push(n.val);q.push(n.left);q.push(n.right);}else res.push(null);}
  while(res.length&&res[res.length-1]==null)res.pop();return res;
}
function __findNode(r,v){if(!r)return null;if(r.val===v)return r;return __findNode(r.left,v)||__findNode(r.right,v);}
`;
  }

  if (needList) {
    h += `
class ListNode {
  constructor(v,n){this.val=v===undefined?0:v;this.next=n||null;}
}
function __buildList(a){
  if(!a||!a.length)return null;
  const h=new ListNode(a[0]);let c=h;
  for(let i=1;i<a.length;i++){c.next=new ListNode(a[i]);c=c.next;}return h;
}
function __buildListCycle(a,pos){
  if(!a||!a.length)return null;
  const ns=a.map(v=>new ListNode(v));
  for(let i=0;i<ns.length-1;i++)ns[i].next=ns[i+1];
  if(pos>=0&&pos<ns.length)ns[ns.length-1].next=ns[pos];
  return ns[0];
}
function __serList(h){
  const r=[];let c=h;const s=new Set();
  while(c&&!s.has(c)){s.add(c);r.push(c.val);c=c.next;}return r;
}
`;
  }

  return h;
}

// ---------------------------------------------------------------------------
// Python helpers injected into the harness
// ---------------------------------------------------------------------------
function getPyHelpers(argTypes: string[], returnType: string): string {
  let h = '';
  const needTree = argTypes.some(t => t === 'tree' || t === 'nodeValue') || returnType === 'tree';
  const needList = argTypes.some(t => t === 'list' || t === 'list-cycle' || t === 'lists') || returnType === 'list';

  if (needTree) {
    h += `
from collections import deque
class TreeNode:
    def __init__(self,val=0,left=None,right=None):
        self.val=val;self.left=left;self.right=right
def __build_tree(a):
    if not a or a[0] is None: return None
    root=TreeNode(a[0]);q=deque([root]);i=1
    while q and i<len(a):
        n=q.popleft()
        if i<len(a) and a[i] is not None:
            n.left=TreeNode(a[i]);q.append(n.left)
        i+=1
        if i<len(a) and a[i] is not None:
            n.right=TreeNode(a[i]);q.append(n.right)
        i+=1
    return root
def __ser_tree(r):
    if not r: return []
    res=[];q=deque([r])
    while q:
        n=q.popleft()
        if n: res.append(n.val);q.append(n.left);q.append(n.right)
        else: res.append(None)
    while res and res[-1] is None: res.pop()
    return res
def __find_node(r,v):
    if not r: return None
    if r.val==v: return r
    return __find_node(r.left,v) or __find_node(r.right,v)
`;
  }

  if (needList) {
    h += `
class ListNode:
    def __init__(self,val=0,next=None):
        self.val=val;self.next=next
def __build_list(a):
    if not a: return None
    h=ListNode(a[0]);c=h
    for v in a[1:]: c.next=ListNode(v);c=c.next
    return h
def __build_list_cycle(a,pos):
    if not a: return None
    ns=[ListNode(v) for v in a]
    for i in range(len(ns)-1): ns[i].next=ns[i+1]
    if 0<=pos<len(ns): ns[-1].next=ns[pos]
    return ns[0]
def __ser_list(h):
    r=[];c=h;s=set()
    while c and id(c) not in s: s.add(id(c));r.append(c.val);c=c.next
    return r
`;
  }

  return h;
}

// ---------------------------------------------------------------------------
// Argument conversion code generators
// ---------------------------------------------------------------------------

function buildJSArgs(argTypes: string[]): string {
  if (!argTypes.length) return 'const __a=tc.args;';

  // Special: list-cycle takes [array, pos] and builds one list with cycle
  if (argTypes[0] === 'list-cycle') {
    return 'const __a=[__buildListCycle(tc.args[0],tc.args[1])];';
  }

  // If any arg is 'nodeValue', we need the tree root reference first
  const hasNodeValue = argTypes.includes('nodeValue');
  const treeIdx = argTypes.indexOf('tree');
  let code = '';

  if (hasNodeValue && treeIdx >= 0) {
    code += `const __root=__buildTree(tc.args[${treeIdx}]);\n    `;
  }

  const parts = argTypes.map((t, i) => {
    switch (t) {
      case 'tree':
        return hasNodeValue ? '__root' : `__buildTree(tc.args[${i}])`;
      case 'nodeValue':
        return `__findNode(__root,tc.args[${i}])`;
      case 'list':
        return `__buildList(tc.args[${i}])`;
      case 'lists':
        return `tc.args[${i}].map(__buildList)`;
      default:
        return `tc.args[${i}]`;
    }
  });

  code += `const __a=[${parts.join(',')}];`;
  return code;
}

function buildPyArgs(argTypes: string[]): string {
  if (!argTypes.length) return '        __a=tc["args"]';

  if (argTypes[0] === 'list-cycle') {
    return '        __a=[__build_list_cycle(tc["args"][0],tc["args"][1])]';
  }

  const hasNodeValue = argTypes.includes('nodeValue');
  const treeIdx = argTypes.indexOf('tree');
  const lines: string[] = [];

  if (hasNodeValue && treeIdx >= 0) {
    lines.push(`        __root=__build_tree(tc["args"][${treeIdx}])`);
  }

  const parts = argTypes.map((t, i) => {
    switch (t) {
      case 'tree':
        return hasNodeValue ? '__root' : `__build_tree(tc["args"][${i}])`;
      case 'nodeValue':
        return `__find_node(__root,tc["args"][${i}])`;
      case 'list':
        return `__build_list(tc["args"][${i}])`;
      case 'lists':
        return `[__build_list(x) for x in tc["args"][${i}]]`;
      default:
        return `tc["args"][${i}]`;
    }
  });

  lines.push(`        __a=[${parts.join(',')}]`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Return-value conversion
// ---------------------------------------------------------------------------

function jsReturnConv(returnType: string, inPlace: boolean): string {
  if (inPlace) {
    // Function modifies arg in place and returns undefined
    return `if(actual===undefined)actual=__serList(__a[0]);
    else if(actual&&actual.val!==undefined)actual=__serList(actual);
    else if(actual===null)actual=[];`;
  }
  switch (returnType) {
    case 'tree': return 'actual=actual?__serTree(actual):[];';
    case 'list': return 'actual=actual?__serList(actual):[];';
    default: return '';
  }
}

function pyReturnConv(returnType: string, inPlace: boolean): string {
  if (inPlace) {
    return `        if actual is None: actual=__ser_list(__a[0])
        elif hasattr(actual,'val'): actual=__ser_list(actual)`;
  }
  switch (returnType) {
    case 'tree': return "        actual=__ser_tree(actual) if actual else []";
    case 'list': return "        actual=__ser_list(actual) if actual else []";
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// Source code builder — wraps user code + test harness into one program
// ---------------------------------------------------------------------------
function buildSource(
  userCode: string,
  language: string,
  testCases: TestCase[],
  starterCode: string,
  argTypes: string[],
  returnType: string,
  inPlace: boolean,
): string {
  // Unsupported problem patterns
  if (isClassBased(starterCode)) {
    return language === 'javascript'
      ? `console.log(JSON.stringify([{actual:null,passed:false,error:"Class-based problems (Trie, WordDictionary, etc.) are not yet supported by auto-judge."}]));`
      : `import json\nprint(json.dumps([{"actual":None,"passed":False,"error":"Class-based problems are not yet supported by auto-judge."}]))`;
  }
  if (isMultiFunction(starterCode, language)) {
    return language === 'javascript'
      ? `console.log(JSON.stringify([{actual:null,passed:false,error:"Multi-function problems (encode/decode, serialize/deserialize) are not yet supported."}]));`
      : `import json\nprint(json.dumps([{"actual":None,"passed":False,"error":"Multi-function problems are not yet supported."}]))`;
  }

  const funcName = extractFunctionName(starterCode, language);
  if (!funcName) {
    return language === 'javascript'
      ? `console.log(JSON.stringify([{actual:null,passed:false,error:"Could not detect function name in your code."}]));`
      : `import json\nprint(json.dumps([{"actual":None,"passed":False,"error":"Could not detect function name in your code."}]))`;
  }

  const tcJson = JSON.stringify(testCases);

  // ---- JavaScript harness ----
  if (language === 'javascript') {
    const helpers = getJSHelpers(argTypes, returnType);
    const argConv = buildJSArgs(argTypes);
    const retConv = jsReturnConv(returnType, inPlace);

    return `${helpers}
${userCode}

const __tc=${tcJson};
const __r=__tc.map(tc=>{
  try{
    ${argConv}
    let actual=${funcName}(...__a);
    ${retConv}
    return{actual,passed:JSON.stringify(actual)===JSON.stringify(tc.expected)};
  }catch(e){return{actual:null,passed:false,error:e.message};}
});
console.log(JSON.stringify(__r));`;
  }

  // ---- Python harness ----
  const helpers = getPyHelpers(argTypes, returnType);
  const argConv = buildPyArgs(argTypes);
  const retConv = pyReturnConv(returnType, inPlace);

  return `import json
${helpers}
${userCode}

__tc=json.loads("""${tcJson.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')}""")
__r=[]
for tc in __tc:
    try:
${argConv}
        actual=${funcName}(*__a)
${retConv}
        __r.append({"actual":actual,"passed":json.dumps(actual,default=str,sort_keys=True)==json.dumps(tc["expected"],default=str,sort_keys=True)})
    except Exception as e:
        __r.append({"actual":None,"passed":False,"error":str(e)})
print(json.dumps(__r,default=str))`;
}

// ---------------------------------------------------------------------------
// Vercel handler
// ---------------------------------------------------------------------------
export default async function handler(req: any, res: any) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    code,
    language,
    testCases,
    starterCode,
    argTypes = [],
    returnType = 'raw',
    inPlace = false,
  } = req.body as ExecuteRequest;

  if (!code || !language || !testCases || !starterCode) {
    return res.status(400).json({ error: 'Missing required fields: code, language, testCases, starterCode' });
  }

  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }

  // Build the full program (user code + test harness)
  const source = buildSource(code, language, testCases, starterCode, argTypes, returnType, inPlace);

  const apiKey = process.env.JUDGE0_API_KEY;
  const apiUrl = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';

  if (!apiKey) {
    return res.status(500).json({ error: 'JUDGE0_API_KEY environment variable is not configured' });
  }

  try {
    // Submit to Judge0 with ?wait=true (synchronous — blocks until result is ready)
    const j0 = await fetch(
      `${apiUrl}/submissions?wait=true&base64_encoded=true&fields=stdout,stderr,compile_output,status,time,memory`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        body: JSON.stringify({
          source_code: Buffer.from(source).toString('base64'),
          language_id: languageId,
          cpu_time_limit: 10,
          memory_limit: 256000,
        }),
      },
    );

    if (!j0.ok) {
      const errText = await j0.text();
      return res.status(j0.status).json({ error: `Judge0 API error (${j0.status})`, details: errText });
    }

    const sub: any = await j0.json();

    // Decode base64 fields
    const stdout = sub.stdout ? Buffer.from(sub.stdout, 'base64').toString() : '';
    const stderr = sub.stderr ? Buffer.from(sub.stderr, 'base64').toString() : '';
    const compileOutput = sub.compile_output ? Buffer.from(sub.compile_output, 'base64').toString() : null;
    const statusId: number = sub.status?.id ?? 13;
    const statusName = STATUS_MAP[statusId] || 'internal-error';

    // Non-successful execution → return error for every test case
    if (statusId !== 3) {
      return res.status(200).json({
        results: testCases.map((tc: TestCase) => ({
          args: tc.args, expected: tc.expected, actual: null, passed: false,
          status: statusName, stdout: '', stderr, compileOutput,
          time: sub.time ?? null, memory: sub.memory ?? null,
        })),
        passed: 0,
        total: testCases.length,
        allPassed: false,
        error:
          statusId === 5 ? 'Time Limit Exceeded' :
          statusId === 6 ? `Compilation Error:\n${compileOutput}` :
          statusId >= 7 && statusId <= 12 ? `Runtime Error:\n${stderr}` :
          `Execution failed (${statusName})`,
      });
    }

    // Parse the JSON array our harness printed to stdout
    let parsed: any[];
    try {
      parsed = JSON.parse(stdout.trim());
    } catch {
      return res.status(200).json({
        results: testCases.map((tc: TestCase) => ({
          args: tc.args, expected: tc.expected, actual: null, passed: false,
          status: 'internal-error', stdout, stderr, compileOutput,
          time: sub.time ?? null, memory: sub.memory ?? null,
        })),
        passed: 0, total: testCases.length, allPassed: false,
        error: `Could not parse program output. Raw stdout: ${stdout.substring(0, 500)}`,
      });
    }

    // Build per-test-case results
    const results = testCases.map((tc: TestCase, i: number) => {
      const r = parsed[i] || { actual: null, passed: false };
      return {
        args: tc.args,
        expected: tc.expected,
        actual: r.actual ?? null,
        passed: !!r.passed,
        status: r.passed ? 'accepted' : r.error ? 'runtime-error-other' : 'wrong-answer',
        stdout: '', stderr: r.error || '', compileOutput: null,
        time: sub.time ?? null, memory: sub.memory ?? null,
      };
    });

    const passedCount = results.filter((r: any) => r.passed).length;

    return res.status(200).json({
      results,
      passed: passedCount,
      total: testCases.length,
      allPassed: passedCount === testCases.length,
      error: null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Network error: ${err?.message || 'Unknown'}` });
  }
}
