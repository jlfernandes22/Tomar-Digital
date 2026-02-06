import { Text, View, Image } from "react-native";
import React from 'react'


const TabIcon = ({ focused, icon, title }: any) => {
  if (focused) {
    return (
      <View className="flex flex-row min-w-[100px] h-auto bg-accent rounded-full justify-center items-center mt-3">
        <Image className="size-6" source={icon} />

        <Text className="text-s ml-2" >{title}</Text>
      </View>
    );
  }
  return (
    <View className="size-full justify-center items-center mt-4 rounded-full">
      <Image className="size-6" source={icon} />
    </View>
  );
};


export default TabIcon