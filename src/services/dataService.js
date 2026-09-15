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
import { db, isFirebaseConfigured } from './firebase';
import {
  INITIAL_CLINICS,
  INITIAL_VACCINES,
  INITIAL_STATUS_HISTORY,
  INITIAL_BREACH_ALERTS,
  generateInitialTemperatureLogs,
  DEMO_ACCOUNTS
} from './seedData';

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
  if (!localStorage.getItem(STORAGE_KEYS.CLINICS)) {
    saveStorage(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.VACCINES)) {
    saveStorage(STORAGE_KEYS.VACCINES, INITIAL_VACCINES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
    saveStorage(STORAGE_KEYS.HISTORY, INITIAL_STATUS_HISTORY);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ALERTS)) {
    saveStorage(STORAGE_KEYS.ALERTS, INITIAL_BREACH_ALERTS);
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

export async function addTemperatureLog({ clinicId, clinicName, temperature, unit = 'Cold Storage Main', recordedBy = 'Manual Entry' }) {
  const tempVal = parseFloat(Number(temperature).toFixed(1));
  const isBreach = tempVal < 2.0 || tempVal > 8.0;
  const now = new Date();

  const logEntry = {
    clinicId,
    clinicName,
    temperature: tempVal,
    unit,
    timestamp: now.toISOString(),
    timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isBreach,
    recordedBy
  };

  let breachAlert = null;
  if (isBreach) {
    const severity = tempVal > 8.0 
      ? `High Temperature Excursion (${tempVal}°C > 8.0°C)`
      : `Freezing Violation (${tempVal}°C < 2.0°C)`;

    breachAlert = {
      clinicId,
      clinicName,
      temperature: tempVal,
      unit,
      timestamp: now.toISOString(),
      severity,
      isResolved: false,
      recommendedAction: tempVal > 8.0
        ? 'Inspect compressor unit and evaluate smart rerouting for susceptible mRNA batches.'
        : 'Immediate check of defrost thermostat; risk of crystal formation.'
    };
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'temperatureLogs'), logEntry);
      if (isBreach && breachAlert) {
        await addDoc(collection(db, 'breachAlerts'), breachAlert);
      }
      return { id: docRef.id, ...logEntry, alert: breachAlert };
    } catch (e) {
      console.warn('Firestore addTemperatureLog error:', e);
    }
  }

  const id = `temp-${Date.now()}`;
  const allLogs = loadStorage(STORAGE_KEYS.TEMP_LOGS, generateInitialTemperatureLogs(clinicId));
  allLogs.unshift({ id, ...logEntry });
  // Keep last 48 entries
  saveStorage(STORAGE_KEYS.TEMP_LOGS, allLogs.slice(0, 48));

  if (isBreach && breachAlert) {
    const allAlerts = loadStorage(STORAGE_KEYS.ALERTS, INITIAL_BREACH_ALERTS);
    allAlerts.unshift({ id: `alt-${Date.now()}`, ...breachAlert });
    saveStorage(STORAGE_KEYS.ALERTS, allAlerts);
    notifyListeners('alerts');
  }

  notifyListeners('tempLogs');
  return { id, ...logEntry, alert: breachAlert };
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
