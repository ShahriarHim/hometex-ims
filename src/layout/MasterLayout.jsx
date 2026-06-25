import { useState, useCallback, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Nav from './Nav';
import Sidebar from './Sidebar';
import Footer from './Footer';
import LoadingSpinner from '../shared/components/LoadingSpinner';

export default function MasterLayout() {
  // Desktop: open by default. Mobile: closed by default (CSS handles transform).
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // app-shell gets different class depending on viewport:
  // - mobile:  sidebar-open = visible, no class = hidden (CSS: transform -240px)
  // - desktop: sidebar-hidden = hidden, no class = visible
  const shellClass = `app-shell${sidebarOpen ? ' sidebar-open' : ' sidebar-hidden'}`;

  return (
    <div className={shellClass}>
      <Sidebar />

      {/* Mobile backdrop — click to close */}
      <div className="sidebar-overlay" onClick={closeSidebar} />

      <div className="app-body">
        <Nav onToggle={toggleSidebar} />
        <main className="app-content">
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </div>
  );
}
