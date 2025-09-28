import React, { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { LineChart } from 'react-native-chart-kit';

interface TempGraphProps {
  onUpdateTime?: (time: string) => void;
}

const TempGraph: React.FC<TempGraphProps> = ({ onUpdateTime }) => {
  const [labels, setLabels] = useState<string[]>([]);
  const [temps, setTemps] = useState<number[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const delay = Math.floor(Math.random() * 10) + 1;
    const interval = setInterval(() => {
      const newTemps: number[] = [];
      const newLabels: string[] = [];

      for (let i = 0; i < delay; i++) {
        const lastTemp = temps.length > 0 ? temps[temps.length - 1] : 4;
        const nextTemp = lastTemp + (Math.random() - 0.5) * 2;
        const now = new Date();
        const timestamp = now.toLocaleTimeString('en-US', { hour12: false });

        newTemps.push(nextTemp);
        newLabels.push(timestamp);
      }

      setLabels(prev => [...prev, ...newLabels]);
      setTemps(prev => [...prev, ...newTemps]);
      setLastUpdate(new Date());
    }, delay * 1000);

    return () => clearInterval(interval);
  }, [temps]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdate) {
        const diffMs = Date.now() - lastUpdate.getTime();
        const seconds = Math.floor(diffMs / 1000);
        const formatted = `${seconds}s `;

        if (onUpdateTime) {
          onUpdateTime(formatted);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [lastUpdate, onUpdateTime]);

  return (
    <Box
      alignItems="center"
      justifyContent="center"
      bg="#282828ff"
      pt="$3"
      rounded="$2xl"
    >
      {labels.length > 0 && temps.length > 0 ? (
        <>
          <Text color="white" fontSize="$2xl" fontWeight="$normal" pb="$2">
            Temperature Over Time
          </Text>
        </>
      ) : null}

      {labels.length > 0 && temps.length > 0 ? (
        <LineChart
          data={{
            labels: labels.slice(-4),
            datasets: [{ data: temps.slice(-20) }],
          }}
          width={Dimensions.get('window').width - 40}
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
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#282828ff',
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      ) : (
        <Box>
          <Text style={{ color: 'white' }}>Loading data…</Text>
        </Box>
      )}
    </Box>
  );
};

export default TempGraph;
