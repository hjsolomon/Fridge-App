import React, { useState, useEffect } from 'react';
import { Box } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';
import InventoryReading from '../components/InventoryReading';
import InventoryGraph from '@/components/InventoryGraph';
import InventoryForm from '@/components/InventoryForm';
import { getInventory, logInventoryAction, InventoryLog } from '../db/database';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
const FRIDGE_ID = 'fridge_1';
import { Alert } from 'react-native';

interface InventoryData {
  timestamp: string;
  count: number;
}

const InventoryScreen: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [latestInventory, setLatestInventory] = useState<number>(0);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const inventory = await getInventory();
        const fridgeInventory = inventory.find(
          inv => inv.fridge_id === FRIDGE_ID,
        );
        if (fridgeInventory) {
          setLatestInventory(fridgeInventory.current_count);
          setInventoryData([
            {
              timestamp:
                fridgeInventory.last_updated ||
                new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
              count: fridgeInventory.current_count,
            },
          ]);
        } else {
          setLatestInventory(0);
          setInventoryData([
            {
              timestamp: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
              count: 0,
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
      }
    };

    fetchInventory();
  }, []);

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
      const timestamp = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

      setInventoryData(prev => {
        const newCount = (prev[prev.length - 1]?.count ?? 0) + signedCount;
        setLatestInventory(newCount);
        return [...prev, { timestamp, count: newCount }];
      });

      const log: InventoryLog = {
        log_id: uuidv4(),
        fridge_id: FRIDGE_ID,
        action: action.toLowerCase() as 'add' | 'remove',
        count,
        timestamp,
        synced: 0,
      };
      await logInventoryAction(log);
    } catch (err) {
      console.error('Failed to log inventory action:', err);
    }
  };

  return (
    <Box flex={1} bg="#1C1C1C" p="$4">
      <ScreenHeader title="Inventory" 
      infoText="The Inventory screen allows you to manage the refrigerator's contents. Here you can view current inventory levels, add or remove items, and track changes over time."
      />

      <InventoryReading inventory={latestInventory} />
      <InventoryGraph inventoryData={inventoryData} />
      <InventoryForm onSubmit={handleSubmit} />
    </Box>
  );
};

export default InventoryScreen;
