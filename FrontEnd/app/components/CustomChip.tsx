import React from 'react';
import { View } from 'react-native';
import { Chip } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';

/**
 * Defines the props for the CustomChip component.
 * Designed to act as a selectable filter or toggle button.
 */
interface CustomChipProps {
  children: React.ReactNode;
  isSelected: boolean;
  onPress: () => void;
  className?: string;
  icon?: string;
  disabled?: boolean;
}

/**
 * CustomChip Component
 *
 * A theme-aware wrapper around React Native Paper's Chip component.
 * It is styled as a pill-shaped toggle button. The visual state (background, border,
 * and text colors) changes dynamically based on whether the chip is selected.
 */
const CustomChip = ({
  children,
  isSelected,
  onPress,
  className,
  icon,
  disabled = false,
}: CustomChipProps) => {
  // --- Hooks ---
  // Access the current theme to ensure colors adapt to Light/Dark mode automatically
  const { currentTheme: theme } = useAppTheme();

  // --- Render ---
  return (
    <View className={className}>
      <Chip
        mode="outlined"
        selected={isSelected}
        onPress={onPress}
        icon={icon}
        disabled={disabled} // Fixed: Passed the disabled prop to the underlying component
        showSelectedCheck={false} // Hides the default checkmark icon when selected
        style={{
          minHeight: 44, // Ensures the touch target meets accessibility guidelines
          minWidth: 44,
          // Dynamic background: Uses primaryContainer when active, background when inactive
          backgroundColor: isSelected
            ? theme.colors.primaryContainer
            : theme.colors.background,
          // Dynamic border: Changes color to indicate the selected state
          borderColor: isSelected
            ? theme.colors.onSurfaceVariant
            : theme.colors.outline,
          borderRadius: 9999, // Creates a fully rounded "pill" shape
          height: 40,
          justifyContent: 'center',
        }}
        textStyle={{
          // Dynamic text color: Contrasts with the background based on selection state
          color: isSelected
            ? theme.colors.onPrimaryContainer
            : theme.colors.onSurface,
          fontWeight: isSelected ? 'bold' : '500',
          fontSize: 14,
          marginVertical: 0,
          paddingHorizontal: 4,
          paddingVertical: 11,
        }}
      >
        {children}
      </Chip>
    </View>
  );
};

export default CustomChip;
