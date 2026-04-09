/**
 * DashboardScreen.tsx
 * --------------------
 * Insights screen that visualises recent fridge temperature history and shows
 * a summary of the most recent sensor reading.
 *
 * Displays:
 * - Temperature trend line chart (last 10 readings via TempGraph).
 * - Time since the last sensor update.
 * - Current temperature from the latest reading.
 *
 * Data source: Two concurrent Firestore real-time listeners —
 * `getCurrentReadingFirestore` for the latest reading and
 * `getSensorLogsFirestore` for historical data. Both are cleaned up on unmount.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Button,
  ButtonText,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';
import { Clock, Thermometer } from 'lucide-react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import TempGraph from '../components/insights/TempGraph';

import {
  getCurrentReadingFirestore,
  getSensorLogsFirestore,
  getSensorReadingsForExportFirestore,
} from '@/db/firestoreSensorReading';
import RNFS from 'react-native-fs';
import Papa from 'papaparse';

const FRIDGE_ID = 'fridge_1';
const { width } = Dimensions.get('window');
const buttonWidth = width * 0.9; // 90% of screen width

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

/**
 * formatToMonthDay
 * -----------------
 * Converts an ISO 8601 timestamp string into a compact `M/D H:MM` label
 * suitable for chart x-axis ticks.
 *
 * @param isoString - ISO 8601 date string (e.g. `"2024-06-01T14:05:00.000Z"`).
 * @returns A formatted string like `"6/1 14:05"`.
 */
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

/**
 * DashboardScreen
 * ----------------
 * Screen component that subscribes to sensor log history and the latest reading
 * on mount, processes the data into chart-ready format, and renders insights.
 * All Firestore listeners are cleaned up on unmount.
 */
const DashboardScreen: React.FC = () => {
  /* -------------------------- State Management ---------------------------- */
  const [tempData, setTempData] = useState<TempData[]>([]);
  const [latestTemp, setLatestTemp] = useState<number | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] =
    useState<string>('Calculating...');

  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    path?: string;
    error?: string;
  } | null>(null);

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

  /* ----------------------------- CSV Export -------------------------------- */

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);
    try {
      const readings = await getSensorReadingsForExportFirestore(FRIDGE_ID);

      const csv = Papa.unparse(
        readings.map(r => ({
          reading_id: r.reading_id,
          fridge_id: r.fridge_id,
          timestamp: r.timestamp,
          temperature_c: r.temperature,
          battery_level: r.battery_level,
        })),
      );

      const artifactsDir = `${RNFS.DocumentDirectoryPath}/artifacts`;
      const dirExists = await RNFS.exists(artifactsDir);
      if (!dirExists) {
        await RNFS.mkdir(artifactsDir);
      }

      const now = new Date();
      const stamp = now
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);
      const filePath = `${artifactsDir}/sensor_readings_${stamp}.csv`;

      await RNFS.writeFile(filePath, csv, 'utf8');
      setExportResult({ success: true, path: filePath });
    } catch (err: any) {
      setExportResult({ success: false, error: err?.message ?? 'Unknown error' });
    } finally {
      setExporting(false);
    }
  };

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
            <Text
              color="white"
              style={{
                fontSize: metricFontMedium,
                fontWeight: '600',
                marginBottom: spacingXS,
              }}
            >
              Time Since Last Update
            </Text>
            <Text
              color="white"
              style={{ fontSize: metricFontLarge, fontWeight: '700' }}
            >
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
            <Text
              color="white"
              style={{
                fontSize: metricFontMedium,
                fontWeight: '500',
                marginBottom: spacingXS,
              }}
            >
              Current Temperature
            </Text>
            <Text
              color="white"
              style={{ fontSize: metricFontLarge, fontWeight: '700' }}
            >
              {latestTemp !== null ? `${latestTemp.toFixed(1)}°C` : '—'}
            </Text>
          </Box>
        </Box>
      </Box>
      {/* Button to export CSV */}
      <Button
        bg="#3a783e"
        rounded="$3xl"
        alignSelf="center"
        justifyContent="center"
        alignItems="center"
        mt="$1"
        px="$6"
        py="$2"
        onPress={() => setShowModal(true)}
        style={{
          width: buttonWidth,
          minHeight: width * 0.1,
        }}
      >
        <ButtonText size="lg" fontWeight="$normal" color="white">
          Export CSV
        </ButtonText>
      </Button>

      {/* CSV Export Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setExportResult(null); }}>
        <ModalBackdrop />
        <ModalContent bg="#282828ff">
          <ModalHeader>
            <Text color="white" fontWeight="$bold" size="lg">Export Sensor Data</Text>
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody>
            {exportResult === null && !exporting && (
              <Text color="white">Export all sensor readings to a CSV file saved on this device?</Text>
            )}
            {exporting && (
              <Text color="white">Exporting...</Text>
            )}
            {exportResult?.success && (
              <Text color="#5DB565">Saved to:{'\n'}{exportResult.path}</Text>
            )}
            {exportResult?.success === false && (
              <Text color="#e05a5a">Export failed: {exportResult.error}</Text>
            )}
          </ModalBody>
          <ModalFooter>
            {!exportResult && (
              <Button
                bg="#3a783e"
                rounded="$xl"
                onPress={handleExport}
                isDisabled={exporting}
                mr="$3"
              >
                <ButtonText color="white">{exporting ? 'Exporting...' : 'Export'}</ButtonText>
              </Button>
            )}
            <Button
              variant="outline"
              rounded="$xl"
              borderColor="rgba(255,255,255,0.2)"
              onPress={() => { setShowModal(false); setExportResult(null); }}
            >
              <ButtonText color="white">{exportResult?.success ? 'Done' : 'Cancel'}</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DashboardScreen;
