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

interface InventoryData {
  timestamp: string;
  count: number;
}

const formatToMonthDay = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

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
