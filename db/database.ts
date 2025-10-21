import SQLite from 'react-native-sqlite-storage';

export interface Fridge {
  fridge_id: string;
  name?: string;
  status?: string;
  last_sync?: string; 
  battery_level?: number;
}

export interface SensorReading {
  reading_id: string;
  fridge_id: string;
  temperature: number;
  timestamp: string; 
  synced?: number; 
}

export interface Inventory {
  fridge_id: string;
  current_count: number;
  last_updated?: string;
}

export interface InventoryLog {
  log_id: string;
  fridge_id: string;
  action: 'add' | 'remove';
  count: number;
  timestamp?: string;
}



export const openDatabase = async () => {
  return SQLite.openDatabase({ name: 'fridge.db', location: 'default' });
};

export const createTables = async () => {
  const db = await openDatabase();
  await db.transaction(async tx => {
    await tx.executeSql(`
      CREATE TABLE IF NOT EXISTS fridges (
        fridge_id TEXT PRIMARY KEY NOT NULL,
        name TEXT,
        status TEXT,
        last_sync DATETIME,
        battery_level REAL
      );
    `);
    await tx.executeSql(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        reading_id TEXT PRIMARY KEY NOT NULL,
        fridge_id TEXT,
        temperature REAL,
        timestamp DATETIME,
        synced INTEGER DEFAULT 0
      );
    `);
    await tx.executeSql(`
        CREATE TABLE IF NOT EXISTS inventory (
        fridge_id TEXT PRIMARY KEY NOT NULL,
        current_count INTEGER NOT NULL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    await tx.executeSql(`
        CREATE TABLE IF NOT EXISTS inventory_log (
        log_id TEXT PRIMARY KEY NOT NULL,
        fridge_id TEXT NOT NULL,
        action TEXT CHECK(action IN ('add', 'remove')),
        count INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fridge_id) REFERENCES inventory(fridge_id)
        );
    `);
  });
};

export const insertFridge = async (fridge: Fridge): Promise<void> => {
  const db = await openDatabase();
  const { fridge_id, name, status, last_sync, battery_level } = fridge;
  await db.transaction(async tx => {
    await tx.executeSql(
      `INSERT OR REPLACE INTO fridges (fridge_id, name, status, last_sync, battery_level)
       VALUES (?, ?, ?, ?, ?)`,
      [fridge_id, name ?? null, status ?? null, last_sync ?? null, battery_level ?? null]
    );
  });
};

export const getAllFridges = async (): Promise<Fridge[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM fridges`,
        [],
        (_, { rows }) => resolve(rows.raw() as Fridge[]),
        (_, error) => reject(error)
      );
    });
  });
};

export const updateFridgeStatus = async (
  fridge_id: string,
  status: string
): Promise<void> => {
  const db = await openDatabase();
  await db.transaction(async tx => {
    await tx.executeSql(
      `UPDATE fridges SET status = ? WHERE fridge_id = ?`,
      [status, fridge_id]
    );
  });
};

export const deleteFridge = async (fridge_id: string): Promise<void> => {
  const db = await openDatabase();
  await db.transaction(async tx => {
    await tx.executeSql(`DELETE FROM fridges WHERE fridge_id = ?`, [fridge_id]);
  });
};

export const insertSensorReading = async (
  reading: SensorReading
): Promise<void> => {
  const db = await openDatabase();
  const { reading_id, fridge_id, temperature, timestamp, synced = 0 } = reading;
  await db.transaction(async tx => {
    await tx.executeSql(
      `INSERT OR REPLACE INTO sensor_readings (reading_id, fridge_id, temperature, timestamp, synced)
       VALUES (?, ?, ?, ?, ?)`,
      [reading_id, fridge_id, temperature, timestamp, synced]
    );
  });
};

export const getUnsyncedReadings = async (): Promise<SensorReading[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM sensor_readings WHERE synced = 0`,
        [],
        (_, { rows }) => resolve(rows.raw() as SensorReading[]),
        (_, error) => reject(error)
      );
    });
  });
};

export const markReadingsAsSynced = async (
  readingIds: string[]
): Promise<void> => {
  if (!readingIds.length) return;
  const db = await openDatabase();
  const placeholders = readingIds.map(() => '?').join(',');
  await db.transaction(async tx => {
    await tx.executeSql(
      `UPDATE sensor_readings SET synced = 1 WHERE reading_id IN (${placeholders})`,
      readingIds
    );
  });
};

export const updateInventoryCount = async (
  fridge_id: string,
  newCount: number
): Promise<void> => {
  const db = await openDatabase();
  await db.transaction(async tx => {
    await tx.executeSql(
      `UPDATE inventory SET current_count = ?, last_updated = CURRENT_TIMESTAMP WHERE fridge_id = ?`,
      [newCount, fridge_id]
    );
  });
};

export const getInventory = async (): Promise<Inventory[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM inventory`,
        [],
        (_, { rows }) => resolve(rows.raw() as Inventory[]),
        (_, error) => reject(error)
      );
    });
  });
};

export const logInventoryAction = async (log: InventoryLog): Promise<void> => {
  const db = await openDatabase();
  const { log_id, fridge_id, action, count } = log;
  await db.transaction(async tx => {
    await tx.executeSql(
      `INSERT INTO inventory_log (log_id, fridge_id, action, count)
       VALUES (?, ?, ?, ?)`,
      [log_id, fridge_id, action, count]
    );
  });
};

export const getInventoryLogs = async (
  fridge_id: string
): Promise<InventoryLog[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM inventory_log WHERE fridge_id = ? ORDER BY timestamp DESC`,
        [fridge_id],
        (_, { rows }) => resolve(rows.raw() as InventoryLog[]),
        (_, error) => reject(error)
      );
    });
  });
};