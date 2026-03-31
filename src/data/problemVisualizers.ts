// Maps Blind 75 problem IDs to their HTML visualizer file paths in public/visualizers/

const VISUALIZER_PATHS: Record<number, string> = {
  10: '/visualizers/Arrays/Two_Sum_Visual.html',
  3: '/visualizers/Arrays/Container_With_Most_Water_Visual.html',
  7: '/visualizers/Arrays/Maximum_Subarray_Visual.html',
  8: '/visualizers/Arrays/Product_of_Array_Except_Self_Visual.html',
  28: '/visualizers/Graphs/Clone_Graph_Visual.html',
  33: '/visualizers/Graphs/Number_of_Islands_BFS_Visual.html',
  4: '/visualizers/Arrays/Contains_Duplicate_Visual.html',
  1: '/visualizers/Arrays/3Sum_Visual.html',
  2: '/visualizers/Arrays/Best_Time_Buy_Sell_Stock_Visual.html',
  60: '/visualizers/Strings/Valid_Palindrome_Visual.html',
  61: '/visualizers/Strings/Valid_Parentheses_Visual.html',
  47: '/visualizers/Linked_Lists/Reverse_Linked_List_Visual.html',
  56: '/visualizers/Strings/Longest_Substring_No_Repeat_Visual.html',
};

export function getVisualizerPath(problemId: number): string | null {
  return VISUALIZER_PATHS[problemId] ?? null;
}
