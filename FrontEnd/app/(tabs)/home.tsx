import { SafeAreaView } from "react-native-safe-area-context";
import Map from "../components/map"

export default function Index() {

  return (

    <SafeAreaView className="flex-1 justify-center items-center">
      <Map showPin={false} />
    </SafeAreaView>

  )
  
}
