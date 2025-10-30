import { insertSensorReading, SensorReading } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

const FRIDGE_ID = 'fridge_1';

let simulatorRunning = false;
let interval: ReturnType<typeof setInterval> | null = null;

/**
 * Starts background sensor simulation.
 * Generates random temperature and battery readings every 5 seconds.
 */
export const startSensorSimulator = () => {
  if (simulatorRunning) return; // prevent duplicates
  simulatorRunning = true;

  console.log('Sensor simulator started');

  interval = setInterval(async () => {
    try {
      const precision = 10;
      const randomTemp =
        Math.floor(
          Math.random() * (12 * precision + 4 * precision) - 4 * precision,
        ) /
        (1 * precision);
      const randomBattery = Math.floor(Math.random() * 101);
      const timestamp = new Date().toISOString();

      const newReading: SensorReading = {
        reading_id: uuidv4(),
        fridge_id: FRIDGE_ID,
        temperature: randomTemp,
        battery_level: randomBattery,
        timestamp,
        synced: 1,
      };

      await insertSensorReading(newReading);
      console.log('New simulated reading:', newReading.temperature.toFixed(1), '°C');
    } catch (err) {
      console.error('Failed to generate simulated reading:', err);
    }
  }, 5000);
};
