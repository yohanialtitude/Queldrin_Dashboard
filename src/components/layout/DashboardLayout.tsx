import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CreateRecordModals } from '../forms/CreateRecordModals';
import { WorkloadDetailModal } from '../workloads/WorkloadDetailModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';

export function DashboardLayout() {
  const { theme } = useTheme();
  const { loading, error, retryLoad } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className={theme === 'dark' ? 'dark' : ''} style={{ colorScheme: theme }}>
      <div className="flex min-h-screen w-full bg-bg font-sans text-ink">
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMobile={() => setMobileOpen(true)} />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <div className="dashboard-content mx-auto w-full min-w-0 max-w-[1440px]">
              {loading && (
                <p className="mb-4 rounded-xl border border-info/20 bg-info/5 px-4 py-3 text-sm text-ink-soft" role="status">
                  Showing demo data while your private Firestore workspace loads…
                </p>
              )}
              {error && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3" role="alert">
                  <p className="text-sm text-ink-soft">
                    Firestore is unavailable. Showing demo data. {error}
                  </p>
                  <button type="button" className="btn-secondary btn-sm" onClick={retryLoad}>Retry connection</button>
                </div>
              )}
              <Outlet />
            </div>
          </main>
        </div>
        <CreateRecordModals />
        <WorkloadDetailModal />
        <Toaster position="bottom-right" theme={theme} richColors closeButton />
      </div>
    </div>);

}