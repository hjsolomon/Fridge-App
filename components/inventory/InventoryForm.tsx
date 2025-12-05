import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonText,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
  InputField,
  VStack,
  Text,
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectItem,
} from '@gluestack-ui/themed';
import { ChevronDown } from 'lucide-react-native';
import { Dimensions } from 'react-native';

/**
 * InventoryForm
 * --------------
 * This component provides a modal form for adding or removing vials
 * from the inventory.
 *
 * Features:
 * - Responsive layout that scales with screen width
 * - Modal popup for user-friendly data entry
 * - Validation for required fields and numeric input
 * - Color-coded validation errors (red for invalid entries)
 * - Clean dark-themed styling to match the app aesthetic
 */

interface InventoryFormProps {
  onSubmit: (
    action: 'Add' | 'Remove',
    count: number,
    lotNumber: string,
  ) => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ onSubmit }) => {
  // Modal visibility control
  const [showModal, setShowModal] = useState(false);

  // Form fields and validation state
  const [action, setAction] = useState<'Add' | 'Remove' | null>(null);
  const [count, setCount] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [actionError, setActionError] = useState(false);
  const [countError, setCountError] = useState(false);

  // Responsive sizing based on screen width
  const { width } = Dimensions.get('window');
  const buttonWidth = width * 0.9; // 90% of screen width
  const modalWidth = width * 0.8; // Modal scales proportionally

  /**
   * Handles form submission with validation.
   * - Ensures an action is selected (Add/Remove)
   * - Ensures count is a positive number
   * - Calls parent onSubmit handler with cleaned data
   */
  const handleSubmit = () => {
    if (!action) {
      setActionError(true);
      return;
    }

    if (!count || isNaN(Number(count)) || Number(count) <= 0) {
      setCountError(true);
      return;
    }

    onSubmit(action, parseInt(count, 10), lotNumber);

    // Reset form after successful submission
    setShowModal(false);
    setCount('');
    setLotNumber('');
    setAction(null);
    setActionError(false);
    setCountError(false);
  };

  return (
    <>
      {/* Primary button that opens the modal */}
      <Button
        bg="#3a783e"
        rounded="$3xl"
        alignSelf="center"
        justifyContent="center"
        alignItems="center"
        mt="$4"
        px="$6" // horizontal padding
        py="$3" // vertical padding
        onPress={() => setShowModal(true)}
        style={{
          width: buttonWidth,
          minHeight: width * .15, // gives more vertical space without clipping text
        }}
      >
        <ButtonText size="2xl" fontWeight="$normal" color="white">
          Add / Remove Vials
        </ButtonText>
      </Button>

      {/* Modal for form input */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalBackdrop />
        <ModalContent bg="#282828" width={modalWidth}>
          {/* Modal Header */}
          <ModalHeader>
            <Text color="white" fontSize="$xl" fontWeight="$bold">
              Update Inventory
            </Text>
            <ModalCloseButton />
          </ModalHeader>

          {/* Modal Body */}
          <ModalBody>
            <VStack space="lg" mt="$2">
              {/* Action Selector (Add or Remove) */}
              <Box>
                <Select
                  onValueChange={val => {
                    setAction(val as 'Add' | 'Remove');
                    setActionError(false);
                  }}
                >
                  <SelectTrigger
                    pr="$3"
                    style={{
                      borderColor: actionError ? '#ff4d4f' : '#b5b5b5ff',
                      borderRadius: 8,
                    }}
                  >
                    <SelectInput
                      placeholder="Select Action"
                      value={action ? action.toUpperCase() : ''}
                      color="white"
                    />
                    <SelectIcon as={ChevronDown} />
                  </SelectTrigger>

                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectItem label="Add Vials" value="Add" />
                      <SelectItem label="Remove Vials" value="Remove" />
                    </SelectContent>
                  </SelectPortal>
                </Select>

                {/* Error message if action not selected */}
                {actionError && (
                  <Text color="#ff4d4f" fontSize="$sm" mt="$1">
                    Please select an action.
                  </Text>
                )}
              </Box>

              {/* Vial Count Input */}
              <Box>
                <Input
                  style={{
                    borderColor: countError ? '#ff4d4f' : '#b5b5b5ff',
                    borderRadius: 8,
                  }}
                >
                  <InputField
                    placeholder="Number of Vials"
                    keyboardType="numeric"
                    value={count}
                    onChangeText={text => {
                      setCount(text);
                      if (countError) setCountError(false);
                    }}
                    color="white"
                  />
                </Input>

                {/* Error message for invalid count */}
                {countError && (
                  <Text color="#ff4d4f" fontSize="$sm" mt="$1">
                    Please enter a valid number of vials.
                  </Text>
                )}
              </Box>

              {/* Lot Number Input (optional) */}
              <Input>
                <InputField
                  placeholder="Lot Number (optional)"
                  value={lotNumber}
                  onChangeText={setLotNumber}
                  color="white"
                />
              </Input>
            </VStack>
          </ModalBody>

          {/* Modal Footer with Submit and Cancel Buttons */}
          <ModalFooter>
            <Button bg="#3a783e" onPress={handleSubmit} mr="$2">
              <ButtonText color="white">Submit</ButtonText>
            </Button>

            <Button
              variant="outline"
              borderColor="#3a783e"
              onPress={() => setShowModal(false)}
            >
              <ButtonText color="#b5b5b5ff">Cancel</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default InventoryForm;
