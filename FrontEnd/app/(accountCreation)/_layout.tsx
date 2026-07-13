/**
 * Account Creation Layout
 *
 * Defines the tab-based navigation for the authentication flow (Login, Register, Validate).
 * It utilizes a custom bottom navigation bar from React Native Paper to maintain
 * visual consistency with the rest of the application's theme.
 */
import { images } from '@/constants/images';
import { Tabs } from 'expo-router';
import React from 'react';
import TabIcon from '@/app/components/Tabicon';
import { useAuth } from '@/context/AuthContext';
import { BottomNavigation } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { CommonActions } from '@react-navigation/native';
import { Platform } from 'react-native';
import RecoverPassword from './RecoverPassword';

const _layout = () => {
  const { user } = useAuth();
  const { currentTheme: theme } = useAppTheme();

  return (
    <Tabs
      // We override the default tab bar to use React Native Paper's BottomNavigation.
      // This gives us full control over styling, safe area insets, and route visibility.
      tabBar={({ navigation, state, descriptors, insets }) => {
        const currentRoute = state.routes[state.index];

        // Hide the bottom tab bar entirely when the user is on the email validation screen.
        // This prevents them from navigating away until validation is complete.
        if (currentRoute.name === 'Validate') {
          return null;
        }
        if (currentRoute.name === 'NewPassword') {
          return null;
        }
        if (currentRoute.name === 'RecoverPassword') {
          return null;
        }

        // Filter out routes that should not appear in the bottom bar.
        // A route is hidden if it explicitly sets `href: null` or if it lacks a tab icon.
        const visibleRoutes = state.routes.filter(route => {
          if (
            route.name === 'Validate' ||
            route.name === 'NewPassword' ||
            route.name === 'RecoverPassword'
          )
            return false;
          const options = descriptors[route.key].options as any;
          const isHidden = options.href === null;
          const hasIcon = options.tabBarIcon !== undefined;
          return !isHidden && hasIcon;
        });

        const activeRoute = state.routes[state.index];

        // Map the actual active route index to the filtered array.
        // This ensures the correct tab is highlighted in the BottomNavigation.Bar.
        const activeIndex = visibleRoutes.findIndex(
          r => r.key === activeRoute.key,
        );

        return (
          <BottomNavigation.Bar
            navigationState={{
              index: activeIndex === -1 ? 0 : activeIndex,
              routes: visibleRoutes,
            }}
            safeAreaInsets={insets}
            style={{
              backgroundColor: theme.colors.surfaceContainer,
              // Platform-specific adjustment: On iOS, we manually adjust the height
              // to account for the bottom safe area inset (home indicator).
              // On Android, we let the default behavior handle it.
              ...Platform.select({
                ios: {
                  height: 60 + insets.bottom,
                  paddingBottom: insets.bottom,
                },
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
            labeled={false} // Hides text labels, showing only icons
            onTabPress={({ route, preventDefault }) => {
              // Standard React Navigation logic to emit the tab press event.
              // This allows other navigation interceptors to prevent the default
              // navigation action if needed (e.g., if a form is dirty).
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (event.defaultPrevented) {
                preventDefault();
              } else {
                // Dispatch the navigation action to switch tabs
                navigation.dispatch({
                  ...CommonActions.navigate(route.name, route.params),
                  target: state.key,
                });
              }
            }}
            renderIcon={({ focused, route, color }) => {
              const { options } = descriptors[route.key];
              return options.tabBarIcon
                ? options.tabBarIcon({ focused, color, size: 10 })
                : null;
            }}
          />
        );
      }}
      screenOptions={{
        headerShown: false, // Hide the top header for a cleaner full-screen auth experience
      }}
    >
      <Tabs.Screen
        name="Register"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.registerImg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Login"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.loginImg} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Validate"
        options={{
          // `href: null` removes this route from the tab bar entirely,
          // making it only accessible via programmatic navigation (e.g., after registering).
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="NewPassword"
        options={{
          // `href: null` removes this route from the tab bar entirely,
          // making it only accessible via programmatic navigation (e.g., after registering).
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="RecoverPassword"
        options={{
          // `href: null` removes this route from the tab bar entirely,
          // making it only accessible via programmatic navigation (e.g., after registering).
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
};

export default _layout;
