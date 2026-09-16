import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import VaccineDetailPage from './VaccineDetailPage';
import QRGeneratorModal from '../components/qr/QRGeneratorModal';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  QrCode,
  Eye,
  Calendar,
  AlertCircle,
  Building2,
  RefreshCw,
  Clock,
  Trash2,
  AlertTriangle
} from 'lucide-react';

// Generates short unique Batch ID e.g. VS-8K42P
function generateBatchId() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'VS-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const STORAGE_TEMP_OPTIONS = [
  { value: '2-8°C', label: '2–8°C (Standard fridge)' },
  { value: '-15 to -25°C', label: '-15 to -25°C (Freezer)' },
  { value: '-60 to -80°C', label: '-60 to -80°C (Ultra-cold)' },
  { value: 'Room Temp', label: 'Room Temp' },
  { value: 'CUSTOM', label: 'Custom (enter manually)...' }
];

export default function VaccinesPage() {
  const { clinic, currentUser } = useAuth();
  const { vaccines, createVaccine, discardVaccineBatches } = useData();
  const toast = useToast();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selection & Discard state
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [discardReason, setDiscardReason] = useState('');
  const [isDiscarding, setIsDiscarding] = useState(false);

  // Modals state
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [justCreatedVaccine, setJustCreatedVaccine] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    vaccineName: '',
    batchId: '',
    manufacturer: '',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    quantity: 100,
    storageTemp: '2-8°C',
    customStorageTemp: '',
    minTemperature: '2.0',
    maxTemperature: '8.0',
    maxExcursionDurationMinutes: '60',
    warningBeforeMinutes: '16'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered vaccines list
  const filteredVaccines = useMemo(() => {
    return vaccines.filter((v) => {
      const matchSearch =
        v.vaccineName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.batchId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' || v.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [vaccines, searchQuery, statusFilter]);

  const handleOpenRegister = () => {
    setFormData({
      vaccineName: '',
      batchId: generateBatchId(),
      manufacturer: '',
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().split('T')[0], // 6 months default
      quantity: 250,
      storageTemp: '2-8°C',
      customStorageTemp: '',
      minTemperature: '2.0',
      maxTemperature: '8.0',
      maxExcursionDurationMinutes: '60',
      warningBeforeMinutes: '16'
    });
    setRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vaccineName.trim()) {
      toast.error('Vaccine Name is required.');
      return;
    }
    if (!formData.expiryDate) {
      toast.error('Expiry Date is required.');
      return;
    }
    if (isNaN(parseFloat(formData.minTemperature)) || isNaN(parseFloat(formData.maxTemperature))) {
      toast.error('Valid Minimum and Maximum temperatures are required for cold-chain monitoring.');
      return;
    }
    if (parseFloat(formData.minTemperature) >= parseFloat(formData.maxTemperature)) {
      toast.error('Minimum temperature must be lower than Maximum temperature.');
      return;
    }
    if (formData.storageTemp === 'CUSTOM' && !formData.customStorageTemp.trim()) {
      toast.error('Please enter a custom storage temperature description.');
      return;
    }

    const finalBatchId = formData.batchId.trim() || generateBatchId();
    const finalStorageTemp =
      formData.storageTemp === 'CUSTOM'
        ? formData.customStorageTemp.trim()
        : formData.storageTemp;

    setIsSubmitting(true);
    try {
      const newVac = await createVaccine({
        ...formData,
        storageTemp: finalStorageTemp,
        batchId: finalBatchId.toUpperCase(),
        quantity: parseInt(formData.quantity, 10) || 1,
        minTemperature: parseFloat(formData.minTemperature),
        maxTemperature: parseFloat(formData.maxTemperature),
        maxExcursionDurationMinutes: parseInt(formData.maxExcursionDurationMinutes, 10) || 60,
        warningBeforeMinutes: parseInt(formData.warningBeforeMinutes, 10) || 16,
        status: 'In Storage'
      });

      toast.success(`Batch ${newVac.batchId} successfully registered under certified cold storage.`);
      setRegisterModalOpen(false);
      setJustCreatedVaccine(newVac);
      setQrModalOpen(true);
    } catch (err) {
      toast.error('Failed to register vaccine: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetail = (vac) => {
    setSelectedVaccine(vac);
    setDetailModalOpen(true);
  };

  const handleViewQR = (vac, e) => {
    e.stopPropagation();
    setJustCreatedVaccine(vac);
    setQrModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Vaccine Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered biological batches under active custody at{' '}
            <strong className="text-slate-800">{clinic?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedBatchIds.length > 0 && (
            <Button
              variant="danger"
              size="md"
              icon={Trash2}
              onClick={() => {
                setDiscardReason('');
                setDiscardModalOpen(true);
              }}
            >
              Discard Selected ({selectedBatchIds.length})
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleOpenRegister}
          >
            Register New Vaccine Batch
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, Batch ID, manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">Status:</span>
          {['ALL', 'In Storage', 'QUARANTINE_REVIEW', 'In Transit', 'Delivered', 'Compromised', 'DISCARDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Vaccines Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={filteredVaccines.length > 0 && selectedBatchIds.length === filteredVaccines.filter(v => v.status !== 'DISCARDED').length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBatchIds(filteredVaccines.filter(v => v.status !== 'DISCARDED').map((v) => v.id));
                      } else {
                        setSelectedBatchIds([]);
                      }
                    }}
                    className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    title="Select all non-discarded batches"
                  />
                </th>
                <th className="px-5 py-3">Vaccine Name & Details</th>
                <th className="px-4 py-3">Batch ID</th>
                <th className="px-4 py-3">Manufacturer</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3">Storage Temp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredVaccines.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-10 text-center text-slate-400 text-xs">
                    <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No vaccine batches match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredVaccines.map((vac) => {
                  const isExpiringSoon =
                    new Date(vac.expiryDate) - new Date() < 1000 * 60 * 60 * 24 * 60; // 60 days
                  const isSelected = selectedBatchIds.includes(vac.id);
                  const isDiscarded = vac.status === 'DISCARDED';

                  return (
                    <tr
                      key={vac.id}
                      onClick={() => handleViewDetail(vac)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isDiscarded ? 'bg-slate-50/60 opacity-75' : isSelected ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <td className="w-10 px-3 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDiscarded}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBatchIds((prev) => [...prev, vac.id]);
                            } else {
                              setSelectedBatchIds((prev) => prev.filter((id) => id !== vac.id));
                            }
                          }}
                          className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 disabled:opacity-30"
                        />
                      </td>

                      <td className="px-5 py-3.5">
                        <div className={`font-bold ${isDiscarded ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                          {vac.vaccineName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Intake: {new Date(vac.createdAt).toLocaleDateString()}
                          {vac.discardReason && (
                            <span className="block text-rose-600 font-medium">Discarded: {vac.discardReason}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {vac.batchId}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700">
                        {vac.manufacturer}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`font-mono ${isExpiringSoon ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
                          {vac.expiryDate}
                        </span>
                        {isExpiringSoon && (
                          <span className="block text-[10px] text-amber-600 font-sans">
                            Expiring Soon
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">
                        {vac.quantity.toLocaleString()} doses
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono text-slate-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                          {vac.storageTemp || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant={vac.status.toLowerCase()} size="sm">
                          {vac.status}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleViewQR(vac, e)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
                            title="Generate / Print QR Label"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          {!isDiscarded && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBatchIds([vac.id]);
                                setDiscardReason('');
                                setDiscardModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Discard Batch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewDetail(vac)}
                          >
                            Audit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vaccine Registration Modal */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Vaccine Batch Registration"
        description="Register incoming vaccine vials into certified cold-chain storage custody."
        maxWidth="max-w-lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRegisterModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRegisterSubmit}
              loading={isSubmitting}
              icon={Plus}
            >
              Save & Generate QR
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
          {/* Vaccine Name */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Vaccine Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pfizer-BioNTech Comirnaty"
              value={formData.vaccineName}
              onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Batch ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold uppercase tracking-wider text-slate-700">
                Batch ID (Auto-generated if blank)
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, batchId: generateBatchId() })}
                className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                Generate New
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. VS-8K42P"
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 font-mono uppercase font-bold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Manufacturer */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Manufacturer *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pfizer Inc. / Moderna"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Quantity & Storage Temp */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Quantity (Doses) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Storage Temp *
              </label>
              <select
                required
                value={formData.storageTemp}
                onChange={(e) => {
                  const val = e.target.value;
                  const updates = { storageTemp: val };
                  if (val === '2-8°C') {
                    updates.minTemperature = '2.0';
                    updates.maxTemperature = '8.0';
                  } else if (val === '-15 to -25°C') {
                    updates.minTemperature = '-25.0';
                    updates.maxTemperature = '-15.0';
                  } else if (val === '-60 to -80°C') {
                    updates.minTemperature = '-80.0';
                    updates.maxTemperature = '-60.0';
                  }
                  setFormData({ ...formData, ...updates });
                }}
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                {STORAGE_TEMP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {formData.storageTemp === 'CUSTOM' && (
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. -40°C or 15-25°C"
                  value={formData.customStorageTemp}
                  onChange={(e) => setFormData({ ...formData, customStorageTemp: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              )}
            </div>
          </div>

          {/* Batch-Level Cold-Chain Tolerances */}
          <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-lg space-y-3">
            <div className="text-xs font-bold text-teal-900 uppercase tracking-wider">
              Batch Cold-Chain Thermal Specifications & Excursion Limits
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 text-[11px] mb-1">
                  Min Allowed Temp (°C) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.minTemperature}
                  onChange={(e) => setFormData({ ...formData, minTemperature: e.target.value })}
                  className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 text-xs"
                  placeholder="e.g. 2.0"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 text-[11px] mb-1">
                  Max Allowed Temp (°C) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.maxTemperature}
                  onChange={(e) => setFormData({ ...formData, maxTemperature: e.target.value })}
                  className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 text-xs"
                  placeholder="e.g. 8.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 text-[11px] mb-1">
                  Max Excursion Limit (Mins) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.maxExcursionDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, maxExcursionDurationMinutes: e.target.value })}
                  className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 text-xs"
                  placeholder="e.g. 60"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 text-[11px] mb-1">
                  Warning Before Limit (Mins)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.warningBeforeMinutes}
                  onChange={(e) => setFormData({ ...formData, warningBeforeMinutes: e.target.value })}
                  className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 text-xs"
                  placeholder="16"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Manufacturing Date
              </label>
              <input
                type="date"
                value={formData.manufacturingDate}
                onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Facility Confirmation info */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-[11px] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              Custody will be assigned to <strong>{clinic?.name}</strong> at status{' '}
              <strong>"In Storage"</strong>.
            </span>
          </div>
        </form>
      </Modal>

      {/* Detailed Audit & History Modal */}
      <VaccineDetailPage
        vaccine={selectedVaccine}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />

      {/* QR Code view & print modal after creation */}
      <QRGeneratorModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        vaccine={justCreatedVaccine}
      />

      {/* Discard Vaccine Confirmation Modal */}
      <Modal
        isOpen={discardModalOpen}
        onClose={() => setDiscardModalOpen(false)}
        title="Confirm Vaccine Batch Discard"
        description="Safely mark selected batch(es) as DISCARDED and remove from available inventory."
        maxWidth="max-w-md"
        footer={
          <div className="flex w-full justify-between items-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDiscardModalOpen(false)}
              disabled={isDiscarding}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              loading={isDiscarding}
              disabled={!discardReason.trim()}
              onClick={async () => {
                if (!discardReason.trim()) {
                  toast.error('Please enter or select a reason for discard.');
                  return;
                }
                setIsDiscarding(true);
                try {
                  await discardVaccineBatches(selectedBatchIds, discardReason.trim());
                  toast.success(`${selectedBatchIds.length} batch(es) successfully marked as DISCARDED and deducted from inventory.`);
                  setSelectedBatchIds([]);
                  setDiscardModalOpen(false);
                } catch (err) {
                  toast.error(err.message || 'Failed to discard batch(es).');
                } finally {
                  setIsDiscarding(false);
                }
              }}
            >
              Confirm Discard ({selectedBatchIds.length})
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Safety & Compliance Policy</div>
              <p className="mt-0.5 text-amber-800">
                Batches are <strong>never permanently deleted</strong>. Status will transition to <strong>DISCARDED</strong>, available doses will be removed from inventory, and complete audit history will be preserved. Discarded batches cannot be transferred or rerouted.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Batch(es) to Discard ({selectedBatchIds.length})
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50 p-2 space-y-1">
              {vaccines
                .filter((v) => selectedBatchIds.includes(v.id))
                .map((v) => (
                  <div key={v.id} className="text-xs flex items-center justify-between p-1">
                    <div>
                      <span className="font-mono font-bold text-slate-800">{v.batchId}</span>
                      <span className="text-slate-600 ml-2">{v.vaccineName}</span>
                    </div>
                    <span className="font-semibold text-rose-700">{v.quantity} doses</span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Reason for Discard *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                'Cold-chain breach compromise',
                'Product expiration',
                'Vial breakage / leak',
                'Contamination suspected'
              ].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setDiscardReason(preset)}
                  className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              required
              rows={3}
              value={discardReason}
              onChange={(e) => setDiscardReason(e.target.value)}
              placeholder="Provide clinical or operational rationale for discarding this batch..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-600"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}