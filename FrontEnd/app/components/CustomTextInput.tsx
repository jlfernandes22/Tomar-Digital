import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, KeyboardTypeOptions, AccessibilityRole } from 'react-native';
import {
  Button,
  Dialog,
  HelperText,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';

// Contexts & Utils
import { useAppTheme } from '@/context/ThemeContext';
import {
  hasInvisibleChars,
  isValidNIF,
  isValidText,
  stripInvisibleChars,
} from '@/utils/textValidation';

/**
 * Defines the props for the CustomTextInput component.
 * Provides configuration for standard inputs, validation, and security.
 */
interface CustomTextInputProps {
  label: string;
  value: string;
  multiline?: boolean;
  numberOfLines?: number;
  className?: string;
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  isEmail?: boolean;
  isNumber?: boolean;
  isNIF?: boolean;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  lenght?: number; // Note: Kept original spelling to maintain compatibility with callers
  required?: boolean;
  // --- Accessibility props ---
  // Passed through to the underlying TextInput so screen readers can announce
  // a meaningful label and hint for each field.
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
}

/**
 * CustomTextInput Component
 *
 * A robust, theme-aware text input wrapper for React Native Paper.
 * It automatically handles:
 * - Password visibility toggling.
 * - Required field validation (including invisible character spoofing checks).
 * - Dynamic keyboard types based on input type (email, number, NIF).
 * - Character limits (overriding to 9 for Portuguese NIFs).
 */
const CustomTextInput = ({
  label,
  value,
  multiline,
  numberOfLines,
  className,
  onChangeText,
  isPassword,
  placeholder,
  isEmail,
  isNumber,
  isNIF,
  lenght,
  required,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
}: CustomTextInputProps) => {
  // --- Hooks ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();

  // State to control the warning dialog when invisible characters are detected
  const [dialogVisible, setDialogVisible] = useState(false);

  // State to toggle password visibility. Initialized based on the `isPassword` prop.
  const [isSecureEntry, setIsSecureEntry] = useState(isPassword || false);

  // --- Derived Values ---
  // Portuguese NIFs are always exactly 9 digits, so we enforce it regardless of the `lenght` prop
  const currentMaxLength = isNIF ? 9 : lenght;

  // Determine the appropriate keyboard type for the device
  const keyboardType: KeyboardTypeOptions = isEmail
    ? 'email-address'
    : isNumber || isNIF
      ? 'numeric'
      : 'default';

  // If the field is required, append a red asterisk to the label
  const LabelElement = (
    <Text>
      {label}
      {required && <Text style={{ color: theme.colors.error }}> *</Text>}
    </Text>
  );

  // A required field is considered to have an error if it's empty or contains only invisible chars
  const hasRequiredError = required ? !isValidText(value) : false;

  // NIF format validation: only validates when the field has input.
  // An empty NIF is valid (the field is optional) — we only flag errors
  // when the user has typed something that doesn't pass the checksum.
  const hasNIFError = isNIF && value.length > 0 ? !isValidNIF(value) : false;

  const hasError = hasRequiredError || hasNIFError;

  // --- Handlers ---

  /**
   * Intercepts text changes to sanitize input.
   * If invisible characters (often used in copy/paste spoofing) are detected,
   * it triggers a warning dialog and strips them before updating the parent state.
   */
  const handleChangeText = (text: string) => {
    if (hasInvisibleChars(text)) {
      setDialogVisible(true);
    }
    const cleanedText = stripInvisibleChars(text);
    onChangeText(cleanedText);
  };

  // --- Render ---
  return (
    <View
      className={`${className || ''}`}
      style={{ borderRadius: theme.roundness }}
    >
      <TextInput
        multiline={multiline}
        numberOfLines={numberOfLines}
        mode="outlined"
        label={required ? LabelElement : label}
        value={value}
        placeholder={placeholder}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={multiline ? { minHeight: 300, height: 'auto' } : {}}
        onChangeText={handleChangeText}
        secureTextEntry={isSecureEntry}
        autoCapitalize={isEmail || isPassword ? 'none' : 'sentences'}
        keyboardType={keyboardType}
        maxLength={currentMaxLength}
        error={hasError}
        // --- Accessibility ---
        // If no explicit label is provided, fall back to the visible label prop
        // so screen readers always have something to announce.
        accessible={true}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole}
        // Mark the input as a header for required fields so screen readers
        // can navigate quickly between form fields.
        textContentType={
          isEmail ? 'emailAddress' : isPassword ? 'password' : 'none'
        }
        // Conditionally render the "eye" icon to toggle password visibility
        right={
          isPassword ? (
            <TextInput.Icon
              icon={isSecureEntry ? 'eye-closed' : 'eye'}
              onPress={() => setIsSecureEntry(!isSecureEntry)}
              accessibilityLabel={
                isSecureEntry
                  ? t('accessibility.show_password', {
                      defaultValue: 'Mostrar palavra-passe',
                    })
                  : t('accessibility.hide_password', {
                      defaultValue: 'Ocultar palavra-passe',
                    })
              }
            />
          ) : null
        }
      />

      {/* Validation Error Text */}
      {hasRequiredError && (
        <HelperText type="error" visible={hasRequiredError}>
          {t('common.obrigatorio')}
        </HelperText>
      )}

      {/* NIF format error — shown only when the user has typed an invalid NIF */}
      {hasNIFError && (
        <HelperText type="error" visible={hasNIFError}>
          {t('validation.nif_invalid', {
            defaultValue: 'NIF inválido. Verifique os 9 dígitos.',
          })}
        </HelperText>
      )}

      {/* Invisible Character Warning Dialog */}
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.error }}>
            {t('common.error_alert', { defaultValue: 'Erro' })}
          </Dialog.Title>
          <Dialog.Content>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface }}
            >
              {t('validation.invisible_chars_removed', {
                defaultValue:
                  'Foram detetados e removidos caracteres invisíveis do texto.',
              })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDialogVisible(false)}
              textColor={theme.colors.primary}
            >
              {t('common.ok', { defaultValue: 'OK' })}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default CustomTextInput;
