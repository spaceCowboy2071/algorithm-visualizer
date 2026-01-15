// problemsData.ts - Centralized data for all Blind 75 problems

export interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  leetcodeUrl: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  constraints: string[];
  starterCode: {
    javascript: string;
    python: string;
  };
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

export const PROBLEMS_DATA: Record<number, Problem> = {
  // ARRAY PROBLEMS
  10: {
    id: 10,
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Array',
    leetcodeUrl: 'https://leetcode.com/problems/two-sum/',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {
    // Write your solution here
    
}`,
      python: `def two_sum(nums, target):
    # Write your solution here
    pass`
    },
    testCases: [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
      { input: '[3,2,4], 6', expectedOutput: '[1,2]' },
      { input: '[3,3], 6', expectedOutput: '[0,1]' }
    ]
  },

  4: {
    id: 4,
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    category: 'Array',
    leetcodeUrl: 'https://leetcode.com/problems/contains-duplicate/',
    description: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.`,
    examples: [
      {
        input: 'nums = [1,2,3,1]',
        output: 'true',
        explanation: 'The element 1 appears at index 0 and 3.'
      },
      {
        input: 'nums = [1,2,3,4]',
        output: 'false',
        explanation: 'All elements are distinct.'
      },
      {
        input: 'nums = [1,1,1,3,3,4,3,2,4,2]',
        output: 'true',
        explanation: 'Multiple elements appear more than once.'
      }
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9'
    ],
    starterCode: {
      javascript: `function containsDuplicate(nums) {
    // Write your solution here
    
}`,
      python: `def contains_duplicate(nums):
    # Write your solution here
    pass`
    },
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: 'true' },
      { input: '[1,2,3,4]', expectedOutput: 'false' },
      { input: '[1,1,1,3,3,4,3,2,4,2]', expectedOutput: 'true' }
    ]
  },

  2: {
    id: 2,
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    category: 'Array',
    leetcodeUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    description: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
    examples: [
      {
        input: 'prices = [7,1,5,3,6,4]',
        output: '5',
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.'
      },
      {
        input: 'prices = [7,6,4,3,1]',
        output: '0',
        explanation: 'In this case, no transactions are done and the max profit = 0.'
      }
    ],
    constraints: [
      '1 <= prices.length <= 10^5',
      '0 <= prices[i] <= 10^4'
    ],
    starterCode: {
      javascript: `function maxProfit(prices) {
    // Write your solution here
    
}`,
      python: `def max_profit(prices):
    # Write your solution here
    pass`
    },
    testCases: [
      { input: '[7,1,5,3,6,4]', expectedOutput: '5' },
      { input: '[7,6,4,3,1]', expectedOutput: '0' }
    ]
  },

  1: {
    id: 1,
    title: '3Sum',
    difficulty: 'Medium',
    category: 'Array',
    leetcodeUrl: 'https://leetcode.com/problems/3sum/',
    description: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

Notice that the solution set must not contain duplicate triplets.`,
    examples: [
      {
        input: 'nums = [-1,0,1,2,-1,-4]',
        output: '[[-1,-1,2],[-1,0,1]]',
        explanation: 'The distinct triplets are [-1,0,1] and [-1,-1,2].'
      },
      {
        input: 'nums = [0,1,1]',
        output: '[]',
        explanation: 'The only possible triplet does not sum up to 0.'
      },
      {
        input: 'nums = [0,0,0]',
        output: '[[0,0,0]]',
        explanation: 'The only possible triplet sums up to 0.'
      }
    ],
    constraints: [
      '3 <= nums.length <= 3000',
      '-10^5 <= nums[i] <= 10^5'
    ],
    starterCode: {
      javascript: `function threeSum(nums) {
    // Write your solution here
    
}`,
      python: `def three_sum(nums):
    # Write your solution here
    pass`
    },
    testCases: [
      { input: '[-1,0,1,2,-1,-4]', expectedOutput: '[[-1,-1,2],[-1,0,1]]' },
      { input: '[0,1,1]', expectedOutput: '[]' },
      { input: '[0,0,0]', expectedOutput: '[[0,0,0]]' }
    ]
  },

  // BINARY PROBLEMS
  11: {
    id: 11,
    title: 'Counting Bits',
    difficulty: 'Easy',
    category: 'Binary',
    leetcodeUrl: 'https://leetcode.com/problems/counting-bits/',
    description: `Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the number of 1's in the binary representation of i.`,
    examples: [
      {
        input: 'n = 2',
        output: '[0,1,1]',
        explanation: '0 --> 0, 1 --> 1, 2 --> 10'
      },
      {
        input: 'n = 5',
        output: '[0,1,1,2,1,2]',
        explanation: '0 --> 0, 1 --> 1, 2 --> 10, 3 --> 11, 4 --> 100, 5 --> 101'
      }
    ],
    constraints: [
      '0 <= n <= 10^5'
    ],
    starterCode: {
      javascript: `function countBits(n) {
    // Write your solution here
    
}`,
      python: `def count_bits(n):
    # Write your solution here
    pass`
    },
    testCases: [
      { input: '2', expectedOutput: '[0,1,1]' },
      { input: '5', expectedOutput: '[0,1,1,2,1,2]' }
    ]
  },

  13: {
    id: 13,
    title: 'Number of 1 Bits',
    difficulty: 'Easy',
    category: 'Binary',
    leetcodeUrl: 'https://leetcode.com/problems/number-of-1-bits/',
    description: `Write a function that takes an unsigned integer and returns the number of '1' bits it has (also known as the Hamming weight).`,
    examples: [
      {
        input: 'n = 11',
        output: '3',
        explanation: 'The input binary string 1011 has a total of three set bits.'
      },
      {
        input: 'n = 128',
        output: '1',
        explanation: 'The input binary string 10000000 has a total of one set bit.'
      }
    ],
    constraints: [
      '1 <= n <= 2^31 - 1'
    ],
    starterCode: {
      javascript: `function hammingWeight(n) {
    // Write your solution here
    
}`,
      python: `def hamming_weight(n):
    # Write your solution here
    pass`
    },
    testCases: [
      { input: '11', expectedOutput: '3' },
      { input: '128', expectedOutput: '1' }
    ]
  },

  // DYNAMIC PROGRAMMING PROBLEMS
  16: {
    id: 16,
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    category: 'Dynamic Programming',
    leetcodeUrl: 'https://leetcode.com/problems/climbing-stairs/',
    description: `You are climbing a staircase. It takes n steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    examples: [
      {
        input: 'n = 2',
        output: '2',
        explanation: 'There are two ways to climb to the top: 1. 1 step + 1 step, 2. 2 steps'
      },
      {
        input: 'n = 3',
        output: '3',
        explanation: 'There are three ways: 1. 1+1+1, 2. 1+2, 3. 2+1'
      }
    ],
    constraints: [
      '1 <= n <= 45'
    ],
    starterCode: {
      javascript: `function climbStairs(n) {
    // Write your solution here
    
}`,
      python: `def climb_stairs(n):
    # Write your solution here
    pass`
    },
    testCases: [
      { input: '2', expectedOutput: '2' },
      { input: '3', expectedOutput: '3' }
    ]
  },

  // LINKED LIST PROBLEMS
  49: {
    id: 49,
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    category: 'Linked List',
    leetcodeUrl: 'https://leetcode.com/problems/reverse-linked-list/',
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
    examples: [
      {
        input: 'head = [1,2,3,4,5]',
        output: '[5,4,3,2,1]',
        explanation: 'The list is reversed.'
      },
      {
        input: 'head = [1,2]',
        output: '[2,1]',
        explanation: 'The list is reversed.'
      },
      {
        input: 'head = []',
        output: '[]',
        explanation: 'Empty list remains empty.'
      }
    ],
    constraints: [
      'The number of nodes in the list is in the range [0, 5000]',
      '-5000 <= Node.val <= 5000'
    ],
    starterCode: {
      javascript: `function reverseList(head) {
    // Write your solution here
    
}`,
      python: `def reverse_list(head):
    # Write your solution here
    pass`
    },
    testCases: [
      { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' },
      { input: '[1,2]', expectedOutput: '[2,1]' },
      { input: '[]', expectedOutput: '[]' }
    ]
  },

  // STRING PROBLEMS
  59: {
    id: 59,
    title: 'Valid Anagram',
    difficulty: 'Easy',
    category: 'String',
    leetcodeUrl: 'https://leetcode.com/problems/valid-anagram/',
    description: `Given two strings s and t, return true if t is an anagram of s, and false otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      {
        input: 's = "anagram", t = "nagaram"',
        output: 'true',
        explanation: 'Both strings contain the same characters with the same frequencies.'
      },
      {
        input: 's = "rat", t = "car"',
        output: 'false',
        explanation: 'The strings do not contain the same characters.'
      }
    ],
    constraints: [
      '1 <= s.length, t.length <= 5 * 10^4',
      's and t consist of lowercase English letters'
    ],
    starterCode: {
      javascript: `function isAnagram(s, t) {
    // Write your solution here
    
}`,
      python: `def is_anagram(s, t):
    # Write your solution here
    pass`
    },
    testCases: [
      { input: '"anagram", "nagaram"', expectedOutput: 'true' },
      { input: '"rat", "car"', expectedOutput: 'false' }
    ]
  },

  61: {
    id: 61,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'String',
    leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses/',
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: 'Valid parentheses.'
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: 'Valid combination of all bracket types.'
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: 'Mismatched bracket types.'
      }
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\'.'
    ],
    starterCode: {
      javascript: `function isValid(s) {
    // Write your solution here
    
}`,
      python: `def is_valid(s):
    # Write your solution here
    pass`
    },
    testCases: [
      { input: '"()"', expectedOutput: 'true' },
      { input: '"()[]{}"', expectedOutput: 'true' },
      { input: '"(]"', expectedOutput: 'false' }
    ]
  },

  // TREE PROBLEMS
  72: {
    id: 72,
    title: 'Maximum Depth of Binary Tree',
    difficulty: 'Easy',
    category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
    description: `Given the root of a binary tree, return its maximum depth.

A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.`,
    examples: [
      {
        input: 'root = [3,9,20,null,null,15,7]',
        output: '3',
        explanation: 'The maximum depth is 3 (path: 3 -> 20 -> 15 or 7).'
      },
      {
        input: 'root = [1,null,2]',
        output: '2',
        explanation: 'The maximum depth is 2 (path: 1 -> 2).'
      }
    ],
    constraints: [
      'The number of nodes in the tree is in the range [0, 10^4]',
      '-100 <= Node.val <= 100'
    ],
    starterCode: {
      javascript: `function maxDepth(root) {
    // Write your solution here
    
}`,
      python: `def max_depth(root):
    # Write your solution here
    pass`
    },
    testCases: [
      { input: '[3,9,20,null,null,15,7]', expectedOutput: '3' },
      { input: '[1,null,2]', expectedOutput: '2' }
    ]
  }
};

// Helper function to get problem by ID
export function getProblemById(id: number): Problem | null {
  return PROBLEMS_DATA[id] || null;
}

// Get all problem IDs
export function getAllProblemIds(): number[] {
  return Object.keys(PROBLEMS_DATA).map(Number);
}
