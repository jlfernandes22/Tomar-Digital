/**
 * Main App Tab Layout
 *
 * Defines the primary tab-based navigation for the authenticated part of the app.
 * It uses a custom React Native Paper BottomNavigation bar to maintain visual
 * consistency with the rest of the UI and handles dynamic, role-based route visibility.
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

const _layout = () => {
  // Access the current user's role to determine which tabs they are allowed to see.
  const { user } = useAuth();
  const { currentTheme: theme } = useAppTheme();

  return (
    <Tabs
      // We override the default tab bar to use Paper's BottomNavigation.
      // This gives us full control over styling, safe area insets, and route filtering.
      tabBar={({ navigation, state, descriptors, insets }) => {
        // 1. HYBRID FILTERING:
        // We filter the navigation state to dynamically show or hide tabs.
        // This combines standard Expo Router hiding (href: null) with business logic
        // based on the user's role ('camara', 'comerciante', 'cidadao').
        const visibleRoutes = state.routes.filter(route => {
          const options = descriptors[route.key].options as any;

          // Hide routes explicitly marked as hidden or those lacking an icon.
          if (!options.tabBarIcon || options.href === null) return false;

          // Role-Based Access Control (RBAC) for specific tabs.
          // Only show management tabs to the 'camara' role.
          if (route.name === 'MunicipalIndex' && user?.role !== 'camara')
            return false;
          if (route.name === 'DashboardTab' && user?.role !== 'camara')
            return false;
          if (route.name === 'CampaignCreate' && user?.role !== 'camara')
            return false;

          // Only show merchant-specific tabs to the 'comerciante' role.
          if (route.name === 'BusinessAdd' && user?.role !== 'comerciante')
            return false;
          if (route.name === 'BusinessMine' && user?.role !== 'comerciante')
            return false;
          if (route.name === 'CampaignJoin' && user?.role !== 'comerciante')
            return false;

          return true;
        });

        // Determine the index of the currently active route within our filtered array.
        // This ensures the Paper BottomNavigation highlights the correct tab.
        const activeRoute = state.routes[state.index];
        const activeIndex = visibleRoutes.findIndex(
          r => r.key === activeRoute.key,
        );

        return (
          <BottomNavigation.Bar
            navigationState={{
              index: activeIndex === -1 ? 0 : activeIndex,
              // Pass the filtered routes directly. Avoid mapping here to preserve
              // the internal route object structure expected by React Navigation.
              routes: visibleRoutes,
            }}
            safeAreaInsets={insets}
            style={{
              backgroundColor: theme.colors.inverseOnSurface,
              // Platform-specific adjustment:
              // On iOS, we manually adjust the height to account for the bottom
              // safe area inset (home indicator). On Android, we let the default
              // Paper component behavior handle the spacing.
              ...Platform.select({
                ios: {
                  height: 60 + insets.bottom,
                  paddingBottom: insets.bottom,
                },
                android: {},
              }),
            }}
            // Apply dynamic theme colors for active and inactive states.
            activeColor={theme.colors.onPrimary}
            inactiveColor={theme.colors.onSurfaceVariant}
            activeIndicatorStyle={{
              backgroundColor: theme.colors.primary,
              width: 64,
              minWidth: 64,
              maxWidth: 64,
              height: 44,
              borderRadius: theme.roundness,
              alignSelf: 'center',
            }}
            labeled={false} // Hides text labels, showing only icons for a cleaner UI
            onTabPress={({ route, preventDefault }) => {
              // Standard React Navigation logic to emit the tab press event.
              // This allows other navigation interceptors to prevent the default
              // navigation action if needed (e.g., if a form has unsaved changes).
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (event.defaultPrevented) {
                preventDefault();
              } else {
                // Dispatch the navigation action to switch tabs.
                navigation.dispatch({
                  ...CommonActions.navigate(route.name, (route as any).params),
                  target: state.key,
                });
              }
            }}
            renderIcon={({ focused, route, color }) => {
              const { options } = descriptors[route.key];
              if (options.tabBarIcon) {
                return options.tabBarIcon({ focused, color, size: 24 });
              }
              return null;
            }}
          />
        );
      }}
      screenOptions={{
        headerShown: false, // Hide the top header for a cleaner full-screen experience
      }}
    >
      {/* 
        Tab Definitions 
        Each Tabs.Screen defines a route. The options.tabBarIcon is required 
        for the route to appear in our custom filtered BottomNavigation.
      */}
      <Tabs.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.mapImg} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Saved"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.bookmarkImg} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="MunicipalIndex"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.camaraImg} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="BusinessMine"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.bagImg} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="BusinessAdd"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.addImg} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="CampaignJoin"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.campaignImg} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="CampaignCreate"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.campaignImg} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="DashboardTab"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.statsImg} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.profileImg} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;
