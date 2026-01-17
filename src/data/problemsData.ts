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
  // ARRAY PROBLEMS (1-10)
  1: {
    id: 1,
    title: '3Sum',
    difficulty: 'Medium',
    category: 'Array',
    leetcodeUrl: 'https://leetcode.com/problems/3sum/',
    description: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

Notice that the solution set must not contain duplicate triplets.`,
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]', explanation: 'The distinct triplets are [-1,0,1] and [-1,-1,2].' },
      { input: 'nums = [0,1,1]', output: '[]', explanation: 'The only possible triplet does not sum up to 0.' },
      { input: 'nums = [0,0,0]', output: '[[0,0,0]]', explanation: 'The only possible triplet sums up to 0.' }
    ],
    constraints: ['3 <= nums.length <= 3000', '-10^5 <= nums[i] <= 10^5'],
    starterCode: {
      javascript: `function threeSum(nums) {\n    // Write your solution here\n    \n}`,
      python: `def three_sum(nums):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '[-1,0,1,2,-1,-4]', expectedOutput: '[[-1,-1,2],[-1,0,1]]' },
      { input: '[0,1,1]', expectedOutput: '[]' },
      { input: '[0,0,0]', expectedOutput: '[[0,0,0]]' }
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
      { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' },
      { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'In this case, no transactions are done and the max profit = 0.' }
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    starterCode: {
      javascript: `function maxProfit(prices) {\n    // Write your solution here\n    \n}`,
      python: `def max_profit(prices):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '[7,1,5,3,6,4]', expectedOutput: '5' },
      { input: '[7,6,4,3,1]', expectedOutput: '0' }
    ]
  },

  3: {
    id: 3,
    title: 'Container With Most Water',
    difficulty: 'Medium',
    category: 'Array',
    leetcodeUrl: 'https://leetcode.com/problems/container-with-most-water/',
    description: `You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.`,
    examples: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'The max area is between index 1 and 8 with height min(8,7)=7 and width=7.' },
      { input: 'height = [1,1]', output: '1', explanation: 'The max area is 1.' }
    ],
    constraints: ['n == height.length', '2 <= n <= 10^5', '0 <= height[i] <= 10^4'],
    starterCode: {
      javascript: `function maxArea(height) {\n    // Write your solution here\n    \n}`,
      python: `def max_area(height):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '[1,8,6,2,5,4,8,3,7]', expectedOutput: '49' },
      { input: '[1,1]', expectedOutput: '1' }
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
      { input: 'nums = [1,2,3,1]', output: 'true', explanation: 'The element 1 appears at index 0 and 3.' },
      { input: 'nums = [1,2,3,4]', output: 'false', explanation: 'All elements are distinct.' },
      { input: 'nums = [1,1,1,3,3,4,3,2,4,2]', output: 'true', explanation: 'Multiple elements appear more than once.' }
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    starterCode: {
      javascript: `function containsDuplicate(nums) {\n    // Write your solution here\n    \n}`,
      python: `def contains_duplicate(nums):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: 'true' },
      { input: '[1,2,3,4]', expectedOutput: 'false' }
    ]
  },

  5: {
    id: 5,
    title: 'Find Minimum in Rotated Sorted Array',
    difficulty: 'Medium',
    category: 'Array',
    leetcodeUrl: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
    description: `Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Given the sorted rotated array nums of unique elements, return the minimum element of this array.

You must write an algorithm that runs in O(log n) time.`,
    examples: [
      { input: 'nums = [3,4,5,1,2]', output: '1', explanation: 'The original array was [1,2,3,4,5] rotated 3 times.' },
      { input: 'nums = [4,5,6,7,0,1,2]', output: '0', explanation: 'The original array was [0,1,2,4,5,6,7] rotated 4 times.' }
    ],
    constraints: ['n == nums.length', '1 <= n <= 5000', '-5000 <= nums[i] <= 5000'],
    starterCode: {
      javascript: `function findMin(nums) {\n    // Write your solution here\n    \n}`,
      python: `def find_min(nums):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '[3,4,5,1,2]', expectedOutput: '1' },
      { input: '[4,5,6,7,0,1,2]', expectedOutput: '0' }
    ]
  },

  6: {
    id: 6,
    title: 'Maximum Product Subarray',
    difficulty: 'Medium',
    category: 'Array',
    leetcodeUrl: 'https://leetcode.com/problems/maximum-product-subarray/',
    description: `Given an integer array nums, find a subarray that has the largest product, and return the product.`,
    examples: [
      { input: 'nums = [2,3,-2,4]', output: '6', explanation: '[2,3] has the largest product 6.' },
      { input: 'nums = [-2,0,-1]', output: '0', explanation: 'The result cannot be 2, because [-2,-1] is not a subarray.' }
    ],
    constraints: ['1 <= nums.length <= 2 * 10^4', '-10 <= nums[i] <= 10'],
    starterCode: {
      javascript: `function maxProduct(nums) {\n    // Write your solution here\n    \n}`,
      python: `def max_product(nums):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '[2,3,-2,4]', expectedOutput: '6' },
      { input: '[-2,0,-1]', expectedOutput: '0' }
    ]
  },

  7: {
    id: 7,
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    category: 'Array',
    leetcodeUrl: 'https://leetcode.com/problems/maximum-subarray/',
    description: `Given an integer array nums, find the subarray with the largest sum, and return its sum.`,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', output: '1', explanation: 'The subarray [1] has the largest sum 1.' }
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    starterCode: {
      javascript: `function maxSubArray(nums) {\n    // Write your solution here\n    \n}`,
      python: `def max_sub_array(nums):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
      { input: '[1]', expectedOutput: '1' }
    ]
  },

  8: {
    id: 8,
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    category: 'Array',
    leetcodeUrl: 'https://leetcode.com/problems/product-of-array-except-self/',
    description: `Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].

You must write an algorithm that runs in O(n) time and without using the division operation.`,
    examples: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]', explanation: 'Product of all elements except self.' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]', explanation: 'Product of all elements except self.' }
    ],
    constraints: ['2 <= nums.length <= 10^5', '-30 <= nums[i] <= 30'],
    starterCode: {
      javascript: `function productExceptSelf(nums) {\n    // Write your solution here\n    \n}`,
      python: `def product_except_self(nums):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]' },
      { input: '[-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]' }
    ]
  },

  9: {
    id: 9,
    title: 'Search in Rotated Sorted Array',
    difficulty: 'Medium',
    category: 'Array',
    leetcodeUrl: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
    description: `Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.

You must write an algorithm with O(log n) runtime complexity.`,
    examples: [
      { input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4', explanation: '0 is at index 4.' },
      { input: 'nums = [4,5,6,7,0,1,2], target = 3', output: '-1', explanation: '3 is not in the array.' }
    ],
    constraints: ['1 <= nums.length <= 5000', '-10^4 <= nums[i] <= 10^4'],
    starterCode: {
      javascript: `function search(nums, target) {\n    // Write your solution here\n    \n}`,
      python: `def search(nums, target):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '[4,5,6,7,0,1,2], 0', expectedOutput: '4' },
      { input: '[4,5,6,7,0,1,2], 3', expectedOutput: '-1' }
    ]
  },

  10: {
    id: 10,
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Array',
    leetcodeUrl: 'https://leetcode.com/problems/two-sum/',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n    // Write your solution here\n    \n}`,
      python: `def two_sum(nums, target):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
      { input: '[3,2,4], 6', expectedOutput: '[1,2]' }
    ]
  },

  // BINARY PROBLEMS (11-15)
  11: {
    id: 11,
    title: 'Counting Bits',
    difficulty: 'Easy',
    category: 'Binary',
    leetcodeUrl: 'https://leetcode.com/problems/counting-bits/',
    description: `Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the number of 1's in the binary representation of i.`,
    examples: [
      { input: 'n = 2', output: '[0,1,1]', explanation: '0 --> 0, 1 --> 1, 2 --> 10' },
      { input: 'n = 5', output: '[0,1,1,2,1,2]', explanation: '0 --> 0, 1 --> 1, 2 --> 10, 3 --> 11, 4 --> 100, 5 --> 101' }
    ],
    constraints: ['0 <= n <= 10^5'],
    starterCode: {
      javascript: `function countBits(n) {\n    // Write your solution here\n    \n}`,
      python: `def count_bits(n):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '2', expectedOutput: '[0,1,1]' },
      { input: '5', expectedOutput: '[0,1,1,2,1,2]' }
    ]
  },

  12: {
    id: 12,
    title: 'Missing Number',
    difficulty: 'Easy',
    category: 'Binary',
    leetcodeUrl: 'https://leetcode.com/problems/missing-number/',
    description: `Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.`,
    examples: [
      { input: 'nums = [3,0,1]', output: '2', explanation: 'n = 3 since there are 3 numbers, so all numbers are in the range [0,3]. 2 is missing.' },
      { input: 'nums = [0,1]', output: '2', explanation: 'n = 2 since there are 2 numbers, so all numbers are in the range [0,2]. 2 is missing.' }
    ],
    constraints: ['n == nums.length', '1 <= n <= 10^4', '0 <= nums[i] <= n'],
    starterCode: {
      javascript: `function missingNumber(nums) {\n    // Write your solution here\n    \n}`,
      python: `def missing_number(nums):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '[3,0,1]', expectedOutput: '2' },
      { input: '[0,1]', expectedOutput: '2' }
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
      { input: 'n = 11', output: '3', explanation: 'The input binary string 1011 has a total of three set bits.' },
      { input: 'n = 128', output: '1', explanation: 'The input binary string 10000000 has a total of one set bit.' }
    ],
    constraints: ['1 <= n <= 2^31 - 1'],
    starterCode: {
      javascript: `function hammingWeight(n) {\n    // Write your solution here\n    \n}`,
      python: `def hamming_weight(n):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '11', expectedOutput: '3' },
      { input: '128', expectedOutput: '1' }
    ]
  },

  14: {
    id: 14,
    title: 'Reverse Bits',
    difficulty: 'Easy',
    category: 'Binary',
    leetcodeUrl: 'https://leetcode.com/problems/reverse-bits/',
    description: `Reverse bits of a given 32 bits unsigned integer.`,
    examples: [
      { input: 'n = 43261596', output: '964176192', explanation: 'The input binary is 00000010100101000001111010011100, reversed is 00111001011110000010100101000000.' },
      { input: 'n = 4294967293', output: '3221225471', explanation: 'The input binary is 11111111111111111111111111111101, reversed is 10111111111111111111111111111111.' }
    ],
    constraints: ['The input must be a binary string of length 32'],
    starterCode: {
      javascript: `function reverseBits(n) {\n    // Write your solution here\n    \n}`,
      python: `def reverse_bits(n):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '43261596', expectedOutput: '964176192' },
      { input: '4294967293', expectedOutput: '3221225471' }
    ]
  },

  15: {
    id: 15,
    title: 'Sum of Two Integers',
    difficulty: 'Medium',
    category: 'Binary',
    leetcodeUrl: 'https://leetcode.com/problems/sum-of-two-integers/',
    description: `Given two integers a and b, return the sum of the two integers without using the operators + and -.`,
    examples: [
      { input: 'a = 1, b = 2', output: '3', explanation: '1 + 2 = 3' },
      { input: 'a = 2, b = 3', output: '5', explanation: '2 + 3 = 5' }
    ],
    constraints: ['-1000 <= a, b <= 1000'],
    starterCode: {
      javascript: `function getSum(a, b) {\n    // Write your solution here\n    \n}`,
      python: `def get_sum(a, b):\n    # Write your solution here\n    pass`
    },
    testCases: [
      { input: '1, 2', expectedOutput: '3' },
      { input: '2, 3', expectedOutput: '5' }
    ]
  },

  // DYNAMIC PROGRAMMING (16-26)
  16: {
    id: 16, title: 'Climbing Stairs', difficulty: 'Easy', category: 'Dynamic Programming',
    leetcodeUrl: 'https://leetcode.com/problems/climbing-stairs/',
    description: `You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { input: 'n = 2', output: '2', explanation: 'Two ways: 1+1 or 2.' },
      { input: 'n = 3', output: '3', explanation: 'Three ways: 1+1+1, 1+2, 2+1.' }
    ],
    constraints: ['1 <= n <= 45'],
    starterCode: { javascript: `function climbStairs(n) {\n    // Write your solution here\n}`, python: `def climb_stairs(n):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '2', expectedOutput: '2' }, { input: '3', expectedOutput: '3' }]
  },

  17: {
    id: 17, title: 'Coin Change', difficulty: 'Medium', category: 'Dynamic Programming',
    leetcodeUrl: 'https://leetcode.com/problems/coin-change/',
    description: `Given an array of coin denominations and a total amount, return the fewest number of coins needed to make up that amount. Return -1 if impossible.`,
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' },
      { input: 'coins = [2], amount = 3', output: '-1', explanation: 'Not possible.' }
    ],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    starterCode: { javascript: `function coinChange(coins, amount) {\n    // Write your solution here\n}`, python: `def coin_change(coins, amount):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[1,2,5], 11', expectedOutput: '3' }, { input: '[2], 3', expectedOutput: '-1' }]
  },

  18: {
    id: 18, title: 'Combination Sum', difficulty: 'Medium', category: 'Dynamic Programming',
    leetcodeUrl: 'https://leetcode.com/problems/combination-sum/',
    description: `Given an array of distinct integers candidates and a target integer target, return a list of all unique combinations of candidates where the chosen numbers sum to target.`,
    examples: [
      { input: 'candidates = [2,3,6,7], target = 7', output: '[[2,2,3],[7]]', explanation: '2+2+3=7 and 7=7.' }
    ],
    constraints: ['1 <= candidates.length <= 30', '2 <= candidates[i] <= 40', '1 <= target <= 40'],
    starterCode: { javascript: `function combinationSum(candidates, target) {\n    // Write your solution here\n}`, python: `def combination_sum(candidates, target):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[2,3,6,7], 7', expectedOutput: '[[2,2,3],[7]]' }]
  },

  19: {
    id: 19, title: 'Decode Ways', difficulty: 'Medium', category: 'Dynamic Programming',
    leetcodeUrl: 'https://leetcode.com/problems/decode-ways/',
    description: `A message containing letters A-Z can be encoded into numbers 1-26. Given a string s containing only digits, return the number of ways to decode it.`,
    examples: [
      { input: 's = "12"', output: '2', explanation: '"AB" (1 2) or "L" (12).' },
      { input: 's = "226"', output: '3', explanation: '"BZ", "VF", or "BBF".' }
    ],
    constraints: ['1 <= s.length <= 100', 's contains only digits'],
    starterCode: { javascript: `function numDecodings(s) {\n    // Write your solution here\n}`, python: `def num_decodings(s):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '"12"', expectedOutput: '2' }, { input: '"226"', expectedOutput: '3' }]
  },

  20: {
    id: 20, title: 'House Robber', difficulty: 'Medium', category: 'Dynamic Programming',
    leetcodeUrl: 'https://leetcode.com/problems/house-robber/',
    description: `Given an array representing money in each house, return the maximum amount you can rob without robbing two adjacent houses.`,
    examples: [
      { input: 'nums = [1,2,3,1]', output: '4', explanation: 'Rob house 1 and 3: 1 + 3 = 4.' },
      { input: 'nums = [2,7,9,3,1]', output: '12', explanation: 'Rob house 1, 3, 5: 2 + 9 + 1 = 12.' }
    ],
    constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 400'],
    starterCode: { javascript: `function rob(nums) {\n    // Write your solution here\n}`, python: `def rob(nums):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[1,2,3,1]', expectedOutput: '4' }, { input: '[2,7,9,3,1]', expectedOutput: '12' }]
  },

  21: {
    id: 21, title: 'House Robber II', difficulty: 'Medium', category: 'Dynamic Programming',
    leetcodeUrl: 'https://leetcode.com/problems/house-robber-ii/',
    description: `Houses are arranged in a circle. Return the maximum amount you can rob without robbing two adjacent houses.`,
    examples: [
      { input: 'nums = [2,3,2]', output: '3', explanation: 'Cannot rob house 1 and 3 (adjacent in circle).' },
      { input: 'nums = [1,2,3,1]', output: '4', explanation: 'Rob house 1 and 3.' }
    ],
    constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 1000'],
    starterCode: { javascript: `function rob(nums) {\n    // Write your solution here\n}`, python: `def rob(nums):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[2,3,2]', expectedOutput: '3' }, { input: '[1,2,3,1]', expectedOutput: '4' }]
  },

  22: {
    id: 22, title: 'Jump Game', difficulty: 'Medium', category: 'Dynamic Programming',
    leetcodeUrl: 'https://leetcode.com/problems/jump-game/',
    description: `Given an array where each element represents max jump length from that position, determine if you can reach the last index.`,
    examples: [
      { input: 'nums = [2,3,1,1,4]', output: 'true', explanation: 'Jump 1->2->last.' },
      { input: 'nums = [3,2,1,0,4]', output: 'false', explanation: 'Always stuck at index 3.' }
    ],
    constraints: ['1 <= nums.length <= 10^4', '0 <= nums[i] <= 10^5'],
    starterCode: { javascript: `function canJump(nums) {\n    // Write your solution here\n}`, python: `def can_jump(nums):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[2,3,1,1,4]', expectedOutput: 'true' }, { input: '[3,2,1,0,4]', expectedOutput: 'false' }]
  },

  23: {
    id: 23, title: 'Longest Common Subsequence', difficulty: 'Medium', category: 'Dynamic Programming',
    leetcodeUrl: 'https://leetcode.com/problems/longest-common-subsequence/',
    description: `Given two strings text1 and text2, return the length of their longest common subsequence.`,
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: 'LCS is "ace".' },
      { input: 'text1 = "abc", text2 = "def"', output: '0', explanation: 'No common subsequence.' }
    ],
    constraints: ['1 <= text1.length, text2.length <= 1000'],
    starterCode: { javascript: `function longestCommonSubsequence(text1, text2) {\n    // Write your solution here\n}`, python: `def longest_common_subsequence(text1, text2):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '"abcde", "ace"', expectedOutput: '3' }, { input: '"abc", "def"', expectedOutput: '0' }]
  },

  24: {
    id: 24, title: 'Longest Increasing Subsequence', difficulty: 'Medium', category: 'Dynamic Programming',
    leetcodeUrl: 'https://leetcode.com/problems/longest-increasing-subsequence/',
    description: `Given an integer array nums, return the length of the longest strictly increasing subsequence.`,
    examples: [
      { input: 'nums = [10,9,2,5,3,7,101,18]', output: '4', explanation: 'LIS is [2,3,7,101].' },
      { input: 'nums = [0,1,0,3,2,3]', output: '4', explanation: 'LIS is [0,1,2,3].' }
    ],
    constraints: ['1 <= nums.length <= 2500', '-10^4 <= nums[i] <= 10^4'],
    starterCode: { javascript: `function lengthOfLIS(nums) {\n    // Write your solution here\n}`, python: `def length_of_lis(nums):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[10,9,2,5,3,7,101,18]', expectedOutput: '4' }]
  },

  25: {
    id: 25, title: 'Unique Paths', difficulty: 'Medium', category: 'Dynamic Programming',
    leetcodeUrl: 'https://leetcode.com/problems/unique-paths/',
    description: `A robot is on an m x n grid. It can only move right or down. How many unique paths are there to the bottom-right corner?`,
    examples: [
      { input: 'm = 3, n = 7', output: '28', explanation: '28 unique paths.' },
      { input: 'm = 3, n = 2', output: '3', explanation: 'Right->Right->Down, Right->Down->Right, Down->Right->Right.' }
    ],
    constraints: ['1 <= m, n <= 100'],
    starterCode: { javascript: `function uniquePaths(m, n) {\n    // Write your solution here\n}`, python: `def unique_paths(m, n):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '3, 7', expectedOutput: '28' }, { input: '3, 2', expectedOutput: '3' }]
  },

  26: {
    id: 26, title: 'Word Break', difficulty: 'Medium', category: 'Dynamic Programming',
    leetcodeUrl: 'https://leetcode.com/problems/word-break/',
    description: `Given a string s and a dictionary wordDict, return true if s can be segmented into space-separated dictionary words.`,
    examples: [
      { input: 's = "leetcode", wordDict = ["leet","code"]', output: 'true', explanation: '"leet code".' },
      { input: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]', output: 'false', explanation: 'Cannot be segmented.' }
    ],
    constraints: ['1 <= s.length <= 300', '1 <= wordDict.length <= 1000'],
    starterCode: { javascript: `function wordBreak(s, wordDict) {\n    // Write your solution here\n}`, python: `def word_break(s, word_dict):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '"leetcode", ["leet","code"]', expectedOutput: 'true' }]
  },

  // GRAPH (27-34)
  27: {
    id: 27, title: 'Alien Dictionary (Premium)', difficulty: 'Hard', category: 'Graph',
    leetcodeUrl: 'https://leetcode.com/problems/alien-dictionary/',
    description: `Given a sorted dictionary of an alien language, derive the order of characters in the alphabet.`,
    examples: [
      { input: 'words = ["wrt","wrf","er","ett","rftt"]', output: '"wertf"', explanation: 'The order is w->e->r->t->f.' }
    ],
    constraints: ['1 <= words.length <= 100', '1 <= words[i].length <= 100'],
    starterCode: { javascript: `function alienOrder(words) {\n    // Write your solution here\n}`, python: `def alien_order(words):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '["wrt","wrf","er","ett","rftt"]', expectedOutput: '"wertf"' }]
  },

  28: {
    id: 28, title: 'Clone Graph', difficulty: 'Medium', category: 'Graph',
    leetcodeUrl: 'https://leetcode.com/problems/clone-graph/',
    description: `Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph.`,
    examples: [
      { input: 'adjList = [[2,4],[1,3],[2,4],[1,3]]', output: '[[2,4],[1,3],[2,4],[1,3]]', explanation: 'Clone of the graph.' }
    ],
    constraints: ['The number of nodes is in range [0, 100]', '1 <= Node.val <= 100'],
    starterCode: { javascript: `function cloneGraph(node) {\n    // Write your solution here\n}`, python: `def clone_graph(node):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[[2,4],[1,3],[2,4],[1,3]]', expectedOutput: '[[2,4],[1,3],[2,4],[1,3]]' }]
  },

  29: {
    id: 29, title: 'Course Schedule', difficulty: 'Medium', category: 'Graph',
    leetcodeUrl: 'https://leetcode.com/problems/course-schedule/',
    description: `Given numCourses and prerequisites pairs, return true if you can finish all courses (no cycle in dependency graph).`,
    examples: [
      { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true', explanation: 'Take course 0 then 1.' },
      { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false', explanation: 'Cycle exists.' }
    ],
    constraints: ['1 <= numCourses <= 2000', '0 <= prerequisites.length <= 5000'],
    starterCode: { javascript: `function canFinish(numCourses, prerequisites) {\n    // Write your solution here\n}`, python: `def can_finish(num_courses, prerequisites):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '2, [[1,0]]', expectedOutput: 'true' }, { input: '2, [[1,0],[0,1]]', expectedOutput: 'false' }]
  },

  30: {
    id: 30, title: 'Graph Valid Tree (Premium)', difficulty: 'Medium', category: 'Graph',
    leetcodeUrl: 'https://leetcode.com/problems/graph-valid-tree/',
    description: `Given n nodes and a list of undirected edges, determine if these edges form a valid tree.`,
    examples: [
      { input: 'n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]', output: 'true', explanation: 'Valid tree.' },
      { input: 'n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]', output: 'false', explanation: 'Has cycle.' }
    ],
    constraints: ['1 <= n <= 2000', '0 <= edges.length <= 5000'],
    starterCode: { javascript: `function validTree(n, edges) {\n    // Write your solution here\n}`, python: `def valid_tree(n, edges):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '5, [[0,1],[0,2],[0,3],[1,4]]', expectedOutput: 'true' }]
  },

  31: {
    id: 31, title: 'Longest Consecutive Sequence', difficulty: 'Medium', category: 'Graph',
    leetcodeUrl: 'https://leetcode.com/problems/longest-consecutive-sequence/',
    description: `Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence in O(n) time.`,
    examples: [
      { input: 'nums = [100,4,200,1,3,2]', output: '4', explanation: 'The sequence is [1,2,3,4].' },
      { input: 'nums = [0,3,7,2,5,8,4,6,0,1]', output: '9', explanation: 'The sequence is [0,1,2,3,4,5,6,7,8].' }
    ],
    constraints: ['0 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    starterCode: { javascript: `function longestConsecutive(nums) {\n    // Write your solution here\n}`, python: `def longest_consecutive(nums):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[100,4,200,1,3,2]', expectedOutput: '4' }]
  },

  32: {
    id: 32, title: 'Number of Connected Components (Premium)', difficulty: 'Medium', category: 'Graph',
    leetcodeUrl: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/',
    description: `Given n nodes and a list of undirected edges, return the number of connected components in the graph.`,
    examples: [
      { input: 'n = 5, edges = [[0,1],[1,2],[3,4]]', output: '2', explanation: 'Two components: {0,1,2} and {3,4}.' }
    ],
    constraints: ['1 <= n <= 2000', '1 <= edges.length <= 5000'],
    starterCode: { javascript: `function countComponents(n, edges) {\n    // Write your solution here\n}`, python: `def count_components(n, edges):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '5, [[0,1],[1,2],[3,4]]', expectedOutput: '2' }]
  },

  33: {
    id: 33, title: 'Number of Islands', difficulty: 'Medium', category: 'Graph',
    leetcodeUrl: 'https://leetcode.com/problems/number-of-islands/',
    description: `Given an m x n 2D grid map of '1's (land) and '0's (water), return the number of islands.`,
    examples: [
      { input: 'grid = [["1","1","0"],["1","1","0"],["0","0","1"]]', output: '2', explanation: 'Two islands.' }
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300'],
    starterCode: { javascript: `function numIslands(grid) {\n    // Write your solution here\n}`, python: `def num_islands(grid):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[["1","1","0"],["1","1","0"],["0","0","1"]]', expectedOutput: '2' }]
  },

  34: {
    id: 34, title: 'Pacific Atlantic Water Flow', difficulty: 'Medium', category: 'Graph',
    leetcodeUrl: 'https://leetcode.com/problems/pacific-atlantic-water-flow/',
    description: `Given an m x n matrix of heights, return a list of grid coordinates where water can flow to both Pacific and Atlantic oceans.`,
    examples: [
      { input: 'heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]', output: '[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]', explanation: 'Cells that can flow to both oceans.' }
    ],
    constraints: ['m == heights.length', 'n == heights[i].length', '1 <= m, n <= 200'],
    starterCode: { javascript: `function pacificAtlantic(heights) {\n    // Write your solution here\n}`, python: `def pacific_atlantic(heights):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]', expectedOutput: '[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]' }]
  },

  // HEAP (35-36)
  35: {
    id: 35, title: 'Find Median from Data Stream', difficulty: 'Hard', category: 'Heap',
    leetcodeUrl: 'https://leetcode.com/problems/find-median-from-data-stream/',
    description: `Design a data structure that supports adding integers and finding the median of all elements added so far.`,
    examples: [
      { input: 'addNum(1), addNum(2), findMedian(), addNum(3), findMedian()', output: '[null,null,1.5,null,2.0]', explanation: 'Median updates as numbers are added.' }
    ],
    constraints: ['-10^5 <= num <= 10^5', 'At most 5 * 10^4 calls'],
    starterCode: { javascript: `class MedianFinder {\n    constructor() {\n        // Initialize\n    }\n    addNum(num) {\n        // Add number\n    }\n    findMedian() {\n        // Return median\n    }\n}`, python: `class MedianFinder:\n    def __init__(self):\n        pass\n    def add_num(self, num):\n        pass\n    def find_median(self):\n        pass` },
    testCases: [{ input: '[[],[1],[2],[],[3],[]]', expectedOutput: '[null,null,null,1.5,null,2.0]' }]
  },

  36: {
    id: 36, title: 'Top K Frequent Elements', difficulty: 'Medium', category: 'Heap',
    leetcodeUrl: 'https://leetcode.com/problems/top-k-frequent-elements/',
    description: `Given an integer array nums and an integer k, return the k most frequent elements.`,
    examples: [
      { input: 'nums = [1,1,1,2,2,3], k = 2', output: '[1,2]', explanation: '1 appears 3 times, 2 appears 2 times.' },
      { input: 'nums = [1], k = 1', output: '[1]', explanation: '1 is the only element.' }
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', 'k is in range [1, number of unique elements]'],
    starterCode: { javascript: `function topKFrequent(nums, k) {\n    // Write your solution here\n}`, python: `def top_k_frequent(nums, k):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[1,1,1,2,2,3], 2', expectedOutput: '[1,2]' }]
  },

  // INTERVAL (37-41)
  37: {
    id: 37, title: 'Insert Interval', difficulty: 'Medium', category: 'Interval',
    leetcodeUrl: 'https://leetcode.com/problems/insert-interval/',
    description: `Given a list of non-overlapping intervals sorted by start time and a new interval, insert the new interval and merge if necessary.`,
    examples: [
      { input: 'intervals = [[1,3],[6,9]], newInterval = [2,5]', output: '[[1,5],[6,9]]', explanation: 'Merge [1,3] and [2,5] into [1,5].' }
    ],
    constraints: ['0 <= intervals.length <= 10^4', 'intervals[i].length == 2'],
    starterCode: { javascript: `function insert(intervals, newInterval) {\n    // Write your solution here\n}`, python: `def insert(intervals, new_interval):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[[1,3],[6,9]], [2,5]', expectedOutput: '[[1,5],[6,9]]' }]
  },

  38: {
    id: 38, title: 'Meeting Rooms (Premium)', difficulty: 'Easy', category: 'Interval',
    leetcodeUrl: 'https://leetcode.com/problems/meeting-rooms/',
    description: `Given an array of meeting time intervals, determine if a person could attend all meetings.`,
    examples: [
      { input: 'intervals = [[0,30],[5,10],[15,20]]', output: 'false', explanation: '[0,30] and [5,10] overlap.' },
      { input: 'intervals = [[7,10],[2,4]]', output: 'true', explanation: 'No overlap.' }
    ],
    constraints: ['0 <= intervals.length <= 10^4'],
    starterCode: { javascript: `function canAttendMeetings(intervals) {\n    // Write your solution here\n}`, python: `def can_attend_meetings(intervals):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[[0,30],[5,10],[15,20]]', expectedOutput: 'false' }, { input: '[[7,10],[2,4]]', expectedOutput: 'true' }]
  },

  39: {
    id: 39, title: 'Meeting Rooms II (Premium)', difficulty: 'Medium', category: 'Interval',
    leetcodeUrl: 'https://leetcode.com/problems/meeting-rooms-ii/',
    description: `Given an array of meeting time intervals, return the minimum number of conference rooms required.`,
    examples: [
      { input: 'intervals = [[0,30],[5,10],[15,20]]', output: '2', explanation: 'Need 2 rooms for overlapping meetings.' },
      { input: 'intervals = [[7,10],[2,4]]', output: '1', explanation: 'No overlap, 1 room is enough.' }
    ],
    constraints: ['1 <= intervals.length <= 10^4'],
    starterCode: { javascript: `function minMeetingRooms(intervals) {\n    // Write your solution here\n}`, python: `def min_meeting_rooms(intervals):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[[0,30],[5,10],[15,20]]', expectedOutput: '2' }]
  },

  40: {
    id: 40, title: 'Merge Intervals', difficulty: 'Medium', category: 'Interval',
    leetcodeUrl: 'https://leetcode.com/problems/merge-intervals/',
    description: `Given an array of intervals, merge all overlapping intervals.`,
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: '[1,3] and [2,6] merge into [1,6].' },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]', explanation: '[1,4] and [4,5] merge into [1,5].' }
    ],
    constraints: ['1 <= intervals.length <= 10^4', 'intervals[i].length == 2'],
    starterCode: { javascript: `function merge(intervals) {\n    // Write your solution here\n}`, python: `def merge(intervals):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]' }]
  },

  41: {
    id: 41, title: 'Non-overlapping Intervals', difficulty: 'Medium', category: 'Interval',
    leetcodeUrl: 'https://leetcode.com/problems/non-overlapping-intervals/',
    description: `Given an array of intervals, return the minimum number of intervals you need to remove to make the rest non-overlapping.`,
    examples: [
      { input: 'intervals = [[1,2],[2,3],[3,4],[1,3]]', output: '1', explanation: 'Remove [1,3].' },
      { input: 'intervals = [[1,2],[1,2],[1,2]]', output: '2', explanation: 'Remove 2 of them.' }
    ],
    constraints: ['1 <= intervals.length <= 10^5'],
    starterCode: { javascript: `function eraseOverlapIntervals(intervals) {\n    // Write your solution here\n}`, python: `def erase_overlap_intervals(intervals):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[[1,2],[2,3],[3,4],[1,3]]', expectedOutput: '1' }]
  },

  // LINKED LIST (42-47)
  42: {
    id: 42, title: 'Detect Cycle in a Linked List', difficulty: 'Easy', category: 'Linked List',
    leetcodeUrl: 'https://leetcode.com/problems/linked-list-cycle/',
    description: `Given head, the head of a linked list, determine if the linked list has a cycle in it.`,
    examples: [
      { input: 'head = [3,2,0,-4], pos = 1', output: 'true', explanation: 'There is a cycle.' },
      { input: 'head = [1], pos = -1', output: 'false', explanation: 'No cycle.' }
    ],
    constraints: ['The number of nodes is in the range [0, 10^4]'],
    starterCode: { javascript: `function hasCycle(head) {\n    // Write your solution here\n}`, python: `def has_cycle(head):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[3,2,0,-4], pos=1', expectedOutput: 'true' }]
  },

  43: {
    id: 43, title: 'Merge K Sorted Lists', difficulty: 'Hard', category: 'Linked List',
    leetcodeUrl: 'https://leetcode.com/problems/merge-k-sorted-lists/',
    description: `Merge all k sorted linked-lists into one sorted linked-list and return it.`,
    examples: [
      { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]', explanation: 'All lists merged.' }
    ],
    constraints: ['k == lists.length', '0 <= k <= 10^4'],
    starterCode: { javascript: `function mergeKLists(lists) {\n    // Write your solution here\n}`, python: `def merge_k_lists(lists):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[[1,4,5],[1,3,4],[2,6]]', expectedOutput: '[1,1,2,3,4,4,5,6]' }]
  },

  44: {
    id: 44, title: 'Merge Two Sorted Lists', difficulty: 'Easy', category: 'Linked List',
    leetcodeUrl: 'https://leetcode.com/problems/merge-two-sorted-lists/',
    description: `Merge two sorted linked lists and return it as a sorted list.`,
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]', explanation: 'Merged sorted list.' }
    ],
    constraints: ['The number of nodes in both lists is in the range [0, 50]'],
    starterCode: { javascript: `function mergeTwoLists(list1, list2) {\n    // Write your solution here\n}`, python: `def merge_two_lists(list1, list2):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[1,2,4], [1,3,4]', expectedOutput: '[1,1,2,3,4,4]' }]
  },

  45: {
    id: 45, title: 'Remove Nth Node From End Of List', difficulty: 'Medium', category: 'Linked List',
    leetcodeUrl: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/',
    description: `Given the head of a linked list, remove the nth node from the end of the list and return its head.`,
    examples: [
      { input: 'head = [1,2,3,4,5], n = 2', output: '[1,2,3,5]', explanation: 'Remove 4.' },
      { input: 'head = [1], n = 1', output: '[]', explanation: 'Remove only node.' }
    ],
    constraints: ['The number of nodes in the list is sz', '1 <= sz <= 30', '1 <= n <= sz'],
    starterCode: { javascript: `function removeNthFromEnd(head, n) {\n    // Write your solution here\n}`, python: `def remove_nth_from_end(head, n):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[1,2,3,4,5], 2', expectedOutput: '[1,2,3,5]' }]
  },

  46: {
    id: 46, title: 'Reorder List', difficulty: 'Medium', category: 'Linked List',
    leetcodeUrl: 'https://leetcode.com/problems/reorder-list/',
    description: `Given L0 → L1 → ... → Ln-1 → Ln, reorder it to L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → ...`,
    examples: [
      { input: 'head = [1,2,3,4]', output: '[1,4,2,3]', explanation: 'Reordered list.' },
      { input: 'head = [1,2,3,4,5]', output: '[1,5,2,4,3]', explanation: 'Reordered list.' }
    ],
    constraints: ['The number of nodes is in the range [1, 5 * 10^4]'],
    starterCode: { javascript: `function reorderList(head) {\n    // Write your solution here\n}`, python: `def reorder_list(head):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[1,2,3,4]', expectedOutput: '[1,4,2,3]' }]
  },

  47: {
    id: 47, title: 'Reverse a Linked List', difficulty: 'Easy', category: 'Linked List',
    leetcodeUrl: 'https://leetcode.com/problems/reverse-linked-list/',
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'Reversed.' },
      { input: 'head = [1,2]', output: '[2,1]', explanation: 'Reversed.' }
    ],
    constraints: ['The number of nodes in the list is [0, 5000]'],
    starterCode: { javascript: `function reverseList(head) {\n    // Write your solution here\n}`, python: `def reverse_list(head):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' }]
  },

  // MATRIX (48-51)
  48: {
    id: 48, title: 'Rotate Image', difficulty: 'Medium', category: 'Matrix',
    leetcodeUrl: 'https://leetcode.com/problems/rotate-image/',
    description: `Rotate a given n x n 2D matrix by 90 degrees clockwise, in-place.`,
    examples: [
      { input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', output: '[[7,4,1],[8,5,2],[9,6,3]]', explanation: 'Rotated 90 degrees.' }
    ],
    constraints: ['n == matrix.length == matrix[i].length', '1 <= n <= 20'],
    starterCode: { javascript: `function rotate(matrix) {\n    // Write your solution here\n}`, python: `def rotate(matrix):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[[1,2,3],[4,5,6],[7,8,9]]', expectedOutput: '[[7,4,1],[8,5,2],[9,6,3]]' }]
  },

  49: {
    id: 49, title: 'Set Matrix Zeroes', difficulty: 'Medium', category: 'Matrix',
    leetcodeUrl: 'https://leetcode.com/problems/set-matrix-zeroes/',
    description: `Given an m x n integer matrix, if an element is 0, set its entire row and column to 0's, in place.`,
    examples: [
      { input: 'matrix = [[1,1,1],[1,0,1],[1,1,1]]', output: '[[1,0,1],[0,0,0],[1,0,1]]', explanation: 'Row and column of 0 are set to 0.' }
    ],
    constraints: ['m == matrix.length', 'n == matrix[0].length', '1 <= m, n <= 200'],
    starterCode: { javascript: `function setZeroes(matrix) {\n    // Write your solution here\n}`, python: `def set_zeroes(matrix):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[[1,1,1],[1,0,1],[1,1,1]]', expectedOutput: '[[1,0,1],[0,0,0],[1,0,1]]' }]
  },

  50: {
    id: 50, title: 'Spiral Matrix', difficulty: 'Medium', category: 'Matrix',
    leetcodeUrl: 'https://leetcode.com/problems/spiral-matrix/',
    description: `Given an m x n matrix, return all elements of the matrix in spiral order.`,
    examples: [
      { input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', output: '[1,2,3,6,9,8,7,4,5]', explanation: 'Spiral order traversal.' }
    ],
    constraints: ['m == matrix.length', 'n == matrix[i].length', '1 <= m, n <= 10'],
    starterCode: { javascript: `function spiralOrder(matrix) {\n    // Write your solution here\n}`, python: `def spiral_order(matrix):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[[1,2,3],[4,5,6],[7,8,9]]', expectedOutput: '[1,2,3,6,9,8,7,4,5]' }]
  },

  51: {
    id: 51, title: 'Word Search', difficulty: 'Medium', category: 'Matrix',
    leetcodeUrl: 'https://leetcode.com/problems/word-search/',
    description: `Given an m x n grid of characters and a string word, return true if word exists in the grid.`,
    examples: [
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: 'true', explanation: 'Word found.' }
    ],
    constraints: ['m == board.length', 'n = board[i].length', '1 <= m, n <= 6', '1 <= word.length <= 15'],
    starterCode: { javascript: `function exist(board, word) {\n    // Write your solution here\n}`, python: `def exist(board, word):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCCED"', expectedOutput: 'true' }]
  },

  // STRING (52-61)
  52: {
    id: 52, title: 'Encode and Decode Strings (Premium)', difficulty: 'Medium', category: 'String',
    leetcodeUrl: 'https://leetcode.com/problems/encode-and-decode-strings/',
    description: `Design an algorithm to encode a list of strings to a string and decode it back.`,
    examples: [
      { input: 'strs = ["Hello","World"]', output: '["Hello","World"]', explanation: 'Encode then decode returns original.' }
    ],
    constraints: ['1 <= strs.length <= 200', '0 <= strs[i].length <= 200'],
    starterCode: { javascript: `function encode(strs) {\n    // Encode\n}\nfunction decode(s) {\n    // Decode\n}`, python: `def encode(strs):\n    pass\ndef decode(s):\n    pass` },
    testCases: [{ input: '["Hello","World"]', expectedOutput: '["Hello","World"]' }]
  },

  53: {
    id: 53, title: 'Group Anagrams', difficulty: 'Medium', category: 'String',
    leetcodeUrl: 'https://leetcode.com/problems/group-anagrams/',
    description: `Given an array of strings, group the anagrams together.`,
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]', explanation: 'Anagrams grouped.' }
    ],
    constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100'],
    starterCode: { javascript: `function groupAnagrams(strs) {\n    // Write your solution here\n}`, python: `def group_anagrams(strs):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }]
  },

  54: {
    id: 54, title: 'Longest Palindromic Substring', difficulty: 'Medium', category: 'String',
    leetcodeUrl: 'https://leetcode.com/problems/longest-palindromic-substring/',
    description: `Given a string s, return the longest palindromic substring in s.`,
    examples: [
      { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also valid.' },
      { input: 's = "cbbd"', output: '"bb"', explanation: 'Longest palindrome.' }
    ],
    constraints: ['1 <= s.length <= 1000'],
    starterCode: { javascript: `function longestPalindrome(s) {\n    // Write your solution here\n}`, python: `def longest_palindrome(s):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '"babad"', expectedOutput: '"bab"' }]
  },

  55: {
    id: 55, title: 'Longest Repeating Character Replacement', difficulty: 'Medium', category: 'String',
    leetcodeUrl: 'https://leetcode.com/problems/longest-repeating-character-replacement/',
    description: `Given a string s and an integer k, you can replace any character at most k times. Return the length of the longest substring with the same letter after replacements.`,
    examples: [
      { input: 's = "ABAB", k = 2', output: '4', explanation: 'Replace 2 As with Bs or vice versa.' },
      { input: 's = "AABABBA", k = 1', output: '4', explanation: 'Replace one B to get "AAAA".' }
    ],
    constraints: ['1 <= s.length <= 10^5', '0 <= k <= s.length'],
    starterCode: { javascript: `function characterReplacement(s, k) {\n    // Write your solution here\n}`, python: `def character_replacement(s, k):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '"ABAB", 2', expectedOutput: '4' }]
  },

  56: {
    id: 56, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', category: 'String',
    leetcodeUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    description: `Given a string s, find the length of the longest substring without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc".' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b".' }
    ],
    constraints: ['0 <= s.length <= 5 * 10^4'],
    starterCode: { javascript: `function lengthOfLongestSubstring(s) {\n    // Write your solution here\n}`, python: `def length_of_longest_substring(s):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '"abcabcbb"', expectedOutput: '3' }]
  },

  57: {
    id: 57, title: 'Minimum Window Substring', difficulty: 'Hard', category: 'String',
    leetcodeUrl: 'https://leetcode.com/problems/minimum-window-substring/',
    description: `Given strings s and t, return the minimum window substring of s that contains all characters in t.`,
    examples: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"', explanation: 'Minimum window containing A, B, C.' }
    ],
    constraints: ['1 <= s.length, t.length <= 10^5'],
    starterCode: { javascript: `function minWindow(s, t) {\n    // Write your solution here\n}`, python: `def min_window(s, t):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '"ADOBECODEBANC", "ABC"', expectedOutput: '"BANC"' }]
  },

  58: {
    id: 58, title: 'Palindromic Substrings', difficulty: 'Medium', category: 'String',
    leetcodeUrl: 'https://leetcode.com/problems/palindromic-substrings/',
    description: `Given a string s, return the number of palindromic substrings in it.`,
    examples: [
      { input: 's = "abc"', output: '3', explanation: '"a", "b", "c".' },
      { input: 's = "aaa"', output: '6', explanation: '"a", "a", "a", "aa", "aa", "aaa".' }
    ],
    constraints: ['1 <= s.length <= 1000'],
    starterCode: { javascript: `function countSubstrings(s) {\n    // Write your solution here\n}`, python: `def count_substrings(s):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '"abc"', expectedOutput: '3' }]
  },

  59: {
    id: 59, title: 'Valid Anagram', difficulty: 'Easy', category: 'String',
    leetcodeUrl: 'https://leetcode.com/problems/valid-anagram/',
    description: `Given two strings s and t, return true if t is an anagram of s, and false otherwise.`,
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true', explanation: 'Same characters, same frequencies.' },
      { input: 's = "rat", t = "car"', output: 'false', explanation: 'Different characters.' }
    ],
    constraints: ['1 <= s.length, t.length <= 5 * 10^4'],
    starterCode: { javascript: `function isAnagram(s, t) {\n    // Write your solution here\n}`, python: `def is_anagram(s, t):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '"anagram", "nagaram"', expectedOutput: 'true' }]
  },

  60: {
    id: 60, title: 'Valid Palindrome', difficulty: 'Easy', category: 'String',
    leetcodeUrl: 'https://leetcode.com/problems/valid-palindrome/',
    description: `A phrase is a palindrome if, after converting to lowercase and removing non-alphanumeric characters, it reads the same forward and backward.`,
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: 'false', explanation: '"raceacar" is not a palindrome.' }
    ],
    constraints: ['1 <= s.length <= 2 * 10^5'],
    starterCode: { javascript: `function isPalindrome(s) {\n    // Write your solution here\n}`, python: `def is_palindrome(s):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true' }]
  },

  61: {
    id: 61, title: 'Valid Parentheses', difficulty: 'Easy', category: 'String',
    leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses/',
    description: `Given a string containing just '(', ')', '{', '}', '[' and ']', determine if the input string is valid.`,
    examples: [
      { input: 's = "()"', output: 'true', explanation: 'Valid.' },
      { input: 's = "()[]{}"', output: 'true', explanation: 'Valid.' },
      { input: 's = "(]"', output: 'false', explanation: 'Mismatched.' }
    ],
    constraints: ['1 <= s.length <= 10^4'],
    starterCode: { javascript: `function isValid(s) {\n    // Write your solution here\n}`, python: `def is_valid(s):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '"()"', expectedOutput: 'true' }, { input: '"(]"', expectedOutput: 'false' }]
  },

  // TREE (62-75)
  62: {
    id: 62, title: 'Add and Search Word', difficulty: 'Medium', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/',
    description: `Design a data structure that supports adding new words and finding if a string matches any previously added string with '.' as wildcard.`,
    examples: [
      { input: 'addWord("bad"), search("b.d")', output: 'true', explanation: '"." matches any character.' }
    ],
    constraints: ['1 <= word.length <= 25', 'At most 10^4 calls'],
    starterCode: { javascript: `class WordDictionary {\n    addWord(word) {}\n    search(word) {}\n}`, python: `class WordDictionary:\n    def add_word(self, word):\n        pass\n    def search(self, word):\n        pass` },
    testCases: [{ input: '["bad"], "b.d"', expectedOutput: 'true' }]
  },

  63: {
    id: 63, title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
    description: `Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).`,
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]', explanation: 'Level by level traversal.' }
    ],
    constraints: ['The number of nodes is in [0, 2000]'],
    starterCode: { javascript: `function levelOrder(root) {\n    // Write your solution here\n}`, python: `def level_order(root):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[3,9,20,null,null,15,7]', expectedOutput: '[[3],[9,20],[15,7]]' }]
  },

  64: {
    id: 64, title: 'Binary Tree Maximum Path Sum', difficulty: 'Hard', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
    description: `A path in a binary tree is a sequence of nodes where each pair of adjacent nodes has an edge. The path sum is the sum of the node's values in the path. Return the maximum path sum.`,
    examples: [
      { input: 'root = [-10,9,20,null,null,15,7]', output: '42', explanation: 'Path 15 -> 20 -> 7 = 42.' }
    ],
    constraints: ['The number of nodes is in [1, 3 * 10^4]'],
    starterCode: { javascript: `function maxPathSum(root) {\n    // Write your solution here\n}`, python: `def max_path_sum(root):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[-10,9,20,null,null,15,7]', expectedOutput: '42' }]
  },

  65: {
    id: 65, title: 'Construct Binary Tree from Preorder and Inorder Traversal', difficulty: 'Medium', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/',
    description: `Given preorder and inorder traversal arrays of a tree, construct and return the binary tree.`,
    examples: [
      { input: 'preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]', output: '[3,9,20,null,null,15,7]', explanation: 'Reconstructed tree.' }
    ],
    constraints: ['1 <= preorder.length <= 3000', 'preorder.length == inorder.length'],
    starterCode: { javascript: `function buildTree(preorder, inorder) {\n    // Write your solution here\n}`, python: `def build_tree(preorder, inorder):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[3,9,20,15,7], [9,3,15,20,7]', expectedOutput: '[3,9,20,null,null,15,7]' }]
  },

  66: {
    id: 66, title: 'Implement Trie (Prefix Tree)', difficulty: 'Medium', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/implement-trie-prefix-tree/',
    description: `Implement a trie with insert, search, and startsWith methods.`,
    examples: [
      { input: 'insert("apple"), search("apple"), startsWith("app")', output: '[null,true,true]', explanation: 'Trie operations.' }
    ],
    constraints: ['1 <= word.length, prefix.length <= 2000'],
    starterCode: { javascript: `class Trie {\n    insert(word) {}\n    search(word) {}\n    startsWith(prefix) {}\n}`, python: `class Trie:\n    def insert(self, word):\n        pass\n    def search(self, word):\n        pass\n    def starts_with(self, prefix):\n        pass` },
    testCases: [{ input: '["apple"], "apple", "app"', expectedOutput: '[null,true,true]' }]
  },

  67: {
    id: 67, title: 'Invert/Flip Binary Tree', difficulty: 'Easy', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/invert-binary-tree/',
    description: `Given the root of a binary tree, invert the tree, and return its root.`,
    examples: [
      { input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]', explanation: 'Mirrored tree.' }
    ],
    constraints: ['The number of nodes is in [0, 100]'],
    starterCode: { javascript: `function invertTree(root) {\n    // Write your solution here\n}`, python: `def invert_tree(root):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[4,2,7,1,3,6,9]', expectedOutput: '[4,7,2,9,6,3,1]' }]
  },

  68: {
    id: 68, title: 'Kth Smallest Element in a BST', difficulty: 'Medium', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/',
    description: `Given the root of a binary search tree, and an integer k, return the kth smallest value.`,
    examples: [
      { input: 'root = [3,1,4,null,2], k = 1', output: '1', explanation: '1 is the smallest.' },
      { input: 'root = [5,3,6,2,4,null,null,1], k = 3', output: '3', explanation: '3rd smallest is 3.' }
    ],
    constraints: ['The number of nodes is n', '1 <= k <= n <= 10^4'],
    starterCode: { javascript: `function kthSmallest(root, k) {\n    // Write your solution here\n}`, python: `def kth_smallest(root, k):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[3,1,4,null,2], 1', expectedOutput: '1' }]
  },

  69: {
    id: 69, title: 'Lowest Common Ancestor of BST', difficulty: 'Easy', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/',
    description: `Given a binary search tree and two nodes, find their lowest common ancestor.`,
    examples: [
      { input: 'root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8', output: '6', explanation: 'LCA of 2 and 8 is 6.' }
    ],
    constraints: ['The number of nodes is in [2, 10^5]', 'All values are unique'],
    starterCode: { javascript: `function lowestCommonAncestor(root, p, q) {\n    // Write your solution here\n}`, python: `def lowest_common_ancestor(root, p, q):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[6,2,8,0,4,7,9,null,null,3,5], 2, 8', expectedOutput: '6' }]
  },

  70: {
    id: 70, title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
    description: `Given the root of a binary tree, return its maximum depth.`,
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '3', explanation: 'Depth is 3.' },
      { input: 'root = [1,null,2]', output: '2', explanation: 'Depth is 2.' }
    ],
    constraints: ['The number of nodes is in [0, 10^4]'],
    starterCode: { javascript: `function maxDepth(root) {\n    // Write your solution here\n}`, python: `def max_depth(root):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[3,9,20,null,null,15,7]', expectedOutput: '3' }]
  },

  71: {
    id: 71, title: 'Same Tree', difficulty: 'Easy', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/same-tree/',
    description: `Given the roots of two binary trees p and q, check if they are the same or not.`,
    examples: [
      { input: 'p = [1,2,3], q = [1,2,3]', output: 'true', explanation: 'Identical trees.' },
      { input: 'p = [1,2], q = [1,null,2]', output: 'false', explanation: 'Different structure.' }
    ],
    constraints: ['The number of nodes is in [0, 100]'],
    starterCode: { javascript: `function isSameTree(p, q) {\n    // Write your solution here\n}`, python: `def is_same_tree(p, q):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[1,2,3], [1,2,3]', expectedOutput: 'true' }]
  },

  72: {
    id: 72, title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/',
    description: `Design an algorithm to serialize and deserialize a binary tree.`,
    examples: [
      { input: 'root = [1,2,3,null,null,4,5]', output: '[1,2,3,null,null,4,5]', explanation: 'Serialize then deserialize returns original.' }
    ],
    constraints: ['The number of nodes is in [0, 10^4]'],
    starterCode: { javascript: `function serialize(root) {}\nfunction deserialize(data) {}`, python: `def serialize(root):\n    pass\ndef deserialize(data):\n    pass` },
    testCases: [{ input: '[1,2,3,null,null,4,5]', expectedOutput: '[1,2,3,null,null,4,5]' }]
  },

  73: {
    id: 73, title: 'Subtree of Another Tree', difficulty: 'Easy', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/subtree-of-another-tree/',
    description: `Given the roots of two binary trees root and subRoot, return true if there is a subtree of root with the same structure and node values as subRoot.`,
    examples: [
      { input: 'root = [3,4,5,1,2], subRoot = [4,1,2]', output: 'true', explanation: 'Subtree found.' }
    ],
    constraints: ['The number of nodes in root is [1, 2000]', 'The number of nodes in subRoot is [1, 1000]'],
    starterCode: { javascript: `function isSubtree(root, subRoot) {\n    // Write your solution here\n}`, python: `def is_subtree(root, sub_root):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[3,4,5,1,2], [4,1,2]', expectedOutput: 'true' }]
  },

  74: {
    id: 74, title: 'Validate Binary Search Tree', difficulty: 'Medium', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/validate-binary-search-tree/',
    description: `Given the root of a binary tree, determine if it is a valid binary search tree (BST).`,
    examples: [
      { input: 'root = [2,1,3]', output: 'true', explanation: 'Valid BST.' },
      { input: 'root = [5,1,4,null,null,3,6]', output: 'false', explanation: '4 is in right subtree but < 5.' }
    ],
    constraints: ['The number of nodes is in [1, 10^4]'],
    starterCode: { javascript: `function isValidBST(root) {\n    // Write your solution here\n}`, python: `def is_valid_bst(root):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[2,1,3]', expectedOutput: 'true' }, { input: '[5,1,4,null,null,3,6]', expectedOutput: 'false' }]
  },

  75: {
    id: 75, title: 'Word Search II', difficulty: 'Hard', category: 'Tree',
    leetcodeUrl: 'https://leetcode.com/problems/word-search-ii/',
    description: `Given an m x n board of characters and a list of words, return all words on the board. Use a trie for efficiency.`,
    examples: [
      { input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]', output: '["eat","oath"]', explanation: 'Found words.' }
    ],
    constraints: ['m == board.length', 'n == board[i].length', '1 <= m, n <= 12', '1 <= words.length <= 3 * 10^4'],
    starterCode: { javascript: `function findWords(board, words) {\n    // Write your solution here\n}`, python: `def find_words(board, words):\n    # Write your solution here\n    pass` },
    testCases: [{ input: '[["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], ["oath","pea","eat","rain"]', expectedOutput: '["eat","oath"]' }]
  }
};

// Helper functions
export function getProblemById(id: number): Problem | null {
  return PROBLEMS_DATA[id] || null;
}

export function getAllProblemIds(): number[] {
  return Object.keys(PROBLEMS_DATA).map(Number).sort((a, b) => a - b);
}

export function getProblemsByCategory(category: string): Problem[] {
  return Object.values(PROBLEMS_DATA).filter(p => p.category === category);
}

export function getProblemsByDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): Problem[] {
  return Object.values(PROBLEMS_DATA).filter(p => p.difficulty === difficulty);
}
