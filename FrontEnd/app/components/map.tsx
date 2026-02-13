import { Dimensions, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import MapView, { Marker } from 'react-native-maps'
import { useAuth } from '@/context/AuthContext';

const Map = () => {

    const { user } = useAuth(); // Importa o utilizador da sessão atual
      const { width } = Dimensions.get('window');
      const [name, setName] = useState("");
      const [userName, setUserName] = useState("");
      const [category, setCategory] = useState("");
      const [loading, setLoading] = useState(false);
      const [selectedLocation, setSelectedLocation] = useState({
        latitude: 39.6036, 
        longitude: -8.4151,
      });


  return (
    <View style={{ height: 350, width: width - 40, alignSelf: 'center', borderRadius: 20, overflow: 'hidden', backgroundColor: '#e5e5e5' }}>
            <MapView
                style={{ flex: 1 }}
                initialRegion={{
                latitude: 39.6036,
                longitude: -8.4151,
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