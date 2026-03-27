import firestore from '@react-native-firebase/firestore';
import { SensorReading } from '../db/database';

// Reference for combined sensor reading logs collection
const sensorReadingsRef = firestore().collection('SensorReadings');

// Fetch logs
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

// Fetch current/latest reading
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

// Add log
export async function logSensorReadingFirestore(log: SensorReading) {
  // Write log document (creates collection automatically)
  await sensorReadingsRef.doc(log.reading_id).set(log);
}
