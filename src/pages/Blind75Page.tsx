import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
  category: string;
  solvedIn20Min: boolean;
}

// Problem data from the spreadsheet
const PROBLEMS: Problem[] = [
  // Array
  { id: 1, title: '3Sum', difficulty: 'Medium', url: 'https://leetcode.com/problems/3sum/', category: 'Array', solvedIn20Min: false },
  { id: 2, title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', category: 'Array', solvedIn20Min: false },
  { id: 3, title: 'Container With Most Water', difficulty: 'Medium', url: 'https://leetcode.com/problems/container-with-most-water/', category: 'Array', solvedIn20Min: false },
  { id: 4, title: 'Contains Duplicate', difficulty: 'Easy', url: 'https://leetcode.com/problems/contains-duplicate/', category: 'Array', solvedIn20Min: false },
  { id: 5, title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', category: 'Array', solvedIn20Min: false },
  { id: 6, title: 'Maximum Product Subarray', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-product-subarray/', category: 'Array', solvedIn20Min: false },
  { id: 7, title: 'Maximum Subarray', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-subarray/', category: 'Array', solvedIn20Min: false },
  { id: 8, title: 'Product of Array Except Self', difficulty: 'Medium', url: 'https://leetcode.com/problems/product-of-array-except-self/', category: 'Array', solvedIn20Min: false },
  { id: 9, title: 'Search in Rotated Sorted Array', difficulty: 'Medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', category: 'Array', solvedIn20Min: false },
  { id: 10, title: 'Two Sum', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/', category: 'Array', solvedIn20Min: false },
  
  // Binary
  { id: 11, title: 'Counting Bits', difficulty: 'Easy', url: 'https://leetcode.com/problems/counting-bits/', category: 'Binary', solvedIn20Min: false },
  { id: 12, title: 'Missing Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/missing-number/', category: 'Binary', solvedIn20Min: false },
  { id: 13, title: 'Number of 1 Bits', difficulty: 'Easy', url: 'https://leetcode.com/problems/number-of-1-bits/', category: 'Binary', solvedIn20Min: false },
  { id: 14, title: 'Reverse Bits', difficulty: 'Easy', url: 'https://leetcode.com/problems/reverse-bits/', category: 'Binary', solvedIn20Min: false },
  { id: 15, title: 'Sum of Two Integers', difficulty: 'Medium', url: 'https://leetcode.com/problems/sum-of-two-integers/', category: 'Binary', solvedIn20Min: false },
  
  // Dynamic Programming
  { id: 16, title: 'Climbing Stairs', difficulty: 'Easy', url: 'https://leetcode.com/problems/climbing-stairs/', category: 'Dynamic Programming', solvedIn20Min: false },
  { id: 17, title: 'Coin Change', difficulty: 'Medium', url: 'https://leetcode.com/problems/coin-change/', category: 'Dynamic Programming', solvedIn20Min: false },
  { id: 18, title: 'Combination Sum', difficulty: 'Medium', url: 'https://leetcode.com/problems/combination-sum/', category: 'Dynamic Programming', solvedIn20Min: false },
  { id: 19, title: 'Decode Ways', difficulty: 'Medium', url: 'https://leetcode.com/problems/decode-ways/', category: 'Dynamic Programming', solvedIn20Min: false },
  { id: 20, title: 'House Robber', difficulty: 'Medium', url: 'https://leetcode.com/problems/house-robber/', category: 'Dynamic Programming', solvedIn20Min: false },
  { id: 21, title: 'House Robber II', difficulty: 'Medium', url: 'https://leetcode.com/problems/house-robber-ii/', category: 'Dynamic Programming', solvedIn20Min: false },
  { id: 22, title: 'Jump Game', difficulty: 'Medium', url: 'https://leetcode.com/problems/jump-game/', category: 'Dynamic Programming', solvedIn20Min: false },
  { id: 23, title: 'Longest Common Subsequence', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-common-subsequence/', category: 'Dynamic Programming', solvedIn20Min: false },
  { id: 24, title: 'Longest Increasing Subsequence', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-increasing-subsequence/', category: 'Dynamic Programming', solvedIn20Min: false },
  { id: 25, title: 'Unique Paths', difficulty: 'Medium', url: 'https://leetcode.com/problems/unique-paths/', category: 'Dynamic Programming', solvedIn20Min: false },
  { id: 26, title: 'Word Break', difficulty: 'Medium', url: 'https://leetcode.com/problems/word-break/', category: 'Dynamic Programming', solvedIn20Min: false },
  
  // Graph
  { id: 27, title: 'Alien Dictionary (Premium)', difficulty: 'Hard', url: 'https://leetcode.com/problems/alien-dictionary/', category: 'Graph', solvedIn20Min: false },
  { id: 28, title: 'Clone Graph', difficulty: 'Medium', url: 'https://leetcode.com/problems/clone-graph/', category: 'Graph', solvedIn20Min: false },
  { id: 29, title: 'Course Schedule', difficulty: 'Medium', url: 'https://leetcode.com/problems/course-schedule/', category: 'Graph', solvedIn20Min: false },
  { id: 30, title: 'Graph Valid Tree (Premium)', difficulty: 'Medium', url: 'https://leetcode.com/problems/graph-valid-tree/', category: 'Graph', solvedIn20Min: false },
  { id: 31, title: 'Longest Consecutive Sequence', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-consecutive-sequence/', category: 'Graph', solvedIn20Min: false },
  { id: 32, title: 'Number of Connected Components in an Undirected Graph (Premium)', difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', category: 'Graph', solvedIn20Min: false },
  { id: 33, title: 'Number of Islands', difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-islands/', category: 'Graph', solvedIn20Min: false },
  { id: 34, title: 'Pacific Atlantic Water Flow', difficulty: 'Medium', url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', category: 'Graph', solvedIn20Min: false },
  
  // Heap
  { id: 35, title: 'Find Median from Data Stream', difficulty: 'Hard', url: 'https://leetcode.com/problems/find-median-from-data-stream/', category: 'Heap', solvedIn20Min: false },
  { id: 36, title: 'Top K Frequent Elements', difficulty: 'Medium', url: 'https://leetcode.com/problems/top-k-frequent-elements/', category: 'Heap', solvedIn20Min: false },
  
  // Interval
  { id: 37, title: 'Insert Interval', difficulty: 'Medium', url: 'https://leetcode.com/problems/insert-interval/', category: 'Interval', solvedIn20Min: false },
  { id: 38, title: 'Meeting Rooms (Premium)', difficulty: 'Easy', url: 'https://leetcode.com/problems/meeting-rooms/', category: 'Interval', solvedIn20Min: false },
  { id: 39, title: 'Meeting Rooms II (Premium)', difficulty: 'Medium', url: 'https://leetcode.com/problems/meeting-rooms-ii/', category: 'Interval', solvedIn20Min: false },
  { id: 40, title: 'Merge Intervals', difficulty: 'Medium', url: 'https://leetcode.com/problems/merge-intervals/', category: 'Interval', solvedIn20Min: false },
  { id: 41, title: 'Non-overlapping Intervals', difficulty: 'Medium', url: 'https://leetcode.com/problems/non-overlapping-intervals/', category: 'Interval', solvedIn20Min: false },
  
  // Linked List
  { id: 42, title: 'Detect Cycle in a Linked List', difficulty: 'Easy', url: 'https://leetcode.com/problems/linked-list-cycle/', category: 'Linked List', solvedIn20Min: false },
  { id: 43, title: 'Merge K Sorted Lists', difficulty: 'Hard', url: 'https://leetcode.com/problems/merge-k-sorted-lists/', category: 'Linked List', solvedIn20Min: false },
  { id: 44, title: 'Merge Two Sorted Lists', difficulty: 'Easy', url: 'https://leetcode.com/problems/merge-two-sorted-lists/', category: 'Linked List', solvedIn20Min: false },
  { id: 45, title: 'Remove Nth Node From End Of List', difficulty: 'Medium', url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', category: 'Linked List', solvedIn20Min: false },
  { id: 46, title: 'Reorder List', difficulty: 'Medium', url: 'https://leetcode.com/problems/reorder-list/', category: 'Linked List', solvedIn20Min: false },
  { id: 47, title: 'Reverse a Linked List', difficulty: 'Easy', url: 'https://leetcode.com/problems/reverse-linked-list/', category: 'Linked List', solvedIn20Min: false },
  
  // Matrix
  { id: 48, title: 'Rotate Image', difficulty: 'Medium', url: 'https://leetcode.com/problems/rotate-image/', category: 'Matrix', solvedIn20Min: false },
  { id: 49, title: 'Set Matrix Zeroes', difficulty: 'Medium', url: 'https://leetcode.com/problems/set-matrix-zeroes/', category: 'Matrix', solvedIn20Min: false },
  { id: 50, title: 'Spiral Matrix', difficulty: 'Medium', url: 'https://leetcode.com/problems/spiral-matrix/', category: 'Matrix', solvedIn20Min: false },
  { id: 51, title: 'Word Search', difficulty: 'Medium', url: 'https://leetcode.com/problems/word-search/', category: 'Matrix', solvedIn20Min: false },
  
  // String
  { id: 52, title: 'Encode and Decode Strings (Premium)', difficulty: 'Medium', url: 'https://leetcode.com/problems/encode-and-decode-strings/', category: 'String', solvedIn20Min: false },
  { id: 53, title: 'Group Anagrams', difficulty: 'Medium', url: 'https://leetcode.com/problems/group-anagrams/', category: 'String', solvedIn20Min: false },
  { id: 54, title: 'Longest Palindromic Substring', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-palindromic-substring/', category: 'String', solvedIn20Min: false },
  { id: 55, title: 'Longest Repeating Character Replacement', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-repeating-character-replacement/', category: 'String', solvedIn20Min: false },
  { id: 56, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', category: 'String', solvedIn20Min: false },
  { id: 57, title: 'Minimum Window Substring', difficulty: 'Hard', url: 'https://leetcode.com/problems/minimum-window-substring/', category: 'String', solvedIn20Min: false },
  { id: 58, title: 'Palindromic Substrings', difficulty: 'Medium', url: 'https://leetcode.com/problems/palindromic-substrings/', category: 'String', solvedIn20Min: false },
  { id: 59, title: 'Valid Anagram', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-anagram/', category: 'String', solvedIn20Min: false },
  { id: 60, title: 'Valid Palindrome', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-palindrome/', category: 'String', solvedIn20Min: false },
  { id: 61, title: 'Valid Parentheses', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-parentheses/', category: 'String', solvedIn20Min: false },
  
  // Tree
  { id: 62, title: 'Add and Search Word', difficulty: 'Medium', url: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', category: 'Tree', solvedIn20Min: false },
  { id: 63, title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', category: 'Tree', solvedIn20Min: false },
  { id: 64, title: 'Binary Tree Maximum Path Sum', difficulty: 'Hard', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', category: 'Tree', solvedIn20Min: false },
  { id: 65, title: 'Construct Binary Tree from Preorder and Inorder Traversal', difficulty: 'Medium', url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', category: 'Tree', solvedIn20Min: false },
  { id: 66, title: 'Implement Trie (Prefix Tree)', difficulty: 'Medium', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/', category: 'Tree', solvedIn20Min: false },
  { id: 67, title: 'Invert/Flip Binary Tree', difficulty: 'Easy', url: 'https://leetcode.com/problems/invert-binary-tree/', category: 'Tree', solvedIn20Min: false },
  { id: 68, title: 'Kth Smallest Element in a BST', difficulty: 'Medium', url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', category: 'Tree', solvedIn20Min: false },
  { id: 69, title: 'Lowest Common Ancestor of BST', difficulty: 'Easy', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', category: 'Tree', solvedIn20Min: false },
  { id: 70, title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', category: 'Tree', solvedIn20Min: false },
  { id: 71, title: 'Same Tree', difficulty: 'Easy', url: 'https://leetcode.com/problems/same-tree/', category: 'Tree', solvedIn20Min: false },
  { id: 72, title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', category: 'Tree', solvedIn20Min: false },
  { id: 73, title: 'Subtree of Another Tree', difficulty: 'Easy', url: 'https://leetcode.com/problems/subtree-of-another-tree/', category: 'Tree', solvedIn20Min: false },
  { id: 74, title: 'Validate Binary Search Tree', difficulty: 'Medium', url: 'https://leetcode.com/problems/validate-binary-search-tree/', category: 'Tree', solvedIn20Min: false },
  { id: 75, title: 'Word Search II', difficulty: 'Hard', url: 'https://leetcode.com/problems/word-search-ii/', category: 'Tree', solvedIn20Min: false },
];

const CATEGORIES = [
  'Array',
  'Binary',
  'Dynamic Programming',
  'Graph',
  'Heap',
  'Interval',
  'Linked List',
  'Matrix',
  'String',
  'Tree'
];

function Blind75Page() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [problemStates, setProblemStates] = useState<Record<number, boolean>>({});

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  const toggleProblemSolved = (problemId: number) => {
    setProblemStates(prev => ({
      ...prev,
      [problemId]: !prev[problemId]
    }));
  };

  const getCategoryProblems = (category: string) => {
    return PROBLEMS.filter(p => p.category === category);
  };

  const getCategoryStats = (category: string) => {
    const problems = getCategoryProblems(category);
    const solved = problems.filter(p => problemStates[p.id]).length;
    return { total: problems.length, solved };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'Hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 100%)' }}
    >
      {/* Monitor Container */}
      <div className="flex-1 flex flex-col h-[calc(100vh-80px)]">
        {/* Monitor Frame (Black Bezel) */}
        <div className="flex-1 bg-black p-8 flex flex-col relative">
          {/* Monitor Screen */}
          <div className="flex-1 flex flex-col">
            {/* Terminal Window */}
            <div className="flex-1 bg-[#0d0d0d] border-2 border-[#1a1a1a] rounded-md shadow-2xl flex flex-col overflow-hidden">
              {/* Terminal Title Bar */}
              <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#2a2a2a] flex items-center justify-between">
                <span className="text-gray-500 text-xs font-mono">terminal@algorithmviz/blind75</span>
                <Link 
                  to="/"
                  className="text-gray-500 hover:text-[#4af626] text-xs transition"
                >
                  ← Back
                </Link>
              </div>

              {/* Terminal Body */}
              <div className="flex-1 flex flex-col p-8 text-[#4af626] font-mono overflow-auto">
                {/* Header Section */}
                <div className="mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-[0_0_10px_rgba(74,246,38,0.5)]">
                    <span className="text-[#4af626]">$ </span>Blind 75 Challenge
                  </h1>
                  <p className="text-sm md:text-base opacity-80 ml-6">
                    &gt; 75 essential coding interview problems
                  </p>
                  <p className="text-xs text-gray-600 ml-6 mt-2">
                    # Click a category to expand problems
                  </p>
                </div>

                {/* Categories List */}
                <div className="flex-1 flex flex-col gap-3">
                  {CATEGORIES.map(category => {
                    const isExpanded = expandedCategories.includes(category);
                    const stats = getCategoryStats(category);
                    const problems = getCategoryProblems(category);

                    return (
                      <div key={category} className="border-l-2 border-[#2a2a2a]">
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full text-left pl-4 py-2 hover:bg-[rgba(74,246,38,0.05)] hover:border-l-2 hover:border-[#4af626] transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[#4af626]">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                              <span className="text-base md:text-lg font-bold">{category}</span>
                            </div>
                            <span className="text-xs text-gray-600">
                              {stats.solved}/{stats.total} solved
                            </span>
                          </div>
                        </button>

                        {/* Expanded Problems List */}
                        {isExpanded && (
                          <div className="ml-6 mt-2 space-y-1">
                            {problems.map(problem => (
                              <div
                                key={problem.id}
                                className="flex items-center gap-3 py-2 px-3 hover:bg-[rgba(74,246,38,0.05)] transition text-sm"
                              >
                                {/* Checkbox */}
                                <button
                                  onClick={() => toggleProblemSolved(problem.id)}
                                  className="flex-shrink-0 w-4 h-4 border border-gray-600 rounded flex items-center justify-center hover:border-[#4af626] transition"
                                >
                                  {problemStates[problem.id] && (
                                    <span className="text-[#4af626] text-xs">✓</span>
                                  )}
                                </button>

                                {/* Problem Title */}
                                <Link
                                  to={`/blind75/problem/${problem.id}`}
                                  className="flex-1 hover:text-[#4af626] transition"
                                >
                                  {problem.title}
                                </Link>

                                {/* Difficulty Badge */}
                                <span className={`text-xs ${getDifficultyColor(problem.difficulty)} font-semibold`}>
                                  {problem.difficulty}
                                </span>

                                {/* LeetCode Link */}
                                <a
                                  href={problem.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-600 hover:text-[#4af626] text-xs transition"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  [LC]
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Power LED */}
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-[#4af626] rounded-full shadow-[0_0_8px_rgba(74,246,38,0.8)] animate-pulse"></div>
        </div>
      </div>

      {/* Monitor Stand (Neck) */}
      <div 
        className="h-20 flex justify-center items-start"
        style={{ background: 'linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 100%)' }}
      >
        <div 
          className="w-16 h-20 rounded-b shadow-md"
          style={{
            background: 'linear-gradient(180deg, #000000 0%, #2a2a2a 20%, #d4d4d4 60%, #a8a8a8 100%)'
          }}
        ></div>
      </div>
    </div>
  );
}

export default Blind75Page;
