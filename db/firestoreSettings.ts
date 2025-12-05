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