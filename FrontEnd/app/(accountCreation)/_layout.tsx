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
        backgroundColor: "#FCFAF9",
        borderTopColor: "#D2B5A3",
        borderRadius: 75,
        shadowOpacity: 0.1,
        shadowColor: "#000",
        shadowRadius: 4,
      }
    }}>

      

      <Tabs.Screen
        name='register'
        options={{
        headerShown: false,
        tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={images.registerImg}
              

            />
          ),

      }}
      
      />

      <Tabs.Screen
      
      name='login'
      options={{
        headerShown: false,

        tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={images.loginImg}
            />
          ),

      }}
      />

    </Tabs>


  )
}

export default _layout

const styles = StyleSheet.create({})