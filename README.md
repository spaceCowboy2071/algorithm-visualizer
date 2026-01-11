# Algorithm Visualizer

An interactive web application for visualizing sorting and searching algorithms with real-time animations, step-by-step execution control, and live code visualization.

🌐 **Live Demo**: [https://algorithm-visualizer-swwu.vercel.app/](https://algorithm-visualizer-swwu.vercel.app/)

## 🚀 Features

### Interactive Visualizations
- **Real-time Animation**: Watch algorithms execute step-by-step with smooth, color-coded animations
- **Playback Controls**: Play, pause, reset, step forward, and step back through algorithm execution
- **History Navigation**: Travel backward through execution history to review previous steps
- **Speed Control**: Adjustable animation speed (0.25x - 2x) for detailed analysis or quick demonstrations
- **Visual Feedback**: Color-coded bars showing comparisons (yellow), sorted elements (green), and unsorted elements (blue)

### Algorithm Categories

#### Sorting Algorithms
- **Bubble Sort** - Simple comparison-based sort with O(n²) complexity
- **Quick Sort** - Efficient divide-and-conquer sort with O(n log n) average case
- **Merge Sort** - Stable divide-and-conquer sort with guaranteed O(n log n) performance

#### Searching Algorithms *(Coming Soon)*
- Binary Search
- Linear Search

### Educational Features
- **X-Ray Code Viewer**: Live code execution visualization
  - Line-by-line highlighting showing current execution point
  - Real-time variable state display
  - Support for JavaScript and Python implementations
  
- **Complexity Analysis Panel**: Comprehensive algorithm information
  - **How**: Step-by-step explanation of how the algorithm works
  - **When**: Best use cases and scenarios for each algorithm
  - **Where**: Real-world applications and common implementations
  - **Why**: Decision factors for choosing specific algorithms
  - Time complexity breakdown (Best, Average, Worst cases)
  - Space complexity analysis

- **Comparison Messaging**: Real-time feedback showing which elements are being compared

### Customization Options
- **Array Size Control**: Adjustable array size (1-10 elements) with slider
- **Random Array Generation**: Generate new random arrays on demand
- **Language Toggle**: Switch between JavaScript and Python code examples

### Responsive Design
- Mobile-friendly interface with adaptive layouts
- Touch-optimized controls for mobile devices
- Seamless experience across desktop, tablet, and mobile

## 🎯 Upcoming Features

### Blind 75 Challenge *(In Development)*
A comprehensive LeetCode interview preparation platform featuring:
- **75 Curated Problems**: The complete Blind 75 list organized by category
  - Arrays, Strings, Trees, Graphs, Dynamic Programming, and more
- **Category-based Navigation**: Filter problems by topic
- **Difficulty Badges**: Color-coded Easy, Medium, Hard indicators
- **20-Minute Timer**: Built-in countdown timer for interview simulation
- **Progress Tracking**: Mark problems as completed, track "solved in 20 minutes"
- **Code Playground**: Integrated Monaco editor (VS Code) for solving problems
- **Visual Execution**: Step-by-step visualization of problem solutions
- **Personal Notes**: Add notes and insights for each problem
- **localStorage Persistence**: Track your progress across sessions

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast, modern development environment)
- **Styling**: Tailwind CSS v4 (utility-first CSS framework)
- **Routing**: React Router v6 (client-side navigation)
- **Language**: TypeScript (type-safe JavaScript)
- **Deployment**: Vercel (continuous deployment from GitHub)

## 🎯 Purpose

This project demonstrates:
- Modern React development practices with functional components and hooks
- TypeScript for type safety and better developer experience
- Advanced state management for complex UI interactions (history tracking, playback controls)
- Algorithm implementation and complexity analysis
- Real-time visualization techniques
- Responsive design principles with Tailwind CSS
- Performance optimization for smooth animations

## 🏃 Getting Started

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

## 📦 Build for Production
```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## 🎓 Learning Outcomes

Building this project helped me develop skills in:
- Component-based architecture and reusable UI patterns
- Algorithm implementation and time/space complexity analysis
- Advanced state management with React hooks (useState, useEffect, useRef)
- TypeScript generics and type inference
- Performance optimization for smooth animations
- History tracking and time-travel debugging patterns
- Modern development tooling (Vite, ESLint, TypeScript)
- Deployment automation with Vercel
- Responsive design and mobile optimization

## 🔮 Future Enhancements

- [ ] **Blind 75 Challenge** - Full interview prep platform with 75 problems
- [ ] More sorting algorithms (Insertion Sort, Selection Sort, Heap Sort, Radix Sort)
- [ ] Graph algorithms (Dijkstra's, BFS, DFS, A*)
- [ ] Tree traversal visualizations (In-order, Pre-order, Post-order)
- [ ] Data structure visualizations (Stacks, Queues, Hash Tables)
- [ ] Algorithm comparison mode (side-by-side performance)
- [ ] Custom input mode (enter your own array)
- [ ] Export/share visualizations
- [ ] Dark/Light theme toggle
- [ ] Performance metrics dashboard (comparisons, swaps, time elapsed)

## 📊 Project Status

✅ **Completed Features**:
- Bubble Sort, Quick Sort, Merge Sort implementations
- X-Ray Code Viewer with line highlighting
- Complexity analysis panels
- Step forward/backward navigation
- Animation speed controls
- Responsive design

🔄 **In Progress**:
- Blind 75 Challenge platform
- Additional sorting algorithms

⏳ **Planned**:
- Search algorithms
- Graph visualizations
- Data structure implementations

## 📄 License

MIT License - feel free to use this project for learning purposes.

## 🤝 Contributing

This is a personal learning project, but suggestions and feedback are welcome!

---

**Built with** ❤️ **for learning and demonstrating modern web development practices**

**Live at**: [algorithm-visualizer-swwu.vercel.app](https://algorithm-visualizer-swwu.vercel.app/)