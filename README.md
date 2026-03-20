# Algorithm Visualizer

An interactive web application for visualizing sorting and searching algorithms with real-time animations, step-by-step execution control, and live code visualization.

**Live Demo**: [https://algorithm-visualizer-swwu.vercel.app/](https://algorithm-visualizer-swwu.vercel.app/)

## Features

### Interactive Visualizations
- **Real-time Animation**: Watch algorithms execute step-by-step with smooth, color-coded animations
- **Playback Controls**: Play, pause, reset, step forward, and step back through algorithm execution
- **History Navigation**: Travel backward through execution history to review previous steps
- **Speed Control**: Adjustable animation speed (0.25x - 2x) for detailed analysis or quick demonstrations
- **Visual Feedback**: Color-coded bars showing comparisons (yellow), sorted/found elements (green), eliminated elements (gray), and unsorted elements (blue)

### Algorithm Categories

#### Sorting Algorithms
- **Bubble Sort** - Simple comparison-based sort with O(n²) complexity
- **Quick Sort** - Efficient divide-and-conquer sort with O(n log n) average case
- **Merge Sort** - Stable divide-and-conquer sort with guaranteed O(n log n) performance

#### Searching Algorithms
- **Binary Search** - Efficient O(log n) search on sorted arrays
- **Linear Search** - Sequential O(n) search
- **Jump Search** - Block-based O(√n) search on sorted arrays
- **Interpolation Search** - Probe-based search with O(log log n) average case on uniformly distributed data

### Data Structure Visualizations

#### Linked Lists
- Interactive linked list operations and traversals
- Dynamically sized nodes based on container width

### Blind 75 Challenge
A comprehensive LeetCode interview preparation platform featuring:
- **75 Curated Problems**: The complete Blind 75 list organized by category (Arrays, Strings, Trees, Graphs, Dynamic Programming, and more)
- **Category-based Navigation**: Filter problems by topic
- **Difficulty Badges**: Color-coded Easy, Medium, Hard indicators
- **Code Playground**: Integrated Monaco editor (VS Code) for solving problems
- **Interactive Visualizers**: Step-through HTML visualizers for select problems with animated state, live code highlighting, and complexity analysis (6 of 75 complete)
- **Progress Tracking**: Mark problems as completed with localStorage persistence

### Educational Features
- **X-Ray Code Viewer**: Live code execution visualization
  - Line-by-line highlighting showing current execution point
  - Support for JavaScript and Python implementations

- **Complexity Analysis Panel**: Comprehensive algorithm information
  - **How**: Step-by-step explanation of how the algorithm works
  - **When**: Best use cases and scenarios for each algorithm
  - **Where**: Real-world applications and common implementations
  - **Why**: Decision factors for choosing specific algorithms
  - Time complexity breakdown (Best, Average, Worst cases)
  - Space complexity analysis

### Customization Options
- **Array Size Control**: Adjustable array size with slider
- **Random Array Generation**: Generate new random arrays (unsorted for sorting, sorted for searching)
- **Language Toggle**: Switch between JavaScript and Python code examples

### Responsive Design
- Mobile-friendly interface with adaptive layouts
- Touch-optimized controls for mobile devices
- Seamless experience across desktop, tablet, and mobile

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript 5.9
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router v7
- **Code Editor**: Monaco Editor (VS Code)
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/algorithm-visualizer.git
cd algorithm-visualizer
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Build for Production
```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## Project Status

**Completed**:
- Sorting algorithms: Bubble Sort, Quick Sort, Merge Sort
- Searching algorithms: Binary Search, Linear Search, Jump Search, Interpolation Search
- Unified ArrayVisualizer with mode switching (sorting/searching)
- Linked Lists page with interactive visualization
- Blind 75 problem tracker with Monaco code editor
- 6 interactive HTML problem visualizers (Two Sum, Container With Most Water, Maximum Subarray, Product of Array Except Self, Clone Graph, Number of Islands)
- X-Ray Code Viewer with line highlighting (JS + Python)
- Complexity analysis panels (How/When/Where/Why)
- Step forward/backward time-travel navigation
- Animation speed controls
- Responsive design
- Vercel deployment with SPA routing

**In Progress**:
- Remaining Blind 75 HTML visualizers (69 of 75)
- Judge0 API integration for code submission
- Full Blind 75 study tracker (status, confidence, attempts, notes, dashboard)

**Planned**:
- Additional sorting algorithms (Insertion, Selection, Heap, Radix)
- Tree visualizations (BST, traversals)
- Graph algorithms (Dijkstra's, BFS, DFS, A*)
- Hash Table visualizations
- User accounts with Firebase authentication
- Spaced repetition reminders for problem review

## License

MIT License - feel free to use this project for learning purposes.

---

**Built with React 19, TypeScript, and Tailwind CSS**

**Live at**: [algorithm-visualizer-swwu.vercel.app](https://algorithm-visualizer-swwu.vercel.app/)
