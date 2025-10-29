import SQLite from 'react-native-sqlite-storage';
SQLite.DEBUG(true);
SQLite.enablePromise(true);

/**
 * Database Module
 * ----------------
 * Provides local persistence and synchronization support for fridge,
 * sensor, and inventory data using SQLite on React Native.
 *
 * Tables:
 *  - fridges
 *  - sensor_readings
 *  - inventory
 *  - inventory_log
 *
 * Includes automatic update triggers and helper functions for CRUD operations.
 */

/* -------------------------------------------------------------------------- */
/*                                Data Models                                 */
/* -------------------------------------------------------------------------- */

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
  battery_level: number;
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
  timestamp: string;
  synced?: number;
}

/* -------------------------------------------------------------------------- */
/*                           Database Initialization                           */
/* -------------------------------------------------------------------------- */

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * getDB()
 * --------
 * Opens or returns an existing SQLite database instance.
 * Ensures foreign key support is enabled.
 */
export const getDB = async () => {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = await SQLite.openDatabase({
      name: 'fridge.db',
      location: 'default',
    });

    // Enforce relational integrity
    try {
      await dbInstance.executeSql('PRAGMA foreign_keys = ON;');
    } catch (pragmaErr) {
      console.warn('Failed to set PRAGMA foreign_keys:', pragmaErr);
    }

    return dbInstance;
  } catch (err) {
    console.error('Failed to open DB:', err);
    throw err;
  }
};

/**
 * executeSql()
 * -------------
 * A safe wrapper around `db.executeSql()` with error handling.
 *
 * @param sql - SQL statement
 * @param params - optional parameters for the query
 * @returns first SQL result set
 */
export const executeSql = async (sql: string, params: any[] = []): Promise<any> => {
  const db = await getDB();
  try {
    const result = await db.executeSql(sql, params);
    return Array.isArray(result) ? result[0] : result;
  } catch (err) {
    console.error('SQL error:', sql, params, err);
    throw err;
  }
};

/* -------------------------------------------------------------------------- */
/*                                 Table Setup                                */
/* -------------------------------------------------------------------------- */

/**
 * createTables()
 * ---------------
 * Creates all required tables and triggers if they do not already exist.
 *
 * Tables:
 *  - fridges
 *  - sensor_readings
 *  - inventory
 *  - inventory_log
 *
 * Triggers:
 *  - update_inventory_after_log
 *  - update_battery_level_after_reading
 */
export const createTables = async () => {
  // Stores basic fridge metadata
  await executeSql(`
    CREATE TABLE IF NOT EXISTS fridges (
      fridge_id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      status TEXT,
      last_sync TEXT,
      battery_level INTEGER
    );
  `);

  // Stores sensor readings per fridge
  await executeSql(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      reading_id TEXT PRIMARY KEY NOT NULL,
      fridge_id TEXT,
      temperature REAL,
      timestamp TEXT DEFAULT (datetime('now')),
      synced INTEGER DEFAULT 0,
      battery_level INTEGER,
      FOREIGN KEY (fridge_id) REFERENCES fridges(fridge_id)
    );
  `);

  // Tracks current inventory count per fridge
  await executeSql(`
    CREATE TABLE IF NOT EXISTS inventory (
      fridge_id TEXT PRIMARY KEY NOT NULL,
      current_count INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (fridge_id) REFERENCES fridges(fridge_id)
    );
  `);

  // Logs inventory changes with timestamps
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

  // Automatically updates inventory after a log entry
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

  // Keeps fridge battery level in sync with latest reading
  await executeSql(`
    CREATE TRIGGER IF NOT EXISTS update_battery_level_after_reading
    AFTER INSERT ON sensor_readings
    BEGIN
      UPDATE fridges
      SET battery_level = NEW.battery_level
      WHERE fridge_id = NEW.fridge_id;
    END;
  `);
};

/* -------------------------------------------------------------------------- */
/*                               Maintenance Ops                              */
/* -------------------------------------------------------------------------- */

/**
 * resetDatabase()
 * ----------------
 * Drops all tables and clears the database.
 * Useful for development or factory reset operations.
 */
export const resetDatabase = async () => {
  try {
    await executeSql(`DROP TABLE IF EXISTS inventory_log;`);
    await executeSql(`DROP TABLE IF EXISTS inventory;`);
    await executeSql(`DROP TABLE IF EXISTS sensor_readings;`);
    await executeSql(`DROP TABLE IF EXISTS fridges;`);
    console.log('Database reset complete');
  } catch (err) {
    console.error('Failed to reset DB:', err);
    throw err;
  }
};

/* -------------------------------------------------------------------------- */
/*                              Fridge Functions                              */
/* -------------------------------------------------------------------------- */

/**
 * insertFridge()
 * ---------------
 * Inserts or replaces a fridge record.
 */
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

/**
 * getAllFridges()
 * ----------------
 * Retrieves all fridge records.
 */
export const getAllFridges = async (): Promise<Fridge[]> => {
  try {
    const result = await executeSql(`SELECT * FROM fridges;`);
    return result.rows.raw() as Fridge[];
  } catch (err) {
    console.error('Failed to get fridges:', err);
    return [];
  }
};

/**
 * updateFridgeStatus()
 * ---------------------
 * Updates the operational status of a specific fridge.
 */
export const updateFridgeStatus = async (fridge_id: string, status: string) => {
  try {
    await executeSql(`UPDATE fridges SET status = ? WHERE fridge_id = ?;`, [status, fridge_id]);
  } catch (err) {
    console.error('Failed to update fridge status:', err);
  }
};

/* -------------------------------------------------------------------------- */
/*                            Sensor Reading Logic                            */
/* -------------------------------------------------------------------------- */

/**
 * insertSensorReading()
 * ----------------------
 * Records a new temperature and battery reading for a fridge.
 */
export const insertSensorReading = async (reading: SensorReading) => {
  const { reading_id, fridge_id, temperature, timestamp, synced = 0, battery_level = 0 } = reading;

  try {
    await executeSql(
      `INSERT OR REPLACE INTO sensor_readings
       (reading_id, fridge_id, temperature, timestamp, synced, battery_level)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [reading_id, fridge_id, temperature, timestamp, synced, battery_level]
    );
  } catch (err) {
    console.error('Failed to insert sensor reading:', err);
    throw err;
  }
};

/**
 * getUnsyncedReadings()
 * ----------------------
 * Retrieves sensor readings that have not yet been synced to the server.
 */
export const getUnsyncedReadings = async (): Promise<SensorReading[]> => {
  try {
    const result = await executeSql(`SELECT * FROM sensor_readings WHERE synced = 0;`);
    return result.rows.raw() as SensorReading[];
  } catch (err) {
    console.error('Failed to get unsynced readings:', err);
    return [];
  }
};

/**
 * markReadingsAsSynced()
 * -----------------------
 * Marks multiple sensor readings as successfully synced.
 */
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

/**
 * getLatestSensorReading()
 * -------------------------
 * Retrieves the most recent reading for a given fridge.
 */
export const getLatestSensorReading = async (
  fridge_id: string
): Promise<SensorReading | null> => {
  try {
    const result = await executeSql(
      `SELECT * FROM sensor_readings WHERE fridge_id = ? ORDER BY timestamp DESC LIMIT 1;`,
      [fridge_id]
    );
    return result.rows.length > 0 ? (result.rows.item(0) as SensorReading) : null;
  } catch (err) {
    console.error('Failed to get latest sensor reading:', err);
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/*                            Inventory Management                            */
/* -------------------------------------------------------------------------- */

/**
 * getInventory()
 * ---------------
 * Fetches the current inventory state for all fridges.
 */
export const getInventory = async (): Promise<Inventory[]> => {
  try {
    const result = await executeSql(`SELECT * FROM inventory;`);
    console.log('Fetched inventory successfully');
    return result.rows.raw() as Inventory[];
  } catch (err) {
    console.error('Failed to get inventory:', err);
    return [];
  }
};

/**
 * logInventoryAction()
 * ---------------------
 * Records a stock addition or removal in the log.
 * Automatically triggers inventory count updates.
 */
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
    throw err;
  }
};

/**
 * getInventoryLogs()
 * -------------------
 * Retrieves the full action history for a given fridge.
 */
export const getInventoryLogs = async (fridge_id: string): Promise<InventoryLog[]> => {
  try {
    const result = await executeSql(
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

/* -------------------------------------------------------------------------- */
/*                              Initialization Seed                           */
/* -------------------------------------------------------------------------- */

/**
 * insertInitialFridge()
 * ----------------------
 * Inserts a default fridge and inventory entry if they do not exist.
 * Useful for first-time app initialization.
 */
export const insertInitialFridge = async () => {
  try {
    await executeSql(
      `INSERT OR IGNORE INTO fridges (fridge_id, name, status, last_sync, battery_level)
       VALUES (?, ?, ?, ?, ?);`,
      ['fridge_1', 'Primary Fridge', 'ok', new Date().toISOString(), 100]
    );

    await executeSql(
      `INSERT OR IGNORE INTO inventory (fridge_id, current_count)
       VALUES (?, ?);`,
      ['fridge_1', 0]
    );

    console.log('Inserted initial fridge / inventory');
  } catch (err) {
    console.error('Failed to insert initial fridge:', err);
    throw err;
  }
};
