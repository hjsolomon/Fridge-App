import React, { useState, useEffect } from 'react';
import { Box } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';
import InventoryReading from '../components/InventoryReading';
import InventoryGraph from '@/components/InventoryGraph';
import InventoryForm from '@/components/InventoryForm';

const InventoryScreen: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<
    { timestamp: string; count: number }[]
  >([
    { timestamp: '08:00', count: 30 },
    { timestamp: '09:00', count: 32 },
    { timestamp: '10:00', count: 29 },
  ]);
  const latestInventory =
    inventoryData.length > 0
      ? inventoryData[inventoryData.length - 1].count
      : 0;

  return (
    <Box flex={1} bg="#1C1C1C" p="$4">
      <ScreenHeader title="Inventory" />

      <InventoryReading inventory={latestInventory} />
      <InventoryGraph inventoryData={inventoryData} />
      <InventoryForm
        onSubmit={(action, count, lotNumber) => {
          const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
          });
          const signedCount = action === 'Remove' ? -count : count;

          setInventoryData(prev => [
            ...prev,
            {
              timestamp,
              count: (prev[prev.length - 1]?.count ?? 0) + signedCount,
            },
          ]);
        }}
      />
    </Box>
  );
};

export default InventoryScreen;
