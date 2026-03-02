import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SmoothScroll } from './components/layout/SmoothScroll';
import ArchRender from './pages/ArchRender';
import ArchVizLanding from './pages/ArchVizLanding';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ArchVizLanding />} />
        <Route path="/arch-render" element={<ArchRender />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
