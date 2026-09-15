/**
 * Mock Temperature Telemetry Sensor Generator
 * 
 * Simulates periodic IoT refrigerated storage sensor broadcasts.
 * Supports start/stop, custom interval, and direct injection of temperature spikes
 * for testing cold-chain breach response and smart rerouting.
 */

import { addTemperatureLog } from './dataService';

class MockSensorService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.intervalMs = 15000; // 15 seconds by default to prevent excessive writes
    this.currentTemp = 4.4; // Base normal temperature
    this.activeClinic = null;
    this.listeners = new Set();
    this.tickCounter = 0;
  }

  setClinic(clinic) {
    this.activeClinic = clinic;
  }

  setIntervalMs(ms) {
    this.intervalMs = ms;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
    this.notify();
  }

  start(clinic) {
    if (clinic) this.activeClinic = clinic;
    if (this.isRunning) return;

    this.isRunning = true;
    this.notify();

    this.intervalId = setInterval(() => {
      this.tick();
    }, this.intervalMs);

    console.info(`[VaxSafe Telemetry] Mock sensor started (${this.intervalMs / 1000}s interval) for ${this.activeClinic?.name}`);
  }

  stop() {
    if (!this.isRunning) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    this.notify();
    console.info('[VaxSafe Telemetry] Mock sensor stopped.');
  }

  toggle(clinic) {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start(clinic);
    }
  }

  async tick() {
    if (!this.activeClinic) return;
    this.tickCounter++;

    // Subtly fluctuate temperature within safe 2°C - 8°C range
    // Realistic thermal inertia: small random walk around ~4.5°C
    const drift = (Math.random() - 0.5) * 0.4;
    let nextTemp = this.currentTemp + drift;

    // Soft spring back towards 4.5°C if drifting too close to bounds
    if (nextTemp < 2.8) nextTemp += 0.3;
    if (nextTemp > 7.0) nextTemp -= 0.3;

    this.currentTemp = parseFloat(nextTemp.toFixed(1));

    await addTemperatureLog({
      clinicId: this.activeClinic.id,
      clinicName: this.activeClinic.name,
      temperature: this.currentTemp,
      unit: 'Primary Cold Room (IoT Node #01)',
      recordedBy: 'Automated IoT Sensor'
    });

    this.notify();
  }

  /**
   * Directly inject a high-temperature breach spike (> 8.0°C)
   */
  async triggerHighBreach(customTemp = 9.8) {
    if (!this.activeClinic) return;
    this.currentTemp = customTemp;
    
    const result = await addTemperatureLog({
      clinicId: this.activeClinic.id,
      clinicName: this.activeClinic.name,
      temperature: customTemp,
      unit: 'Primary Cold Room (Chamber Excursion)',
      recordedBy: 'Simulated Sensor Event'
    });

    this.notify();
    return result;
  }

  /**
   * Directly inject a freezing temperature breach (< 2.0°C)
   */
  async triggerLowBreach(customTemp = 1.2) {
    if (!this.activeClinic) return;
    this.currentTemp = customTemp;

    const result = await addTemperatureLog({
      clinicId: this.activeClinic.id,
      clinicName: this.activeClinic.name,
      temperature: customTemp,
      unit: 'Sub-Zero Bay #2 (Thermostat Drop)',
      recordedBy: 'Simulated Sensor Event'
    });

    this.notify();
    return result;
  }

  /**
   * Normalize temperature back to healthy 4.2°C
   */
  async triggerNormal(temp = 4.2) {
    if (!this.activeClinic) return;
    this.currentTemp = temp;

    const result = await addTemperatureLog({
      clinicId: this.activeClinic.id,
      clinicName: this.activeClinic.name,
      temperature: temp,
      unit: 'Primary Cold Room',
      recordedBy: 'Simulated Sensor Event'
    });

    this.notify();
    return result;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener({
      isRunning: this.isRunning,
      currentTemp: this.currentTemp,
      intervalMs: this.intervalMs
    });
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = {
      isRunning: this.isRunning,
      currentTemp: this.currentTemp,
      intervalMs: this.intervalMs
    };
    this.listeners.forEach(fn => fn(state));
  }
}

export const mockSensor = new MockSensorService();
