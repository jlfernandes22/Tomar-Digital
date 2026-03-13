import { SafeAreaView } from "react-native-safe-area-context";
import Map from "../components/Map"
import { Surface } from "react-native-paper";
import { View } from "react-native";

export default function Index() {

  return (
    <Surface style={{flex: 1}}>
      <View style={{flex: 1}}>
        <Map showPin={false} />
      </View>
    </Surface>
  )
  
}
