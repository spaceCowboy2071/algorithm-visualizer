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
│   ├── visualizers/
│   │   └── ArrayVisualizer.tsx     # Unified sorting + searching visualizer
│   └── shared/
│       ├── PlaybackControls.tsx    # Step back/play/pause/step forward/reset
│       ├── SpeedControl.tsx        # Animation speed slider
│       ├── ArrayBars.tsx           # Bar visualization with color states
│       ├── XRayCodeViewer.tsx      # Code viewer with line highlighting
│       ├── AlgorithmInfoPanel.tsx  # Complexity + how/when/where/why tabs
│       └── SearchResultBanner.tsx  # Found/not-found result banner
├── hooks/
│   ├── useVisualizationControls.ts # Play/pause/step refs and state
│   ├── useHistory.ts               # Time-travel history system
│   └── useAnimatedSleep.ts         # Sleep with pause/cancel/step awareness
├── data/
│   └── algorithmData.ts            # Consolidated algorithm info + code
├── types/
│   └── visualization.ts            # Shared TypeScript interfaces
├── pages/
│   ├── Landing.tsx                 # Home page with data structure cards
│   └── ArraysPage.tsx              # Arrays page wrapper
├── App.tsx                         # Root routing configuration
├── main.tsx                        # React DOM entry point
└── index.css                       # Tailwind CSS imports
```

## Architecture

The application uses a **data-structure-based organization** where algorithms are grouped by the data structure they operate on (Arrays, Linked Lists, Trees, Graphs, etc.).

### Core Component: ArrayVisualizer

The unified visualization engine (`src/components/visualizers/ArrayVisualizer.tsx`) handles both sorting and searching algorithms:

- **Mode Switching:** Toggle between sorting and searching modes
- **State Management:** Array values, comparing indices, sorted/eliminated indices, animation speed
- **History System:** Full state snapshots enabling "step backward" time-travel debugging
- **Async Control:** useRef-based pause/cancel/step flags for imperative control
- **Visual Rendering:** Color-coded bars (blue=default, yellow=comparing, green=sorted/found, gray=eliminated)
- **Code Display:** Live syntax highlighting showing current execution line in JS/Python

### Shared Hooks

- **useVisualizationControls:** Manages play/pause/step state and refs
- **useHistory:** Generic history system for time-travel debugging
- **useAnimatedSleep:** Sleep utility with pause/cancel/step awareness

### Visualization Features

- Mode selector (Sorting / Searching)
- Algorithm dropdown (filtered by mode)
- Adjustable array size
- Speed control (0.25x to 2x)
- Play/Pause/Step Forward/Step Backward controls
- Random array generation (unsorted for sorting, sorted for searching)
- Algorithm complexity tables
- Educational panels (How/When/Where/Why)
- Search-specific: target input, L/M/R pointers, result banner

### Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Landing | Home page with data structure cards |
| `/arrays` | ArraysPage | Sorting & Searching algorithm visualizer |
| `/blind75` | Blind75Page | LeetCode problem tracker |

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
- **Data-structure-based architecture** - Algorithms organized by data structure (Arrays, etc.)
- **Unified ArrayVisualizer** - Single component for both sorting and searching
- **Shared hooks and components** - Reusable visualization infrastructure
- Core visualization engine with history/time-travel
- Responsive design (mobile/tablet/desktop)
- Three sorting algorithms with full explanations
- Four searching algorithms with full explanations
- Playback controls (play, pause, step forward, step backward)
- Speed and array size controls
- Algorithm selection separated from execution (Play button required)
- Vercel deployment with SPA routing

### Planned
- Additional sorting algorithms (Insertion, Selection, Heap, Radix)
- Linked List visualizations
- Tree visualizations (BST, traversals)
- Graph algorithms (Dijkstra's, BFS, DFS, A*)
- Hash Table visualizations

## TODO

### Phase 1 - Core Features

- [x] **Implement Searching Algorithms**
  - [x] Binary Search
  - [x] Linear Search
  - [x] Jump Search
  - [x] Interpolation Search

- [x] **Refactor to Data-Structure-Based Architecture**
  - [x] Unified ArrayVisualizer component
  - [x] Shared hooks (useVisualizationControls, useHistory, useAnimatedSleep)
  - [x] Shared UI components
  - [x] Updated routing (/arrays instead of /sorting and /searching)

- [ ] **Implement Additional Data Structures** (separate pages per structure)
  - [ ] Linked Lists (/linked-lists)
  - [ ] Trees (/trees)
  - [ ] Hash Tables (/hash-tables)
  - [ ] Graphs (/graphs)

- [ ] **Landing Page UI/UX Update** - Add visual separation between page categories
  - [ ] Create distinct section/graphic for Data Structures (Arrays, Linked Lists, Trees, Graphs, etc.)
  - [ ] Create distinct section/graphic for Blind 75 Challenge
  - [ ] Consider section headers, dividers, or card groupings to improve navigation clarity

- [ ] **Add Pseudocode** to X-Ray code viewer for sorting and searching algorithm pages

- [x] **Implement Monaco Editor** on Blind 75 problem pages

- [ ] **Implement Judge0 API** for Blind 75 solution checking (RapidAPI free tier)
  - [ ] Create Vercel serverless function to proxy Judge0 API calls
  - [ ] Add test cases data for each Blind 75 problem
  - [ ] Build "Run Code" and "Submit" UI buttons
  - [ ] Display test results (passed/failed, expected vs actual output)
  - [ ] Handle edge cases (TLE, runtime errors, compilation errors)

- [ ] **Implement Unique Visualizations** for each Blind 75 problem (placed above the Monaco code editor)

- [ ] **Implement Video Feature** on each Blind 75 problem page (narrated solutions)

- [ ] **Revamp UI** - Make the interface more visually pleasing

### Phase 2 - Firebase Integration

- [ ] **Implement User Accounts**
  - [ ] Google login option
  - [ ] Email/password authentication
  - [ ] Track Blind 75 problems completed
  - [ ] Spaced repetition reminders for problem review (1 day, 3 days, 7 days, 14 days, etc.) - user configurable

- [ ] **Complete Phase 2 (Firebase)**

### Phase 3 - Backend & Community

- [ ] **Add Forum** for users to connect, discuss whiteboarding, and practice for interviews together

- [ ] **Complete Phase 3 (Separate Backend)**

## Development Notes

- Algorithm logic is async with `sleep()` delays for animation
- Pause/cancel use refs (not state) for immediate effect in async loops
- History is cleared on reset or algorithm change
- Tailwind responsive breakpoints: sm (640px), lg (1024px)
- vercel.json rewrites handle client-side routing

## Claude Rules

- After completing any prompt that involves changes to the codebase, provide the recommended git commit message using the conventional commit format (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `test:`, `chore:`)
