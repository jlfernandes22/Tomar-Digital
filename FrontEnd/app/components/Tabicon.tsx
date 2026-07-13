import React from 'react';
import { View, Image, ImageSourcePropType, ColorValue } from 'react-native';

/**
 * Defines the props for the TabIcon component.
 * Uses specific React Native types for better type safety and developer experience.
 */
interface TabIconProps {
  icon: ImageSourcePropType;
  color: ColorValue;
}

/**
 * TabIcon Component
 *
 * A simple presentational component used to render icons within the bottom navigation bar.
 * It applies a dynamic `tintColor` so the icon changes color based on whether the tab
 * is active or inactive, matching the state managed by the parent navigation component.
 */
const TabIcon = ({ icon, color }: TabIconProps) => {
  return (
    <View>
      <Image
        className="size-6" // NativeWind utility for width: 24, height: 24
        style={{ tintColor: color }} // Dynamically colors the image asset
        resizeMode="contain"
        source={icon}
      />
    </View>
  );
};

export default TabIcon;
