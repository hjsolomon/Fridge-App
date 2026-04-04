import React, { useState, useEffect } from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';
import { Clock, Thermometer } from 'lucide-react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import TempGraph from '../components/insights/TempGraph';

import {
  getCurrentReadingFirestore,
  getSensorLogsFirestore,
} from '@/db/firestoreSensorReading';

const FRIDGE_ID = 'fridge_1';

/* -------------------------------------------------------------------------- */
/*                             Type Definitions                               */
/* -------------------------------------------------------------------------- */

interface TempData {
  timestamp: string; // Formatted MM/DD HH:MM
  value: number; // Temperature in Celsius
}

/* -------------------------------------------------------------------------- */
/*                              Helper Functions                              */
/* -------------------------------------------------------------------------- */

const formatToMonthDay = (isoString: string) => {
  const date = new Date(isoString);

  const month = date.getMonth() + 1;
  const day = date.getDate();

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${month}/${day} ${hours}:${minutes}`;
};

/* -------------------------------------------------------------------------- */
/*                         Component Definition                                */
/* -------------------------------------------------------------------------- */

const DashboardScreen: React.FC = () => {
  /* -------------------------- State Management ---------------------------- */
  const [tempData, setTempData] = useState<TempData[]>([]);
  const [latestTemp, setLatestTemp] = useState<number | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] =
    useState<string>('Calculating...');

  /* --------------------------- Responsive Sizing --------------------------- */
  const { height } = Dimensions.get('window');
  const base = height;

  const metricFontLarge = Math.max(20, Math.round(base * 0.038));
  const metricFontMedium = Math.max(10, Math.round(base * 0.02));
  const spacingXS = Math.round(base * 0.005);

  /* ---------------------- Firestore Real-time Listeners -------------------- */
  useEffect(() => {
    // Listen to the latest temperature reading
    const unsubscribeLatest = getCurrentReadingFirestore(FRIDGE_ID, reading => {
      if (reading) {
        setLatestTemp(reading.temperature);

        // Calculate time elapsed
        const last = new Date(reading.timestamp);
        const diffMs = Date.now() - last.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        setTimeSinceUpdate(
          diffHours > 0
            ? `${diffHours}h ${diffMins % 60}m ago`
            : `${diffMins} minutes ago`,
        );
      }
    });

    // Listen to historical sensor logs
    const unsubscribeLogs = getSensorLogsFirestore(FRIDGE_ID, logs => {
      const sorted = logs.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      const history: TempData[] = sorted.map(r => ({
        timestamp: formatToMonthDay(r.timestamp ?? new Date().toISOString()),
        value: r.temperature,
      }));

      setTempData(
        history.length > 0
          ? history
          : [
              {
                timestamp: formatToMonthDay(new Date().toISOString()),
                value: logs[0]?.temperature ?? 0,
              },
            ],
      );
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeLatest();
      unsubscribeLogs();
    };
  }, []);

  /* ----------------------------- UI Rendering ------------------------------ */
  return (
    <Box flex={1} p="$4">
      <ScreenHeader
        title="Insights"
        infoText="The Insights screen provides an overview of recent refrigerator performance. Here you can view graphs of temperature trends over time and track the time since the last update."
      />

      {/* Graph */}
      <Box mb="$4">
        <TempGraph tempData={tempData} />
      </Box>

      {/* TIME SINCE UPDATE */}
      <Box
        bg="#282828ff"
        rounded="$2xl"
        mb="$4"
        borderWidth={1}
        borderColor="rgba(255,255,255,0.07)"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 20,
        }}
      >
        <Box flexDirection="row" alignItems="center" px="$5" py="$4">
          <Box p="$3" bg="rgba(93,181,101,0.15)" rounded="$xl" mr="$4">
            <Clock size={22} color="#5DB565" />
          </Box>
          <Box>
            <Text color="white" style={{ fontSize: metricFontMedium, fontWeight: '600', marginBottom: spacingXS }}>
              Time Since Last Update
            </Text>
            <Text color="white" style={{ fontSize: metricFontLarge, fontWeight: '700' }}>
              {timeSinceUpdate || 'Waiting...'}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* LATEST TEMPERATURE */}
      <Box
        bg="#282828ff"
        rounded="$2xl"
        mb="$4"
        borderWidth={1}
        borderColor="rgba(255,255,255,0.07)"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 20,
        }}
      >
        <Box flexDirection="row" alignItems="center" px="$5" py="$4">
          <Box p="$3" bg="rgba(93,181,101,0.15)" rounded="$xl" mr="$4">
            <Thermometer size={22} color="#5DB565" />
          </Box>
          <Box>
            <Text color="white" style={{ fontSize: metricFontMedium, fontWeight: '500', marginBottom: spacingXS }}>
              Current Temperature
            </Text>
            <Text color="white" style={{ fontSize: metricFontLarge, fontWeight: '700' }}>
              {latestTemp !== null ? `${latestTemp.toFixed(1)}°C` : '—'}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardScreen;
