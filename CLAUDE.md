# Algorithm Visualizer

An educational React application for visualizing sorting and searching algorithms with step-by-step execution, code highlighting, and complexity analysis.

**Live Demo:** https://algorithm-visualizer-swwu.vercel.app/

## Tech Stack

- **Framework:** React 19 + TypeScript 5.9
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **Routing:** React Router DOM 7
- **Deployment:** Vercel

## Key Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # TypeScript compile + Vite build → dist/
npm run lint     # ESLint code quality check
npm run preview  # Preview production build locally
```

## Project Structure

```
src/
├── components/
│   └── ArrayVisualizer.tsx   # Main visualization component (1000+ lines)
├── pages/
│   ├── Landing.tsx           # Home page with algorithm category selection
│   └── SortingPage.tsx       # Sorting algorithms page wrapper
├── App.tsx                   # Root routing configuration
├── main.tsx                  # React DOM entry point
└── index.css                 # Tailwind CSS imports
```

## Architecture

### Core Component: ArrayVisualizer

The main visualization engine (`src/components/ArrayVisualizer.tsx`) handles:

- **State Management:** Array values, sorting state, comparing indices, sorted indices, animation speed
- **History System:** Full state snapshots enabling "step backward" time-travel debugging
- **Async Control:** useRef-based pause/cancel/step flags for imperative control over async sorting
- **Visual Rendering:** Color-coded bars (blue=unsorted, yellow=comparing, green=sorted)
- **Code Display:** Live syntax highlighting showing current execution line in JS/Python

### Visualization Features

- Adjustable array size (1-10 elements)
- Speed control (0.25x to 2x)
- Play/Pause/Step Forward/Step Backward controls
- Random array generation
- Algorithm complexity tables
- Educational panels (How/When/Where/Why)

### Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Landing | Home page with category buttons |
| `/sorting` | SortingPage | Sorting algorithm visualizer |

## Implemented Algorithms

### Sorting (3 complete)

1. **Bubble Sort** - O(n²) average, O(1) space
2. **Quick Sort** - O(n log n) average, O(log n) space
3. **Merge Sort** - O(n log n) guaranteed, O(n) space

Each algorithm includes:
- Step-by-step visualization
- Dual language code (JavaScript + Python)
- Complexity analysis table
- Educational explanations

## Current Progress

### Completed
- Core visualization engine with history/time-travel
- Responsive design (mobile/tablet/desktop)
- Three sorting algorithms with full explanations
- Playback controls (play, pause, step forward, step backward)
- Speed and array size controls
- Algorithm selection separated from execution (Play button required)
- Vercel deployment with SPA routing

### Planned
- Searching algorithms (Binary Search, Linear Search)
- Additional sorting algorithms (Insertion, Selection, Heap, Radix)
- Graph algorithms (Dijkstra's, BFS, DFS, A*)
- Tree traversals
- Data structure visualizations

## Development Notes

- Algorithm logic is async with `sleep()` delays for animation
- Pause/cancel use refs (not state) for immediate effect in async loops
- History is cleared on reset or algorithm change
- Tailwind responsive breakpoints: sm (640px), lg (1024px)
- vercel.json rewrites handle client-side routing
