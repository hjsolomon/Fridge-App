import React, { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { LineChart } from 'react-native-chart-kit';

interface InventoryGraphProps {
  inventoryData: { timestamp: string; count: number }[];
}

const InventoryGraph: React.FC<InventoryGraphProps> = ({ inventoryData }) => {
  const [labels, setLabels] = useState<string[]>([]);
  const [inventory, setInventory] = useState<number[]>([]);

  useEffect(() => {
    if (inventoryData && inventoryData.length > 0) {
      const newLabels = inventoryData.map((item) => item.timestamp);
      const newInventory = inventoryData.map((item) => item.count);
      setLabels(newLabels);
      setInventory(newInventory);
    }
  }, [inventoryData]);

  return (
    <Box
      alignItems="center"
      justifyContent="center"
      bg="#282828ff"
      pt="$3"
      rounded="$2xl"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 20,
      }}
    >
      <Text color="white" fontSize="$2xl" fontWeight="$normal" pb="$2">
        Inventory Over Time
      </Text>

      {labels.length > 0 ? (
        <LineChart
          data={{
            labels: labels.slice(-4),
            datasets: [{ data: inventory.slice(-20) }],
          }}
          width={Dimensions.get('window').width - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#282828ff',
            backgroundGradientFrom: '#282828ff',
            backgroundGradientTo: '#282828ff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '6', strokeWidth: '2', stroke: '#282828ff' },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      ) : (
        <Text style={{ color: 'white' }}>No inventory data available.</Text>
      )}
    </Box>
  );
};

export default InventoryGraph;
