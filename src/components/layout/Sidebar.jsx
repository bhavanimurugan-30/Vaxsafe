import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  Boxes,
  QrCode,
  Thermometer,
  AlertTriangle,
  Route,
  UserCheck,
  LogOut,
  Shield,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar({ currentPage, onNavigate, mobileOpen, setMobileOpen }) {
  const { logout, currentUser } = useAuth();
  const { stats } = useData();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Operations Overview'
    },
    {
      id: 'vaccines',
      label: 'Vaccine Inventory',
      icon: Boxes,
      badge: stats.totalVaccines > 0 ? stats.totalVaccines : null,
      description: 'Batches & Custody'
    },
    {
      id: 'qr-scanner',
      label: 'QR Scanner & Transit',
      icon: QrCode,
      description: 'Scan & Transfer'
    },
    {
      id: 'temperature',
      label: 'Temperature Log',
      icon: Thermometer,
      description: 'Cold-Chain Telemetry'
    },
    {
      id: 'breach-alerts',
      label: 'Breach Alerts',
      icon: AlertTriangle,
      badge: stats.activeBreachesCount > 0 ? stats.activeBreachesCount : null,
      badgeVariant: 'danger',
      description: 'Thermal Violations'
    },
    {
      id: 'rerouting',
      label: 'Smart Rerouting',
      icon: Route,
      description: 'Haversine Proximity'
    },
    {
      id: 'profile',
      label: 'Facility Profile',
      icon: UserCheck,
      description: 'Staff & Cold Rooms'
    }
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                VaxSafe
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                  OPS
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">Cold-Chain Network</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Logistics Console
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left group ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      item.badgeVariant === 'danger'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : isActive
                        ? 'bg-teal-800 text-teal-100'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Identity & Logout Footer */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/40">
          <div className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-800 mb-2">
            <div className="text-[11px] font-semibold text-white truncate">
              {currentUser?.name || 'Healthcare Operator'}
            </div>
            <div className="text-[10px] text-teal-400 font-mono truncate">
              {currentUser?.clinicId || 'clinic-a'}
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Workstation</span>
          </button>
        </div>
      </aside>
    </>
  );
}
