import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import TempGraph from '../components/TempGraph';

import { getLatestSensorReading, getAllReadings } from '../db/database';
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

  const { height } = Dimensions.get('window');
  const base = height;

  // Text sizes
  const metricFontLarge = Math.max(28, Math.round(base * 0.035));
  const metricFontMedium = Math.max(20, Math.round(base * 0.03));

  // Spacing / padding
  const cardPaddingTop = Math.round(base * 0.01);
  const spacingS = Math.round(base * 0.01);
  const spacingM = Math.round(base * 0.02);

  // Screen padding
  const screenPadding = Math.round(base * 0.02);

  /* ------------------------------------------------------------------------ */
  /*                         Fetch Temperature Data                           */
  /* ------------------------------------------------------------------------ */

  const fetchTemperatureData = useCallback(async () => {
    try {
      // Most recent reading
      const latestReading = await getLatestSensorReading(FRIDGE_ID);

      if (latestReading) {
        setLatestTemp(latestReading.temperature);

        const last = new Date(latestReading.timestamp);
        const diffMs = Date.now() - last.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        setTimeSinceUpdate(
          diffHours > 0
            ? `${diffHours}h ${diffMins % 60}m ago`
            : `${diffMins} minutes ago`
        );
      }

      // Historic readings  
      const all = await getAllReadings(FRIDGE_ID);

      const sorted = all.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const history: TempData[] = sorted.map((r) => ({
        timestamp: formatToMonthDay(r.timestamp ?? new Date().toISOString()),
        value: r.temperature,
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
    fetchTemperatureData();
    const interval = setInterval(() => fetchTemperatureData(), 5000);
    return () => clearInterval(interval);
  }, [fetchTemperatureData]);

  /* ------------------------------------------------------------------------ */
  /*                               UI Rendering                               */
  /* ------------------------------------------------------------------------ */

  return (
    <Box flex={1} style={{ padding: screenPadding }}>
      <ScreenHeader
        title="Insights"
        infoText="The Insights screen provides an overview of recent refrigerator performance. Here you can view graphs of temperature trends over time to identify anomalies or trends quickly."
      />

      {/* Graph */}
      <Box style={{ marginBottom: spacingS }}>
        <TempGraph tempData={tempData} />
      </Box>

      {/* TIME SINCE UPDATE */}
      <Box
        alignItems="center"
        justifyContent="center"
        bg="#282828ff"
        rounded="$2xl"
        style={{
          paddingTop: cardPaddingTop,
          marginVertical: spacingS,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 20,
        }}
      >
        <Text
          color="white"
          style={{
            fontSize: metricFontMedium,
            fontWeight: '400',
            paddingBottom: spacingS,
          }}
        >
          Time Since Last Update
        </Text>

        <Text
          color="white"
          style={{
            fontSize: metricFontLarge,
            fontWeight: '700',
            paddingBottom: spacingS,
          }}
        >
          {timeSinceUpdate || 'Waiting...'}
        </Text>
      </Box>

      {/* LATEST TEMPERATURE */}
      <Box
        alignItems="center"
        justifyContent="center"
        bg="#282828ff"
        rounded="$2xl"
        style={{
          paddingTop: cardPaddingTop,
          marginVertical: spacingS,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 20,
        }}
      >
        <Text
          color="white"
          style={{
            fontSize: metricFontMedium,
            fontWeight: '400',
            paddingBottom: spacingS,
          }}
        >
          Current Temperature
        </Text>

        <Text
          color="white"
          style={{
            fontSize: metricFontLarge,
            fontWeight: '700',
            paddingBottom: spacingS,
          }}
        >
          {latestTemp ? `${latestTemp.toFixed(1)}°C` : '—'}
        </Text>
      </Box>


      
    </Box>
  );
};

export default DashboardScreen;
