import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text } from '@gluestack-ui/themed';

import { ScreenHeader } from '../components/ScreenHeader';
import TempGraph from '../components/TempGraph';

import { getLatestSensorReading, getAllReadings } from '../db/database';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

/**
 * DashboardScreen
 * ----------------
 * Displays high-level insights from the fridge data:
 *
 * - A temperature graph of historical readings
 * - Time since the most recent update
 * - The latest temperature value
 * - Placeholder area for alerts
 *
 * This screen is refreshed every 10 seconds to ensure readings stay current.
 */

const FRIDGE_ID = 'fridge_1';

/* -------------------------------------------------------------------------- */
/*                             Type Definitions                                */
/* -------------------------------------------------------------------------- */

interface TempData {
  timestamp: string;
  value: number;
}

/* -------------------------------------------------------------------------- */
/*                                Helper Utils                                 */
/* -------------------------------------------------------------------------- */

/**
 * formatToMonthDay()
 * -------------------
 * Converts an ISO timestamp (2025-02-19T12:00:00Z)
 * into a short format "MM/DD".
 */
const formatToMonthDay = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

/* -------------------------------------------------------------------------- */
/*                            Component Definition                             */
/* -------------------------------------------------------------------------- */

const DashboardScreen: React.FC = () => {
  // Holds simplified temperature points used in the TempGraph component
  const [tempData, setTempData] = useState<TempData[]>([]);

  // Stores the most recent temperature value
  const [latestTemp, setLatestTemp] = useState<number>(0);

  // Human-readable text that explains how long ago the sensor last updated
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('Calculating...');

  /* ------------------------------------------------------------------------ */
  /*                     Main Data Fetching & Processing                      */
  /* ------------------------------------------------------------------------ */

  /**
   * fetchTemperatureData()
   * -----------------------
   * Fetches:
   * 1. The most recent sensor reading (for latestTemp + timeSinceUpdate)
   * 2. The full history of readings (for graph display)
   *
   * Runs immediately on mount and again every 10 seconds.
   */
  const fetchTemperatureData = useCallback(async () => {
    try {
      /* ---------------------- Fetch latest temperature ---------------------- */
      const latestReading = await getLatestSensorReading(FRIDGE_ID);

      if (latestReading) {
        setLatestTemp(latestReading.temperature);

        // Compute "time since last reading"
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

      /* ---------------------- Fetch historical readings --------------------- */
      const allReadings = await getAllReadings(FRIDGE_ID);

      // Sort oldest → newest
      const sortedReadings = allReadings.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Convert raw DB entries into format required by TempGraph
      const history: TempData[] = sortedReadings.map((reading) => ({
        timestamp: formatToMonthDay(reading.timestamp ?? new Date().toISOString()),
        value: reading.temperature,
      }));

      // If no historic data, fall back to the latest reading
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

  /* ------------------------------------------------------------------------ */
  /*                                Polling Loop                              */
  /* ------------------------------------------------------------------------ */

  /**
   * On mount:
   * - Fetch immediately
   * - Start a 5-second polling interval
   *
   * Cleans up automatically when leaving the screen.
   */
  useEffect(() => {
    fetchTemperatureData(); // Initial load

    const interval = setInterval(() => {
      fetchTemperatureData(); // Poll every 5 seconds
    }, 5000);

    return () => clearInterval(interval); // Cleanup
  }, [fetchTemperatureData]);

  /* -------------------------------------------------------------------------- */
  /*                                UI Rendering                                */
  /* -------------------------------------------------------------------------- */

  return (
    <Box flex={1} bg="#1C1C1C" p="$4">
      {/* Screen Title + Info Button */}
      <ScreenHeader
        title="Insights"
        infoText="The Insights screen provides an overview of recent refrigerator performance. Here you can view graphs of temperature trends over time. This screen helps you identify anomalies or system trends quickly."
      />

      {/* Temperature Graph Section */}
      <TempGraph tempData={tempData} />

      {/* Time Since Last Update Card */}
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

      {/* Latest Temperature Card */}
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

      {/* Alerts Placeholder Card */}
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
