/**
 * DashboardScreen
 * ================
 * Displays temperature analytics and insights.
 *
 * Features:
 * - Historical temperature graph from database
 * - Current temperature display
 * - Time elapsed since last sensor update
 * - Auto-refresh every 5 seconds
 * - Responsive typography sizing
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import TempGraph from '../components/insights/TempGraph';

import { getLatestSensorReading, getAllReadings } from '../db/database';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const FRIDGE_ID = 'fridge_1';

/* -------------------------------------------------------------------------- */
/*                             Type Definitions                               */
/* -------------------------------------------------------------------------- */

interface TempData {
  timestamp: string;  // Formatted MM/DD HH:MM
  value: number;      // Temperature in Celsius
}

/* -------------------------------------------------------------------------- */
/*                              Helper Functions                              */
/* -------------------------------------------------------------------------- */

/**
 * formatToMonthDay()
 * -------------------
 * Converts ISO timestamp to "MM/DD HH:MM" format.
 * Used for graph labels.
 */
const formatToMonthDay = (isoString: string) => {
  const date = new Date(isoString);

  const month = date.getMonth() + 1;
  const day = date.getDate();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${month}/${day} ${hours}:${minutes}`;
};

/* -------------------------------------------------------------------------- */
/*                         Component Definition                                */
/* -------------------------------------------------------------------------- */

const DashboardScreen: React.FC = () => {
  /* -------------------------------------------------------------------- */
  /*                        State Management                               */
  /* -------------------------------------------------------------------- */

  // Historical temperature data for graph
  const [tempData, setTempData] = useState<TempData[]>([]);

  // Latest temperature reading
  const [latestTemp, setLatestTemp] = useState<number>(0);

  // Human-readable time since last update (e.g., "5 minutes ago")
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('Calculating...');

  /* -------------------------------------------------------------------- */
  /*                        Responsive Sizing                              */
  /* -------------------------------------------------------------------- */

  const { height } = Dimensions.get('window');
  const base = height;

  // Typography sizing
  const metricFontLarge = Math.max(20, Math.round(base * 0.038));
  const metricFontMedium = Math.max(10, Math.round(base * 0.02));

  // Spacing / padding
  const cardPaddingTop = Math.round(base * 0.01);
  const spacingS = Math.round(base * 0.01);
  const spacingXS = Math.round(base * 0.005);

  // Screen padding
  const screenPadding = Math.round(base * 0.02);

  /* -------------------------------------------------------------------- */
  /*                    Fetch & Process Temperature Data                   */
  /* -------------------------------------------------------------------- */

  /**
   * fetchTemperatureData()
   * ----------------------
   * Fetches latest reading and historical data.
   *
   * Steps:
   * 1. Get most recent sensor reading
   * 2. Calculate time elapsed since update
   * 3. Fetch all historical readings
   * 4. Sort chronologically and format for graph
   * 5. Update state
   */
  const fetchTemperatureData = useCallback(async () => {
    try {
      // Most recent reading
      const latestReading = await getLatestSensorReading(FRIDGE_ID);

      if (latestReading) {
        setLatestTemp(latestReading.temperature);

        // Calculate time elapsed
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

  /* -------------------------------------------------------------------- */
  /*                    Auto-fetch on Mount & Interval                     */
  /* -------------------------------------------------------------------- */

  /**
   * Fetch temperature data on mount and set 5-second refresh interval.
   * Cleanup interval on unmount.
   */
  useEffect(() => {
    fetchTemperatureData();
    const interval = setInterval(() => fetchTemperatureData(), 5000);
    return () => clearInterval(interval);
  }, [fetchTemperatureData]);

  /* -------------------------------------------------------------------- */
  /*                              UI Rendering                             */
  /* -------------------------------------------------------------------- */

  return (
    <Box flex={1} style={{ padding: screenPadding }}>
      <ScreenHeader
        title="Insights"
        infoText="The Insights screen provides an overview of recent refrigerator performance. Here you can view graphs of temperature trends over time and track the time since the last update."
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
            fontWeight: '600',
            paddingBottom: spacingXS,
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
            fontWeight: '500',
            paddingBottom: spacingXS,
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
