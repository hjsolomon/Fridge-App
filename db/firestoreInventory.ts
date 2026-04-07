/**
 * firestoreInventory.ts
 * ----------------------
 * Firestore service functions for inventory data.
 *
 * Collections used:
 * - `Inventory/{fridgeId}`   — Document storing the current vial count for a fridge.
 * - `InventoryLogs`          — Collection of all inventory action records (add/remove/set).
 *
 * All listener functions return an `unsubscribe` callback; call it on component
 * unmount to prevent memory leaks.
 */

import firestore from '@react-native-firebase/firestore';
import { InventoryLog } from '../db/database';

/** Returns a Firestore DocumentReference for a fridge's inventory summary. */
const inventoryRef = (fridgeId: string) =>
  firestore().collection('Inventory').doc(fridgeId);

const logsRef = firestore().collection('InventoryLogs');

/**
 * getInventoryLogsFirestore
 * --------------------------
 * Subscribes to real-time inventory action logs for a specific fridge, ordered
 * chronologically (oldest first), limited to the 20 most recent entries.
 *
 * @param fridgeId - The ID of the fridge to fetch logs for.
 * @param callback - Called with the updated array of InventoryLog records on each change.
 * @returns An unsubscribe function to detach the Firestore listener.
 */
export function getInventoryLogsFirestore(
  fridgeId: string,
  callback: (logs: InventoryLog[]) => void,
) {
  const unsubscribe = logsRef
    .where('fridge_id', '==', fridgeId)
    .orderBy('timestamp', 'asc')
    .limit(20)
    .onSnapshot(snapshot => {
      const logs = snapshot.docs.map(d => d.data() as InventoryLog);
      callback(logs);
    });

  return unsubscribe;
}

/**
 * getCurrentInventoryFirestore
 * -----------------------------
 * Subscribes to real-time updates for a fridge's current vial count.
 * Returns 0 if the inventory document does not yet exist.
 *
 * @param fridgeId - The ID of the fridge to watch.
 * @param callback - Called with the current vial count whenever it changes.
 * @returns An unsubscribe function to detach the Firestore listener.
 */
export function getCurrentInventoryFirestore(
  fridgeId: string,
  callback: (count: number) => void,
) {
  const unsubscribe = inventoryRef(fridgeId).onSnapshot(snapshot => {
    if (snapshot.exists()) {
      callback(snapshot.data()?.current_count ?? 0);
    } else {
      callback(0);
    }
  });

  return unsubscribe;
}

/**
 * logInventoryActionFirestore
 * ----------------------------
 * Writes an inventory action log to Firestore and atomically updates the
 * fridge's current vial count.
 *
 * Action semantics:
 * - `'add'`    — Increments current_count by log.count.
 * - `'remove'` — Decrements current_count by log.count.
 * - `'set'`    — Overwrites current_count with log.count (no-op if already equal,
 *                checked both before and inside the transaction to guard race conditions).
 *
 * @param log - The InventoryLog record describing the action to record.
 */
export async function logInventoryActionFirestore(log: InventoryLog) {
  const invRef = inventoryRef(log.fridge_id);

  // For 'set' actions, check current value before writing anything
  if (log.action === 'set') {
    const doc = await invRef.get();
    const current = doc.exists() ? Number(doc.data()?.current_count ?? 0) : 0;
    if (Number(log.count) === current) return;
  }

  // Write log document
  await logsRef.doc(log.log_id).set(log);

  await firestore().runTransaction(async tx => {
    const doc = await tx.get(invRef);
    const current = doc.exists() ? Number(doc.data()?.current_count ?? 0) : 0;

    if (log.action === 'set') {
      // Double-check inside transaction in case of race condition
      if (Number(log.count) === current) return;
      tx.set(invRef, { current_count: Number(log.count) }, { merge: true });
      return;
    }

    const newCount =
      log.action === 'add'
        ? current + Number(log.count)
        : current - Number(log.count);

    tx.set(invRef, { current_count: newCount }, { merge: true });
  });
}
