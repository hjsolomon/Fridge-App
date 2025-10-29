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
  const [actionError, setActionError] = useState(false);
  const [countError, setCountError] = useState(false);

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
    setShowModal(false);
    setCount('');
    setLotNumber('');
    setAction(null);
    setActionError(false);
    setCountError(false);
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
              <Box>
              <Select onValueChange={val => { setAction(val as 'Add' | 'Remove'); setActionError(false); }}>
                <SelectTrigger pr="$3" style={{
                  borderColor: actionError ? '#ff4d4f' : '#b5b5b5ff',
                  borderRadius: 8,
                }}>
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
                {actionError ? (
                  <Text color="#ff4d4f" fontSize="$sm" mt="$1">
                    Please Select an Action
                  </Text>
                ) : null}
              </Box>

                <Box>
              <Input style={{
                borderColor: countError ? '#ff4d4f' : '#b5b5b5ff',
                borderRadius: 8,
              }}>
                <InputField
                  placeholder="Number of Vials"
                  keyboardType="numeric"
                  value={count}
                  onChangeText={(text) => { setCount(text); if (countError) setCountError(false); }}
                  color="white"
                />
              </Input>
                            {countError ? (
                  <Text color="#ff4d4f" fontSize="$sm" mt="$1">
                    Please Enter a Valid Number of Vials
                  </Text>
                ) : null}
              </Box>

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
              <ButtonText color="#b5b5b5ff">Cancel</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default InventoryForm;
