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
import { Dimensions } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  infoText?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  infoText,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  const { width, height } = Dimensions.get('window');


  const titleFontSize = Math.max(20, Math.round(height * 0.035));
  const headerMarginY = Math.round(height * 0.008);
  const dividerMarginBottom = Math.round(height * 0.02);

  const modalWidth = width * 0.88;
  const modalTitleFontSize = Math.max(18, Math.round(height * 0.03));
  const modalBodyFontSize = Math.max(14, Math.round(height * 0.02));
  const modalSmallFontSize = Math.max(11, Math.round(height * 0.014));

  return (
    <>
      {/* Header Section */}
      <Box
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        my={headerMarginY}
      >
        <Text
          color="white"
          style={{
            fontSize: titleFontSize,
            fontWeight: '400',
          }}
        >
          {title}
        </Text>

        <Button
          size="sm"
          variant="link"
          onPress={() => setShowInfo(true)}
          pr="$2"
        >
          <ButtonIcon as={CircleHelp} color="white" size='2xl' />
        </Button>
      </Box>

      {/* Divider */}
      <Box
        mt="$1"
        height={1}
        width="100%"
        bg="#FFFFFF"
        opacity={0.3}
        mb={dividerMarginBottom}
      />

      {/* Modal */}
      <Modal isOpen={showInfo} onClose={() => setShowInfo(false)}>
        <ModalBackdrop />

        <ModalContent
          bg="#282828"
          style={{
            width: modalWidth,
            alignSelf: 'center',
          }}
        >
          <ModalHeader>
            <Text
              color="white"
              style={{
                fontSize: modalTitleFontSize,
                fontWeight: '700',
              }}
            >
              {title} — Info
            </Text>

            <ModalCloseButton
              position="absolute"
              top="$3"
              right="$3"
              onPress={() => setShowInfo(false)}
            >
              <Icon as={X} color="white" size='xl' />
            </ModalCloseButton>
          </ModalHeader>

          <ModalBody>
            <Text
              color="white"
              style={{
                fontSize: modalBodyFontSize,
                lineHeight: modalBodyFontSize * 1.2,
              }}
            >
              {infoText ??
                'This screen provides information related to the refrigerator system.'}
            </Text>

            <Text
              color="white"
              style={{
                fontSize: modalSmallFontSize,
                marginTop: modalSmallFontSize * 0.6,
                fontStyle: 'italic',
              }}
            >
              Tap the 'X' or anywhere outside of this popup to dismiss.
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ScreenHeader;
