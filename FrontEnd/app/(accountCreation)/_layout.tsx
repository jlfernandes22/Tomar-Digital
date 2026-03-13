import { images } from "@/constants/images";
import { Tabs } from "expo-router";
import React from "react";
import TabIcon from '@/app/components/Tabicon';
import { useAuth } from "@/context/AuthContext";
import { BottomNavigation, useTheme } from 'react-native-paper';
import { CommonActions } from '@react-navigation/native';

const _layout = () => {
  const { user } = useAuth();
  const theme = useTheme();

  return (
    <Tabs
      tabBar={({ navigation, state, descriptors, insets }) => {
        
        // FILTRO MANUAL POR ROLE
        const visibleRoutes = state.routes

        // 2. Como removemos rotas, recalculamos qual é o índice da aba ativa
        const activeRoute = state.routes[state.index];
        const activeIndex = visibleRoutes.findIndex(r => r.key === activeRoute.key);

        return (
          <BottomNavigation.Bar
            navigationState={{ 
              index: activeIndex >= 0 ? activeIndex : 0, 
              routes: visibleRoutes 
            }}
            
            

            safeAreaInsets={insets}
            
            style={{ 
              backgroundColor: theme.colors.elevation.level2,
              height: 80
            }} 
            
            activeColor="#FF6600" 
            inactiveColor={theme.colors.onSurfaceVariant}

            activeIndicatorStyle={{ 
              backgroundColor: 'rgba(255, 102, 0, 0.2)', 
              width: 64,         
              height: 44,        
              borderRadius: 22,  
            }}
            
            labeled={false} 
            
            onTabPress={({ route, preventDefault }) => {
              const event = navigation.emit({
                type: 'tabPress',
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
              if (options.tabBarIcon) {
                return options.tabBarIcon({ focused, color, size: 10 }); //embora focused e size estejam não estão a ser usadas
              }
              return null;
            }}
          />
        );
      }}
      screenOptions={{
        headerShown: false,
      }}
    >
      
      <Tabs.Screen 
        name="register" 
        options={{ 
          tabBarIcon: ({ color }) => 
          <TabIcon 
            icon={images.registerImg} 
            color={color}
            /> }} />
      
      
      <Tabs.Screen  
        name="login" 
        options={{ tabBarIcon: ({ color }) => 
          <TabIcon 
            icon={images.loginImg} 
            color={color}
            /> }} />


    </Tabs>
  );
};

export default _layout;