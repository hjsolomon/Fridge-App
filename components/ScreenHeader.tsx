/**
 * ScreenHeader
 * =============
 * Reusable header component for screens with optional info popup.
 *
 * Features:
 * - Responsive typography scaling
 * - Title text with info icon button
 * - Decorative divider line
 * - Modal popup for detailed information
 * - Safe area considerations for screen layout
 */

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
import { Dimensions, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

/* -------------------------------------------------------------------------- */
/*                             Type Definitions                               */
/* -------------------------------------------------------------------------- */

interface ScreenHeaderProps {
  title: string;              // Main heading text
  infoText?: string;          // Optional detailed info shown in modal
}

/* -------------------------------------------------------------------------- */
/*                             Component Definition                            */
/* -------------------------------------------------------------------------- */

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  infoText,
}) => {
  /* -------------------------------------------------------------------- */
  /*                        State Management                               */
  /* -------------------------------------------------------------------- */

  // Controls visibility of info modal
  const [showInfo, setShowInfo] = useState(false);

  /* -------------------------------------------------------------------- */
  /*                        Responsive Sizing                              */
  /* -------------------------------------------------------------------- */

  const { width, height } = Dimensions.get('window');

  // Header typography sizing
  const titleFontSize = Math.max(20, Math.round(height * 0.035));
  const headerMarginT = Math.round(height * 0.015);  // Top margin
  const headerMarginB = Math.round(height * 0.008);  // Bottom margin

  // Divider sizing
  const dividerMarginBottom = Math.round(height * 0.02);

  // Modal sizing and typography
  const modalWidth = width * 0.88;
  const modalTitleFontSize = Math.max(18, Math.round(height * 0.03));
  const modalBodyFontSize = Math.max(14, Math.round(height * 0.02));
  const modalSmallFontSize = Math.max(11, Math.round(height * 0.014));

  /* -------------------------------------------------------------------- */
  /*                              UI Rendering                             */
  /* -------------------------------------------------------------------- */

  return (
    <>
      {/* Header Section: Title + Info Button */}
      <Box
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        mt={headerMarginT}
        mb={headerMarginB}
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

        {/* Info button opens modal */}
        <Button
          size="sm"
          variant="link"
          onPress={() => setShowInfo(true)}
          pr="$2"
        >
          <ButtonIcon as={CircleHelp} color="white" size='2xl' />
        </Button>
      </Box>

      {/* Visual Divider */}
      <View style={{ width: '100%', height: 1, marginTop: 4, marginBottom: dividerMarginBottom }}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </View>

      {/* Info Modal: Shows detailed description */}
      <Modal isOpen={showInfo} onClose={() => setShowInfo(false)}>
        <ModalBackdrop />

        <ModalContent
          bg="#282828"
          style={{
            width: modalWidth,
            alignSelf: 'center',
          }}
        >
          {/* Modal Header with Title and Close Button */}
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

            {/* Close button (X icon) */}
            <ModalCloseButton
              position="absolute"
              top="$3"
              right="$3"
              onPress={() => setShowInfo(false)}
            >
              <Icon as={X} color="white" size='xl' />
            </ModalCloseButton>
          </ModalHeader>

          {/* Modal Body: Information Text */}
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

            {/* Dismissal hint text */}
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
};;

export default ScreenHeader;
