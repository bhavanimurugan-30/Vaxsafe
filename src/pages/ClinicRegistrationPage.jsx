import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import {
  getCurrentPosition,
  reverseGeocode,
  isValidLatitude,
  isValidLongitude
} from '../services/geolocation';
import {
  Shield,
  Lock,
  Mail,
  Building2,
  MapPin,
  Navigation,
  Snowflake,
  ShieldCheck,
  ArrowLeft,
  LocateFixed,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ClinicRegistrationPage({ onSwitchToLogin }) {
  const { registerClinic, isFirebaseConfigured } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    clinicName: '',
    email: '',
    password: '',
    location: '',
    latitude: '',
    longitude: '',
    coldStorageCapacity: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | detecting | success | error
  const [locationMessage, setLocationMessage] = useState('');

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleUseCurrentLocation = async () => {
    setLocationStatus('detecting');
    setLocationMessage('');
    setError('');

    try {
      const { latitude, longitude } = await getCurrentPosition();

      if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
        setLocationStatus('error');
        setLocationMessage('The detected coordinates were out of valid range. Please enter the location manually.');
        toast.error('Detected coordinates were invalid. Please enter the location manually.');
        return;
      }

      const latStr = latitude.toFixed(6);
      const lngStr = longitude.toFixed(6);

      // Fill latitude/longitude immediately — they remain editable afterward.
      setForm((prev) => ({ ...prev, latitude: latStr, longitude: lngStr }));

      try {
        const address = await reverseGeocode(latitude, longitude);
        setForm((prev) => ({ ...prev, location: address }));
        setLocationStatus('success');
        setLocationMessage('Location detected. Review the fields below and edit if needed.');
        toast.success('Current location detected and filled in.');
      } catch (geocodeErr) {
        // Coordinates were detected successfully; only the address lookup failed.
        setLocationStatus('error');
        setLocationMessage(
          `Coordinates detected, but the address could not be looked up automatically (${geocodeErr.message || 'reverse geocoding failed'}). Please enter the address manually.`
        );
        toast.error('Detected coordinates, but address lookup failed. Please enter the address manually.');
      }
    } catch (geoErr) {
      setLocationStatus('error');
      setLocationMessage(geoErr.message || 'Unable to detect your current location. Please enter it manually.');
      toast.error(geoErr.message || 'Unable to detect your current location.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Latitude and longitude must be valid numbers.');
      return;
    }
    if (!isValidLatitude(lat)) {
      setError('Latitude must be between -90 and 90.');
      return;
    }
    if (!isValidLongitude(lng)) {
      setError('Longitude must be between -180 and 180.');
      return;
    }

    setLoading(true);
    const res = await registerClinic({
      clinicName: form.clinicName.trim(),
      email: form.email.trim(),
      password: form.password,
      location: form.location.trim(),
      latitude: lat,
      longitude: lng,
      coldStorageCapacity: form.coldStorageCapacity.trim()
    });
    setLoading(false);

    if (res.success) {
      toast.success(`Clinic account created. Welcome, ${res.user.clinicName}.`);
    } else {
      setError(res.error || 'Registration failed. Please review the form and try again.');
      toast.error('Registration failed: ' + (res.error || 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-800 flex items-center justify-center text-white shadow-md mb-3">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Register a New Clinic
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Create a facility account to onboard onto the VaxSafe Cold-Chain Network
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
                Clinic Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={form.clinicName}
                  onChange={handleChange('clinicName')}
                  placeholder="Northside Family Health Clinic"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Clinic Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="admin@northside.vaxsafe.org"
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
                  minLength={6}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 gap-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Location / Address
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locationStatus === 'detecting'}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {locationStatus === 'detecting' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LocateFixed className="w-3.5 h-3.5" />
                  )}
                  Use My Current Location
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={handleChange('location')}
                  placeholder="220 Northside Ave, Queens, NY 11101"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>

              {locationStatus === 'detecting' && (
                <p className="mt-1.5 text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                  Detecting location...
                </p>
              )}
              {locationStatus === 'success' && (
                <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  Location detected
                </p>
              )}
              {locationStatus === 'error' && locationMessage && (
                <p className="mt-1.5 text-[11px] font-medium text-red-600 flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>{locationMessage}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Latitude
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={form.latitude}
                    onChange={handleChange('latitude')}
                    placeholder="40.7484"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Longitude
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={form.longitude}
                    onChange={handleChange('longitude')}
                    placeholder="-73.9857"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Cold Storage Capacity
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Snowflake className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={form.coldStorageCapacity}
                  onChange={handleChange('coldStorageCapacity')}
                  placeholder="5,000 doses"
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
                Create Clinic Account
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>
          </div>
        </div>

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
