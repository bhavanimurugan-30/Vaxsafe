/**
 * Unified Data Service for VaxSafe
 * 
 * Supports both live Firebase Firestore (when configured) and a robust
 * reactive operational fallback state store. This ensures seamless end-to-end
 * functionality whether configured with live cloud credentials or evaluating locally.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.js';
import {
  INITIAL_CLINICS,
  INITIAL_VACCINES,
  INITIAL_STATUS_HISTORY,
  INITIAL_BREACH_ALERTS,
  generateInitialTemperatureLogs,
  DEMO_ACCOUNTS
} from './seedData.js';

// Local storage keys for persistent offline/demo mode
const STORAGE_KEYS = {
  VACCINES: 'vaxsafe_vaccines_v1',
  HISTORY: 'vaxsafe_status_history_v1',
  TEMP_LOGS: 'vaxsafe_temp_logs_v1',
  ALERTS: 'vaxsafe_alerts_v1',
  CLINICS: 'vaxsafe_clinics_v1',
  USERS: 'vaxsafe_users_v1'
};

// In-memory / localStorage cache
function loadStorage(key, defaultValue) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return defaultValue;
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage write error:', e);
  }
}

// Reactive listeners registry for local mode
const listeners = {
  vaccines: new Set(),
  tempLogs: new Set(),
  alerts: new Set()
};

function notifyListeners(type) {
  if (listeners[type]) {
    listeners[type].forEach(fn => fn());
  }
}

// Initialize seed data in local storage if not already initialized
function ensureSeedData() {
  if (typeof localStorage === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.CLINICS)) {
    saveStorage(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
  }
  
  const existingVaccines = loadStorage(STORAGE_KEYS.VACCINES, null);
  if (!existingVaccines) {
    saveStorage(STORAGE_KEYS.VACCINES, INITIAL_VACCINES);
  } else {
    // Enrich existing stored vaccines with batch-level temperature limits if missing
    let updatedVac = false;
    const enrichedVac = existingVaccines.map((v) => {
      const match = INITIAL_VACCINES.find((s) => s.id === v.id || s.batchId === v.batchId);
      if (match && (v.minTemperature === undefined || v.maxExcursionDurationMinutes === undefined)) {
        updatedVac = true;
        return {
          ...v,
          minTemperature: match.minTemperature,
          maxTemperature: match.maxTemperature,
          maxExcursionDurationMinutes: match.maxExcursionDurationMinutes,
          warningBeforeMinutes: match.warningBeforeMinutes ?? 16
        };
      }
      return v;
    });
    if (updatedVac) {
      saveStorage(STORAGE_KEYS.VACCINES, enrichedVac);
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
    saveStorage(STORAGE_KEYS.HISTORY, INITIAL_STATUS_HISTORY);
  }

  const existingAlerts = loadStorage(STORAGE_KEYS.ALERTS, null);
  if (!existingAlerts) {
    saveStorage(STORAGE_KEYS.ALERTS, INITIAL_BREACH_ALERTS);
  } else {
    let updatedAlt = false;
    const enrichedAlt = existingAlerts.map((a) => {
      const match = INITIAL_BREACH_ALERTS.find((s) => s.id === a.id || s.affectedBatchId === a.affectedBatchId);
      if (match && a.minTemperature === undefined) {
        updatedAlt = true;
        return {
          ...a,
          batchId: a.batchId || match.batchId,
          vaccineName: a.vaccineName || match.vaccineName,
          minTemperature: match.minTemperature,
          maxTemperature: match.maxTemperature,
          allowedRange: match.allowedRange,
          excursionDurationMinutes: a.excursionDurationMinutes ?? match.excursionDurationMinutes,
          maxExcursionDurationMinutes: a.maxExcursionDurationMinutes ?? match.maxExcursionDurationMinutes,
          warningBeforeMinutes: a.warningBeforeMinutes ?? match.warningBeforeMinutes,
          remainingMinutes: a.remainingMinutes ?? match.remainingMinutes,
          status: a.status || match.status,
          timerActive: a.timerActive ?? match.timerActive
        };
      }
      return a;
    });
    if (updatedAlt) {
      saveStorage(STORAGE_KEYS.ALERTS, enrichedAlt);
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.TEMP_LOGS)) {
    saveStorage(STORAGE_KEYS.TEMP_LOGS, generateInitialTemperatureLogs('clinic-a'));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const userMap = {};
    DEMO_ACCOUNTS.forEach(acc => {
      userMap[acc.email] = acc;
    });
    saveStorage(STORAGE_KEYS.USERS, userMap);
  }
}

ensureSeedData();

// ==========================================
// CLINICS
// ==========================================

// Merge a list of dynamically registered clinics on top of the 4 seed demo
// clinics (Clinic A-D), de-duplicated by id. The seed clinics always remain
// available as demo/rerouting targets, regardless of what has been
// dynamically registered on top of them.
function mergeWithSeedClinics(dynamicClinics) {
  const dynamicOnly = (dynamicClinics || []).filter(
    (c) => !INITIAL_CLINICS.some((seed) => seed.id === c.id)
  );
  return [...INITIAL_CLINICS, ...dynamicOnly];
}

export async function getClinics() {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'clinics'));
      const firestoreClinics = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return mergeWithSeedClinics(firestoreClinics);
    } catch (e) {
      console.warn('Error fetching clinics from Firestore, using seed:', e);
    }
  }
  const stored = loadStorage(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
  return mergeWithSeedClinics(stored);
}

export async function getClinicById(clinicId) {
  if (!clinicId) return null;

  // Look up the exact clinic document by id (its Firebase Auth UID for
  // dynamically registered clinics) rather than pulling the whole
  // collection and falling back to an arbitrary clinic.
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'clinics', clinicId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (e) {
      console.warn('Firestore getClinicById error:', e);
    }
  }

  const seedMatch = INITIAL_CLINICS.find(c => c.id === clinicId);
  if (seedMatch) return seedMatch;

  const stored = loadStorage(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
  const storedMatch = stored.find(c => c.id === clinicId);
  if (storedMatch) return storedMatch;

  return null;
}

// Create/update a clinic document at clinics/{clinicId} (clinicId is the
// Firebase Auth UID for dynamically registered clinics). Used by clinic
// registration.
export async function saveClinicDocument(clinicId, clinicData) {
  const payload = { id: clinicId, ...clinicData };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'clinics', clinicId), payload, { merge: true });
      return payload;
    } catch (e) {
      console.warn('Firestore saveClinicDocument error, using local storage:', e);
    }
  }

  const clinics = loadStorage(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
  const index = clinics.findIndex(c => c.id === clinicId);
  if (index !== -1) {
    clinics[index] = { ...clinics[index], ...payload };
  } else {
    clinics.push(payload);
  }
  saveStorage(STORAGE_KEYS.CLINICS, clinics);
  return payload;
}

// ==========================================
// VACCINES
// ==========================================

export function subscribeVaccines(clinicId, callback) {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'vaccines'),
        where('clinicId', '==', clinicId)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(list);
      }, (err) => {
        console.warn('Firestore vaccine subscription error, fallback to local:', err);
      });
      return unsubscribe;
    } catch (e) {
      console.warn('Failed to subscribe via Firestore:', e);
    }
  }

  // Local reactive listener
  const emit = () => {
    const all = loadStorage(STORAGE_KEYS.VACCINES, INITIAL_VACCINES);
    // Display vaccines belonging to this clinic, or in transit towards this clinic
    const filtered = all.filter(v => v.clinicId === clinicId || v.destinationClinicId === clinicId);
    callback(filtered);
  };

  emit();
  listeners.vaccines.add(emit);
  return () => listeners.vaccines.delete(emit);
}

export async function addVaccine(data, userId = 'operator') {
  const newVaccine = {
    ...data,
    status: data.status || 'In Storage',
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'vaccines'), {
        ...newVaccine,
        serverCreatedAt: serverTimestamp()
      });
      const id = docRef.id;

      // Add initial status history sub-document
      await addDoc(collection(db, `vaccines/${id}/statusHistory`), {
        status: 'In Storage',
        timestamp: new Date().toISOString(),
        clinicId: data.clinicId,
        clinicName: data.clinicName,
        userId,
        note: 'Vaccine batch accession and storage intake.'
      });

      return { id, ...newVaccine };
    } catch (e) {
      console.warn('Firestore addVaccine error, using local storage:', e);
    }
  }

  const id = `vac-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created = { id, ...newVaccine };
  
  const all = loadStorage(STORAGE_KEYS.VACCINES, INITIAL_VACCINES);
  all.unshift(created);
  saveStorage(STORAGE_KEYS.VACCINES, all);

  const historyMap = loadStorage(STORAGE_KEYS.HISTORY, INITIAL_STATUS_HISTORY);
  historyMap[id] = [
    {
      id: `sh-${Date.now()}`,
      status: 'In Storage',
      timestamp: new Date().toISOString(),
      clinicId: data.clinicId,
      clinicName: data.clinicName,
      userId,
      note: 'Vaccine batch accession and cold-storage intake.'
    }
  ];
  saveStorage(STORAGE_KEYS.HISTORY, historyMap);

  notifyListeners('vaccines');
  return created;
}

export async function getVaccineByBatchId(batchId) {
  if (!batchId) return null;
  const normalized = batchId.trim().toUpperCase();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'vaccines'), where('batchId', '==', normalized));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
    } catch (e) {
      console.warn('Firestore getVaccineByBatchId error:', e);
    }
  }

  const all = loadStorage(STORAGE_KEYS.VACCINES, INITIAL_VACCINES);
  return all.find(v => v.batchId.toUpperCase() === normalized) || null;
}

export async function getStatusHistory(vaccineId) {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, `vaccines/${vaccineId}/statusHistory`));
      if (!snap.empty) {
        return snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      }
    } catch (e) {
      console.warn('Firestore getStatusHistory error:', e);
    }
  }

  const historyMap = loadStorage(STORAGE_KEYS.HISTORY, INITIAL_STATUS_HISTORY);
  return (historyMap[vaccineId] || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export async function updateVaccineStatus(vaccineId, newStatus, details = {}) {
  const {
    clinicId,
    clinicName,
    destinationClinicId,
    destinationClinicName,
    userId = 'staff',
    note = ''
  } = details;

  const updatePayload = {
    status: newStatus,
    updatedAt: new Date().toISOString()
  };

  if (destinationClinicId !== undefined) {
    updatePayload.destinationClinicId = destinationClinicId;
    updatePayload.destinationClinicName = destinationClinicName;
  }

  // If status is Delivered, transfer custody to receiving clinic
  if (newStatus === 'Delivered') {
    if (destinationClinicId) {
      updatePayload.clinicId = destinationClinicId;
      updatePayload.clinicName = destinationClinicName;
      updatePayload.destinationClinicId = null;
      updatePayload.destinationClinicName = null;
    }
  }

  const historyEntry = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    clinicId: clinicId || updatePayload.clinicId,
    clinicName: clinicName || updatePayload.clinicName,
    destinationClinicId: updatePayload.destinationClinicId || null,
    destinationClinicName: updatePayload.destinationClinicName || null,
    userId,
    note: note || `Status changed to ${newStatus}`
  };

  if (isFirebaseConfigured && db) {
    try {
      const vacRef = doc(db, 'vaccines', vaccineId);
      await updateDoc(vacRef, updatePayload);
      await addDoc(collection(db, `vaccines/${vaccineId}/statusHistory`), historyEntry);
      return true;
    } catch (e) {
      console.warn('Firestore updateVaccineStatus error, updating local:', e);
    }
  }

  const all = loadStorage(STORAGE_KEYS.VACCINES, INITIAL_VACCINES);
  const index = all.findIndex(v => v.id === vaccineId);
  if (index !== -1) {
    all[index] = { ...all[index], ...updatePayload };
    saveStorage(STORAGE_KEYS.VACCINES, all);

    const historyMap = loadStorage(STORAGE_KEYS.HISTORY, INITIAL_STATUS_HISTORY);
    if (!historyMap[vaccineId]) historyMap[vaccineId] = [];
    historyMap[vaccineId].push({ id: `sh-${Date.now()}`, ...historyEntry });
    saveStorage(STORAGE_KEYS.HISTORY, historyMap);

    notifyListeners('vaccines');
    return true;
  }
  return false;
}

// Emergency Rerouting for compromised or threatened vaccines
export async function rerouteVaccines(vaccineIds, originClinic, destinationClinic, userId = 'emergency-protocol') {
  for (const id of vaccineIds) {
    await updateVaccineStatus(id, 'In Transit', {
      clinicId: originClinic.id,
      clinicName: originClinic.name,
      destinationClinicId: destinationClinic.id,
      destinationClinicName: destinationClinic.name,
      userId,
      note: `Emergency cold-chain rerouting to ${destinationClinic.name} due to local temperature violation.`
    });
  }
  notifyListeners('vaccines');
  return true;
}

// Discard one or multiple vaccine batches (never permanently deleted)
export async function discardVaccines(vaccineIds, reason, userId = 'operator') {
  if (!vaccineIds || !vaccineIds.length) {
    throw new Error('No vaccine batches specified for discard.');
  }
  if (!reason || !reason.trim()) {
    throw new Error('A valid discard reason is required.');
  }

  const timestamp = new Date().toISOString();
  const all = loadStorage(STORAGE_KEYS.VACCINES, INITIAL_VACCINES);
  const historyMap = loadStorage(STORAGE_KEYS.HISTORY, INITIAL_STATUS_HISTORY);

  let updatedCount = 0;

  for (const id of vaccineIds) {
    const idx = all.findIndex((v) => v.id === id);
    if (idx === -1) continue;

    const vaccine = all[idx];

    // Prevent duplicate discard
    if (vaccine.status === 'DISCARDED') {
      continue;
    }

    const updatedVaccine = {
      ...vaccine,
      status: 'DISCARDED',
      discardReason: reason.trim(),
      discardedAt: timestamp,
      discardedBy: userId,
      destinationClinicId: null,
      destinationClinicName: null,
      updatedAt: timestamp
    };

    all[idx] = updatedVaccine;

    const historyEntry = {
      id: `sh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'DISCARDED',
      timestamp,
      clinicId: vaccine.clinicId,
      clinicName: vaccine.clinicName,
      userId,
      batchId: vaccine.batchId,
      vaccineName: vaccine.vaccineName,
      quantity: vaccine.quantity,
      note: `Batch discarded (${vaccine.quantity} doses removed from available inventory). Reason: ${reason.trim()}`
    };

    if (!historyMap[id]) historyMap[id] = [];
    historyMap[id].push(historyEntry);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'vaccines', id), updatedVaccine);
        await addDoc(collection(db, `vaccines/${id}/statusHistory`), historyEntry);
      } catch (e) {
        console.warn('Firestore discard update error:', e);
      }
    }
    updatedCount++;
  }

  if (updatedCount === 0) {
    throw new Error('Selected batch(es) are already DISCARDED.');
  }

  saveStorage(STORAGE_KEYS.VACCINES, all);
  saveStorage(STORAGE_KEYS.HISTORY, historyMap);
  notifyListeners('vaccines');
  return true;
}

// QR-Based Scan Out with validation, inventory decrease, and custody transfer
export async function scanOutVaccine({ batchId, originClinicId, destinationClinicId, destinationClinicName, operatorEmail = 'staff', notes = '' }) {
  if (!batchId) throw new Error('No Batch ID provided for Scan Out.');
  const vac = await getVaccineByBatchId(batchId);

  // 1. Unknown QR
  if (!vac) {
    throw new Error(`Unknown QR code. Batch "${batchId}" is not registered in VaxSafe.`);
  }

  // 2. Discarded batch
  if (vac.status === 'DISCARDED') {
    throw new Error(`Transfer rejected: Batch "${batchId}" is DISCARDED and cannot be transferred.`);
  }

  // 3. Duplicate Scan Out / already In Transit
  if (vac.status === 'IN_TRANSIT' || vac.status === 'In Transit') {
    throw new Error(`Duplicate Scan Out rejected: Batch "${batchId}" is already In Transit to ${vac.destinationClinicName || 'destination'}.`);
  }

  // 4. Non-transfer / wrong clinic
  if (originClinicId && vac.clinicId !== originClinicId) {
    throw new Error(`Scan Out rejected: Batch "${batchId}" is currently in custody of ${vac.clinicName}, not this facility.`);
  }

  // 5. Valid destination required & cannot be origin
  if (!destinationClinicId) {
    throw new Error('Scan Out rejected: Destination clinic must be selected.');
  }
  if (destinationClinicId === vac.clinicId) {
    throw new Error('Scan Out rejected: Destination clinic cannot be the same as the source clinic.');
  }

  const timestamp = new Date().toISOString();
  const all = loadStorage(STORAGE_KEYS.VACCINES, INITIAL_VACCINES);
  const historyMap = loadStorage(STORAGE_KEYS.HISTORY, INITIAL_STATUS_HISTORY);
  const idx = all.findIndex((v) => v.id === vac.id);

  const updatedVac = {
    ...vac,
    status: 'IN_TRANSIT',
    destinationClinicId,
    destinationClinicName,
    scannedOutAt: timestamp,
    scannedOutBy: operatorEmail,
    updatedAt: timestamp
  };

  if (idx !== -1) {
    all[idx] = updatedVac;
  }

  if (!historyMap[vac.id]) historyMap[vac.id] = [];

  // Transfer history: Scan Out
  const scanOutHistory = {
    id: `sh-${Date.now()}-so`,
    status: 'IN_TRANSIT',
    timestamp,
    clinicId: vac.clinicId,
    clinicName: vac.clinicName,
    destinationClinicId,
    destinationClinicName,
    userId: operatorEmail,
    batchId: vac.batchId,
    vaccineName: vac.vaccineName,
    quantity: vac.quantity,
    note: `QR Scan Out verified. Dispatched from ${vac.clinicName} to ${destinationClinicName}. ${notes ? `Notes: ${notes}` : ''}`
  };

  // Inventory record: Source inventory decrease
  const invDecreaseHistory = {
    id: `sh-${Date.now()}-dec`,
    status: 'Inventory Decreased',
    timestamp,
    clinicId: vac.clinicId,
    clinicName: vac.clinicName,
    userId: operatorEmail,
    batchId: vac.batchId,
    vaccineName: vac.vaccineName,
    quantity: vac.quantity,
    note: `Source inventory at ${vac.clinicName} decreased by ${vac.quantity} doses (Batch ${vac.batchId} departed cold storage).`
  };

  historyMap[vac.id].push(scanOutHistory);
  historyMap[vac.id].push(invDecreaseHistory);

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'vaccines', vac.id), updatedVac);
      await addDoc(collection(db, `vaccines/${vac.id}/statusHistory`), scanOutHistory);
      await addDoc(collection(db, `vaccines/${vac.id}/statusHistory`), invDecreaseHistory);
    } catch (e) {
      console.warn('Firestore scanOut error:', e);
    }
  }

  saveStorage(STORAGE_KEYS.VACCINES, all);
  saveStorage(STORAGE_KEYS.HISTORY, historyMap);
  notifyListeners('vaccines');

  return updatedVac;
}

// QR-Based Scan In with validation, custody transfer, and destination inventory increase
export async function scanInVaccine({ batchId, receivingClinicId, receivingClinicName, operatorEmail = 'staff', notes = '' }) {
  if (!batchId) throw new Error('No Batch ID provided for Scan In.');
  const vac = await getVaccineByBatchId(batchId);

  // 1. Unknown QR
  if (!vac) {
    throw new Error(`Unknown QR code. Batch "${batchId}" is not registered in VaxSafe.`);
  }

  // 2. Discarded batch
  if (vac.status === 'DISCARDED') {
    throw new Error(`Scan In rejected: Batch "${batchId}" is DISCARDED.`);
  }

  // 3. Scan In without Scan Out / already received
  const isTransit = vac.status === 'IN_TRANSIT' || vac.status === 'In Transit';
  if (!isTransit) {
    if ((vac.status === 'IN_STORAGE' || vac.status === 'In Storage' || vac.status === 'Delivered') && vac.clinicId === receivingClinicId) {
      throw new Error(`Duplicate Scan In rejected: Batch "${batchId}" has already been received and is in storage at ${receivingClinicName}.`);
    }
    throw new Error(`Scan In rejected: Scan In without Scan Out is prohibited. Batch "${batchId}" is currently "${vac.status}", not IN_TRANSIT.`);
  }

  // 4. Wrong destination clinic
  if (vac.destinationClinicId && receivingClinicId && vac.destinationClinicId !== receivingClinicId) {
    throw new Error(`Scan In rejected: Wrong destination facility! Batch "${batchId}" was routed to ${vac.destinationClinicName || vac.destinationClinicId}, not ${receivingClinicName}.`);
  }

  const timestamp = new Date().toISOString();
  const all = loadStorage(STORAGE_KEYS.VACCINES, INITIAL_VACCINES);
  const historyMap = loadStorage(STORAGE_KEYS.HISTORY, INITIAL_STATUS_HISTORY);
  const idx = all.findIndex((v) => v.id === vac.id);

  const updatedVac = {
    ...vac,
    status: 'IN_STORAGE',
    clinicId: receivingClinicId,
    clinicName: receivingClinicName,
    destinationClinicId: null,
    destinationClinicName: null,
    scannedInAt: timestamp,
    scannedInBy: operatorEmail,
    updatedAt: timestamp
  };

  if (idx !== -1) {
    all[idx] = updatedVac;
  }

  if (!historyMap[vac.id]) historyMap[vac.id] = [];

  // Transfer history: Scan In
  const scanInHistory = {
    id: `sh-${Date.now()}-si`,
    status: 'IN_STORAGE',
    timestamp,
    clinicId: receivingClinicId,
    clinicName: receivingClinicName,
    userId: operatorEmail,
    batchId: vac.batchId,
    vaccineName: vac.vaccineName,
    quantity: vac.quantity,
    note: `QR Scan In verified. Custody received at ${receivingClinicName} and transferred into certified cold storage. ${notes ? `Notes: ${notes}` : ''}`
  };

  // Inventory record: Destination inventory increase
  const invIncreaseHistory = {
    id: `sh-${Date.now()}-inc`,
    status: 'Inventory Increased',
    timestamp,
    clinicId: receivingClinicId,
    clinicName: receivingClinicName,
    userId: operatorEmail,
    batchId: vac.batchId,
    vaccineName: vac.vaccineName,
    quantity: vac.quantity,
    note: `Destination inventory at ${receivingClinicName} increased by ${vac.quantity} doses (Batch ${vac.batchId} accepted into storage).`
  };

  historyMap[vac.id].push(scanInHistory);
  historyMap[vac.id].push(invIncreaseHistory);

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'vaccines', vac.id), updatedVac);
      await addDoc(collection(db, `vaccines/${vac.id}/statusHistory`), scanInHistory);
      await addDoc(collection(db, `vaccines/${vac.id}/statusHistory`), invIncreaseHistory);
    } catch (e) {
      console.warn('Firestore scanIn error:', e);
    }
  }

  saveStorage(STORAGE_KEYS.VACCINES, all);
  saveStorage(STORAGE_KEYS.HISTORY, historyMap);
  notifyListeners('vaccines');

  return updatedVac;
}

// ==========================================
// TEMPERATURE LOGS
// ==========================================

export function subscribeTemperatureLogs(clinicId, callback) {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'temperatureLogs'),
        where('clinicId', '==', clinicId),
        orderBy('timestamp', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(list.slice(0, 30));
      }, (err) => {
        console.warn('Firestore temp log subscription error, using local:', err);
      });
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore subscribeTemperatureLogs error:', e);
    }
  }

  const emit = () => {
    const all = loadStorage(STORAGE_KEYS.TEMP_LOGS, generateInitialTemperatureLogs(clinicId));
    const filtered = all.filter(l => l.clinicId === clinicId);
    callback(filtered);
  };

  emit();
  listeners.tempLogs.add(emit);
  return () => listeners.tempLogs.delete(emit);
}

/**
 * Evaluate Cold-Chain Compliance & Excursion Duration Independently for Every Batch
 */
export async function evaluateBatchExcursions(clinicId, clinicName, tempVal, timestamp = new Date().toISOString(), unit = 'Cold Storage Main') {
  // 1. Fetch all vaccines belonging to this clinic or in transit to it
  let allVaccines = [];
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'vaccines'), where('clinicId', '==', clinicId));
      const snap = await getDocs(q);
      allVaccines = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Firestore vaccine fetch for excursion evaluation error:', e);
    }
  }
  if (!allVaccines.length) {
    const stored = loadStorage(STORAGE_KEYS.VACCINES, INITIAL_VACCINES);
    allVaccines = stored.filter(v => v.clinicId === clinicId || v.destinationClinicId === clinicId);
  }

  // Active batches under monitoring at this facility (exclude already Delivered or Compromised)
  const activeBatches = allVaccines.filter(v => v.status !== 'Delivered' && v.status !== 'Compromised');

  // 2. Fetch existing alerts
  let allAlerts = [];
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'breachAlerts'), where('clinicId', '==', clinicId));
      const snap = await getDocs(q);
      allAlerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Firestore alerts fetch for excursion evaluation error:', e);
    }
  }
  if (!allAlerts.length) {
    allAlerts = loadStorage(STORAGE_KEYS.ALERTS, INITIAL_BREACH_ALERTS);
  }

  // Map of active alerts by batchId (where timer is active or alert is unresolved)
  const activeAlertMap = new Map();
  allAlerts.forEach((a) => {
    const bId = a.batchId || a.affectedBatchId;
    if (bId && !a.isResolved) {
      // Prioritize active timer alert if multiple exist
      if (!activeAlertMap.has(bId) || a.timerActive) {
        activeAlertMap.set(bId, a);
      }
    }
  });

  let hasBreach = false;
  const nowMs = new Date(timestamp).getTime();
  const affectedBatches = [];

  for (const batch of activeBatches) {
    // IMPORTANT: Do NOT add fixed/default minTemperature or maxTemperature values.
    // Use the minTemperature and maxTemperature already provided for each vaccine batch.
    if (typeof batch.minTemperature !== 'number' || typeof batch.maxTemperature !== 'number') {
      continue;
    }

    const minTemp = batch.minTemperature;
    const maxTemp = batch.maxTemperature;
    // Use maxExcursionDurationMinutes entered/configured for each batch
    const maxExcursionMinutes = Number(batch.maxExcursionDurationMinutes || 60);
    // Set warningBeforeMinutes default to 16 minutes
    const warningBeforeMinutes = Number(batch.warningBeforeMinutes ?? 16);

    const isOutsideRange = tempVal < minTemp || tempVal > maxTemp;
    const existingAlert = activeAlertMap.get(batch.batchId);

    if (isOutsideRange) {
      hasBreach = true;
      affectedBatches.push(batch.batchId);

      if (existingAlert && existingAlert.timerActive) {
        // PREVENT DUPLICATE ALERTS for the same active batch excursion (Rule 8)
        // Update live duration, remaining time, and status
        const startMs = new Date(existingAlert.excursionStartTime || timestamp).getTime();
        const elapsedMinutes = Math.max(0, parseFloat(((nowMs - startMs) / 60000).toFixed(1)));
        const remainingMinutes = Math.max(0, parseFloat((maxExcursionMinutes - elapsedMinutes).toFixed(1)));

        // Status rules:
        // Rule 5: CRITICAL starts when excursion duration reaches maxExcursionDurationMinutes
        // Rule 4: WARNING starts when remaining allowed excursion time <= warningBeforeMinutes (16 min default)
        let status = 'EXCURSION';
        if (remainingMinutes <= warningBeforeMinutes) {
          status = 'WARNING';
        }
        if (elapsedMinutes >= maxExcursionMinutes) {
          status = 'CRITICAL';
        }

        existingAlert.temperature = tempVal;
        if (tempVal > (existingAlert.peakTemperature ?? tempVal)) {
          existingAlert.peakTemperature = tempVal;
        }
        existingAlert.excursionDurationMinutes = elapsedMinutes;
        existingAlert.remainingMinutes = remainingMinutes;
        existingAlert.status = status;
        existingAlert.lastEvaluatedAt = timestamp;
        existingAlert.unit = unit;

        if (isFirebaseConfigured && db && existingAlert.id) {
          try {
            await updateDoc(doc(db, 'breachAlerts', existingAlert.id), existingAlert);
          } catch (e) {
            console.warn('Firestore update alert error:', e);
          }
        }
      } else {
        // Start tracking excursion duration independently for this batch (Rule 2 & 3)
        const elapsedMinutes = 0;
        const remainingMinutes = maxExcursionMinutes;
        let status = 'EXCURSION';
        if (remainingMinutes <= warningBeforeMinutes) {
          status = 'WARNING';
        }
        if (elapsedMinutes >= maxExcursionMinutes) {
          status = 'CRITICAL';
        }

        const newAlert = {
          id: `alt-${Date.now()}-${batch.batchId}`,
          clinicId,
          clinicName: batch.clinicName || clinicName,
          batchId: batch.batchId,
          affectedBatchId: batch.batchId,
          vaccineName: batch.vaccineName,
          affectedVaccineName: batch.vaccineName,
          temperature: tempVal,
          peakTemperature: tempVal,
          minTemperature: minTemp,
          maxTemperature: maxTemp,
          allowedRange: `${minTemp}°C – ${maxTemp}°C`,
          excursionStartTime: timestamp,
          excursionDurationMinutes: 0,
          maxExcursionDurationMinutes: maxExcursionMinutes,
          warningBeforeMinutes: warningBeforeMinutes,
          remainingMinutes,
          status,
          timerActive: true,
          isResolved: false,
          unit,
          timestamp,
          severity: tempVal > maxTemp
            ? `High Temperature Excursion (${tempVal}°C > ${maxTemp}°C)`
            : `Freezing Violation (${tempVal}°C < ${minTemp}°C)`,
          recommendedAction: `Excursion detected for batch ${batch.batchId} (${batch.vaccineName}). Allowed limit: ${maxExcursionMinutes} min.`
        };

        allAlerts.unshift(newAlert);
        activeAlertMap.set(batch.batchId, newAlert);

        if (isFirebaseConfigured && db) {
          try {
            await addDoc(collection(db, 'breachAlerts'), newAlert);
          } catch (e) {
            console.warn('Firestore add alert error:', e);
          }
        }
      }
    } else {
      // Temperature returned within batch's allowed range!
      // Rule 6: When temperature returns within the batch's allowed range, stop the timer and move the batch to QUARANTINE_REVIEW.
      // Rule 7: Do not automatically mark the batch SAFE after recovery.
      if (existingAlert && existingAlert.timerActive) {
        const startMs = new Date(existingAlert.excursionStartTime || timestamp).getTime();
        const finalElapsedMinutes = Math.max(0, parseFloat(((nowMs - startMs) / 60000).toFixed(1)));
        const remainingMinutes = Math.max(0, parseFloat((maxExcursionMinutes - finalElapsedMinutes).toFixed(1)));

        // Stop timer
        existingAlert.timerActive = false;
        existingAlert.timerStoppedAt = timestamp;
        existingAlert.excursionDurationMinutes = finalElapsedMinutes;
        existingAlert.remainingMinutes = remainingMinutes;
        existingAlert.temperature = tempVal;
        existingAlert.status = 'QUARANTINE_REVIEW';
        existingAlert.recommendedAction = `Temperature recovered to ${tempVal}°C (within allowed range ${minTemp}°C – ${maxTemp}°C). Batch placed in QUARANTINE_REVIEW for safety inspection.`;

        if (isFirebaseConfigured && db && existingAlert.id) {
          try {
            await updateDoc(doc(db, 'breachAlerts', existingAlert.id), existingAlert);
          } catch (e) {
            console.warn('Firestore stop alert error:', e);
          }
        }

        // Move the batch to QUARANTINE_REVIEW (Do not mark SAFE!)
        await updateVaccineStatus(batch.id, 'QUARANTINE_REVIEW', {
          clinicId: batch.clinicId,
          clinicName: batch.clinicName,
          note: `Temperature recovered to ${tempVal}°C (within ${minTemp}°C – ${maxTemp}°C). Excursion timer stopped after ${finalElapsedMinutes} min. Batch automatically transferred to QUARANTINE_REVIEW.`
        });
      }
    }
  }

  // Save alerts to local storage
  saveStorage(STORAGE_KEYS.ALERTS, allAlerts);
  notifyListeners('alerts');

  return {
    hasBreach,
    affectedBatches,
    alerts: allAlerts
  };
}

export async function addTemperatureLog({ clinicId, clinicName, temperature, unit = 'Cold Storage Main', recordedBy = 'Manual Entry' }) {
  const tempVal = parseFloat(Number(temperature).toFixed(1));
  const now = new Date();

  // Evaluate batch-level excursions using each batch's own minTemperature and maxTemperature
  const evaluation = await evaluateBatchExcursions(
    clinicId,
    clinicName,
    tempVal,
    now.toISOString(),
    unit
  );

  const logEntry = {
    clinicId,
    clinicName,
    temperature: tempVal,
    unit,
    timestamp: now.toISOString(),
    timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isBreach: evaluation.hasBreach,
    affectedBatches: evaluation.affectedBatches,
    recordedBy
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'temperatureLogs'), logEntry);
      return { id: docRef.id, ...logEntry, evaluation };
    } catch (e) {
      console.warn('Firestore addTemperatureLog error:', e);
    }
  }

  const id = `temp-${Date.now()}`;
  const allLogs = loadStorage(STORAGE_KEYS.TEMP_LOGS, generateInitialTemperatureLogs(clinicId));
  allLogs.unshift({ id, ...logEntry });
  // Keep last 48 entries
  saveStorage(STORAGE_KEYS.TEMP_LOGS, allLogs.slice(0, 48));

  notifyListeners('tempLogs');
  return { id, ...logEntry, evaluation };
}

// ==========================================
// BREACH ALERTS
// ==========================================

export function subscribeBreachAlerts(clinicId, callback) {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'breachAlerts'),
        where('clinicId', '==', clinicId)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(list);
      }, (err) => {
        console.warn('Firestore breachAlerts error:', err);
      });
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore subscribeBreachAlerts error:', e);
    }
  }

  const emit = () => {
    const all = loadStorage(STORAGE_KEYS.ALERTS, INITIAL_BREACH_ALERTS);
    const filtered = all.filter(a => a.clinicId === clinicId);
    callback(filtered);
  };

  emit();
  listeners.alerts.add(emit);
  return () => listeners.alerts.delete(emit);
}

export async function resolveBreachAlert(alertId, resolutionNote = 'Resolved by operator') {
  if (isFirebaseConfigured && db) {
    try {
      const alertRef = doc(db, 'breachAlerts', alertId);
      await updateDoc(alertRef, {
        isResolved: true,
        resolvedAt: new Date().toISOString(),
        resolutionNote
      });
      return true;
    } catch (e) {
      console.warn('Firestore resolveBreachAlert error:', e);
    }
  }

  const all = loadStorage(STORAGE_KEYS.ALERTS, INITIAL_BREACH_ALERTS);
  const index = all.findIndex(a => a.id === alertId);
  if (index !== -1) {
    all[index] = {
      ...all[index],
      isResolved: true,
      resolvedAt: new Date().toISOString(),
      resolutionNote
    };
    saveStorage(STORAGE_KEYS.ALERTS, all);
    notifyListeners('alerts');
    return true;
  }
  return false;
}

// ==========================================
// USER PROFILES
// ==========================================

export async function getUserProfile(uid, email) {
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch (e) {
      console.warn('Firestore getUserProfile error:', e);
    }
    // No profile document for this Firebase user yet.
    return null;
  }

  const users = loadStorage(STORAGE_KEYS.USERS, {});
  if (email && users[email]) {
    return users[email];
  }

  // No matching local profile — caller decides the appropriate fallback.
  return null;
}

export async function saveUserProfile(uid, profileData) {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'users', uid), profileData, { merge: true });
      return true;
    } catch (e) {
      console.warn('Firestore saveUserProfile error:', e);
    }
  }

  const users = loadStorage(STORAGE_KEYS.USERS, {});
  if (profileData.email) {
    users[profileData.email] = { uid, ...profileData };
    saveStorage(STORAGE_KEYS.USERS, users);
  }
  return true;
}
