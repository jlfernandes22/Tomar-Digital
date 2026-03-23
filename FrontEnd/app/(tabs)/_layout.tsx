import { images } from "@/constants/images";
import { Tabs } from "expo-router";
import React from "react";
import TabIcon from "@/app/components/Tabicon";
import { useAuth } from "@/context/AuthContext";
import { BottomNavigation, useTheme } from "react-native-paper";
import { CommonActions } from "@react-navigation/native";
import { Platform } from "react-native";

const _layout = () => {
  const { user } = useAuth();
  const theme = useTheme();

  return (
    <Tabs
      tabBar={({ navigation, state, descriptors, insets }) => {
        // FILTRO MANUAL POR ROLE
        const visibleRoutes = state.routes.filter((route) => {
          // Esconde a rota de edição de perfil sempre
          if (route.name === "EditProfile") return false;

          // Esconde abas da câmara se não for câmara
          if (route.name === "CamaraIndex" && user?.role !== "camara")
            return false;
          if (route.name === "DashboardTab" && user?.role !== "camara")
            return false;

          // Esconde aba de adicionar se não for comerciante
          if (route.name === "AddBusiness" && user?.role !== "comerciante")
            return false;

          // Esconde aba de qrcode se não for cidadão
          if (route.name === "ScanScreen") return false;

          //esconder criar campanha se não for camara
          if (route.name === "CreateCampaign" && user?.role !== "camara")
            return false;

          // Se passou por todas as regras acima, a aba deve aparecer! (home, search, etc)
          return true;
        });

        // 2. Como removemos rotas, recalculamos qual é o índice da aba ativa
        const activeRoute = state.routes[state.index];
        const activeIndex = visibleRoutes.findIndex(
          (r) => r.key === activeRoute.key,
        );

        return (
          <BottomNavigation.Bar
            navigationState={{
              index: activeIndex >= 0 ? activeIndex : 0,
              routes: visibleRoutes,
            }}
            safeAreaInsets={insets}
            style={{
              backgroundColor: theme.colors.elevation.level2,
              height: Platform.OS === "ios" ? 80 : 70,
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
        name="Home"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.homeImg} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Search"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon icon={images.searchImg} color={color} />
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
