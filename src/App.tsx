import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import SortingPage from './pages/SortingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sorting" element={<SortingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;