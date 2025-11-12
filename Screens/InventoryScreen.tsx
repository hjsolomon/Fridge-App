import React, { useState, useEffect, useCallback } from 'react';
import { Box } from '@gluestack-ui/themed';

import { ScreenHeader } from '../components/ScreenHeader';
import InventoryReading from '../components/InventoryReading';
import InventoryGraph from '@/components/InventoryGraph';
import InventoryForm from '@/components/InventoryForm';

import {
  getInventory,
  getInventoryLogs,
  logInventoryAction,
  InventoryLog,
} from '../db/database';

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Alert } from 'react-native';

/**
 * InventoryScreen
 * ----------------
 * Provides full inventory management for the fridge.
 *
 * Features:
 * - Displays current inventory level
 * - Shows a historical inventory graph
 * - Allows adding and removing inventory through a form
 * - Validates operations (no over-removal, no exceeding capacity)
 * - Recomputes inventory history from change logs
 */

const FRIDGE_ID = 'fridge_1';

/* -------------------------------------------------------------------------- */
/*                             Type Definitions                                */
/* -------------------------------------------------------------------------- */

interface InventoryData {
  timestamp: string;
  count: number;
}

/* -------------------------------------------------------------------------- */
/*                                Helper Utils                                 */
/* -------------------------------------------------------------------------- */

/**
 * formatToMonthDay()
 * -------------------
 * Converts an ISO timestamp (e.g., "2025-02-19T13:24:00Z")
 * into compact "MM/DD" label for graph display.
 */
const formatToMonthDay = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

/* -------------------------------------------------------------------------- */
/*                            Component Definition                             */
/* -------------------------------------------------------------------------- */

const InventoryScreen: React.FC = () => {
  // Processed history for the graph (sorted + cumulative count)
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);

  // Latest computed count (reflected in UI and validation logic)
  const [latestInventory, setLatestInventory] = useState<number>(0);

  /* ------------------------------------------------------------------------ */
  /*                       Fetch & Rebuild Inventory State                    */
  /* ------------------------------------------------------------------------ */

  /**
   * fetchInventory()
   * -----------------
   * Recomputes inventory history and current count by:
   *  1. Fetching latest `inventory` table values
   *  2. Fetching all logs for the fridge
   *  3. Sorting logs chronologically
   *  4. Replaying all add/remove events to rebuild historical counts
   *
   * Ensures the graph and summary numbers always stay in sync.
   */
  const fetchInventory = useCallback(async () => {
    try {
      // Fetch base inventory state from table
      const inventory = await getInventory();
      const fridgeInventory = inventory.find(
        inv => inv.fridge_id === FRIDGE_ID,
      );

      // Fetch and sort logs (oldest → newest)
      const logs = await getInventoryLogs(FRIDGE_ID);
      const sortedLogs = logs.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      const history: InventoryData[] = [];
      let runningCount = 0;

      for (const log of sortedLogs) {
        runningCount += log.action === 'add' ? log.count : -log.count;

        history.push({
          timestamp: formatToMonthDay(log.timestamp!),
          count: runningCount,
        });
      }

      setLatestInventory(runningCount);

      // Set the newest inventory count
      setLatestInventory(runningCount);

      // If no logs exist, show a single entry based on current inventory
      setInventoryData(
        history.length > 0
          ? history
          : [
              {
                timestamp: formatToMonthDay(new Date().toISOString()),
                count: fridgeInventory?.current_count ?? 0,
              },
            ],
      );
    } catch (err) {
      console.error('Failed to fetch inventory or logs:', err);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                        Load Inventory on Mount                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  /* ------------------------------------------------------------------------ */
  /*                        Add / Remove Inventory Logic                      */
  /* ------------------------------------------------------------------------ */

  /**
   * handleSubmit()
   * ---------------
   * Handles add/remove form submissions.
   *
   * Validations:
   * - Prevent removing more than available
   * - Prevent exceeding fridge capacity (600 units)
   *
   * When valid:
   * - Creates a new log entry
   * - Writes it to database
   * - Re-fetches full inventory state
   */
  const handleSubmit = async (
    action: 'Add' | 'Remove',
    count: number,
    lotNumber?: string,
  ) => {
    try {
      // Prevent removal beyond available inventory
      if (action === 'Remove' && count > latestInventory) {
        Alert.alert(
          'Invalid Operation',
          'You cannot remove more vials than are currently available.',
        );
        return;
      }

      // Prevent exceeding hard fridge capacity
      if (action === 'Add' && latestInventory + count > 600) {
        Alert.alert(
          'Invalid Operation',
          'The fridge cannot hold more than 600 vials.',
        );
        return;
      }

      const timestampISO = new Date().toISOString();

      // Build a new log entry for the change
      const log: InventoryLog = {
        log_id: uuidv4(),
        fridge_id: FRIDGE_ID,
        action: action.toLowerCase() as 'add' | 'remove',
        count,
        timestamp: timestampISO,
        synced: 0,
      };

      // Save the inventory change
      await logInventoryAction(log);
      console.log('Inventory Logged:', log);

      // Refresh all inventory + graph calculations
      await fetchInventory();
    } catch (err) {
      console.error('Failed to log inventory action:', err);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                UI Rendering                                */
  /* -------------------------------------------------------------------------- */

  return (
    <Box flex={1} p="$4">
      {/* Screen title + info popup */}
      <ScreenHeader
        title="Inventory"
        infoText="The Inventory screen allows you to manage the refrigerator's contents. Here you can view current inventory levels, add or remove items, and track changes over time."
      />

      {/* Display card for current inventory */}
      <InventoryReading inventory={latestInventory} />

      {/* Historical inventory graph */}
      <InventoryGraph inventoryData={inventoryData} />

      {/* Add/remove form */}
      <InventoryForm onSubmit={handleSubmit} />
    </Box>
  );
};

export default InventoryScreen;
