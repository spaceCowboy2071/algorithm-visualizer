import { Link } from 'react-router-dom';
import ArrayVisualizer from '../components/ArrayVisualizer';

function SortingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link 
        to="/"
        className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
      >
        ← Back to Home
      </Link>
      
      <h1 className="text-4xl font-bold text-center mb-8">
        Sorting Algorithms
      </h1>
      
      <ArrayVisualizer />
    </div>
  );
}

export default SortingPage;