import React from 'react';
import { Portal, Snackbar, Text } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';

/**
 * Defines the props for the CustomSnackBar component.
 */
interface CustomSnackBarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}

/**
 * CustomSnackBar Component
 *
 * A semantic feedback component that displays a temporary message at the bottom of the screen.
 * It automatically styles itself based on the content of the message (Error, Warning, or Success)
 * to provide immediate visual context to the user.
 */
const CustomSnackBar = ({
  visible,
  message,
  onDismiss,
}: CustomSnackBarProps) => {
  // --- Hooks ---
  const { currentTheme: theme } = useAppTheme();

  // --- Derived State ---
  // Determine the semantic type of the message by checking for specific keywords.
  // This drives the background color of the snackbar.
  const isError = message.includes('Erro') || message.includes('Error');
  const isAviso = message.includes('Aviso') || message.includes('Warning');

  // --- Derived Styling ---
  // Determine the background color based on the semantic type.
  // Errors and Successes use universal static colors for immediate recognition,
  // while Warnings fall back to the app's dynamic theme color.
  const backgroundColor = isError
    ? '#DC2626' // Static Red for errors
    : isAviso
      ? theme.colors.primaryContainer // Theme-aware color for warnings
      : '#16A34A'; // Static Green for success

  // --- Render ---
  return (
    // Portal ensures the Snackbar renders at the root level of the app,
    // preventing it from being clipped or hidden by parent view hierarchies.
    <Portal>
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={3000}
        style={{
          backgroundColor,
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 20, // Provides a safe margin from the bottom edge/device gesture bar
          zIndex: 9999,
          elevation: 9999, // Ensures it renders above other elements on Android
        }}
        action={{
          label: 'OK',
          textColor: '#ffffff',
          onPress: onDismiss, // Reuses the dismiss handler for the action button
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '500', color: 'white' }}>
          {message}
        </Text>
      </Snackbar>
    </Portal>
  );
};

export default CustomSnackBar;
