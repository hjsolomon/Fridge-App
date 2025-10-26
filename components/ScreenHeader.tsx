import React, { useState } from 'react';
import { Box, Text, Icon, Button, ButtonIcon, Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from '@gluestack-ui/themed';
import { CircleHelp } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  infoText?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, infoText }) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <Box
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        my="$2"
      >
        <Text fontWeight="$normal" color="white" fontSize="$4xl">
          {title}
        </Text>

        <Button
          size="sm"
          variant="link"
          onPress={() => setShowInfo(true)}
          accessibilityLabel="Help"
          pr="$2"
        >
          <ButtonIcon as={CircleHelp} color="white" size="2xl" />
        </Button>
      </Box>

      <Box mt="$1" height={1} width="100%" bg="#FFFFFF" mb="$5"opacity={0.3} />

      <Modal isOpen={showInfo} onClose={() => setShowInfo(false)}>
        <ModalBackdrop />
        <ModalContent bg="#282828">
          <ModalHeader>
            <Text color="white" fontSize="$xl" fontWeight="$bold">
              {title} — Info
            </Text>
            <ModalCloseButton />
          </ModalHeader>

          <ModalBody>
            <Text color="white" fontSize="$md">
              {infoText ??
                'This screen provides information related to the refrigerator system. You can view data, interact with components, or perform actions as needed.'}
            </Text>

            <Text color="white" fontSize="$sm" mt="$3" fontStyle="italic">
              Tap anywhere outside of this popup to dismiss.
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
