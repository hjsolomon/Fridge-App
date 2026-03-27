import React, { useState, useEffect, useCallback } from 'react';
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
import { Dimensions, Alert } from 'react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import InventoryReading from '../components/inventory/InventoryReading';
import InventoryGraph from '@/components/inventory/InventoryGraph';
import InventoryForm from '@/components/inventory/InventoryForm';

import { InventoryLog } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { useBluetoothContext } from '../components/bluetooth/BluetoothContext';

import {
  getInventoryLogsFirestore,
  logInventoryActionFirestore,
} from '@/db/firestoreInventory';

const FRIDGE_ID = 'fridge_1';

/* -------------------------------------------------------------------------- */
/*                             Type Definitions                                */
/* -------------------------------------------------------------------------- */
interface InventoryData {
  timestamp: string;
  count: number;
}

/* -------------------------------------------------------------------------- */
/*                                Helper Utils                                 */
/* -------------------------------------------------------------------------- */
const formatToMonthDay = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

/* -------------------------------------------------------------------------- */
/*                            Component Definition                             */
/* -------------------------------------------------------------------------- */
const InventoryScreen: React.FC = () => {
  const { connectedDevice } = useBluetoothContext();

  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [latestInventory, setLatestInventory] = useState<number>(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    action: 'Add' | 'Remove';
    count: number;
    lotNumber?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const width = Dimensions.get('window').width;
  const modalWidth = width * 0.8;

  /* ---------------------- Real-time Inventory Listener -------------------- */
  useEffect(() => {
    const unsubscribe = getInventoryLogsFirestore(FRIDGE_ID, (logs: InventoryLog[]) => {
      // Sort logs chronologically
      const sortedLogs = logs.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Rebuild cumulative inventory history
      let runningCount = 0;
      const history: InventoryData[] = [];

      for (const log of sortedLogs) {
        runningCount += log.action === 'add' ? log.count : -log.count;
        history.push({
          timestamp: formatToMonthDay(log.timestamp ?? new Date().toISOString()),
          count: runningCount,
        });
      }

      setInventoryData(
        history.length > 0
          ? history
          : [
              {
                timestamp: formatToMonthDay(new Date().toISOString()),
                count: runningCount,
              },
            ]
      );

      // Update latest inventory count
      setLatestInventory(runningCount);
    });

    return () => unsubscribe();
  }, []);

  /* ------------------------ Add / Remove Inventory ------------------------ */
  const handleSubmit = async (
    action: 'Add' | 'Remove',
    count: number,
    lotNumber?: string
  ) => {
    if (action === 'Remove' && count > latestInventory) {
      Alert.alert(
        'Invalid Operation',
        'You cannot remove more vials than are currently available.'
      );
      return;
    }

    if (action === 'Add' && latestInventory + count > 600) {
      Alert.alert(
        'Invalid Operation',
        'The fridge cannot hold more than 600 vials.'
      );
      return;
    }

    setPendingAction({ action, count, lotNumber });
    setShowConfirm(true);
  };

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
      // No need to manually fetch logs; listener updates UI automatically
    } catch (err) {
      console.error('Failed to submit inventory change:', err);
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
      setPendingAction(null);
    }
  };

  /* ----------------------------- UI Rendering ------------------------------ */
  return (
    <Box flex={1} p="$4">
      <ScreenHeader
        title="Inventory"
        infoText="The Inventory screen allows you to manage the refrigerator's contents. Here you can view current inventory levels, add or remove vaccines, and track inventory changes over time."
      />

      {/* Display current inventory */}
      <InventoryReading inventory={latestInventory} />

      {/* Historical inventory graph */}
      <InventoryGraph inventoryData={inventoryData} />

      {/* Add/remove form */}
      <InventoryForm onSubmit={handleSubmit} isDisabled={!connectedDevice} />

      {/* Confirmation Modal */}
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
            <Text color="white" fontSize="$md">
              Are you sure you want to{' '}
              <Text color="white" fontWeight="$bold" underline>
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