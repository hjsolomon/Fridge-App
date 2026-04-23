import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

admin.initializeApp();

const db = admin.firestore();
const FRIDGE_ID = 'fridge_1';

/**
 * Runs every 5 minutes.
 * Reads the current temperature from Firestore and compares it against
 * the safe range stored in Settings. Sends an FCM push notification to
 * all registered device tokens if the temperature is out of range.
 */
export const checkTemperatureAlert = onSchedule('every 5 minutes', async () => {
  // 1. Read temperature range from settings
  const settingsSnap = await db.doc(`Settings/${FRIDGE_ID}`).get();
  const settings = settingsSnap.data();

  if (!settings) {
    console.log('No settings document found — skipping alert check.');
    return;
  }

  const tempMin: number = settings.temp_min ?? 2;
  const tempMax: number = settings.temp_max ?? 8;

  // 2. Read recent sensor readings (newest first) to find the current
  //    temperature and determine when it first left the safe range
  const readingsSnap = await db
    .collection('SensorReadings')
    .where('fridge_id', '==', FRIDGE_ID)
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();

  if (readingsSnap.empty) {
    console.log('No sensor readings found — skipping alert check.');
    return;
  }

  const readings = readingsSnap.docs.map(d => d.data());
  const temp: number = readings[0].temperature;

  console.log(`Temperature: ${temp}°C | Range: ${tempMin}–${tempMax}°C`);

  // 3. Only proceed if temperature is out of range
  if (temp >= tempMin && temp <= tempMax) {
    console.log('Temperature within range — no alert needed.');
    return;
  }

  // Walk the readings oldest-to-newest to find the earliest reading in the
  // current consecutive out-of-range run.  readings[0] is newest, so we
  // iterate forward and keep updating outOfRangeSince until we hit a reading
  // that was in range (which ends the current streak).
  let outOfRangeSince: string | null = null;
  for (const reading of readings) {
    const t = reading.temperature as number;
    if (t >= tempMin && t <= tempMax) {
      // This reading is in range — the out-of-range run started after it
      break;
    }
    // Still out of range: move the "since" marker further back in time
    outOfRangeSince = reading.timestamp as string;
  }

  // Format the "since" time for the notification body (HH:MM UTC)
  let sinceStr = '';
  if (outOfRangeSince) {
    const d = new Date(outOfRangeSince);
    const hh = d.getUTCHours().toString().padStart(2, '0');
    const mm = d.getUTCMinutes().toString().padStart(2, '0');
    sinceStr = ` — out of range since ${hh}:${mm} UTC`;
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
    ? `Temperature is too low: ${temp.toFixed(1)}°C (min: ${tempMin}°C)${sinceStr}`
    : `Temperature is too high: ${temp.toFixed(1)}°C (max: ${tempMax}°C)${sinceStr}`;

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

/**
 * Runs every 5 minutes.
 * Reads the current inventory count from Firestore and compares it against
 * the minimum threshold stored in Settings. Sends an FCM push notification to
 * all registered device tokens if inventory has dropped below the minimum.
 */
export const checkInventoryAlert = onSchedule('every 5 minutes', async () => {
  // 1. Read inventory minimum threshold from settings
  const settingsSnap = await db.doc(`Settings/${FRIDGE_ID}`).get();
  const settings = settingsSnap.data();

  if (!settings) {
    console.log('No settings document found — skipping alert check.');
    return;
  }

  const inventoryMin: number = settings.inventory_min ?? 0;

  // 2. Read current inventory count
  const inventorySnap = await db.doc(`Inventory/${FRIDGE_ID}`).get();

  if (!inventorySnap.exists) {
    console.log('No inventory document found — skipping alert check.');
    return;
  }

  const currentCount: number = inventorySnap.data()?.current_count ?? 0;

  console.log(`Inventory: ${currentCount} vials | Minimum: ${inventoryMin}`);

  // 3. Only proceed if inventory is below the minimum
  if (currentCount >= inventoryMin) {
    console.log('Inventory above minimum — no alert needed.');
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

  // 5. Send to all registered devices
  const title = 'Fridge Inventory Alert';
  const body = `Inventory is low: ${currentCount} vials (minimum: ${inventoryMin})`;

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    android: {
      priority: 'high',
      notification: { channelId: 'inventory_alerts' },
    },
  });

  console.log(
    `Notifications sent: ${response.successCount} success, ${response.failureCount} failed.`
  );

  // 6. Clean up any tokens that are no longer valid
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
