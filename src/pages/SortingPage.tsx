import { Link } from 'react-router-dom';
import ArrayVisualizer from '../components/ArrayVisualizer';

function SortingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <Link 
          to="/"
          className="text-blue-400 hover:text-blue-300 transition"
        >
          ← Back to Home
        </Link>
        
        <h1 className="text-3xl font-bold">
          Sorting Algorithms
        </h1>
        
        {/* Spacer for balance */}
        <div className="w-32"></div>
      </div>

      {/* Main Content */}
      <ArrayVisualizer />
    </div>
  );
}

export default SortingPage;