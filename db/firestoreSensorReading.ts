import firestore from '@react-native-firebase/firestore';
import { SensorReading } from '../db/database';

// Reference for combined sensor reading logs collection
const sensorReadingsRef = firestore().collection('SensorReadings');

// Fetch logs
export async function getSensorLogsFirestore(fridgeId: string) {
  const snapshot = await sensorReadingsRef
    .where('fridge_id', '==', fridgeId)
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get();

  return snapshot.docs.map(d => d.data() as SensorReading);
}

// Fetch current/latest reading
export async function getCurrentReadingFirestore(fridgeId: string) {
  const snapshot = await sensorReadingsRef
    .where('fridge_id', '==', fridgeId)
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const latest = snapshot.docs[0].data() as SensorReading;
    return latest;
  }

  return null;
}

// Add log
export async function logSensorReadingFirestore(log: SensorReading) {
  // Write log document (creates collection automatically)
  await sensorReadingsRef.doc(log.reading_id).set(log);

}
