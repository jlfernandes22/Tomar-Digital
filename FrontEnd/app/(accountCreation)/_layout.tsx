import { StyleSheet } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { images } from "@/constants/images";
import TabIcon from '@/app/components/Tabicon'


const _layout = () => {
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
    }}>

      

      <Tabs.Screen
      
      name='register'

      options={{

        title:"Registar",
        headerShown: false,

        tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={images.registerImg}
              title="Criar Conta"
            />
          ),

      }}
      
      />

      <Tabs.Screen
      
      name='login'
      options={{
        title: "Iniciar Sessão",
        headerShown: false,

        tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={images.loginImg}
              title="Iniciar Sessão"
            />
          ),

      }}
      />

    </Tabs>


  )
}

export default _layout

const styles = StyleSheet.create({})