// Algorithm mode discriminator
export type AlgorithmMode = 'sorting' | 'searching';

// Unified complexity info (shared by both sorting and searching)
export interface ComplexityInfo {
  name: string;
  timeComplexity: {
    best: string;
    average: string;
    worst: string;
  };
  spaceComplexity: string;
  explanations: {
    how: string;
    when: string;
    where: string;
    why: string;
  };
  code: {
    javascript: string;
    python: string;
  };
}

// Tab types for the info panel
export type InfoTab = 'complexity' | 'how' | 'when' | 'where' | 'why';

// Language options for code viewer
export type CodeLanguage = 'javascript' | 'python';

// History snapshot for sorting
export interface SortingHistoryState {
  array: number[];
  comparing: number[];
  sortedIndices: number[];
  currentLine: number | null;
  message: string;
}

// History snapshot for searching (extends sorting)
export interface SearchHistoryState extends SortingHistoryState {
  target: number;
  eliminatedIndices: number[];
  foundIndex: number | null;
  left: number;
  right: number;
  mid: number | null;
  searchResult: 'found' | 'not-found' | null;
}

// Union type for history
export type HistoryState = SortingHistoryState | SearchHistoryState;

// Control refs interface
export interface VisualizationControlRefs {
  pauseRef: React.MutableRefObject<boolean>;
  cancelRef: React.MutableRefObject<boolean>;
  stepForwardRef: React.MutableRefObject<boolean>;
  animationSpeedRef: React.MutableRefObject<number>;
}

// Algorithm definition for the registry
export interface AlgorithmDefinition {
  name: string;
  info: ComplexityInfo;
  mode: AlgorithmMode;
}
