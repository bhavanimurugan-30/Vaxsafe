/**
 * Seed data for VaxSafe Clinics, Users, and Cold-Chain Inventory
 */

export const INITIAL_CLINICS = [
  {
    id: 'clinic-a',
    name: 'Clinic A - Metro Central General Hospital',
    shortName: 'Clinic A',
    lat: 40.7128,
    lng: -74.0060,
    address: '500 Healthcare Blvd, New York, NY 10007',
    contact: '+1 (212) 555-0142',
    coldStorageCapacity: '12,000 doses',
    backupGenerator: 'Active (Diesel Tier-4)',
    certifiedRange: '2.0°C – 8.0°C & -80.0°C ULT'
  },
  {
    id: 'clinic-b',
    name: 'Clinic B - Riverside Community Clinic',
    shortName: 'Clinic B',
    lat: 40.7831,
    lng: -73.9712,
    address: '120 Riverside Drive, New York, NY 10024',
    contact: '+1 (212) 555-0189',
    coldStorageCapacity: '4,500 doses',
    backupGenerator: 'Active (Battery ESS)',
    certifiedRange: '2.0°C – 8.0°C'
  },
  {
    id: 'clinic-c',
    name: 'Clinic C - Harbor Regional Medical Center',
    shortName: 'Clinic C',
    lat: 40.6782,
    lng: -73.9442,
    address: '850 Atlantic Avenue, Brooklyn, NY 11238',
    contact: '+1 (718) 555-0176',
    coldStorageCapacity: '8,000 doses',
    backupGenerator: 'Active (Dual Grid + Diesel)',
    certifiedRange: '2.0°C – 8.0°C & -20.0°C'
  },
  {
    id: 'clinic-d',
    name: 'Clinic D - Valley Memorial Hospital',
    shortName: 'Clinic D',
    lat: 40.8448,
    lng: -73.8648,
    address: '1400 Pelham Parkway, Bronx, NY 10461',
    contact: '+1 (718) 555-0131',
    coldStorageCapacity: '6,000 doses',
    backupGenerator: 'Active (Turbine Standby)',
    certifiedRange: '2.0°C – 8.0°C'
  }
];

export const DEMO_ACCOUNTS = [
  {
    email: 'admin@clinic-a.vaxsafe.org',
    password: 'Password123!',
    name: 'Dr. Sarah Jenkins',
    role: 'Lead Cold-Chain Director',
    clinicId: 'clinic-a',
    clinicName: 'Clinic A - Metro Central General Hospital'
  },
  {
    email: 'ops@clinic-b.vaxsafe.org',
    password: 'Password123!',
    name: 'Marcus Vance, RPh',
    role: 'Pharmacy Logistics Officer',
    clinicId: 'clinic-b',
    clinicName: 'Clinic B - Riverside Community Clinic'
  },
  {
    email: 'pharm@clinic-c.vaxsafe.org',
    password: 'Password123!',
    name: 'Elena Rostova',
    role: 'Supply Operations Lead',
    clinicId: 'clinic-c',
    clinicName: 'Clinic C - Harbor Regional Medical Center'
  },
  {
    email: 'supply@clinic-d.vaxsafe.org',
    password: 'Password123!',
    name: 'David Chen',
    role: 'Vaccine Inventory Supervisor',
    clinicId: 'clinic-d',
    clinicName: 'Clinic D - Valley Memorial Hospital'
  }
];

export const INITIAL_VACCINES = [
  {
    id: 'vac-1',
    vaccineName: 'Pfizer-BioNTech Comirnaty (COVID-19)',
    batchId: 'VS-9K42P',
    manufacturer: 'Pfizer Inc. / BioNTech',
    manufacturingDate: '2026-04-10',
    expiryDate: '2027-04-10',
    quantity: 500,
    status: 'In Storage',
    clinicId: 'clinic-a',
    clinicName: 'Clinic A - Metro Central General Hospital',
    targetTemp: '2°C - 8°C (Refrigerated post-thaw)',
    minTemperature: 2.0,
    maxTemperature: 8.0,
    maxExcursionDurationMinutes: 60,
    warningBeforeMinutes: 16,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    id: 'vac-2',
    vaccineName: 'Moderna Spikevax (Bivalent)',
    batchId: 'VS-3M87Q',
    manufacturer: 'ModernaTX, Inc.',
    manufacturingDate: '2026-03-15',
    expiryDate: '2026-11-15',
    quantity: 350,
    status: 'In Storage',
    clinicId: 'clinic-a',
    clinicName: 'Clinic A - Metro Central General Hospital',
    targetTemp: '2°C - 8°C',
    minTemperature: 2.0,
    maxTemperature: 8.0,
    maxExcursionDurationMinutes: 45,
    warningBeforeMinutes: 16,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString()
  },
  {
    id: 'vac-3',
    vaccineName: 'Sanofi Fluzone High-Dose Quadrivalent',
    batchId: 'VS-2F55X',
    manufacturer: 'Sanofi Pasteur',
    manufacturingDate: '2026-05-01',
    expiryDate: '2026-12-31',
    quantity: 800,
    status: 'In Storage',
    clinicId: 'clinic-a',
    clinicName: 'Clinic A - Metro Central General Hospital',
    targetTemp: '2°C - 8°C',
    minTemperature: 2.0,
    maxTemperature: 8.0,
    maxExcursionDurationMinutes: 30,
    warningBeforeMinutes: 16,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'vac-4',
    vaccineName: 'Novavax Nuvaxovid (COVID-19)',
    batchId: 'VS-7R12B',
    manufacturer: 'Novavax, Inc.',
    manufacturingDate: '2026-02-20',
    expiryDate: '2027-02-20',
    quantity: 250,
    status: 'In Transit',
    clinicId: 'clinic-a',
    clinicName: 'Clinic A - Metro Central General Hospital',
    destinationClinicId: 'clinic-b',
    destinationClinicName: 'Clinic B - Riverside Community Clinic',
    targetTemp: '2°C - 8°C',
    minTemperature: 2.0,
    maxTemperature: 8.0,
    maxExcursionDurationMinutes: 60,
    warningBeforeMinutes: 16,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  },
  {
    id: 'vac-5',
    vaccineName: 'GSK Shingrix (Zoster Recombinant)',
    batchId: 'VS-6S33D',
    manufacturer: 'GlaxoSmithKline',
    manufacturingDate: '2026-01-10',
    expiryDate: '2026-10-30',
    quantity: 120,
    status: 'Compromised',
    clinicId: 'clinic-a',
    clinicName: 'Clinic A - Metro Central General Hospital',
    targetTemp: '2°C - 8°C',
    minTemperature: 2.0,
    maxTemperature: 8.0,
    maxExcursionDurationMinutes: 30,
    warningBeforeMinutes: 16,
    compromisedReason: 'Cold-room compressor excursion (9.6°C for 45 min)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString()
  },
  {
    id: 'vac-6',
    vaccineName: 'Merck Gardasil 9 (HPV 9-valent)',
    batchId: 'VS-4V90L',
    manufacturer: 'Merck Sharp & Dohme',
    manufacturingDate: '2026-03-01',
    expiryDate: '2027-08-30',
    quantity: 400,
    status: 'In Storage',
    clinicId: 'clinic-b',
    clinicName: 'Clinic B - Riverside Community Clinic',
    targetTemp: '2°C - 8°C',
    minTemperature: 2.0,
    maxTemperature: 8.0,
    maxExcursionDurationMinutes: 45,
    warningBeforeMinutes: 16,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString()
  },
  {
    id: 'vac-7',
    vaccineName: 'Merck MMR II (Measles, Mumps, Rubella)',
    batchId: 'VS-8M14K',
    manufacturer: 'Merck Sharp & Dohme',
    manufacturingDate: '2026-04-18',
    expiryDate: '2027-10-15',
    quantity: 620,
    status: 'In Storage',
    clinicId: 'clinic-c',
    clinicName: 'Clinic C - Harbor Regional Medical Center',
    targetTemp: '2°C - 8°C',
    minTemperature: 2.0,
    maxTemperature: 8.0,
    maxExcursionDurationMinutes: 60,
    warningBeforeMinutes: 16,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString()
  }
];

export const INITIAL_STATUS_HISTORY = {
  'vac-1': [
    {
      id: 'sh-101',
      status: 'In Storage',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      clinicId: 'clinic-a',
      clinicName: 'Clinic A - Metro Central General Hospital',
      userId: 'admin@clinic-a.vaxsafe.org',
      note: 'Initial batch accession and cold-storage intake at 4.2°C.'
    }
  ],
  'vac-4': [
    {
      id: 'sh-401',
      status: 'In Storage',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      clinicId: 'clinic-a',
      clinicName: 'Clinic A - Metro Central General Hospital',
      userId: 'admin@clinic-a.vaxsafe.org',
      note: 'Batch received from regional central depot.'
    },
    {
      id: 'sh-402',
      status: 'In Transit',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      clinicId: 'clinic-a',
      clinicName: 'Clinic A - Metro Central General Hospital',
      destinationClinicId: 'clinic-b',
      destinationClinicName: 'Clinic B - Riverside Community Clinic',
      userId: 'admin@clinic-a.vaxsafe.org',
      note: 'Dispatched via Medical Cold Carrier Unit #4. Temperature data logger active.'
    }
  ],
  'vac-5': [
    {
      id: 'sh-501',
      status: 'In Storage',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
      clinicId: 'clinic-a',
      clinicName: 'Clinic A - Metro Central General Hospital',
      userId: 'admin@clinic-a.vaxsafe.org',
      note: 'Initial batch accession.'
    },
    {
      id: 'sh-502',
      status: 'Compromised',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      clinicId: 'clinic-a',
      clinicName: 'Clinic A - Metro Central General Hospital',
      userId: 'system-monitor',
      note: 'Thermal breach: secondary cooler chamber logged 9.6°C (>8°C ceiling). Quarantined pending rerun or reroute.'
    }
  ]
};

// Generate realistic 24-hour hourly temperature data
export function generateInitialTemperatureLogs(clinicId = 'clinic-a') {
  const logs = [];
  const now = Date.now();
  
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600 * 1000);
    // Realistic temperature between 3.8 and 5.2 degrees C
    const variance = (Math.sin(i / 2) * 0.7) + (Math.random() * 0.4 - 0.2);
    const temp = parseFloat((4.4 + variance).toFixed(1));
    
    logs.push({
      id: `temp-${clinicId}-${i}`,
      clinicId,
      clinicName: 'Clinic A - Metro Central General Hospital',
      temperature: temp,
      unit: 'Cold Room #1 (Primary)',
      timestamp: timestamp.toISOString(),
      timeFormatted: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBreach: temp < 2.0 || temp > 8.0,
      recordedBy: i % 4 === 0 ? 'Manual QA Log' : 'Automated Telemetry'
    });
  }
  return logs;
}

export const INITIAL_BREACH_ALERTS = [
  {
    id: 'alt-01',
    clinicId: 'clinic-a',
    clinicName: 'Clinic A - Metro Central General Hospital',
    temperature: 9.6,
    unit: 'Sub-Zero Refrigerator Bay 3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    severity: 'High Temperature Excursion (> 8.0°C)',
    isResolved: false,
    affectedBatchId: 'VS-6S33D',
    batchId: 'VS-6S33D',
    affectedVaccineName: 'GSK Shingrix (Zoster Recombinant)',
    vaccineName: 'GSK Shingrix (Zoster Recombinant)',
    minTemperature: 2.0,
    maxTemperature: 8.0,
    allowedRange: '2.0°C – 8.0°C',
    excursionStartTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    excursionDurationMinutes: 45,
    maxExcursionDurationMinutes: 30,
    warningBeforeMinutes: 16,
    remainingMinutes: 0,
    status: 'CRITICAL',
    timerActive: false,
    recommendedAction: 'Immediate transfer to closest certified facility or medical quarantine.'
  }
];
