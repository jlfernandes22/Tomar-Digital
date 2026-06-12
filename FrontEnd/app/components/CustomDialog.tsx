import { useAppTheme } from '@/context/ThemeContext';
import React from 'react';
import { Portal, Dialog } from 'react-native-paper';
import CustomButton from './CustomButton';

interface CustomDialogProps {
  children: React.ReactNode;
  visible: boolean;
  title: string;
  onDismiss: () => void;
  onPress?: () => void;
  buttonText?: string;
  buttonColor?: string;
  textColor?: string;
  icon?: string;
  accessibilityRole?: any;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const CustomDialog = ({
  children,
  visible,
  title,
  onDismiss,
  onPress,
  buttonText = 'OK',
  buttonColor,
  textColor,
  icon,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
}: CustomDialogProps) => {
  const { currentTheme: theme } = useAppTheme();

  const bgColor = buttonColor ? buttonColor : theme.colors.primary;
  const txtColor = textColor ? textColor : theme.colors.background;

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ backgroundColor: theme.colors.surfaceContainer }}
      >
        {icon && <Dialog.Icon icon={icon} />}

        <Dialog.Title>{title}</Dialog.Title>

        <Dialog.Content>{children}</Dialog.Content>

        <Dialog.Actions>
          <CustomButton
            onPress={onPress ? onPress : onDismiss}
            buttonColor={bgColor}
            textColor={txtColor}
            accessibilityRole={accessibilityRole}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
          >
            {buttonText}
          </CustomButton>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default CustomDialog;
