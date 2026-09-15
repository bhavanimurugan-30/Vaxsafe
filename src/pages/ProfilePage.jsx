import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  User,
  Building2,
  MapPin,
  Phone,
  ShieldCheck,
  Zap,
  Thermometer,
  Layers,
  Save,
  LogOut
} from 'lucide-react';
import { saveUserProfile } from '../services/dataService';

export default function ProfilePage() {
  const { currentUser, clinic, logout, isFirebaseConfigured, switchClinic } = useAuth();
  const { allClinics } = useData();
  const toast = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [role, setRole] = useState(currentUser?.role || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveUserProfile(currentUser.uid, {
        name,
        role,
        email: currentUser.email,
        clinicId: currentUser.clinicId,
        clinicName: currentUser.clinicName
      });
      currentUser.name = name;
      currentUser.role = role;
      toast.success('Operator profile successfully updated.');
    } catch (err) {
      toast.error('Failed to update profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-teal-700" />
            Operator Credentials & Facility Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authenticated session identity and cold-chain facility terminal configuration.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={LogOut} onClick={logout}>
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Account Settings */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-700" />
            Staff Identity
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Authorized Email
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Operator Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Cold-Chain Operational Role
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={Save}
                loading={isSaving}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>

          {/* System Environment State */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
            <div className="flex justify-between">
              <span>Backend Engine:</span>
              <span className="font-semibold text-teal-800">
                {isFirebaseConfigured ? 'Firebase Cloud Firestore' : 'Enterprise Local State Engine'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Security Compliance:</span>
              <span className="font-mono text-emerald-700 font-medium">CDC VFC / WHO PQS</span>
            </div>
          </div>
        </div>

        {/* Facility Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-700" />
            Assigned Medical Facility
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold block">Facility Name</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{clinic?.name}</span>
            </div>

            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold block">Facility Address</span>
              <span className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {clinic?.address}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Latitude</span>
                <span className="font-mono font-medium text-slate-800">{clinic?.lat}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Longitude</span>
                <span className="font-mono font-medium text-slate-800">{clinic?.lng}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Cold Storage Capacity</span>
                <span className="font-medium text-slate-800">{clinic?.coldStorageCapacity}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Certified Range</span>
                <span className="font-mono font-medium text-teal-800">{clinic?.certifiedRange}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 uppercase text-[10px] font-semibold block">Backup Emergency Power</span>
              <span className="font-medium text-emerald-700 flex items-center gap-1 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {clinic?.backupGenerator}
              </span>
            </div>

            {/* Quick Facility Switch */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Switch Workstation Facility (Operations Testing)
              </label>
              <select
                value={clinic?.id}
                onChange={(e) => switchClinic(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {allClinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
