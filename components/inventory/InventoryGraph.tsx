import React, { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { LineChart } from 'react-native-chart-kit';

/**
 * InventoryGraph
 * ---------------
 * Displays a line chart showing inventory count over time.
 *
 * - Pulls timestamped inventory data from props
 * - Dynamically updates labels and values when data changes
 * - Shows a message if no data is available
 */

interface InventoryGraphProps {
  inventoryData: { timestamp: string; count: number }[];
}

const InventoryGraph: React.FC<InventoryGraphProps> = ({ inventoryData }) => {
  // Local state for chart labels (timestamps) and data values (counts)
  const [labels, setLabels] = useState<string[]>([]);
  const [inventory, setInventory] = useState<number[]>([]);
  const height = Dimensions.get('window').height;
    const metricFontMedium = Math.max(10, Math.round(height * 0.02));

  // Extract timestamps and counts from incoming data
  useEffect(() => {
    if (inventoryData && inventoryData.length > 0) {
      const newLabels = inventoryData.map(item => item.timestamp);
      const newInventory = inventoryData.map(item => item.count);
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
      {/* Section title */}
      <Text color="white" fontSize="$xl" fontWeight="$normal" mb="$1">
        Inventory Over Time
      </Text>

      <Text
        color= "rgba(255, 255, 255, 0.63)"
        fontSize="$sm"
        fontWeight="$normal"
        alignSelf="flex-start"
        pl="$4"
      >
        Vials
      </Text>

      {/* Render chart if data is available */}
      {labels.length > 0 ? (
        <LineChart
          data={{
            labels: labels.slice(-4), // Display most recent 4 timestamps
            datasets: [
              {
                data: inventory.slice(-20), // Show last 20 data points
                color: () => `rgba(255, 255, 255, 0.63)`, // <-- ONLY affects stroke
              },
              // Invisible dummy dataset to force y-axis max of 600
              {
                data: [600],
                color: () => `rgba(0, 0, 0, 0)`, // Fully transparent (invisible)
                strokeWidth: 0, // Ensure no stroke
              },
            ], 
          }}
          width={Dimensions.get('window').width - 40} // Responsive width
          height={Dimensions.get('window').height * 0.28}
          yAxisLabel=""
          yAxisSuffix=""
          fromZero={true}
          segments={6} // Divide y-axis into 6 segments (0-100, 100-200, etc., up to 600)
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#282828ff',
            backgroundGradientFrom: '#282828ff',
            backgroundGradientTo: '#282828ff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '0',
              strokeWidth: '2',
              stroke: '#282828ff',
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            marginRight: 20,
            marginLeft: -10,
            borderRadius: 16,
          }}
        />
      ) : (
        // Fallback message if no data exists
        <Text style={{ color: 'white' }}>No inventory data available.</Text>
      )}
    </Box>
  );
};

export default InventoryGraph;
