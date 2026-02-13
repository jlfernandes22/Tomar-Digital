import { images } from "@/constants/images";
import { Tabs } from "expo-router";
import React from "react";
import TabIcon from '@/app/components/Tabicon'
import { useAuth } from "@/context/AuthContext";
import { Dimensions, Platform } from 'react-native';



const _layout = () => {
  const {user} = useAuth();
  const { width } = Dimensions.get('window');
  return (
    <Tabs
  screenOptions={{
      tabBarShowLabel: false,
      tabBarItemStyle:{
        height: "100%",
        justifyContent: "center",
        alignItems: "center"
      },
      tabBarStyle:{
        borderColor: "#ff0000",
        backgroundColor: "#AB8BFF",
        borderRadius: 75,
      }
  }}
>
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              icon={images.homeImg}  />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              icon={images.searchImg}  />
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={images.bookmarkImg}
            />
          ),
        }}
      />

         <Tabs.Screen
          name="store"
          options={{
            headerShown: false,
            href: user?.role === 'comerciante' ? '/store' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon 
                focused={focused}  
                icon={images.storeImg}   />
            ),
          }}
        />


        <Tabs.Screen
          name="camara"
          options={{
            headerShown: false,
            href: user?.role === 'camara' ? '/camara' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon 
                focused={focused} 
                icon={images.camaraImg}   />
            ),
          }}
        />

         <Tabs.Screen
          name="add"
          options={{
            headerShown: false,
            href: user?.role === 'comerciante' ? '/add' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon 
                focused={focused} 
                icon={images.addImg}   />
            ),
          }}
        />

        <Tabs.Screen
          name="purchase"
          options={{
            headerShown: false,
            href: user?.role === 'comerciante' ? '/purchase' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon 
                focused={focused} 
                icon={images.compraImg}   />
            ),
          }}
        />

         <Tabs.Screen
          name="qrcode"
          options={{
            headerShown: false,
 
            href: user?.role === 'cidadao' ? '/qrcode' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.qrCodeImg}   />
            ),
          }}
        />

        <Tabs.Screen
          name="dashboardTab"
          options={{
            headerShown: false,
 
            href: user?.role === 'camara' ? '/dashboardTab' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.statsImg}  />
            )
          }}
        />


      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={images.profileImg}
              
              
            />
          ),
        }}
      />  
    </Tabs>
  );
};

export default _layout;
