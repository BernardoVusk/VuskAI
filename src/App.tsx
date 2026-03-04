import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SmoothScroll } from './components/layout/SmoothScroll';
import ArchRender from './pages/ArchRender';
import ArchVizLanding from './pages/ArchVizLanding';
import * as fbq from './lib/pixel';

const PixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (fbq.FB_PIXEL_ID) {
      // Initialize only once
      if (!(window as any).fb_initialized) {
        window.fbq('init', fbq.FB_PIXEL_ID);
        (window as any).fb_initialized = true;
      }
      fbq.pageview();
    }
  }, [location]);

  return null;
};

const App = () => {
  return (
    <BrowserRouter>
      <PixelTracker />
      <Routes>
        <Route path="/" element={<ArchVizLanding />} />
        <Route path="/arch-render" element={<ArchRender />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
