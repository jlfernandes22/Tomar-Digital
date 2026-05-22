import React from 'react'
import { View } from 'react-native'
import { useTheme, Text } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'


const Preferences = () => {
    

    const theme = useTheme()


  return (
    <SafeAreaView style={{backgroundColor: theme.colors.background }}>
        
        
      <View >
        <Text>Preferências</Text>
      </View>
      

    </SafeAreaView>
  )
}

export default Preferences

