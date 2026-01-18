import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import SortingPage from './pages/SortingPage';
import SearchingPage from './pages/SearchingPage';
import Blind75Page from './pages/Blind75Page';
import ProblemPage from './pages/ProblemPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sorting" element={<SortingPage />} />
        <Route path="/searching" element={<SearchingPage />} />
        <Route path="/blind75" element={<Blind75Page />} />
        <Route path="/blind75/problem/:id" element={<ProblemPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;