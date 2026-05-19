import React from "react";
import { View, Image } from "react-native";
import {
  TouchableRipple,
  Text,
  ActivityIndicator,
  useTheme,
  Icon,
} from "react-native-paper";

interface PrimaryButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  buttonColor?: string;
  textColor?: string;
  icon?: any;
  labelStyle?: any;
  accessibilityRole?: any;
  accessibilityLabel?: any;
}

const CustomButton = ({
  children,
  onPress,
  className,
  loading,
  disabled,
  buttonColor,
  textColor,
  icon,
  labelStyle,
  accessibilityRole,
  accessibilityLabel,
}: PrimaryButtonProps) => {
  const theme = useTheme();

  // Cores ligadas ao Theme atual
  const bgColor = buttonColor ? buttonColor : theme.colors.primary;
  const txtColor = textColor ? textColor : theme.colors.onPrimary;

  const isDisabled = disabled || loading;

  return (
    <View
      className={className || ""}
      style={{
        backgroundColor: bgColor,
        borderRadius: 9999,
        overflow: "hidden",
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      <TouchableRipple
        onPress={isDisabled ? undefined : onPress}
        rippleColor="rgba(150, 150, 150, 0.3)"
        accessibilityRole={accessibilityRole || "button"}
        accessibilityLabel={accessibilityLabel}
        disabled={isDisabled}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 24,
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
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
              {typeof icon === "string" ? (
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
                fontWeight: "bold",
                letterSpacing: 0.5,
              },
              labelStyle,
            ]}
            numberOfLines={1}
          >
            {children}
          </Text>
        </>
      </TouchableRipple>
    </View>
  );
};

export default CustomButton;
