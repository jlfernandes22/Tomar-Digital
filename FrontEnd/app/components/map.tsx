import { Dimensions, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import MapView, { Marker } from 'react-native-maps'


const Map = ({showPin}:{ showPin: boolean}) => {

    const [selectedLocation, setSelectedLocation] = useState({
      latitude:  39.6035,
      longitude:  -8.4154
    });

    //console.log(selectedLocation.latitude)
    //console.log(selectedLocation.longitude)

  return (
    <View className='h-full w-full align-middle rounded-lg overflow-hidden bg-primary '>
            <MapView
                style={{ flex: 1 }}
                initialRegion={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
                }}
                onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
            >
               
                {showPin && ( <Marker coordinate={selectedLocation} /> )}
                
            </MapView>
        </View>
  )
}

export default Map

const styles = StyleSheet.create({})