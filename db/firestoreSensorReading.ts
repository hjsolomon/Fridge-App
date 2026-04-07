/**
 * firestoreSensorReading.ts
 * --------------------------
 * Firestore service functions for sensor reading data.
 *
 * Collection used:
 * - `SensorReadings` — Stores timestamped sensor readings (temperature, battery level, etc.)
 *   for all fridges. Documents are keyed by `reading_id`.
 *
 * All listener functions return an `unsubscribe` callback; call it on component
 * unmount to prevent memory leaks.
 */

import firestore from '@react-native-firebase/firestore';
import { SensorReading } from '../db/database';

/** Firestore collection reference for all sensor readings across all fridges. */
const sensorReadingsRef = firestore().collection('SensorReadings');

/**
 * getSensorLogsFirestore
 * -----------------------
 * Subscribes to real-time sensor reading logs for a specific fridge, ordered
 * by most recent first, limited to the 20 latest readings.
 *
 * @param fridgeId - The ID of the fridge to fetch readings for.
 * @param callback - Called with the updated array of SensorReading records on each change.
 * @returns An unsubscribe function to detach the Firestore listener.
 */
export function getSensorLogsFirestore(
  fridgeId: string,
  callback: (logs: SensorReading[]) => void,
) {
  const unsubscribe = sensorReadingsRef
    .where('fridge_id', '==', fridgeId)
    .orderBy('timestamp', 'desc')
    .limit(20)
    .onSnapshot(snapshot => {
      const logs = snapshot.docs.map(doc => doc.data() as SensorReading);
      callback(logs);
    });

  return unsubscribe;
}

/**
 * getCurrentReadingFirestore
 * ---------------------------
 * Subscribes to real-time updates for the single most recent sensor reading
 * for a specific fridge. Passes `null` to the callback if no readings exist yet.
 *
 * @param fridgeId - The ID of the fridge to watch.
 * @param callback - Called with the latest SensorReading (or null) whenever it changes.
 * @returns An unsubscribe function to detach the Firestore listener.
 */
export function getCurrentReadingFirestore(
  fridgeId: string,
  callback: (reading: SensorReading | null) => void,
) {
  const unsubscribe = sensorReadingsRef
    .where('fridge_id', '==', fridgeId)
    .orderBy('timestamp', 'desc')
    .limit(1)
    .onSnapshot(snapshot => {
      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data() as SensorReading;
        callback(latest);
      } else {
        callback(null);
      }
    });

  return unsubscribe;
}

/**
 * logSensorReadingFirestore
 * --------------------------
 * Writes a single sensor reading to Firestore. The document is keyed by
 * `log.reading_id`, so re-uploading the same reading is idempotent.
 *
 * @param log - The SensorReading record to persist.
 */
export async function logSensorReadingFirestore(log: SensorReading) {
  // Write log document (creates collection automatically)
  await sensorReadingsRef.doc(log.reading_id).set(log);
}
