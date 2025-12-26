import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">
          Algorithm Visualizer
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Learn algorithms through interactive visualizations
        </p>
        
        <div className="flex gap-6 justify-center">
          <Link 
            to="/sorting"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-lg font-semibold transition"
          >
            Sorting Algorithms
          </Link>
          
          <Link 
            to="/searching"
            className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg text-lg font-semibold transition"
          >
            Searching Algorithms
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Landing;