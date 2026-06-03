import React from "react";
import { View, Image, ViewStyle, StyleProp } from "react-native";
import {
  TouchableRipple,
  Text,
  ActivityIndicator,
  Icon,
} from 'react-native-paper';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>; 
  loading?: boolean;
  disabled?: boolean;
  buttonColor?: string;
  textColor?: string;
  icon?: any;
  labelStyle?: any;
  accessibilityRole?: any;
  accessibilityLabel?: any;
  numberOfLines?: number;
  width?: any;
  height?: any;
}

const CustomButton = ({
  children,
  onPress,
  className,
  loading,
  disabled,
  style,
  buttonColor,
  textColor,
  icon,
  labelStyle,
  accessibilityRole,
  accessibilityLabel,
  numberOfLines,
  width,
  height,
}: PrimaryButtonProps) => {
  const { currentTheme: theme } = useAppTheme();

  // Cores ligadas ao Theme atual
  const bgColor = buttonColor ? buttonColor : theme.colors.primary;
  const txtColor = textColor ? textColor : theme.colors.background;

  const isDisabled = disabled || loading;

  return (
    <View
      className={className || ''}
      style={{
        backgroundColor: bgColor,
        borderRadius: theme.roundness,
        overflow: "hidden",
        opacity: isDisabled ? 0.5 : 1,
      }}
    >
      <TouchableRipple
        onPress={isDisabled ? undefined : onPress}
        rippleColor="rgba(150, 150, 150, 0.3)"
        accessibilityRole={accessibilityRole || 'button'}
        accessibilityLabel={accessibilityLabel}
        disabled={isDisabled}
        style={{
          minWidth: 44,
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
          {loading && (
            <ActivityIndicator
              animating={true}
              color={txtColor}
              size={20}
              style={{ marginRight: 8 }}
            />
          )}

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

          <Text
            style={[
              {
                color: txtColor,
                fontSize: 16,
                fontWeight: 'bold',
                letterSpacing: 0.5,
              },
              labelStyle,
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
