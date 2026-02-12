import { images } from "@/constants/images";
import { Tabs } from "expo-router";
import React from "react";
import TabIcon from '@/app/components/Tabicon'
import { useAuth } from "@/context/AuthContext";
import { Dimensions, Platform } from 'react-native';



const _layout = () => {
  const { user } = useAuth();
  const { width } = Dimensions.get('window');
  return (
    <Tabs
  screenOptions={{
    // Esconder a label
    tabBarShowLabel: false, 
    
    tabBarStyle: {
      backgroundColor: "#AB8BFF",
      position: 'absolute', // Faz a barra flutuar
      bottom: 15, // Espaço do fundo do telemóvel
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
          name="store"
          options={{
            title: "Store",
            headerShown: false,
            // Se não for comerciante, href: null esconde a tab 
            href: user?.role === 'comerciante' ? '/store' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.storeImg} title="Store" />
            ),
          }}
        />


        <Tabs.Screen
          name="camara"
          options={{
            title: "Camara",
            headerShown: false,
            href: user?.role === 'camara' ? '/camara' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.camaraImg} title="Camara" />
            ),
          }}
        />

         <Tabs.Screen
          name="add"
          options={{
            title: "Adicionar",
            headerShown: false,
            href: user?.role === 'comerciante' ? '/add' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.addImg} title="Adicionar" />
            ),
          }}
        />

        <Tabs.Screen
          name="purchase"
          options={{
            title: "Purchase Code",
            headerShown: false,
            href: user?.role === 'comerciante' ? '/purchase' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.compraImg} title="Purchase Code" />
            ),
          }}
        />

         <Tabs.Screen
          name="qrcode"
          options={{
            title: "QR Code",
            headerShown: false,
            href: user?.role === 'cidadao' ? '/qrcode' : null, 
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={images.qrCodeImg} title="QR Code" />
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
