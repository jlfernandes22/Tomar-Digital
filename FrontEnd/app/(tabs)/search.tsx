import React, { useState, useCallback } from "react";
import {ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchBar } from "react-native-screens";
import { API_URL } from '@/constants/api';
import BusinessList from "../components/businessList";
import { useFocusEffect } from 'expo-router';


const Search = () => {

  //criar estado para guardar a lista de negócios
  const [listaNegocios, setListaNegocios] = useState('')
  const [loading, setLoading] = useState(false)

  //carrega a lista do servidor
  const handleNegocios = async () => {

    setLoading(true)
    try{

      const response = await fetch(`${API_URL}/negocios`)

      const dados = await response.json()

      console.log(dados)

      setListaNegocios(dados)

    }catch{
      console.log("Não foi possível obter a lista de negócios")
    }finally{
      setLoading(false)
    }

  }
  
   useFocusEffect(
          useCallback(() =>{
  
              handleNegocios()
  
          },[])
      )


  return (
    <SafeAreaView>
      <View>
        <SearchBar placeholder="Procurar"  ></SearchBar>
      </View>

      <View>
      {loading? (<ActivityIndicator 
        size="large" color="red"  />
    
    ):(<FlatList
      
        data={listaNegocios}
        keyExtractor={(item: any) => item._id}
        
        renderItem={({item}) => (

            <BusinessList
              name= {item.name}
              category={item.category}
              location={item.location}
          />
          
          )} 
    
          ListEmptyComponent={() => (
            <Text>Nenhum negócio ainda adicionado</Text>
          )} 
    />
    )}
  </View>
     


      {/*Chamar componente de negócio (que ira fazer parte de uma lista)*/}

      


    </SafeAreaView>
  );
};

export default Search;
