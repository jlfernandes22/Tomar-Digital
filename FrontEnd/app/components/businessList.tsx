import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const negocioLista = ({name, category, location }: any) => {
  
  //é preciso depois com as coordendas dizer por exemplo a rua
  
  
  
    return (
    <View>
      <Text>Nome: {name}</Text>
      <Text>Categoria: {category}</Text>
      <Text>Localização: </Text>
    </View>
  )
}

export default negocioLista

const styles = StyleSheet.create({})