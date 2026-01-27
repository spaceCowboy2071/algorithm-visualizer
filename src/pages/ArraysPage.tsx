import ArrayVisualizer from '../components/visualizers/ArrayVisualizer';

function ArraysPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ArrayVisualizer initialMode="sorting" />
    </div>
  );
}

export default ArraysPage;
