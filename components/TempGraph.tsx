import React, { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { LineChart } from 'react-native-chart-kit';

/* -------------------------------------------------------------------------- */
/*                               Type Definitions                             */
/* -------------------------------------------------------------------------- */

/**
 * TempGraphProps
 * ---------------
 * Props for the TempGraph component.
 * 
 * @prop tempData - Array of temperature readings, each with:
 *  - `timestamp`: string — The time the reading was taken.
 *  - `value`: number — The temperature value in °C.
 */
interface TempGraphProps {
  tempData: { timestamp: string; value: number }[];
}

/* -------------------------------------------------------------------------- */
/*                             Component Definition                           */
/* -------------------------------------------------------------------------- */

/**
 * TempGraph
 * ----------
 * Displays a line chart showing temperature trends over time.
 *
 * - Accepts temperature readings as props.
 * - Dynamically updates when new data arrives.
 * - Uses react-native-chart-kit for smooth and styled chart rendering.
 */
const TempGraph: React.FC<TempGraphProps> = ({ tempData }) => {
  /* ----------------------------- State Management ---------------------------- */
  const [labels, setLabels] = useState<string[]>([]);
  const [temps, setTemps] = useState<number[]>([]);

  /* -------------------------------------------------------------------------- */
  /*                              Data Processing                               */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (tempData && tempData.length > 0) {
      // Show the last 10 readings for better readability on small screens
      const visibleData = tempData.slice(-10);
      const newLabels = visibleData.map((item) => item.timestamp).slice(-10);
      const newTemps = visibleData.map((item) => item.value);

      setLabels(newLabels);
      setTemps(newTemps);
    } else {
      // Clear chart if no data available
      setLabels([]);
      setTemps([]);
    }
  }, [tempData]);

  /* -------------------------------------------------------------------------- */
  /*                                 UI Rendering                               */
  /* -------------------------------------------------------------------------- */

  return (
    <Box
      alignItems="center"
      justifyContent="center"
      bg="#282828ff"
      pt="$3"
      px="$2"
      rounded="$2xl"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 20,
      }}
    >
      {labels.length > 0 && temps.length > 0 ? (
        <>
          {/* Chart Title */}
          <Text color="white" fontSize="$2xl" fontWeight="$normal" pb="$2">
            Temperature Over Time
          </Text>

          {/* Line Chart Displaying Temperature History */}
          <LineChart
            data={{
              labels,
              datasets: [{ data: temps }],
            }}
            width={Dimensions.get('window').width - 60}
            height={220}
            yAxisSuffix="°C"
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: '#282828ff',
              backgroundGradientFrom: '#282828ff',
              backgroundGradientTo: '#282828ff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: '#ffffff',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </>
      ) : (
        // Placeholder text while temperature data loads
        <Text color="white" fontSize="$md" pb="$3">
          Loading temperature data…
        </Text>
      )}
    </Box>
  );
};

export default TempGraph;
