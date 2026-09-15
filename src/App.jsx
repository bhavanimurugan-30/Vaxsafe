import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import ClinicRegistrationPage from './pages/ClinicRegistrationPage';
import DashboardPage from './pages/DashboardPage';
import VaccinesPage from './pages/VaccinesPage';
import QRScannerPage from './pages/QRScannerPage';
import TemperaturePage from './pages/TemperaturePage';
import BreachAlertsPage from './pages/BreachAlertsPage';
import SmartReroutingPage from './pages/SmartReroutingPage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authView, setAuthView] = useState('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-300">
          Initializing VaxSafe Cold-Chain Network Console...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    if (authView === 'register') {
      return <ClinicRegistrationPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  return (
    <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'dashboard' && <DashboardPage onNavigate={setCurrentPage} />}
      {currentPage === 'vaccines' && <VaccinesPage />}
      {currentPage === 'qr-scanner' && <QRScannerPage />}
      {currentPage === 'temperature' && <TemperaturePage />}
      {currentPage === 'breach-alerts' && <BreachAlertsPage onNavigate={setCurrentPage} />}
      {currentPage === 'rerouting' && <SmartReroutingPage />}
      {currentPage === 'profile' && <ProfilePage />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  );
}
