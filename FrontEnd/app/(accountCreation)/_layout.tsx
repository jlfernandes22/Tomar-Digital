import { images } from "@/constants/images";
import { Tabs, useSegments } from "expo-router";
import React from "react";
import TabIcon from "@/app/components/Tabicon";
import { useAuth } from "@/context/AuthContext";
import { BottomNavigation } from "react-native-paper";
import { useAppTheme } from "@/context/ThemeContext";
import { CommonActions } from "@react-navigation/native";
import { Platform } from "react-native";
import { usePathname } from 'expo-router';

const _layout = () => {
  const { user } = useAuth();
  const { currentTheme: theme } = useAppTheme();
  const pathname = usePathname();
  const isValidationPage = pathname.includes('Validar');
  
  return (
    <Tabs
      tabBar={isValidationPage ? () => null : ({ navigation, state, descriptors, insets }) => {
        const visibleRoutes = state.routes.filter((route) => {
          if (route.name === 'Validar') return false;
          const options = descriptors[route.key].options as any;
          const isHidden = options.href === null;
          const hasIcon = options.tabBarIcon !== undefined;
          return !isHidden && hasIcon;
        });

        const activeRoute = state.routes[state.index];
        const activeIndex = visibleRoutes.findIndex((r) => r.key === activeRoute.key);

        return (
          <BottomNavigation.Bar
            navigationState={{ index: activeIndex === -1 ? 0 : activeIndex, routes: visibleRoutes }}
            safeAreaInsets={insets}
            style={{
              backgroundColor: theme.colors.surfaceContainer,
              ...Platform.select({
                ios: { height: 60 + insets.bottom, paddingBottom: insets.bottom },
                android: {},
              }),
            }}
            activeColor={theme.colors.onPrimary}
            inactiveColor={theme.colors.onSurfaceVariant}
            activeIndicatorStyle={{
              backgroundColor: theme.colors.primary,
              width: 64,
              height: 44,
              borderRadius: theme.roundness,
            }}
            labeled={false}
            onTabPress={({ route, preventDefault }) => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (event.defaultPrevented) {
                preventDefault();
              } else {
                navigation.dispatch({
                  ...CommonActions.navigate(route.name, route.params),
                  target: state.key,
                });
              }
            }}
            renderIcon={({ focused, route, color }) => {
              const { options } = descriptors[route.key];
              return options.tabBarIcon ? options.tabBarIcon({ focused, color, size: 10 }) : null;
            }}
          />
        );
      }}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="Register"
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon={images.registerImg} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Login"
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon={images.loginImg} color={color} />,
        }}
      />
    </Tabs>
  );
};
export default _layout;
