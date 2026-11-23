import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { UIProvider } from './contexts/UIContext';
import { PublicOnly, RequireAuth } from './components/auth/RouteGuards';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Resources } from './pages/Resources';
import { Workloads } from './pages/Workloads';
import { Queue } from './pages/Queue';
import { Allocations } from './pages/Allocations';
import { Monitoring } from './pages/Monitoring';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <UIProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
                <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
                <Route path="/app" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                  <Route index element={<Dashboard />} />
                  <Route path="resources" element={<Resources />} />
                  <Route path="workloads" element={<Workloads />} />
                  <Route path="queue" element={<Queue />} />
                  <Route path="allocations" element={<Allocations />} />
                  <Route path="monitoring" element={<Monitoring />} />
                  <Route path="activity" element={<Activity />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </BrowserRouter>
          </UIProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>);

}