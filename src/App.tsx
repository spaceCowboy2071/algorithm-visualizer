import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import ArraysPage from './pages/ArraysPage';
import LinkedListsPage from './pages/LinkedListsPage';
import TreesPage from './pages/TreesPage';
import Blind75Page from './pages/Blind75Page';
import ProblemPage from './pages/ProblemPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/arrays" element={<ArraysPage />} />
        <Route path="/linked-lists" element={<LinkedListsPage />} />
        <Route path="/trees" element={<TreesPage />} />
        <Route path="/blind75" element={<Blind75Page />} />
        <Route path="/blind75/problem/:id" element={<ProblemPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;