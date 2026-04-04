import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

admin.initializeApp();

const db = admin.firestore();
const FRIDGE_ID = 'fridge_1';

/**
 * Runs every 15 minutes.
 * Reads the current temperature from Firestore and compares it against
 * the safe range stored in Settings. Sends an FCM push notification to
 * all registered device tokens if the temperature is out of range.
 */
export const checkTemperatureAlert = onSchedule('every 15 minutes', async () => {
  // 1. Read temperature range from settings
  const settingsSnap = await db.doc(`Settings/${FRIDGE_ID}`).get();
  const settings = settingsSnap.data();

  if (!settings) {
    console.log('No settings document found — skipping alert check.');
    return;
  }

  const tempMin: number = settings.temp_min ?? 2;
  const tempMax: number = settings.temp_max ?? 8;

  // 2. Read latest sensor reading
  const readingsSnap = await db
    .collection('SensorReadings')
    .where('fridge_id', '==', FRIDGE_ID)
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();

  if (readingsSnap.empty) {
    console.log('No sensor readings found — skipping alert check.');
    return;
  }

  const latestReading = readingsSnap.docs[0].data();
  const temp: number = latestReading.temperature;

  console.log(`Temperature: ${temp}°C | Range: ${tempMin}–${tempMax}°C`);

  // 3. Only proceed if temperature is out of range
  if (temp >= tempMin && temp <= tempMax) {
    console.log('Temperature within range — no alert needed.');
    return;
  }

  // 4. Get all registered device tokens
  const tokensSnap = await db.collection('DeviceTokens').get();
  const tokens = tokensSnap.docs
    .map(doc => doc.data().token as string)
    .filter(Boolean);

  if (tokens.length === 0) {
    console.log('No registered device tokens — skipping notification.');
    return;
  }

  // 5. Build notification message
  const isLow = temp < tempMin;
  const title = 'Fridge Temperature Alert';
  const body = isLow
    ? `Temperature is too low: ${temp.toFixed(1)}°C (min: ${tempMin}°C)`
    : `Temperature is too high: ${temp.toFixed(1)}°C (max: ${tempMax}°C)`;

  // 6. Send to all registered devices
  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    android: {
      priority: 'high',
      notification: { channelId: 'temperature_alerts' },
    },
  });

  console.log(
    `Notifications sent: ${response.successCount} success, ${response.failureCount} failed.`
  );

  // 7. Clean up any tokens that are no longer valid
  const invalidTokenDeletions: Promise<void>[] = [];
  response.responses.forEach((res, idx) => {
    if (!res.success && res.error?.code === 'messaging/registration-token-not-registered') {
      invalidTokenDeletions.push(
        db.collection('DeviceTokens').doc(tokens[idx]).delete().then(() => {})
      );
    }
  });
  await Promise.all(invalidTokenDeletions);
});
