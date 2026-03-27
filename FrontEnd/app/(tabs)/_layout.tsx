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
        /* 1. FILTRAGEM HÍBRIDA: 
          Combina a limpeza de rotas ocultas do ecrã de login 
          com as regras de negócio de acessos da aplicação principal.
        */
        const visibleRoutes = state.routes.filter((route) => {
          const options = descriptors[route.key].options as any;

          // Se a rota está marcada como oculta ou não tem ícone, é filtrada
          if (!options.tabBarIcon || options.href === null) return false;

          // Regras de acesso restrito baseadas no Role do utilizador
          if (route.name === "CamaraIndex" && user?.role !== "camara")
            return false;
          if (route.name === "DashboardTab" && user?.role !== "camara")
            return false;
          if (route.name === "AddBusiness" && user?.role !== "comerciante")
            return false;
          if (route.name === "ScanScreen") return false;
          if (route.name === "EditProfile") return false;
          if (route.name === "CreateCampaign" && user?.role !== "camara")
            return false;

          return true;
        });

        const activeRoute = state.routes[state.index];
        const activeIndex = visibleRoutes.findIndex(
          (r) => r.key === activeRoute.key,
        );

        return (
          <BottomNavigation.Bar
            navigationState={{
              index: activeIndex === -1 ? 0 : activeIndex,
              /* Passagem direta do array visibleRoutes sem fazer .map() 
                Isto preserva a integridade da rota para o React Native Paper
              */
              routes: visibleRoutes,
            }}
            safeAreaInsets={insets}
            style={{
              backgroundColor: theme.colors.elevation.level2,
              height: 80, // Altura estática e segura proveniente do layout funcional
            }}
            /* Aplicação direta das cores dinâmicas do Design System */
            activeColor={"white"}
            inactiveColor={theme.colors.onSurfaceVariant}
            activeIndicatorStyle={{
              backgroundColor: theme.colors.primaryContainer,
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
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.homeImg} color={color} />
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
        name="CamaraIndex"
        options={{
          href: user?.role === "camara" ? "/CamaraIndex" : null,
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.camaraImg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="AddBusiness"
        options={{
          href: user?.role === "comerciante" ? "/AddBusiness" : null,
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.addImg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ScanScreen"
        options={{
          href: user?.role === "cidadao" ? "/ScanScreen" : null,
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.qrCodeImg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="CreateCampaign"
        options={{
          href: user?.role === "camara" ? "/CreateCampaign" : null,
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.camaraImg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="DashboardTab"
        options={{
          href: user?.role === "camara" ? "/DashboardTab" : null,
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
      <Tabs.Screen name="EditProfile" options={{ href: null }} />
    </Tabs>
  );
};

export default _layout;
