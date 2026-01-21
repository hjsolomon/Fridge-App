import firestore from '@react-native-firebase/firestore';
import { InventoryLog } from '../db/database';

// References
const inventoryRef = (fridgeId: string) =>
  firestore().collection('Inventory').doc(fridgeId);

const logsRef = firestore().collection('InventoryLogs');

// Fetch logs
export async function getInventoryLogsFirestore(fridgeId: string) {
  const snapshot = await logsRef
    .where('fridge_id', '==', fridgeId)
    .orderBy('timestamp', 'asc')
    .get();

  return snapshot.docs.map(d => d.data() as InventoryLog);
}

// Fetch Current Inventory
export async function getCurrentInventoryFirestore(fridgeId: string) {
  const doc = await inventoryRef(fridgeId).get();
  if (doc.exists()) {
    return doc.data()?.current_count ?? 0;
  }
  return 0;
}

// Add log + update inventory count safely
export async function logInventoryActionFirestore(log: InventoryLog) {
  // Write log document (creates collection automatically)
  await logsRef.doc(log.log_id).set(log);

  const invRef = inventoryRef(log.fridge_id);

  await firestore().runTransaction(async tx => {
    const doc = await tx.get(invRef);

    // If doc doesn't exist, treat as 0
    const current = doc.exists() ? doc.data()?.current_count ?? 0 : 0;

    const newCount =
      log.action === 'add' ? current + log.count : current - log.count;

    // Create or update inventory document
    tx.set(invRef, { current_count: newCount }, { merge: true });
  });
}
