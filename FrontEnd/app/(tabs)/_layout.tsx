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
    // Esconder a label
    tabBarShowLabel: false, 
    
    tabBarStyle: {
      backgroundColor: "#AB8BFF",
      position: 'absolute', // Faz a barra flutuar
      left: 15,   // Margem da esquerda
      right: 15,  // Margem da direita
      height: 70, // Altura fixa para todos
      borderRadius: 15, // Arredondado mas não exagerado
      
      // Sombras para dar profundidade
      elevation: 5, 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      
      borderTopWidth: 0, // Remove a linha de topo
      paddingHorizontal: 5, // Respiro interno para os ícones não tocarem nas pontas
    },
    tabBarItemStyle: {
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    },
  }}
>
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,

          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={images.homeImg} title="" />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          headerShown: false,

          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={images.searchImg} title="" />
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
              title=""
              
            />
          ),
        }}
      />

         <Tabs.Screen
          name="store"
          options={{
            headerShown: false,
            // Se não for comerciante, href: null esconde a tab 
            href: user?.role === 'comerciante' ? '/store' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.storeImg} title=""  />
            ),
          }}
        />


        <Tabs.Screen
          name="camara"
          options={{
            headerShown: false,
            href: user?.role === 'camara' ? '/camara' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.camaraImg} title=""  />
            ),
          }}
        />

         <Tabs.Screen
          name="add"
          options={{
            headerShown: false,
            href: user?.role === 'comerciante' ? '/add' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.addImg} title=""  />
            ),
          }}
        />

        <Tabs.Screen
          name="purchase"
          options={{
            headerShown: false,
            href: user?.role === 'comerciante' ? '/purchase' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.compraImg} title=""  />
            ),
          }}
        />

         <Tabs.Screen
          name="qrcode"
          options={{
            headerShown: false,
            href: user?.role === 'cidadao' ? '/qrcode' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.qrCodeImg} title=""  />
            ),
          }}
        />

        <Tabs.Screen
          name="dashboardTab"
          options={{
            headerShown: false,
            href: user?.role === 'camara' ? '/dashboardTab' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.statsImg} title="" />
            )
          }}
        />


      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,

          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={images.profileImg}
              title=""
              
            />
          ),
        }}
      />  
    </Tabs>
  );
};

export default _layout;
