import firestore from '@react-native-firebase/firestore';
import { InventoryLog } from '../db/database';

// References
const inventoryRef = (fridgeId: string) =>
  firestore().collection('Inventory').doc(fridgeId);

const logsRef = firestore().collection('InventoryLogs');

// Fetch logs
export function getInventoryLogsFirestore(fridgeId: string, callback: (logs: InventoryLog[]) => void) {
  const unsubscribe = logsRef
    .where('fridge_id', '==', fridgeId)
    .orderBy('timestamp', 'desc')
    .limit(20)
    .onSnapshot(snapshot => {
      const logs = snapshot.docs.map(doc => doc.data() as InventoryLog);
      callback(logs);
    });
  return unsubscribe;
}



// Fetch Current Inventory
export function getCurrentInventoryFirestore(fridgeId: string, callback: (count: number) => void) {
  const unsubscribe = inventoryRef(fridgeId).onSnapshot(snapshot => {
    if (snapshot.exists()) {
      callback(snapshot.data()?.current_count ?? 0);
    } else {
      callback(0);
    }
  });
  return unsubscribe;
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
