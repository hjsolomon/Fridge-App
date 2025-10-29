import React, { useState, useEffect, useCallback } from 'react';
import { Box } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';
import InventoryReading from '../components/InventoryReading';
import InventoryGraph from '@/components/InventoryGraph';
import InventoryForm from '@/components/InventoryForm';
import { getInventory, getInventoryLogs, logInventoryAction, InventoryLog } from '../db/database';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Alert } from 'react-native';

const FRIDGE_ID = 'fridge_1';

interface InventoryData {
  timestamp: string;
  count: number;
}

const formatToMonthDay = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const InventoryScreen: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [latestInventory, setLatestInventory] = useState<number>(0);

  const fetchInventory = useCallback(async () => {
  try {
    const inventory = await getInventory();
    const fridgeInventory = inventory.find(inv => inv.fridge_id === FRIDGE_ID);

    const logs = await getInventoryLogs(FRIDGE_ID);
    const sortedLogs = logs.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let runningCount = 0;

    const history: InventoryData[] = [];

    for (const log of sortedLogs) {
      if (log.action === 'add') {
        runningCount += log.count;
      } else if (log.action === 'remove') {
        runningCount -= log.count;
      }

      history.push({
        timestamp: formatToMonthDay(log.timestamp ?? new Date().toISOString()),
        count: runningCount,
      });
    }
    setLatestInventory(runningCount);

    setInventoryData(
      history.length > 0
        ? history
        : [
            {
              timestamp: formatToMonthDay(new Date().toISOString()),
              count: fridgeInventory?.current_count ?? 0,
            },
          ]
    );

  } catch (err) {
    console.error('Failed to fetch inventory or logs:', err);
  }
}, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSubmit = async (
    action: 'Add' | 'Remove',
    count: number,
    lotNumber?: string,
  ) => {
    try {
      if (action === 'Remove' && count > latestInventory) {
        Alert.alert(
          'Invalid Operation',
          'You cannot remove more vials than are currently available.',
        );
        return;
      }

      const signedCount = action === 'Remove' ? -count : count;
      const timestampISO = new Date().toISOString();

      const log: InventoryLog = {
        log_id: uuidv4(),
        fridge_id: FRIDGE_ID,
        action: action.toLowerCase() as 'add' | 'remove',
        count,
        timestamp: timestampISO,
        synced: 0,
      };

      await logInventoryAction(log);
      console.log('Inventory Logged:', log)

      await fetchInventory();

    } catch (err) {
      console.error('Failed to log inventory action:', err);
    }
  };

  return (
    <Box flex={1} bg="#1C1C1C" p="$4">
      <ScreenHeader
        title="Inventory"
        infoText="The Inventory screen allows you to manage the refrigerator's contents. Here you can view current inventory levels, add or remove items, and track changes over time."
      />

      <InventoryReading inventory={latestInventory} />
      <InventoryGraph inventoryData={inventoryData} />
      <InventoryForm onSubmit={handleSubmit} />
    </Box>
  );
};

export default InventoryScreen;
