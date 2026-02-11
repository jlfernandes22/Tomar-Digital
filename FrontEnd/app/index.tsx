import { Redirect, router } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from "react-native";


const Index = () => {

  useEffect(() => {

    verifyLogin();
    
  }, []);

  const verifyLogin = async () => {

    try{

      //verificar se existe token guardado
      const token = await AsyncStorage.getItem('userToken')
    
      if(token){
        router.replace('/(tabs)/home')
      }else{
        router.replace('/(accountCreation)/login')
      }
    
    }catch{
      console.log("Erro rederecionado para pagina de criação de conta")  
      router.replace('/(accountCreation)/login')

    }


  }

  return (

    <View className="flex-1 justify-center items-center">
   
    </View>

  );


};

export default Index;