import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import { Shield, Lock, Mail, Building2, ArrowRight, ShieldCheck } from 'lucide-react';
import { DEMO_ACCOUNTS } from '../services/seedData';

export default function LoginPage({ onSwitchToRegister }) {
  const { login, switchDemoAccount, isFirebaseConfigured } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('admin@clinic-a.vaxsafe.org');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast.success(`Welcome back, ${res.user.name}. Logged into ${res.user.clinicName}.`);
    } else {
      setError(res.error || 'Authentication failed. Please verify your credentials.');
      toast.error('Authentication failed: ' + (res.error || 'Invalid credentials'));
    }
  };

  const handleQuickLogin = async (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setLoading(true);
    await switchDemoAccount(account.email);
    setLoading(false);
    toast.success(`Authenticated as ${account.name} (${account.clinicName})`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-800 flex items-center justify-center text-white shadow-md mb-3">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          VaxSafe Operations Portal
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Vaccine Cold-Chain Tracking, Breach Telemetry & Logistics System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@clinic.vaxsafe.org"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Sign In to Facility Terminal
              </Button>
            </div>
          </form>

          {/* Quick Demo Logins for Immediate Review */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
              Quick Switch Demonstration Workstations
            </div>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="w-full text-left p-2 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 group-hover:text-teal-700 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {acc.clinicName.split('-')[0].trim()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {acc.name} • {acc.role}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-700" />
                </button>
              ))}
            </div>
          </div>

          {/* New Clinic Registration */}
          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500">New facility onboarding onto the network? </span>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              Register your clinic
            </button>
          </div>
        </div>

        {/* Security and Mode notice */}
        <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>
            {isFirebaseConfigured
              ? 'Connected to Live Firebase Cloud Services'
              : 'Enterprise Resilient Local Operations Mode Active'}
          </span>
        </div>
      </div>
    </div>
  );
}
