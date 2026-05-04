import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import ArraysPage from './pages/ArraysPage';
import LinkedListsPage from './pages/LinkedListsPage';
import TreesPage from './pages/TreesPage';
import HashTablesPage from './pages/HashTablesPage';
import GraphsPage from './pages/GraphsPage';
import Blind75Page from './pages/Blind75Page';
import ProblemPage from './pages/ProblemPage';
import WhiteBoardPage from './pages/WhiteBoardPage';

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/arrays" element={<ArraysPage />} />
        <Route path="/linked-lists" element={<LinkedListsPage />} />
        <Route path="/trees" element={<TreesPage />} />
        <Route path="/hash-tables" element={<HashTablesPage />} />
        <Route path="/graphs" element={<GraphsPage />} />
        <Route path="/blind75" element={<Blind75Page />} />
        <Route path="/blind75/problem/:id" element={<ProblemPage />} />
        <Route path="/whiteboard" element={<WhiteBoardPage />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;