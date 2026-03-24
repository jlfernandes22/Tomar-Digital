
import { images } from "@/constants/images";
import { Tabs } from "expo-router";
import React from "react";
import TabIcon from "@/app/components/Tabicon";
import { useAuth } from "@/context/AuthContext";
import { BottomNavigation, useTheme } from "react-native-paper";
import { CommonActions } from "@react-navigation/native";
import { Platform, View } from "react-native";

const _layout = () => {
  const { user } = useAuth();
  const theme = useTheme();

  return (
    <Tabs
      tabBar={({ navigation, state, descriptors, insets }) => {
        // 1. FILTRAGEM TOTAL (Whitelist + Roles)
        const visibleRoutes = state.routes.filter((route) => {
          const options = descriptors[route.key].options as any;
          
          // Se não tem ícone ou é oculto, tchau.
          if (!options.tabBarIcon || options.href === null) return false;

          // Regras de Negócio
          if (route.name === "CamaraIndex" && user?.role !== "camara") return false;
          if (route.name === "DashboardTab" && user?.role !== "camara") return false;
          if (route.name === "AddBusiness" && user?.role !== "comerciante") return false;
          if (route.name === "ScanScreen" && user?.role !== "cidadao") return false;
          if (route.name === "EditProfile") return false;

          return true;
        });

        // 2. Localizar índice ativo
        const activeRoute = state.routes[state.index];
        const activeIndex = visibleRoutes.findIndex((r) => r.key === activeRoute.key);

        return (
          <BottomNavigation.Bar
            navigationState={{
              index: activeIndex >= 0 ? activeIndex : 0,
              // Adicionamos 'name' aqui para o TS não reclamar no onTabPress
              routes: visibleRoutes.map((r) => ({
                key: r.key,
                title: (descriptors[r.key].options.tabBarLabel as string) || r.name,
                focusedIcon: r.name,
                name: r.name, 
              })),
            }}
            safeAreaInsets={insets}
            style={{
              backgroundColor: theme.colors.elevation.level2,
              height: Platform.OS === "ios" ? 85 : 75,
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

              if (!event.defaultPrevented) {
                navigation.dispatch({
                  // Agora 'route.name' existe no objeto mapeado!
                  ...CommonActions.navigate(route.name, (route as any).params),
                  target: state.key,
                });
              }
            }}
            renderIcon={({ route, focused, color }) => {
              // Buscamos o ícone no descritor original pela KEY
              const descriptor = descriptors[route.key];
              if (descriptor?.options.tabBarIcon) {
                return (
                  <View style={{ width: 30, alignItems: 'center', justifyContent: 'center' }}>
                    {descriptor.options.tabBarIcon({ focused, color, size: 24 })}
                  </View>
                );
              }
              return null;
            }}
          />
        );
      }}
      screenOptions={{ headerShown: false }}
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