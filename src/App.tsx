import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import SortingPage from './pages/SortingPage';
import Blind75Page from './pages/Blind75Page';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sorting" element={<SortingPage />} />
        <Route path="/blind75" element={<Blind75Page />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;