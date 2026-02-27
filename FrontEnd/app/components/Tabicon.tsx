import { Text, View, Image } from "react-native";
import React from 'react'


const TabIcon = ({ focused, icon, title }: any) => {
  if (focused) {
    return (
      <View className="flex flex-row mt-2 min-w-[40px] min-h-[40px] bg-tabColor rounded-2xl justify-center items-center">
        <Image className="size-7" source={icon} />


        <View>
          <Text className="text-s ml-2" >{title}</Text>
        </View> 

      </View>
            
    );
  }
  return (
    <View className="size-full justify-center items-center mt-4 rounded-full ">
      <Image className="size-6" source={icon} />
    </View>
  );
};


export default TabIcon