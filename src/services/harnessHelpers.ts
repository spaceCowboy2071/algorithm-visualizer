// src/services/harnessHelpers.ts
// Shared harness logic for browser-based code execution.
//
// JavaScript helpers are real classes/functions that run natively in the
// Web Worker.  Python helpers are string builders because Pyodide's
// runPython() takes a source string.

// ---------------------------------------------------------------------------
// Starter-code analysis
// ---------------------------------------------------------------------------

export function extractFunctionName(starterCode: string, language: string): string | null {
  if (language === 'javascript') {
    const m = starterCode.match(/function\s+(\w+)\s*\(/)
           || starterCode.match(/(?:var|let|const)\s+(\w+)\s*=/);
    return m ? m[1] : null;
  }
  const m = starterCode.match(/def\s+(\w+)\s*\(/);
  return m ? m[1] : null;
}

export function isClassBased(starterCode: string): boolean {
  return /^\s*class\s+\w+/m.test(starterCode);
}

export function isMultiFunction(starterCode: string, language: string): boolean {
  const pattern = language === 'javascript' ? /function\s+\w+/g : /def\s+\w+/g;
  return (starterCode.match(pattern) || []).length > 1;
}

// ---------------------------------------------------------------------------
// JS data-structure classes (used directly in the Worker's JS context)
// ---------------------------------------------------------------------------

export class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

export class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// ---------------------------------------------------------------------------
// JS tree helpers
// ---------------------------------------------------------------------------

export function buildTree(arr: any[]): TreeNode | null {
  if (!arr || !arr.length || arr[0] == null) return null;
  const root = new TreeNode(arr[0]);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length && i < arr.length) {
    const node = queue.shift()!;
    if (i < arr.length && arr[i] != null) {
      node.left = new TreeNode(arr[i]);
      queue.push(node.left);
    }
    i++;
    if (i < arr.length && arr[i] != null) {
      node.right = new TreeNode(arr[i]);
      queue.push(node.right);
    }
    i++;
  }
  return root;
}

export function serializeTree(root: TreeNode | null): any[] {
  if (!root) return [];
  const result: any[] = [];
  const queue: (TreeNode | null)[] = [root];
  while (queue.length) {
    const node = queue.shift()!;
    if (node) {
      result.push(node.val);
      queue.push(node.left);
      queue.push(node.right);
    } else {
      result.push(null);
    }
  }
  while (result.length && result[result.length - 1] == null) result.pop();
  return result;
}

export function findNode(root: TreeNode | null, val: number): TreeNode | null {
  if (!root) return null;
  if (root.val === val) return root;
  return findNode(root.left, val) || findNode(root.right, val);
}

// ---------------------------------------------------------------------------
// JS linked-list helpers
// ---------------------------------------------------------------------------

export function buildList(arr: number[]): ListNode | null {
  if (!arr || !arr.length) return null;
  const head = new ListNode(arr[0]);
  let curr = head;
  for (let i = 1; i < arr.length; i++) {
    curr.next = new ListNode(arr[i]);
    curr = curr.next;
  }
  return head;
}

export function buildListCycle(arr: number[], pos: number): ListNode | null {
  if (!arr || !arr.length) return null;
  const nodes = arr.map(v => new ListNode(v));
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].next = nodes[i + 1];
  if (pos >= 0 && pos < nodes.length) nodes[nodes.length - 1].next = nodes[pos];
  return nodes[0];
}

export function serializeList(head: ListNode | null): number[] {
  const result: number[] = [];
  let curr = head;
  const seen = new Set<ListNode>();
  while (curr && !seen.has(curr)) {
    seen.add(curr);
    result.push(curr.val);
    curr = curr.next;
  }
  return result;
}

// ---------------------------------------------------------------------------
// JS argument conversion (value-level, not string-building)
// ---------------------------------------------------------------------------

export function buildJSArgs(rawArgs: any[], argTypes: string[]): any[] {
  if (!argTypes.length) return rawArgs;

  if (argTypes[0] === 'list-cycle') {
    return [buildListCycle(rawArgs[0], rawArgs[1])];
  }

  const hasNodeValue = argTypes.includes('nodeValue');
  const treeIdx = argTypes.indexOf('tree');
  let treeRoot: TreeNode | null = null;

  if (hasNodeValue && treeIdx >= 0) {
    treeRoot = buildTree(rawArgs[treeIdx]);
  }

  return argTypes.map((type, i) => {
    switch (type) {
      case 'tree':
        return hasNodeValue ? treeRoot : buildTree(rawArgs[i]);
      case 'nodeValue':
        return treeRoot ? findNode(treeRoot, rawArgs[i]) : rawArgs[i];
      case 'list':
        return buildList(rawArgs[i]);
      case 'lists':
        return rawArgs[i].map((a: any) => buildList(a));
      default:
        return rawArgs[i];
    }
  });
}

// ---------------------------------------------------------------------------
// JS return-value conversion (value-level, not string-building)
// ---------------------------------------------------------------------------

export function convertJSReturn(
  actual: any,
  returnType: string,
  inPlace: boolean,
  firstArg: any,
): any {
  if (inPlace) {
    if (actual === undefined) return serializeList(firstArg);
    if (actual && actual.val !== undefined) return serializeList(actual);
    if (actual === null) return [];
    return actual;
  }
  switch (returnType) {
    case 'tree':
      return actual ? serializeTree(actual) : [];
    case 'list':
      return actual ? serializeList(actual) : [];
    default:
      return actual;
  }
}

// ---------------------------------------------------------------------------
// Python string builders (Pyodide's runPython takes a string)
// ---------------------------------------------------------------------------

export function getPyHelpers(argTypes: string[], returnType: string): string {
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

export function buildPyArgs(argTypes: string[]): string {
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

export function pyReturnConv(returnType: string, inPlace: boolean): string {
  if (inPlace) {
    return `        if actual is None: actual=__ser_list(__a[0])
        elif hasattr(actual,'val'): actual=__ser_list(actual)`;
  }
  switch (returnType) {
    case 'tree': return '        actual=__ser_tree(actual) if actual else []';
    case 'list': return '        actual=__ser_list(actual) if actual else []';
    default: return '';
  }
}

/** Compose a complete Python program that runs all test cases via Pyodide. */
export function buildPythonHarness(
  userCode: string,
  testCasesJson: string,
  funcName: string,
  argTypes: string[],
  returnType: string,
  inPlace: boolean,
): string {
  const helpers = getPyHelpers(argTypes, returnType);
  const argConv = buildPyArgs(argTypes);
  const retConv = pyReturnConv(returnType, inPlace);

  // Normalize tabs → 4 spaces to avoid IndentationError from mixed whitespace
  const cleanCode = userCode.replace(/\t/g, '    ');

  return `import json
import time as _time
${helpers}
${cleanCode}

__tc=json.loads("""${testCasesJson.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')}""")
__r=[]
for tc in __tc:
    try:
        _t0=_time.time()
${argConv}
        actual=${funcName}(*__a)
${retConv}
        _elapsed=f"{_time.time()-_t0:.3f}"
        __r.append({"actual":actual,"passed":json.dumps(actual,default=str,sort_keys=True)==json.dumps(tc["expected"],default=str,sort_keys=True),"time":_elapsed})
    except Exception as e:
        __r.append({"actual":None,"passed":False,"error":str(e)})
`;
}
