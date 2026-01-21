import firestore from '@react-native-firebase/firestore';

// get reference to settings document
const settingsRef = (fridgeId: string) =>
  firestore().collection('Settings').doc(fridgeId);

// Update the temperature range
export async function updateTemperatureRange(fridgeId: string, min: number, max: number) {
    // Update the settings document with new min and max temperature
  return settingsRef(fridgeId).set(
    {
      temp_min: min,
      temp_max: max,
    },
    { merge: true }
  );
}

export async function updateBatteryLevel(fridgeId: string, value: number) {
    // Update the settings document with new min and max temperature
  return settingsRef(fridgeId).set(
    {
      battery_min: value,
    },
    { merge: true }
  );
}

export async function updateMinimumInventory(fridgeId: string, value: number) {
    // Update the settings document with new min and max temperature
  return settingsRef(fridgeId).set(
    {
      inventory_min: value,
    },
    { merge: true }
  );
}

export async function updateGridDisconnect(fridgeId: string, isEnabled: boolean) {
    // Update the settings document with new grid disconnect status
  return settingsRef(fridgeId).set(
    {
      grid_disconnect: isEnabled,
    },
    { merge: true }
  );
}