import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import PageLoader from './components/PageLoader';
import ScrollToTop from './components/ScrollToTop';

function RouteMotion({ children }) {
  const location = useLocation();
  return <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .16 }} className="route-stage">{children}</motion.div>;
}

function SoftRouteLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
    const id = window.setTimeout(() => setVisible(false), 390);
    return () => window.clearTimeout(id);
  }, [location.pathname]);
  return visible ? <PageLoader key={location.pathname} /> : null;
}

export default function App() {
  return <>
    <ScrollToTop />
    <SoftRouteLoader />
    <Routes>
      <Route path="/" element={<RouteMotion><HomePage /></RouteMotion>} />
      <Route path="/projects/:slug" element={<RouteMotion><ProjectDetailPage /></RouteMotion>} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>;
}
