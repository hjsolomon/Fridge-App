/**
 * firestoreSettings.ts
 * ---------------------
 * Firestore service functions for fridge alert/threshold settings.
 *
 * Collection used:
 * - `Settings/{fridgeId}` — Document storing configurable thresholds and alert flags
 *   for a specific fridge (temperature range, battery minimum, inventory minimum,
 *   and grid-disconnect alert toggle).
 *
 * All functions use `{ merge: true }` so they only overwrite the specified fields
 * without clobbering unrelated settings on the same document.
 */

import firestore from '@react-native-firebase/firestore';

/** Returns a Firestore DocumentReference for a fridge's settings document. */
const settingsRef = (fridgeId: string) =>
  firestore().collection('Settings').doc(fridgeId);

/**
 * updateTemperatureRange
 * -----------------------
 * Persists the acceptable temperature range for a fridge. Used to trigger
 * alerts when readings fall outside [min, max].
 *
 * @param fridgeId - The ID of the fridge to update.
 * @param min      - Minimum acceptable temperature in °C.
 * @param max      - Maximum acceptable temperature in °C.
 */
export async function updateTemperatureRange(fridgeId: string, min: number, max: number) {
  return settingsRef(fridgeId).set(
    {
      temp_min: min,
      temp_max: max,
    },
    { merge: true }
  );
}

/**
 * updateBatteryLevel
 * -------------------
 * Persists the minimum battery percentage threshold for a fridge. An alert is
 * triggered when the battery level drops below this value.
 *
 * @param fridgeId - The ID of the fridge to update.
 * @param value    - Minimum battery level percentage (0–100).
 */
export async function updateBatteryLevel(fridgeId: string, value: number) {
  return settingsRef(fridgeId).set(
    {
      battery_min: value,
    },
    { merge: true }
  );
}

/**
 * updateMinimumInventory
 * -----------------------
 * Persists the minimum vial count threshold for a fridge. An alert is triggered
 * when inventory falls below this value.
 *
 * @param fridgeId - The ID of the fridge to update.
 * @param value    - Minimum number of vials before an alert is sent.
 */
export async function updateMinimumInventory(fridgeId: string, value: number) {
  return settingsRef(fridgeId).set(
    {
      inventory_min: value,
    },
    { merge: true }
  );
}

/**
 * updateGridDisconnect
 * ---------------------
 * Enables or disables the grid-disconnect alert for a fridge. When enabled,
 * a push notification is sent if the fridge loses grid power.
 *
 * @param fridgeId  - The ID of the fridge to update.
 * @param isEnabled - `true` to enable the grid-disconnect alert, `false` to disable.
 */
export async function updateGridDisconnect(fridgeId: string, isEnabled: boolean) {
  return settingsRef(fridgeId).set(
    {
      grid_disconnect: isEnabled,
    },
    { merge: true }
  );
}