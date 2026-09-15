import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Building2,
  AlertTriangle,
  LogOut,
  ChevronDown,
  User,
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function Header({ onNavigate, currentPage }) {
  const { currentUser, clinic, logout, switchClinic } = useAuth();
  const { stats, allClinics, sensorState } = useData();
  const [clinicMenuOpen, setClinicMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 h-16 px-4 sm:px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Left: Facility Indicator */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setClinicMenuOpen(!clinicMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
            title="Switch Clinic View for Multi-Facility Operations"
          >
            <div className="w-8 h-8 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Facility</div>
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                {clinic?.name || currentUser?.clinicName || 'Clinic A - Metro Central General Hospital'}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </button>

          {/* Clinic Switcher Dropdown */}
          {clinicMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setClinicMenuOpen(false)} />
              <div className="absolute left-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-30">
                <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                  Select Facility Workstation
                </div>
                {allClinics.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      switchClinic(c.id);
                      setClinicMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-xs hover:bg-slate-50 flex items-center justify-between ${
                      (clinic?.id === c.id) ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{c.name}</div>
                      <div className="text-slate-500 text-[11px]">{c.address}</div>
                    </div>
                    {clinic?.id === c.id && (
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Cold-Chain Telemetry Pill */}
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs">
          <span className="text-slate-500">Storage Core:</span>
          <span
            className={`px-2 py-0.5 rounded font-mono font-medium flex items-center gap-1.5 ${
              stats.isBreached
                ? 'bg-rose-100 text-rose-800 animate-pulse'
                : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            <Radio className="w-3 h-3" />
            {stats.currentTemp.toFixed(1)}°C
            <span className="text-[10px] font-sans font-semibold uppercase">
              ({stats.tempStatus})
            </span>
          </span>
        </div>
      </div>

      {/* Right: Breach Alerts & User Menu */}
      <div className="flex items-center gap-3">
        {/* Active Breach Warning Button */}
        <button
          onClick={() => onNavigate('breach-alerts')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            stats.activeBreachesCount > 0
              ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
          title="Active Breach Alerts"
        >
          <AlertTriangle className={`w-4 h-4 ${stats.activeBreachesCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          <span>
            {stats.activeBreachesCount > 0
              ? `${stats.activeBreachesCount} Active Breach${stats.activeBreachesCount > 1 ? 's' : ''}`
              : 'Zero Active Breaches'}
          </span>
        </button>

        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-medium text-slate-900 leading-tight">
                {currentUser?.name || currentUser?.email}
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">
                {currentUser?.role || 'Healthcare Staff'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-medium text-slate-900">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                </div>
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Facility Profile & Settings
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => {
                    logout();
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
