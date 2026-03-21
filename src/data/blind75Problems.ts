export interface Blind75Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
  category: string;
  pattern: string;
}

export const PROBLEMS: Blind75Problem[] = [
  // Arrays
  { id: 1, title: '3Sum', difficulty: 'Medium', url: 'https://leetcode.com/problems/3sum/', category: 'Arrays', pattern: 'Two Pointers' },
  { id: 2, title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', category: 'Arrays', pattern: 'Sliding Window' },
  { id: 3, title: 'Container With Most Water', difficulty: 'Medium', url: 'https://leetcode.com/problems/container-with-most-water/', category: 'Arrays', pattern: 'Two Pointers' },
  { id: 4, title: 'Contains Duplicate', difficulty: 'Easy', url: 'https://leetcode.com/problems/contains-duplicate/', category: 'Arrays', pattern: 'Hash Set' },
  { id: 5, title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', category: 'Arrays', pattern: 'Binary Search' },
  { id: 6, title: 'Maximum Product Subarray', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-product-subarray/', category: 'Arrays', pattern: 'Dynamic Programming' },
  { id: 7, title: 'Maximum Subarray', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-subarray/', category: 'Arrays', pattern: "Kadane's / DP" },
  { id: 8, title: 'Product of Array Except Self', difficulty: 'Medium', url: 'https://leetcode.com/problems/product-of-array-except-self/', category: 'Arrays', pattern: 'Prefix / Suffix' },
  { id: 9, title: 'Search in Rotated Sorted Array', difficulty: 'Medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', category: 'Arrays', pattern: 'Binary Search' },
  { id: 10, title: 'Two Sum', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/', category: 'Arrays', pattern: 'Hash Map' },

  // Binary
  { id: 11, title: 'Counting Bits', difficulty: 'Easy', url: 'https://leetcode.com/problems/counting-bits/', category: 'Binary', pattern: 'Bit Manipulation / DP' },
  { id: 12, title: 'Missing Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/missing-number/', category: 'Binary', pattern: 'Bit Manipulation' },
  { id: 13, title: 'Number of 1 Bits', difficulty: 'Easy', url: 'https://leetcode.com/problems/number-of-1-bits/', category: 'Binary', pattern: 'Bit Manipulation' },
  { id: 14, title: 'Reverse Bits', difficulty: 'Easy', url: 'https://leetcode.com/problems/reverse-bits/', category: 'Binary', pattern: 'Bit Manipulation' },
  { id: 15, title: 'Sum of Two Integers', difficulty: 'Medium', url: 'https://leetcode.com/problems/sum-of-two-integers/', category: 'Binary', pattern: 'Bit Manipulation' },

  // Dynamic Programming
  { id: 16, title: 'Climbing Stairs', difficulty: 'Easy', url: 'https://leetcode.com/problems/climbing-stairs/', category: 'Dynamic Programming', pattern: 'DP / Fibonacci' },
  { id: 17, title: 'Coin Change', difficulty: 'Medium', url: 'https://leetcode.com/problems/coin-change/', category: 'Dynamic Programming', pattern: 'DP / Unbounded Knapsack' },
  { id: 18, title: 'Combination Sum', difficulty: 'Medium', url: 'https://leetcode.com/problems/combination-sum/', category: 'Dynamic Programming', pattern: 'Backtracking' },
  { id: 19, title: 'Decode Ways', difficulty: 'Medium', url: 'https://leetcode.com/problems/decode-ways/', category: 'Dynamic Programming', pattern: 'DP / Fibonacci' },
  { id: 20, title: 'House Robber', difficulty: 'Medium', url: 'https://leetcode.com/problems/house-robber/', category: 'Dynamic Programming', pattern: 'DP' },
  { id: 21, title: 'House Robber II', difficulty: 'Medium', url: 'https://leetcode.com/problems/house-robber-ii/', category: 'Dynamic Programming', pattern: 'DP' },
  { id: 22, title: 'Jump Game', difficulty: 'Medium', url: 'https://leetcode.com/problems/jump-game/', category: 'Dynamic Programming', pattern: 'Greedy' },
  { id: 23, title: 'Longest Common Subsequence', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-common-subsequence/', category: 'Dynamic Programming', pattern: '2D DP' },
  { id: 24, title: 'Longest Increasing Subsequence', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-increasing-subsequence/', category: 'Dynamic Programming', pattern: 'DP / Binary Search' },
  { id: 25, title: 'Unique Paths', difficulty: 'Medium', url: 'https://leetcode.com/problems/unique-paths/', category: 'Dynamic Programming', pattern: '2D DP' },
  { id: 26, title: 'Word Break', difficulty: 'Medium', url: 'https://leetcode.com/problems/word-break/', category: 'Dynamic Programming', pattern: 'DP / Trie' },

  // Graphs
  { id: 27, title: 'Alien Dictionary (Premium)', difficulty: 'Hard', url: 'https://leetcode.com/problems/alien-dictionary/', category: 'Graphs', pattern: 'Topological Sort' },
  { id: 28, title: 'Clone Graph', difficulty: 'Medium', url: 'https://leetcode.com/problems/clone-graph/', category: 'Graphs', pattern: 'DFS / BFS' },
  { id: 29, title: 'Course Schedule', difficulty: 'Medium', url: 'https://leetcode.com/problems/course-schedule/', category: 'Graphs', pattern: 'Topological Sort' },
  { id: 30, title: 'Graph Valid Tree (Premium)', difficulty: 'Medium', url: 'https://leetcode.com/problems/graph-valid-tree/', category: 'Graphs', pattern: 'Union Find / DFS' },
  { id: 31, title: 'Longest Consecutive Sequence', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-consecutive-sequence/', category: 'Graphs', pattern: 'Hash Set' },
  { id: 32, title: 'Number of Connected Components in an Undirected Graph (Premium)', difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', category: 'Graphs', pattern: 'Union Find / DFS' },
  { id: 33, title: 'Number of Islands', difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-islands/', category: 'Graphs', pattern: 'BFS / DFS Grid' },
  { id: 34, title: 'Pacific Atlantic Water Flow', difficulty: 'Medium', url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', category: 'Graphs', pattern: 'DFS / BFS' },

  // Heaps
  { id: 35, title: 'Find Median from Data Stream', difficulty: 'Hard', url: 'https://leetcode.com/problems/find-median-from-data-stream/', category: 'Heaps', pattern: 'Two Heaps' },
  { id: 36, title: 'Top K Frequent Elements', difficulty: 'Medium', url: 'https://leetcode.com/problems/top-k-frequent-elements/', category: 'Heaps', pattern: 'Bucket Sort / Heap' },

  // Intervals
  { id: 37, title: 'Insert Interval', difficulty: 'Medium', url: 'https://leetcode.com/problems/insert-interval/', category: 'Intervals', pattern: 'Intervals' },
  { id: 38, title: 'Meeting Rooms (Premium)', difficulty: 'Easy', url: 'https://leetcode.com/problems/meeting-rooms/', category: 'Intervals', pattern: 'Sorting' },
  { id: 39, title: 'Meeting Rooms II (Premium)', difficulty: 'Medium', url: 'https://leetcode.com/problems/meeting-rooms-ii/', category: 'Intervals', pattern: 'Heap / Sweep Line' },
  { id: 40, title: 'Merge Intervals', difficulty: 'Medium', url: 'https://leetcode.com/problems/merge-intervals/', category: 'Intervals', pattern: 'Intervals' },
  { id: 41, title: 'Non-overlapping Intervals', difficulty: 'Medium', url: 'https://leetcode.com/problems/non-overlapping-intervals/', category: 'Intervals', pattern: 'Greedy / Intervals' },

  // Linked Lists
  { id: 42, title: 'Detect Cycle in a Linked List', difficulty: 'Easy', url: 'https://leetcode.com/problems/linked-list-cycle/', category: 'Linked Lists', pattern: 'Fast & Slow Pointers' },
  { id: 43, title: 'Merge K Sorted Lists', difficulty: 'Hard', url: 'https://leetcode.com/problems/merge-k-sorted-lists/', category: 'Linked Lists', pattern: 'Heap / Divide & Conquer' },
  { id: 44, title: 'Merge Two Sorted Lists', difficulty: 'Easy', url: 'https://leetcode.com/problems/merge-two-sorted-lists/', category: 'Linked Lists', pattern: 'Two Pointers' },
  { id: 45, title: 'Remove Nth Node From End Of List', difficulty: 'Medium', url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', category: 'Linked Lists', pattern: 'Two Pointers' },
  { id: 46, title: 'Reorder List', difficulty: 'Medium', url: 'https://leetcode.com/problems/reorder-list/', category: 'Linked Lists', pattern: 'Fast & Slow Pointers' },
  { id: 47, title: 'Reverse a Linked List', difficulty: 'Easy', url: 'https://leetcode.com/problems/reverse-linked-list/', category: 'Linked Lists', pattern: 'In-Place Reversal' },

  // Matrix
  { id: 48, title: 'Rotate Image', difficulty: 'Medium', url: 'https://leetcode.com/problems/rotate-image/', category: 'Matrix', pattern: 'Matrix Manipulation' },
  { id: 49, title: 'Set Matrix Zeroes', difficulty: 'Medium', url: 'https://leetcode.com/problems/set-matrix-zeroes/', category: 'Matrix', pattern: 'Matrix Manipulation' },
  { id: 50, title: 'Spiral Matrix', difficulty: 'Medium', url: 'https://leetcode.com/problems/spiral-matrix/', category: 'Matrix', pattern: 'Matrix Traversal' },
  { id: 51, title: 'Word Search', difficulty: 'Medium', url: 'https://leetcode.com/problems/word-search/', category: 'Matrix', pattern: 'Backtracking / DFS' },

  // Strings
  { id: 52, title: 'Encode and Decode Strings (Premium)', difficulty: 'Medium', url: 'https://leetcode.com/problems/encode-and-decode-strings/', category: 'Strings', pattern: 'String Encoding' },
  { id: 53, title: 'Group Anagrams', difficulty: 'Medium', url: 'https://leetcode.com/problems/group-anagrams/', category: 'Strings', pattern: 'Hash Map / Sorting' },
  { id: 54, title: 'Longest Palindromic Substring', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-palindromic-substring/', category: 'Strings', pattern: 'Expand Around Center' },
  { id: 55, title: 'Longest Repeating Character Replacement', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-repeating-character-replacement/', category: 'Strings', pattern: 'Sliding Window' },
  { id: 56, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', category: 'Strings', pattern: 'Sliding Window' },
  { id: 57, title: 'Minimum Window Substring', difficulty: 'Hard', url: 'https://leetcode.com/problems/minimum-window-substring/', category: 'Strings', pattern: 'Sliding Window' },
  { id: 58, title: 'Palindromic Substrings', difficulty: 'Medium', url: 'https://leetcode.com/problems/palindromic-substrings/', category: 'Strings', pattern: 'Expand Around Center / DP' },
  { id: 59, title: 'Valid Anagram', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-anagram/', category: 'Strings', pattern: 'Hash Map' },
  { id: 60, title: 'Valid Palindrome', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-palindrome/', category: 'Strings', pattern: 'Two Pointers' },
  { id: 61, title: 'Valid Parentheses', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-parentheses/', category: 'Strings', pattern: 'Stack' },

  // Trees
  { id: 62, title: 'Add and Search Word', difficulty: 'Medium', url: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', category: 'Trees', pattern: 'Trie / DFS' },
  { id: 63, title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', category: 'Trees', pattern: 'BFS' },
  { id: 64, title: 'Binary Tree Maximum Path Sum', difficulty: 'Hard', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', category: 'Trees', pattern: 'DFS / Recursion' },
  { id: 65, title: 'Construct Binary Tree from Preorder and Inorder Traversal', difficulty: 'Medium', url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', category: 'Trees', pattern: 'Recursion / Hash Map' },
  { id: 66, title: 'Implement Trie (Prefix Tree)', difficulty: 'Medium', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/', category: 'Trees', pattern: 'Trie' },
  { id: 67, title: 'Invert/Flip Binary Tree', difficulty: 'Easy', url: 'https://leetcode.com/problems/invert-binary-tree/', category: 'Trees', pattern: 'DFS / BFS' },
  { id: 68, title: 'Kth Smallest Element in a BST', difficulty: 'Medium', url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', category: 'Trees', pattern: 'Inorder Traversal' },
  { id: 69, title: 'Lowest Common Ancestor of BST', difficulty: 'Easy', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', category: 'Trees', pattern: 'BST Property' },
  { id: 70, title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', category: 'Trees', pattern: 'DFS / BFS' },
  { id: 71, title: 'Same Tree', difficulty: 'Easy', url: 'https://leetcode.com/problems/same-tree/', category: 'Trees', pattern: 'DFS' },
  { id: 72, title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', category: 'Trees', pattern: 'BFS / DFS' },
  { id: 73, title: 'Subtree of Another Tree', difficulty: 'Easy', url: 'https://leetcode.com/problems/subtree-of-another-tree/', category: 'Trees', pattern: 'DFS' },
  { id: 74, title: 'Validate Binary Search Tree', difficulty: 'Medium', url: 'https://leetcode.com/problems/validate-binary-search-tree/', category: 'Trees', pattern: 'DFS / Inorder' },
  { id: 75, title: 'Word Search II', difficulty: 'Hard', url: 'https://leetcode.com/problems/word-search-ii/', category: 'Trees', pattern: 'Trie / Backtracking' },
];

export const CATEGORIES = [
  'Arrays',
  'Binary',
  'Dynamic Programming',
  'Graphs',
  'Intervals',
  'Linked Lists',
  'Matrix',
  'Strings',
  'Trees',
  'Heaps',
];
