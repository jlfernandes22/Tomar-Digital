import { useAppTheme } from '@/context/ThemeContext';
import React from 'react';
import {
  View,
  Image,
  ViewStyle,
  StyleProp,
  DimensionValue,
  ImageSourcePropType,
} from 'react-native';
import {
  TouchableRipple,
  Text,
  ActivityIndicator,
  Icon,
} from 'react-native-paper';

/**
 * Defines the props for the CustomButton component.
 * Provides flexibility to override theme colors, add icons, and control loading states.
 */
interface CustomButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
  buttonColor?: string;
  textColor?: string;
  icon?: string | ImageSourcePropType; // Supports both MaterialCommunityIcons strings and local image assets
  labelStyle?: any;
  accessibilityRole?: any;
  accessibilityLabel?: any;
  accessibilityHint?: string;
  numberOfLines?: number;
  width?: DimensionValue;
  height?: DimensionValue;
}

/**
 * CustomButton Component
 *
 * A versatile, theme-aware button component wrapping React Native Paper's TouchableRipple.
 * It automatically handles loading states (displaying an ActivityIndicator),
 * disables interaction when loading or explicitly disabled, and supports both
 * icon font strings and image assets.
 */
const CustomButton = ({
  children,
  onPress,
  className,
  style,
  loading = false,
  disabled = false,
  buttonColor,
  textColor,
  icon,
  labelStyle,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  numberOfLines,
  width,
  height,
}: CustomButtonProps) => {
  // --- Hooks ---
  const { currentTheme: theme } = useAppTheme();

  // --- Derived Values ---
  // Fallback to theme primary/background colors if custom colors aren't provided
  const bgColor = buttonColor || theme.colors.primary;
  const txtColor = textColor || theme.colors.background;

  // The button should be disabled if it's explicitly disabled OR currently in a loading state
  const isDisabled = disabled || loading;

  // --- Render ---
  return (
    <View
      className={className || ''}
      style={[
        {
          backgroundColor: bgColor,
          borderRadius: theme.roundness,
          overflow: 'hidden', // Ensures the ripple effect respects the border radius
          opacity: isDisabled ? 0.5 : 1, // Visual feedback for disabled state
        },
        style, // Apply custom styles passed via props (allows overriding margins, width, etc.)
      ]}
    >
      <TouchableRipple
        accessible={true}
        onPress={isDisabled ? undefined : onPress}
        rippleColor="rgba(150, 150, 150, 0.3)"
        accessibilityRole={accessibilityRole || 'button'}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        disabled={isDisabled}
        style={{
          minWidth: 44, // Minimum touch target size for accessibility
          minHeight: 44,
          paddingVertical: 12,
          paddingHorizontal: 24,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          width: width,
          height: height,
          borderRadius: theme.roundness,
        }}
      >
        <>
          {/* Loading Indicator: Shows spinner and hides icon while loading */}
          {loading && (
            <ActivityIndicator
              animating={true}
              color={txtColor}
              size={20}
              style={{ marginRight: 8 }}
            />
          )}

          {/* Icon: Renders either a font icon or an image asset if provided and not loading */}
          {!loading && icon && (
            <View style={{ marginRight: 8 }}>
              {typeof icon === 'string' ? (
                <Icon source={icon} size={22} color={txtColor} />
              ) : (
                <Image
                  source={icon}
                  style={{ width: 22, height: 22, tintColor: txtColor }}
                  resizeMode="contain"
                />
              )}
            </View>
          )}

          {/* Button Label */}
          <Text
            style={[
              {
                color: txtColor,
                fontSize: 16,
                fontWeight: 'bold',
                letterSpacing: 0.5,

                textAlign: 'center',
              },
              labelStyle, // Allows overriding typography if needed
            ]}
            numberOfLines={numberOfLines}
          >
            {children}
          </Text>
        </>
      </TouchableRipple>
    </View>
  );
};

export default CustomButton;
