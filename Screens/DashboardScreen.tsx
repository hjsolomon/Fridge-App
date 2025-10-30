import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';
import TempGraph from '../components/TempGraph';
import { getLatestSensorReading, getAllReadings, SensorReading } from '../db/database';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const FRIDGE_ID = 'fridge_1';

interface TempData {
  timestamp: string;
  value: number;
}

const formatToMonthDay = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const DashboardScreen: React.FC = () => {
  const [tempData, setTempData] = useState<TempData[]>([]);
  const [latestTemp, setLatestTemp] = useState<number>(0);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('Calculating...');

  const fetchTemperatureData = useCallback(async () => {
    try {
      // Fetch latest temperature
      const latestReading = await getLatestSensorReading(FRIDGE_ID);
      if (latestReading) {
        setLatestTemp(latestReading.temperature);

        // Compute time since last update
        const lastTimestamp = new Date(latestReading.timestamp);
        const diffMs = Date.now() - lastTimestamp.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffText =
          diffHours > 0
            ? `${diffHours}h ${diffMins % 60}m ago`
            : `${diffMins} minutes ago`;
        setTimeSinceUpdate(diffText);
      }

      // Fetch full temperature history
      const allReadings = await getAllReadings(FRIDGE_ID);
      const sortedReadings = allReadings.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const history: TempData[] = sortedReadings.map((reading) => ({
        timestamp: formatToMonthDay(reading.timestamp ?? new Date().toISOString()),
        value: reading.temperature,
      }));

      setTempData(
        history.length > 0
          ? history
          : [
              {
                timestamp: formatToMonthDay(new Date().toISOString()),
                value: latestReading?.temperature ?? 0,
              },
            ]
      );
    } catch (err) {
      console.error('Failed to fetch temperature data:', err);
    }
  }, []);

useEffect(() => {
  fetchTemperatureData(); // run once immediately

  // set up polling every 10 seconds
  const interval = setInterval(() => {
    fetchTemperatureData();
  }, 10000);

  // cleanup interval when leaving the screen
  return () => clearInterval(interval);
}, [fetchTemperatureData]);


  return (
    <Box flex={1} bg="#1C1C1C" p="$4">
      <ScreenHeader
        title="Insights"
        infoText="The Insights screen provides an overview of recent refrigerator performance. Here you can view graphs of temperature trends over time. This screen helps you identify anomalies or system trends quickly."
      />

      {/* Temperature Graph */}
      <TempGraph tempData={tempData} />

      {/* Time Since Last Update */}
      <Box
        alignItems="center"
        justifyContent="center"
        bg="#282828ff"
        pt="$3"
        my="$3"
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
          Time Since Last Update
        </Text>
        <Text color="white" fontSize="$4xl" fontWeight="$bold" pb="$2">
          {timeSinceUpdate || 'Waiting...'}
        </Text>
      </Box>

      {/* Latest Temperature */}
      <Box
        alignItems="center"
        justifyContent="center"
        bg="#282828ff"
        pt="$3"
        my="$3"
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
          Current Temperature
        </Text>
        <Text color="white" fontSize="$4xl" fontWeight="$bold" pb="$2">
          {latestTemp ? `${latestTemp.toFixed(1)}°C` : '—'}
        </Text>
      </Box>

      {/* Alerts Placeholder */}
      <Box
        alignItems="center"
        justifyContent="center"
        bg="#282828ff"
        pt="$3"
        my="$3"
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
          Alerts
        </Text>
        <Text color="white" fontSize="$lg" fontWeight="$normal" pb="$2">
          No alerts at this time.
        </Text>
      </Box>
    </Box>
  );
};

export default DashboardScreen;
