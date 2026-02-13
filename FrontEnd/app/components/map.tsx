import { Dimensions, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import MapView, { Marker } from 'react-native-maps'

const Map = ({location}:any) => {

    const { width } = Dimensions.get('window');
    const [selectedLocation, setSelectedLocation] = useState({
      latitude: location?.lat || 39.6035,
      longitude: location?.long || -8.4154
    });

    //console.log(selectedLocation.latitude)
    //console.log(selectedLocation.longitude)

  return (
    <View style={{ height: 350, width: width - 40, alignSelf: 'center', borderRadius: 20, overflow: 'hidden', backgroundColor: '#e5e5e5' }}>
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
                <Marker coordinate={selectedLocation} />
            </MapView>
        </View>
  )
}

export default Map

const styles = StyleSheet.create({})