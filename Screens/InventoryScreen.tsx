/**
 * InventoryScreen.tsx
 * --------------------
 * Screen for viewing and managing vaccine vial inventory.
 *
 * Features:
 * - Displays the current vial count (via InventoryReading).
 * - Shows an inventory trend chart (via InventoryGraph).
 * - Provides an add/remove form (via InventoryForm), disabled when no BLE device is connected.
 * - Validates actions (cannot remove more than available; cannot exceed 600 vial capacity).
 * - Shows a confirmation modal before committing any inventory change.
 *
 * Data source: Two concurrent Firestore real-time listeners —
 * `getCurrentInventoryFirestore` for the live count and
 * `getInventoryLogsFirestore` for historical chart data. Both are cleaned up on unmount.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  ModalFooter,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';

import { ScreenHeader } from '../components/ScreenHeader';
import InventoryReading from '../components/inventory/InventoryReading';
import InventoryGraph from '@/components/inventory/InventoryGraph';
import InventoryForm from '@/components/inventory/InventoryForm';

import { Dimensions, Alert } from 'react-native';

import {
  getInventoryLogsFirestore,
  logInventoryActionFirestore,
  getCurrentInventoryFirestore,
} from '@/db/firestoreInventory';

import { InventoryLog } from '../db/database';

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { useBluetoothContext } from '../components/bluetooth/BluetoothContext';

const FRIDGE_ID = 'fridge_1';

/**
 * InventoryData
 * --------------
 * Processed data point used to build the inventory trend chart.
 *
 * @prop timestamp - Formatted date label (e.g. `"6/1"`).
 * @prop count     - Running vial count at this point in time.
 */
interface InventoryData {
  timestamp: string;
  count: number;
}

/**
 * formatToMonthDay
 * -----------------
 * Converts an ISO 8601 timestamp to a short `M/D` label for chart x-axis ticks.
 *
 * @param isoString - ISO 8601 date string.
 * @returns A formatted string like `"6/1"`.
 */
const formatToMonthDay = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

/**
 * InventoryScreen
 * ----------------
 * Main inventory management screen. Subscribes to Firestore on mount for
 * real-time data, derives a running-count history for the chart, and exposes
 * add/remove actions gated behind a confirmation modal.
 */
const InventoryScreen: React.FC = () => {
  const { connectedDevice } = useBluetoothContext();

  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [latestInventory, setLatestInventory] = useState(0);

  const [showConfirm, setShowConfirm] = useState(false);

  const [pendingAction, setPendingAction] = useState<{
    action: 'Add' | 'Remove';
    count: number;
    lotNumber?: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const width = Dimensions.get('window').width;
  const modalWidth = width * 0.8;

  /* ---------------------------------------------------------------- */
  /* REALTIME INVENTORY LISTENER (same architecture as HomeScreen)   */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const unsubscribeLogs = getInventoryLogsFirestore(
      FRIDGE_ID,
      (logs: any[]) => {
        const sortedLogs = [...logs].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        let runningCount = 0;

        const history: InventoryData[] = [];

        sortedLogs.forEach(log => {
          if (log.action === 'set') {
            runningCount = log.count;
          } else {
            runningCount += log.action === 'add' ? log.count : -log.count;
          }
          history.push({
            timestamp: formatToMonthDay(
              log.timestamp ?? new Date().toISOString(),
            ),

            count: runningCount,
          });
        });

        setInventoryData(
          history.length > 0
            ? history
            : [
                {
                  timestamp: formatToMonthDay(new Date().toISOString()),
                  count: runningCount,
                },
              ],
        );
      },
    );

    const unsubscribeInventory = getCurrentInventoryFirestore(
      FRIDGE_ID,

      (count: number) => {
        setLatestInventory(count);
      },
    );

    return () => {
      unsubscribeLogs();
      unsubscribeInventory();
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* SUBMIT ACTION                                                    */
  /* ---------------------------------------------------------------- */

  /**
   * handleSubmit
   * -------------
   * Validates an inventory action submitted from InventoryForm and, if valid,
   * stages it as a `pendingAction` and opens the confirmation modal.
   *
   * @param action    - `'Add'` or `'Remove'`.
   * @param count     - Number of vials to add or remove.
   * @param lotNumber - Optional lot number associated with the action.
   */
  const handleSubmit = (
    action: 'Add' | 'Remove',
    count: number,
    lotNumber?: string,
  ) => {
    if (action === 'Remove' && count > latestInventory) {
      Alert.alert(
        'Invalid Operation',
        'You cannot remove more vials than available.',
      );

      return;
    }

    if (action === 'Add' && latestInventory + count > 600) {
      Alert.alert('Invalid Operation', 'Fridge capacity is 600.');

      return;
    }

    setPendingAction({
      action,
      count,
      lotNumber,
    });

    setShowConfirm(true);
  };

  /* ---------------------------------------------------------------- */
  /* CONFIRM SUBMISSION                                               */
  /* ---------------------------------------------------------------- */

  /**
   * confirmSubmission
   * ------------------
   * Commits the staged `pendingAction` to Firestore. Guards against double-submission
   * via `isSubmitting`. Always resets modal and pending state in the `finally` block.
   */
  const confirmSubmission = async () => {
    if (!pendingAction || isSubmitting) return;

    setIsSubmitting(true);

    const { action, count } = pendingAction;

    const log: InventoryLog = {
      log_id: uuidv4(),

      fridge_id: FRIDGE_ID,

      action: action.toLowerCase() as 'add' | 'remove',

      count,

      timestamp: new Date().toISOString(),

      synced: 0,
    };

    try {
      await logInventoryActionFirestore(log);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);

      setShowConfirm(false);

      setPendingAction(null);
    }
  };

  /* ---------------------------------------------------------------- */
  /* UI                                                               */
  /* ---------------------------------------------------------------- */

  return (
    <Box flex={1} p="$4">
      <ScreenHeader
        title="Inventory"
        infoText="Manage refrigerator inventory."
      />

      <InventoryReading inventory={latestInventory} />

      <InventoryGraph inventoryData={inventoryData} />

      <InventoryForm
        onSubmit={handleSubmit}
        isDisabled={!connectedDevice}
      />

      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
        <ModalBackdrop />

        <ModalContent bg="#282828" width={modalWidth}>
          <ModalHeader>
            <Text color="white" fontSize="$xl" fontWeight="$bold">
              Confirm {pendingAction?.action}
            </Text>

            <ModalCloseButton />
          </ModalHeader>

          <ModalBody>
            <Text color="white">
              Are you sure you want to
              <Text fontWeight="$bold" underline color="#ffffff">
                {' '}
                {pendingAction?.action.toLowerCase()} {pendingAction?.count}
              </Text>{' '}
              vials?
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button bg="#3a783e" mr="$2" onPress={confirmSubmission}>
              <ButtonText color="white">Confirm</ButtonText>
            </Button>

            <Button
              variant="outline"
              borderColor="#3a783e"
              onPress={() => setShowConfirm(false)}
            >
              <ButtonText color="#b5b5b5ff">Cancel</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InventoryScreen;
