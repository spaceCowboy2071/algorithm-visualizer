# Algorithm Visualizer

An interactive web application for visualizing algorithms and data structures with real-time animations, step-by-step execution control, and live code visualization — wrapped in a retro IBM CRT terminal aesthetic with green/amber phosphor theme toggle.

**Live Demo**: [https://algorithm-visualizer-swwu.vercel.app/](https://algorithm-visualizer-swwu.vercel.app/)

## Features

### Interactive Visualizations
- **Real-time Animation**: Watch algorithms execute step-by-step with smooth, color-coded animations
- **Playback Controls**: Play, pause, reset, step forward, and step back through algorithm execution
- **History Navigation**: Travel backward through execution history to review previous steps
- **Speed Control**: Adjustable animation speed (0.25x - 2x) for detailed analysis or quick demonstrations
- **Visual Feedback**: Color-coded bars showing comparisons (yellow), sorted/found elements (green), eliminated elements (gray), and default elements (accent color)

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
- Interactive linked list operations (Insert Head/Tail, Delete, Search, Reverse)
- Dynamically sized nodes based on container width

#### Trees (BST)
- Binary Search Tree operations (Insert, Search, Delete)
- 4 traversal algorithms (Inorder, Preorder, Postorder, Level-Order)
- SVG tree rendering with animated node highlighting

#### Hash Tables
- Two collision strategies: Chaining and Linear Probing
- Insert, Search, Delete operations with step-by-step hash computation
- SVG horizontal bucket layout

#### Graphs
- BFS, DFS, Dijkstra's Shortest Path, Topological Sort (Kahn's)
- Directed/undirected and weighted/unweighted toggles
- Start/target node selection, circular graph layout
- SVG rendering with animated node/edge highlighting and distance labels

### Blind 75 Challenge
A comprehensive LeetCode interview preparation platform featuring:
- **75 Curated Problems**: The complete Blind 75 list organized by category (Arrays, Strings, Trees, Graphs, Dynamic Programming, and more)
- **Category-based Navigation**: Filter problems by topic with pattern labels (e.g., "Two Pointers", "Hash Map", "DFS / BFS")
- **Difficulty Badges**: Color-coded Easy, Medium, Hard indicators
- **Code Playground**: Integrated Monaco editor (VS Code) for solving problems, with time/space complexity inputs below the editor
- **Interactive Visualizers**: Step-through HTML visualizers for select problems with animated state, live code highlighting, and complexity analysis (24 of 75 complete)
- **Study Tracker**: Rich per-problem progress tracking — status (Not Started / Studied / In Progress / Review Needed / Solved), confidence level (1-5), solved independently, solved under 20 min, attempt count (auto-incremented), notes, and complexity analysis
- **Dashboard**: Aggregate stats overlay with solved/studied/in-progress counts, average confidence, completion percentage, and per-category progress bars
- **Progress Overlay**: Centered modal on each problem page for quick status/confidence updates without leaving the editor
- **Sketch Zone**: Draggable, resizable whiteboard window on every problem page for sketching algorithm approaches. HTML5 Canvas + perfect-freehand brush, 5 tools (pencil, brush, rectangle, circle, line), 8-color paper-friendly ink palette, 3 stroke sizes, undo/redo/clear, inline rename, server-persisted per problem (sign in to save)

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

### CRT Terminal Aesthetic
- **IBM CRT Monitor** landing page with bezel, branded header, BIOS menu, and monitor stand (desktop)
- **Flat CRT Screen** layout for mobile with scanlines and vignette overlays
- **COLOR Button**: Toggle between green and amber phosphor theme (persisted in localStorage)
- **CONTRAST Button**: Toggle CRT effects (scanlines + vignette) on/off
- **Terminal Title Bars**: `terminal@algorithmviz/{page}` style on all pages
- **Keyboard Navigation**: Arrow keys + Enter to navigate landing page menu
- **Unified Dark Palette**: Consistent #0d1117 / #161b22 / #30363d across all pages

### Responsive Design
- Mobile-friendly interface with adaptive layouts
- Touch-optimized controls for mobile devices
- Seamless experience across desktop, tablet, and mobile

## Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript 5.9
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router v7
- **Code Editor**: Monaco Editor (VS Code)
- **Drawing**: HTML5 Canvas + perfect-freehand (smoothed brush strokes for the Sketch Zone)
- **Deployment**: Vercel

### Backend
- **Server**: Node.js + Express 5 + TypeScript
- **Database**: PostgreSQL 16 on AWS RDS (via `pg` connection pool)
- **Auth**: JWT + bcrypt + Google OAuth + refresh token rotation
- **Validation**: Zod (runtime request validation)
- **Security**: express-rate-limit, httpOnly cookies, SHA-256 token hashing
- **Containerization**: Docker (multi-stage build, ECR image registry)
- **Deployment**: AWS EC2 (t2.micro) + RDS (db.t3.micro) + CloudFront (HTTPS/SSL)

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

**Completed (Frontend)**:
- All 5 data structure pages: Arrays, Linked Lists, Trees, Hash Tables, Graphs
- Sorting algorithms: Bubble Sort, Quick Sort, Merge Sort
- Searching algorithms: Binary Search, Linear Search, Jump Search, Interpolation Search
- Graph algorithms: BFS, DFS, Dijkstra's, Topological Sort
- CRT terminal UI redesign — IBM monitor bezel landing page, green/amber theme toggle, scanlines/vignette toggle, unified dark palette, terminal title bars
- Theme system — React context + CSS custom properties, localStorage persistence
- Blind 75 study tracker with status/confidence/attempts/notes, dashboard overlay, and per-problem progress overlay
- Monaco code editor with browser-based code execution (Web Worker + Pyodide for Python, native Function() for JavaScript)
- Time/space complexity validation with pair matching for all 75 problems
- 24 interactive HTML problem visualizers across Arrays, Graphs, Linked Lists, Strings, and Trees
- Sketch Zone — draggable/resizable whiteboard window on every problem page (5 tools, 8-ink paper palette, 3 sizes, undo/redo, inline rename, server-persisted per problem)
- X-Ray Code Viewer with line highlighting (JS + Python + Pseudocode)
- Complexity analysis panels (How/When/Where/Why)
- Step forward/backward time-travel navigation
- Animation speed controls
- Responsive design
- Vercel deployment with SPA routing

**Completed (Backend)**:
- Express 5 + TypeScript server with PostgreSQL connection pool and health check endpoint
- Docker Compose for local development (PostgreSQL 16 with auto-migration)
- Database schema: users, progress, refresh_tokens, and sketches tables
- Full authentication system: signup, login, Google OAuth, refresh token rotation with reuse detection
- JWT access tokens (15 min) + httpOnly refresh token cookies (7 days)
- bcrypt password hashing (salt rounds 12)
- Zod runtime request validation on all routes
- Rate limiting on auth routes (10 req / 15 min per IP)
- JWT authentication middleware for protected routes
- Progress CRUD routes: GET all/single/dashboard + PUT upsert with COALESCE partial updates
- Sketches CRUD routes: GET (with empty-default fallback), PUT (upsert), DELETE (idempotent), envelope-only validation with bloat caps
- Integration tests: 64 tests (Vitest + Supertest) covering auth, progress, and sketches routes including per-user data isolation
- Frontend auth integration: API service with silent refresh, AuthContext, BIOS login screen
- Tracker server sync: auth-aware store, hydration on login, fire-and-forget PUT on changes
- AWS deployment: EC2 (Express Docker container) + RDS (PostgreSQL) + CloudFront (HTTPS) + ECR (image registry)
- Multi-stage Dockerfile with production-only dependencies (~110-130MB image)
- GitHub Actions CI/CD: two-job pipeline (lint + integration tests against ephemeral PostgreSQL → Docker build + ECR push + SSH deploy to EC2)
- Cross-device progress persistence — sign in on any device, pick up where you left off

**Planned**:
- Additional sorting algorithms (Insertion, Selection, Heap, Radix)
- Remaining Blind 75 HTML problem visualizers (24 of 75 complete)
- Password reset flow (SendGrid)
- Spaced repetition reminders for problem review

## License

MIT License - feel free to use this project for learning purposes.

---

**Built with React 19, TypeScript, and Tailwind CSS**

**Live at**: [algorithm-visualizer-swwu.vercel.app](https://algorithm-visualizer-swwu.vercel.app/)
