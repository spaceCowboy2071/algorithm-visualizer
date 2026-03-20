// Maps Blind 75 problem IDs to their HTML visualizer file paths in public/visualizers/

const VISUALIZER_PATHS: Record<number, string> = {
  10: '/visualizers/Arrays/Two_Sum_Visual.html',
  3: '/visualizers/Arrays/Container_With_Most_Water_Visual.html',
  7: '/visualizers/Arrays/Maximum_Subarray_Visual.html',
  8: '/visualizers/Arrays/Product_of_Array_Except_Self_Visual.html',
  28: '/visualizers/Graphs/Clone_Graph_Visual.html',
  33: '/visualizers/Graphs/Number_of_Islands_BFS_Visual.html',
};

export function getVisualizerPath(problemId: number): string | null {
  return VISUALIZER_PATHS[problemId] ?? null;
}
