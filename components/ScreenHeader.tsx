import React, { useState } from 'react';
import {
  Box,
  Text,
  Icon,
  Button,
  ButtonIcon,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@gluestack-ui/themed';
import { CircleHelp, X } from 'lucide-react-native';

/**
 * ScreenHeader
 * --------------
 * Displays a screen title with an optional help icon that opens
 * a modal containing contextual information.
 *
 * - Title text shown at the top of each screen
 * - Info icon (question mark) opens a modal with help text
 * - Modal can be dismissed via the 'X' button or by tapping outside
 */

interface ScreenHeaderProps {
  title: string;
  infoText?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  infoText,
}) => {
  // Local state for controlling info modal visibility
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      {/* Header section with title and help icon */}
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

        {/* Help button opens modal */}
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

      {/* Divider line under header */}
      <Box mt="$1" height={1} width="100%" bg="#FFFFFF" mb="$5" opacity={0.3} />

      {/* Info modal */}
      <Modal isOpen={showInfo} onClose={() => setShowInfo(false)}>
        <ModalBackdrop />
        <ModalContent bg="#282828">
          <ModalHeader>
            {/* Modal title */}
            <Text color="white" fontSize="$xl" fontWeight="$bold">
              {title} — Info
            </Text>

            {/* Close button */}
            <ModalCloseButton
              position="absolute"
              top="$3"
              right="$3"
              onPress={() => setShowInfo(false)}
            >
              <Icon as={X} color="white" size="xl" />
            </ModalCloseButton>
          </ModalHeader>

          {/* Modal body content */}
          <ModalBody>
            <Text color="white" fontSize="$md">
              {infoText ??
                'This screen provides information related to the refrigerator system. You can view data, interact with components, or perform actions as needed.'}
            </Text>

            <Text color="white" fontSize="$sm" mt="$3" fontStyle="italic">
              Tap the 'X' or anywhere outside of this popup to dismiss.
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ScreenHeader;
