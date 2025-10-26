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
import { Alert } from 'react-native';


interface InventoryFormProps {
  onSubmit: (
    action: 'Add' | 'Remove',
    count: number,
    lotNumber: string,
  ) => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ onSubmit }) => {
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'Add' | 'Remove' | null>(null);
  const [count, setCount] = useState('');
  const [lotNumber, setLotNumber] = useState('');

  const handleSubmit = () => {
    if (!action) {
      Alert.alert('Validation Error', 'Please select Add or Remove.');
      return;
    }
    if (!count || isNaN(Number(count)) || Number(count) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid number.');
      return;
    }

    onSubmit(action, parseInt(count, 10), lotNumber);
    setShowModal(false);
    setCount('');
    setLotNumber('');
    setAction(null);
  };

  return (
    <>
      <Button
        bg="#3a783e"
        rounded="$3xl"
        alignSelf="center"
        justifyContent="center"
        alignItems="center"
        mt="$4"
        style={{
          paddingVertical: 16,
          paddingHorizontal: 36,
          height: '7%',
          width: '100%',
        }}
        onPress={() => setShowModal(true)}
      >
        <ButtonText size="2xl" fontWeight="$normal" color="white">
          Add / Remove Vials
        </ButtonText>
      </Button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalBackdrop />
        <ModalContent bg="#282828" width="80%">
          <ModalHeader>
            <Text color="white" fontSize="$xl" fontWeight="$bold">
              Update Inventory
            </Text>
            <ModalCloseButton />
          </ModalHeader>

          <ModalBody>
            <VStack space="lg" mt="$2">
              <Select onValueChange={val => setAction(val as 'Add' | 'Remove')}>
                <SelectTrigger pr="$3">
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

              <Input>
                <InputField
                  placeholder="Number of Vials"
                  keyboardType="numeric"
                  value={count}
                  onChangeText={setCount}
                  color="white"
                />
              </Input>

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

          <ModalFooter>
            <Button bg={'#3a783e'} onPress={handleSubmit} mr="$2">
              <ButtonText color="white">Submit</ButtonText>
            </Button>
            <Button
              variant="outline"
              borderColor={'#3a783e'}
              onPress={() => setShowModal(false)}
            >
              <ButtonText color="#FFFFFF">Cancel</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default InventoryForm;
