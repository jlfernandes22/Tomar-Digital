import { useAppTheme } from '@/context/ThemeContext';
import React from 'react';
import { Portal, Dialog } from 'react-native-paper';
import CustomButton from './CustomButton';

/**
 * Defines the props for the CustomDialog component.
 * Allows customization of the action button and accessibility properties.
 */
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

/**
 * CustomDialog Component
 *
 * A theme-aware wrapper around React Native Paper's Dialog component.
 * Used for displaying alerts, confirmations, or simple information modals.
 * It automatically handles theming and provides a standardized action button.
 */
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
  // --- Hooks ---
  // Access the current theme to ensure the dialog adapts to Light/Dark mode automatically
  const { currentTheme: theme } = useAppTheme();

  // --- Derived Values ---
  // Fallback to theme primary/background colors if custom colors aren't provided
  const bgColor = buttonColor || theme.colors.primary;
  const txtColor = textColor || theme.colors.background;

  // --- Render ---
  return (
    // Portal is required by React Native Paper to render the dialog outside the current
    // view hierarchy, ensuring it overlays the entire screen correctly.
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
            // If a specific onPress handler is provided, use it.
            // Otherwise, default to dismissing the dialog.
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
