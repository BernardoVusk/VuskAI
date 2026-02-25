import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SmoothScroll } from './components/layout/SmoothScroll';
import VuskAI from './pages/VuskAI';
import AdminDashboard from './pages/AdminDashboard';
import ArchVizLanding from './pages/ArchVizLanding';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ArchVizLanding />} />
        <Route path="/vusk-ai" element={<VuskAI />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
