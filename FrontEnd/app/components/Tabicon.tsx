import { View, Image } from "react-native";
import React from 'react'



const TabIcon = ({ icon,color }: any) => {
 
    return (
      <View >
        <Image 
          className="size-6"
          style={{ tintColor: color }} 
          resizeMode="contain" 
          source={icon} />
      </View>
    )     
  
};


export default TabIcon