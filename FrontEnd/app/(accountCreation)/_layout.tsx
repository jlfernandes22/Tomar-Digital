import { images } from "@/constants/images";
import { Tabs } from "expo-router";
import React from "react";
import TabIcon from "@/app/components/Tabicon";
import { useAuth } from "@/context/AuthContext";
import { BottomNavigation, useTheme } from "react-native-paper";
import { CommonActions } from "@react-navigation/native";

const _layout = () => {
  const { user } = useAuth();
  const theme = useTheme();

  return (
    <Tabs
      tabBar={({ navigation, state, descriptors, insets }) => {
        // FILTRO REFORÇADO: 
        // 1. Remove rotas que o Expo Router esconde (href: null)
        // 2. Remove rotas que não têm ícone definido (os "fantasmas")
        // 3. Remove rotas internas como o próprio "_layout" ou "index"
        const visibleRoutes = state.routes.filter((route) => {
          const options = descriptors[route.key].options as any;
          const isHidden = options.href === null;
          const hasIcon = options.tabBarIcon !== undefined;
          
          // Só mostra se NÃO for escondido E tiver um ícone definido
          return !isHidden && hasIcon;
        });

        // Localiza qual das rotas VISÍVEIS corresponde à rota ATUAL do sistema
        const activeRoute = state.routes[state.index];
        const activeIndex = visibleRoutes.findIndex(
          (r) => r.key === activeRoute.key
        );

        return (
          <BottomNavigation.Bar
            navigationState={{
              index: activeIndex === -1 ? 0 : activeIndex,
              routes: visibleRoutes,
            }}
            safeAreaInsets={insets}
            style={{
              backgroundColor: theme.colors.elevation.level2,
              height: 80,
            }}
            activeColor="#FF6600"
            inactiveColor={theme.colors.onSurfaceVariant}
            activeIndicatorStyle={{
              backgroundColor: "rgba(255, 102, 0, 0.2)",
              width: 64,
              height: 44,
              borderRadius: 22,
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
    </Tabs>
  );
};

export default _layout;
