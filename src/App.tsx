import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SmoothScroll } from './components/layout/SmoothScroll';
import VuskAI from './pages/VuskAI';
import AdminDashboard from './pages/AdminDashboard';

const App = () => {
  return (
    <SmoothScroll>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<VuskAI />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </SmoothScroll>
  );
};

export default App;
