import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeVaccines,
  subscribeTemperatureLogs,
  subscribeBreachAlerts,
  getClinics,
  addVaccine,
  updateVaccineStatus,
  addTemperatureLog,
  resolveBreachAlert,
  rerouteVaccines
} from '../services/dataService';
import { mockSensor } from '../services/mockSensors';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { currentUser, clinic } = useAuth();

  const [vaccines, setVaccines] = useState([]);
  const [tempLogs, setTempLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [allClinics, setAllClinics] = useState([]);
  const [sensorState, setSensorState] = useState({
    isRunning: false,
    currentTemp: 4.4,
    intervalMs: 15000
  });

  // Load all clinics list
  useEffect(() => {
    getClinics().then(setAllClinics);
  }, []);

  // Sync mock sensor with active clinic
  useEffect(() => {
    if (clinic) {
      mockSensor.setClinic(clinic);
    }
  }, [clinic]);

  // Subscribe to mock sensor updates
  useEffect(() => {
    const unsub = mockSensor.subscribe(setSensorState);
    return unsub;
  }, []);

  // Subscriptions bound to current user's clinicId
  useEffect(() => {
    if (!currentUser?.clinicId) return;

    const unsubVaccines = subscribeVaccines(currentUser.clinicId, setVaccines);
    const unsubTemp = subscribeTemperatureLogs(currentUser.clinicId, setTempLogs);
    const unsubAlerts = subscribeBreachAlerts(currentUser.clinicId, setAlerts);

    return () => {
      if (unsubVaccines) unsubVaccines();
      if (unsubTemp) unsubTemp();
      if (unsubAlerts) unsubAlerts();
    };
  }, [currentUser?.clinicId]);

  // Operational metrics calculated in real-time
  const stats = useMemo(() => {
    // Current clinic's inventory
    const totalVaccines = vaccines.length;
    const inStorage = vaccines.filter(v => v.status === 'In Storage').length;
    const inTransit = vaccines.filter(v => v.status === 'In Transit').length;
    const delivered = vaccines.filter(v => v.status === 'Delivered').length;
    const compromised = vaccines.filter(v => v.status === 'Compromised').length;
    const quarantineReview = vaccines.filter(v => v.status === 'QUARANTINE_REVIEW').length;

    // Latest temperature reading
    const latestLog = tempLogs[0] || null;
    const currentTemp = latestLog ? latestLog.temperature : 4.4;

    const activeBreaches = alerts.filter(a => !a.isResolved);
    const activeExcursions = activeBreaches.filter(a => a.timerActive);

    // Evaluate overall status based on batch excursions and quarantine state:
    // Status precedence: CRITICAL > WARNING > QUARANTINE_REVIEW > NORMAL
    let overallStatus = 'NORMAL';
    if (activeBreaches.some(a => a.status === 'CRITICAL')) {
      overallStatus = 'CRITICAL';
    } else if (activeBreaches.some(a => a.status === 'WARNING' || a.status === 'EXCURSION')) {
      overallStatus = 'WARNING';
    } else if (quarantineReview > 0 || activeBreaches.some(a => a.status === 'QUARANTINE_REVIEW')) {
      overallStatus = 'QUARANTINE_REVIEW';
    } else {
      overallStatus = 'NORMAL';
    }

    // Check if currentTemp is outside any active storage batch's allowed range
    const breachedBatches = vaccines.filter(v => {
      if (v.status === 'Delivered' || v.status === 'Compromised') return false;
      if (typeof v.minTemperature !== 'number' || typeof v.maxTemperature !== 'number') return false;
      return currentTemp < v.minTemperature || currentTemp > v.maxTemperature;
    });

    const isBreached = activeBreaches.length > 0 || breachedBatches.length > 0;

    return {
      totalVaccines,
      inStorage,
      inTransit,
      delivered,
      compromised,
      quarantineReview,
      currentTemp,
      tempStatus: overallStatus,
      isBreached,
      activeBreachesCount: activeBreaches.length,
      activeBreaches,
      activeExcursions,
      breachedBatches
    };
  }, [vaccines, tempLogs, alerts]);

  // Action methods
  const createVaccine = async (vaccineData) => {
    return await addVaccine({
      ...vaccineData,
      clinicId: currentUser.clinicId,
      clinicName: currentUser.clinicName
    }, currentUser.email);
  };

  const changeVaccineStatus = async (vaccineId, newStatus, details = {}) => {
    return await updateVaccineStatus(vaccineId, newStatus, {
      clinicId: currentUser.clinicId,
      clinicName: currentUser.clinicName,
      userId: currentUser.email,
      ...details
    });
  };

  const recordManualTemperature = async (temperature, unit, recordedBy = currentUser?.name || currentUser?.email) => {
    return await addTemperatureLog({
      clinicId: currentUser.clinicId,
      clinicName: currentUser.clinicName,
      temperature,
      unit,
      recordedBy
    });
  };

  const resolveAlertItem = async (alertId, note) => {
    return await resolveBreachAlert(alertId, note);
  };

  const executeReroute = async (vaccineIds, targetClinic) => {
    if (!clinic || !targetClinic) return false;
    return await rerouteVaccines(
      vaccineIds,
      clinic,
      targetClinic,
      currentUser.email
    );
  };

  const value = {
    vaccines,
    tempLogs,
    alerts,
    allClinics,
    stats,
    sensorState,
    createVaccine,
    changeVaccineStatus,
    recordManualTemperature,
    resolveAlertItem,
    executeReroute,
    mockSensor
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
