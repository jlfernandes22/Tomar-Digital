import { images } from "@/constants/images";
import { Tabs } from "expo-router";
import React from "react";
import TabIcon from '@/app/components/Tabicon'



const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: {
          paddingBottom: 5,
          borderColor: "#ff0000",
          backgroundColor: "#AB8BFF",
          borderRadius: 75,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,

          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={images.homeImg} title="Home" />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,

          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={images.searchImg} title="Search" />
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          headerShown: false,

          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={images.bookmarkImg}
              title="Saved"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,

          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={images.profileImg}
              title="Profile"
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;
