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
  /**
   * When true, renders the Dialog WITHOUT a Portal wrapper.
   *
   * Use this when the dialog needs to appear INSIDE a React Native <Modal>.
   * Paper's <Portal> renders at the root level of the app, which is BELOW
   * React Native's <Modal> in the native view hierarchy. This means a
   * Portal-based dialog would be hidden behind the modal overlay and
   * invisible to the user.
   *
   * When `inModal` is true, the <Dialog> is rendered directly (without the
   * <Portal> wrapper), making it part of the modal's own view hierarchy so
   * it appears on top of the modal content — exactly where the user expects
   * to see it.
   *
   * When `inModal` is false (default), the <Dialog> is wrapped in <Portal>
   * as normal, which is required by Paper for dialogs on regular screens
   * (not inside a Modal) to ensure proper overlay rendering.
   *
   * @default false
   */
  inModal?: boolean;
}

/**
 * CustomDialog Component
 *
 * A theme-aware wrapper around React Native Paper's Dialog component.
 * Used for displaying alerts, confirmations, or simple information modals.
 * It automatically handles theming and provides a standardized action button.
 *
 * The `inModal` prop controls whether the dialog is wrapped in a <Portal>:
 *   - `inModal={false}` (default): Uses <Portal> — for dialogs on regular screens.
 *   - `inModal={true}`: Skips <Portal> — for dialogs rendered inside a <Modal>.
 *
 * This is necessary because React Native's <Modal> creates a separate native
 * view hierarchy that sits above Paper's <Portal> host. A Portal-based dialog
 * rendered inside a <Modal> would be invisible to the user.
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
  inModal = false,
}: CustomDialogProps) => {
  // --- Hooks ---
  // Access the current theme to ensure the dialog adapts to Light/Dark mode automatically
  const { currentTheme: theme } = useAppTheme();

  // --- Derived Values ---
  // Fallback to theme primary/background colors if custom colors aren't provided
  const bgColor = buttonColor || theme.colors.primary;
  const txtColor = textColor || theme.colors.background;

  // --- Render ---
  // Build the Dialog element once. Whether it's wrapped in <Portal> depends
  // on the `inModal` prop (see the JSDoc above for the full explanation).
  const dialog = (
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
  );

  // When inside a React Native <Modal>, render WITHOUT <Portal>.
  // Paper's <Portal> renders at the root level, which is BELOW the <Modal>
  // in the native view hierarchy — so a Portal-based dialog would be hidden
  // behind the modal overlay and invisible to the user.
  //
  // When on a regular screen (no Modal parent), wrap in <Portal> as normal.
  // <Portal> is required by Paper to render the dialog outside the current
  // view hierarchy, ensuring it overlays the entire screen correctly.
  if (inModal) {
    return dialog;
  }

  return <Portal>{dialog}</Portal>;
};

export default CustomDialog;
