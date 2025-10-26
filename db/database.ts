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
  synced?: number;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabase({ name: 'fridge.db', location: 'default' });
    await executeSql('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
};

export const executeSql = async (sql: string, params: any[] = []): Promise<SQLite.ResultSet[]> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve([result]),
        (_, error) => { reject(error); return false; }
      );
    });
  });
};

export const createTables = async () => {
  await executeSql(`
    CREATE TABLE IF NOT EXISTS fridges (
      fridge_id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      status TEXT,
      last_sync TEXT,
      battery_level REAL
    );
  `);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      reading_id TEXT PRIMARY KEY NOT NULL,
      fridge_id TEXT,
      temperature REAL,
      timestamp TEXT DEFAULT (datetime('now')),
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (fridge_id) REFERENCES fridges(fridge_id)
    );
  `);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS inventory (
      fridge_id TEXT PRIMARY KEY NOT NULL,
      current_count INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (fridge_id) REFERENCES fridges(fridge_id)
    );
  `);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS inventory_log (
      log_id TEXT PRIMARY KEY NOT NULL,
      fridge_id TEXT NOT NULL,
      action TEXT CHECK(action IN ('add', 'remove')),
      count INTEGER NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (fridge_id) REFERENCES inventory(fridge_id)
    );
  `);

  await executeSql(`
    CREATE TRIGGER IF NOT EXISTS update_inventory_after_log
    AFTER INSERT ON inventory_log
    BEGIN
      UPDATE inventory
      SET current_count = CASE
        WHEN NEW.action = 'add' THEN current_count + NEW.count
        WHEN NEW.action = 'remove' THEN current_count - NEW.count
      END,
      last_updated = datetime('now')
      WHERE fridge_id = NEW.fridge_id;
    END;
  `);
};

export const insertFridge = async (fridge: Fridge) => {
  const { fridge_id, name, status, last_sync, battery_level } = fridge;
  try {
    await executeSql(
      `INSERT OR REPLACE INTO fridges (fridge_id, name, status, last_sync, battery_level)
       VALUES (?, ?, ?, ?, ?);`,
      [fridge_id, name ?? null, status ?? null, last_sync ?? null, battery_level ?? null]
    );
  } catch (err) {
    console.error('Failed to insert fridge:', err);
  }
};

export const getAllFridges = async (): Promise<Fridge[]> => {
  try {
    const [result] = await executeSql(`SELECT * FROM fridges;`);
    return result.rows.raw() as Fridge[];
  } catch (err) {
    console.error('Failed to get fridges:', err);
    return [];
  }
};

export const updateFridgeStatus = async (fridge_id: string, status: string) => {
  try {
    await executeSql(`UPDATE fridges SET status = ? WHERE fridge_id = ?;`, [status, fridge_id]);
  } catch (err) {
    console.error('Failed to update fridge status:', err);
  }
};

export const insertSensorReading = async (reading: SensorReading) => {
  const { reading_id, fridge_id, temperature, timestamp, synced = 0 } = reading;
  try {
    await executeSql(
      `INSERT OR REPLACE INTO sensor_readings (reading_id, fridge_id, temperature, timestamp, synced)
       VALUES (?, ?, ?, ?, ?);`,
      [reading_id, fridge_id, temperature, timestamp, synced]
    );
  } catch (err) {
    console.error('Failed to insert sensor reading:', err);
  }
};

export const getUnsyncedReadings = async (): Promise<SensorReading[]> => {
  try {
    const [result] = await executeSql(`SELECT * FROM sensor_readings WHERE synced = 0;`);
    return result.rows.raw() as SensorReading[];
  } catch (err) {
    console.error('Failed to get unsynced readings:', err);
    return [];
  }
};

export const markReadingsAsSynced = async (readingIds: string[]) => {
  if (!readingIds.length) return;
  const placeholders = readingIds.map(() => '?').join(',');
  try {
    await executeSql(
      `UPDATE sensor_readings SET synced = 1 WHERE reading_id IN (${placeholders});`,
      readingIds
    );
  } catch (err) {
    console.error('Failed to mark readings as synced:', err);
  }
};

export const getInventory = async (): Promise<Inventory[]> => {
  try {
    const [result] = await executeSql(`SELECT * FROM inventory;`);
    console.log('Fetched inventory successfully');
    return result.rows.raw() as Inventory[];
  } catch (err) {
    console.error('Failed to get inventory:', err);
    return [];
  }
};

export const logInventoryAction = async (log: InventoryLog) => {
  const { log_id, fridge_id, action, count, synced = 0 } = log;
  try {
    await executeSql(
      `INSERT INTO inventory_log (log_id, fridge_id, action, count, synced)
       VALUES (?, ?, ?, ?, ?);`,
      [log_id, fridge_id, action, count, synced]
    );
    console.log('Logged inventory action successfully');
  } catch (err) {
    console.error('Failed to log inventory action:', err);
  }
};

export const getInventoryLogs = async (fridge_id: string): Promise<InventoryLog[]> => {
  try {
    const [result] = await executeSql(
      `SELECT * FROM inventory_log WHERE fridge_id = ? ORDER BY timestamp DESC;`,
      [fridge_id]
    );
    console.log('Fetched inventory logs successfully');
    return result.rows.raw() as InventoryLog[];
  } catch (err) {
    console.error('Failed to get inventory logs:', err);
    return [];
  }
};

export const insertInitialFridge = async () => {
  const fridges = await getAllFridges();
  if (fridges.length === 0) {
    await insertFridge({
      fridge_id: 'fridge_1',
      name: 'Main Fridge',
      status: 'online',
      battery_level: 100,
      last_sync: new Date().toISOString(),
    });
    console.log('Inserted initial fridge');
  } else {
    console.log('Fridge already exists, skipping initial insert');
  }
};
